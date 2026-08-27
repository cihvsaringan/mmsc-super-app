export const rfidTestResetConfirmation = 'RESET_LOCAL_TEST_RFID';

export function assertRfidTestResetAllowed(input:{nodeEnv:string;databaseUrl:string;confirmation:string|undefined}){
 const database=new URL(input.databaseUrl);
 if(input.nodeEnv==='production')throw new Error('RFID test reset is disabled in production');
 if(!['localhost','127.0.0.1','postgres'].includes(database.hostname)||database.pathname!=='/mmsc')throw new Error('RFID test reset is restricted to the local MMSC database');
 if(input.confirmation!==rfidTestResetConfirmation)throw new Error(`Set MMSC_RFID_TEST_RESET=${rfidTestResetConfirmation} to authorize this destructive local reset`);
}
