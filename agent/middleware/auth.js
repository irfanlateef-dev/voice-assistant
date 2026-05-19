import { verifyToken } from '../lib/auth.js';
import { getUserById } from '../services/userService.js';

export async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization required' });
    return;
  }

  try {
    const payload = await verifyToken(header.slice(7));
    const user = await getUserById(payload.id);

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = { id: user.id, email: user.email, name: user.name };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;

  if (header?.startsWith('Bearer ')) {
    try {
      const payload = await verifyToken(header.slice(7));
      const user = await getUserById(payload.id);
      req.user = user ? { id: user.id, email: user.email, name: user.name } : null;
    } catch {
      req.user = null;
    }
  }

  next();
}
