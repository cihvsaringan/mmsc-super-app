import { describe, expect, it } from 'vitest';
import { assertRfidTestResetAllowed, rfidTestResetConfirmation } from './rfid-test-reset-guard.js';

const local={nodeEnv:'development',databaseUrl:'postgresql://mmsc:secret@localhost:15432/mmsc',confirmation:rfidTestResetConfirmation};
describe('RFID test reset guard',()=>{
 it('allows an explicitly confirmed local MMSC reset',()=>expect(()=>assertRfidTestResetAllowed(local)).not.toThrow());
 it('refuses production even with confirmation',()=>expect(()=>assertRfidTestResetAllowed({...local,nodeEnv:'production'})).toThrow(/disabled in production/));
 it('refuses remote and differently named databases',()=>{expect(()=>assertRfidTestResetAllowed({...local,databaseUrl:'postgresql://mmsc:secret@example.com/mmsc'})).toThrow(/restricted/);expect(()=>assertRfidTestResetAllowed({...local,databaseUrl:'postgresql://mmsc:secret@localhost/another'})).toThrow(/restricted/)});
 it('requires the dedicated confirmation',()=>expect(()=>assertRfidTestResetAllowed({...local,confirmation:undefined})).toThrow(/MMSC_RFID_TEST_RESET/));
});
