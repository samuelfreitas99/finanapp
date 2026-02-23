'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Wallet,
    Tags,
    CreditCard,
    Receipt,
    ArrowRightLeft,
    Briefcase,
    LogOut
} from 'lucide-react';
import Link from 'next/link';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Wallet, label: 'Contas & Carteiras', href: '/dashboard/wallets' },
    { icon: Tags, label: 'Categorias', href: '/dashboard/categories' },
    { icon: CreditCard, label: 'Cartões', href: '/dashboard/cards' },
    { icon: Receipt, label: 'Faturas', href: '/dashboard/invoices' },
    { icon: Briefcase, label: 'Dívidas & Emp', href: '/dashboard/debts' },
    { icon: ArrowRightLeft, label: 'Transações', href: '/dashboard/transactions' },
];

export function Sidebar() {
    const { logout } = useAuth();
    const pathname = usePathname();

    return (
        <div className="w-64 h-screen bg-slate-900 border-r border-white/5 flex flex-col fixed left-0 top-0">
            {/* Brand */}
            <div className="h-20 flex items-center px-6 border-b border-white/5 relative overflow-hidden">
                <div className="absolute top-[-50%] left-[-20%] w-20 h-20 bg-blue-500/20 blur-[50px] pointer-events-none" />
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-violet-500 flex items-center justify-center mr-3 shadow-lg shadow-blue-500/20">
                    <span className="font-bold text-white tracking-tighter">FD</span>
                </div>
                <span className="font-bold text-white tracking-tight">FinanApp</span>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    const Icon = item.icon;

                    return (
                        <Link key={item.href} href={item.href} className="block relative">
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute inset-0 bg-white/5 rounded-xl border border-white/10"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <div className={`relative flex items-center px-3 py-3 rounded-xl transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                                <Icon size={20} className={`mr-3 ${isActive ? 'text-blue-400' : 'opacity-70'}`} />
                                <span className="font-medium text-sm">{item.label}</span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-white/5">
                <button
                    onClick={logout}
                    className="w-full flex items-center px-3 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                >
                    <LogOut size={20} className="mr-3 opacity-70" />
                    <span className="font-medium text-sm">Sair da conta</span>
                </button>
            </div>
        </div>
    );
}
