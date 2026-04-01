import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

const BACKEND = process.env.EXPORT_API_URL || 'http://localhost:4000';
const WEBHOOK_API_KEY = process.env.WEBHOOK_API_KEY || '';

export async function POST(request) {
    try {
        await auth0.getAccessToken();
        const body = await request.json().catch(() => ({}));
        const response = await fetch(`${BACKEND}/webhooks/sync/ai-categorization`, {
            method: 'POST',
            headers: {
                'x-api-key': WEBHOOK_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[proxy] POST /ai-categorization', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
