import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

const BACKEND = process.env.EXPORT_API_URL || 'http://localhost:4000';

// POST /nextapi/export/shopify/connect-custom — "Shopify Prerelease" (Route B): bind a store with a
// merchant-supplied custom-app Admin API token instead of OAuth. Body: { shop, accessToken }.
export async function POST(request) {
    try {
        const { token } = await auth0.getAccessToken();
        const body = await request.json().catch(() => ({}));
        const response = await fetch(`${BACKEND}/shopify/connect-custom`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] POST /shopify/connect-custom', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
