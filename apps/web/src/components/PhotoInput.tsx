import { useEffect, useState } from 'react';
import { apiBaseUrl } from '../lib/api';

// Shared URL resolution is intentionally exported alongside the input component.
// eslint-disable-next-line react-refresh/only-export-components
export function mediaUrl(path?:string){return path?.startsWith('/')?`${apiBaseUrl}${path}`:path;}

export function PhotoInput({currentUrl,label='Profile photo'}:{currentUrl?:string;label?:string}){
  const[preview,setPreview]=useState<string|undefined>(mediaUrl(currentUrl));const[error,setError]=useState('');
  useEffect(()=>{setPreview(mediaUrl(currentUrl));setError('')},[currentUrl]);
  useEffect(()=>()=>{if(preview?.startsWith('blob:'))URL.revokeObjectURL(preview)},[preview]);
  return <div className="photo-input"><span>{label}</span>{preview?<img src={preview} alt="Selected profile preview" onError={()=>{setPreview(undefined);setError('The saved photo could not be loaded. You can upload a replacement.')}}/>:<span className="photo-placeholder">No photo</span>}<label className="text-button">{preview?'Replace photo':'Upload photo'}<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>{const file=event.target.files?.[0];setError('');if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setError('Choose a JPEG, PNG, or WebP image.');event.target.value='';return;}if(file.size>5*1024*1024){setError('Photo must be 5 MB or smaller.');event.target.value='';return;}setPreview(URL.createObjectURL(file));}}/></label>{preview&&<button type="button" className="text-button" onClick={event=>{const input=event.currentTarget.parentElement?.querySelector<HTMLInputElement>('input[type=file]');if(input)input.value='';setPreview(undefined);}}>Clear selection</button>}{error&&<small className="field-error">{error}</small>}</div>;
}
