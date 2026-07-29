/**
 * getCroppedImg
 * Takes original image, crop coordinates, and optional aspect ratio.
 * Returns a compressed Base64 JPEG string.
 */
export const getCroppedImg = async (imageSrc, pixelCrop, aspect = 1) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Output size — keep proportional to aspect, max 600px wide
  const outW = 600;
  const outH = Math.round(outW / aspect);

  canvas.width  = outW;
  canvas.height = outH;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outW,
    outH
  );

  // JPEG at 0.82 quality — good balance of size vs clarity
  return canvas.toDataURL('image/jpeg', 0.82);
};

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (err) => reject(err));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
