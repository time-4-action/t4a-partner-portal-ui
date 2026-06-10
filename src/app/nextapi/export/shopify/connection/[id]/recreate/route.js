import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

const BACKEND = process.env.EXPORT_API_URL || 'http://localhost:4000';

async function getToken() {
    const { token } = await auth0.getAccessToken();
    return token;
}

// POST /nextapi/export/shopify/connection/:id/recreate — flag deleted-in-store handoff products
// for recreation on the next sync. Body: { parentCodes: string[] }.
export async function POST(request, { params }) {
    const { id } = await params;
    try {
        const token = await getToken();
        const body = await request.text();
        const response = await fetch(`${BACKEND}/shopify/connection/${id}/recreate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] POST /shopify/connection/:id/recreate', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
