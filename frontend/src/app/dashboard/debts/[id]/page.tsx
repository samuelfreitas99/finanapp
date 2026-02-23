'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { CheckCircle, Clock, Loader2, ArrowLeft, Briefcase, RotateCcw } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

interface InstallmentData {
    id: string;
    debt_id: string;
    installment_number: number;
    due_date: string;
    principal_component: number | null;
    interest_component: number | null;
    total_amount: number;
    paid: boolean;
    paid_transaction_id: string | null;
}

interface DebtData {
    id: string;
    name: string;
    total_installments: number;
    principal_amount: number;
    status: 'active' | 'finished';
}

export default function DebtInstallmentsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [installments, setInstallments] = useState<InstallmentData[]>([]);
    const [debt, setDebt] = useState<DebtData | null>(null);
    const [loading, setLoading] = useState(true);
    const [payingId, setPayingId] = useState<string | null>(null);
    const [unpayingId, setUnpayingId] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [instRes, debtRes] = await Promise.all([
                apiClient.get(`/debts/${id}/installments`),
                apiClient.get(`/debts/${id}`)
            ]);
            // Sort by installment number
            const sorted = instRes.data.sort((a: InstallmentData, b: InstallmentData) => a.installment_number - b.installment_number);
            setInstallments(sorted);
            setDebt(debtRes.data);
        } catch (error) {
            console.error('Error fetching installments', error);
            alert('Erro ao carregar parcelas. A dívida pode não existir.');
            router.push('/dashboard/debts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const handlePayInstallment = async (installmentId: string) => {
        if (!confirm('Confirmar o pagamento desta parcela hoje? Isso retirará dinheiro da conta vinculada à dívida.')) return;

        setPayingId(installmentId);
        try {
            await apiClient.put(`/debts/${id}/installments/${installmentId}/pay`, null, {
                params: { payment_date: new Date().toISOString().split('T')[0] }
            });
            fetchData();
        } catch (error: any) {
            console.error('Error paying installment', error);
            alert(error.response?.data?.detail || 'Erro ao pagar parcela.');
        } finally {
            setPayingId(null);
        }
    };

    const handleUnpayInstallment = async (installmentId: string) => {
        if (!confirm('Deseja realmente desfazer o pagamento? A transação registrada será excluída.')) return;

        setUnpayingId(installmentId);
        try {
            await apiClient.put(`/debts/${id}/installments/${installmentId}/unpay`);
            fetchData();
        } catch (error: any) {
            console.error('Error unpaying installment', error);
            alert(error.response?.data?.detail || 'Erro ao desfazer pagamento da parcela.');
        } finally {
            setUnpayingId(null);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                <button
                    onClick={() => router.push('/dashboard/debts')}
                    className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-slate-300 hover:text-white"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Briefcase className="text-emerald-500" />
                        Detalhes da Dívida
                    </h1>
                    <p className="text-slate-400 mt-1">{debt ? debt.name : 'Acompanhe o cronograma de amortização e pague as parcelas.'}</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={40} className="animate-spin text-emerald-500 opacity-50" />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="border-emerald-500/30 md:col-span-2">
                            <h3 className="text-sm font-medium text-slate-400 mb-1">Valor Principal</h3>
                            <p className="text-4xl font-bold text-white tracking-tight">{formatCurrency(debt?.principal_amount || 0)}</p>
                        </Card>
                        <Card className="border-emerald-500/30">
                            <h3 className="text-sm font-medium text-slate-400 mb-1">Total de Parcelas</h3>
                            <p className="text-3xl font-bold text-white tracking-tight">{debt?.total_installments || installments.length}</p>
                        </Card>
                        <Card className="flex flex-col justify-center border-emerald-500/30">
                            <h3 className="text-sm font-medium text-slate-400 mb-2">Status</h3>
                            <div>
                                {debt?.status === 'active' && <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium">Ativa</span>}
                                {debt?.status === 'finished' && <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">Liquidada</span>}
                            </div>
                        </Card>
                    </div>

                    <Card className="p-0 overflow-hidden border-emerald-500/20">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="text-xs uppercase bg-white/5 text-slate-400 border-b border-white/10">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 font-medium">Nº</th>
                                        <th scope="col" className="px-6 py-4 font-medium">Vencimento</th>
                                        <th scope="col" className="px-6 py-4 font-medium">Valor Parcela</th>
                                        <th scope="col" className="px-6 py-4 font-medium">Status</th>
                                        <th scope="col" className="px-6 py-4 font-medium text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {installments.map(inst => {
                                        return (
                                            <tr key={inst.id} className={`border-b border-white/5 transition-colors ${inst.paid ? 'bg-emerald-500/5' : 'hover:bg-white/[0.02]'}`}>
                                                <td className="px-6 py-5 font-semibold text-white">
                                                    {inst.installment_number}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="flex items-center gap-2">
                                                        <Clock size={14} className={inst.paid ? 'text-emerald-500' : 'text-slate-500'} />
                                                        {new Date(inst.due_date).toLocaleDateString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 font-medium text-white">
                                                    {formatCurrency(inst.total_amount)}
                                                </td>
                                                <td className="px-6 py-5">
                                                    {inst.paid ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                            <CheckCircle size={12} /> PAGA
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                            <Clock size={12} /> PENDENTE
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    {!inst.paid ? (
                                                        <button
                                                            onClick={() => handlePayInstallment(inst.id)}
                                                            disabled={payingId === inst.id}
                                                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 disabled:opacity-50 text-white rounded-lg font-medium transition-opacity inline-flex items-center gap-2 text-xs"
                                                        >
                                                            {payingId === inst.id ? <Loader2 size={14} className="animate-spin" /> : 'Pagar Agora'}
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-3">
                                                            <span className="text-slate-500 text-xs font-medium">Efetuado</span>
                                                            <button
                                                                onClick={() => handleUnpayInstallment(inst.id)}
                                                                disabled={unpayingId === inst.id}
                                                                className="text-slate-500 hover:text-amber-400 p-1.5 rounded-lg hover:bg-amber-500/10 transition-colors disabled:opacity-50"
                                                                title="Desfazer pagamento"
                                                            >
                                                                {unpayingId === inst.id ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}
