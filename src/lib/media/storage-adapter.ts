import fs from 'fs/promises';
import { createReadStream, existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface StorageWriteOptions {
  visibility?: 'PUBLIC' | 'PRIVATE' | 'RESTRICTED';
  mimeType?: string;
  subfolder?: string;
}

export interface StorageWriteResult {
  storageKey: string;
  storageType: 'LOCAL' | 'S3';
  publicUrl: string;
  absolutePath: string;
  fileSizeBytes: number;
}

export interface StorageAdapter {
  write(filename: string, buffer: Buffer, options?: StorageWriteOptions): Promise<StorageWriteResult>;
  overwrite(storageKey: string, buffer: Buffer, visibility?: string): Promise<void>;
  read(storageKey: string, visibility?: string): Promise<Buffer>;
  delete(storageKey: string, visibility?: string): Promise<boolean>;
  exists(storageKey: string, visibility?: string): Promise<boolean>;
  getPublicUrl(storageKey: string): string;
  getSignedUrl(storageKey: string, expiresInSeconds?: number): string;
  getStorageStats(): Promise<{ totalBytes: number; fileCount: number }>;
}

const PUBLIC_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'media');
const PRIVATE_STORAGE_DIR = path.join(process.cwd(), 'storage', 'private');
const HMAC_SECRET = process.env.NEXTAUTH_SECRET || 'shubban-media-secret-key-salt-987123';

class LocalStorageAdapter implements StorageAdapter {
  private sanitizeKey(key: string): string {
    // Prevent path traversal
    const safe = path.normalize(key).replace(/^(\.\.[\/\\])+/, '');
    return safe.replace(/^[\\\/]+/, '');
  }

  private getRootDirectory(visibility: string = 'PUBLIC'): string {
    return visibility === 'PRIVATE' || visibility === 'RESTRICTED'
      ? PRIVATE_STORAGE_DIR
      : PUBLIC_UPLOAD_DIR;
  }

  public getPublicUrl(storageKey: string): string {
    const cleanKey = this.sanitizeKey(storageKey).replace(/\\/g, '/');
    return `/uploads/media/${cleanKey}`;
  }

  public getSignedUrl(storageKey: string, expiresInSeconds: number = 3600): string {
    const cleanKey = this.sanitizeKey(storageKey);
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const signature = crypto
      .createHmac('sha256', HMAC_SECRET)
      .update(`${cleanKey}:${expiresAt}`)
      .digest('hex');

    return `/api/media/serve?key=${encodeURIComponent(cleanKey)}&expires=${expiresAt}&sig=${signature}`;
  }

  public verifySignedUrl(storageKey: string, expiresAt: number, signature: string): boolean {
    if (Math.floor(Date.now() / 1000) > expiresAt) {
      return false; // Expired
    }
    const cleanKey = this.sanitizeKey(storageKey);
    const expected = crypto
      .createHmac('sha256', HMAC_SECRET)
      .update(`${cleanKey}:${expiresAt}`)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
  }

  public async write(
    filename: string,
    buffer: Buffer,
    options: StorageWriteOptions = {}
  ): Promise<StorageWriteResult> {
    const visibility = options.visibility || 'PUBLIC';
    const rootDir = this.getRootDirectory(visibility);
    const subfolder = options.subfolder ? this.sanitizeKey(options.subfolder) : '';

    const targetDir = subfolder ? path.join(rootDir, subfolder) : rootDir;
    await fs.mkdir(targetDir, { recursive: true });

    // Generate non-colliding storage key: year/month/timestamp_filename
    const date = new Date();
    const yearMonth = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    const datedDir = path.join(targetDir, yearMonth);
    await fs.mkdir(datedDir, { recursive: true });

    const ext = path.extname(filename).toLowerCase();
    const base = path
      .basename(filename, ext)
      .replace(/[^a-zA-Z0-9_\-\u0980-\u09FF]/g, '_')
      .slice(0, 40);
    const uniqueId = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const safeFileName = `${base}_${uniqueId}${ext}`;

    const absolutePath = path.join(datedDir, safeFileName);
    await fs.writeFile(absolutePath, buffer);

    // Relative storage key
    const relativeKey = path
      .relative(rootDir, absolutePath)
      .replace(/\\/g, '/');

    const publicUrl =
      visibility === 'PUBLIC'
        ? this.getPublicUrl(relativeKey)
        : this.getSignedUrl(relativeKey, 7200);

    return {
      storageKey: relativeKey,
      storageType: 'LOCAL',
      publicUrl,
      absolutePath,
      fileSizeBytes: buffer.length,
    };
  }

  public async read(storageKey: string, visibility: string = 'PUBLIC'): Promise<Buffer> {
    const rootDir = this.getRootDirectory(visibility);
    const cleanKey = this.sanitizeKey(storageKey);
    const fullPath = path.join(rootDir, cleanKey);

    return await fs.readFile(fullPath);
  }

  public async overwrite(storageKey: string, buffer: Buffer, visibility: string = 'PUBLIC'): Promise<void> {
    const rootDir = this.getRootDirectory(visibility);
    const cleanKey = this.sanitizeKey(storageKey);
    const fullPath = path.join(rootDir, cleanKey);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);
  }

  public async delete(storageKey: string, visibility: string = 'PUBLIC'): Promise<boolean> {
    try {
      const rootDir = this.getRootDirectory(visibility);
      const cleanKey = this.sanitizeKey(storageKey);
      const fullPath = path.join(rootDir, cleanKey);

      if (existsSync(fullPath)) {
        await fs.unlink(fullPath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public async exists(storageKey: string, visibility: string = 'PUBLIC'): Promise<boolean> {
    const rootDir = this.getRootDirectory(visibility);
    const cleanKey = this.sanitizeKey(storageKey);
    const fullPath = path.join(rootDir, cleanKey);
    return existsSync(fullPath);
  }

  public async getStorageStats(): Promise<{ totalBytes: number; fileCount: number }> {
    let totalBytes = 0;
    let fileCount = 0;

    async function walk(dir: string) {
      if (!existsSync(dir)) return;
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const res = path.resolve(dir, entry.name);
          if (entry.isDirectory()) {
            await walk(res);
          } else {
            const stat = await fs.stat(res);
            totalBytes += stat.size;
            fileCount += 1;
          }
        }
      } catch {}
    }

    await walk(PUBLIC_UPLOAD_DIR);
    await walk(PRIVATE_STORAGE_DIR);

    return { totalBytes, fileCount };
  }
}

export const storageAdapter = new LocalStorageAdapter();

