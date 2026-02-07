'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import { Save, Building2, FileText, AlertCircle, CheckCircle2, Calendar as GoogleCalendarIcon } from 'lucide-react'

function SettingsContent() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [user, setUser] = useState(null)
    const searchParams = useSearchParams()

    const [formData, setFormData] = useState({
        company_name: '',
        representative_name: '',
        address: '',
        phone: '',
        email: '',
        google_refresh_token: null, // Connection status
        google_email: null,
        color_labels: {
            '11': 'Kırmızı',
            '5': 'Sarı',
            '7': 'Mavi',
            '10': 'Yeşil'
        }
    })

    const loadSettings = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            setUser(user)
            const { data, error } = await supabase
                .from('settings')
                .select('*')
                .eq('user_id', user.id)
                .single()

            if (data) {
                setFormData({
                    company_name: data.company_name || '',
                    representative_name: data.representative_name || '',
                    address: data.address || '',
                    phone: data.phone || '',
                    email: data.email || '',
                    google_refresh_token: data.google_refresh_token || null,
                    google_email: data.google_email || null,
                    color_labels: data.color_labels || {
                        '11': 'Kırmızı',
                        '5': 'Sarı',
                        '7': 'Mavi',
                        '10': 'Yeşil'
                    }
                })
            }
        }
        setLoading(false)
    }

    useEffect(() => {
        loadSettings()
    }, [supabase])

    useEffect(() => {
        const success = searchParams.get('success')
        const error = searchParams.get('error')

        if (success === 'google_connected') {
            toast.success('Google Takvim başarıyla bağlandı! 🎉')
            loadSettings() // Re-fetch to update the 'Connected' status
        } else if (error) {
            toast.error('Google bağlantısı sırasında bir hata oluştu.')
        }
    }, [searchParams])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)

        try {
            const { error } = await supabase
                .from('settings')
                .upsert({
                    user_id: user.id,
                    representative_name: formData.representative_name,
                    address: formData.address,
                    phone: formData.phone,
                    email: formData.email,
                    color_labels: formData.color_labels,
                    updated_at: new Date().toISOString()
                })

            if (error) throw error
            toast.success('Ayarlar başarıyla kaydedildi! 🎉')
        } catch (error) {
            console.error('Error saving settings:', error)
            toast.error('Kayıt sırasında bir hata oluştu. Lütfen veritabanı (SQL) güncellemesini yaptığınızdan emin olun.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8">Yükleniyor...</div>

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
                    <p className="text-gray-500">Firma bilgilerinizi ve takvim tercihlerinizi buradan yönetin.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 pb-12">

                {/* 1. Firma Bilgileri */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 mb-6 text-gray-800 border-b border-gray-50 pb-4">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Building2 size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg">Firma Bilgileri</h2>
                            <p className="text-xs text-gray-400 font-normal">Sözleşmelerde görünecek kurumsal bilgileriniz.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Firma / Yetkili Adı *</label>
                            <input
                                type="text"
                                name="representative_name"
                                value={formData.representative_name}
                                onChange={handleChange}
                                placeholder="Örn: Murat MECİT"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                                required
                            />
                            <p className="text-[10px] text-gray-400 italic">Sözleşmede 'Firma Yetkilisi' kısmında görünür.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Telefon</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="0 5xx xxx xx xx"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">E-mail</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="ornek@mail.com"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-gray-700">Açık Adres</label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Firma adresi..."
                                rows={2}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Takvim Renk Etiketleri */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 mb-6 text-gray-800 border-b border-gray-50 pb-4">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-red-500 via-yellow-400 to-green-500" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg">Takvim Renk Etiketleri</h2>
                            <p className="text-xs text-gray-400 font-normal">Hangi rengin hangi çekim türünü temsil ettiğini kendiniz için isimlendirin.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { id: '11', color: '#d50000', label: 'Kırmızı', hint: 'Örn: Düğün' },
                            { id: '5', color: '#f6bf26', label: 'Sarı', hint: 'Örn: Nişan' },
                            { id: '7', color: '#039be5', label: 'Mavi', hint: 'Örn: Dış Çekim' },
                            { id: '10', color: '#0b8043', label: 'Yeşil', hint: 'Örn: Diğer' }
                        ].map((c) => (
                            <div key={c.id} className="group p-4 bg-gray-50/50 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-white transition-all">
                                <label className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-2 uppercase tracking-wider">
                                    <div className="w-3 h-3 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: c.color }} />
                                    {c.label}
                                </label>
                                <input
                                    type="text"
                                    value={formData.color_labels?.[c.id] || ''}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        color_labels: { ...(prev.color_labels || {}), [c.id]: e.target.value }
                                    }))}
                                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm"
                                    placeholder={c.hint}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Google Calendar Integration */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 mb-6 text-gray-800 border-b border-gray-50 pb-4">
                        <div className="p-2 bg-red-50 rounded-lg">
                            <GoogleCalendarIcon size={24} className="text-red-500" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg">Google Takvim Bağlantısı</h2>
                            <p className="text-xs text-gray-400 font-normal">Takvim senkronizasyon ayarları.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className={clsx(
                            "flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 rounded-2xl border transition-all",
                            formData.google_refresh_token
                                ? "bg-emerald-50/30 border-emerald-100"
                                : "bg-gray-50/50 border-gray-100"
                        )}>
                            <div className="space-y-1 mb-4 sm:mb-0">
                                <p className="font-bold text-gray-900 flex items-center gap-2">
                                    {formData.google_refresh_token ? (
                                        <>
                                            <CheckCircle2 size={18} className="text-emerald-500" />
                                            Bağlantı Aktif
                                            {formData.google_email && (
                                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                                                    {formData.google_email}
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle size={18} className="text-gray-400" />
                                            Bağlı Değil
                                        </>
                                    )}
                                </p>
                                <p className="text-xs text-gray-500 max-w-sm">
                                    {formData.google_refresh_token
                                        ? 'Sözleşmeleriniz otomatik olarak takviminize eklenecek ve dashboard üzerinden görülebilecek.'
                                        : 'Sözleşmeleri takviminizle senkronize etmek için bağlanın.'}
                                </p>
                            </div>
                            {formData.google_refresh_token ? (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (confirm('Takvim bağlantısını koparmak istediğinize emin misiniz?')) {
                                            const { error } = await supabase.from('settings').update({
                                                google_refresh_token: null,
                                                google_email: null
                                            }).eq('user_id', user.id);
                                            if (!error) {
                                                setFormData(p => ({ ...p, google_refresh_token: null, google_email: null }));
                                                toast.success('Bağlantı başarıyla kesildi.');
                                            } else {
                                                toast.error('Bağlantı kesilirken bir hata oluştu.');
                                            }
                                        }
                                    }}
                                    className="px-6 py-2.5 bg-white border border-red-100 text-red-600 rounded-xl hover:bg-red-50 transition-all text-sm font-bold shadow-sm"
                                >
                                    Bağlantıyı Kes
                                </button>
                            ) : (
                                <Link
                                    href="/api/auth/google/login"
                                    className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-sm font-bold shadow-sm flex items-center gap-3"
                                >
                                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5 shadow-sm rounded-sm" alt="Google" />
                                    Google ile Bağlan
                                </Link>
                            )}
                        </div>

                        {formData.google_refresh_token && !formData.google_email && (
                            <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-4">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <AlertCircle size={20} className="text-orange-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-orange-850 mb-1">Görünüm Güncellemesi Gerekli</p>
                                    <p className="text-xs text-orange-700 leading-relaxed">
                                        Takviminizi dashboard üzerinde görebilmeniz için lütfen **Bağlantıyı Kes** yapıp tekrar **Google ile Bağlan** butonuna basın. Bu işlem verileri güncelleyecektir.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Save Footer */}
                <div className="fixed bottom-0 left-0 right-0 sm:left-64 bg-white/80 backdrop-blur-md border-t border-gray-100 p-4 z-40">
                    <div className="max-w-4xl mx-auto flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-2xl hover:bg-blue-700 hover:scale-[1.02] shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 font-bold"
                        >
                            {saving ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save size={20} />
                            )}
                            {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className="p-8">Yükleniyor...</div>}>
            <SettingsContent />
        </Suspense>
    )
}
