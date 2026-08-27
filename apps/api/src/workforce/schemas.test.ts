import { describe, expect, it } from 'vitest';
import { employeeSchema, identifierSchema } from './schemas.js';

const schoolId = '08f35c64-1fd8-4c59-abd9-03466935c97b';
describe('Phase 3 workforce schemas', () => {
  it('accepts a permanent employee core record', () => { expect(employeeSchema.safeParse({ schoolId, employeeNumber: 'MMSC-001', firstName: 'Ana', lastName: 'Santos', hireDate: '2026-08-18' }).success).toBe(true); });
  it('accepts the normalized web create payload with nullable optional fields', () => { expect(employeeSchema.safeParse({ schoolId, campusId:null,departmentId:null,positionId:null,employeeTypeId:null,userId:null,employeeNumber:'MMSC-002',firstName:'Juan',middleName:null,lastName:'Dela Cruz',suffix:null,preferredName:null,birthDate:null,gender:null,civilStatus:null,personalEmail:null,workEmail:null,mobilePhone:null,telephone:null,addressLine1:null,addressLine2:null,barangay:null,city:null,province:null,postalCode:null,countryCode:'PH',hireDate:'2026-08-18',employmentStatus:'active',remarks:null }).success).toBe(true); });
  it('rejects teacher and attendance fields from the later phases', () => { expect(employeeSchema.safeParse({ schoolId, employeeNumber: 'MMSC-001', firstName: 'Ana', lastName: 'Santos', hireDate: '2026-08-18', teachingLoad: 6 }).success).toBe(false); expect(employeeSchema.safeParse({ schoolId, employeeNumber: 'MMSC-001', firstName: 'Ana', lastName: 'Santos', hireDate: '2026-08-18', biometricId: '22' }).success).toBe(false); });
  it('allowlists supported administrative identifier types', () => { expect(identifierSchema.safeParse({ identifierType: 'sss', identifierValue: '12-3456789-0' }).success).toBe(true); expect(identifierSchema.safeParse({ identifierType: 'password', identifierValue: 'secret' }).success).toBe(false); });
});
