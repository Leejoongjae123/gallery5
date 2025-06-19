export function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload  = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

export function toWebpBlob(img, width, height, quality = 0.8) {
  const canvas = document.createElement("canvas");
  canvas.width  = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise(res =>
    canvas.toBlob(b => res(b), "image/webp", quality)
  );
}

export function calcSize(origW, origH, maxW, maxH) {
  let w = origW, h = origH;
  if (w > maxW || h > maxH) {
    const r = Math.min(maxW / w, maxH / h);
    w = Math.round(w * r);
    h = Math.round(h * r);
  }
  return [w, h];
}

export default async function compressToWebp(
  file,
  { maxWidth = 1024, maxHeight = 1024, quality = 0.8 } = {}
) {
  const img = await loadImage(file);
  const [w, h] = calcSize(img.width, img.height, maxWidth, maxHeight);
  const blob = await toWebpBlob(img, w, h, quality);
  return new File([blob], file.name.replace(/\.\w+$/, ".webp"), {
    type: "image/webp",
  });
} 