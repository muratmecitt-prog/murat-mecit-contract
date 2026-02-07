'use client'

import { useState, useEffect } from 'react'
import { Loader2, Calendar as GoogleCalendarIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function CalendarView({ contracts, onPreview }) {
    const supabase = createClient()
    const [googleEmail, setGoogleEmail] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchSettings = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('settings')
                    .select('google_email, google_refresh_token')
                    .eq('user_id', user.id)
                    .single()

                if (data?.google_refresh_token) {
                    setGoogleEmail(data.google_email)
                }
            }
            setLoading(false)
        }
        fetchSettings()
    }, [])

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-gray-400 mb-4" size={32} />
                <p className="text-gray-500 font-medium">Takvim Yükleniyor...</p>
            </div>
        )
    }

    if (!googleEmail) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <GoogleCalendarIcon size={32} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Google Takvim Bağlı Değil</h3>
                <p className="text-gray-500 mb-6">Etkinliklerinizi verimli takip etmek için Ayarlar sayfasından Google hesabınızı bağlayın.</p>
                <Link
                    href="/settings"
                    className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-600/20"
                >
                    Ayarlara Git
                </Link>
            </div>
        )
    }

    // Google Calendar Embed URL
    const embedUrl = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(googleEmail)}&ctz=Europe/Istanbul&showTitle=0&showNav=1&showPrint=0&showTabs=1&showCalendars=0&showTz=0&hl=tr`;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-600">Google Takvim (Canlı)</span>
                </div>
                <a
                    href={`https://calendar.google.com/calendar/u/0/r`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline font-medium"
                >
                    Tam Ekran Aç ↗
                </a>
            </div>
            <div className="w-full h-[650px]">
                <iframe
                    src={embedUrl}
                    style={{ border: 0 }}
                    className="w-full h-full"
                    frameBorder="0"
                    scrolling="no"
                ></iframe>
            </div>
        </div>
    )
}
