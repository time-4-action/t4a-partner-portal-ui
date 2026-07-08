import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

const BACKEND = process.env.EXPORT_API_URL || 'http://localhost:4000';

async function getToken() {
    const { token } = await auth0.getAccessToken();
    return token;
}

// GET /nextapi/export/shopify/connect?shop=acme — returns { url } (the Shopify authorize URL).
export async function GET(request) {
    try {
        const token = await getToken();
        const { searchParams } = new URL(request.url);
        const queryStr = searchParams.toString();
        const url = `${BACKEND}/shopify/connect${queryStr ? '?' + queryStr : ''}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] GET /shopify/connect', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
