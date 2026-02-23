'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Card as UICard } from '@/components/ui/Card';
import { Plus, CreditCard, Trash2, Loader2, Calendar, Edit3, X } from 'lucide-react';

interface WalletData {
    id: string;
    name: string;
}

interface CardData {
    id: string;
    name: string;
    wallet_id: string;
    closing_day: number;
    due_day: number;
    limit: number;
}

export default function CardsPage() {
    const [cards, setCards] = useState<CardData[]>([]);
    const [wallets, setWallets] = useState<WalletData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCardId, setEditingCardId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [walletId, setWalletId] = useState('');
    const [closingDay, setClosingDay] = useState(1);
    const [dueDay, setDueDay] = useState(10);
    const [limit, setLimit] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const fetchCardsAndWallets = async () => {
        setLoading(true);
        try {
            const [cardsRes, walletsRes] = await Promise.all([
                apiClient.get('/cards/'),
                apiClient.get('/wallets/')
            ]);
            setCards(cardsRes.data);
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
        fetchCardsAndWallets();
    }, []);

    const handleSaveCard = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const cardData = {
                name,
                wallet_id: walletId,
                closing_day: closingDay,
                due_day: dueDay,
                limit
            };

            if (editingCardId) {
                await apiClient.put(`/cards/${editingCardId}`, cardData);
            } else {
                await apiClient.post('/cards/', cardData);
            }
            setShowForm(false);
            setEditingCardId(null);
            setName('');
            setClosingDay(1);
            setDueDay(10);
            setLimit(0);
            fetchCardsAndWallets();
        } catch (error: any) {
            console.error('Error saving card', error);
            alert(error?.response?.data?.detail?.[0]?.msg ?? 'Erro ao salvar cartão.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditCard = (card: CardData) => {
        setName(card.name);
        setWalletId(card.wallet_id);
        setClosingDay(card.closing_day);
        setDueDay(card.due_day);
        setLimit(card.limit);
        setEditingCardId(card.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setEditingCardId(null);
        setName('');
        setClosingDay(1);
        setDueDay(10);
        setLimit(0);
        if (wallets.length > 0) setWalletId(wallets.length > 0 ? wallets[0].id : '');
    };

    const handleDeleteCard = async (id: string) => {
        if (!confirm('Excluir este cartão? Pode haver faturas amarradas.')) return;
        try {
            await apiClient.delete(`/cards/${id}`);
            fetchCardsAndWallets();
        } catch (error) {
            console.error('Error deleting card', error);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Cartões de Crédito</h1>
                    <p className="text-slate-400 mt-1">Gerencie seus cartões e acompanhe limites.</p>
                </div>

                <button
                    onClick={() => showForm ? handleCancelForm() : setShowForm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-fuchsia-500/20"
                >
                    {showForm ? <><X size={20} /> Cancelar</> : <><Plus size={20} /> Novo Cartão</>}
                </button>
            </div>

            {showForm && (
                <UICard className="border-fuchsia-500/30">
                    <form onSubmit={handleSaveCard} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Nome do Cartão</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
                                placeholder="Ex: Nubank Black"
                                required
                            />
                        </div>

                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Conta para Débito</label>
                            <select
                                value={walletId}
                                onChange={(e) => setWalletId(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 appearance-none"
                                required
                            >
                                <option value="" disabled>Selecione uma conta...</option>
                                {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Limite Restante / Total</label>
                            <input
                                type="number"
                                step="0.01"
                                value={limit || ''}
                                onChange={(e) => setLimit(parseFloat(e.target.value))}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
                                placeholder="R$ 0,00"
                                required
                            />
                        </div>

                        <div className="lg:col-start-1">
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Dia de Fechamento</label>
                            <input
                                type="number"
                                min="1" max="31"
                                value={closingDay}
                                onChange={(e) => setClosingDay(parseInt(e.target.value))}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Dia de Vencimento</label>
                            <input
                                type="number"
                                min="1" max="31"
                                value={dueDay}
                                onChange={(e) => setDueDay(parseInt(e.target.value))}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="lg:col-span-3 px-6 py-2.5 bg-gradient-to-r from-fuchsia-600 to-rose-600 hover:opacity-90 text-white rounded-xl font-medium transition-opacity flex items-center justify-center h-[46px]"
                        >
                            {submitting ? <Loader2 size={20} className="animate-spin" /> : 'Salvar Cartão'}
                        </button>
                    </form>
                </UICard>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={40} className="animate-spin text-fuchsia-500 opacity-50" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cards.map(card => {
                        const walletName = wallets.find(w => w.id === card.wallet_id)?.name || 'Conta desconhecida';

                        return (
                            <UICard key={card.id} gradient className="group hover:border-fuchsia-500/50 transition-all">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-fuchsia-500/20 text-fuchsia-400 rounded-xl">
                                        <CreditCard size={24} />
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEditCard(card)}
                                            className="text-slate-500 hover:text-fuchsia-400 p-1.5 rounded-lg hover:bg-fuchsia-500/10 transition-colors"
                                            title="Editar cartão"
                                        >
                                            <Edit3 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCard(card.id)}
                                            className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                                            title="Excluir cartão"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-1 tracking-tight">{card.name}</h3>
                                <p className="text-sm text-slate-400 mb-6 flex items-center gap-1">
                                    Débito automático na {walletName}
                                </p>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-3">
                                        <span className="text-slate-400 flex items-center gap-1.5">
                                            <Calendar size={14} /> Fechamento
                                        </span>
                                        <span className="text-white font-medium">Dia {card.closing_day}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-3">
                                        <span className="text-slate-400 flex items-center gap-1.5">
                                            <Calendar size={14} /> Vencimento
                                        </span>
                                        <span className="text-white font-medium">Dia {card.due_day}</span>
                                    </div>
                                    <div className="pt-2">
                                        <p className="text-xs text-slate-400 mb-1 font-medium tracking-wider uppercase">Limite Total do Cartão</p>
                                        <p className="text-emerald-400 font-semibold">{formatCurrency(card.limit)}</p>
                                    </div>
                                </div>
                            </UICard>
                        )
                    })}
                    {cards.length === 0 && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                            <CreditCard className="mx-auto text-slate-600 mb-4" size={48} />
                            <p className="text-slate-400">Você ainda não tem cartões cadastrados.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
