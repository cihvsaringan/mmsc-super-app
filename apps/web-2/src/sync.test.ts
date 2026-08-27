import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { deleteCapture, pendingCaptures, readDevice, replaceCredentials, updateCapture } from './storage';
import { SyncEngine } from './sync';

vi.mock('./api',()=>({api:vi.fn(),ApiError:class ApiError extends Error{constructor(public status:number,public code:string,message:string){super(message)}}}));
vi.mock('./storage',()=>({readDevice:vi.fn(),pendingCaptures:vi.fn(),replaceCredentials:vi.fn(),deleteCapture:vi.fn(),updateCapture:vi.fn(),writeMeta:vi.fn()}));
const mockedApi=vi.mocked(api),mockedDevice=vi.mocked(readDevice),mockedPending=vi.mocked(pendingCaptures),mockedReplace=vi.mocked(replaceCredentials);
const mockedDelete=vi.mocked(deleteCapture),mockedUpdate=vi.mocked(updateCapture);

beforeEach(()=>{vi.clearAllMocks();mockedDevice.mockResolvedValue({deviceId:'device-id',terminalId:'terminal-id',deviceIdentifier:'browser-id',deviceCredential:'secret',provisionedAt:'2026-08-26T00:00:00.000Z'});mockedPending.mockResolvedValue([]);mockedApi.mockResolvedValue({items:[],synchronizedAt:'2026-08-26T00:00:00.000Z'})});

describe('SyncEngine credential refresh',()=>{
 it('refreshes the Student/Employee credential snapshot during manual synchronization even with no queued attendance',async()=>{await new SyncEngine().run(true);expect(mockedApi).toHaveBeenCalledWith('/attendance-terminals/runtime/credentials',expect.objectContaining({headers:{authorization:'Device secret'}}));expect(mockedReplace).toHaveBeenCalledWith([],'2026-08-26T00:00:00.000Z')});
 it('bounds automatic credential refreshes while allowing attendance checks to continue',async()=>{const engine=new SyncEngine();await engine.run();await engine.run();expect(mockedApi).toHaveBeenCalledTimes(1);expect(mockedPending).toHaveBeenCalledTimes(2)});
});

describe('SyncEngine attendance receipts',()=>{
 const capture={captureId:'capture-id',terminalId:'terminal-id',credentialValue:'secret-value',captureMethod:'rfid' as const,capturedAt:'2026-08-26T07:30:00.000Z',localSequence:1,syncState:'failed_retryable' as const,syncAttemptCount:1,lastSyncAttemptAt:null,lastSyncError:'CONFLICT',createdAt:'2026-08-26T07:30:00.000Z'};
 it('removes an already-processed retry from the queue',async()=>{mockedPending.mockResolvedValueOnce([capture]).mockResolvedValueOnce([]);mockedApi.mockResolvedValueOnce({items:[],synchronizedAt:'2026-08-26T00:00:00.000Z'}).mockResolvedValueOnce({results:[{captureId:capture.captureId,outcome:'accepted',syncStatus:'already_processed',message:'Time in recorded'}]});const report=await new SyncEngine().run();expect(mockedDelete).toHaveBeenCalledWith(capture.captureId);expect(report.pending).toBe(0)});
 it('finalizes a duplicate scan instead of retrying it',async()=>{mockedPending.mockResolvedValueOnce([capture]).mockResolvedValueOnce([]);mockedApi.mockResolvedValueOnce({items:[],synchronizedAt:'2026-08-26T00:00:00.000Z'}).mockResolvedValueOnce({results:[{captureId:capture.captureId,outcome:'rejected',syncStatus:'duplicate_scan',attendanceStatus:'duplicate',message:'Already recorded'}]});const report=await new SyncEngine().run();expect(mockedUpdate).toHaveBeenCalledWith(expect.objectContaining({captureId:capture.captureId,syncState:'failed_permanent'}));expect(report.pending).toBe(0)});
});
