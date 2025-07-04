import { NextResponse } from 'next/server';
import {
  GOPRO_BASE_URL,
  PHOTO_DEST,
  handleError,
  photoPublicPath,
} from '@/utils';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { resolve } from 'path';

const controlStatusMap: Record<number, string> = {
  0: 'Camera Idle',
  1: 'Camera Control',
  2: 'Camera External',
};

export async function POST() {
  console.log('Getting camera state');
  const stateResponse = await fetch(`${GOPRO_BASE_URL}/gopro/camera/state`);
  handleError(stateResponse, 'Could not get camera state');

  const stateData = await stateResponse.json();

  const usbControl = !!stateData.status['116'];
  console.log(`USB Control: ${usbControl}`);
  if (!usbControl) {
    console.log('Enabling USB control');
    handleError(
      await fetch(`${GOPRO_BASE_URL}/gopro/camera/control/wired_usb?p=1`),
      'Could not get USB control',
    );
  }

  const presetGroup = stateData.status['96'];
  console.log(`Preset group: ${presetGroup}`);
  if (presetGroup !== 1001) {
    console.log('Loading photo preset group');
    handleError(
      await fetch(`${GOPRO_BASE_URL}/gopro/camera/presets/set_group?id=1001`),
      'Could not load photo preset group',
    );
  }

  const controlStatus: number = stateData.status['114'];
  console.log(`Control status: ${controlStatusMap[controlStatus]}`);

  if (controlStatus !== 0) {
    console.log('Getting control');
    handleError(
      await fetch(
        `${GOPRO_BASE_URL}/gopro/camera/control/set_ui_controller?p=2`,
      ),
      'Could not get control',
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('Shutter start');
  handleError(
    await fetch(`${GOPRO_BASE_URL}/gopro/camera/shutter/start`),
    'Could not start shutter',
  );

  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log('Getting media list');
  const mediaListResponse = await fetch(`${GOPRO_BASE_URL}/gopro/media/list`);
  handleError(mediaListResponse, 'Could not get media list');

  const mediaListData = await mediaListResponse.json();
  if (!mediaListData.media.length || !mediaListData.media[0].fs.length) {
    throw new Error('Media list is empty');
  }

  const latestPhoto =
    mediaListData.media[0].fs[mediaListData.media[0].fs.length - 1].n;
  const latestPhotoUrl = `${GOPRO_BASE_URL}/videos/DCIM/100GOPRO/${latestPhoto}`;

  console.log(`Latest photo: ${latestPhotoUrl}`);

  const photoResponse = await fetch(latestPhotoUrl);
  handleError(photoResponse, 'Could not fetch latest photo');

  if (!photoResponse.body) {
    throw new Error('Latest photo has no body');
  }

  const dest = resolve(PHOTO_DEST, latestPhoto);
  console.log(`Downloading photo to ${dest}`);
  await pipeline(
    photoResponse.body as unknown as NodeJS.ReadableStream,
    createWriteStream(dest),
  );

  return NextResponse.json(
    {
      url: photoPublicPath(latestPhoto),
    },
    {
      status: 201,
    },
  );
}
