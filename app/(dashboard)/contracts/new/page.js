'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Save, Plus, Trash2, Calendar, Users as UsersIcon, FileText, Package, CreditCard, Loader2, Eye, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'

// Default empty contract state
const initialContract = {
    customer_name: '',
    shooting_date: new Date().toISOString().split('T')[0],
    location: '',
    email: '',
    customer_phone: '',
    package_name: '',
    package_price: '', // Changed from 0 to '' to show placeholder
    package_content: '',
    deposit: '', // Changed from 0 to '' to show placeholder
    payment_note: 'Kalan ödeme çekim günü alınacaktır.',
    color: null, // No default color selection
    clauses: [] // Populated later
}

const defaultClauses = [
    "Sunulan tüm fotoğraf ve video hizmetleri profesyonel ekip planlaması, operasyon takvimi ve yaratıcı kurgu süreci doğrultusunda yürütülür. Her proje, çekim gününün gerçek akışına ve duygusal bütünlüğüne uygun olacak şekilde planlanır ve uygulanır.",
    "Rezervasyon, sözleşme ve kapora ödemesi ile kesinleşir. Kapora, tarih garanti ve operasyon planlama bedelidir ve iade edilmez. Kalan ödeme çekim tarihinden 3–7 iş günü önce veya en geç çekim günü tamamlanır.",
    "Müşteri tarafından organizasyonun iptal edilmesi durumunda en geç 60 gün öncesinden yazılı bildirim yapılması zorunludur. Bu süre dışında yapılan iptallerde hizmet bedelinin tamamı tahsil edilir. Sağlık veya ağır hava koşulları gibi zorunlu durumlarda, takvim uygunluğu olması halinde aynı yıl içerisinde tarih değişikliği yapılabilir. Devlet kararları, resmi kısıtlamalar, salgın, savaş, terör, karantina veya benzeri mücbir sebepler durumunda ödenen toplam bedelin %30’u iade edilir.",
    "Çekim günü planlanan saat akışına uyulması zorunludur. Organizasyon akışı, hazırlık süreçleri, üçüncü taraf hizmet sağlayıcılar veya dış etkenlerden kaynaklanan gecikmelerden çekim ekibi sorumlu tutulamaz. Drone çekimleri yalnızca uygun hava koşulları ve yasal uçuş izinleri dahilinde gerçekleştirilir.",
    "Video ve klip projelerinde müzik seçimi, hikaye akışı, ritim dengesi ve kurgu bütünlüğü gözetilerek ekip tarafından belirlenir. Bu süreçte yaratıcı kontrol prodüksiyon ekibine aittir. Müşteri, teslim edilen projede müzik değişikliği talep edebilir. Müzik değişikliği yalnızca müzik dosyasının değiştirilmesini kapsar; mevcut kurgu yapısı, ritim düzeni ve edit akışı değiştirilmez. Kurgu yapısının yeniden düzenlenmesi veya farklı edit çalışması talep edilmesi durumunda ek kurgu / montaj ücreti uygulanır.",
    "Revize süreci yalnızca görüntü düzenlemeleri kapsamında değerlendirilir. Revize kapsamında müşteri, klip veya videoda yer alan beğenmediği görüntülerin çıkarılmasını talep edebilir. Çıkarılan görüntü yerine arşivde uygun alternatif görüntü bulunması halinde ekleme yapılır. Alternatif görüntü bulunmaması durumunda, kaldırılan görüntünün yerine kurgunun bütünlüğü korunarak sahnenin öncesinde veya sonrasında yer alan uygun görüntüler kullanılır. Revize süreci, kurgunun genel yapısının, hikaye akışının veya edit ritminin yeniden oluşturulmasını kapsamaz. Kurgunun yeniden düzenlenmesi veya farklı edit çalışması talep edilmesi durumunda ek kurgu / montaj ücreti uygulanır.",
    "Teslim edilen video veya klip ile ilgili revize taleplerinin, teslim bilgisinin paylaşılmasından itibaren 7 gün içerisinde yazılı olarak iletilmesi gerekmektedir. Bu sürenin sonunda revize günü sona erer video düzenleme çalışma dosyaları arşivden kaldırılır.",
    "Video teslim süresi organizasyon tarihinden itibaren en geç 3 ay içerisindedir. Albüm teslim süresi, albüm için fotoğraf seçimlerinin müşteri tarafından tamamlanmasından itibaren en geç 3 ay içerisindedir. Albüm için fotoğraf seçimlerinin organizasyon tarihinden sonra en geç 1 ay içerisinde tamamlanması gerekmektedir. Bu sürenin aşılması durumunda, albüm üretim maliyetlerinde oluşabilecek fiyat farkları müşteriye yansıtılabilir.",
    "Ödemesi tamamlanmamış çekim kayıtları 7 gün süre ile saklanır. Ödemesi tamamlanmış çekim arşivleri 2 ay süre ile saklanır. Belirtilen süreler sonrasında arşivlerin tekrar talep edilmesi durumunda ekstra arşiv saklama ve arşiv çıkarma ücreti uygulanır.",
    "Çekim arşivleri, organizasyon tarihinden itibaren 2 ay süre ile saklanır. Müşterinin arşiv teslimini bu süre içerisinde tamamlaması gerekmektedir. 2 ay sonrasında arşivlerin silinmesi veya veri kaybı yaşanması durumunda hizmet sağlayıcının herhangi bir sorumluluğu bulunmaz.",
    "Organizasyon günü çekim ekibinin akşam yemek organizasyonu müşteri tarafından sağlanır.",
    "Tüm hizmet süreçleri Türk Borçlar Kanunu hükümlerine tabidir.",
    "İş bu sözleşme iki nüsha olarak tanzim, imza ve teyit edilmiştir."
];

