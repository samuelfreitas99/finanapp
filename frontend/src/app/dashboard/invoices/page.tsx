'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Receipt, CheckCircle, Clock, Loader2, CreditCard, Activity, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface InvoiceData {
    id: string;
    card_id: string;
    reference_month: string;
    due_date: string;
    status: string;
    total_amount: number;
}

interface CardData {
    id: string;
    name: string;
}

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<InvoiceData[]>([]);
    const [cards, setCards] = useState<CardData[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Wallets for payment
    interface WalletData { id: string; name: string }
    const [wallets, setWallets] = useState<WalletData[]>([]);

    // States for payment modal
    const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
    const [paymentWalletId, setPaymentWalletId] = useState<string>('');
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [invRes, cardRes, walletRes] = await Promise.all([
                apiClient.get('/invoices/'),
                apiClient.get('/cards/'),
                apiClient.get('/wallets/')
            ]);
            setInvoices(invRes.data);
            setCards(cardRes.data);
            setWallets(walletRes.data);
            if (walletRes.data.length > 0) setPaymentWalletId(walletRes.data[0].id);
        } catch (error) {
            console.error('Error fetching invoices', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const confirmPayment = async () => {
        if (!paymentWalletId) {
            alert('Selecione uma conta para pagar a fatura.');
            return;
        }

        try {
            await apiClient.put(`/invoices/${payingInvoiceId}/pay`, null, {
                params: {
                    wallet_id: paymentWalletId,
                    payment_date: paymentDate
                }
            });
            fetchData();
            setPayingInvoiceId(null);
        } catch (error: any) {
            console.error('Error paying invoice', error);
            alert(error.response?.data?.detail || 'Erro ao pagar fatura.');
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Faturas de Cartão</h1>
                    <p className="text-slate-400 mt-1">Acompanhe e pague as faturas dos seus cartões de crédito.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={40} className="animate-spin text-fuchsia-500 opacity-50" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {invoices.map(invoice => {
                        const cardName = cards.find(c => c.id === invoice.card_id)?.name || 'Cartão desconhecido';
                        const isPaid = invoice.status === 'paid';

                        return (
                            <Card key={invoice.id} className="group hover:border-fuchsia-500/30 transition-all">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-3 rounded-xl ${isPaid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-fuchsia-500/20 text-fuchsia-400'}`}>
                                        <Receipt size={24} />
                                    </div>
                                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${isPaid ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-amber-500/30 text-amber-400 bg-amber-500/10'}`}>
                                        {isPaid ? 'Paga' : 'Aberta / Fechada'}
                                    </span>
                                </div>

                                <div className="mb-4">
                                    <h3 className="text-sm font-medium text-slate-400 flex items-center gap-1.5 uppercase tracking-wider mb-1">
                                        <CreditCard size={14} /> {cardName}
                                    </h3>
                                    <p className="text-2xl font-bold text-white tracking-tight">{formatCurrency(invoice.total_amount)}</p>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                        <span className="text-slate-400">Mês Ref.</span>
                                        <span className="text-white font-medium">{new Date(invoice.reference_month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                        <span className="text-slate-400">Vencimento</span>
                                        <span className="text-white font-medium">{new Date(invoice.due_date).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-col gap-3">
                                    <button
                                        onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
                                        className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Activity size={18} /> Ver Detalhes
                                    </button>

                                    {!isPaid && (
                                        <button
                                            onClick={() => setPayingInvoiceId(invoice.id)}
                                            disabled={invoice.total_amount === 0}
                                            className="w-full py-2.5 bg-gradient-to-r from-fuchsia-600 to-rose-600 hover:opacity-90 disabled:opacity-50 text-white rounded-xl font-medium transition-opacity flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={18} /> Pagar Fatura Agora
                                        </button>
                                    )}
                                    {isPaid && (
                                        <div className="w-full py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-medium flex items-center justify-center gap-2">
                                            <CheckCircle size={18} /> Fatura Paga
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )
                    })}
                    {invoices.length === 0 && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                            <Receipt className="mx-auto text-slate-600 mb-4" size={48} />
                            <p className="text-slate-400">Você ainda não tem faturas geradas (transações atreladas a cartões).</p>
                        </div>
                    )}
                </div>
            )}
            {payingInvoiceId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <Card className="w-full max-w-md border-fuchsia-500/30">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white tracking-tight">Pagar Fatura</h2>
                            <button onClick={() => setPayingInvoiceId(null)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Conta para Débito</label>
                                <select
                                    value={paymentWalletId}
                                    onChange={(e) => setPaymentWalletId(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all"
                                >
                                    <option value="" disabled>Selecione uma conta...</option>
                                    {wallets.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Data do Pagamento</label>
                                <input
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all"
                                />
                            </div>
                            <div className="flex justify-end pt-4 gap-3">
                                <button
                                    onClick={() => setPayingInvoiceId(null)}
                                    className="px-5 py-2.5 text-slate-300 hover:text-white transition-colors font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmPayment}
                                    className="px-5 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-fuchsia-500/20"
                                >
                                    Confirmar Pagamento
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
