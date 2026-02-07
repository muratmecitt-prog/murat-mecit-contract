import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCalendarEvents } from '@/lib/calendarService';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get('timeMin');
    const timeMax = searchParams.get('timeMax');

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch the refresh token from settings
        const { data: settings, error: settingsError } = await supabase
            .from('settings')
            .select('google_refresh_token')
            .eq('user_id', user.id)
            .single();

        if (settingsError || !settings?.google_refresh_token) {
            return NextResponse.json({ events: [], connected: false });
        }

        const events = await getCalendarEvents(
            settings.google_refresh_token,
            timeMin,
            timeMax
        );

        return NextResponse.json({ events, connected: true });
    } catch (error) {
        console.error('API Error fetching Google events:', error);
        return NextResponse.json({ error: 'Internal Server Error', events: [] }, { status: 500 });
    }
}
