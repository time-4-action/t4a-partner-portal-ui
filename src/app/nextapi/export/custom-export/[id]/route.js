import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

const BACKEND = process.env.EXPORT_API_URL || 'http://localhost:4000';

async function getToken() {
    const { token } = await auth0.getAccessToken();
    return token;
}

export async function GET(request, { params }) {
    const { id } = await params;
    try {
        const token = await getToken();
        const response = await fetch(`${BACKEND}/custom-export/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] GET /custom-export/:id', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const { id } = await params;
    try {
        const token = await getToken();
        const body = await request.json();

        const response = await fetch(`${BACKEND}/custom-export/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] PUT /custom-export/:id', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const { id } = await params;
    try {
        const token = await getToken();
        const { searchParams } = new URL(request.url);
        const queryStr = searchParams.toString();
        const url = `${BACKEND}/custom-export/${id}${queryStr ? '?' + queryStr : ''}`;

        const response = await fetch(url, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] DELETE /custom-export/:id', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
