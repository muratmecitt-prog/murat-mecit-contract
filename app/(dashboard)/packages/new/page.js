'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Save, Loader2, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

export default function NewPackagePage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        // price removed from UI
        content: ''
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                throw new Error('Kullanıcı oturumu bulunamadı.')
            }

            const { error } = await supabase
                .from('packages')
                .insert({
                    user_id: user.id,
                    name: formData.name,
                    price: 0, // Default to 0 as user requested removal from UI
                    content: formData.content
                })

            if (error) throw error

            toast.success('Paket başarıyla oluşturuldu')
            router.push('/packages')
            router.refresh()
        } catch (error) {
            console.error('Error creating package:', error)
            toast.error('Paket oluşturulurken bir hata oluştu: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/packages" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                    <ChevronLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Yeni Paket Oluştur</h1>
                    <p className="text-gray-500 text-sm">Sık kullandığınız paket şablonunu tanımlayın.</p>
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

                    {/* Price input removed as per request */}

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

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[var(--color-brand-primary)] text-white py-3 rounded-xl font-medium hover:bg-[var(--color-brand-accent)] transition-colors shadow-lg flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            Hemen Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
