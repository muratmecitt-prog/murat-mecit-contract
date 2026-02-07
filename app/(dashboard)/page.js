'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusCircle, FileText, Calendar, Loader2, X, Download, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import CalendarView from './contracts/CalendarView'

export default function DashboardPage() {
    const [contracts, setContracts] = useState([])
    const [loading, setLoading] = useState(true)
    const [previewContract, setPreviewContract] = useState(null)
    const [previewLoading, setPreviewLoading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState(null)

    // Stats
    const [stats, setStats] = useState({
        totalContracts: 0,
        upcomingShoots: 0
    })

    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all contracts for stats + calendar
                const { data, error } = await supabase
                    .from('contracts')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (error) throw error

                const allContracts = data || []
                setContracts(allContracts)

                // Calculate Stats
                const today = new Date().toISOString().split('T')[0]
                const upcoming = allContracts.filter(c => c.shooting_date >= today).length

                setStats({
                    totalContracts: allContracts.length,
                    upcomingShoots: upcoming
                })

            } catch (error) {
                console.error('Error fetching dashboard data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const openPreview = async (contract) => {
        setPreviewContract(contract)
        setPreviewLoading(true)

        try {
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
            setPreviewContract(null)
        } finally {
            setPreviewLoading(false)
        }
    }

    const closePreview = () => {
        if (previewUrl) window.URL.revokeObjectURL(previewUrl)
        setPreviewContract(null)
        setPreviewUrl(null)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        )
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Hoş Geldin, Murat</h2>
                    <p className="text-gray-500">Bugün işlerin nasıl gidiyor?</p>
                </div>
                <Link
                    href="/contracts/new"
                    className="bg-[var(--color-brand-primary)] text-white px-6 py-3 rounded-xl hover:bg-[var(--color-brand-accent)] transition-colors flex items-center gap-2 shadow-lg shadow-[var(--color-brand-primary)]/20"
                >
                    <PlusCircle size={20} />
                    <span>Yeni Sözleşme Oluştur</span>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 rounded-full bg-blue-50 text-blue-500">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400 font-medium">Toplam Sözleşme</p>
                        <h3 className="text-2xl font-bold text-gray-800">{stats.totalContracts}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 rounded-full bg-purple-50 text-purple-500">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400 font-medium">Yaklaşan Çekim</p>
                        <h3 className="text-2xl font-bold text-gray-800">{stats.upcomingShoots}</h3>
                    </div>
                </div>
            </div>

            {/* Calendar Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800 text-lg">Çekim Takvimi</h3>
                    <Link href="/contracts" className="text-sm text-blue-600 hover:underline">Listeye Git</Link>
                </div>
                <CalendarView contracts={contracts} onPreview={openPreview} />
            </div>

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
