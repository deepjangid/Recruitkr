import crypto from 'node:crypto';

const subscribers = new Map();
const HEARTBEAT_INTERVAL_MS = 20000;

const buildSubscriberKey = ({ userId, role }) => `${role}:${userId}`;

const getActiveClientCount = () =>
  Array.from(subscribers.values()).reduce((total, bucket) => total + bucket.size, 0);

const flushIfSupported = (res) => {
  if (typeof res.flush === 'function') {
    res.flush();
  }
};

const writeSseEvent = (res, event, payload) => {
  if (event) {
    res.write(`event: ${event}\n`);
  }

  res.write(`data: ${JSON.stringify(payload)}\n\n`);
  flushIfSupported(res);
};

const writeHeartbeat = (res) => {
  res.write(`event: heartbeat\n`);
  res.write(`data: ${JSON.stringify({ ts: Date.now() })}\n\n`);
  flushIfSupported(res);
};

export const addLiveUpdateSubscriber = ({ userId, role, res }) => {
  const normalizedUserId = String(userId);
  const key = buildSubscriberKey({ userId: normalizedUserId, role });
  const clientId = crypto.randomUUID();

  const bucket = subscribers.get(key) || new Map();
  bucket.set(clientId, {
    clientId,
    userId: normalizedUserId,
    role,
    res,
    connectedAt: new Date().toISOString(),
  });
  subscribers.set(key, bucket);

  console.log(
    `[SSE] Client connected role=${role} userId=${normalizedUserId} clientId=${clientId} activeClients=${getActiveClientCount()}`,
  );

  writeSseEvent(res, 'connected', {
    ok: true,
    clientId,
    userId: normalizedUserId,
    role,
    connectedAt: new Date().toISOString(),
  });

  const heartbeatId = setInterval(() => {
    writeHeartbeat(res);
  }, HEARTBEAT_INTERVAL_MS);

  return () => {
    clearInterval(heartbeatId);

    const currentBucket = subscribers.get(key);
    if (!currentBucket) return;

    currentBucket.delete(clientId);
    if (currentBucket.size === 0) {
      subscribers.delete(key);
    }

    console.log(
      `[SSE] Client disconnected role=${role} userId=${normalizedUserId} clientId=${clientId} activeClients=${getActiveClientCount()}`,
    );
  };
};

export const publishLiveUpdate = ({ userId, role, event, payload }) => {
  if (!userId || !role) return;

  const normalizedUserId = String(userId);
  const key = buildSubscriberKey({ userId: normalizedUserId, role });
  const bucket = subscribers.get(key);

  console.log(
    `[SSE] Broadcast event=${event} role=${role} userId=${normalizedUserId} targets=${bucket?.size || 0}`,
  );

  if (!bucket?.size) return;

  for (const subscriber of bucket.values()) {
    writeSseEvent(subscriber.res, event, {
      ...payload,
      sentAt: new Date().toISOString(),
    });
  }
};

export const getLiveUpdateStats = () => ({
  activeClients: getActiveClientCount(),
  subscriberGroups: subscribers.size,
});
