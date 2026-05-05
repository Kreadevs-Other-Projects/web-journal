import { supabase } from "../configs/supabase";
import { env } from "../configs/envs";
import path from "path";
import https from "https";
import http from "http";

const BUCKET = env.SUPABASE_STORAGE_BUCKET || "paperuno";

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

// Upload a Buffer directly — never writes to disk
export async function uploadBufferToSupabase(
  buffer: Buffer,
  folder: UploadFolder,
  originalName: string,
): Promise<{ url: string; path: string }> {
  const ext = path.extname(originalName).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: false });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return { url: data.publicUrl, path: storagePath };
}

// Primary upload function — same signature callers use; accepts Buffer (memoryStorage)
export async function uploadToSupabase(
  buffer: Buffer,
  folder: UploadFolder,
  fileName: string,
): Promise<{ url: string; path: string }> {
  return uploadBufferToSupabase(buffer, folder, fileName);
}

// Delete a file from Supabase by its public URL or storage path
export async function deleteFromSupabase(urlOrPath: string): Promise<void> {
  if (!urlOrPath) return;
  try {
    let storagePath = urlOrPath;
    if (urlOrPath.startsWith("http")) {
      const match = urlOrPath.match(/\/object\/public\/[^/]+\/(.+)/);
      if (!match) return;
      storagePath = match[1];
    }
    await supabase.storage.from(BUCKET).remove([storagePath]);
  } catch (e) {
    console.warn("Supabase delete warning:", e);
  }
}

// Return the public URL for a storage path (or pass through if already a URL)
export function getSupabasePublicUrl(storagePath: string): string {
  if (storagePath?.startsWith("http")) return storagePath;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

// Download a remote URL to Buffer — used by HTML conversion (no temp files)
export async function downloadToBuffer(
  remoteUrl: string,
): Promise<{ buffer: Buffer; ext: string }> {
  const urlObj = new URL(remoteUrl);
  const ext = path.extname(urlObj.pathname).split("?")[0].toLowerCase() || ".bin";
  const protocol = remoteUrl.startsWith("https") ? https : http;

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    protocol
      .get(remoteUrl, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} downloading ${remoteUrl}`));
          return;
        }
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => resolve({ buffer: Buffer.concat(chunks), ext }));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}
