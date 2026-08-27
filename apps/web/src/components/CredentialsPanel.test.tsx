import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../lib/api';
import { CredentialsPanel } from './CredentialsPanel';

vi.mock('../lib/api',()=>({api:vi.fn(),apiErrorMessage:(_cause:unknown,fallback:string)=>fallback}));
const mockedApi=vi.mocked(api);
const credential={id:'08f35c64-1fd8-4c59-abd9-03466935c97b',credentialType:'rfid' as const,displaySuffix:'123456',status:'active',issuedAt:'2026-08-26T00:00:00.000Z',expiresAt:null,lastUsedAt:null,version:1};

afterEach(()=>{cleanup();vi.clearAllMocks()});

describe('CredentialsPanel lifecycle actions',()=>{
 it.each([['Mark Lost','lost'],['Deactivate','inactive'],['Revoke','revoked']] as const)('uses the authoritative POST transition for %s',async(action,status)=>{mockedApi.mockResolvedValueOnce({items:[credential]}).mockResolvedValueOnce({item:{...credential,status}}).mockResolvedValueOnce({items:[{...credential,status}]});render(<form onSubmit={event=>event.preventDefault()}><CredentialsPanel ownerType="student" ownerId="08f35c64-1fd8-4c59-abd9-03466935c97b"/></form>);const button=await screen.findByRole('button',{name:action});expect(button).toHaveAttribute('type','button');fireEvent.click(button);await waitFor(()=>expect(mockedApi).toHaveBeenCalledWith(`/credentials/${credential.id}/status`,expect.objectContaining({method:'POST'})));expect(mockedApi.mock.calls.some(([path,init])=>path===`/credentials/${credential.id}/status`&&(!init||init.method==='GET'))).toBe(false)});
 it('reports replacement success after the POST and refreshes the real list route',async()=>{mockedApi.mockResolvedValueOnce({items:[credential]}).mockResolvedValueOnce({item:{...credential,status:'replaced'},replacementId:'replacement-id'}).mockResolvedValueOnce({items:[{...credential,status:'replaced'}]});render(<CredentialsPanel ownerType="employee" ownerId="08f35c64-1fd8-4c59-abd9-03466935c97b"/>);fireEvent.click(await screen.findByRole('button',{name:/Replace/}));fireEvent.change(screen.getByPlaceholderText('Scan replacement credential'),{target:{value:'NEW-RFID'}});fireEvent.click(screen.getAllByRole('button',{name:'Replace'}).at(-1)!);expect(await screen.findByText('Credential replaced successfully.')).toBeInTheDocument();expect(mockedApi).toHaveBeenNthCalledWith(2,`/credentials/${credential.id}/status`,expect.objectContaining({method:'POST'}));expect(mockedApi).toHaveBeenNthCalledWith(3,expect.stringMatching(/^\/credentials\?ownerType=employee/))});
});
