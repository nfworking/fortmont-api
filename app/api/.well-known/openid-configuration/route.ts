import { NextResponse } from 'next/server';
import { getOpenIdConfiguration } from '@/lib/oauth';

export async function GET(request: Request) {
  return NextResponse.json(getOpenIdConfiguration(request), {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
