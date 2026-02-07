'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Save, Loader2, Package, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import React from 'react'
import { toast } from 'react-hot-toast'

export default function EditPackagePage({ params }) {
    // Unwrap params using React.use() as per Next.js 15+ guidance for dynamic routes
    const unwrappedParams = React.use(params);
    const id = unwrappedParams.id;

    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        content: ''
    })

    useEffect(() => {
        const fetchPackage = async () => {
            try {
                const { data, error } = await supabase
                    .from('packages')
                    .select('*')
                    .eq('id', id)
                    .single()

                if (error) throw error
                if (data) {
                    setFormData({
                        name: data.name,
                        content: data.content || ''
                    })
                }
            } catch (error) {
                console.error('Error fetching package:', error)
                toast.error('Paket bilgileri alınamadı.')
                router.push('/packages')
            } finally {
                setLoading(false)
            }
        }

        if (id) fetchPackage()
    }, [id, router])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)

        try {
            const { error } = await supabase
                .from('packages')
                .update({
                    name: formData.name,
                    content: formData.content
                })
                .eq('id', id)

            if (error) throw error

            toast.success('Paket başarıyla güncellendi.')
            router.push('/packages')
            router.refresh()
        } catch (error) {
            console.error('Error updating package:', error)
            toast.error('Paket güncellenirken bir hata oluştu.')
        } finally {
            setSaving(false)
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
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/packages" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                    <ChevronLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Paketi Düzenle</h1>
                    <p className="text-gray-500 text-sm">Mevcut paket bilgilerini güncelleyin.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Paket Adı</label>
                        <div className="relative">
                            <Package className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none"
                                placeholder="Örn: Standart Düğün Paketi"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Paket İçeriği (Maddeler)</label>
                        <textarea
                            required
                            rows={8}
                            value={formData.content}
                            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none resize-none"
                            placeholder="Paket içeriğini buraya yazın..."
                        />
                        <p className="text-xs text-gray-500">Bu içerik sözleşme oluştururken "Paket İçeriği" alanına otomatik doldurulacaktır.</p>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Link
                            href="/packages"
                            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
                        >
                            İptal
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 bg-[var(--color-brand-primary)] text-white py-3 rounded-xl font-medium hover:bg-[var(--color-brand-accent)] transition-colors shadow-lg flex items-center justify-center gap-2"
                        >
                            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            Değişiklikleri Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
