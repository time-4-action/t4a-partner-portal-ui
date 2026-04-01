import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

const BACKEND = process.env.EXPORT_API_URL || 'http://localhost:4000';

async function getToken() {
    const { token } = await auth0.getAccessToken();
    return token;
}

export async function GET(request) {
    try {
        const token = await getToken();
        const { searchParams } = new URL(request.url);
        const exportId = searchParams.get('exportId');
        const url = exportId
            ? `${BACKEND}/categories/by-export/${exportId}`
            : `${BACKEND}/categories`;
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] GET /categories', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const token = await getToken();
        const body = await request.json();
        const response = await fetch(`${BACKEND}/categories`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] POST /categories', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
