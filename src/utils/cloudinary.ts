export const CLOUDINARY_BASE_URL =
  `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/`;

export const getImageUrl = (path: string) => {
  return `${CLOUDINARY_BASE_URL}${path}`;
};