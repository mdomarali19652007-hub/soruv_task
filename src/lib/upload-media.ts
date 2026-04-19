/**
 * Image upload helper (ImgBB).
 *
 * Extracted from src/App.tsx. Returns the hosted URL on success.
 * Videos are rejected because the current hosting service only
 * accepts images.
 */

export async function uploadMedia(file: File): Promise<string> {
  if (file.type.startsWith('video/')) {
    throw new Error('Video upload is not supported by the current image hosting service. Please upload an image instead.');
  }
  const formData = new FormData();
  formData.append('image', file);
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
  if (!apiKey) throw new Error('ImgBB API Key is missing. Please add it in settings.');

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData,
  });
  const data = await response.json();
  if (data.success) {
    return data.data.url as string;
  }
  throw new Error(data.error?.message || 'Upload failed');
}
