import cloudinary from '#config/cloudinary.js';

export const publicIdFromUrl = (url) => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
  return match ? match[1] : null;
};

export const deleteImages = async (publicIds = []) => {
  await Promise.allSettled(publicIds.filter(Boolean).map((id) => cloudinary.uploader.destroy(id)));
};
