'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Product {
    Pid: number;
    Pname: string;
    Pprice: number;
    Ppicture: string;
    quantity?: number;
    [key: string]: any;
}

interface CartContextType {
    cartCount: number;
    addToCart: (product: Product) => void;
    refreshCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cartCount, setCartCount] = useState(0);

    const updateCount = () => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const count = cart.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
        setCartCount(count);
    };

    useEffect(() => {
        updateCount();

        // Listen for storage events (in case of multiple tabs)
        const handleStorageChange = () => {
            updateCount();
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const addToCart = (product: Product) => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingIndex = cart.findIndex((item: any) => item.Pid === product.Pid);

        if (existingIndex !== -1) {
            cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
        } else {
            cart.push({
                Pid: product.Pid,
                Pname: product.Pname,
                Pprice: Number(product.Pprice),
                Ppicture: product.Ppicture.split(",")[0],
                quantity: 1,
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        updateCount();
    };

    const refreshCart = () => {
        updateCount();
    };

    return (
        <CartContext.Provider value={{ cartCount, addToCart, refreshCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
