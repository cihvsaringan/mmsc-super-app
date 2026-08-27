import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

function Harness(){const{user,logout,bootstrapFailure}=useAuth();return <div><span>{user?.displayName}</span><span>{bootstrapFailure}</span><button onClick={()=>void logout()}>Sign out</button></div>}
describe('logout navigation',()=>{
  beforeEach(()=>{window.history.replaceState(null,'','/teacher');vi.stubGlobal('fetch',vi.fn().mockImplementation(async(input:unknown)=>({ok:true,status:200,json:async()=>String(input).endsWith('/auth/me')?{user:{id:'1',email:'teacher@mmsc.test',displayName:'Teacher',roles:['teacher'],permissions:[]}}:{} })))});
  it('clears the protected experience URL after server logout',async()=>{render(<AuthProvider><Harness/></AuthProvider>);expect(await screen.findByText('Teacher')).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Sign out'}));await waitFor(()=>expect(window.location.pathname).toBe('/'));expect(screen.queryByText('Teacher')).not.toBeInTheDocument()});
});
describe('offline authentication bootstrap',()=>{beforeEach(()=>{localStorage.clear();window.history.replaceState(null,'','/attendance-terminal');vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new TypeError('API unavailable')))});afterEach(()=>vi.unstubAllGlobals());it('does not manufacture a cached operator user when the API is unreachable',async()=>{render(<AuthProvider><Harness/></AuthProvider>);expect(await screen.findByText('network')).toBeInTheDocument();expect(screen.queryByText('Kiosk Operator')).not.toBeInTheDocument()})});
