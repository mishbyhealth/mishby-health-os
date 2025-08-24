import { rateLimiter } from '../utils/rateLimiter';

export const login = rateLimiter(async (email, password) => {
  // existing login logic
});
