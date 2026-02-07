import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateContractPDF } from '@/lib/pdfService'
import { createCalendarEvent } from '@/lib/calendarService'

export async function POST(request) {
    const supabase = await createClient()
    const body = await request.json()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized: No user found' }, { status: 401 })
    }

    // 1. Insert into Database first to get an ID
    const { data: contract, error: dbError } = await supabase
        .from('contracts')
        .insert({
            user_id: user.id,
            customer_name: body.customer_name,
            shooting_date: body.shooting_date,
            location: body.location,
            email: body.email,
            customer_phone: body.customer_phone,
            package_content: body.package_content,
            total_price: body.package_price === '' ? 0 : Number(body.package_price),
            deposit: body.deposit === '' ? 0 : Number(body.deposit),
            payment_note: body.payment_note,
            clauses: body.clauses,
        })
        .select()
        .single()

    if (dbError) {
        console.error("DB Error:", dbError)
        return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    try {
        // 5. Add to Calendar (Async)
        try {
            const { data: settings } = await supabase
                .from('settings')
                .select('google_refresh_token')
                .eq('user_id', user.id)
                .single();

            if (settings?.google_refresh_token) {
                createCalendarEvent(body, settings.google_refresh_token).then(id => {
                    if (id) {
                        supabase.from('contracts').update({ calendar_event_id: id }).eq('id', contract.id).then(({ error }) => {
                            if (error) console.error("Error updating contract with calendar ID:", error);
                        });
                    }
                });
            }
        } catch (calError) {
            console.error("Calendar Sync Trigger Error (Non-fatal):", calError);
        }

        // 6. Generate PDF
        const pdfBytes = await generateContractPDF(body)

        // 7. Upload to Storage
        // Note: You need to create a bucket named 'signatures' or 'contracts' in Supabase
        const fileName = `contracts/${contract.id}.pdf`
        const { error: uploadError } = await supabase.storage
            .from('contracts') // 'contracts' bucket
            .upload(fileName, pdfBytes, {
                contentType: 'application/pdf',
                upsert: true
            })

        if (uploadError) {
            console.warn("Upload Error (Non-fatal):", uploadError.message)
        } else {
            // Update URL if upload successful
            const { data: { publicUrl } } = supabase.storage.from('contracts').getPublicUrl(fileName);
            await supabase.from('contracts').update({ pdf_url: publicUrl }).eq('id', contract.id);
        }

        // 5. Return PDF to client
        const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

        return NextResponse.json({
            success: true,
            contractId: contract.id,
            pdfBase64: pdfBase64
        })

    } catch (pdfError) {
        console.error("Process Error:", pdfError)
        return NextResponse.json({ error: "İşlem sırasında bir hata oluştu: " + pdfError.message }, { status: 500 })
    }
}
