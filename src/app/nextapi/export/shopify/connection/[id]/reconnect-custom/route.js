import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

const BACKEND = process.env.EXPORT_API_URL || 'http://localhost:4000';

// GET /nextapi/export/shopify/connection/:id/reconnect-custom — re-run OAuth for a bring-your-own-app
// store using its stored credentials. Returns { url } (the store's authorize URL).
export async function GET(request, { params }) {
    try {
        const { token } = await auth0.getAccessToken();
        const { id } = await params;
        const response = await fetch(`${BACKEND}/shopify/connection/${id}/reconnect-custom`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] GET /shopify/connection/[id]/reconnect-custom', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
