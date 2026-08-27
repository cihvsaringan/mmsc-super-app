/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError, api } from '../lib/api';

export type CurrentUser = { id:string;email:string;username:string|null;loginIdentifier:string|null;displayName:string;accountType:'system'|'employee'|'student'|'guardian';mustChangePassword:boolean;roles:string[];permissions:string[] };
export type AuthBootstrapFailure='none'|'network'|'rejected';
type AuthState = { user: CurrentUser | null; loading: boolean; bootstrapFailure:AuthBootstrapFailure; login(identifier: string, password: string): Promise<void>; logout(): Promise<void>; changePassword(currentPassword:string,newPassword:string):Promise<void>; has(permission: string): boolean };
const Context = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapFailure,setBootstrapFailure]=useState<AuthBootstrapFailure>('none');
  useEffect(() => { void api<{ user: CurrentUser }>('/auth/me').then((data) => {setUser(data.user);setBootstrapFailure('none')}).catch((cause:unknown) => {setUser(null);setBootstrapFailure(cause instanceof ApiError?'rejected':'network')}).finally(() => setLoading(false)); }, []);
  useEffect(()=>{const revalidate=()=>{void api<{user:CurrentUser}>('/auth/me').then(data=>{setUser(data.user);setBootstrapFailure('none')}).catch((cause:unknown)=>{if(cause instanceof ApiError){setUser(null);setBootstrapFailure('rejected')}else setBootstrapFailure('network')})};addEventListener('online',revalidate);return()=>removeEventListener('online',revalidate)},[]);
  const value = useMemo<AuthState>(() => ({
    user, loading,bootstrapFailure,
    login: async (identifier, password) => { const data = await api<{ user: CurrentUser }>('/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) }); setUser(data.user);setBootstrapFailure('none'); },
    logout: async () => { await api('/auth/logout', { method: 'POST' }); setUser(null); window.history.replaceState(null, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); },
    changePassword:async(currentPassword,newPassword)=>{await api('/auth/change-password',{method:'POST',body:JSON.stringify({currentPassword,newPassword})});const data=await api<{user:CurrentUser}>('/auth/me');setUser(data.user);},
    has: (permission) => Boolean(user?.permissions.includes(permission)),
  }), [user, loading,bootstrapFailure]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
