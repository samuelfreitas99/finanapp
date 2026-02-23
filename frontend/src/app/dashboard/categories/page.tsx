'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Plus, Tags, Trash2, Loader2, Edit3, X } from 'lucide-react';

interface CategoryData {
    id: string;
    name: string;
    type: string;
    color: string;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [type, setType] = useState('expense');
    const [color, setColor] = useState('#3b82f6'); // default blue
    const [submitting, setSubmitting] = useState(false);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/categories/');
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingCategoryId) {
                await apiClient.put(`/categories/${editingCategoryId}`, { name, type, color });
            } else {
                await apiClient.post('/categories/', { name, type, color });
            }
            setShowForm(false);
            setEditingCategoryId(null);
            setName('');
            setColor('#3b82f6');
            fetchCategories();
        } catch (error: any) {
            console.error('Error saving category', error);
            alert(error?.response?.data?.detail?.[0]?.msg ?? 'Erro ao salvar categoria.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditCategory = (category: CategoryData) => {
        setName(category.name);
        setType(category.type);
        setColor(category.color || '#3b82f6');
        setEditingCategoryId(category.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setEditingCategoryId(null);
        setName('');
        setType('expense');
        setColor('#3b82f6');
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Excluir esta categoria? Isso pode afetar transações antigas.')) return;
        try {
            await apiClient.delete(`/categories/${id}`);
            fetchCategories();
        } catch (error) {
            console.error('Error deleting category', error);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Categorias</h1>
                    <p className="text-slate-400 mt-1">Organize suas transações por categorias personalizadas.</p>
                </div>

                <button
                    onClick={() => showForm ? handleCancelForm() : setShowForm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-violet-500/20"
                >
                    {showForm ? <><X size={20} /> Cancelar</> : <><Plus size={20} /> Nova Categoria</>}
                </button>
            </div>

            {showForm && (
                <Card className="border-violet-500/30">
                    <form onSubmit={handleSaveCategory} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Nome da Categoria</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                placeholder="Ex: Alimentação, Transporte"
                                required
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Tipo</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 appearance-none"
                            >
                                <option value="expense">Despesa</option>
                                <option value="income">Receita</option>
                            </select>
                        </div>
                        <div className="w-24">
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Cor</label>
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-full h-11 bg-slate-950/50 border border-white/10 rounded-xl cursor-pointer p-1"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 text-white rounded-xl font-medium transition-opacity flex items-center h-[46px]"
                        >
                            {submitting ? <Loader2 size={20} className="animate-spin" /> : 'Salvar'}
                        </button>
                    </form>
                </Card>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={40} className="animate-spin text-violet-500 opacity-50" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {categories.map(category => (
                        <Card key={category.id} className="group hover:border-white/20 transition-all p-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-4 h-4 rounded-full shadow-inner"
                                        style={{ backgroundColor: category.color || '#3b82f6' }}
                                    />
                                    <div>
                                        <h3 className="text-white font-medium text-sm">{category.name}</h3>
                                        <p className="text-xs text-slate-500">
                                            {category.type === 'expense' ? 'Despesa' : 'Receita'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEditCategory(category)}
                                        className="text-slate-500 hover:text-violet-400 p-1.5 rounded-lg hover:bg-violet-500/10 transition-colors"
                                        title="Editar categoria"
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCategory(category.id)}
                                        className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                                        title="Excluir categoria"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {categories.length === 0 && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                            <Tags className="mx-auto text-slate-600 mb-4" size={48} />
                            <p className="text-slate-400">Você ainda não tem categorias cadastradas.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
