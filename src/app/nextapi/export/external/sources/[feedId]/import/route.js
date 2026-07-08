import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

const BACKEND = process.env.EXPORT_API_URL || 'http://localhost:4000';

async function getToken() {
    const { token } = await auth0.getAccessToken();
    return token;
}

// POST /nextapi/export/external/sources/:feedId/import — trigger an import now.
export async function POST(_request, { params }) {
    const { feedId } = await params;
    try {
        const token = await getToken();
        const response = await fetch(`${BACKEND}/external/sources/${feedId}/import`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: '{}'
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] POST /external/sources/:feedId/import', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
