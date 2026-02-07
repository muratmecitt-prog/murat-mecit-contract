'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusCircle, FileText, Calendar, MapPin, Search, Download, Trash2, Loader2, Eye, X, LayoutList, CalendarDays } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import clsx from 'clsx'
import { toast } from 'react-hot-toast'
import CalendarView from './CalendarView'

export default function ContractsPage() {
    const [contracts, setContracts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [viewMode, setViewMode] = useState('list') // 'list' | 'calendar'

    // Preview States
    const [previewContract, setPreviewContract] = useState(null)
    const [previewLoading, setPreviewLoading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState(null)

    const supabase = createClient()

    useEffect(() => {
        fetchContracts()
    }, [])

    const fetchContracts = async () => {
        try {
            const { data, error } = await supabase
                .from('contracts')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setContracts(data || [])
        } catch (error) {
            console.error('Error fetching contracts:', error)
            toast.error('Sözleşmeler yüklenirken bir hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Bu sözleşmeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return

        try {
            const { error } = await supabase
                .from('contracts')
                .delete()
                .eq('id', id)

            if (error) throw error

            setContracts(prev => prev.filter(c => c.id !== id))
            toast.success('Sözleşme silindi')
        } catch (error) {
            console.error('Error deleting contract:', error)
            toast.error('Sözleşme silinirken bir hata oluştu.')
        }
    }

    const openPreview = async (contract) => {
        setPreviewContract(contract)
        setPreviewLoading(true)

        try {
            // Fetch fresh PDF blob
            const response = await fetch('/api/contract/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contract)
            })
            if (!response.ok) throw new Error('Preview failed')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            setPreviewUrl(url)
            toast.success('Önizleme hazır')
        } catch (e) {
            console.error(e)
            toast.error('Önizleme yüklenemedi.')
            setPreviewContract(null) // close on error
        } finally {
            setPreviewLoading(false)
        }
    }

    const closePreview = () => {
        if (previewUrl) window.URL.revokeObjectURL(previewUrl)
        setPreviewContract(null)
        setPreviewUrl(null)
    }

    const filteredContracts = contracts.filter(contract =>
        contract.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.location?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Sözleşmeler</h1>
                    <p className="text-gray-500 text-sm">Oluşturulan tüm düğün sözleşmelerini buradan takip edebilirsiniz.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                        <button
                            onClick={() => setViewMode('list')}
                            className={clsx("p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium", viewMode === 'list' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700')}
                        >
                            <LayoutList size={18} />
                            Liste
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={clsx("p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium", viewMode === 'calendar' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700')}
                        >
                            <CalendarDays size={18} />
                            Takvim
                        </button>
                    </div>

                    <Link
                        href="/contracts/new"
                        className="bg-[var(--color-brand-primary)] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-[var(--color-brand-accent)] transition-colors shadow-lg shadow-[var(--color-brand-primary)]/20"
                    >
                        <PlusCircle size={20} />
                        <span>Yeni Sözleşme</span>
                    </Link>
                </div>
            </div>

            {/* Content Switcher */}
            {viewMode === 'list' ? (
                <>
                    {/* Search and Filters */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Müşteri adı veya çekim yeri ara..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] text-gray-900"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Contracts List */}
                    {contracts.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                                <FileText size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz Sözleşme Yok</h3>
                            <p className="text-gray-500 mb-6">İlk müşteriniz için profesyonel bir sözleşme oluşturun.</p>
                            <Link
                                href="/contracts/new"
                                className="text-[var(--color-brand-primary)] font-medium hover:underline"
                            >
                                Sözleşme Oluştur
                            </Link>
                        </div>
                    ) : filteredContracts.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            Aranan kriterlere uygun sözleşme bulunamadı.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredContracts.map((contract) => (
                                <div key={contract.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group">

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{contract.customer_name}</h3>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    <span>{new Date(contract.shooting_date).toLocaleDateString('tr-TR')}</span>
                                                </div>
                                                {contract.location && (
                                                    <div className="flex items-center gap-1">
                                                        <MapPin size={14} />
                                                        <span>{contract.location}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full md:w-auto border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 flex md:flex-col gap-2 justify-end">
                                        <div className="flex gap-2 w-full md:w-auto">
                                            <button
                                                onClick={() => openPreview(contract)}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                <Eye size={16} />
                                                Önizle
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => handleDelete(contract.id)}
                                            className="w-full md:w-48 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                                        >
                                            <Trash2 size={16} />
                                            Sil
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <CalendarView contracts={contracts} onPreview={openPreview} />
            )}

            {/* Preview Modal - Full Screen Lightbox */}
            {previewContract && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
                    {/* Floating Actions */}
                    <button
                        onClick={closePreview}
                        className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
                    >
                        <X size={24} />
                    </button>

                    <div className="w-full h-full flex flex-col">
                        {previewLoading ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-white">
                                <Loader2 className="w-12 h-12 animate-spin mb-4 text-white/50" />
                                <p className="text-lg font-light text-white/70">Sözleşme Hazırlanıyor...</p>
                            </div>
                        ) : previewUrl ? (
                            <iframe
                                src={previewUrl}
                                className="w-full h-full border-0"
                                title="PDF Preview"
                            />
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-white/80">
                                <p>Önizleme yüklenemedi.</p>
                                <button onClick={closePreview} className="ml-4 underline">Kapat</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
