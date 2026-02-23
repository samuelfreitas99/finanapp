'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
                <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
                <p className="text-slate-400 font-medium tracking-wide animate-pulse">Carregando seus dados...</p>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-950 flex relative overflow-hidden">
            {/* Background Gradients Fixos */}
            <div className="fixed top-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="fixed bottom-[-10%] left-[20%] w-[30%] h-[40%] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />

            <Sidebar />

            <div className="flex-1 ml-64 flex flex-col h-screen relative z-10">
                <Header />
                <main className="flex-1 overflow-y-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
