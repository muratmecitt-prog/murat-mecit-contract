import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'MISSING'
    const maskedKey = key.length > 10 ? `${key.substring(0, 8)}...` : key

    return NextResponse.json({
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        keyPrefix: maskedKey,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING'
    })
}
