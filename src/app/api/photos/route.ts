import { PHOTO_DEST, photoPublicPath } from '@/utils';
import { readdir } from 'fs/promises';
import { NextResponse } from 'next/server';

export async function GET() {
  const photos = (await readdir(PHOTO_DEST)).reduce<string[]>((acc, file) => {
    if (file.toLowerCase().endsWith('.jpg')) {
      acc.push(photoPublicPath(file));
    }

    return acc;
  }, []);

  return NextResponse.json({
    photos,
  });
}
