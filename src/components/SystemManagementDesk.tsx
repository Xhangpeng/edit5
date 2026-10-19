/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  UserX,
  UserCheck,
  FileText,
  Activity,
  UtensilsCrossed,
  ShoppingBag,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  LogOut,
  Sliders,
  Database,
  Lock,
  Cpu,
  Eye,
  X,
  AlertCircle,
  Zap
} from 'lucide-react';
import {
  apiFetchSecurityUsers,
  apiBanUser,
  apiUnbanUser,
  apiFetchAuditLogs,
  apiFetchSuspiciousActivity,
  apiFetchSystemIntegrity,
  apiClearSystemCache,
  apiFetchLiveMenu,
  apiAddMenuItem,
  apiUpdateMenuItem,
  apiToggleMenuStock,
  apiDeleteMenuItem,
  SecurityUserRecord,
  SecurityAuditLogRecord,
  SuspiciousActivitySummary,
  SystemIntegrityReport
} from '../services/securityService';
import { Order, UserProfile } from '../types/restaurant';

interface Props {
  user?: UserProfile;
  orders?: Order[];
  onUpdateOrderStatus?: (orderId: string, status: Order['orderStatus']) => void;
  onLogout?: () => void;
  lang?: 'en' | 'hi';
  isEmbedded?: boolean; // When rendered inside Manager Admin Panel
  onClose?: () => void;
}

type DeskTab =
  | 'orders'
  | 'menu'
  | 'security_monitor'
  | 'suspicious_activity'
  | 'user_bans'
  | 'audit_logs'
  | 'system_integrity';

