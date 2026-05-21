import { RoomEvent } from '@livekit/rtc-node';

function parseParticipantContext(participant) {
  if (!participant?.identity) return null;

  let metadata = {};
  if (participant.metadata) {
    try {
      metadata = JSON.parse(participant.metadata);
    } catch {
      metadata = {};
    }
  }

  return {
    userId: participant.identity,
    cookingSessionId: metadata.cookingSessionId || null,
  };
}

function findParticipantContext(room) {
  for (const participant of room.remoteParticipants.values()) {
    const context = parseParticipantContext(participant);
    if (context) return context;
  }
  return null;
}

export function resolveUserId(room, timeoutMs = 30000) {
  return resolveParticipantContext(room, timeoutMs).then((ctx) => ctx.userId);
}

export function resolveParticipantContext(room, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const existing = findParticipantContext(room);
    if (existing) {
      resolve(existing);
      return;
    }

    const timeout = setTimeout(() => {
      room.off(RoomEvent.ParticipantConnected, onConnected);
      reject(new Error('Timed out waiting for user to join'));
    }, timeoutMs);

    const onConnected = (participant) => {
      const context = parseParticipantContext(participant);
      if (context) {
        clearTimeout(timeout);
        room.off(RoomEvent.ParticipantConnected, onConnected);
        resolve(context);
      }
    };

    room.on(RoomEvent.ParticipantConnected, onConnected);
  });
}
