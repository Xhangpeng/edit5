/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile, UserRole, DepartmentType } from '../types/restaurant';

export const ADMIN_EMAILS = [
  'militarynp280@gmail.com',
  'tejsinghsaud55@gmail.com',
  'tejsinghsaud70@gmail.com',
  'admin@maheswarirestaurant.com',
];

export interface DepartmentConfig {
  id: DepartmentType;
  title: string;
  hindiTitle: string;
  role: UserRole;
  pin: string;
  description: string;
  hindiDescription: string;
  badgeColor: string;
  allowedTabs: string[];
}

export const DEPARTMENTS: Record<DepartmentType, DepartmentConfig> = {
  manager: {
    id: 'manager',
    title: 'General Manager (Full Access)',
    hindiTitle: 'महाप्रबंधक (सभी विभाग)',
    role: 'manager',
    pin: '9900',
    description: 'Master administrative access across KDS, tables, bookings, supply, staff & finance',
    hindiDescription: 'रसोई, डाइनिंग टेबल, आरक्षण और कर्मचारियों का पूर्ण नियंत्रण',
    badgeColor: 'bg-amber-400 text-stone-950',
    allowedTabs: ['kds', 'waiter', 'tables', 'reservations', 'menu', 'system_desk', 'staff', 'analytics', 'coupons', 'catering', 'settings'],
  },
  kitchen: {
    id: 'kitchen',
    title: 'Kitchen & Master Chef',
    hindiTitle: 'प्रधान रसोइया (रसोई)',
    role: 'kitchen',
    pin: '1122',
    description: 'Incoming live orders, prep queue, cooking status & ready alert dispatcher',
    hindiDescription: 'लाइव ऑर्डर कतार, तंदूर और करी तैयारी स्थिति',
    badgeColor: 'bg-orange-500 text-white',
    allowedTabs: ['kds'],
  },
  waiter: {
    id: 'waiter',
    title: 'Dining Floor Waiter',
    hindiTitle: 'फ्लोर वेटर / कैप्टन',
    role: 'waiter',
    pin: '3344',
    description: 'Punch-in table orders, live food ready pickup alerts, and table service completion',
    hindiDescription: 'टेबल ऑर्डर पंचिंग, भोजन तैयार सूचना और टेबल परोसना',
    badgeColor: 'bg-blue-500 text-white',
    allowedTabs: ['waiter_desk', 'waiter', 'kds', 'tables'],
  },
  booking_menu: {
    id: 'booking_menu',
    title: 'Bookings & Menu Supply Manager',
    hindiTitle: 'आरक्षण व मेन्यू आपूर्ति',
    role: 'booking_menu',
    pin: '5566',
    description: 'Manage dining table bookings, seating arrangements, and live menu stock & 86 items',
    hindiDescription: 'टेबल बुकिंग और 86 व्यंजनों का स्टॉक व मूल्य प्रबंधन',
    badgeColor: 'bg-emerald-500 text-white',
    allowedTabs: ['reservations', 'menu', 'tables'],
  },
  system_management: {
    id: 'system_management',
    title: 'System Management Desk',
    hindiTitle: 'सिस्टम प्रबंधन डेस्क',
    role: 'system_management',
    pin: '8899',
    description: 'Customer order management, menu editing, security activity monitoring, audit logs & user bans',
    hindiDescription: 'ऑर्डर और मेन्यू संपादन, सुरक्षा ऑडिट और संदिग्ध गतिविधि नियंत्रण',
    badgeColor: 'bg-indigo-500 text-white',
    allowedTabs: ['system_desk', 'orders', 'menu', 'security', 'audit_logs', 'system_integrity'],
  },
};

export const ADMIN_MASTER_PINS = ['2026', '8899', '1234', '9900'];

export function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return (
    ADMIN_EMAILS.some((adm) => adm.toLowerCase().trim() === clean) ||
    clean.includes('tejsinghsaud') ||
    clean === 'admin@maheswarirestaurant.com' ||
    clean === 'manager@maheswarirestaurant.com' ||
    clean.startsWith('admin@')
  );
}

export function getDepartmentByPin(pin: string): DepartmentConfig | null {
  const cleanPin = pin.trim();
  if (['2026', '9900', '1234'].includes(cleanPin)) {
    return DEPARTMENTS.manager;
  }
  for (const dept of Object.values(DEPARTMENTS)) {
    if (dept.pin === cleanPin) {
      return dept;
    }
  }
  return null;
}

export function getUserDepartment(user?: UserProfile | null): DepartmentType {
  if (!user) return 'manager';
  if (user.department && DEPARTMENTS[user.department]) {
    return user.department;
  }
  if (user.role === 'kitchen') return 'kitchen';
  if (user.role === 'waiter' || user.role === 'captain') return 'waiter';
  if (user.role === 'booking_menu') return 'booking_menu';
  if (user.role === 'system_management') return 'system_management';
  return 'manager';
}

export function hasDepartmentPermission(
  department: DepartmentType,
  requiredTab: string
): boolean {
  if (department === 'manager') return true;
  const config = DEPARTMENTS[department];
  if (!config) return false;
  return config.allowedTabs.includes(requiredTab);
}

export function canBanUsers(role?: string): boolean {
  const r = (role || '').toLowerCase();
  return r === 'manager' || r === 'admin' || r === 'system_management';
}

export function canAccessSystemDesk(role?: string): boolean {
  const r = (role || '').toLowerCase();
  return r === 'manager' || r === 'admin' || r === 'system_management';
}

export function canAccessManagerPanel(role?: string): boolean {
  const r = (role || '').toLowerCase();
  return r === 'manager' || r === 'admin';
}

export function canAccessWaiterPanel(role?: string): boolean {
  const r = (role || '').toLowerCase();
  return r === 'waiter' || r === 'captain' || r === 'manager' || r === 'admin';
}

export function canAccessKitchenPanel(role?: string): boolean {
  const r = (role || '').toLowerCase();
  return r === 'kitchen' || r === 'manager' || r === 'admin';
}

export function isAdminUser(user?: UserProfile | null): boolean {
  if (!user || !user.isLoggedIn) return false;
  if (user.role === 'admin' || user.role === 'manager') {
    return true;
  }
  if (['kitchen', 'waiter', 'captain', 'system_management', 'booking_menu'].includes(user.role as string)) {
    return true;
  }
  if (user.email && isAuthorizedAdminEmail(user.email)) {
    return true;
  }
  return false;
}

export function verifyAdminPin(pin: string): boolean {
  return ADMIN_MASTER_PINS.includes(pin.trim()) || !!getDepartmentByPin(pin);
}
