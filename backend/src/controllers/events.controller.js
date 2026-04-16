import { asyncHandler } from '../utils/asyncHandler.js';
import { addLiveUpdateSubscriber, getLiveUpdateStats } from '../services/liveUpdate.service.js';

export const streamLiveUpdates = asyncHandler(async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  // Keep the stream open and immediately establish the SSE channel.
  res.write(`: stream-open ${Date.now()}\n\n`);

  const unsubscribe = addLiveUpdateSubscriber({
    userId: req.user.id,
    role: req.user.role,
    res,
  });

  const stats = getLiveUpdateStats();
  console.log(
    `[SSE] Stream ready role=${req.user.role} userId=${req.user.id} activeClients=${stats.activeClients}`,
  );

  req.on('close', () => {
    unsubscribe();
  });
});
