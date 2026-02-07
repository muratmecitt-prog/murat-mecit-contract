import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/settings?error=no_code`);
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/google/callback`
    );

    try {
        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.refresh_token) {
            console.warn('No refresh token received. User might have already authorized but prompt=consent should handle this.');
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/settings?error=no_refresh_token`);
        }

        // Get user info to store the email
        oauth2Client.setCredentials(tokens);
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data: profile } = await oauth2.userinfo.get();

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { error: upsertError } = await supabase
                .from('settings')
                .upsert({
                    user_id: user.id,
                    google_refresh_token: tokens.refresh_token,
                    google_email: profile.email,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (upsertError) {
                console.error('CRITICAL: Database Error in Google Callback:', upsertError);
                return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/settings?error=db_failed`);
            }

            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/settings?success=google_connected`);
        }

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/settings?error=no_user`);
    } catch (error) {
        console.error('Google Auth Error:', error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/settings?error=auth_failed`);
    }
}
