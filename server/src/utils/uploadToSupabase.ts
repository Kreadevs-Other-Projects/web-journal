import { supabase } from "../configs/supabase";
import path from "path";
import https from "https";
import http from "http";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "giki";

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
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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

/**
 * Upload a Buffer directly to Supabase Storage.
 * Used with multer memoryStorage — req.file.buffer is passed here.
 */
export async function uploadToSupabase(
  buffer: Buffer,
  folder: UploadFolder,
  fileName: string,
): Promise<{ url: string; path: string }> {
  const ext = path.extname(fileName).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: false });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  return { url: urlData.publicUrl, path: storagePath };
}

/**
 * Download a remote URL into an in-memory Buffer.
 * Used by the HTML conversion service to process Supabase files without disk I/O.
 */
export async function downloadToBuffer(
  url: string,
): Promise<{ buffer: Buffer; ext: string }> {
  const ext =
    path.extname(new URL(url).pathname).split("?")[0].toLowerCase() || ".tmp";

  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const chunks: Buffer[] = [];

    protocol
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Download failed: HTTP ${response.statusCode}`));
          return;
        }
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () =>
          resolve({ buffer: Buffer.concat(chunks), ext }),
        );
        response.on("error", reject);
      })
      .on("error", reject);
  });
}

export async function deleteFromSupabase(storagePath: string): Promise<void> {
  if (!storagePath) return;

  let resolvedPath = storagePath;
  if (storagePath.startsWith("http")) {
    const match = storagePath.match(
      /\/storage\/v1\/object\/public\/[^/]+\/(.+)/,
    );
    if (!match) return;
    resolvedPath = match[1];
  }

  const { error } = await supabase.storage.from(BUCKET).remove([resolvedPath]);
  if (error) {
    console.warn("Supabase delete warning:", error.message);
  }
}

export function getSupabasePublicUrl(storagePath: string): string {
  if (storagePath?.startsWith("http")) return storagePath;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}
