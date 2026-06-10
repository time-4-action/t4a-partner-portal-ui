import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

const BACKEND = process.env.EXPORT_API_URL || 'http://localhost:4000';

async function getToken() {
    const { token } = await auth0.getAccessToken();
    return token;
}

// GET /nextapi/export/shopify/connection/:id/activity — recent runs + counts + unmatched.
export async function GET(request, { params }) {
    const { id } = await params;
    try {
        const token = await getToken();
        // Forward ?limit= so the run-history modal can ask for a longer window.
        const limit = new URL(request.url).searchParams.get('limit');
        const qs = limit ? `?limit=${encodeURIComponent(limit)}` : '';
        const response = await fetch(`${BACKEND}/shopify/connection/${id}/activity${qs}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] GET /shopify/connection/:id/activity', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
