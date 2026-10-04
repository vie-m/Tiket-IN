// Authentication middleware.
import 'dotenv/config';
import jwt from 'jsonwebtoken';

// requireAuth: expects header "Authorization: Bearer <token>".
// If the JWT is valid, we put { id, role } on req.user. The user id ALWAYS
// comes from this signed token, never from the request body.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Login required' });
  }
  try {
    // verify() checks the signature (made with JWT_SECRET) and the expiry time.
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// requireAdmin: must be logged in AND have role 'admin'.
export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    next();
  });
}
