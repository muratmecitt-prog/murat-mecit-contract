import { google } from 'googleapis';

export async function createCalendarEvent(contractData, refreshToken) {
    if (!refreshToken) {
        console.warn("Google Refresh Token missing. Skipping calendar event creation.");
        return null;
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/google/callback`
    );

    oauth2Client.setCredentials({
        refresh_token: refreshToken
    });

    try {
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const eventSummary = `${contractData.location || 'Bilinmiyor'} - ${contractData.package_name || 'Standart Paket'}`;
        const eventDescription = `
Müşteri: ${contractData.customer_name}
Telefon: ${contractData.customer_phone || '-'}
Konum: ${contractData.location || '-'}
Paket: ${contractData.package_name || '-'}

Paket İçeriği:
${contractData.package_content || '-'}
        `.trim();

        const startDate = new Date(contractData.shooting_date);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 1);

        const formatDate = (date) => date.toISOString().split('T')[0];

        const event = {
            summary: eventSummary,
            location: contractData.location,
            description: eventDescription,
            start: {
                date: formatDate(startDate),
            },
            end: {
                date: formatDate(endDate),
            },
            colorId: contractData.color || undefined, // Use selected color or calendar default
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 },
                    { method: 'popup', minutes: 60 },
                ],
            },
        };

        const res = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
        });

        console.log('Google Calendar Event created: %s', res.data.htmlLink);
        return res.data.id;

    } catch (error) {
        console.error('Error creating Google Calendar event:', error);
        return null;
    }
}

export async function getCalendarEvents(refreshToken, timeMin, timeMax) {
    if (!refreshToken) return [];

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/google/callback`
    );

    oauth2Client.setCredentials({ refresh_token: refreshToken });

    try {
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const res = await calendar.events.list({
            calendarId: 'primary',
            timeMin: timeMin || new Date().toISOString(),
            timeMax: timeMax,
            singleEvents: true,
            orderBy: 'startTime',
        });

        return res.data.items.map(event => ({
            id: event.id,
            summary: event.summary,
            description: event.description,
            start: event.start.dateTime || event.start.date,
            end: event.end.dateTime || event.end.date,
            htmlLink: event.htmlLink,
            location: event.location,
            isGoogleEvent: true // To distinguish from local contracts
        }));
    } catch (error) {
        console.error('Error fetching Google Calendar events:', error);
        return [];
    }
}
