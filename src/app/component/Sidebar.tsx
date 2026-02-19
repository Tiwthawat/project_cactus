'use client';
import React, { useEffect, useRef } from 'react';
import {
    FaTimes,
    FaSearch,
    FaShoppingCart,
    FaListUl,
    FaUser,
    FaGavel,
    FaHistory,
    FaTrophy,
    FaSignOutAlt,
    FaQuestionCircle,
    FaBook,
    FaComments,
    FaShieldAlt,
    FaInfoCircle,
    FaHome
} from 'react-icons/fa';
import Link from 'next/link';
import CartPanel from '../(customer)/cart/CartPanel';

interface CategoryEventDetail {
    typeid: number | null;
    subtypeid: number | null;
}

const emitCategory = (detail: CategoryEventDetail) => {
    window.dispatchEvent(
        new CustomEvent("select-category", { detail })
    );
};

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'user' | 'categories' | 'search' | 'cart' | 'menu' | null;
    username: string | null;
    cartCount: number;
    handleLogout: () => void;
    setMode: (mode: 'user' | 'categories' | 'search' | 'cart' | 'menu' | null) => void;
    role: 'user' | 'admin' | null; 
}

const categories = [
    { id: 1, label: 'แคคตัสหนามสั้น', emoji: '🌵' },
    { id: 2, label: 'แคคตัสหนามยาว', emoji: '🌾' },
    { id: 3, label: 'ไม้อวบน้ำ', emoji: '🪴' },
    { id: 4, label: 'ของตกแต่งกระถาง', emoji: '✨' },
];

