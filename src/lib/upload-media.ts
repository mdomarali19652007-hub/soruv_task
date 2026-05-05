/**
 * Image upload helper — Supabase Storage.
 *
 * Replaces the previous third-party ImgBB integration so all user
 * media is owned by us and lives next to the rest of the data in
 * Supabase. The default bucket name is `user-uploads` and can be
 * overridden via `VITE_SUPABASE_UPLOADS_BUCKET`.
 *
 * Returns the publicly accessible URL on success. Videos are
 * accepted as long as the bucket allows them; the previous artificial
 * "no videos" guard is retained because the surfaces that call this
 * helper today only present image inputs.
 */

import { supabase } from './supabase';

/** Default bucket name. Migration `20260605_user_uploads_bucket.sql`
 *  creates this bucket with public read access. */
const DEFAULT_BUCKET = 'user-uploads';

/**
 * Generates a reasonably-unique object key under `<prefix>/<rand>-<filename>`.
 * The prefix is the current YYYY-MM so listings stay tidy when the
 * bucket gets large.
 */
function makeObjectKey(file: File): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 10);
  // Strip path components and unsafe characters from the filename.
  const safeName = file.name
    .split(/[\\/]/)
    .pop()!
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .slice(0, 80) || 'upload';
  return `${yyyy}-${mm}/${Date.now()}-${rand}-${safeName}`;
}

export async function uploadMedia(file: File): Promise<string> {
  if (file.type.startsWith('video/')) {
    throw new Error(
      'Video upload is not supported by this surface. Please upload an image instead.',
    );
  }

  const bucket =
    import.meta.env.VITE_SUPABASE_UPLOADS_BUCKET || DEFAULT_BUCKET;
  const key = makeObjectKey(file);

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(key, file, {
      cacheControl: '3600',
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (uploadError) {
    // Surface the underlying message so admin uploaders see actionable
    // feedback (e.g. "row level security policy" -> bucket policy).
    throw new Error(`Supabase upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(key);
  if (!data?.publicUrl) {
    throw new Error('Upload succeeded but no public URL was returned.');
  }
  return data.publicUrl;
}
