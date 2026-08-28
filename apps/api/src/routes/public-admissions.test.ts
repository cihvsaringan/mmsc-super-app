import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { publicAdmissionsService } from '../admissions/public.js';
import { errorHandler } from '../lib/errors.js';
import { requestContext } from '../middleware/request-context.js';
import { publicAdmissionsRouter } from './public-admissions.js';

const app = () => { const value = express(); value.use(express.json()); value.use(requestContext); value.use('/api/v1', publicAdmissionsRouter); value.use(errorHandler); return value; };
afterEach(() => vi.restoreAllMocks());
describe('Phase 15 public registration', () => {
  it('returns a public-safe academic context', async () => {
    vi.spyOn(publicAdmissionsService, 'context').mockResolvedValue({ registrationEnabled:false,schools: [], schoolYears: [], gradeLevels: [], sections: [], externalSchools: [],schoolContact:null, privacyNotice: { version: 'test', summary: 'test' } });
    const response = await request(app()).get('/api/v1/public/admissions/context'); expect(response.status).toBe(200); expect(response.body).not.toHaveProperty('students');
  });
  it('rejects incomplete registration', async () => { const response = await request(app()).post('/api/v1/public/admissions/drafts').send({ firstName: 'Ana' }); expect(response.status).toBe(400); });
  it('requires both reference and secure token for status', async () => { const response = await request(app()).post('/api/v1/public/admissions/status').send({ applicationNumber: 'MMREG-2026-100000' }); expect(response.status).toBe(400); });
  it('returns only the public status DTO after valid verification', async () => {
    vi.spyOn(publicAdmissionsService, 'view').mockResolvedValue({ applicationNumber: 'MMREG-2026-100000', studentName: 'Test Student', applicationType:'new_student', status: 'submitted', schoolYearId: 'x', gradeLevelId: 'x', submittedAt: new Date(), informationRequest: null, applicantResponse: null, canEdit: false, returningStudentLinked:false });
    const response = await request(app()).post('/api/v1/public/admissions/status').send({ applicationNumber: 'MMREG-2026-100000', resumeToken: 'A'.repeat(43) }); expect(response.status).toBe(200); expect(response.body).not.toHaveProperty('registrarNotes');
  });
  it('reports registration closure without hiding public status access',async()=>{vi.spyOn(publicAdmissionsService,'context').mockResolvedValue({registrationEnabled:false,schools:[],schoolYears:[],gradeLevels:[],sections:[],externalSchools:[],schoolContact:{name:'MMSC',phone:'(046) 000 0000'},privacyNotice:{version:'test',summary:'test'}});const response=await request(app()).get('/api/v1/public/admissions/context');expect(response.status).toBe(200);expect(response.body.registrationEnabled).toBe(false);expect(response.body.schoolContact.phone).toBe('(046) 000 0000');});
});
