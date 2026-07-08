import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

const BACKEND = process.env.EXPORT_API_URL || 'http://localhost:4000';

async function getToken() {
    const { token } = await auth0.getAccessToken();
    return token;
}

// GET /nextapi/export/external/sources/:feedId/activity — import history + health.
export async function GET(_request, { params }) {
    const { feedId } = await params;
    try {
        const token = await getToken();
        const response = await fetch(`${BACKEND}/external/sources/${feedId}/activity`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] GET /external/sources/:feedId/activity', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
