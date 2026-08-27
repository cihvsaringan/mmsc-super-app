import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { env } from '../config/env.js';

export interface StorageProvider {
  upload(key: string, data: Buffer): Promise<void>;
  delete(key: string): Promise<void>;
  read(key: string): Promise<Buffer>;
}

export class LocalStorageProvider implements StorageProvider {
  private readonly root = resolve(env.MEDIA_STORAGE_PATH);
  private path(key: string) {
    const target = resolve(this.root, key);
    if (!target.startsWith(`${this.root}${sep}`)) throw new Error('Invalid media storage key');
    return target;
  }
  async upload(key: string, data: Buffer) { const target=this.path(key); await mkdir(resolve(target,'..'),{recursive:true}); await writeFile(target,data,{flag:'wx'}); }
  async delete(key: string) { await rm(this.path(key),{force:true}); }
  read(key: string) { return readFile(this.path(key)); }
}

export const storage: StorageProvider = new LocalStorageProvider();
