'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Loader2, ArrowLeft, Receipt, Calendar } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

interface TransactionData {
    id: string;
    type: 'income' | 'expense' | 'transfer';
    description: string;
    amount: number;
    occurred_at: string;
    category_id: string | null;
}

interface CategoryData {
    id: string;
    name: string;
    type: string;
}

interface InvoiceData {
    id: string;
    card_id: string;
    reference_month: string;
    status: 'open' | 'closed' | 'paid';
    total_amount: number;
}

export default function InvoiceDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [transactions, setTransactions] = useState<TransactionData[]>([]);
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [invoice, setInvoice] = useState<InvoiceData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [txRes, catRes, invRes] = await Promise.all([
                apiClient.get(`/transactions/`, { params: { invoice_id: id } }),
                apiClient.get('/categories/'),
                apiClient.get(`/invoices/${id}`)
            ]);
            setTransactions(txRes.data);
            setCategories(catRes.data);
            setInvoice(invRes.data);
        } catch (error) {
            console.error('Error fetching invoice details', error);
            alert('Erro ao carregar detalhes da fatura.');
            router.push('/dashboard/invoices');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const totalAmount = transactions.reduce((acc, tx) => acc + Number(tx.amount), 0);

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                <button
                    onClick={() => router.push('/dashboard/invoices')}
                    className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-slate-300 hover:text-white"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Receipt className="text-fuchsia-500" />
                        Detalhes da Fatura
                    </h1>
                    <p className="text-slate-400 mt-1">Lançamentos registrados nesta fatura de cartão.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={40} className="animate-spin text-fuchsia-500 opacity-50" />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="border-fuchsia-500/30 md:col-span-2">
                            <h3 className="text-sm font-medium text-slate-400 mb-1">Total da Fatura</h3>
                            <p className="text-4xl font-bold text-white tracking-tight">{formatCurrency(invoice?.total_amount || totalAmount)}</p>
                        </Card>
                        <Card className="border-fuchsia-500/30">
                            <h3 className="text-sm font-medium text-slate-400 mb-1">Mês de Referência</h3>
                            <p className="text-2xl font-semibold text-white tracking-tight">
                                {invoice ? new Date(invoice.reference_month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '-'}
                            </p>
                        </Card>
                        <Card className="flex flex-col justify-center border-fuchsia-500/30">
                            <h3 className="text-sm font-medium text-slate-400 mb-2">Status</h3>
                            <div>
                                {invoice?.status === 'paid' && <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">Paga</span>}
                                {invoice?.status === 'closed' && <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium">Fechada</span>}
                                {invoice?.status === 'open' && <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">Aberta</span>}
                            </div>
                        </Card>
                    </div>

                    <Card className="p-0 overflow-hidden border-fuchsia-500/20">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="text-xs uppercase bg-white/5 text-slate-400 border-b border-white/10">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 font-medium">Data</th>
                                        <th scope="col" className="px-6 py-4 font-medium">Descrição</th>
                                        <th scope="col" className="px-6 py-4 font-medium">Categoria</th>
                                        <th scope="col" className="px-6 py-4 font-medium text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map(tx => {
                                        const category = categories.find(c => c.id === tx.category_id);
                                        const isExp = tx.amount < 0;
                                        return (
                                            <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-slate-500" />
                                                        {new Date(tx.occurred_at).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-white">
                                                    {tx.description}
                                                </td>
                                                <td className="px-6 py-4 text-slate-400">
                                                    {category ? category.name : '-'}
                                                </td>
                                                <td className={`px-6 py-4 text-right font-medium ${isExp ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    {formatCurrency(tx.amount)}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {transactions.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                                Nenhum lançamento encontrado nesta fatura.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}
