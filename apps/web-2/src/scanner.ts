export const normalizeCredentialValue=(value:string)=>value.trim();
export const credentialRejectionMessage=(status:string)=>status==='lost'?'Credential has been reported lost.':status==='inactive'?'Credential is inactive.':status==='revoked'?'Credential has been revoked.':status==='replaced'?'Credential has been replaced.':'Credential not valid.';
export type CredentialValidation={valid:true}|{valid:false;reason:'CREDENTIAL_STATUS_INVALID'|'CREDENTIAL_EXPIRED'|'OWNER_NOT_ELIGIBLE';message:string};
export const validateCachedCredential=(credential:{credentialStatus:string;eligible:boolean;expiresAt:string|null},now=Date.now()):CredentialValidation=>{
 if(credential.credentialStatus!=='active')return{valid:false,reason:'CREDENTIAL_STATUS_INVALID',message:credentialRejectionMessage(credential.credentialStatus)};
 if(credential.expiresAt&&new Date(credential.expiresAt).getTime()<=now)return{valid:false,reason:'CREDENTIAL_EXPIRED',message:'Credential has expired.'};
 if(!credential.eligible)return{valid:false,reason:'OWNER_NOT_ELIGIBLE',message:'Credential owner is not active.'};
 return{valid:true};
};
export class HidScanner{private value='';private last=0;constructor(private submit:(value:string)=>void,private gap=50){}key(key:string,time:number){if(time-this.last>this.gap)this.value='';this.last=time;if(key==='Enter'){const value=normalizeCredentialValue(this.value);this.value='';if(value)this.submit(value);return}if(key.length===1)this.value+=key}}
