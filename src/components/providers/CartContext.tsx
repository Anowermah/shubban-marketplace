'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type DeliveryZone = 'DHAKA_METRO' | 'OUTSIDE_DHAKA' | 'EXPRESS';

export interface CartItem {
  id: string; // bookId
  variantId?: string | null;
  variantTitle?: string | null;
  sku?: string | null;
  title: string;
  slug: string;
  price: number;
  type: 'PHYSICAL' | 'DIGITAL';
  coverImage: string;
  authorName: string;
  quantity: number;
  maxStock?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string, type: 'PHYSICAL' | 'DIGITAL', variantId?: string | null) => void;
  updateQuantity: (id: string, type: 'PHYSICAL' | 'DIGITAL', quantity: number, variantId?: string | null) => void;
  updateVariant: (id: string, oldVariantId: string | null | undefined, newVariantId: string, newVariantTitle: string, newPrice: number) => void;
  clearCart: () => void;
  deliveryZone: DeliveryZone;
  setDeliveryZone: (zone: DeliveryZone) => void;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  appliedCoupon: string | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  isShippingFree: boolean;
}

const CartContext = createContext<CartContextType | null>(null);

const FREE_SHIPPING_THRESHOLD = 1500; // ৳1500 or more gets free shipping in Dhaka

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [deliveryZone, setDeliveryZone] = useState<DeliveryZone>('DHAKA_METRO');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discount, setDiscount] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('shubban_cart_v2') || localStorage.getItem('shubban_cart');
      if (saved) {
        setItems(JSON.parse(saved));
      }
      const savedZone = localStorage.getItem('shubban_delivery_zone') as DeliveryZone;
      if (savedZone) {
        setDeliveryZone(savedZone);
      }
    } catch (e) {
      console.error('Error loading cart', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('shubban_cart_v2', JSON.stringify(items));
      localStorage.setItem('shubban_delivery_zone', deliveryZone);
    }
  }, [items, deliveryZone, isLoaded]);

  const addItem = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const qty = item.quantity || 1;
    const itemVarId = item.variantId || null;

    setItems((prev) => {
      const index = prev.findIndex(
        (i) => i.id === item.id && i.type === item.type && (i.variantId || null) === itemVarId
      );

      if (index > -1) {
        const next = [...prev];
        const newQty = next[index].quantity + qty;
        const maxStock = item.maxStock || next[index].maxStock;
        next[index].quantity = maxStock ? Math.min(newQty, maxStock) : newQty;
        return next;
      }

      return [...prev, { ...item, variantId: itemVarId, quantity: qty }];
    });
  };

  const removeItem = (id: string, type: 'PHYSICAL' | 'DIGITAL', variantId?: string | null) => {
    const vId = variantId || null;
    setItems((prev) =>
      prev.filter((i) => !(i.id === id && i.type === type && (i.variantId || null) === vId))
    );
  };

  const updateQuantity = (
    id: string,
    type: 'PHYSICAL' | 'DIGITAL',
    quantity: number,
    variantId?: string | null
  ) => {
    const vId = variantId || null;
    if (quantity <= 0) {
      removeItem(id, type, vId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === id && i.type === type && (i.variantId || null) === vId) {
          const clamped = i.maxStock ? Math.min(quantity, i.maxStock) : quantity;
          return { ...i, quantity: clamped };
        }
        return i;
      })
    );
  };

  const updateVariant = (
    id: string,
    oldVariantId: string | null | undefined,
    newVariantId: string,
    newVariantTitle: string,
    newPrice: number
  ) => {
    const oldV = oldVariantId || null;
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === id && (i.variantId || null) === oldV) {
          return {
            ...i,
            variantId: newVariantId,
            variantTitle: newVariantTitle,
            price: newPrice,
          };
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setDiscount(0);
    localStorage.removeItem('shubban_cart_v2');
    localStorage.removeItem('shubban_cart');
  };

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Physical vs Digital delivery check
  const hasPhysical = items.some((i) => i.type === 'PHYSICAL');

  const isShippingFree = hasPhysical && subtotal >= FREE_SHIPPING_THRESHOLD && deliveryZone === 'DHAKA_METRO';

  let shippingFee = 0;
  if (!hasPhysical || subtotal === 0) {
    shippingFee = 0;
  } else if (isShippingFree) {
    shippingFee = 0;
  } else {
    switch (deliveryZone) {
      case 'OUTSIDE_DHAKA':
        shippingFee = 110;
        break;
      case 'EXPRESS':
        shippingFee = 130;
        break;
      default:
        shippingFee = 60;
        break;
    }
  }

  // Server-side Coupon validation function
  const applyCoupon = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return { success: false, message: 'কুপন কোড দিন।' };

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode, subtotal }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon(data.code);
        setDiscount(data.discount);
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'কুপনটি প্রযোজ্য নয়।' };
      }
    } catch (e) {
      return { success: false, message: 'কুপন যাচাই করতে সমস্যা হয়েছে।' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
  };

  const total = Math.max(0, subtotal + shippingFee - discount);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateVariant,
        clearCart,
        deliveryZone,
        setDeliveryZone,
        subtotal,
        shippingFee,
        discount,
        total,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        isShippingFree,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
