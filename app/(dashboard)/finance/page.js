'use client'

import { useState, useEffect } from 'react'
import { Wallet, TrendingUp, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export default function FinancePage() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalCollected: 0,
        totalPending: 0,
        contractCount: 0
    })
    const supabase = createClient()

    useEffect(() => {
        const fetchFinancials = async () => {
            try {
                const { data, error } = await supabase
                    .from('contracts')
                    .select('total_price, deposit')

                if (error) throw error

                const totalRevenue = data.reduce((sum, item) => sum + (item.total_price || 0), 0)
                const totalCollected = data.reduce((sum, item) => sum + (item.deposit || 0), 0)
                const totalPending = totalRevenue - totalCollected

                setStats({
                    totalRevenue,
                    totalCollected,
                    totalPending,
                    contractCount: data.length
                })
            } catch (error) {
                console.error('Error fetching financials:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchFinancials()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Finansal Durum</h1>
            <p className="text-gray-500 mb-8">Yapılan tüm sözleşmeler üzerinden hesaplanan toplam kazanç tablosu.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Revenue */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <Wallet size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Toplam Ciro</p>
                            <h3 className="text-2xl font-bold text-gray-900">
                                ₺{stats.totalRevenue.toLocaleString('tr-TR')}
                            </h3>
                        </div>
                    </div>
                    <p className="text-xs text-blue-600 font-medium bg-blue-50 inline-block px-2 py-1 rounded">
                        {stats.contractCount} Sözleşme
                    </p>
                </div>

                {/* Collected */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Alınan (Kapora)</p>
                            <h3 className="text-2xl font-bold text-gray-900">
                                ₺{stats.totalCollected.toLocaleString('tr-TR')}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Pending */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Bekleyen Bakiye</p>
                            <h3 className="text-2xl font-bold text-gray-900">
                                ₺{stats.totalPending.toLocaleString('tr-TR')}
                            </h3>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400">Tahsil edilecek tutar</p>
                </div>
            </div>
        </div>
    )
}