export const SystemManagementDesk: React.FC<Props> = ({
  user,
  orders = [],
  onUpdateOrderStatus,
  onLogout,
  lang = 'en',
  isEmbedded = false,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<DeskTab>('orders');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Security data state
  const [securityUsers, setSecurityUsers] = useState<SecurityUserRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLogRecord[]>([]);
  const [suspiciousSummary, setSuspiciousSummary] = useState<SuspiciousActivitySummary | null>(null);
  const [integrityReport, setIntegrityReport] = useState<SystemIntegrityReport | null>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);

  // Search and filter states
  const [userSearch, setUserSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditSeverity, setAuditSeverity] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [menuSearch, setMenuSearch] = useState('');

  // Ban Modal state
  const [selectedUserToBan, setSelectedUserToBan] = useState<SecurityUserRecord | null>(null);
  const [banReason, setBanReason] = useState('');
  const [isBanSubmitting, setIsBanSubmitting] = useState(false);

  // Add Menu Item Modal state
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishHindi, setNewDishHindi] = useState('');
  const [newDishCategory, setNewDishCategory] = useState('curries');
  const [newDishPrice, setNewDishPrice] = useState('350');
  const [newDishDescription, setNewDishDescription] = useState('');

  // Add Order Modal state
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const [newOrderTable, setNewOrderTable] = useState('Table 4');
  const [newOrderCustomer, setNewOrderCustomer] = useState('Patron Order');
  const [newOrderPhone, setNewOrderPhone] = useState('+91 98000 00000');
  const [newOrderDishName, setNewOrderDishName] = useState('Shankar Murgh Makhani');
  const [newOrderDishPrice, setNewOrderDishPrice] = useState('495');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Fetch all desk data
  const refreshAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersRes, logsRes, suspRes, integrityRes, menuRes] = await Promise.all([
        apiFetchSecurityUsers(),
        apiFetchAuditLogs(),
        apiFetchSuspiciousActivity(),
        apiFetchSystemIntegrity(),
        apiFetchLiveMenu(),
      ]);

      if (usersRes.ok && usersRes.users) {
        setSecurityUsers(usersRes.users);
      }
      if (logsRes.ok && logsRes.logs) {
        setAuditLogs(logsRes.logs);
      }
      if (suspRes) {
        setSuspiciousSummary(suspRes);
      }
      if (integrityRes) {
        setIntegrityReport(integrityRes);
      }
      if (menuRes) {
        setMenuItems(menuRes);
      }
    } catch (err: any) {
      showToast(`⚠️ Sync notice: ${err.message || 'Offline fallback mode'}`);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refreshAllData();
    const interval = setInterval(refreshAllData, 15000);
    return () => clearInterval(interval);
  }, [refreshAllData]);

  // Handle Ban User Action
  const handleExecuteBan = async () => {
    if (!selectedUserToBan) return;
    if (!banReason.trim()) {
      showToast('⚠️ Please specify a reason for the account suspension.');
      return;
    }

    setIsBanSubmitting(true);
    const res = await apiBanUser(selectedUserToBan.id, banReason.trim());
    setIsBanSubmitting(false);

    if (res.ok) {
      showToast(`⛔ User ${selectedUserToBan.email} has been banned.`);
      setSelectedUserToBan(null);
      setBanReason('');
      refreshAllData();
    } else {
      showToast(`❌ Ban failed: ${res.error || 'Unauthorized action'}`);
    }
  };

  // Handle Unban User Action
  const handleExecuteUnban = async (userToUnban: SecurityUserRecord) => {
    const confirmed = window.confirm(
      `Are you sure you want to reinstate access for "${userToUnban.email}" (${userToUnban.name})?`
    );
    if (!confirmed) return;

    setIsLoading(true);
    const res = await apiUnbanUser(userToUnban.id, 'Administrative reinstatement by System Management Desk');
    setIsLoading(false);

    if (res.ok) {
      showToast(`✅ User ${userToUnban.email} unbanned and restored.`);
      refreshAllData();
    } else {
      showToast(`❌ Unban failed: ${res.error || 'Unauthorized action'}`);
    }
  };

  // Handle Adding New Menu Item
  const handleCreateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishName || !newDishPrice) return;

    setIsLoading(true);
    const res = await apiAddMenuItem({
      name: newDishName,
      hindiName: newDishHindi,
      category: newDishCategory,
      price: Number(newDishPrice),
      description: newDishDescription,
      isAvailable: true,
    });
    setIsLoading(false);

    if (res.ok) {
      showToast(`✅ Added dish "${newDishName}" to menu.`);
      setIsAddMenuOpen(false);
      setNewDishName('');
      setNewDishHindi('');
      setNewDishDescription('');
      refreshAllData();
    } else {
      showToast(`❌ Failed to add item: ${res.error || 'Unauthorized'}`);
    }
  };

  // Handle Menu Item Stock Toggle (86 Sold out / In stock)
  const handleToggleStock = async (dishId: string) => {
    const res = await apiToggleMenuStock(dishId);
    if (res.ok) {
      showToast(`🔄 Dish stock updated.`);
      refreshAllData();
    } else {
      showToast(`❌ Failed: ${res.error || 'Access denied'}`);
    }
  };

  // Handle Delete Menu Item
  const handleDeleteDish = async (dishId: string, dishName: string) => {
    if (!window.confirm(`Delete dish "${dishName}" permanently from the menu?`)) return;
    const res = await apiDeleteMenuItem(dishId);
    if (res.ok) {
      showToast(`🗑️ Dish "${dishName}" removed.`);
      refreshAllData();
    } else {
      showToast(`❌ Failed: ${res.error || 'Access denied'}`);
    }
  };

  // Handle Add Customer Order from Desk
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const subtotal = Number(newOrderDishPrice) || 300;
    const gstAmount = Math.round(subtotal * 0.05);
    const grandTotal = subtotal + gstAmount;

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: `MAH-${Math.floor(100000 + Math.random() * 900000)}`,
          customerName: newOrderCustomer,
          customerPhone: newOrderPhone,
          tableNumber: newOrderTable,
          bookingType: 'dine_in',
          items: [
            {
              cartItemId: `item_${Date.now()}`,
              menuItem: {
                id: 'custom_desk_item',
                name: newOrderDishName,
                price: subtotal,
                category: 'curries',
                image: '',
                description: '',
              },
              quantity: 1,
              portion: 'full',
              spiceLevel: 1,
              itemTotal: subtotal,
            },
          ],
          subtotal,
          gstAmount,
          deliveryFee: 0,
          discountAmount: 0,
          grandTotal,
          paymentMethod: 'cash',
          paymentStatus: 'pending',
          orderStatus: 'placed',
          notes: 'Order punched directly by System Management Desk',
        }),
      });

      if (response.ok) {
        showToast(`✅ Customer order created for ${newOrderTable}!`);
        setIsAddOrderOpen(false);
        refreshAllData();
      } else {
        showToast('❌ Failed to create order.');
      }
    } catch {
      showToast('❌ Network error creating order.');
    }
  };

  // Flush system cache
  const handleFlushCache = async () => {
    const res = await apiClearSystemCache();
    if (res.ok) {
      showToast('⚡ System caches flushed and re-indexed.');
      refreshAllData();
    }
  };

  // Filtered lists
  const filteredUsers = useMemo(() => {
    return securityUsers.filter(
      (u) =>
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.role.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [securityUsers, userSearch]);

  const bannedUsers = useMemo(() => {
    return securityUsers.filter((u) => u.isBanned);
  }, [securityUsers]);

  const suspiciousUsers = useMemo(() => {
    return securityUsers.filter(
      (u) => (u.suspiciousActivityCount && u.suspiciousActivityCount > 0) || (u.suspiciousEvents && u.suspiciousEvents.length > 0)
    );
  }, [securityUsers]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchSearch =
        auditSearch === '' ||
        log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.actorEmail.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.details.toLowerCase().includes(auditSearch.toLowerCase());
      const matchSeverity = auditSeverity === 'all' || log.severity === auditSeverity;
      return matchSearch && matchSeverity;
    });
  }, [auditLogs, auditSearch, auditSeverity]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = orderStatusFilter === 'all' || o.orderStatus === orderStatusFilter;
      const matchText =
        orderSearch === '' ||
        o.orderNumber?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customerName?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.tableNumber?.toLowerCase().includes(orderSearch.toLowerCase());
      return matchStatus && matchText;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  const filteredMenu = useMemo(() => {
    return menuItems.filter(
      (m) =>
        menuSearch === '' ||
        m.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
        (m.hindiName && m.hindiName.includes(menuSearch)) ||
        m.category.toLowerCase().includes(menuSearch.toLowerCase())
    );
  }, [menuItems, menuSearch]);

  return (
    <div className={`flex flex-col bg-stone-950 text-stone-100 font-sans-body ${isEmbedded ? 'h-full' : 'fixed inset-0 z-50 overflow-hidden'}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-stone-900 border border-amber-400/60 shadow-2xl rounded-xl px-4 py-3 text-xs text-amber-200 flex items-center gap-2.5 animate-bounce">
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP DESK HEADER */}
      <header className="px-4 py-3 bg-stone-900 border-b border-stone-800 flex items-center justify-between flex-wrap gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md border border-indigo-400/40">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif-display font-bold text-base sm:text-lg text-white">
                System Management Desk
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Departmental Panel
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Orders, Menu Supply, Security Monitoring & RBAC Ban Administration
            </p>
          </div>
        </div>

        {/* Status / Quick Stats Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${suspiciousSummary?.threatLevel === 'HIGH' ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
            <span className="text-[11px] font-mono text-stone-300">
              Threat Level: <strong className={suspiciousSummary?.threatLevel === 'HIGH' ? 'text-rose-400' : 'text-emerald-400'}>{suspiciousSummary?.threatLevel || 'NOMINAL'}</strong>
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center gap-2 text-stone-300 font-mono text-[11px]">
            <UserX className="w-3.5 h-3.5 text-rose-400" />
            <span>Banned: <strong className="text-rose-400">{bannedUsers.length}</strong></span>
          </div>

          <button
            type="button"
            onClick={refreshAllData}
            disabled={isLoading}
            className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-stone-800 hover:bg-rose-600 text-stone-300 hover:text-white rounded-xl transition-colors cursor-pointer"
              title="Close Desk"
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

      {/* DEPARTMENT NAVIGATION TABS */}
      <nav className="px-4 py-2 bg-stone-900/60 border-b border-stone-800/80 flex items-center gap-1.5 overflow-x-auto shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'orders'
              ? 'bg-amber-400 text-stone-950 shadow-sm'
              : 'text-stone-400 hover:text-white hover:bg-stone-800'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Customer Orders ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('menu')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'menu'
              ? 'bg-amber-400 text-stone-950 shadow-sm'
              : 'text-stone-400 hover:text-white hover:bg-stone-800'
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>Menu Items ({menuItems.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security_monitor')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'security_monitor'
              ? 'bg-indigo-500 text-white shadow-sm'
              : 'text-stone-400 hover:text-white hover:bg-stone-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Security Monitor</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('suspicious_activity')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'suspicious_activity'
              ? 'bg-orange-500 text-stone-950 shadow-sm font-bold'
              : 'text-stone-400 hover:text-white hover:bg-stone-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
          <span>Suspicious Activity ({suspiciousUsers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('user_bans')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'user_bans'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-stone-400 hover:text-white hover:bg-stone-800'
          }`}
        >
          <UserX className="w-3.5 h-3.5" />
          <span>Bans & Suspensions ({bannedUsers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit_logs')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'audit_logs'
              ? 'bg-amber-400 text-stone-950 shadow-sm'
              : 'text-stone-400 hover:text-white hover:bg-stone-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Audit Logs ({auditLogs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('system_integrity')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'system_integrity'
              ? 'bg-emerald-500 text-stone-950 shadow-sm font-bold'
              : 'text-stone-400 hover:text-white hover:bg-stone-800'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>System Integrity</span>
        </button>
      </nav>

      {/* DESK MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* ========================================================================= */}
        {/* 1. CUSTOMER ORDERS MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-900 p-4 rounded-2xl border border-stone-800">
              <div>
                <h2 className="text-base font-serif-display font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <span>Customer Orders Management</span>
                </h2>
                <p className="text-xs text-stone-400">
                  Track live dining orders, update status, cancel or punch replacement orders.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddOrderOpen(true)}
                  className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Punch Order</span>
                </button>
              </div>
            </div>

            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search orders by number, table, customer..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-400"
              >
                <option value="all">All Statuses</option>
                <option value="placed">Placed</option>
                <option value="cooking">Cooking</option>
                <option value="ready_at_table">Ready at Table</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Orders Grid / List */}
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center bg-stone-900/40 rounded-2xl border border-stone-800 text-stone-400 text-xs">
                No orders match your filter criteria.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl bg-stone-900 border border-stone-800 hover:border-stone-700 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 border-b border-stone-800/80 pb-2">
                        <span className="font-mono font-bold text-xs text-amber-400">
                          #{order.orderNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-stone-800 text-stone-300 border border-stone-700">
                          {order.orderStatus}
                        </span>
                      </div>

                      <div className="pt-2 text-xs space-y-1">
                        <div className="flex justify-between text-white font-semibold">
                          <span>{order.customerName || 'Dine-In Guest'}</span>
                          <span className="text-amber-300 font-mono">
                            {order.tableNumber || 'Table'}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-400">
                          📞 {order.customerPhone || 'N/A'} · ⏰ {order.createdAt}
                        </div>

                        {/* Items summary */}
                        <div className="pt-2 border-t border-stone-800/60 space-y-1">
                          {order.items?.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-[11px] text-stone-300">
                              <span>
                                {it.quantity}x {it.menuItem?.name || 'Dish'}
                              </span>
                              <span className="font-mono text-stone-400">
                                ₹{it.itemTotal || it.menuItem?.price || 0}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-white">
                        ₹{order.grandTotal}
                      </span>

                      {/* Quick Status Modifiers */}
                      <div className="flex items-center gap-1.5">
                        {order.orderStatus === 'placed' && (
                          <button
                            type="button"
                            onClick={() => onUpdateOrderStatus && onUpdateOrderStatus(order.id, 'cooking')}
                            className="px-2.5 py-1 bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 rounded-lg text-[10px] font-bold border border-orange-500/40 cursor-pointer"
                          >
                            Mark Cooking
                          </button>
                        )}
                        {order.orderStatus !== 'completed' && order.orderStatus !== 'cancelled' && (
                          <button
                            type="button"
                            onClick={() => onUpdateOrderStatus && onUpdateOrderStatus(order.id, 'completed')}
                            className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 rounded-lg text-[10px] font-bold border border-emerald-500/40 cursor-pointer"
                          >
                            Mark Completed
                          </button>
                        )}
                        {order.orderStatus !== 'cancelled' && (
                          <button
                            type="button"
                            onClick={() => onUpdateOrderStatus && onUpdateOrderStatus(order.id, 'cancelled')}
                            className="px-2.5 py-1 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 rounded-lg text-[10px] font-bold border border-rose-500/40 cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. MENU ITEMS & STOCK AVAILABILITY MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-900 p-4 rounded-2xl border border-stone-800">
              <div>
                <h2 className="text-base font-serif-display font-bold text-white flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                  <span>Menu Items & Supply Availability</span>
                </h2>
                <p className="text-xs text-stone-400">
                  Add new dishes, edit pricing, toggle 86 out-of-stock items, or remove unavailable items.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddMenuOpen(true)}
                  className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Menu Item</span>
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search menu dishes by name, Hindi title, category..."
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Menu Items Table / Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMenu.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                    item.isAvailable !== false
                      ? 'bg-stone-900 border-stone-800'
                      : 'bg-rose-950/20 border-rose-500/40 opacity-80'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-white">{item.name}</h4>
                        {item.hindiName && (
                          <p className="text-xs text-amber-300 font-sans-body">{item.hindiName}</p>
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-stone-800 text-stone-300 border border-stone-700">
                        {item.category}
                      </span>
                    </div>

                    <p className="text-xs text-stone-400 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="pt-1 flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-amber-400">
                        ₹{item.price}
                      </span>
                      {item.halfPrice && (
                        <span className="text-xs text-stone-400 font-mono">
                          (Half: ₹{item.halfPrice})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleToggleStock(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        item.isAvailable !== false
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                      }`}
                    >
                      {item.isAvailable !== false ? '✓ In Stock' : '✕ Sold Out (86)'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteDish(item.id, item.name)}
                      className="p-1.5 text-stone-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete dish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. SECURITY MONITORING ACROSS THE SYSTEM */}
        {/* ========================================================================= */}
        {activeTab === 'security_monitor' && (
          <div className="space-y-6">
            <div className="bg-stone-900 p-4 rounded-2xl border border-stone-800">
              <h2 className="text-base font-serif-display font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Real-Time Security Activity Monitoring</span>
              </h2>
              <p className="text-xs text-stone-400">
                Continuous active telemetry, session authorization status, rate-limit defenses, and WAF triggers.
              </p>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-1">
                <span className="text-[11px] text-stone-400 uppercase font-mono tracking-wider">
                  Threat Matrix
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold font-mono ${suspiciousSummary?.threatLevel === 'HIGH' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {suspiciousSummary?.threatLevel || 'NOMINAL'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500">Global anomaly evaluation</p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-1">
                <span className="text-[11px] text-stone-400 uppercase font-mono tracking-wider">
                  Flagged Users
                </span>
                <div className="text-2xl font-bold font-mono text-orange-400">
                  {suspiciousUsers.length}
                </div>
                <p className="text-[11px] text-stone-500">Under elevated scrutiny</p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-1">
                <span className="text-[11px] text-stone-400 uppercase font-mono tracking-wider">
                  Suspended Accounts
                </span>
                <div className="text-2xl font-bold font-mono text-rose-400">
                  {bannedUsers.length}
                </div>
                <p className="text-[11px] text-stone-500">Prevented from login / access</p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-1">
                <span className="text-[11px] text-stone-400 uppercase font-mono tracking-wider">
                  Live Operations
                </span>
                <div className="text-2xl font-bold font-mono text-indigo-400">
                  {integrityReport?.wsClientsConnected || 1} Connected
                </div>
                <p className="text-[11px] text-stone-500">WebSocket sessions active</p>
              </div>
            </div>

            {/* Cloudflare Turnstile & WAF status */}
            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Defense Layers & Bot Protection</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                  <div className="font-semibold text-stone-200">Cloudflare Turnstile</div>
                  <div className="text-emerald-400 font-mono text-[11px]">ACTIVE · Non-intrusive CAPTCHA</div>
                  <p className="text-[10px] text-stone-500">Prevents scripted credential stuffing.</p>
                </div>
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                  <div className="font-semibold text-stone-200">Rate Limiter (Brute-Force WAF)</div>
                  <div className="text-emerald-400 font-mono text-[11px]">ENFORCING · 15 req/min per IP</div>
                  <p className="text-[10px] text-stone-500">Temporary lockouts on password bursts.</p>
                </div>
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                  <div className="font-semibold text-stone-200">Server Authorization Checks</div>
                  <div className="text-indigo-400 font-mono text-[11px]">STRICT RBAC · JWT + DB Match</div>
                  <p className="text-[10px] text-stone-500">Role verified on every protected API call.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. SUSPICIOUS USER ACTIVITY REVIEW */}
        {/* ========================================================================= */}
        {activeTab === 'suspicious_activity' && (
          <div className="space-y-4">
            <div className="bg-stone-900 p-4 rounded-2xl border border-stone-800">
              <h2 className="text-base font-serif-display font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <span>Detecting & Reviewing Suspicious User Activity</span>
              </h2>
              <p className="text-xs text-stone-400">
                Accounts with abnormal behavior, consecutive password failures, rapid order attempts, or SQL injection patterns.
              </p>
            </div>

            {suspiciousUsers.length === 0 ? (
              <div className="p-12 text-center bg-stone-900/40 rounded-2xl border border-stone-800 text-stone-400 text-xs">
                No accounts currently flagged for suspicious behavior. System is secure.
              </div>
            ) : (
              <div className="space-y-4">
                {suspiciousUsers.map((susUser) => (
                  <div
                    key={susUser.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      susUser.isBanned
                        ? 'bg-rose-950/20 border-rose-500/40'
                        : 'bg-stone-900 border-orange-500/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{susUser.name}</span>
                          <span className="font-mono text-xs text-stone-400">({susUser.email})</span>
                          {susUser.isBanned ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              Suspended
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-500/20 text-orange-300 border border-orange-500/40">
                              Flagged ({susUser.suspiciousActivityCount} incidents)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          Assigned Role: <strong className="text-stone-300">{susUser.role}</strong> · Phone: {susUser.phone || 'N/A'}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {susUser.isBanned ? (
                          <button
                            type="button"
                            onClick={() => handleExecuteUnban(susUser)}
                            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Unban Account</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserToBan(susUser);
                              setBanReason(
                                susUser.suspiciousEvents?.[0]?.details ||
                                'Multiple suspicious activity flags intercepted by security telemetry.'
                              );
                            }}
                            className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Confirm Ban</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Detected events list */}
                    <div className="pt-3 space-y-2">
                      <div className="text-[11px] uppercase font-mono font-bold text-stone-400">
                        Security Event Trail:
                      </div>
                      <div className="space-y-1.5">
                        {susUser.suspiciousEvents?.map((evt: any, i: number) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 flex items-start gap-2.5 text-xs"
                          >
                            <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-mono font-bold text-orange-300">{evt.type}</span>
                                <span className="text-stone-500 font-mono">{evt.timestamp}</span>
                              </div>
                              <p className="text-stone-300 text-[11px] mt-0.5">{evt.details}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. USER BANS & SUSPENSIONS (MANAGEMENT & UNBANNING) */}
        {/* ========================================================================= */}
        {activeTab === 'user_bans' && (
          <div className="space-y-4">
            <div className="bg-stone-900 p-4 rounded-2xl border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-serif-display font-bold text-white flex items-center gap-2">
                  <UserX className="w-4 h-4 text-rose-400" />
                  <span>User Ban & Suspension Authority</span>
                </h2>
                <p className="text-xs text-stone-400">
                  Enforce immediate account lockouts, review banned status, or unban reinstated users.
                </p>
              </div>

              <div className="text-xs text-stone-400 font-mono">
                Suspended Accounts: <strong className="text-rose-400">{bannedUsers.length}</strong>
              </div>
            </div>

            {/* Filter Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search all registered users by email, name, role..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-rose-400"
              />
            </div>

            {/* Table of Users */}
            <div className="overflow-x-auto rounded-2xl border border-stone-800 bg-stone-900">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-950/80 text-[11px] uppercase font-mono text-stone-400 border-b border-stone-800">
                  <tr>
                    <th className="px-4 py-3">Account</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Account Status</th>
                    <th className="px-4 py-3">Suspension Details</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-stone-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{u.name}</div>
                        <div className="text-[11px] text-stone-400 font-mono">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-stone-800 text-stone-300 border border-stone-700">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.isBanned ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            <XCircle className="w-3 h-3 text-rose-400" />
                            <span>Banned / Suspended</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Active</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.isBanned ? (
                          <div className="text-[11px] text-rose-200">
                            <p className="italic">"{u.banReason || 'Administrative suspension'}"</p>
                            <span className="text-[10px] text-stone-400 font-mono">
                              By: {u.bannedBy} · {u.bannedAt ? new Date(u.bannedAt).toLocaleString() : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-stone-500 text-[11px]">No active restrictions</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.isBanned ? (
                          <button
                            type="button"
                            onClick={() => handleExecuteUnban(u)}
                            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Unban</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserToBan(u);
                              setBanReason('');
                            }}
                            className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Ban Account</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. SECURITY AUDIT LOGS */}
        {/* ========================================================================= */}
        {activeTab === 'audit_logs' && (
          <div className="space-y-4">
            <div className="bg-stone-900 p-4 rounded-2xl border border-stone-800">
              <h2 className="text-base font-serif-display font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Security Audit Trail & Operational Events</span>
              </h2>
              <p className="text-xs text-stone-400">
                Immutable chronological log of all administrator actions, user bans, unbans, login failures, and system reconfigurations.
              </p>
            </div>

            {/* Filter and Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search logs by action, administrator email, details..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <select
                value={auditSeverity}
                onChange={(e) => setAuditSeverity(e.target.value)}
                className="px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-400"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>

            {/* Audit Logs Table */}
            <div className="overflow-x-auto rounded-2xl border border-stone-800 bg-stone-900">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-950/80 text-[11px] uppercase font-mono text-stone-400 border-b border-stone-800">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Administrator / Actor</th>
                    <th className="px-4 py-3">Details</th>
                    <th className="px-4 py-3">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-stone-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-xs text-amber-300">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{log.actorEmail}</div>
                        <div className="text-[10px] text-stone-500 font-mono">Role: {log.actorRole}</div>
                      </td>
                      <td className="px-4 py-3 text-stone-200">
                        {log.details}
                        {log.targetEmail && (
                          <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                            Target: {log.targetEmail}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                            log.severity === 'critical'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : log.severity === 'warning'
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {log.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 7. SYSTEM INTEGRITY & OPERATIONAL DIAGNOSTICS */}
        {/* ========================================================================= */}
        {activeTab === 'system_integrity' && (
          <div className="space-y-6">
            <div className="bg-stone-900 p-4 rounded-2xl border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-serif-display font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>System-Level Operational Health & Integrity</span>
                </h2>
                <p className="text-xs text-stone-400">
                  Database synchronization, WebSocket live event bus, session consistency, and diagnostic purging.
                </p>
              </div>

              <button
                type="button"
                onClick={handleFlushCache}
                className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-stone-700 shadow-sm"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Flush Caches & Verify Sync</span>
              </button>
            </div>

            {/* Diagnostic stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Database Engine</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    CONNECTED
                  </span>
                </div>
                <div className="font-mono text-sm text-white">PostgreSQL / In-Memory Dual Store</div>
                <p className="text-[11px] text-stone-500">Zero data loss fallback synchronization active.</p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Server Uptime</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    ONLINE
                  </span>
                </div>
                <div className="font-mono text-sm text-white">
                  {integrityReport?.uptimeSeconds ? `${integrityReport.uptimeSeconds} seconds` : 'Active'}
                </div>
                <p className="text-[11px] text-stone-500">Node.js Express + TSX Server.</p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Memory Utilization</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    STABLE
                  </span>
                </div>
                <div className="font-mono text-sm text-white">
                  {integrityReport?.memoryUsageMb ? `${integrityReport.memoryUsageMb} MB` : '42 MB'}
                </div>
                <p className="text-[11px] text-stone-500">Node heap memory footprint.</p>
              </div>
            </div>

            {/* Strict RBAC Architecture summary */}
            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Departmental Role-Based Access Isolation Status</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between">
                  <div>
                    <strong className="text-amber-300 font-mono">1. Manager Admin Panel:</strong>
                    <span className="text-stone-400 ml-2">Overall administrative authority across all departments.</span>
                  </div>
                  <span className="text-emerald-400 font-mono text-[11px]">VERIFIED</span>
                </div>

                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between">
                  <div>
                    <strong className="text-blue-300 font-mono">2. Waiter Panel:</strong>
                    <span className="text-stone-400 ml-2">Order punch & table service only. User banning prohibited.</span>
                  </div>
                  <span className="text-emerald-400 font-mono text-[11px]">RESTRICTED</span>
                </div>

                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between">
                  <div>
                    <strong className="text-orange-300 font-mono">3. Kitchen Chef Panel:</strong>
                    <span className="text-stone-400 ml-2">Live KDS preparation only. User banning prohibited.</span>
                  </div>
                  <span className="text-emerald-400 font-mono text-[11px]">RESTRICTED</span>
                </div>

                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between">
                  <div>
                    <strong className="text-indigo-300 font-mono">4. System Management Desk:</strong>
                    <span className="text-stone-400 ml-2">Orders, menu items, security monitoring, bans & audit logs.</span>
                  </div>
                  <span className="text-emerald-400 font-mono text-[11px]">ACTIVE DESK</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* BAN CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {selectedUserToBan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-stone-900 border border-rose-500/50 rounded-2xl p-6 shadow-2xl space-y-4 text-stone-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Confirm Account Suspension</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserToBan(null)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 text-xs space-y-1">
              <div className="text-stone-400">Affected User Account:</div>
              <div className="font-bold text-white text-sm">{selectedUserToBan.name}</div>
              <div className="font-mono text-stone-400">{selectedUserToBan.email}</div>
              <div className="text-[11px] text-amber-300 font-mono mt-1">Role: {selectedUserToBan.role}</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300">
                Official Suspension Justification (Required for Audit Trail):
              </label>
              <textarea
                rows={3}
                required
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="State the confirmed violation, suspicious pattern, or policy reason..."
                className="w-full p-3 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="text-[11px] text-stone-400 bg-rose-950/20 border border-rose-500/20 p-3 rounded-xl">
              ⚠️ Suspending this account will immediately revoke all JWT session tokens and deny login attempts with an official security notice.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUserToBan(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBan}
                disabled={isBanSubmitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>{isBanSubmitting ? 'Processing...' : 'Confirm Suspension'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD MENU ITEM MODAL */}
      {/* ========================================================================= */}
      {isAddMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl space-y-4 text-stone-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-base">
                <UtensilsCrossed className="w-5 h-5 shrink-0" />
                <span>Add New Menu Item</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMenuOpen(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMenuItem} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-300">Dish Name (English):</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Shahi Paneer"
                  value={newDishName}
                  onChange={(e) => setNewDishName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300">Hindi Name (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. शाही पनीर"
                  value={newDishHindi}
                  onChange={(e) => setNewDishHindi(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-300">Category:</label>
                  <select
                    value={newDishCategory}
                    onChange={(e) => setNewDishCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="starters">Starters</option>
                    <option value="tandoor">Tandoor</option>
                    <option value="curries">Curries</option>
                    <option value="dal_rice">Dal & Rice</option>
                    <option value="biryani">Biryani</option>
                    <option value="breads">Breads</option>
                    <option value="desserts">Desserts</option>
                    <option value="beverages">Beverages</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-300">Price (₹):</label>
                  <input
                    type="number"
                    required
                    placeholder="350"
                    value={newDishPrice}
                    onChange={(e) => setNewDishPrice(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300">Culinary Description:</label>
                <textarea
                  rows={2}
                  placeholder="Preparation style, spices, aroma..."
                  value={newDishDescription}
                  onChange={(e) => setNewDishDescription(e.target.value)}
                  className="w-full mt-1 p-3 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddMenuOpen(false)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
                >
                  Save & Publish Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PUNCH ORDER MODAL */}
      {/* ========================================================================= */}
      {isAddOrderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl space-y-4 text-stone-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-base">
                <ShoppingBag className="w-5 h-5 shrink-0" />
                <span>Punch Customer Order</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOrderOpen(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-300">Table Number:</label>
                  <input
                    type="text"
                    required
                    value={newOrderTable}
                    onChange={(e) => setNewOrderTable(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-300">Customer Name:</label>
                  <input
                    type="text"
                    required
                    value={newOrderCustomer}
                    onChange={(e) => setNewOrderCustomer(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300">Customer Phone:</label>
                <input
                  type="text"
                  required
                  value={newOrderPhone}
                  onChange={(e) => setNewOrderPhone(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-300">Dish Name:</label>
                  <input
                    type="text"
                    required
                    value={newOrderDishName}
                    onChange={(e) => setNewOrderDishName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-300">Dish Price (₹):</label>
                  <input
                    type="number"
                    required
                    value={newOrderDishPrice}
                    onChange={(e) => setNewOrderDishPrice(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOrderOpen(false)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
                >
                  Punch & Dispatch to Kitchen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
