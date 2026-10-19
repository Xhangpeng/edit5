/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { verifyJwtToken, JwtUserPayload } from '../lib/jwt.ts';
import { adminAuth } from '../lib/firebase-admin.ts';
import { isAuthorizedAdminEmail } from '../utils/authHelper.ts';

export interface AuthRequest extends Request {
  user?: JwtUserPayload;
}

export const authenticateToken = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) return next();

  // 1. Verify custom JWT token
  const decodedJwt = verifyJwtToken(token);
  if (decodedJwt) {
    req.user = decodedJwt;
    return next();
  }

  // 2. Fallback to Firebase ID Token
  try {
    const fbUser = await adminAuth.verifyIdToken(token);
    const email = (fbUser.email || '').toLowerCase().trim();
    const isAdmin = isAuthorizedAdminEmail(email);

    req.user = {
      uid: fbUser.uid,
      email,
      name: fbUser.name,
      phone: (fbUser as any).phone_number,
      role: isAdmin ? 'admin' : ((fbUser as any).role || 'customer'),
      department: (fbUser as any).department || (isAdmin ? 'manager' : undefined),
    };
  } catch {
    // ignore expired or invalid
  }

  next();
};

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required. Please sign in or register to continue.',
      code: 'AUTH_REQUIRED',
    });
  }

  if (req.user.isBanned) {
    return res.status(403).json({
      error: 'Account suspended. Your access has been restricted by System Administration.',
      code: 'ACCOUNT_BANNED',
    });
  }

  next();
};

export const requireRole = (allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required. Please log in to continue.',
        code: 'AUTH_REQUIRED',
      });
    }

    if (req.user.isBanned) {
      return res.status(403).json({
        error: 'Account suspended. Your access has been restricted by System Administration.',
        code: 'ACCOUNT_BANNED',
      });
    }

    const userRole = (req.user.role || '').toLowerCase();
    const isManager = userRole === 'manager' || userRole === 'admin' || isAuthorizedAdminEmail(req.user.email);

    // Manager has overall authorized administrative access across all departmental panels and actions
    if (isManager || allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      error: `Access denied: Role '${userRole}' is not authorized to perform this operation. Required: [${allowedRoles.join(', ')}]`,
      code: 'FORBIDDEN',
      currentRole: userRole,
    });
  };
};

export const requireManagerOnly = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required. Please log in as General Manager.',
      code: 'AUTH_REQUIRED',
    });
  }

  if (req.user.isBanned) {
    return res.status(403).json({
      error: 'Account suspended. Your access has been restricted by System Administration.',
      code: 'ACCOUNT_BANNED',
    });
  }

  const role = req.user.role?.toLowerCase() || '';
  const email = req.user.email?.toLowerCase() || '';

  const isManager = role === 'admin' || role === 'manager' || isAuthorizedAdminEmail(email);

  if (!isManager) {
    return res.status(403).json({
      error: 'Access denied: General Manager privileges required for this privileged configuration.',
      code: 'MANAGER_ONLY_FORBIDDEN',
    });
  }

  next();
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required. Please log in as an administrator.',
      code: 'AUTH_REQUIRED',
    });
  }

  if (req.user.isBanned) {
    return res.status(403).json({
      error: 'Account suspended. Your access has been restricted by System Administration.',
      code: 'ACCOUNT_BANNED',
    });
  }

  const role = req.user.role?.toLowerCase() || '';
  const email = req.user.email?.toLowerCase() || '';

  const isStaffOrAdmin =
    ['admin', 'manager', 'kitchen', 'waiter', 'system_management', 'booking_menu'].includes(role) ||
    isAuthorizedAdminEmail(email) ||
    email.startsWith('admin@');

  if (!isStaffOrAdmin) {
    return res.status(403).json({
      error: 'Access denied: Administrative privileges required.',
      code: 'FORBIDDEN',
    });
  }

  next();
};
