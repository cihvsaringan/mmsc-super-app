import { randomUUID } from 'node:crypto';
import sharp, { type OutputInfo } from 'sharp';
import { pool } from '../database/pool.js';
import { AppError } from '../lib/errors.js';
import { storage } from './storage.js';

const allowed = new Set(['image/jpeg','image/png','image/webp']);
export type MediaOwner = 'employees'|'students';

export async function resolveProfilePhoto(owner:MediaOwner,ownerId:string){
  const result=await pool.query(`SELECT profile_photo_asset_id FROM ${owner} WHERE id=$1 AND archived_at IS NULL`,[ownerId]);
  if(!result.rows[0])throw new AppError(404,'NOT_FOUND',owner==='employees'?'Employee not found':'Student not found');
  const assetId=result.rows[0].profile_photo_asset_id as string|null;
  return assetId?{assetId,profileUrl:`/media/${assetId}/profile`}:null;
}

export async function processProfilePhoto(file: Express.Multer.File, owner: MediaOwner, ownerId: string, actorId: string) {
  if (!allowed.has(file.mimetype)) throw new AppError(400,'INVALID_IMAGE_TYPE','Photo must be a JPEG, PNG, or WebP image');
  const token=randomUUID(); const base=`profiles/${owner}/${ownerId}/${token}`; const profileKey=`${base}-profile.webp`; const thumbnailKey=`${base}-thumbnail.webp`;
  let profile:Buffer; let thumbnail:Buffer; let metadata:OutputInfo;
  try {
    const image=sharp(file.buffer,{failOn:'error'}).rotate();
    ({data:profile,info:metadata}=await image.clone().resize(512,512,{fit:'inside',withoutEnlargement:true}).webp({quality:82}).toBuffer({resolveWithObject:true}));
    thumbnail=await image.resize(128,128,{fit:'cover'}).webp({quality:78}).toBuffer();
  } catch { throw new AppError(400,'INVALID_IMAGE','The selected file is not a valid supported image'); }
  await storage.upload(profileKey,profile);
  try { await storage.upload(thumbnailKey,thumbnail); } catch(error) { await storage.delete(profileKey); throw error; }
  const client=await pool.connect(); let old:{storage_key:string;thumbnail_key:string}|undefined;
  try {
    await client.query('BEGIN');
    const table=owner; const current=await client.query(`SELECT m.storage_key,m.thumbnail_key FROM ${table} d LEFT JOIN media_assets m ON m.id=d.profile_photo_asset_id WHERE d.id=$1 AND d.archived_at IS NULL FOR UPDATE`,[ownerId]);
    if(!current.rows[0]) throw new AppError(404,'NOT_FOUND',owner==='employees'?'Employee not found':'Student not found'); old=current.rows[0].storage_key?current.rows[0]:undefined;
    const asset=await client.query('INSERT INTO media_assets(storage_key,thumbnail_key,original_filename,mime_type,size_bytes,width,height,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',[profileKey,thumbnailKey,file.originalname.slice(0,255),'image/webp',profile.length,metadata.width,metadata.height,actorId]);
    await client.query(`UPDATE ${table} SET profile_photo_asset_id=$1,profile_photo_url=NULL,updated_at=now(),version=version+1 WHERE id=$2`,[asset.rows[0].id,ownerId]);
    await client.query('COMMIT');
    if(old){await storage.delete(old.storage_key);await storage.delete(old.thumbnail_key);}
    return {id:asset.rows[0].id,profileUrl:`/media/${asset.rows[0].id}/profile`,thumbnailUrl:`/media/${asset.rows[0].id}/thumbnail`};
  } catch(error) { await client.query('ROLLBACK'); await storage.delete(profileKey); await storage.delete(thumbnailKey); throw error; } finally { client.release(); }
}

export async function removeProfilePhoto(owner:MediaOwner,ownerId:string){const client=await pool.connect();let old:{storage_key:string;thumbnail_key:string}|undefined;try{await client.query('BEGIN');const result=await client.query(`SELECT m.storage_key,m.thumbnail_key FROM ${owner} d LEFT JOIN media_assets m ON m.id=d.profile_photo_asset_id WHERE d.id=$1 AND d.archived_at IS NULL FOR UPDATE`,[ownerId]);if(!result.rows[0])throw new AppError(404,'NOT_FOUND','Profile not found');old=result.rows[0].storage_key?result.rows[0]:undefined;await client.query(`UPDATE ${owner} SET profile_photo_asset_id=NULL,profile_photo_url=NULL,updated_at=now(),version=version+1 WHERE id=$1`,[ownerId]);await client.query('COMMIT');if(old){await storage.delete(old.storage_key);await storage.delete(old.thumbnail_key);}}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}}
