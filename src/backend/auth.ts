import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Role, Permission } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_intern_assignment_key_2026';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'MANAGE_QUEUES',
    'SCALE_WORKERS',
    'REPLAY_DLQ',
    'CREATE_JOBS',
    'MANAGE_WORKFLOWS',
    'MANAGE_LOCKS',
    'MANAGE_SHARDS',
    'MANAGE_RULES',
    'VIEW_METRICS'
  ],
  operator: [
    'MANAGE_QUEUES',
    'SCALE_WORKERS',
    'REPLAY_DLQ',
    'CREATE_JOBS',
    'MANAGE_WORKFLOWS',
    'MANAGE_LOCKS',
    'MANAGE_RULES',
    'VIEW_METRICS'
  ],
  developer: [
    'CREATE_JOBS',
    'MANAGE_WORKFLOWS',
    'MANAGE_RULES',
    'VIEW_METRICS'
  ],
  viewer: [
    'VIEW_METRICS'
  ]
};

export const hasPermission = (role: Role, permission: Permission): boolean => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

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
    return jwt.verify(token, JWT_SECRET) as { userId: string, role: Role, organizationId: string };
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

export const requireRole = (role: Role) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden', details: `Requires ${role} role` });
    }
    next();
  };
};

export const requirePermission = (permission: Permission) => {
  return (req: any, res: any, next: any) => {
    const userRole = (req.user?.role as Role) || 'viewer';
    if (!hasPermission(userRole, permission)) {
      return res.status(403).json({
        error: 'Forbidden',
        details: `Access denied. Role "${userRole}" lacks permission "${permission}".`,
        requiredPermission: permission,
        userRole
      });
    }
    next();
  };
};

