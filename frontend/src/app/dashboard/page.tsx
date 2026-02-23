'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import {
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    TrendingUp,
    Settings2,
    PieChart,
    PlusCircle,
    CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface ReportData {
    month: number;
    year: number;
    view_type: string;
    total_income: number;
    total_expense: number;
    net_balance: number;
    expenses_by_category: { category_name: string, total_amount: number }[];
}

export default function DashboardPage() {
    const [report, setReport] = useState<ReportData | null>(null);
    const [forecastData, setForecastData] = useState<any[]>([]);
    const [viewType, setViewType] = useState<'cash' | 'accrual'>('cash');
    const [loading, setLoading] = useState(true);

    const [filterType, setFilterType] = useState<'month' | 'custom'>('month');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        const fetchReport = async () => {
            setLoading(true);
            try {
                let query = `?month=${month}&year=${year}&view=${viewType}`;
                if (filterType === 'custom' && startDate && endDate) {
                    query = `?start_date=${startDate}&end_date=${endDate}&view=${viewType}`;
                }
                const response = await apiClient.get(`/reports/${query}`);
                setReport(response.data);
            } catch (error) {
                console.error('Error fetching dashboard report', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchForecast = async () => {
            try {
                const pastDate = new Date();
                pastDate.setMonth(pastDate.getMonth() - 11); // 12 months ago
                const startDateStr = pastDate.toISOString().split('T')[0];
                const res = await apiClient.get(`/reports/forecast?months_ahead=18&start_date=${startDateStr}`);
                setForecastData(res.data.months);
            } catch (err) {
                console.error('Error fetching forecast', err);
            }
        };

        if (filterType === 'month') {
            fetchReport();
        } else if (filterType === 'custom' && startDate && endDate) {
            fetchReport();
        }
        fetchForecast();
    }, [month, year, filterType, startDate, endDate, viewType]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const getMonthName = (monthNumber: number) => {
        const date = new Date(2000, monthNumber - 1, 1);
        return date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase();
    };

    return (
        <div className="space-y-8">
            {/* Header Info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Visão Geral</h1>
                    <p className="text-slate-400 mt-1">Bem-vindo de volta! Acompanhe suas finanças.</p>
                </div>

                <div className="flex flex-wrap gap-3 items-center justify-end">
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

                    {/* Toggle Cash/Accrual */}
                    <div className="bg-slate-900 border border-white/5 p-1 rounded-xl flex items-center shadow-lg w-fit">
                        <button
                            onClick={() => setViewType('cash')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewType === 'cash'
                                ? 'bg-blue-500/20 text-blue-400 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Caixa
                        </button>
                        <button
                            onClick={() => setViewType('accrual')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewType === 'accrual'
                                ? 'bg-violet-500/20 text-violet-400 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Competência
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-slate-900 rounded-2xl border border-white/5" />
                    ))}
                </div>
            ) : (
                <>
                    {/* Main KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card gradient className="group hover:border-violet-500/50 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-violet-500/20 text-violet-400 rounded-xl group-hover:scale-110 transition-transform">
                                    <Wallet size={24} />
                                </div>
                                <span className="text-xs font-medium px-2.5 py-1 bg-white/5 text-slate-300 rounded-full">
                                    Mês Atual
                                </span>
                            </div>
                            <h3 className="text-slate-400 text-sm font-medium">Saldo Líquido</h3>
                            <p className="text-3xl font-bold text-white mt-1 tracking-tight">
                                {formatCurrency(report?.net_balance || 0)}
                            </p>
                        </Card>

                        <Card className="hover:border-emerald-500/30 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                                    <ArrowUpRight size={24} />
                                </div>
                            </div>
                            <h3 className="text-slate-400 text-sm font-medium">Receitas</h3>
                            <p className="text-3xl font-bold text-white mt-1 tracking-tight">
                                {formatCurrency(report?.total_income || 0)}
                            </p>
                        </Card>

                        <Card className="hover:border-red-500/30 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-red-500/10 text-red-400 rounded-xl">
                                    <ArrowDownRight size={24} />
                                </div>
                            </div>
                            <h3 className="text-slate-400 text-sm font-medium">Despesas</h3>
                            <p className="text-3xl font-bold text-white mt-1 tracking-tight">
                                {formatCurrency(report?.total_expense || 0)}
                            </p>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="col-span-1 lg:col-span-2">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-semibold text-white flex items-center gap-2">
                                    <TrendingUp className="text-blue-400" size={20} />
                                    Despesas por Categoria
                                </h3>
                            </div>
                            {report?.expenses_by_category && report.expenses_by_category.length > 0 ? (
                                <div className="space-y-4">
                                    {report.expenses_by_category.sort((a, b) => b.total_amount - a.total_amount).map((cat, idx) => {
                                        const percentage = (cat.total_amount / (report.total_expense || 1)) * 100;
                                        return (
                                            <div key={idx} className="flex flex-col gap-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-300">{cat.category_name}</span>
                                                    <span className="text-white font-medium">{formatCurrency(cat.total_amount)}</span>
                                                </div>
                                                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-gradient-to-r from-blue-500 to-violet-500 h-2 rounded-full"
                                                        style={{ width: `${Math.min(100, percentage)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-40 flex flex-col items-center justify-center text-slate-500">
                                    <PieChart size={40} className="mb-2 opacity-50" />
                                    <p>Sem despesas no período</p>
                                </div>
                            )}
                        </Card>

                        <Card className="col-span-1 border-dashed border-2 bg-slate-900/50 flex flex-col p-6 hover:bg-slate-900/80 transition-colors">
                            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                                <Settings2 className="text-fuchsia-400" size={20} />
                                Ações Rápidas
                            </h3>
                            <div className="flex flex-col gap-3">
                                <Link href="/dashboard/transactions" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors">
                                    <div className="bg-blue-500/20 text-blue-400 p-2 rounded-lg">
                                        <PlusCircle size={18} />
                                    </div>
                                    <span className="font-medium text-sm">Novo Lançamento</span>
                                </Link>
                                <Link href="/dashboard/cards" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors">
                                    <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-lg">
                                        <CreditCard size={18} />
                                    </div>
                                    <span className="font-medium text-sm">Gerenciar Cartões</span>
                                </Link>
                                <Link href="/dashboard/invoices" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors">
                                    <div className="bg-rose-500/20 text-rose-400 p-2 rounded-lg">
                                        <Wallet size={18} />
                                    </div>
                                    <span className="font-medium text-sm">Pagar Faturas</span>
                                </Link>
                            </div>
                        </Card>
                    </div>

                    {/* Projeção (Forecast) e Histórico Chart */}
                    <Card className="col-span-1 border-white/5 bg-slate-900 overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <TrendingUp className="text-emerald-400" size={20} />
                                Histórico e Projeção (18 Meses)
                            </h3>
                            <div className="flex gap-4 text-xs font-medium">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div> Receitas
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div> Despesas
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div> Saldo
                                </div>
                            </div>
                        </div>

                        <div className="h-80 w-full mt-4">
                            {forecastData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="month" tickFormatter={(tick) => getMonthName(tick)} stroke="#475569" fontSize={12} tickMargin={10} />
                                        <YAxis stroke="#475569" fontSize={12} tickFormatter={(val) => `R$${val / 1000}k`} />
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                                            itemStyle={{ color: '#fff', fontSize: '14px' }}
                                            labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
                                            formatter={(value: any) => formatCurrency(Number(value))}
                                            labelFormatter={(label: any) => getMonthName(label)}
                                        />
                                        <ReferenceLine x={(new Date().getMonth() + 1).toString()} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: 'Hoje', fill: '#f59e0b', fontSize: 12 }} />
                                        <Area type="monotone" dataKey="total_income" name="Receitas" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                                        <Area type="monotone" dataKey="total_expense" name="Despesas" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                                        <Area type="monotone" dataKey="net_balance" name="Saldo Líquido" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorNet)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-500">
                                    <p>Nenhum dado de projeção disponível.</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}
