export const { GOPRO_BASE_URL } = process.env;
export const PHOTO_DEST = './public/photos/';
export const photoPublicPath = (name: string) => `/photos/${name}`;

export const handleError = (response: Response, message: string) => {
  if (response.status !== 200) {
    throw new Error(`${message}: ${response.statusText} (${response.status})`);
  }
};

export const preloadImage = (src: string) =>
  new Promise((resolve, reject) => {
    let img = new Image();
    img.onload = () => resolve(img.height);
    img.onerror = reject;
    img.src = src;
  });
