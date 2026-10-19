/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Bell,
  CheckCircle2,
  Clock,
  LogOut,
  User,
  ShieldAlert,
  Sparkles,
  Store,
  RefreshCw,
  X
} from 'lucide-react';
import { Order, MenuItem, DiningTable, UserProfile } from '../types/restaurant';
import { WaiterDesk } from './WaiterDesk';
import { MENU_ITEMS } from '../data/menuData';

interface Props {
  user?: UserProfile;
  orders: Order[];
  diningTables?: DiningTable[];
  menuItems?: MenuItem[];
  onOrderPunched: (newOrder: Partial<Order>) => void;
  onMarkServed: (orderId: string) => void;
  onLogout?: () => void;
  onClose?: () => void;
  lang?: 'en' | 'hi';
}

const DEFAULT_TABLES: DiningTable[] = [
  { id: 't1', tableNumber: 'Table 1', capacity: 2, area: 'Window Gallery', status: 'available' },
  { id: 't2', tableNumber: 'Table 2', capacity: 4, area: 'Royal Baithak Hall', status: 'occupied' },
  { id: 't3', tableNumber: 'Table 3', capacity: 4, area: 'Heritage Alcove', status: 'available' },
  { id: 't4', tableNumber: 'Table 4', capacity: 6, area: 'Center Grand Hall', status: 'occupied' },
  { id: 't5', tableNumber: 'Table 5', capacity: 4, area: 'Garden Courtyard', status: 'available' },
  { id: 't6', tableNumber: 'Table 6', capacity: 6, area: 'Executive Booth', status: 'available' },
  { id: 't7', tableNumber: 'Table 7', capacity: 8, area: 'Maharaja Baithak VIP', status: 'reserved' },
  { id: 't8', tableNumber: 'Table 8', capacity: 4, area: 'Royal Fountain Courtyard', status: 'available' },
];

export const WaiterPanel: React.FC<Props> = ({
  user,
  orders,
  diningTables = DEFAULT_TABLES,
  menuItems = MENU_ITEMS,
  onOrderPunched,
  onMarkServed,
  onLogout,
  onClose,
  lang = 'en',
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const waiterName = user?.name || 'Ramesh (Floor Captain)';

  // Calculate live statistics
  const readyOrders = orders.filter(
    (o) => o.orderStatus === 'ready_at_table' || o.orderStatus === 'ready_for_dispatch'
  );
  const activeDineInOrders = orders.filter(
    (o) => o.bookingType === 'dine_in' && o.orderStatus !== 'completed' && o.orderStatus !== 'cancelled'
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-950 text-stone-100 font-sans-body overflow-hidden">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-stone-900 border border-emerald-400 shadow-2xl rounded-xl px-4 py-3 text-xs text-emerald-200 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER: WAITER DESK IDENTITY */}
      <header className="px-4 py-3 bg-stone-900 border-b border-stone-800 flex items-center justify-between flex-wrap gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-stone-950 shadow-md font-bold">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif-display font-bold text-base sm:text-lg text-white">
                Waiter Panel
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Floor Service
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-400 font-mono">
              <span className="text-amber-300 font-bold">{waiterName}</span>
              <span>·</span>
              <span>Dining Floor Captain</span>
              <span>·</span>
              <span className="text-emerald-400">Shift Active</span>
            </div>
          </div>
        </div>

        {/* Status Indicators & Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center gap-2">
            <Bell className={`w-3.5 h-3.5 ${readyOrders.length > 0 ? 'text-amber-400 animate-bounce' : 'text-stone-400'}`} />
            <span className="text-[11px] font-mono text-stone-300">
              Food Ready to Serve: <strong className={readyOrders.length > 0 ? 'text-amber-400 font-bold' : 'text-stone-400'}>{readyOrders.length}</strong>
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-[11px] font-mono text-stone-300">
            Active Tables: <strong className="text-emerald-400">{activeDineInOrders.length}</strong>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-stone-800 hover:bg-rose-600 text-stone-300 hover:text-white rounded-xl transition-colors cursor-pointer"
              title="Close Waiter Panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </header>

      {/* Security boundary banner */}
      <div className="px-4 py-1.5 bg-emerald-950/40 border-b border-emerald-900/40 text-[11px] text-emerald-300/80 flex items-center justify-between shrink-0">
        <span>🔒 Strict Role Enforcement: Waiter access restricted to order punch, table layout & food service.</span>
        <span className="font-mono text-[10px] text-stone-400">Station: Dining Floor Level 1</span>
      </div>

      {/* MAIN WAITER DESK INTERFACE */}
      <main className="flex-1 overflow-y-auto p-2 sm:p-4">
        <WaiterDesk
          orders={orders}
          menuItems={menuItems}
          diningTables={diningTables}
          lang={lang}
          waiterName={waiterName}
          onOrderPunched={onOrderPunched}
          onMarkServed={onMarkServed}
          onHandoverDelivery={() => {}}
          showNotification={showNotification}
        />
      </main>
    </div>
  );
};
