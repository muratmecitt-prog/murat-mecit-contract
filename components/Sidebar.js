'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileText, Settings, LogOut, Package, PieChart, PlusCircle, LayoutGrid } from 'lucide-react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
    { href: '/', label: 'Genel Bakış', icon: LayoutGrid },
    { href: '/contracts/new', label: 'Yeni Sözleşme', icon: PlusCircle },
    { href: '/contracts', label: 'Sözleşmelerim', icon: FileText },
    { href: '/packages', label: 'Paket Yönetimi', icon: Package },
    { href: '/finance', label: 'Finans', icon: PieChart },
    { href: '/settings', label: 'Ayarlar', icon: Settings },
]

export default function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <div className="w-64 bg-white h-screen border-r border-gray-100 flex flex-col fixed left-0 top-0 z-20 shadow-sm">
            <div className="p-8 pb-4 flex items-center justify-center border-b border-gray-50 bg-[var(--color-brand-primary)]/5">
                <div className="text-center">
                    <h1 className="text-xl font-bold text-[var(--color-brand-secondary)]">Murat Mecit</h1>
                    <p className="text-xs text-[var(--color-brand-primary)] uppercase tracking-wider font-semibold mt-1">Fotoğrafçılık</p>
                </div>
            </div>

            <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-[var(--color-brand-primary)] text-white shadow-md shadow-[var(--color-brand-primary)]/20"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-[var(--color-brand-primary)]"
                            )}
                        >
                            <Icon size={20} className={clsx(isActive ? "text-white" : "text-gray-400 group-hover:text-[var(--color-brand-primary)]")} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-500 w-full transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Çıkış Yap</span>
                </button>
            </div>
        </div>
    )
}
