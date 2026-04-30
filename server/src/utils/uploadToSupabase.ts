// SUPABASE_DISABLED: All Supabase storage code below is commented out.
// Replaced with Cloudflare R2 (S3-compatible). Export names are unchanged
// so no other files need to be modified.

// import { supabase } from "../configs/supabase";
// import fs from "fs";
// import path from "path";
//
// const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "journalhub";
//
// export type UploadFolder =
//   | "manuscripts"
//   | "profiles"
//   | "certificates"
//   | "receipts"
//   | "journal-logos"
//   | "publications"
//   | "other";
//
// const MIME_TYPES: Record<string, string> = {
//   ".pdf": "application/pdf",
//   ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//   ".tex": "application/x-tex",
//   ".latex": "application/x-latex",
//   ".html": "text/html",
//   ".xml": "application/xml",
//   ".png": "image/png",
//   ".jpg": "image/jpeg",
//   ".jpeg": "image/jpeg",
//   ".webp": "image/webp",
//   ".gif": "image/gif",
// };
//
// export async function uploadToSupabase(
//   localFilePath: string,
//   folder: UploadFolder,
//   fileName: string,
// ): Promise<{ url: string; path: string }> {
//   const fileBuffer = fs.readFileSync(localFilePath);
//   const ext = path.extname(fileName).toLowerCase();
//   const contentType = MIME_TYPES[ext] || "application/octet-stream";
//   const storagePath = `${folder}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
//
//   const { error } = await supabase.storage
//     .from(BUCKET)
//     .upload(storagePath, fileBuffer, { contentType, upsert: false });
//
//   if (error) {
//     throw new Error(`Supabase upload failed: ${error.message}`);
//   }
//
//   const { data: urlData } = supabase.storage
//     .from(BUCKET)
//     .getPublicUrl(storagePath);
//
//   try {
//     fs.unlinkSync(localFilePath);
//   } catch {
//     console.warn("Could not delete local temp file:", localFilePath);
//   }
//
//   return { url: urlData.publicUrl, path: storagePath };
// }
//
// export async function deleteFromSupabase(storagePath: string): Promise<void> {
//   if (!storagePath) return;
//
//   let resolvedPath = storagePath;
//   if (storagePath.startsWith("http")) {
//     const match = storagePath.match(
//       /\/storage\/v1\/object\/public\/[^/]+\/(.+)/,
//     );
//     if (!match) return;
//     resolvedPath = match[1];
//   }
//
//   const { error } = await supabase.storage.from(BUCKET).remove([resolvedPath]);
//   if (error) {
//     console.warn("Supabase delete warning:", error.message);
//   }
// }
//
// export function getSupabasePublicUrl(storagePath: string): string {
//   if (storagePath?.startsWith("http")) return storagePath;
//   const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
//   return data.publicUrl;
// }

// ─── CLOUDFLARE R2 ────────────────────────────────────────────────────────────

import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { r2 } from "../configs/r2";
import { env } from "../configs/envs";

const BUCKET = env.R2_BUCKET;

export type UploadFolder =
  | "manuscripts"
  | "profiles"
  | "certificates"
  | "receipts"
  | "journal-logos"
  | "publications"
  | "other";

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".tex": "application/x-tex",
  ".latex": "application/x-latex",
  ".html": "text/html",
  ".xml": "application/xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function uploadToSupabase(
  localFilePath: string,
  folder: UploadFolder,
  fileName: string,
): Promise<{ url: string; path: string }> {
  const fileBuffer = fs.readFileSync(localFilePath);
  const ext = path.extname(fileName).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const storagePath = `${folder}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: storagePath,
      Body: fileBuffer,
      ContentType: contentType,
    }),
  );

  try {
    fs.unlinkSync(localFilePath);
  } catch {
    console.warn("Could not delete local temp file:", localFilePath);
  }

  const publicUrl = `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${storagePath}`;
  return { url: publicUrl, path: storagePath };
}

export async function deleteFromSupabase(storagePath: string): Promise<void> {
  if (!storagePath) return;

  let resolvedPath = storagePath;
  if (storagePath.startsWith("http")) {
    const base = env.R2_PUBLIC_URL.replace(/\/$/, "");
    if (!storagePath.startsWith(base)) return;
    resolvedPath = storagePath.slice(base.length + 1);
  }

  try {
    await r2.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: resolvedPath,
      }),
    );
  } catch (err: any) {
    console.warn("R2 delete warning:", err.message);
  }
}

export function getSupabasePublicUrl(storagePath: string): string {
  if (storagePath?.startsWith("http")) return storagePath;
  return `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${storagePath}`;
}
