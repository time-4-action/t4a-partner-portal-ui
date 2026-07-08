import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

const BACKEND = process.env.EXPORT_API_URL || 'http://localhost:4000';

async function getToken() {
    const { token } = await auth0.getAccessToken();
    return token;
}

// GET /nextapi/export/external/sources — the user's Own Source feeds.
export async function GET() {
    try {
        const token = await getToken();
        const response = await fetch(`${BACKEND}/external/sources`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] GET /external/sources', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /nextapi/export/external/sources — register a feed.
export async function POST(request) {
    try {
        const token = await getToken();
        const body = await request.json();
        const response = await fetch(`${BACKEND}/external/sources`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] POST /external/sources', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
