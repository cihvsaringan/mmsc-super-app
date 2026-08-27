import { beforeEach,describe,expect,it,vi } from 'vitest';

const mocks=vi.hoisted(()=>{const client={query:vi.fn(),release:vi.fn()};return{client,connect:vi.fn(async()=>client),query:vi.fn(),audit:vi.fn()};});
vi.mock('../database/pool.js',()=>({pool:{connect:mocks.connect,query:mocks.query}}));
vi.mock('../security/repository.js',()=>({securityRepository:{audit:mocks.audit}}));

import { CredentialRepository } from './repository.js';

const actor={actorId:'08f35c64-1fd8-4c59-abd9-03466935c97b',requestId:'request'};
const ownerId='a8f35c64-1fd8-4c59-abd9-03466935c97b';

describe('centralized credential repository',()=>{
 beforeEach(()=>vi.clearAllMocks());

 it('returns an empty credential list for an existing owner with no credentials',async()=>{mocks.query.mockResolvedValue({rows:[]});await expect(new CredentialRepository().list('student',ownerId)).resolves.toEqual([]);expect(mocks.query).toHaveBeenCalledWith(expect.stringContaining('c.last_used_at'),['student',ownerId]);});

 it('registers one Student credential and audits in the same transaction',async()=>{mocks.client.query.mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rowCount:1,rows:[{id:ownerId}]}).mockResolvedValueOnce({rows:[{id:'credential',owner_type:'student',credential_type:'rfid',display_suffix:'456789',status:'active',version:1}]}).mockResolvedValueOnce({rows:[]});const result=await new CredentialRepository().register({ownerType:'student',ownerId,credentialType:'rfid',credentialValue:' 000123456789 '},actor);expect(result.item).toMatchObject({id:'credential',ownerType:'student',displaySuffix:'456789'});expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({action:'credential.register',targetId:'credential'}),mocks.client);expect(mocks.client.query).toHaveBeenLastCalledWith('COMMIT');});

 it('rolls back and returns a conflict for a duplicate digest',async()=>{mocks.client.query.mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rowCount:1,rows:[{id:ownerId}]}).mockRejectedValueOnce(Object.assign(new Error('duplicate'),{code:'23505'})).mockResolvedValueOnce({rows:[]});await expect(new CredentialRepository().register({ownerType:'student',ownerId,credentialType:'rfid',credentialValue:'duplicate'},actor)).rejects.toMatchObject({status:409,code:'CREDENTIAL_ALREADY_ASSIGNED'});expect(mocks.client.query).toHaveBeenLastCalledWith('ROLLBACK');expect(mocks.audit).not.toHaveBeenCalled();});

 it('rejects an invalid Student before credential insertion',async()=>{mocks.client.query.mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rowCount:0,rows:[]}).mockResolvedValueOnce({rows:[]});await expect(new CredentialRepository().register({ownerType:'student',ownerId,credentialType:'qr',credentialValue:'missing'},actor)).rejects.toMatchObject({status:404,code:'CREDENTIAL_OWNER_NOT_FOUND'});expect(mocks.client.query).toHaveBeenLastCalledWith('ROLLBACK');});

 it('rejects an already-expired credential before opening a transaction',async()=>{await expect(new CredentialRepository().register({ownerType:'student',ownerId,credentialType:'rfid',credentialValue:'expired',expiresAt:'2020-01-01T00:00:00.000Z'},actor)).rejects.toMatchObject({status:400,code:'CREDENTIAL_EXPIRATION_INVALID'});expect(mocks.connect).not.toHaveBeenCalled()});

 it.each(['inactive','lost','revoked'] as const)('transitions an active credential to %s atomically',async(status)=>{mocks.client.query.mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rows:[{id:'credential',status:'active',version:1}]}).mockResolvedValueOnce({rowCount:1,rows:[{id:'credential'}]}).mockResolvedValueOnce({rows:[{id:'credential',owner_type:'student',credential_type:'rfid',display_suffix:'456789',status,version:2}]}).mockResolvedValueOnce({rows:[]});const result=await new CredentialRepository().transition('credential',status,1,undefined,actor);expect(result.item).toMatchObject({id:'credential',status});expect(mocks.client.query).toHaveBeenCalledWith(expect.stringContaining('$2::varchar'),['credential',status,actor.actorId]);expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({action:`credential.${status}`,metadata:{previousStatus:'active',newStatus:status}}),mocks.client);expect(mocks.client.query).toHaveBeenLastCalledWith('COMMIT')});

 it('returns a domain conflict for a forbidden terminal-state transition',async()=>{mocks.client.query.mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rows:[{id:'credential',status:'revoked',version:2}]}).mockResolvedValueOnce({rows:[]});await expect(new CredentialRepository().transition('credential','active',2,undefined,actor)).rejects.toMatchObject({status:409,code:'CREDENTIAL_TRANSITION_INVALID'});expect(mocks.client.query).toHaveBeenLastCalledWith('ROLLBACK');expect(mocks.audit).not.toHaveBeenCalled()});

 it('selects the display name from the authoritative owner branch for terminal cache rows',async()=>{mocks.query.mockResolvedValueOnce({rowCount:1,rows:[{}]}).mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rows:[]});await new CredentialRepository().terminalCache('terminal','device');expect(mocks.query.mock.calls[1]?.[0]).toContain("CASE WHEN c.subject_type='student' THEN concat_ws");expect(mocks.query.mock.calls[1]?.[0]).toContain("ELSE concat_ws(' ',e.first_name")});
});
