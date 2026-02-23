'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Plus, Wallet, Trash2, Loader2, Edit3, X } from 'lucide-react';

type WalletType = 'bank_account' | 'cash' | 'digital_wallet';

interface WalletData {
    id: string;
    name: string;
    type: WalletType;
    projected_balance: number;
}

const WALLET_TYPE_LABEL: Record<WalletType, string> = {
    bank_account: 'Conta bancária',
    cash: 'Dinheiro',
    digital_wallet: 'Carteira digital',
};

export default function WalletsPage() {
    const [wallets, setWallets] = useState<WalletData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingWalletId, setEditingWalletId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [type, setType] = useState<WalletType>('bank_account');
    const [submitting, setSubmitting] = useState(false);

    const fetchWallets = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/wallets/');
            setWallets(response.data);
        } catch (error) {
            console.error('Error fetching wallets', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWallets();
    }, []);

    const handleSaveWallet = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingWalletId) {
                await apiClient.put(`/wallets/${editingWalletId}`, { name, type });
            } else {
                await apiClient.post('/wallets/', { name, type });
            }
            setShowForm(false);
            setEditingWalletId(null);
            setName('');
            setType('bank_account');
            fetchWallets();
        } catch (error: any) {
            console.error('Error saving wallet', error?.response?.status, error?.response?.data);
            alert(error?.response?.data?.detail?.[0]?.msg ?? 'Erro ao salvar carteira.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteWallet = async (id: string) => {
        if (!confirm('Deseja realmente excluir esta carteira?')) return;
        try {
            await apiClient.delete(`/wallets/${id}`);
            fetchWallets();
        } catch (error) {
            console.error('Error deleting wallet', error);
        }
    };

    const handleEditWallet = (wallet: WalletData) => {
        setName(wallet.name);
        setType(wallet.type);
        setEditingWalletId(wallet.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setEditingWalletId(null);
        setName('');
        setType('bank_account');
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Contas e Carteiras</h1>
                    <p className="text-slate-400 mt-1">Gerencie suas contas bancárias, dinheiro e carteiras digitais.</p>
                </div>

                <button
                    onClick={() => showForm ? handleCancelForm() : setShowForm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20"
                >
                    {showForm ? <><X size={20} /> Cancelar</> : <><Plus size={20} /> Nova Conta</>}
                </button>
            </div>

            {showForm && (
                <Card className="border-blue-500/30">
                    <form onSubmit={handleSaveWallet} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Nome</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="Ex: Nubank, Dinheiro, PicPay"
                                required
                            />
                        </div>

                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Tipo</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as WalletType)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                            >
                                <option value="bank_account">Conta bancária</option>
                                <option value="cash">Dinheiro</option>
                                <option value="digital_wallet">Carteira digital</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90 text-white rounded-xl font-medium transition-opacity flex items-center h-[46px]"
                        >
                            {submitting ? <Loader2 size={20} className="animate-spin" /> : 'Salvar'}
                        </button>
                    </form>
                </Card>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={40} className="animate-spin text-blue-500 opacity-50" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wallets.map((wallet) => (
                        <Card key={wallet.id} className="group hover:border-white/20 transition-all flex flex-col justify-between h-40">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
                                        <Wallet size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">{wallet.name}</h3>
                                        <p className="text-xs text-slate-400">{WALLET_TYPE_LABEL[wallet.type] ?? wallet.type}</p>
                                    </div>
                                </div>

                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEditWallet(wallet)}
                                        className="text-slate-500 hover:text-blue-400 p-1.5 rounded-lg hover:bg-blue-500/10 transition-colors"
                                        title="Editar carteira"
                                    >
                                        <Edit3 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteWallet(wallet.id)}
                                        className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                                        title="Excluir carteira"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4">
                                <p className="text-sm text-slate-400 mb-1">Saldo Projetado</p>
                                <p className={`text-2xl font-bold tracking-tight ${wallet.projected_balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {formatCurrency(wallet.projected_balance)}
                                </p>
                            </div>
                        </Card>
                    ))}

                    {wallets.length === 0 && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                            <Wallet className="mx-auto text-slate-600 mb-4" size={48} />
                            <p className="text-slate-400">Você ainda não tem contas cadastradas.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}