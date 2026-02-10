import { NextResponse } from 'next/server'
import { generateContractPDF } from '@/lib/pdfService'
import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
    try {
        const body = await request.json()

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        let settings = {}
        if (user) {
            const { data: userSettings } = await supabase
                .from('settings')
                .select('*')
                .eq('user_id', user.id)
                .single()
            if (userSettings) settings = userSettings
        }

        // Generate PDF bytes with settings
        const pdfBytes = await generateContractPDF({ ...body, settings })

        // Return as PDF file
        return new NextResponse(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline; filename="onizleme.pdf"',
            },
        })
    } catch (error) {
        console.error('Preview error:', error)
        return NextResponse.json(
            { error: error.message || 'PDF oluşturulurken bir hata oluştu' },
            { status: 500 }
        )
    }
}
