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
    if (context?.userId) return context;
  }
  return null;
}

function cleanupListeners(room, handlers) {
  room.off(RoomEvent.ParticipantConnected, handlers.onConnected);
  room.off(RoomEvent.ParticipantMetadataChanged, handlers.onMetadataChanged);
}

export function resolveUserId(room, timeoutMs = 30000) {
  return resolveParticipantContext(room, timeoutMs).then((ctx) => ctx.userId);
}

export function resolveParticipantContext(room, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const tryExisting = () => {
      const existing = findParticipantContext(room);
      if (existing?.userId) {
        resolve(existing);
        return true;
      }
      return false;
    };

    if (tryExisting()) return;

    // Metadata may not be populated on the first tick after connect.
    setTimeout(() => {
      if (tryExisting()) return;

      const handlers = {
        onConnected: (participant) => {
          const context = parseParticipantContext(participant);
          if (context?.userId) {
            clearTimeout(timeout);
            cleanupListeners(room, handlers);
            resolve(context);
          }
        },
        onMetadataChanged: (participant) => {
          const context = parseParticipantContext(participant);
          if (context?.userId) {
            clearTimeout(timeout);
            cleanupListeners(room, handlers);
            resolve(context);
          }
        },
      };

      const timeout = setTimeout(() => {
        cleanupListeners(room, handlers);
        reject(new Error('Timed out waiting for user to join'));
      }, timeoutMs);

      room.on(RoomEvent.ParticipantConnected, handlers.onConnected);
      room.on(RoomEvent.ParticipantMetadataChanged, handlers.onMetadataChanged);
    }, 100);
  });
}
