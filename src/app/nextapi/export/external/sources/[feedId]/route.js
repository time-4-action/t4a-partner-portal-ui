import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

const BACKEND = process.env.EXPORT_API_URL || 'http://localhost:4000';

async function getToken() {
    const { token } = await auth0.getAccessToken();
    return token;
}

// GET /nextapi/export/external/sources/:feedId — one feed + health.
export async function GET(_request, { params }) {
    const { feedId } = await params;
    try {
        const token = await getToken();
        const response = await fetch(`${BACKEND}/external/sources/${feedId}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] GET /external/sources/:feedId', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /nextapi/export/external/sources/:feedId — update feed config.
export async function PUT(request, { params }) {
    const { feedId } = await params;
    try {
        const token = await getToken();
        const body = await request.json();
        const response = await fetch(`${BACKEND}/external/sources/${feedId}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] PUT /external/sources/:feedId', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /nextapi/export/external/sources/:feedId — remove feed + its products.
export async function DELETE(_request, { params }) {
    const { feedId } = await params;
    try {
        const token = await getToken();
        const response = await fetch(`${BACKEND}/external/sources/${feedId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] DELETE /external/sources/:feedId', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
