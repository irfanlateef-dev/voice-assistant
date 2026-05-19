import { RoomEvent } from '@livekit/rtc-node';

export function resolveUserId(room, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const findUser = () => {
      for (const participant of room.remoteParticipants.values()) {
        if (participant.identity) {
          return participant.identity;
        }
      }
      return null;
    };

    const existing = findUser();
    if (existing) {
      resolve(existing);
      return;
    }

    const timeout = setTimeout(() => {
      room.off(RoomEvent.ParticipantConnected, onConnected);
      reject(new Error('Timed out waiting for user to join'));
    }, timeoutMs);

    const onConnected = (participant) => {
      if (participant.identity) {
        clearTimeout(timeout);
        room.off(RoomEvent.ParticipantConnected, onConnected);
        resolve(participant.identity);
      }
    };

    room.on(RoomEvent.ParticipantConnected, onConnected);
  });
}
