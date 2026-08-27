import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PhotoInput, mediaUrl } from './PhotoInput';

afterEach(()=>cleanup());

describe('PhotoInput',()=>{
  it('resolves API media paths and falls back when a saved photo cannot load',()=>{render(<PhotoInput currentUrl="/media/students/c7681b64-082b-4c66-a7a7-b8df72aac35c/profile-photo"/>);const image=screen.getByAltText('Selected profile preview');expect(image.getAttribute('src')).toBe(mediaUrl('/media/students/c7681b64-082b-4c66-a7a7-b8df72aac35c/profile-photo'));fireEvent.error(image);expect(screen.getByText('No photo')).toBeInTheDocument();expect(screen.getByText(/saved photo could not be loaded/i)).toBeInTheDocument();});
  it('validates type before upload and releases object previews',()=>{const create=vi.fn(()=> 'blob:test-photo'),revoke=vi.fn();Object.defineProperties(URL,{createObjectURL:{configurable:true,value:create},revokeObjectURL:{configurable:true,value:revoke}});const {unmount}=render(<PhotoInput/>);const input=screen.getByLabelText('Upload photo');fireEvent.change(input,{target:{files:[new File(['bad'],'photo.gif',{type:'image/gif'})]}});expect(screen.getByText(/JPEG, PNG, or WebP/i)).toBeInTheDocument();fireEvent.change(input,{target:{files:[new File(['valid'],'photo.png',{type:'image/png'})]}});expect(create).toHaveBeenCalled();unmount();expect(revoke).toHaveBeenCalledWith('blob:test-photo');});
});
