import ImageKit from "imagekit";

export const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

console.log("ImageKit object:", imagekit);

export const getImageKitAuthParams = () => {
  return imagekit.getAuthenticationParameters();
};

export const deleteImageKitFile = async (fileId) => {
  const safeFileId = String(fileId || "").trim();
  if (!safeFileId) return;

  await imagekit.deleteFile(safeFileId);
};
