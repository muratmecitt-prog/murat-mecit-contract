'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusCircle, Package, Trash2, Loader2, Edit } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'
import { toast } from 'react-hot-toast'

export default function PackagesPage() {
    const [packages, setPackages] = useState([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchPackages()
    }, [])

    const fetchPackages = async () => {
        try {
            const { data, error } = await supabase
                .from('packages')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setPackages(data || [])
        } catch (error) {
            console.error('Error fetching packages:', error)
            toast.error('Paketler yüklenirken bir hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Bu paketi silmek istediğinize emin misiniz?')) return

        try {
            const { error } = await supabase
                .from('packages')
                .delete()
                .eq('id', id)

            if (error) throw error

            setPackages(prev => prev.filter(p => p.id !== id))
            toast.success('Paket başarıyla silindi')
        } catch (error) {
            console.error('Error deleting package:', error)
            toast.error('Paket silinirken bir hata oluştu.')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Paket Yönetimi</h1>
                    <p className="text-gray-500 text-sm">Sözleşmelerde kullanacağınız hazır paket şablonlarını buradan yönetin.</p>
                </div>
                <Link
                    href="/packages/new"
                    className="bg-[var(--color-brand-primary)] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[var(--color-brand-accent)] transition-colors shadow-lg shadow-[var(--color-brand-primary)]/20"
                >
                    <PlusCircle size={20} />
                    <span>Yeni Paket Ekle</span>
                </Link>
            </div>

            {packages.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Package size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz Paket Yok</h3>
                    <p className="text-gray-500 mb-6">Sözleşmelerinizi hızlandırmak için ilk paketinizi oluşturun.</p>
                    <Link
                        href="/packages/new"
                        className="text-[var(--color-brand-primary)] font-medium hover:underline"
                    >
                        Şimdi Oluştur
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packages.map((pkg) => (
                        <div key={pkg.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 bg-[var(--color-brand-primary)]/10 rounded-lg flex items-center justify-center text-[var(--color-brand-primary)]">
                                        <Package size={20} />
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                            <Link
                                                href={`/packages/${pkg.id}`}
                                                className="p-2 text-gray-400 hover:text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/5 rounded-lg transition-colors"
                                                title="Düzenle"
                                            >
                                                <Edit size={18} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(pkg.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Sil"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-gray-800 mb-1">{pkg.name}</h3>
                                {/* Price hidden in UI */}

                                <div className="border-t border-gray-50 pt-4">
                                    <p className="text-sm text-gray-500 line-clamp-4 whitespace-pre-wrap">
                                        {pkg.content || 'İçerik bilgisi yok.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
