'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Plus, ArrowRightLeft, Search, Loader2, Edit3, Trash2, X } from 'lucide-react';

interface CategoryData { id: string; name: string; type: string }
interface WalletData { id: string; name: string }
interface CardData { id: string; name: string }

interface TransactionData {
    id: string;
    type: 'income' | 'expense' | 'transfer';
    description: string;
    amount: number;
    occurred_at: string;
    settled_at: string | null;
    wallet_id: string | null;
    category_id: string | null;
    installment_number: number | null;
    installment_total: number | null;
    card_id: string | null;
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<TransactionData[]>([]);
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [wallets, setWallets] = useState<WalletData[]>([]);
    const [cards, setCards] = useState<CardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

    // Filters
    const [filterType, setFilterType] = useState<'month' | 'custom'>('month');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Form State
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState<number>(0);
    const [type, setType] = useState('expense');
    const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet');
    const [walletId, setWalletId] = useState('');
    const [cardId, setCardId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [installmentCount, setInstallmentCount] = useState<number>(1);
    const [occurredAt, setOccurredAt] = useState(new Date().toISOString().split('T')[0]);
    const [settledAt, setSettledAt] = useState(new Date().toISOString().split('T')[0]);
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            let query = `?month=${month}&year=${year}`;
            if (filterType === 'custom' && startDate && endDate) {
                query = `?start_date=${startDate}&end_date=${endDate}`;
            }
            const [txRes, catRes, walRes, cardRes] = await Promise.all([
                apiClient.get(`/transactions/${query}`),
                apiClient.get('/categories/'),
                apiClient.get('/wallets/'),
                apiClient.get('/cards/')
            ]);
            setTransactions(txRes.data);
            setCategories(catRes.data);
            setWallets(walRes.data);
            setCards(cardRes.data);

            if (walRes.data.length > 0 && !walletId) setWalletId(walRes.data[0].id);
            if (cardRes.data.length > 0 && !cardId) setCardId(cardRes.data[0].id);
            if (catRes.data.length > 0) setCategoryId(catRes.data[0].id);
        } catch (error) {
            console.error('Error fetching data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (filterType === 'month') {
            fetchData();
        } else if (filterType === 'custom' && startDate && endDate) {
            fetchData();
        }
    }, [month, year, filterType, startDate, endDate]);

    const handleSaveTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let finalAmount = amount;
            if (type === 'expense' && amount > 0) {
                finalAmount = -amount; // Despesa é negativa na wallet
            }

            if (editingTransactionId) {
                const txData = {
                    wallet_id: paymentMethod === 'wallet' ? (walletId || null) : null,
                    card_id: paymentMethod === 'card' ? (cardId || null) : null,
                    category_id: categoryId || null,
                    type,
                    description,
                    amount: finalAmount,
                    occurred_at: occurredAt,
                    settled_at: paymentMethod === 'wallet' ? (settledAt || null) : null
                };
                await apiClient.put(`/transactions/${editingTransactionId}`, txData);
            } else {
                if (paymentMethod === 'card' && installmentCount > 1) {
                    await apiClient.post('/installment_plans/', {
                        card_id: cardId || null,
                        category_id: categoryId || null,
                        description,
                        total_amount: Math.abs(finalAmount),
                        installment_count: installmentCount,
                        start_date: occurredAt
                    });
                } else {
                    const txData = {
                        wallet_id: paymentMethod === 'wallet' ? (walletId || null) : null,
                        card_id: paymentMethod === 'card' ? (cardId || null) : null,
                        category_id: categoryId || null,
                        type,
                        description,
                        amount: finalAmount,
                        occurred_at: occurredAt,
                        settled_at: paymentMethod === 'wallet' ? (settledAt || null) : null
                    };
                    await apiClient.post('/transactions/', txData);
                }
            }

            setShowForm(false);
            setEditingTransactionId(null);
            setDescription('');
            setAmount(0);
            setInstallmentCount(1);
            fetchData();
        } catch (error: any) {
            console.error('Error saving transaction', error);
            alert(error?.response?.data?.detail?.[0]?.msg ?? 'Erro ao salvar transação.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditTransaction = (tx: TransactionData) => {
        setDescription(tx.description);
        setAmount(Math.abs(tx.amount));
        setType(tx.type);
        if (tx.card_id) {
            setPaymentMethod('card');
            setCardId(tx.card_id);
        } else {
            setPaymentMethod('wallet');
            setWalletId(tx.wallet_id || '');
        }
        setCategoryId(tx.category_id || '');
        setOccurredAt(tx.occurred_at.split('T')[0]);
        setSettledAt(tx.settled_at ? tx.settled_at.split('T')[0] : '');
        setInstallmentCount(1);
        setEditingTransactionId(tx.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setEditingTransactionId(null);
        setDescription('');
        setAmount(0);
        setType('expense');
        setOccurredAt(new Date().toISOString().split('T')[0]);
        setSettledAt(new Date().toISOString().split('T')[0]);
        setInstallmentCount(1);
        setPaymentMethod('wallet');
        if (wallets.length > 0) setWalletId(wallets[0].id);
        if (cards.length > 0) setCardId(cards[0].id);
        if (categories.length > 0) setCategoryId(categories[0].id);
    };

    const handleDeleteTransaction = async (id: string) => {
        if (!confirm('Deseja realmente excluir esta transação?')) return;
        try {
            await apiClient.delete(`/transactions/${id}`);
            fetchData();
        } catch (error) {
            console.error('Error deleting transaction', error);
            alert('Erro ao excluir transação.');
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const filteredCategories = categories.filter(c => c.type === type);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Transações</h1>
                    <p className="text-slate-400 mt-1">Lançamentos bancários em conta e registros manuais.</p>
                </div>

                <div className="flex gap-3">
                    <div className="flex gap-2 bg-slate-900 border border-white/5 rounded-xl p-1 items-center">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as 'month' | 'custom')}
                            className="bg-transparent text-white text-sm px-2 focus:outline-none appearance-none cursor-pointer"
                        >
                            <option value="month">Mensal</option>
                            <option value="custom">Período</option>
                        </select>

                        <span className="text-slate-600">|</span>

                        {filterType === 'month' ? (
                            <>
                                <select
                                    value={month}
                                    onChange={(e) => setMonth(parseInt(e.target.value))}
                                    className="bg-transparent text-white text-sm px-2 focus:outline-none appearance-none cursor-pointer"
                                >
                                    {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Mês {i + 1}</option>)}
                                </select>
                                <input
                                    type="number"
                                    value={year}
                                    onChange={e => setYear(parseInt(e.target.value))}
                                    className="w-16 bg-transparent text-white text-sm px-2 focus:outline-none"
                                />
                            </>
                        ) : (
                            <div className="flex items-center gap-2 px-2">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    className="bg-transparent text-white text-sm focus:outline-none [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                />
                                <span className="text-slate-500 text-xs">até</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    className="bg-transparent text-white text-sm focus:outline-none [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                />
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => showForm ? handleCancelForm() : setShowForm(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20"
                    >
                        {showForm ? <><X size={20} /> Cancelar</> : <><Plus size={20} /> Novo Lançamento</>}
                    </button>
                </div>
            </div>

            {showForm && (
                <Card className="border-blue-500/30">
                    <form onSubmit={handleSaveTransaction} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Descrição</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="Ex: Aluguel"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Tipo</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                            >
                                <option value="expense">Despesa</option>
                                <option value="income">Receita</option>
                                <option value="transfer">Transferência</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Valor</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={amount || ''}
                                onChange={(e) => setAmount(parseFloat(e.target.value))}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="0.00"
                                required
                            />
                        </div>

                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Método de Pagamento</label>
                            <div className="flex bg-slate-950/50 border border-white/10 rounded-xl p-1">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('wallet')}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${paymentMethod === 'wallet' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Conta
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('card')}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${paymentMethod === 'card' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Cartão
                                </button>
                            </div>
                        </div>

                        {paymentMethod === 'wallet' ? (
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Conta (Origem/Destino)</label>
                                <select
                                    value={walletId}
                                    onChange={(e) => setWalletId(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                                    required
                                >
                                    {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Cartão de Crédito</label>
                                <select
                                    value={cardId}
                                    onChange={(e) => setCardId(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                                    required
                                >
                                    {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Categoria</label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                            >
                                <option value="">Selecione...</option>
                                {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Data Competência</label>
                            <input
                                type="date"
                                value={occurredAt}
                                onChange={(e) => setOccurredAt(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                required
                            />
                        </div>

                        {paymentMethod === 'card' && !editingTransactionId ? (
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Parcelas</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={installmentCount}
                                    onChange={(e) => setInstallmentCount(parseInt(e.target.value))}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Data Liquidação</label>
                                <input
                                    type="date"
                                    value={settledAt}
                                    onChange={(e) => setSettledAt(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    disabled={paymentMethod === 'card'} // Cartão liquida via fatura
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="lg:col-span-4 px-6 py-3 mt-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90 text-white rounded-xl font-medium transition-opacity flex items-center justify-center w-full"
                        >
                            {submitting ? <Loader2 size={20} className="animate-spin" /> : 'Registrar Lançamento'}
                        </button>
                    </form>
                </Card>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={40} className="animate-spin text-blue-500 opacity-50" />
                </div>
            ) : (
                <Card className="p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="text-xs uppercase bg-white/5 text-slate-400 border-b border-white/10">
                                <tr>
                                    <th scope="col" className="px-6 py-4 font-medium">Data (Comp.)</th>
                                    <th scope="col" className="px-6 py-4 font-medium">Descrição</th>
                                    <th scope="col" className="px-6 py-4 font-medium">Categoria</th>
                                    <th scope="col" className="px-6 py-4 font-medium">Conta / Cartão</th>
                                    <th scope="col" className="px-6 py-4 font-medium text-right">Valor</th>
                                    <th scope="col" className="px-6 py-4 font-medium text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(tx => {
                                    const categoryName = categories.find(c => c.id === tx.category_id)?.name || '-';
                                    const walletName = wallets.find(w => w.id === tx.wallet_id)?.name || '';
                                    const cardName = cards.find(c => c.id === tx.card_id)?.name || '';
                                    const placeName = tx.card_id ? `Cartão: ${cardName}` : walletName || '-';
                                    const isExp = tx.type === 'expense';

                                    return (
                                        <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4 align-middle whitespace-nowrap">
                                                {new Date(tx.occurred_at).toLocaleDateString()}
                                                {tx.settled_at && <span className="block text-[10px] text-slate-500">Liq: {new Date(tx.settled_at).toLocaleDateString()}</span>}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-white max-w-[200px] truncate" title={tx.description}>
                                                {tx.description}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md text-xs">{categoryName}</span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                {placeName}
                                            </td>
                                            <td className={`px-6 py-4 text-right font-medium ${isExp ? 'text-red-400' : tx.type === 'transfer' ? 'text-blue-400' : 'text-emerald-400'}`}>
                                                {formatCurrency(tx.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEditTransaction(tx)}
                                                        className="text-slate-500 hover:text-blue-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                                                        title="Editar transação"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTransaction(tx.id)}
                                                        className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                                                        title="Excluir transação"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            Nenhuma transação encontrada para este mês.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
