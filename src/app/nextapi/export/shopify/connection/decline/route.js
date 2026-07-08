import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

const BACKEND = process.env.EXPORT_API_URL || 'http://localhost:4000';

// POST /nextapi/export/shopify/connection/decline — clean break for a non-approved install:
// uninstall the app from Shopify + delete the pending record. Body: { shop, claimToken }.
export async function POST(request) {
    try {
        const { token } = await auth0.getAccessToken();
        const body = await request.json().catch(() => ({}));
        const response = await fetch(`${BACKEND}/shopify/connection/decline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] POST /shopify/connection/decline', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
