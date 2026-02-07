'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Camera, Lock, Mail, Loader2 } from 'lucide-react'
import clsx from 'clsx'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const router = useRouter()
    const supabase = createClient()

    const isConfigMissing = !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'placeholder-key'

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (isConfigMissing) {
            setError('Sistem Hatası: Vercel Environment Variables (API Anahtarları) eksik veya hatalı yapılandırılmış.')
            setLoading(false)
            return
        }

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                throw error
            }

            router.push('/')
            router.refresh()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-[var(--color-brand-primary)] opacity-10 blur-3xl"></div>
                <div className="absolute top-[40%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[var(--color-brand-accent)] opacity-10 blur-3xl"></div>
            </div>

            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 z-10 border border-gray-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-[var(--color-brand-primary)] rounded-full flex items-center justify-center mb-4 shadow-lg text-white">
                        <Camera size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--color-brand-secondary)]">Murat Mecit</h2>
                    <p className="text-gray-500 text-sm">Sözleşme Yönetim Paneli</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 ml-1">Email Adresi</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent outline-none transition-all"
                                placeholder="ornek@email.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 ml-1">Şifre</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={clsx(
                            "w-full py-3 rounded-xl text-white font-medium shadow-md transition-all flex justify-center items-center gap-2",
                            "bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-brand-accent)] hover:shadow-lg hover:scale-[1.02]",
                            loading && "opacity-70 cursor-not-allowed"
                        )}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : "Giriş Yap"}
                    </button>
                </form>

                <div className="mt-8 text-center text-xs text-gray-400">
                    &copy; {new Date().getFullYear()} Murat Mecit Fotoğrafçılık
                </div>
            </div>
        </div>
    )
}
