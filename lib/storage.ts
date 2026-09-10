import { supabase } from "./supabase";

/**
 * Both buckets are private; files live under "<uid>/<filename>" and RLS
 * (supabase/migrations/0007_storage_policies.sql) restricts writes to the
 * owning user. `avatars` is readable by any authenticated user (so tutors'
 * photos can show up to parents later); `credentials` is fully private.
 *
 * We store the storage *path* (not a URL) in profiles.avatar_url /
 * tutor_profiles.credential_paths, and resolve a short-lived signed URL for
 * display, since public URLs don't work against a private bucket.
 */

function extFromUri(uri: string, fallback = "jpg") {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
  return (match?.[1] || fallback).toLowerCase();
}

function mimeFromExt(ext: string) {
  switch (ext) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
      return "image/heic";
    case "pdf":
      return "application/pdf";
    default:
      return "image/jpeg";
  }
}

/** Uploads a locally-picked image as the user's avatar. Returns the storage path. */
export async function uploadAvatar(userId: string, localUri: string): Promise<string> {
  const ext = extFromUri(localUri);
  const path = `${userId}/avatar.${ext}`;
  const arraybuffer = await fetch(localUri).then((res) => res.arrayBuffer());

  const { error } = await supabase.storage.from("avatars").upload(path, arraybuffer, {
    contentType: mimeFromExt(ext),
    upsert: true,
  });
  if (error) throw error;
  return path;
}

/** Uploads a picked document (credential) for a tutor. Returns the storage path. */
export async function uploadCredential(
  userId: string,
  localUri: string,
  fileName: string
): Promise<string> {
  const ext = extFromUri(fileName || localUri, "pdf");
  const safeName = fileName?.replace(/[^a-zA-Z0-9._-]/g, "_") || `document-${Date.now()}.${ext}`;
  const path = `${userId}/${Date.now()}-${safeName}`;
  const arraybuffer = await fetch(localUri).then((res) => res.arrayBuffer());

  const { error } = await supabase.storage.from("credentials").upload(path, arraybuffer, {
    contentType: mimeFromExt(ext),
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/** Resolves a storage path to a temporary signed URL for display. */
export async function getSignedUrl(
  bucket: "avatars" | "credentials",
  path: string | null | undefined,
  expiresInSeconds = 60 * 60
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);
  if (error) return null;
  return data?.signedUrl ?? null;
}
