import { NextResponse } from 'next/server'
import { generateContractPDF } from '@/lib/pdfService'

export async function POST(request) {
    try {
        const body = await request.json()

        // Generate PDF bytes
        const pdfBytes = await generateContractPDF(body)

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
