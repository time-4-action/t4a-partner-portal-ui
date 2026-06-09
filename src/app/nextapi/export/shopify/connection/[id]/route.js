import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

const BACKEND = process.env.EXPORT_API_URL || 'http://localhost:4000';

async function getToken() {
    const { token } = await auth0.getAccessToken();
    return token;
}

// DELETE /nextapi/export/shopify/connection/:id — disconnect (delete the stored token).
export async function DELETE(request, { params }) {
    const { id } = await params;
    try {
        const token = await getToken();
        const response = await fetch(`${BACKEND}/shopify/connection/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] DELETE /shopify/connection/:id', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
