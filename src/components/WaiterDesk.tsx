import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Plus,
  Minus,
  Trash2,
  Send,
  Store,
  Clock,
  Search,
  Sparkles,
  Bike,
  UtensilsCrossed,
  ChefHat,
  Receipt,
  User,
  Phone,
} from 'lucide-react';
import { Order, MenuItem, DiningTable } from '../types/restaurant';

interface Props {
  orders: Order[];
  menuItems: MenuItem[];
  diningTables: DiningTable[];
  lang: 'en' | 'hi';
  waiterName: string;
  onOrderPunched: (newOrder: Partial<Order>) => void;
  onMarkServed: (orderId: string) => void;
  onHandoverDelivery: (orderId: string) => void;
  showNotification: (msg: string) => void;
}

export const WaiterDesk: React.FC<Props> = ({
  orders,
  menuItems,
  diningTables,
  lang,
  waiterName,
  onOrderPunched,
  onMarkServed,
  onHandoverDelivery,
  showNotification,
}) => {
  // Waiter feed form state
  const [selectedTable, setSelectedTable] = useState<string>('Table 1');
  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cartItems, setCartItems] = useState<
    Array<{
      menuItem: MenuItem;
      quantity: number;
      portion: 'full' | 'half';
      spiceLevel: 0 | 1 | 2 | 3;
      itemTotal: number;
    }>
  >([]);

  // Filter food items prepared from kitchen waiting for waiter action
  const preparedOrders = orders.filter(
    (o) =>
      o.orderStatus === 'ready_at_table' ||
      (o.bookingType === 'dine_in' && o.orderStatus === 'out_for_delivery') ||
      o.orderStatus === 'ready_for_dispatch'
  );

  const categories = [
    { id: 'all', labelHi: 'सभी', labelEn: 'All' },
    { id: 'starters', labelHi: 'स्टार्टर्स', labelEn: 'Starters' },
    { id: 'curries', labelHi: 'शाही सब्जियां', labelEn: 'Curries' },
    { id: 'biryani', labelHi: 'बिरयानी', labelEn: 'Biryani' },
    { id: 'breads', labelHi: 'रोटी व नान', labelEn: 'Breads' },
    { id: 'desserts', labelHi: 'मिठाई', labelEn: 'Desserts' },
    { id: 'beverages', labelHi: 'पेय', labelEn: 'Beverages' },
  ];

  const filteredMenu = menuItems
    .filter((m) => (selectedCategory === 'all' ? true : m.category === selectedCategory))
    .filter((m) =>
      searchQuery
        ? m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.hindiName && m.hindiName.includes(searchQuery))
        : true
    );

  const addItemToCart = (item: MenuItem) => {
    if (item.isAvailable === false) {
      showNotification(lang === 'hi' ? 'यह व्यंजन आज उपलब्ध नहीं है (86)!' : 'This dish is currently Sold Out (86)!');
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((i) => i.menuItem.id === item.id && i.portion === 'full');
      if (existing) {
        return prev.map((i) =>
          i.menuItem.id === item.id && i.portion === 'full'
            ? { ...i, quantity: i.quantity + 1, itemTotal: (i.quantity + 1) * item.price }
            : i
        );
      }
      return [
        ...prev,
        {
          menuItem: item,
          quantity: 1,
          portion: 'full',
          spiceLevel: item.spiceLevel || 1,
          itemTotal: item.price,
        },
      ];
    });
  };

  const updateCartQty = (idx: number, delta: number) => {
    setCartItems((prev) => {
      const updated = [...prev];
      const item = updated[idx];
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== idx);
      }
      updated[idx] = {
        ...item,
        quantity: newQty,
        itemTotal: newQty * item.menuItem.price,
      };
      return updated;
    });
  };

  const subtotal = cartItems.reduce((sum, i) => sum + i.itemTotal, 0);
  const gstAmount = Math.round(subtotal * 0.05 * 100) / 100;
  const grandTotal = Math.round((subtotal + gstAmount) * 100) / 100;

  const handlePunchOrder = async () => {
    if (!selectedTable) {
      alert('Please select a dining table!');
      return;
    }
    if (cartItems.length === 0) {
      alert('Please add at least one dish to punch the order!');
      return;
    }

    const orderNumber = `MAH-${Math.floor(100000 + Math.random() * 900000)}`;
    const formattedItems = cartItems.map((ci) => ({
      cartItemId: `${ci.menuItem.id}_${ci.portion}`,
      menuItem: ci.menuItem,
      quantity: ci.quantity,
      portion: ci.portion,
      spiceLevel: ci.spiceLevel,
      itemTotal: ci.itemTotal,
      unitPrice: ci.menuItem.price,
    }));

    const newOrder: Partial<Order> = {
      orderNumber,
      userId: 'waiter_punch',
      customerName: guestName.trim() || `${selectedTable} Guest`,
      customerPhone: guestPhone.trim() || '+91 98000 00000',
      bookingType: 'dine_in',
      tableNumber: selectedTable,
      items: formattedItems as any,
      subtotal,
      gstAmount,
      deliveryFee: 0,
      discountAmount: 0,
      grandTotal,
      paymentMethod: 'pay_at_counter',
      paymentStatus: 'pending',
      orderStatus: 'placed',
      notes: orderNotes.trim() ? `${orderNotes.trim()} (Punched by ${waiterName})` : `Punched by ${waiterName}`,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    try {
      await fetch('/api/waiter/feed-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newOrder,
          waiterName,
        }),
      });
    } catch {}

    onOrderPunched(newOrder);
    setCartItems([]);
    setGuestName('');
    setGuestPhone('');
    setOrderNotes('');
    showNotification(
      lang === 'hi'
        ? `✅ ऑर्डर #${orderNumber} (${selectedTable}) किचन को भेजा गया!`
        : `✅ Order #${orderNumber} for ${selectedTable} dispatched to Kitchen!`
    );
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. READY TO SERVE ALERTS */}
      {/* ========================================================================= */}
      <section className="space-y-2">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <h3 className="font-semibold text-xs text-stone-200">
              {lang === 'hi' ? 'परोसने हेतु तैयार' : 'Ready to Serve'}
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
            {preparedOrders.length} {lang === 'hi' ? 'तैयार' : 'Ready'}
          </span>
        </div>

        {preparedOrders.length === 0 ? (
          <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 text-center text-stone-500 text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{lang === 'hi' ? 'सभी ऑर्डर परोसे जा चुके हैं।' : 'All orders served. No pickups pending.'}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {preparedOrders.map((order) => {
              const isDineIn = order.bookingType === 'dine_in';
              return (
                <div
                  key={order.id}
                  className={`p-3 rounded-xl border shadow-md flex flex-col justify-between gap-2.5 animate-fadeIn transition-all ${
                    isDineIn
                      ? 'bg-amber-950/20 border-amber-400/50'
                      : 'bg-purple-950/20 border-purple-400/50'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between border-b border-stone-800/80 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            isDineIn ? 'bg-amber-400 text-stone-950' : 'bg-purple-500 text-white'
                          }`}
                        >
                          {isDineIn ? `🍽️ ${order.tableNumber || 'Table'}` : '🛵 Parcel'}
                        </span>
                        <span className="text-xs font-mono text-stone-300 font-bold">
                          #{order.orderNumber}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-stone-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {order.preparedAt || order.createdAt}
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-400 truncate">
                      {order.customerName} {order.customerPhone ? `(${order.customerPhone})` : ''}
                    </div>

                    {/* Dish Items Breakdown */}
                    <div className="bg-stone-900/80 rounded-lg p-2 border border-stone-800 space-y-1">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] text-stone-200">
                          <span className="font-medium truncate">
                            <span className="text-amber-400 font-bold font-mono mr-1.5">{it.quantity}x</span>
                            {it.menuItem.name}
                          </span>
                          <span className="text-stone-400 text-[10px] font-mono">
                            ₹{it.itemTotal || it.unitPrice || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Waiter Action Buttons */}
                  <div className="pt-0.5">
                    {isDineIn ? (
                      <button
                        type="button"
                        onClick={() => onMarkServed(order.id)}
                        className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{lang === 'hi' ? 'परोस दिया' : 'Mark Served'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onHandoverDelivery(order.id)}
                        className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all"
                      >
                        <Bike className="w-3.5 h-3.5" />
                        <span>{lang === 'hi' ? 'राइडर को सौंपा' : 'Hand Over to Rider'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 2. ORDER FEEDING & PUNCH-IN SECTION */}
      {/* ========================================================================= */}
      <section className="space-y-3 pt-3 border-t border-stone-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
            <h3 className="font-semibold text-xs text-stone-200">
              {lang === 'hi' ? 'नया टेबल ऑर्डर' : 'New Table Order'}
            </h3>
          </div>
          <span className="text-[11px] font-mono text-stone-400">
            {waiterName}
          </span>
        </div>

        {/* Select Dining Table */}
        <div className="space-y-1">
          <span className="text-[11px] text-stone-400 block font-medium">
            {lang === 'hi' ? 'टेबल चुनें:' : 'Select Table:'}
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {diningTables.map((tbl) => {
              const isSelected = selectedTable === tbl.tableNumber;
              const isOccupied = tbl.status === 'occupied';
              return (
                <button
                  key={tbl.id}
                  type="button"
                  onClick={() => setSelectedTable(tbl.tableNumber)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-amber-400 text-stone-950 font-bold border-amber-300 shadow-xs'
                      : isOccupied
                      ? 'bg-stone-900 border-rose-900/60 text-stone-300'
                      : 'bg-stone-950/80 border-stone-800 text-stone-300 hover:border-amber-500/40'
                  }`}
                >
                  <div className="text-xs font-bold">{tbl.tableNumber}</div>
                  <div className={`text-[10px] ${isSelected ? 'text-stone-900 font-semibold' : 'text-stone-500'}`}>
                    {tbl.capacity}P
                  </div>
                  {isOccupied && !isSelected && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Guest Details (Optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-950/70 p-3 rounded-2xl border border-stone-800">
          <div>
            <label className="block text-[11px] text-stone-400 mb-1">
              {lang === 'hi' ? 'अतिथि का नाम' : 'Guest Name'}
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-500" />
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full pl-8 pr-2.5 py-1.5 bg-stone-900 border border-stone-700/80 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-stone-400 mb-1">
              {lang === 'hi' ? 'फोन नंबर' : 'Phone (Optional)'}
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-500" />
              <input
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="+91 98110 00000"
                className="w-full pl-8 pr-2.5 py-1.5 bg-stone-900 border border-stone-700/80 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-stone-400 mb-1">
              {lang === 'hi' ? 'विशेष निर्देश' : 'Special Notes'}
            </label>
            <input
              type="text"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="e.g. Jain, less spicy"
              className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-700/80 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
            />
          </div>
        </div>

        {/* Step 3: Menu Dishes Selection & Punch Cart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Dishes Menu Browser */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === 'hi' ? 'व्यंजन खोजें...' : 'Search dish...'}
                  className="w-full pl-8 pr-3 py-1.5 bg-stone-900 border border-stone-700/80 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
                />
              </div>

              {/* Categories */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === c.id
                        ? 'bg-amber-400 text-stone-950 font-bold'
                        : 'bg-stone-900 text-stone-300 hover:bg-stone-800'
                    }`}
                  >
                    {lang === 'hi' ? c.labelHi : c.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Dishes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredMenu.map((dish) => {
                const isSoldOut = dish.isAvailable === false;
                return (
                  <div
                    key={dish.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                      isSoldOut
                        ? 'bg-stone-950/60 border-stone-800/60 opacity-60'
                        : 'bg-stone-900/90 border-stone-800 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <h4 className="text-xs font-bold text-white truncate">{dish.name}</h4>
                      </div>
                      <div className="text-[11px] text-amber-300 font-mono font-bold">
                        ₹{dish.price}
                        {dish.hindiName && (
                          <span className="text-stone-400 text-[10px] font-normal ml-2 font-sans-body">
                            {dish.hindiName}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSoldOut ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                        86 Sold Out
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addItemToCart(dish)}
                        className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0 transition-transform active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Current Table Order Punch Ticket */}
          <div className="lg:col-span-5 bg-stone-950/90 border border-stone-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-400" />
                  <span className="font-serif-display font-bold text-xs text-white">
                    {lang === 'hi' ? 'ऑर्डर' : 'Order Ticket'}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-amber-400 text-stone-950 text-xs font-bold font-mono">
                  {selectedTable}
                </span>
              </div>

              {cartItems.length === 0 ? (
                <div className="py-12 text-center text-stone-500 text-xs">
                  {lang === 'hi' ? 'व्यंजन चुनें' : 'No items added. Click "+ Add".'}
                </div>
              ) : (
                <div className="divide-y divide-stone-800/80 max-h-[220px] overflow-y-auto space-y-1.5 pr-1 mt-2">
                  {cartItems.map((ci, idx) => (
                    <div key={idx} className="pt-2 flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-white truncate">{ci.menuItem.name}</div>
                        <div className="text-[10px] text-stone-400 font-mono">
                          ₹{ci.menuItem.price} each
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg">
                          <button
                            type="button"
                            onClick={() => updateCartQty(idx, -1)}
                            className="p-1 text-stone-400 hover:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-mono font-bold text-amber-300 text-xs">
                            {ci.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(idx, 1)}
                            className="p-1 text-stone-400 hover:text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-mono font-bold text-white text-xs w-12 text-right">
                          ₹{ci.itemTotal}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calculations & Submit button */}
            <div className="border-t border-stone-800 pt-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-white">₹{subtotal}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>GST (5%):</span>
                <span className="font-mono text-white">₹{gstAmount}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-bold text-amber-300 border-t border-stone-800/60 pt-1.5">
                <span>Grand Total:</span>
                <span className="font-mono text-base">₹{grandTotal}</span>
              </div>

              <button
                type="button"
                onClick={handlePunchOrder}
                disabled={cartItems.length === 0}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
                <span>
                  {lang === 'hi'
                    ? `ऑर्डर भेजें (${selectedTable})`
                    : `Send to Kitchen (${selectedTable})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
