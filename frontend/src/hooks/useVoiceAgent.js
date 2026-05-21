import { useCallback, useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';

import { API_BASE } from '../config/api.js';

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

async function releaseLocalMedia(room) {
  if (!room?.localParticipant) return;

  try {
    await room.localParticipant.setMicrophoneEnabled(false);
  } catch {
    // ignore — track may already be stopped
  }

  for (const publication of room.localParticipant.trackPublications.values()) {
    if (publication.track) {
      publication.track.stop();
    }
  }
}

function hasAgentParticipant(room) {
  if (!room) return false;
  const localIdentity = room.localParticipant?.identity;
  for (const participant of room.remoteParticipants.values()) {
    if (participant.identity !== localIdentity) {
      return true;
    }
  }
  return false;
}

export function useVoiceAgent(
  getToken,
  { onAction, sessionId, autoConnect = false, authReady = true } = {},
) {
  const [greeting, setGreeting] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isAgentReady, setIsAgentReady] = useState(false);
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
  const [connectError, setConnectError] = useState('');

  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  const roomRef = useRef(null);
  const connectingRef = useRef(false);
  const connectGenerationRef = useRef(0);
  const allowAutoConnectRef = useRef(autoConnect);
  const autoConnectStartedRef = useRef(false);
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

  const disconnect = useCallback(async ({ intentional = true } = {}) => {
    if (intentional) {
      allowAutoConnectRef.current = false;
    }

    connectGenerationRef.current += 1;
    clearStallTimer();
    setIsDisconnecting(true);
    setConnectError('');

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

        await releaseLocalMedia(room);
        await room.disconnect();
        roomRef.current = null;
      }
    } finally {
      connectingRef.current = false;
      setIsDisconnecting(false);
      setIsConnected(false);
      setIsAgentReady(false);
      setIsConnecting(false);
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
      setIsMuted(false);
    }
  }, [clearStallTimer]);

  const connect = useCallback(async () => {
    if (roomRef.current || connectingRef.current || !getToken) return;

    const generation = ++connectGenerationRef.current;
    connectingRef.current = true;
    clearStallTimer();
    setIsConnecting(true);
    setIsAgentReady(false);
    setConnectError('');
    setTranscript([]);

    let room;

    try {
      const authToken = await getToken();
      if (generation !== connectGenerationRef.current) return;

      if (!authToken) {
        throw new Error('Failed to get auth token. Please sign in again.');
      }

      const tokenRes = await fetch(
        `${API_BASE}/api/token?room=main${
          sessionIdRef.current
            ? `&sessionId=${encodeURIComponent(sessionIdRef.current)}`
            : ''
        }`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (!tokenRes.ok) {
        throw new Error('Failed to get LiveKit token. Please sign in again.');
      }

      if (generation !== connectGenerationRef.current) return;

      const { token } = await tokenRes.json();
      const livekitUrl = import.meta.env.VITE_LIVEKIT_URL;

      if (!livekitUrl) {
        throw new Error('LiveKit URL not configured. Set VITE_LIVEKIT_URL in frontend .env.');
      }

      room = new Room({
        audioCaptureDefaults: {
          sampleRate: inputSampleRate,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        adaptiveStream: true,
        disconnectOnPageLeave: true,
      });
      roomRef.current = room;

      const syncAgentReady = () => {
        if (generation !== connectGenerationRef.current) return;
        setIsAgentReady(hasAgentParticipant(room));
      };

      room.on(RoomEvent.ParticipantConnected, () => {
        syncAgentReady();
      });

      room.on(RoomEvent.ParticipantDisconnected, () => {
        syncAgentReady();
      });

      room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
        attachRemoteAudio(track, participant);
        syncAgentReady();
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
        connectingRef.current = false;
        setIsConnected(false);
        setIsAgentReady(false);
        setIsConnecting(false);
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
      if (generation !== connectGenerationRef.current) {
        await releaseLocalMedia(room);
        await room.disconnect();
        roomRef.current = null;
        return;
      }

      await room.startAudio();
      attachExistingRemoteAudio(room);
      await room.localParticipant.setMicrophoneEnabled(true);
      syncAgentReady();
      setIsConnected(true);
      setIsMuted(false);
    } catch (err) {
      if (generation !== connectGenerationRef.current) return;

      console.error('LiveKit connect failed:', err);
      setConnectError(err.message || 'Failed to connect');
      setIsConnected(false);
      setIsAgentReady(false);

      if (room) {
        try {
          await releaseLocalMedia(room);
          await room.disconnect();
        } catch {
          // ignore cleanup errors
        }
        roomRef.current = null;
      }
    } finally {
      if (generation === connectGenerationRef.current) {
        connectingRef.current = false;
        setIsConnecting(false);
      }
    }
  }, [getToken, flashInterrupted, inputSampleRate, clearStallTimer, scheduleStallCheck]);

  // Auto-connect once when auth is ready — never after manual disconnect.
  useEffect(() => {
    if (!autoConnect || !authReady || !getToken) return;
    if (autoConnectStartedRef.current || !allowAutoConnectRef.current) return;

    autoConnectStartedRef.current = true;
    connect();
  }, [autoConnect, authReady, getToken, connect]);

  const reconnect = useCallback(async () => {
    allowAutoConnectRef.current = true;
    await disconnect({ intentional: false });
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
      connectGenerationRef.current += 1;
      if (interruptedTimerRef.current) clearTimeout(interruptedTimerRef.current);
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current);

      const room = roomRef.current;
      if (room) {
        releaseLocalMedia(room).finally(() => {
          room.disconnect();
        });
        roomRef.current = null;
      }
    };
  }, []);

  const status = !isConnected
    ? isConnecting
      ? 'connecting'
      : 'idle'
    : !isAgentReady
      ? 'connecting'
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
    isAgentReady,
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
    connectError,
  };
}
