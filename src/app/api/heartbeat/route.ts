import { NextApiRequest, NextApiResponse } from 'next';
import { GOPRO_BASE_URL, handleError } from '@/utils';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const stateResponse = await fetch(
      `${GOPRO_BASE_URL}/gopro/camera/keep_alive`,
    );
    handleError(stateResponse, 'Could not send keep alive');
  } catch (e) {
    return new NextResponse(null, { status: 502 });
  }

  return new NextResponse(null, { status: 204 });
}
