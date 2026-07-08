import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

const BACKEND = process.env.EXPORT_API_URL || 'http://localhost:4000';

async function getToken() {
    const { token } = await auth0.getAccessToken();
    return token;
}

// GET /nextapi/exports/[id]/ai-status — latest AI-categorization run (polled for progress).
export async function GET(request, { params }) {
    try {
        const token = await getToken();
        const { id } = await params;
        const response = await fetch(`${BACKEND}/exports/${id}/ai-status`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] GET /exports/[id]/ai-status', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
