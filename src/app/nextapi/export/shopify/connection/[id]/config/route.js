import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

const BACKEND = process.env.EXPORT_API_URL || 'http://localhost:4000';

async function getToken() {
    const { token } = await auth0.getAccessToken();
    return token;
}

// PUT /nextapi/export/shopify/connection/:id/config — update sync config / location.
export async function PUT(request, { params }) {
    const { id } = await params;
    try {
        const token = await getToken();
        const body = await request.json();

        const response = await fetch(`${BACKEND}/shopify/connection/${id}/config`, {
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
        console.error('[proxy] PUT /shopify/connection/:id/config', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
