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
        if (!exportId) {
            return NextResponse.json({ error: 'exportId is required' }, { status: 400 });
        }
        const response = await fetch(`${BACKEND}/product/with-ai-categories?exportId=${exportId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] GET /products/ai-categories', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const token = await getToken();
        const { searchParams } = new URL(request.url);
        const exportId = searchParams.get('exportId');
        if (!exportId) {
            return NextResponse.json({ error: 'exportId is required' }, { status: 400 });
        }
        const response = await fetch(`${BACKEND}/product/ai-categories/export/${exportId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] DELETE /products/ai-categories', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