const Sidebar = ({ isOpen, onClose, mode, username, cartCount, handleLogout, setMode }: SidebarProps) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && mode === 'search') {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen, mode]);

    const renderContent = () => {
        switch (mode) {
            case 'user':
                return (
                    <div className="sidebar-content-wrapper">
                        {/* Avatar Hero */}
                        <div className="avatar-hero">
                            <div className="avatar-glow" />
                            <div className="avatar-ring">
                                <div className="avatar-circle">
                                    {username?.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className="avatar-info">
                                <span className="welcome-label">ยินดีต้อนรับกลับมา</span>
                                <span className="username-text">{username}</span>
                            </div>
                        </div>

                        <div className="menu-section">
                            <Link href="/me" onClick={onClose} className="menu-item">
                                <div className="menu-icon-wrap" style={{ '--icon-color': '#3b82f6', '--icon-bg': '#eff6ff' } as React.CSSProperties}>
                                    <FaUser />
                                </div>
                                <span className="menu-label">โปรไฟล์ของฉัน</span>
                                <span className="menu-arrow">›</span>
                            </Link>

                            <Link href="/me/my-bidding" onClick={onClose} className="menu-item">
                                <div className="menu-icon-wrap" style={{ '--icon-color': '#f97316', '--icon-bg': '#fff7ed' } as React.CSSProperties}>
                                    <FaGavel />
                                </div>
                                <span className="menu-label">รายการประมูลของฉัน</span>
                                <span className="menu-arrow">›</span>
                            </Link>

                            <Link href="/me/orders" onClick={onClose} className="menu-item">
                                <div className="menu-icon-wrap" style={{ '--icon-color': '#8b5cf6', '--icon-bg': '#f5f3ff' } as React.CSSProperties}>
                                    <FaHistory />
                                </div>
                                <span className="menu-label">ประวัติคำสั่งซื้อ</span>
                                <span className="menu-arrow">›</span>
                            </Link>

                            <Link href="/me/auction-wins" onClick={onClose} className="menu-item">
                                <div className="menu-icon-wrap" style={{ '--icon-color': '#eab308', '--icon-bg': '#fefce8' } as React.CSSProperties}>
                                    <FaTrophy />
                                </div>
                                <span className="menu-label">สินค้าที่ชนะประมูล</span>
                                <span className="menu-arrow">›</span>
                            </Link>
                        </div>

                        <div className="divider" />

                        <button
                            onClick={() => { handleLogout(); onClose(); }}
                            className="logout-btn"
                        >
                            <div className="menu-icon-wrap" style={{ '--icon-color': '#ef4444', '--icon-bg': '#fef2f2' } as React.CSSProperties}>
                                <FaSignOutAlt />
                            </div>
                            <span className="menu-label logout-label">ออกจากระบบ</span>
                        </button>
                    </div>
                );

            case 'categories':
                return (
                    <div className="sidebar-content-wrapper">
                        <div className="section-header">
                            <div className="section-header-icon">
                                <FaListUl />
                            </div>
                            <div>
                                <span className="section-title">หมวดหมู่</span>
                                <span className="section-subtitle">เลือกประเภทสินค้า</span>
                            </div>
                        </div>

                        <div className="cat-all-btn-wrap">
                            <button
                                onClick={() => { emitCategory({ typeid: null, subtypeid: null }); onClose(); }}
                                className="cat-all-btn"
                            >
                                <span>🌿</span>
                                <span>สินค้าทั้งหมด</span>
                            </button>
                        </div>

                        <div className="cat-list">
                            {categories.map((cat, i) => (
                                <button
                                    key={cat.id}
                                    onClick={() => { emitCategory({ typeid: cat.id, subtypeid: null }); onClose(); }}
                                    className="cat-item"
                                    style={{ animationDelay: `${i * 60}ms` } as React.CSSProperties}
                                >
                                    <span className="cat-emoji">{cat.emoji}</span>
                                    <span className="cat-label">{cat.label}</span>
                                    <span className="cat-chevron">›</span>
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 'search':
                return (
                    <div className="sidebar-content-wrapper">
                        <div className="section-header">
                            <div className="section-header-icon">
                                <FaSearch />
                            </div>
                            <div>
                                <span className="section-title">ค้นหาสินค้า</span>
                                <span className="section-subtitle">พิมพ์ชื่อที่ต้องการ</span>
                            </div>
                        </div>

                        <div className="search-input-wrap">
                            <FaSearch className="search-icon-inner" />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Lophophora, หนามเหลือง..."
                                className="search-input"
                                onChange={(e) => {
                                    window.dispatchEvent(new CustomEvent("do-search", { detail: e.target.value }));
                                }}
                            />
                        </div>

                        <div className="search-tip">
                            <span className="tip-icon">💡</span>
                            <p>ลองค้นหาด้วยชื่อสายพันธุ์ เช่น <strong>"Lophophora"</strong> หรือลักษณะพืช <strong>"หนามเหลือง"</strong></p>
                        </div>
                    </div>
                );

            case 'cart':
  return (
    <div className="sidebar-content-wrapper cart-wrapper">
      <CartPanel variant="drawer" />
    </div>
  );

            case 'menu':
                return (
                    <div className="sidebar-content-wrapper">
                        <div className="section-header">
                            <div className="section-header-icon">
                                <FaHome />
                            </div>
                            <div>
                                <span className="section-title">เมนูหลัก</span>
                                <span className="section-subtitle">สำรวจเว็บไซต์ของเรา</span>
                            </div>
                        </div>

                        <div className="menu-section">
                            <Link href="/" onClick={onClose} className="menu-item">
                                <div className="menu-icon-wrap" style={{ '--icon-color': '#10b981', '--icon-bg': '#ecfdf5' } as React.CSSProperties}>
                                    <FaHome />
                                </div>
                                <span className="menu-label">หน้าแรก</span>
                                <span className="menu-arrow">›</span>
                            </Link>

                            <button
                                onClick={() => setMode('categories')}
                                className="menu-item"
                            >
                                <div className="menu-icon-wrap" style={{ '--icon-color': '#10b981', '--icon-bg': '#ecfdf5' } as React.CSSProperties}>
                                    <FaListUl />
                                </div>
                                <span className="menu-label">หมวดหมู่สินค้า</span>
                                <span className="menu-arrow">›</span>
                            </button>

                            <Link href="/auctions" onClick={onClose} className="menu-item">
                                <div className="menu-icon-wrap" style={{ '--icon-color': '#f59e0b', '--icon-bg': '#fffbeb' } as React.CSSProperties}>
                                    <FaGavel />
                                </div>
                                <span className="menu-label">สินค้าประมูล</span>
                                <span className="menu-arrow">›</span>
                            </Link>

                            <Link href="/forum" onClick={onClose} className="menu-item">
                                <div className="menu-icon-wrap" style={{ '--icon-color': '#3b82f6', '--icon-bg': '#eff6ff' } as React.CSSProperties}>
                                    <FaComments />
                                </div>
                                <span className="menu-label">กระทู้พูดคุย</span>
                                <span className="menu-arrow">›</span>
                            </Link>

                            <Link href="/auctionguide" onClick={onClose} className="menu-item">
                                <div className="menu-icon-wrap" style={{ '--icon-color': '#8b5cf6', '--icon-bg': '#f5f3ff' } as React.CSSProperties}>
                                    <FaBook />
                                </div>
                                <span className="menu-label">ขั้นตอนการประมูล</span>
                                <span className="menu-arrow">›</span>
                            </Link>

                            <div className="divider" />

                            <Link href="/FAQ" onClick={onClose} className="menu-item">
                                <div className="menu-icon-wrap" style={{ '--icon-color': '#6b7280', '--icon-bg': '#f3f4f6' } as React.CSSProperties}>
                                    <FaQuestionCircle />
                                </div>
                                <span className="menu-label">คำถามที่พบบ่อย</span>
                                <span className="menu-arrow">›</span>
                            </Link>

                            <Link href="/Insurance" onClick={onClose} className="menu-item">
                                <div className="menu-icon-wrap" style={{ '--icon-color': '#10b981', '--icon-bg': '#ecfdf5' } as React.CSSProperties}>
                                    <FaShieldAlt />
                                </div>
                                <span className="menu-label">การรับประกันสินค้า</span>
                                <span className="menu-arrow">›</span>
                            </Link>

                            <Link href="/About" onClick={onClose} className="menu-item">
                                <div className="menu-icon-wrap" style={{ '--icon-color': '#10b981', '--icon-bg': '#f0fdf4' } as React.CSSProperties}>
                                    <FaInfoCircle />
                                </div>
                                <span className="menu-label">รีวิวเกี่ยวกับเรา</span>
                                <span className="menu-arrow">›</span>
                            </Link>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <>
            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&display=swap');

        /* ── Base ── */
        .sidebar-content-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0;
          font-family: 'Noto Sans Thai', sans-serif;
        }

        /* ── Avatar Hero ── */
        .avatar-hero {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem 1rem 1.5rem;
          margin-bottom: 0.5rem;
          text-align: center;
          overflow: hidden;
        }
        .avatar-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 80% 60% at 50% 0%, #dcfce7 0%, transparent 70%);
          pointer-events: none;
        }
        .avatar-ring {
          position: relative;
          padding: 3px;
          border-radius: 50%;
          background: linear-gradient(135deg, #86efac, #16a34a, #4ade80);
          box-shadow: 0 8px 32px rgba(22,163,74,0.25);
          margin-bottom: 0.75rem;
        }
        .avatar-circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #16a34a, #15803d);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.6rem;
          font-weight: 800;
          border: 3px solid white;
          letter-spacing: -1px;
        }
        .avatar-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .welcome-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #16a34a;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .username-text {
          font-size: 1.05rem;
          font-weight: 700;
          color: #111827;
        }

        /* ── Menu Section ── */
        .menu-section {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 0 0.5rem;
        }
        .menu-item {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.75rem 0.875rem;
          border-radius: 14px;
          text-decoration: none;
          color: #374151;
          transition: background 0.18s, transform 0.18s;
          border: 1px solid transparent;
          cursor: pointer;
          background: none;
          width: 100%;
          font-family: inherit;
        }
        .menu-item:hover {
          background: #f9fafb;
          border-color: #f0f0f0;
          transform: translateX(3px);
        }
        .menu-icon-wrap {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          background: var(--icon-bg);
          color: var(--icon-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          flex-shrink: 0;
          transition: transform 0.18s;
        }
        .menu-item:hover .menu-icon-wrap {
          transform: scale(1.08);
        }
        .menu-label {
          flex: 1;
          font-size: 0.9rem;
          font-weight: 500;
          color: #374151;
        }
        .menu-arrow {
          font-size: 1.2rem;
          color: #d1d5db;
          line-height: 1;
          transition: color 0.18s, transform 0.18s;
        }
        .menu-item:hover .menu-arrow {
          color: #9ca3af;
          transform: translateX(2px);
        }

        /* ── Divider ── */
        .divider {
          height: 1px;
          background: linear-gradient(to right, transparent, #e5e7eb 30%, #e5e7eb 70%, transparent);
          margin: 0.75rem 1rem;
        }

        /* ── Logout ── */
        .logout-btn {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.75rem 0.875rem;
          border-radius: 14px;
          background: none;
          border: 1px solid transparent;
          cursor: pointer;
          width: 100%;
          font-family: inherit;
          margin: 0 0.5rem;
          transition: background 0.18s, transform 0.18s;
        }
        .logout-btn:hover {
          background: #fff5f5;
          border-color: #fee2e2;
          transform: translateX(3px);
        }
        .logout-label {
          color: #ef4444 !important;
          font-weight: 600 !important;
        }

        /* ── Section Header ── */
        .section-header {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 1.25rem 0.5rem 1rem;
          margin-bottom: 0.5rem;
        }
        .section-header-icon {
          width: 42px;
          height: 42px;
          border-radius: 13px;
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
          color: #16a34a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(22,163,74,0.15);
          position: relative;
        }
        .section-title {
          display: block;
          font-size: 1.05rem;
          font-weight: 700;
          color: #111827;
          line-height: 1.2;
        }
        .section-subtitle {
          display: block;
          font-size: 0.72rem;
          color: #9ca3af;
          font-weight: 500;
          margin-top: 1px;
          letter-spacing: 0.02em;
        }

        /* ── Categories ── */
        .cat-all-btn-wrap {
          padding: 0 0.5rem;
          margin-bottom: 0.75rem;
        }
        .cat-all-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.875rem 1.125rem;
          border-radius: 16px;
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border: 1.5px solid #bbf7d0;
          color: #15803d;
          font-weight: 700;
          font-size: 0.9rem;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(22,163,74,0.08);
        }
        .cat-all-btn:hover {
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
          box-shadow: 0 4px 16px rgba(22,163,74,0.18);
          transform: translateY(-1px);
        }
        .cat-list {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 0 0.5rem;
        }
        .cat-item {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          width: 100%;
          padding: 0.9rem 1rem;
          border-radius: 14px;
          background: none;
          border: 1px solid transparent;
          cursor: pointer;
          font-family: inherit;
          color: #4b5563;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.18s;
          text-align: left;
        }
        .cat-item:hover {
          background: #f0fdf4;
          border-color: #dcfce7;
          color: #15803d;
          transform: translateX(5px);
        }
        .cat-emoji {
          font-size: 1.25rem;
          width: 28px;
          text-align: center;
          flex-shrink: 0;
        }
        .cat-label { flex: 1; }
        .cat-chevron {
          font-size: 1.2rem;
          color: #d1d5db;
          transition: color 0.18s, transform 0.18s;
          line-height: 1;
        }
        .cat-item:hover .cat-chevron {
          color: #86efac;
          transform: translateX(2px);
        }

        /* ── Search ── */
        .search-input-wrap {
          position: relative;
          margin: 0 0.5rem 1rem;
        }
        .search-icon-inner {
          position: absolute;
          left: 1.125rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          font-size: 0.85rem;
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          padding: 0.95rem 1rem 0.95rem 2.75rem;
          border-radius: 14px;
          border: 1.5px solid #e5e7eb;
          background: #fafafa;
          font-size: 0.9rem;
          font-family: 'Noto Sans Thai', sans-serif;
          color: #111827;
          outline: none;
          transition: all 0.22s;
          box-sizing: border-box;
        }
        .search-input::placeholder { color: #c4b5a5; }
        .search-input:focus {
          border-color: #86efac;
          background: white;
          box-shadow: 0 0 0 3px rgba(134,239,172,0.25);
        }
        .search-tip {
          display: flex;
          gap: 0.625rem;
          align-items: flex-start;
          margin: 0 0.5rem;
          padding: 0.875rem 1rem;
          border-radius: 14px;
          background: #fffbeb;
          border: 1px solid #fef3c7;
        }
        .tip-icon { font-size: 0.9rem; flex-shrink: 0; }
        .search-tip p {
          font-size: 0.78rem;
          color: #92400e;
          line-height: 1.6;
          margin: 0;
          font-weight: 450;
        }
        .search-tip strong { font-weight: 700; }

        /* ── Cart ── */
        .cart-wrapper { height: 100%; }
        .cart-icon-header { overflow: visible; }
        .cart-badge-header {
          position: absolute;
          top: -5px;
          right: -5px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ef4444;
          color: white;
          font-size: 0.6rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
        }
        .cart-body {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem 0.5rem 2rem;
        }
        .cart-filled {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          width: 100%;
        }
        .cart-visual {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          border-radius: 24px;
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
          color: #16a34a;
          font-size: 2rem;
          box-shadow: 0 8px 24px rgba(22,163,74,0.2);
          margin-bottom: 0.25rem;
        }
        .cart-count-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          font-size: 0.7rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(239,68,68,0.4);
        }
        .cart-desc {
          font-size: 0.85rem;
          color: #6b7280;
          margin: 0;
          font-weight: 500;
        }
        .cart-cta-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          justify-content: center;
          width: 100%;
          padding: 1rem 1.5rem;
          border-radius: 16px;
          background: linear-gradient(135deg, #16a34a, #15803d);
          color: white;
          font-weight: 700;
          font-size: 0.95rem;
          text-decoration: none;
          box-shadow: 0 8px 24px rgba(22,163,74,0.3);
          transition: all 0.2s;
          margin-top: 0.5rem;
        }
        .cart-cta-btn:hover {
          background: linear-gradient(135deg, #15803d, #166534);
          box-shadow: 0 12px 32px rgba(22,163,74,0.4);
          transform: translateY(-2px);
        }
        .cart-cta-btn:active { transform: translateY(0); }
        .cta-arrow {
          font-size: 1.1rem;
          transition: transform 0.18s;
        }
        .cart-cta-btn:hover .cta-arrow { transform: translateX(3px); }

        .cart-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .empty-icon {
          font-size: 3rem;
          filter: grayscale(0.4);
          margin-bottom: 0.75rem;
          opacity: 0.6;
        }
        .empty-title {
          font-size: 1rem;
          font-weight: 700;
          color: #374151;
          margin: 0;
        }
        .empty-sub {
          font-size: 0.8rem;
          color: #9ca3af;
          margin: 0;
        }
        .browse-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          margin-top: 1rem;
          padding: 0.7rem 1.5rem;
          border-radius: 12px;
          background: #f0fdf4;
          color: #16a34a;
          font-weight: 700;
          font-size: 0.875rem;
          text-decoration: none;
          border: 1.5px solid #bbf7d0;
          transition: all 0.18s;
        }
        .browse-btn:hover {
          background: #dcfce7;
          border-color: #86efac;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(22,163,74,0.15);
        }

        /* ── Custom Scrollbar ── */
        .sidebar-scroll::-webkit-scrollbar { width: 3px; }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: #d1fae5;
          border-radius: 10px;
        }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }

        /* ── Close Button ── */
        .close-btn-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.25rem 1rem;
          background: linear-gradient(to top, white, transparent);
          border-top: 1px solid #f3f4f6;
        }
        .close-btn {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #f9fafb;
          border: 1.5px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.25s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .close-btn:hover {
          background: #fef2f2;
          border-color: #fecaca;
          color: #ef4444;
          transform: rotate(90deg);
          box-shadow: 0 4px 16px rgba(239,68,68,0.15);
        }
        .close-btn:active { transform: rotate(90deg) scale(0.92); }
      `}</style>

            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-md z-[60] transition-opacity duration-500 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Sidebar Panel */}
            <div
  className={`fixed top-0 right-0 h-full 
    w-[360px] sm:w-[400px] md:w-[420px]
    bg-white z-[70] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
  style={{
    borderRadius: '28px 0 0 28px',
    boxShadow: '-24px 0 80px -12px rgba(0,0,0,0.12), -4px 0 24px -6px rgba(0,0,0,0.07)',
    borderLeft: '1px solid rgba(229,231,235,0.6)',
  }}
>

                {/* Scrollable Area */}
                <div className="flex-1 overflow-y-auto sidebar-scroll px-2 pb-2">
                    {renderContent()}
                </div>

                {/* Close Footer */}
                <div className="close-btn-wrap">
                    <button onClick={onClose} className="close-btn" aria-label="ปิด">
                        <FaTimes />
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;