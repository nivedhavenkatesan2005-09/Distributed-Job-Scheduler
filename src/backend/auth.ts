import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_intern_assignment_key_2026';

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 10);
};

export const verifyPassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (userId: string, role: string, organizationId: string) => {
  return jwt.sign({ userId, role, organizationId }, JWT_SECRET, { expiresIn: '24h' });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string, role: string, organizationId: string };
  } catch (err) {
    return null;
  }
};

// Express Middleware
export const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', details: 'Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized', details: 'Expired or invalid token' });
  }

  req.user = decoded;
  next();
};

export const requireRole = (role: string) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden', details: `Requires ${role} role` });
    }
    next();
  };
};
