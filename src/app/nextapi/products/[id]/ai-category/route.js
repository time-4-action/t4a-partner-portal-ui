import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

const BACKEND = process.env.EXPORT_API_URL || 'http://localhost:4000';

async function getToken() {
    const { token } = await auth0.getAccessToken();
    return token;
}

export async function PUT(request, { params }) {
    try {
        const token = await getToken();
        const { id } = await params;
        const body = await request.json();
        const response = await fetch(`${BACKEND}/product/${id}/ai-category`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] PUT /products/[id]/ai-category', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const token = await getToken();
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const exportId = searchParams.get('exportId');
        if (!exportId) {
            return NextResponse.json({ error: 'exportId is required' }, { status: 400 });
        }
        const response = await fetch(`${BACKEND}/product/${id}/ai-category/${exportId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] DELETE /products/[id]/ai-category', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
