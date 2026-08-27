import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { pool } from '../database/pool.js';
import { AppError } from '../lib/errors.js';
import { requirePermission } from '../security/middleware.js';
import { processProfilePhoto, removeProfilePhoto, resolveProfilePhoto, type MediaOwner } from '../media/service.js';
import { storage } from '../media/storage.js';

export const mediaRouter=Router();
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1}});
const id=z.string().uuid(); const variant=z.enum(['profile','thumbnail']);
const definitions={employees:{writePermission:'employee.edit',readPermission:'employee.view'},students:{writePermission:'student.profile.manage',readPermission:'student.profile.view'}} as const;
for(const [owner,definition] of Object.entries(definitions) as [MediaOwner,{writePermission:string;readPermission:string}][]){
  mediaRouter.get(`/media/${owner}/:id/profile-photo`,requirePermission(definition.readPermission),async(req,res,next)=>{try{const photo=await resolveProfilePhoto(owner,id.parse(req.params.id));res.set('Cache-Control','private, no-store');if(!photo){res.status(204).end();return;}res.redirect(302,`/api/v1${photo.profileUrl}`);}catch(error){next(error);}});
  mediaRouter.post(`/media/${owner}/:id/profile-photo`,requirePermission(definition.writePermission),upload.single('photo'),async(req,res,next)=>{try{if(!req.file)throw new AppError(400,'PHOTO_REQUIRED','Select a photo to upload');res.status(201).json({item:await processProfilePhoto(req.file,owner,id.parse(req.params.id),req.auth.userId!)});}catch(error){next(error);}});
  mediaRouter.delete(`/media/${owner}/:id/profile-photo`,requirePermission(definition.writePermission),async(req,res,next)=>{try{await removeProfilePhoto(owner,id.parse(req.params.id));res.status(204).end();}catch(error){next(error);}});
}
mediaRouter.get('/media/:id/:variant',async(req,res,next)=>{try{const assetId=id.parse(req.params.id);const kind=variant.parse(req.params.variant);const result=await pool.query('SELECT storage_key,thumbnail_key FROM media_assets WHERE id=$1',[assetId]);if(!result.rows[0])throw new AppError(404,'NOT_FOUND','Media not found');const data=await storage.read(kind==='thumbnail'?result.rows[0].thumbnail_key:result.rows[0].storage_key);res.set({'Content-Type':'image/webp','Cache-Control':'private, max-age=31536000, immutable'}).send(data);}catch(error){next(error);}});
