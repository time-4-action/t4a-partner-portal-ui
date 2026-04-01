import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

const BACKEND = process.env.EXPORT_API_URL || 'http://localhost:4000';

async function getToken() {
    const { token } = await auth0.getAccessToken();
    return token;
}

export async function DELETE(request, { params }) {
    try {
        const token = await getToken();
        const { exportId } = await params;
        const response = await fetch(`${BACKEND}/categories/by-export/${exportId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] DELETE /categories/by-export/[exportId]', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
