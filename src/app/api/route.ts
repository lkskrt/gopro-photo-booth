import { NextResponse } from 'next/server';

const { GOPRO_BASE_URL } = process.env;

const controlStatusMap: Record<number, string> = {
  0: 'Camera Idle',
  1: 'Camera Control',
  2: 'Camera External',
};

const handleError = (response: Response, message: string) => {
  if (response.status !== 200) {
    throw new Error(`${message}: ${response.statusText} (${response.status})`);
  }
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

  return NextResponse.json({
    url: latestPhotoUrl,
  });
}
