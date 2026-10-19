/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { authFetch } from './authService';

export interface SecurityUserRecord {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  department?: string;
  isBanned: boolean;
  bannedAt?: string;
  bannedBy?: string;
  banReason?: string;
  unbannedAt?: string;
  unbannedBy?: string;
  suspiciousActivityCount: number;
  suspiciousEvents: Array<{
    id: string;
    type: string;
    details: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  createdAt: string;
}

export interface SecurityAuditLogRecord {
  id: string;
  timestamp: string;
  action: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  targetId?: string;
  targetEmail?: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
  ipAddress?: string;
}

export interface SuspiciousActivitySummary {
  ok: boolean;
  threatLevel: 'NOMINAL' | 'ELEVATED' | 'HIGH';
  flaggedUsersCount: number;
  users: Array<{
    id: string;
    email: string;
    name: string;
    suspiciousActivityCount: number;
    suspiciousEvents: Array<any>;
    isBanned: boolean;
  }>;
  recentEvents: SecurityAuditLogRecord[];
}

export interface SystemIntegrityReport {
  ok: boolean;
  status: string;
  timestamp: string;
  uptimeSeconds: number;
  databaseStatus: string;
  wsClientsConnected: number;
  totalRegisteredUsers: number;
  bannedUsersCount: number;
  totalOrdersActive: number;
  menuItemsInStock: number;
  menuItemsSoldOut: number;
  memoryUsageMb: number;
}

/**
 * Retrieve all registered users for security audit & administration
 */
export async function apiFetchSecurityUsers(): Promise<{ ok: boolean; users: SecurityUserRecord[]; error?: string }> {
  try {
    const res = await authFetch('/api/security/users');
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, users: [], error: data.error || `HTTP error ${res.status}` };
    }
    return data;
  } catch (err: any) {
    return { ok: false, users: [], error: err.message || 'Network error fetching security users' };
  }
}

/**
 * Ban / Suspend a user
 */
export async function apiBanUser(userId: string, reason: string): Promise<{ ok: boolean; message?: string; error?: string; user?: any; auditEntry?: any }> {
  try {
    const res = await authFetch('/api/security/ban-user', {
      method: 'POST',
      body: JSON.stringify({ userId, reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error || `HTTP error ${res.status}` };
    }
    return data;
  } catch (err: any) {
    return { ok: false, error: err.message || 'Network error banning user' };
  }
}

/**
 * Unban / Reactivate a user
 */
export async function apiUnbanUser(userId: string, reason?: string): Promise<{ ok: boolean; message?: string; error?: string; user?: any }> {
  try {
    const res = await authFetch('/api/security/unban-user', {
      method: 'POST',
      body: JSON.stringify({ userId, reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error || `HTTP error ${res.status}` };
    }
    return data;
  } catch (err: any) {
    return { ok: false, error: err.message || 'Network error unbanning user' };
  }
}

/**
 * Fetch chronological security audit logs
 */
export async function apiFetchAuditLogs(): Promise<{ ok: boolean; logs: SecurityAuditLogRecord[]; error?: string }> {
  try {
    const res = await authFetch('/api/security/audit-logs');
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, logs: [], error: data.error || `HTTP error ${res.status}` };
    }
    return data;
  } catch (err: any) {
    return { ok: false, logs: [], error: err.message || 'Network error fetching audit logs' };
  }
}

/**
 * Fetch suspicious activity summary
 */
export async function apiFetchSuspiciousActivity(): Promise<SuspiciousActivitySummary> {
  try {
    const res = await authFetch('/api/security/suspicious-activity');
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, threatLevel: 'NOMINAL', flaggedUsersCount: 0, users: [], recentEvents: [] };
    }
    return data;
  } catch {
    return { ok: false, threatLevel: 'NOMINAL', flaggedUsersCount: 0, users: [], recentEvents: [] };
  }
}

/**
 * Fetch system integrity report
 */
export async function apiFetchSystemIntegrity(): Promise<SystemIntegrityReport | null> {
  try {
    const res = await authFetch('/api/system/integrity');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Clear system caches and flush sessions
 */
export async function apiClearSystemCache(): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await authFetch('/api/system/integrity/clear-cache', { method: 'POST' });
    return await res.json();
  } catch (err: any) {
    return { ok: false, message: err.message || 'Failed to clear cache' };
  }
}

/**
 * Menu API: fetch live menu
 */
export async function apiFetchLiveMenu(): Promise<any[]> {
  try {
    const res = await authFetch('/api/menu');
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

/**
 * Menu API: add dish
 */
export async function apiAddMenuItem(dish: any): Promise<{ ok: boolean; item?: any; error?: string }> {
  try {
    const res = await authFetch('/api/menu', {
      method: 'POST',
      body: JSON.stringify(dish),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };
    return data;
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

/**
 * Menu API: edit dish
 */
export async function apiUpdateMenuItem(id: string, updates: any): Promise<{ ok: boolean; item?: any; error?: string }> {
  try {
    const res = await authFetch(`/api/menu/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };
    return data;
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

/**
 * Menu API: toggle stock
 */
export async function apiToggleMenuStock(id: string): Promise<{ ok: boolean; item?: any; error?: string }> {
  try {
    const res = await authFetch(`/api/menu/${id}/toggle-stock`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };
    return data;
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

/**
 * Menu API: delete dish
 */
export async function apiDeleteMenuItem(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await authFetch(`/api/menu/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };
    return data;
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
