'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

type AnyObj = Record<string, any>;

export interface Product extends AnyObj {
  Pid: number;
  Pname: string;
  Pprice: number;
  Ppicture: string;
  Pnumproduct?: number; // stock จาก DB
}

export interface CartItem extends AnyObj {
  Pid: number;
  Pname: string;
  Pprice: number;
  Ppicture: string;
  quantity: number;
  Pnumproduct: number; // stock ที่เก็บไว้ในตะกร้า
}

interface CartContextType {
  items: CartItem[];
  cartCount: number;
  totalPrice: number;

  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (Pid: number) => void;
  setQty: (Pid: number, qty: number) => void;
  clearCart: () => void;

  refreshCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const readCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem('cart') || '[]');
    if (!Array.isArray(raw)) return [];
    return raw
      .map((it: any) => {
        const qty = Number(it?.quantity);
        const price = Number(it?.Pprice);
        const stock = Number(it?.Pnumproduct);

        const normalized: CartItem = {
          Pid: Number(it?.Pid),
          Pname: String(it?.Pname ?? ''),
          Pprice: Number.isFinite(price) ? price : 0,
          Ppicture: String(it?.Ppicture ?? ''),
          quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
          Pnumproduct: Number.isFinite(stock) && stock >= 0 ? stock : 999999, // ถ้าไม่มี stock ให้ถือว่าเยอะๆ กันพัง
          ...it,
        };

        // clamp qty 1..stock (ถ้า stock = 0 ให้ qty = 1 ก็จริงแต่ใน UI ควรกดไม่ได้อยู่แล้ว)
        const max = Math.max(0, Number(normalized.Pnumproduct));
        normalized.quantity = Math.max(1, Math.min(normalized.quantity, max || 1));
        return normalized;
      })
      .filter((x) => Number.isFinite(x.Pid) && x.Pid > 0);
  } catch {
    return [];
  }
};

const writeCart = (items: CartItem[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('cart', JSON.stringify(items));
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // init
  useEffect(() => {
    setItems(readCart());

    const onStorage = () => setItems(readCart());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const cartCount = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0),
    [items]
  );

  const totalPrice = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.Pprice) || 0) * (Number(it.quantity) || 0), 0),
    [items]
  );

  const refreshCart = () => {
    setItems(readCart());
  };

  const addToCart = (product: Product, qty: number = 1) => {
    const addQty = Math.max(1, Math.floor(Number(qty) || 1));

    setItems((prev) => {
      const next = [...prev];

      const idx = next.findIndex((x) => x.Pid === product.Pid);

      const incomingStock = Number(product.Pnumproduct);
      const stock = Number.isFinite(incomingStock) && incomingStock >= 0 ? incomingStock : 999999;

      const firstPic = String(product.Ppicture || '').split(',')[0]?.trim() || '';

      if (idx !== -1) {
        // ถ้ามีอยู่แล้ว: อัปเดต stock ใหม่ + clamp qty
        const cur = next[idx];
        const mergedStock = Number.isFinite(stock) ? stock : cur.Pnumproduct;

        const desired = (Number(cur.quantity) || 1) + addQty;
        const clamped = Math.min(desired, mergedStock);

        next[idx] = {
          ...cur,
          Pnumproduct: mergedStock,
          quantity: Math.max(1, clamped),
        };
      } else {
        // ถ้ายังไม่มี: ใส่ใหม่ แต่ clamp ไม่เกิน stock
        const clamped = Math.min(addQty, stock);
        next.push({
          Pid: product.Pid,
          Pname: product.Pname,
          Pprice: Number(product.Pprice) || 0,
          Ppicture: firstPic || product.Ppicture || '',
          Pnumproduct: stock,
          quantity: Math.max(1, clamped),
        });
      }

      writeCart(next);
      return next;
    });
  };

  const removeFromCart = (Pid: number) => {
    setItems((prev) => {
      const next = prev.filter((x) => x.Pid !== Pid);
      writeCart(next);
      return next;
    });
  };

  const setQty = (Pid: number, qty: number) => {
    const v = Math.floor(Number(qty) || 1);

    setItems((prev) => {
      const next = prev.map((it) => {
        if (it.Pid !== Pid) return it;

        const max = Number(it.Pnumproduct);
        const stock = Number.isFinite(max) && max >= 0 ? max : 999999;

        return {
          ...it,
          quantity: Math.max(1, Math.min(v, stock || 1)),
        };
      });

      writeCart(next);
      return next;
    });
  };

  const clearCart = () => {
    setItems([]);
    writeCart([]);
  };

  const value: CartContextType = {
    items,
    cartCount,
    totalPrice,
    addToCart,
    removeFromCart,
    setQty,
    clearCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};
