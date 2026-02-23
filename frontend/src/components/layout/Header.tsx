'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Bell } from 'lucide-react';

export function Header() {
    const { user, loading } = useAuth();

    return (
        <header className="h-20 bg-slate-900/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-40">
            <div>
                {/* Placeholder para titulo da pagina se quiser inserir dinamico depois */}
            </div>

            <div className="flex items-center space-x-6">
                <button className="relative text-slate-400 hover:text-white transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full border border-slate-900" />
                </button>

                <div className="flex items-center space-x-3 pl-6 border-l border-white/10">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-white">{loading ? '...' : user?.name}</p>
                        <p className="text-xs text-slate-400">{loading ? '...' : user?.email}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold shadow-lg">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                </div>
            </div>
        </header>
    );
}
