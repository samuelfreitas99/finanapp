'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Card as UICard } from '@/components/ui/Card';
import { Plus, Briefcase, Trash2, Loader2, CalendarClock, Edit3, X } from 'lucide-react';

interface WalletData {
    id: string;
    name: string;
}

interface DebtData {
    id: string;
    name: string;
    wallet_id: string;
    principal_amount: number;
    total_installments: number;
    type: string;
    status: string;
    start_date: string;
}

export default function DebtsPage() {
    const [debts, setDebts] = useState<DebtData[]>([]);
    const [wallets, setWallets] = useState<WalletData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingDebtId, setEditingDebtId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [walletId, setWalletId] = useState('');
    const [totalAmount, setTotalAmount] = useState<number>(0);
    const [totalInstallments, setTotalInstallments] = useState<number>(1);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [submitting, setSubmitting] = useState(false);

    const fetchDebtsAndWallets = async () => {
        setLoading(true);
        try {
            const [debtsRes, walletsRes] = await Promise.all([
                apiClient.get('/debts/'),
                apiClient.get('/wallets/')
            ]);
            setDebts(debtsRes.data);
            setWallets(walletsRes.data);
            if (walletsRes.data.length > 0) {
                setWalletId(walletsRes.data[0].id);
            }
        } catch (error) {
            console.error('Error fetching data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDebtsAndWallets();
    }, []);

    const handleCreateDebt = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingDebtId) {
                await apiClient.put(`/debts/${editingDebtId}`, { name });
            } else {
                await apiClient.post('/debts/fixed', {
                    name,
                    wallet_id: walletId,
                    total_amount: totalAmount,
                    total_installments: totalInstallments,
                    start_date: startDate
                });
            }
            setShowForm(false);
            setEditingDebtId(null);
            setName('');
            setTotalAmount(0);
            setTotalInstallments(1);
            fetchDebtsAndWallets();
        } catch (error: any) {
            console.error('Error saving debt', error);
            alert(error?.response?.data?.detail?.[0]?.msg ?? 'Erro ao salvar dívida.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditDebt = (debt: DebtData) => {
        setName(debt.name);
        setWalletId(debt.wallet_id);
        setTotalAmount(debt.principal_amount);
        setTotalInstallments(debt.total_installments);
        setStartDate(debt.start_date.split('T')[0]);
        setEditingDebtId(debt.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setEditingDebtId(null);
        setName('');
        setTotalAmount(0);
        setTotalInstallments(1);
        if (wallets.length > 0) setWalletId(wallets[0].id);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Dívidas e Empréstimos</h1>
                    <p className="text-slate-400 mt-1">Gerencie parcelamentos fixos e acompanhe a amortização.</p>
                </div>

                <button
                    onClick={() => showForm ? handleCancelForm() : setShowForm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-emerald-500/20"
                >
                    {showForm ? <><X size={20} /> Cancelar</> : <><Plus size={20} /> Nova Dívida</>}
                </button>
            </div>

            {showForm && (
                <UICard className="border-emerald-500/30">
                    <form onSubmit={handleCreateDebt} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Descrição</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                placeholder="Ex: Empréstimo Carro"
                                required
                            />
                        </div>

                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Conta para Débito Mensal</label>
                            <select
                                value={walletId}
                                disabled={!!editingDebtId}
                                onChange={(e) => setWalletId(e.target.value)}
                                className={`w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none ${editingDebtId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                required
                            >
                                <option value="" disabled>Selecione uma conta...</option>
                                {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>

                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Valor Total (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                disabled={!!editingDebtId}
                                value={totalAmount || ''}
                                onChange={(e) => setTotalAmount(parseFloat(e.target.value))}
                                className={`w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${editingDebtId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                placeholder="0,00"
                                required
                            />
                        </div>

                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Quantidade de Parcelas</label>
                            <input
                                type="number"
                                min="1"
                                disabled={!!editingDebtId}
                                value={totalInstallments}
                                onChange={(e) => setTotalInstallments(parseInt(e.target.value))}
                                className={`w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${editingDebtId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                required
                            />
                        </div>

                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Data da 1ª Parcela</label>
                            <input
                                type="date"
                                disabled={!!editingDebtId}
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className={`w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${editingDebtId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="lg:col-span-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white rounded-xl font-medium transition-opacity flex items-center justify-center h-[46px]"
                        >
                            {submitting ? <Loader2 size={20} className="animate-spin" /> : editingDebtId ? 'Salvar Edição' : 'Gerar Parcelas'}
                        </button>
                    </form>
                </UICard>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={40} className="animate-spin text-emerald-500 opacity-50" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {debts.map(debt => {
                        const walletName = wallets.find(w => w.id === debt.wallet_id)?.name || 'Conta desconhecida';

                        return (
                            <UICard key={debt.id} className="group hover:border-emerald-500/30 transition-all flex flex-col md:flex-row justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                                                <Briefcase size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-white font-medium text-lg leading-tight">{debt.name}</h3>
                                                <p className="text-xs text-slate-500 capitalize">{debt.type} - {debt.status}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEditDebt(debt)}
                                                className="text-slate-500 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors"
                                                title="Editar dívida"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm text-slate-400">
                                        <p>Débito em: <span className="text-white">{walletName}</span></p>
                                        <p className="flex items-center gap-2">
                                            <CalendarClock size={16} /> 1ª Parcela: <span className="text-white">{new Date(debt.start_date).toLocaleDateString()}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col items-start md:items-end justify-between border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                                    <div className="text-left md:text-right w-full">
                                        <p className="text-xs text-slate-400 mb-1 tracking-wider uppercase">Valor Total</p>
                                        <p className="text-xl font-bold text-emerald-400 tracking-tight">{formatCurrency(debt.principal_amount)}</p>
                                        <p className="text-sm text-slate-300 mt-2">
                                            {debt.total_installments} parcelas de <br />
                                            <span className="font-semibold">{formatCurrency(debt.principal_amount / debt.total_installments)}</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => window.location.href = `/dashboard/debts/${debt.id}`}
                                        className="mt-4 md:mt-0 px-4 py-2 bg-white/5 hover:bg-white/10 text-emerald-400 hover:text-emerald-300 rounded-lg text-sm font-medium transition-colors w-full md:w-auto"
                                    >
                                        Ver Parcelas
                                    </button>
                                </div>
                            </UICard>
                        )
                    })}
                    {debts.length === 0 && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                            <Briefcase className="mx-auto text-slate-600 mb-4" size={48} />
                            <p className="text-slate-400">Você ainda não tem dívidas ou empréstimos cadastrados.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
