import { useCallback, useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';

import { API_BASE } from '../config/api.js';

// How long (ms) to wait for agent reply after user stops speaking before
// marking the session as stalled.
const STALL_TIMEOUT_MS = 8000;

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

export function useVoiceAgent(authToken, { onAction } = {}) {
  const [greeting, setGreeting] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isInterrupted, setIsInterrupted] = useState(false);
  const [isStalled, setIsStalled] = useState(false);
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
      isAgentSpeakingRef.current = false;
      isUserSpeakingRef.current = false;
      wasAgentSpeakingRef.current = false;
    }
  }, [clearStallTimer]);

  const connect = useCallback(async () => {
    if (roomRef.current || isConnecting || !authToken) return;

    clearStallTimer();
    setIsConnecting(true);

    try {
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

      room.on(RoomEvent.DataReceived, (payload) => {
        try {
          const text = new TextDecoder().decode(payload);
          const msg = JSON.parse(text);

          if (msg.type === 'transcript' && msg.role && msg.text) {
            setTranscript((prev) => [...prev, { role: msg.role, text: msg.text }]);
            return;
          }

          if (msg.role && msg.text) {
            setTranscript((prev) => [...prev, { role: msg.role, text: msg.text }]);
            return;
          }

          if (msg.type === 'action') {
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
          stallTimerRef.current = setTimeout(() => {
            setIsStalled(true);
          }, STALL_TIMEOUT_MS);
        }

        if ((agentSpeaking && !prevAgentSpeaking) || (userSpeaking && !prevUserSpeaking)) {
          clearStallTimer();
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
  }, [authToken, flashInterrupted, inputSampleRate, clearStallTimer, isConnecting]);

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
    status,
    transcript,
    isMuted,
    toggleMute,
    greeting,
  };
}
