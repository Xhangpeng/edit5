/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Flame,
  ChefHat,
  CheckCircle2,
  Clock,
  Search,
  LogOut,
  Bell,
  Volume2,
  VolumeX,
  AlertCircle,
  UtensilsCrossed,
  X
} from 'lucide-react';
import { Order, CartItem, UserProfile } from '../types/restaurant';

interface Props {
  user?: UserProfile;
  orders: Order[];
  onChefStartCooking: (orderId: string) => void;
  onChefMarkPrepared: (order: Order) => void;
  onLogout?: () => void;
  onClose?: () => void;
  lang?: 'en' | 'hi';
}

export const KitchenChefPanel: React.FC<Props> = ({
  user,
  orders,
  onChefStartCooking,
  onChefMarkPrepared,
  onLogout,
  onClose,
  lang = 'en',
}) => {
  const [orderSearch, setOrderSearch] = useState('');
  const [stationFilter, setStationFilter] = useState<'all' | 'tandoor' | 'curries' | 'biryani'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const chefName = user?.name || 'Chef Ranveer (Head Chef)';

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Kitchen orders: placed, confirmed, cooking, and ready
  const kitchenOrders = orders
    .filter((o) =>
      ['placed', 'confirmed', 'cooking', 'ready_at_table', 'ready_for_dispatch'].includes(o.orderStatus)
    )
    .filter(
      (o) =>
        orderSearch.trim() === '' ||
        (o.orderNumber && o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase())) ||
        (o.tableNumber && o.tableNumber.toLowerCase().includes(orderSearch.toLowerCase())) ||
        (o.customerName && o.customerName.toLowerCase().includes(orderSearch.toLowerCase()))
    );

  const cookingCount = kitchenOrders.filter((o) => o.orderStatus === 'cooking').length;
  const pendingCount = kitchenOrders.filter((o) => o.orderStatus === 'placed' || o.orderStatus === 'confirmed').length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-950 text-stone-100 font-sans-body overflow-hidden">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-stone-900 border border-orange-400 shadow-2xl rounded-xl px-4 py-3 text-xs text-orange-200 flex items-center gap-2 animate-bounce">
          <Flame className="w-4 h-4 text-orange-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER: KITCHEN CHEF IDENTITY */}
      <header className="px-4 py-3 bg-stone-900 border-b border-stone-800 flex items-center justify-between flex-wrap gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-stone-950 shadow-md font-bold">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif-display font-bold text-base sm:text-lg text-white">
                Kitchen Chef Panel (KDS)
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/40">
                Culinary Operations
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-400 font-mono">
              <span className="text-amber-300 font-bold">{chefName}</span>
              <span>·</span>
              <span>Central Kitchen Station</span>
              <span>·</span>
              <span className="text-orange-400">🔥 Live Prep Active</span>
            </div>
          </div>
        </div>

        {/* Live KDS Metrics & Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-[11px] font-mono text-stone-300">
            Pending Queue: <strong className="text-orange-400 font-bold">{pendingCount}</strong>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-[11px] font-mono text-stone-300">
            On Fire / Cooking: <strong className="text-amber-300 font-bold">{cookingCount}</strong>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl transition-colors cursor-pointer"
            title={soundEnabled ? 'Chime Sound Enabled' : 'Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-stone-800 hover:bg-rose-600 text-stone-300 hover:text-white rounded-xl transition-colors cursor-pointer"
              title="Close Kitchen Panel"
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
      <div className="px-4 py-1.5 bg-orange-950/40 border-b border-orange-900/40 text-[11px] text-orange-300/80 flex items-center justify-between shrink-0">
        <span>🔒 Strict Role Enforcement: Kitchen Chef access restricted to live cooking queue & food preparation status.</span>
        <span className="font-mono text-[10px] text-stone-400">User Banning / System Admin Access: PROHIBITED</span>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="px-4 py-2.5 bg-stone-900/70 border-b border-stone-800 flex items-center justify-between flex-wrap gap-2 shrink-0">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order number, table, customer..."
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-orange-400"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(['all', 'tandoor', 'curries', 'biryani'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStationFilter(st)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer capitalize ${
                stationFilter === st
                  ? 'bg-orange-500 text-stone-950 shadow-sm'
                  : 'bg-stone-800 text-stone-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* KDS MAIN ORDERS GRID */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        {kitchenOrders.length === 0 ? (
          <div className="p-16 text-center bg-stone-900/30 rounded-2xl border border-stone-800/80 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto opacity-80" />
            <h3 className="text-base font-bold text-white">All Kitchen Orders Cleared!</h3>
            <p className="text-xs text-stone-400">
              Incoming table orders and dining orders will automatically pop up with live audio chime.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kitchenOrders.map((order) => {
              let parsedItems: CartItem[] = [];
              try {
                parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
              } catch {
                parsedItems = [];
              }

              const isPlaced = order.orderStatus === 'placed';
              const isCooking = order.orderStatus === 'cooking';
              const isReady = order.orderStatus === 'ready_at_table' || order.orderStatus === 'ready_for_dispatch';
              const isDineIn = order.bookingType === 'dine_in';

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border p-4 flex flex-col justify-between space-y-3 transition-all ${
                    isCooking
                      ? 'bg-amber-950/20 border-orange-500/60 shadow-lg ring-1 ring-orange-500/30'
                      : isPlaced
                      ? 'bg-rose-950/20 border-rose-500/60 shadow-md ring-1 ring-rose-500/30 animate-pulse'
                      : isReady
                      ? 'bg-emerald-950/20 border-emerald-500/50'
                      : 'bg-stone-900 border-stone-800'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between pb-2 border-b border-stone-800/80 gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-bold text-amber-400">
                            #{order.orderNumber || order.id.slice(-6)}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-amber-400/20 text-amber-300 border border-amber-400/40">
                            🍽️ {order.tableNumber || 'Dine-In Table'}
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono mt-0.5 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-stone-500" />
                          <span>{order.createdAt}</span>
                          {order.preparedAt && (
                            <span className="text-emerald-400">· Ready at {order.preparedAt}</span>
                          )}
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono shrink-0 ${
                          isPlaced
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : isCooking
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                            : isReady
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-stone-800 text-stone-300'
                        }`}
                      >
                        {order.orderStatus.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Customer & Notes */}
                    <div className="py-2 border-b border-stone-800/60 text-xs">
                      <span className="font-bold text-stone-200">
                        {order.customerName || `Guest at ${order.tableNumber || 'Table'}`}
                      </span>
                      {order.notes && (
                        <p className="text-[11px] text-amber-200/90 italic mt-0.5 bg-amber-950/30 p-1.5 rounded-lg border border-amber-500/20">
                          Note: "{order.notes}"
                        </p>
                      )}
                    </div>

                    {/* Dishes checklist */}
                    <div className="pt-2 space-y-2">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                        Preparation Items:
                      </div>
                      <div className="space-y-1.5">
                        {parsedItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-xl bg-stone-950 border border-stone-800/80 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span className="text-amber-400 font-mono">{item.quantity}x</span>
                                <span>{item.menuItem?.name || 'Dish'}</span>
                              </div>
                              {item.specialInstructions && (
                                <p className="text-[10px] text-stone-400 italic">
                                  {item.specialInstructions}
                                </p>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-stone-500">
                              ⏱️ {item.menuItem?.prepTimeMinutes || 15}m
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Culinary Action Buttons */}
                  <div className="pt-3 border-t border-stone-800 flex items-center gap-2">
                    {isPlaced && (
                      <button
                        type="button"
                        onClick={() => {
                          onChefStartCooking(order.id);
                          showNotification(`🔥 Cooking started for Order #${order.orderNumber}`);
                        }}
                        className="flex-1 py-2 bg-orange-500 hover:bg-orange-400 text-stone-950 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Start Cooking</span>
                      </button>
                    )}

                    {isCooking && (
                      <button
                        type="button"
                        onClick={() => {
                          onChefMarkPrepared(order);
                          showNotification(`✅ Food Ready! Waiter alerted for Table ${order.tableNumber}`);
                        }}
                        className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Ready & Alert Waiter</span>
                      </button>
                    )}

                    {isReady && (
                      <div className="w-full text-center py-1.5 bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 rounded-xl text-[11px] font-bold font-mono">
                        ✓ Prepared · Awaiting Waiter Pickup
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