// Pre-fill initial clauses
initialContract.clauses = defaultClauses.map((text, i) => ({ id: i, text }));

function NewContractContent() {
    const router = useRouter()
    const supabase = createClient()
    const [formData, setFormData] = useState(initialContract)
    const [loading, setLoading] = useState(false)
    const [packages, setPackages] = useState([])
    const [loadingPackages, setLoadingPackages] = useState(true)
    const [colorLabels, setColorLabels] = useState({
        '11': 'Kırmızı',
        '5': 'Sarı',
        '7': 'Mavi',
        '10': 'Yeşil'
    })

    // Fetch packages and DB Settings
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoadingPackages(true)
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return;

                // 1. Fetch Packages
                const { data: pkgData } = await supabase.from('packages').select('*').order('created_at', { ascending: true });
                if (pkgData) setPackages(pkgData);

                // 2. Fetch Settings for Color Labels
                // Use a standard select and check for error to avoid crashing if column missing
                try {
                    const { data: settingsData, error: settingsError } = await supabase
                        .from('settings')
                        .select('color_labels')
                        .eq('user_id', user.id)
                        .maybeSingle();

                    if (!settingsError && settingsData?.color_labels) {
                        setColorLabels(settingsData.color_labels);
                    }
                } catch (e) {
                    console.warn("Color labels column might be missing. Please run SQL migration.", e);
                }

                // 3. Load Persisted Payment Note from LocalStorage
                const savedNote = localStorage.getItem('last_payment_note');
                if (savedNote) {
                    setFormData(prev => ({ ...prev, payment_note: savedNote }));
                }
            } catch (error) {
                console.error("Data fetch error:", error);
            } finally {
                setLoadingPackages(false)
            }
        }
        fetchData();
    }, [supabase])

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))

        // Save payment note to persistence
        if (name === 'payment_note') {
            localStorage.setItem('last_payment_note', value);
        }
    }

    const formatNumber = (value) => {
        if (value === '' || value === null || value === undefined) return '';
        // Remove existing dots and non-digits to get raw string
        const rawValue = value.toString().replace(/[^0-9]/g, '');
        if (rawValue === '') return '';
        // Format with dots
        return new Intl.NumberFormat('tr-TR').format(parseInt(rawValue));
    }

    const parseNumber = (value) => {
        if (value === '' || value === null || value === undefined) return ''; // Keep empty string for state if input is empty
        const parsed = parseInt(value.toString().replace(/\./g, ''));
        return isNaN(parsed) ? '' : parsed; // Return empty string if not a valid number after parsing
    }

    const handlePriceChange = (e) => {
        const { name, value } = e.target

        // Allow empty
        if (value === '') {
            setFormData(prev => ({ ...prev, [name]: '' }))
            return;
        }

        // Let's stick to storing raw number (or empty string) in state.
        const raw = parseNumber(value);
        setFormData(prev => ({ ...prev, [name]: raw }))
    }

    const handleClauseChange = (index, value) => {
        const newClauses = [...formData.clauses];
        newClauses[index].text = value;
        setFormData(prev => ({ ...prev, clauses: newClauses }));
    }

    const applyPackage = (pkg) => {
        setFormData(prev => ({
            ...prev,
            package_name: pkg.name,
            // package_price: pkg.price, // Don't autofill price
            package_content: pkg.content || '' // Use 'content' column
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                throw new Error('Kullanıcı oturumu bulunamadı')
            }

            // Add user_id to the request body logic if we were calling API with user info, 
            // but API route gets user from auth header. However, we should check if API needs update.
            // Actually the API route handles getUser() itself, so we just send data.

            const response = await fetch('/api/contract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Bir hata oluştu');
            }

            // Download PDF
            if (result.pdfBase64) {
                const byteCharacters = atob(result.pdfBase64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });

                const fileName = `${formData.shooting_date} - Sozlesme.pdf`;

                // Try "Save As" if browser supports File System Access API
                if (window.showSaveFilePicker) {
                    try {
                        const handle = await window.showSaveFilePicker({
                            suggestedName: fileName,
                            types: [{
                                description: 'PDF Document',
                                accept: { 'application/pdf': ['.pdf'] },
                            }],
                        });
                        const writable = await handle.createWritable();
                        await writable.write(blob);
                        await writable.close();
                    } catch (err) {
                        // User cancelled or error occurred
                        console.error("Save picker error:", err);
                    }
                } else {
                    // Fallback to standard download
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                }
            }

            toast.success("Sözleşme başarıyla oluşturuldu ve indirildi!");
            router.push('/contracts');

        } catch (error) {
            console.error(error);
            toast.error("Hata: " + error.message);
        } finally {
            setLoading(false)
        }
    }

    const [previewUrl, setPreviewUrl] = useState(null)
    const [showPreview, setShowPreview] = useState(false)

    const handlePreview = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/contract/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (!response.ok) throw new Error('Önizleme oluşturulamadı')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            setPreviewUrl(url)
            setShowPreview(true)
            toast.success('Önizleme hazır')
        } catch (error) {
            console.error('Preview error:', error)
            toast.error('Önizleme sırasında bir hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/contracts"
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                >
                    <ChevronLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Yeni Sözleşme Oluştur</h1>
                    <p className="text-gray-500 text-sm">Müşteri için yeni bir hizmet sözleşmesi hazırla.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form Area */}
                <div className="lg:col-span-2 space-y-6">

                    {/* CUSTOMER INFO */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <UsersIcon size={18} className="text-[var(--color-brand-primary)]" />
                            1. Müşteri Bilgileri
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500">Gelin & Damat Adı</label>
                                <input
                                    type="text"
                                    name="customer_name"
                                    required
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 focus:border-[var(--color-brand-primary)] transition-all text-gray-900"
                                    placeholder="Örn: Ayşe & Ahmet Yılmaz"
                                    value={formData.customer_name}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500">E-Posta Adresi</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 focus:border-[var(--color-brand-primary)] transition-all text-gray-900"
                                    placeholder="ornek@email.com"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500">Müşteri Telefonu</label>
                                <input
                                    type="tel"
                                    name="customer_phone"
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 focus:border-[var(--color-brand-primary)] transition-all text-gray-900"
                                    placeholder="0 5xx xxx xx xx"
                                    value={formData.customer_phone}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SHOOTING DETAILS */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Calendar size={18} className="text-[var(--color-brand-primary)]" />
                            2. Çekim Detayları
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500">Çekim Tarihi</label>
                                <input
                                    type="date"
                                    name="shooting_date"
                                    required
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 focus:border-[var(--color-brand-primary)] transition-all text-gray-900"
                                    value={formData.shooting_date}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500">Çekim Yeri</label>
                                <input
                                    type="text"
                                    name="location"
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 focus:border-[var(--color-brand-primary)] transition-all text-gray-900"
                                    placeholder="Örn: Alaçatı / İzmir"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        {/* Color Picker */}
                        <div className="pt-2">
                            <label className="text-xs font-medium text-gray-500 block mb-3">Takvim Rengi (Google Calendar)</label>
                            <div className="flex gap-8 flex-wrap">
                                {[
                                    { id: '11', color: '#d50000', label: 'Kırmızı' }, // Tomato
                                    { id: '5', color: '#f6bf26', label: 'Sarı' },    // Banana
                                    { id: '7', color: '#039be5', label: 'Mavi' },    // Peacock
                                    { id: '10', color: '#0b8043', label: 'Yeşil' }   // Basil
                                ].map((c) => (
                                    <div key={c.id} className="flex flex-col items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, color: c.id }))}
                                            className={clsx(
                                                "w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center",
                                                formData.color === c.id ? "border-gray-600 scale-110 shadow-sm" : "border-transparent hover:scale-110"
                                            )}
                                            style={{ backgroundColor: c.color }}
                                            title={colorLabels[c.id] || c.label}
                                        >
                                            {formData.color === c.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </button>
                                        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider text-center max-w-[60px] truncate">
                                            {colorLabels[c.id] || c.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* PACKAGE SELECTION (Simplified for brevity regarding replacement) */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Package size={18} className="text-[var(--color-brand-primary)]" />
                            3. Paket ve Hizmetler
                        </h3>

                        {/* Package Selector */}
                        {loadingPackages ? (
                            <div className="text-sm text-gray-500">Paketler yükleniyor...</div>
                        ) : packages.length > 0 ? (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-500">Kayıtlı Paketlerden Seç</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {packages.map(pkg => (
                                        <button
                                            key={pkg.id}
                                            type="button"
                                            onClick={() => applyPackage(pkg)}
                                            className={clsx(
                                                "text-left p-3 rounded-lg border transition-all group",
                                                formData.package_name === pkg.name
                                                    ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5"
                                                    : "border-gray-200 hover:border-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/5"
                                            )}
                                        >
                                            <div className={clsx("font-medium text-sm", formData.package_name === pkg.name ? "text-[var(--color-brand-primary)]" : "text-gray-700 group-hover:text-[var(--color-brand-primary)]")}>{pkg.name}</div>
                                            {/* Price hidden */}
                                        </button>
                                    ))}
                                    <Link href="/packages/new" className="flex items-center justify-center gap-1 text-sm text-[var(--color-brand-primary)] border border-dashed border-[var(--color-brand-primary)] rounded-lg hover:bg-[var(--color-brand-primary)]/5">
                                        <Plus size={14} /> Paketleri Yönet
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg text-center">
                                Henüz kayıtlı paketiniz yok. <a href="/packages/new" className="text-[var(--color-brand-primary)] underline">Buradan ekleyebilirsiniz.</a>
                            </div>
                        )}

                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500">Paket Adı (Sözleşmede Görünecek)</label>
                                <input
                                    type="text"
                                    name="package_name"
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 focus:border-[var(--color-brand-primary)] transition-all font-medium text-gray-900"
                                    placeholder="Örn: Gold Düğün Paketi"
                                    value={formData.package_name}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500">Paket İçeriği</label>
                                <textarea
                                    name="package_content"
                                    rows="5"
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 focus:border-[var(--color-brand-primary)] transition-all text-sm text-gray-900"
                                    placeholder="- Tüm gün çekim&#10;- Drone çekimi&#10;- Albüm teslimi..."
                                    value={formData.package_content}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* PAYMENT INFO */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                            <CreditCard size={18} className="text-[var(--color-brand-primary)]" />
                            4. Ödeme Bilgileri
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Toplam Tutar (TL)</label>
                                <input
                                    type="text"
                                    name="package_price"
                                    value={formatNumber(formData.package_price)}
                                    onChange={handlePriceChange}
                                    className="w-full p-3 bg-gray-50 rounded-lg border-0 focus:ring-2 focus:ring-emerald-500 font-medium text-lg text-gray-900"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Alınan Kapora (TL)</label>
                                <input
                                    type="text"
                                    name="deposit"
                                    value={formatNumber(formData.deposit)}
                                    onChange={handlePriceChange}
                                    className="w-full p-3 bg-gray-50 rounded-lg border-0 focus:ring-2 focus:ring-emerald-500 font-medium text-lg text-gray-900"
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500">Kalan Tutar</label>
                                <div className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 font-bold">
                                    ₺{((formData.package_price || 0) - (formData.deposit || 0)).toLocaleString('tr-TR')}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1 pt-2">
                            <label className="text-xs font-medium text-gray-500">Ödeme Notu (Opsiyonel)</label>
                            <input
                                type="text"
                                name="payment_note"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 focus:border-[var(--color-brand-primary)] transition-all text-gray-900"
                                placeholder="Örn: Kalan tutar düğün günü ödenecektir."
                                value={formData.payment_note}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    {/* CLAUSES */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <FileText size={18} className="text-[var(--color-brand-primary)]" />
                                5. Sözleşme Maddeleri
                            </h3>
                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, clauses: [...prev.clauses, { text: '' }] }))} className="text-xs text-[var(--color-brand-primary)] hover:underline flex items-center gap-1">
                                <Plus size={14} /> Madde Ekle
                            </button>
                        </div>
                        <div className="space-y-3">
                            {formData.clauses.map((clause, index) => (
                                <div key={index} className="flex gap-2 items-start group">
                                    <span className="text-sm font-bold text-gray-400 mt-2 w-5 text-center">{index + 1}.</span>
                                    <textarea
                                        rows="2"
                                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 focus:border-[var(--color-brand-primary)] transition-all text-sm text-gray-900"
                                        value={clause.text}
                                        onChange={(e) => handleClauseChange(index, e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeClause(index)}
                                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Sidebar Actions */}
                <div className="lg:col-span-1">
                    <div className="sticky top-8 space-y-4">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4">İşlemler</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Formu doldurduktan sonra önce önizleyebilir, ardından sözleşmeyi oluşturup PDF olarak indirebilirsiniz.
                            </p>

                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={handlePreview}
                                    disabled={loading}
                                    className="w-full py-3 bg-white border border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] rounded-xl font-medium hover:bg-[var(--color-brand-primary)]/5 transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Eye size={20} />}
                                    Şablonu Önizle
                                </button>

                                <button
                                    type="submit"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="w-full py-3 bg-[var(--color-brand-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-brand-accent)] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[var(--color-brand-primary)]/20"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                    Sözleşmeyi Oluştur
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <FileText size={20} className="text-[var(--color-brand-primary)]" />
                                Sözleşme Önizleme
                            </h3>
                            <button onClick={() => { setShowPreview(false); setPreviewUrl(null); }} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 bg-gray-200 p-4 overflow-hidden">
                            {previewUrl && (
                                <iframe
                                    src={previewUrl}
                                    className="w-full h-full rounded-lg shadow-lg border border-gray-300 bg-white"
                                    title="Sözleşme Önizleme"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function NewContractPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-gray-400" size={32} /></div>}>
            <NewContractContent />
        </Suspense>
    )
}
