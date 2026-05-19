import { verifyToken } from '../lib/auth.js';

export async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization required' });
    return;
  }

  try {
    req.user = await verifyToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;

  if (header?.startsWith('Bearer ')) {
    try {
      req.user = await verifyToken(header.slice(7));
    } catch {
      req.user = null;
    }
  }

  next();
}
