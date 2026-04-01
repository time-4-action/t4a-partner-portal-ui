import { auth0 } from '@/lib/auth0';
import { NextResponse } from 'next/server';

const BACKEND = process.env.EXPORT_API_URL || 'http://localhost:4000';

async function getToken() {
    const { token } = await auth0.getAccessToken();
    return token;
}

export async function GET(request, { params }) {
    const { id } = await params;
    try {
        const token = await getToken();
        const { searchParams } = new URL(request.url);
        const queryStr = searchParams.toString();
        const url = `${BACKEND}/custom-export/${id}/xml${queryStr ? '?' + queryStr : ''}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({ error: 'Export failed' }));
            return NextResponse.json(data, { status: response.status });
        }

        const body = await response.arrayBuffer();
        return new Response(body, {
            status: response.status,
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'application/xml; charset=utf-8',
                'Content-Disposition': response.headers.get('Content-Disposition') || `attachment; filename="export.xml"`
            }
        });
    } catch (error) {
        console.error('[proxy] GET /custom-export/:id/xml', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
