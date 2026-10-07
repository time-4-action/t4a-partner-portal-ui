import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

const BACKEND = process.env.EXPORT_API_URL || 'http://localhost:4000';

async function getToken() {
    const { token } = await auth0.getAccessToken();
    return token;
}

// GET /nextapi/export/shopify/connection/:id/keys — the store's Sources API keys (no hashes).
export async function GET(request, { params }) {
    const { id } = await params;
    try {
        const token = await getToken();
        const response = await fetch(`${BACKEND}/shopify/connection/${id}/keys`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] GET /shopify/connection/:id/keys', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /nextapi/export/shopify/connection/:id/keys — mint a key. The raw key is in this one reply.
export async function POST(request, { params }) {
    const { id } = await params;
    try {
        const token = await getToken();
        const body = await request.json().catch(() => ({}));
        const response = await fetch(`${BACKEND}/shopify/connection/${id}/keys`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] POST /shopify/connection/:id/keys', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
