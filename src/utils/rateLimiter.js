/**
 * Enhanced rate limiter with request queuing and per-user limits
 * @param {Function} fn - Function to wrap
 * @param {object} options - { delay: number, maxQueue: number, userLimit: number }
 * @returns {Function}
 */
export function rateLimiter(fn, options = {}) {
  const {
    delay = 1000,
    maxQueue = 10,
    userLimit = 5
  } = options;

  const userQueues = new Map();

  return async function (...args) {
    const userId = args[0]?.userId || 'global'; // Extract user ID if available
    const now = Date.now();

    // Initialize user queue
    if (!userQueues.has(userId)) {
      userQueues.set(userId, { lastCall: 0, queue: [] });
    }

    const user = userQueues.get(userId);

    // Check individual user limit
    if (user.queue.length >= userLimit) {
      throw new Error(`User ${userId} exceeded request limit`);
    }

    return new Promise((resolve, reject) => {
      // Add to queue
      user.queue.push({ args, resolve, reject });

      // Process queue
      const processQueue = () => {
        if (user.queue.length === 0) return;

        const current = user.queue[0];
        const timeSinceLastCall = now - user.lastCall;

        if (timeSinceLastCall >= delay) {
          user.lastCall = now;
          const item = user.queue.shift();
          
          fn(...item.args)
            .then(item.resolve)
            .catch(item.reject)
            .finally(() => {
              if (user.queue.length > 0) {
                setTimeout(processQueue, delay);
              }
            });
        } else {
          setTimeout(processQueue, delay - timeSinceLastCall);
        }
      };

      if (user.queue.length === 1) {
        processQueue();
      }

      // Reject if queue overflow
      if (user.queue.length > maxQueue) {
        user.queue.pop();
        reject(new Error('Too many requests in queue'));
      }
    });
  };
}