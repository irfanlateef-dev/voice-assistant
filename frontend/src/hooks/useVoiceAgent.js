import { useCallback, useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';

import { API_BASE } from '../config/api.js';

// After the user stops speaking, the agent may need time to run tools + LLM
// before TTS starts — 8s was far too short and showed a false "Reconnect".
const STALL_TIMEOUT_MS = 90_000;
const THINKING_STALL_TIMEOUT_MS = 120_000;

function attachRemoteAudio(track, participant) {
  if (track.kind !== Track.Kind.Audio || participant.isLocal) return;
  const element = track.attach();
  element.dataset.participant = participant.identity;
  document.body.appendChild(element);
}

function detachRemoteAudio(track) {
  track.detach().forEach((element) => element.remove());
}

function attachExistingRemoteAudio(room) {
  room.remoteParticipants.forEach((participant) => {
    participant.trackPublications.forEach((publication) => {
      if (publication.track) {
        attachRemoteAudio(publication.track, participant);
      }
    });
  });
}

function applyTranscriptionSegments(prev, segments, role) {
  if (!segments?.length) return prev;

  const next = [...prev];
  for (const segment of segments) {
    const text = segment.text?.trim();
    if (!text) continue;

    const entry = {
      id: segment.id,
      role,
      text,
      interim: !segment.final,
    };

    const existingIdx = next.findIndex((msg) => msg.id === segment.id);
    if (existingIdx >= 0) {
      next[existingIdx] = entry;
      continue;
    }

    if (!segment.final) {
      const interimIdx = next.findLastIndex((msg) => msg.role === role && msg.interim);
      if (interimIdx >= 0) {
        next[interimIdx] = entry;
        continue;
      }
    }

    next.push(entry);
  }

  return next;
}

export function useVoiceAgent(getToken, { onAction } = {}) {
  const [greeting, setGreeting] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isInterrupted, setIsInterrupted] = useState(false);
  const [isStalled, setIsStalled] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [inputSampleRate, setInputSampleRate] = useState(48000);

  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;
  const roomRef = useRef(null);
  const wasAgentSpeakingRef = useRef(false);
  const isAgentSpeakingRef = useRef(false);
  const isUserSpeakingRef = useRef(false);
  const interruptedTimerRef = useRef(null);
  const stallTimerRef = useRef(null);
  const isThinkingRef = useRef(false);

  const scheduleStallCheck = useCallback(() => {
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
    }
    const delay = isThinkingRef.current ? THINKING_STALL_TIMEOUT_MS : STALL_TIMEOUT_MS;
    stallTimerRef.current = setTimeout(() => {
      setIsStalled(true);
    }, delay);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/config`)
      .then((res) => res.json())
      .then((cfg) => {
        setGreeting(cfg?.agent?.greeting || 'Hello!');
        const rate = cfg?.audio?.input?.sample_rate;
        if (rate) setInputSampleRate(rate);
      })
      .catch(() => setGreeting('Hello!'));
  }, []);

  const clearStallTimer = useCallback(() => {
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
    setIsStalled(false);
  }, []);

  const flashInterrupted = useCallback(() => {
    setIsInterrupted(true);
    if (interruptedTimerRef.current) {
      clearTimeout(interruptedTimerRef.current);
    }
    interruptedTimerRef.current = setTimeout(() => {
      setIsInterrupted(false);
    }, 800);
  }, []);

  const disconnect = useCallback(async () => {
    clearStallTimer();
    setIsDisconnecting(true);
    try {
      const room = roomRef.current;
      if (room) {
        room.remoteParticipants.forEach((participant) => {
          participant.trackPublications.forEach((publication) => {
            if (publication.track) {
              detachRemoteAudio(publication.track);
            }
          });
        });
        await room.disconnect();
        roomRef.current = null;
      }
    } finally {
      setIsDisconnecting(false);
      setIsConnected(false);
      setIsAgentSpeaking(false);
      setIsUserSpeaking(false);
      setIsInterrupted(false);
      setIsStalled(false);
      setIsThinking(false);
      isThinkingRef.current = false;
      isAgentSpeakingRef.current = false;
      isUserSpeakingRef.current = false;
      wasAgentSpeakingRef.current = false;
      setTranscript([]);
    }
  }, [clearStallTimer]);

  const connect = useCallback(async () => {
    if (roomRef.current || isConnecting || !getToken) return;

    clearStallTimer();
    setIsConnecting(true);
    setTranscript([]);

    try {
      const authToken = await getToken();
      if (!authToken) {
        throw new Error('Failed to get auth token. Please sign in again.');
      }

      const tokenRes = await fetch(`${API_BASE}/api/token?room=main`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!tokenRes.ok) {
        throw new Error('Failed to get LiveKit token. Please sign in again.');
      }

      const { token } = await tokenRes.json();
      const livekitUrl = import.meta.env.VITE_LIVEKIT_URL;

      if (!livekitUrl) {
        throw new Error('LiveKit URL not configured. Set VITE_LIVEKIT_URL in frontend .env.');
      }

      const room = new Room({
        audioCaptureDefaults: {
          sampleRate: inputSampleRate,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        adaptiveStream: true,
        disconnectOnPageLeave: false,
      });
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
        attachRemoteAudio(track, participant);
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        detachRemoteAudio(track);
      });

      room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
        const localIdentity = room.localParticipant?.identity;
        const role = participant?.identity === localIdentity ? 'user' : 'assistant';

        setTranscript((prev) => applyTranscriptionSegments(prev, segments, role));

        for (const segment of segments) {
          if (!segment.text?.trim()) continue;

          if (role === 'user' && segment.final) {
            isThinkingRef.current = true;
            setIsThinking(true);
          }

          if (role === 'assistant') {
            isThinkingRef.current = false;
            setIsThinking(false);
          }
        }

        clearStallTimer();
      });

      room.on(RoomEvent.DataReceived, (payload) => {
        try {
          const text = new TextDecoder().decode(payload);
          const msg = JSON.parse(text);

          if (msg.type === 'action') {
            if (msg.action === 'tool_called') {
              isThinkingRef.current = true;
              setIsThinking(true);
              clearStallTimer();
            }
            onActionRef.current?.(msg);
          }
        } catch {
          // ignore malformed payloads
        }
      });

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const localIdentity = room.localParticipant?.identity;
        const agentSpeaking = speakers.some((p) => p.identity !== localIdentity);
        const userSpeaking = speakers.some((p) => p.identity === localIdentity);

        const prevUserSpeaking = isUserSpeakingRef.current;
        const prevAgentSpeaking = isAgentSpeakingRef.current;

        isAgentSpeakingRef.current = agentSpeaking;
        isUserSpeakingRef.current = userSpeaking;

        if (wasAgentSpeakingRef.current && !agentSpeaking && userSpeaking) {
          flashInterrupted();
        }
        wasAgentSpeakingRef.current = agentSpeaking;

        if (prevUserSpeaking && !userSpeaking && !agentSpeaking) {
          scheduleStallCheck();
        }

        if ((agentSpeaking && !prevAgentSpeaking) || (userSpeaking && !prevUserSpeaking)) {
          clearStallTimer();
          if (agentSpeaking) {
            isThinkingRef.current = false;
            setIsThinking(false);
          }
        }

        setIsAgentSpeaking(agentSpeaking);
        setIsUserSpeaking(userSpeaking);
      });

      room.on(RoomEvent.Disconnected, () => {
        clearStallTimer();
        setIsConnected(false);
        setIsAgentSpeaking(false);
        setIsUserSpeaking(false);
        setIsStalled(false);
        setIsThinking(false);
        isThinkingRef.current = false;
        isAgentSpeakingRef.current = false;
        isUserSpeakingRef.current = false;
        wasAgentSpeakingRef.current = false;
        roomRef.current = null;
      });

      await room.connect(livekitUrl, token);
      await room.startAudio();
      attachExistingRemoteAudio(room);
      await room.localParticipant.setMicrophoneEnabled(true);
      setIsConnected(true);
      setIsMuted(false);
    } finally {
      setIsConnecting(false);
    }
  }, [getToken, flashInterrupted, inputSampleRate, clearStallTimer, scheduleStallCheck, isConnecting]);

  // Disconnect then reconnect in one step — used by stall recovery UI
  const reconnect = useCallback(async () => {
    await disconnect();
    await connect();
  }, [disconnect, connect]);

  const toggleMute = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;

    const next = !isMuted;
    await room.localParticipant.setMicrophoneEnabled(!next);
    setIsMuted(next);
  }, [isMuted]);

  useEffect(() => {
    return () => {
      if (interruptedTimerRef.current) clearTimeout(interruptedTimerRef.current);
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
      disconnect();
    };
  }, [disconnect]);

  const status = !isConnected
    ? 'idle'
    : isStalled
      ? 'stalled'
      : isInterrupted
        ? 'interrupted'
        : isAgentSpeaking
          ? 'speaking'
          : isThinking
            ? 'thinking'
            : 'listening';

  return {
    connect,
    disconnect,
    reconnect,
    isConnected,
    isConnecting,
    isDisconnecting,
    isAgentSpeaking,
    isUserSpeaking,
    isInterrupted,
    isStalled,
    isThinking,
    status,
    transcript,
    isMuted,
    toggleMute,
    greeting,
  };
}
