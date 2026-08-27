import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clinicRepository } from '../clinic/repository.js';
import { consultationRepository } from '../clinic/consultation-repository.js';
import { schedulingRepository } from '../clinic/scheduling-repository.js';
import { errorHandler } from '../lib/errors.js';
import { requestContext } from '../middleware/request-context.js';
import { clinicRouter } from './clinic.js';

function app(permissions:string[]){
  const instance=express();instance.use(express.json());instance.use(requestContext);
  instance.use((req,_res,next)=>{req.auth={userId:'11111111-1111-4111-8111-111111111111',authenticated:true,sessionId:'session',email:'nurse@mmsc.test',displayName:'Nurse',roles:['clinic_staff'],permissions};next();});
  instance.use('/api/v1',clinicRouter);instance.use(errorHandler);return instance;
}

describe('Clinic portal RBAC boundary',()=>{
  afterEach(()=>vi.restoreAllMocks());
  it('denies every Clinic API when clinic.portal.access is missing',async()=>{
    const response=await request(app(['clinic.dashboard.view'])).get('/api/v1/clinic/dashboard');
    expect(response.status).toBe(403);expect(response.body.error.code).toBe('PERMISSION_DENIED');
  });
  it('allows the dashboard with portal and dashboard permissions',async()=>{
    vi.spyOn(clinicRepository,'dashboard').mockResolvedValue({queue:[],counts:{}} as never);
    expect((await request(app(['clinic.portal.access','clinic.dashboard.view'])).get('/api/v1/clinic/dashboard')).status).toBe(200);
  });
  it('denies the dashboard when its granular permission is missing',async()=>{
    const response=await request(app(['clinic.portal.access'])).get('/api/v1/clinic/dashboard');
    expect(response.status).toBe(403);expect(response.body.error.code).toBe('PERMISSION_DENIED');
  });
  it('retains granular permission checks inside the portal',async()=>{
    const response=await request(app(['clinic.portal.access','clinic.inventory.view'])).post('/api/v1/clinic/items').send({});
    expect(response.status).toBe(403);expect(response.body.error.code).toBe('PERMISSION_DENIED');
  });
  it('separates health-record viewing from management',async()=>{
    vi.spyOn(clinicRepository,'healthRecord').mockResolvedValue({student:{id:'student'},alerts:[]} as never);
    const viewOnly=app(['clinic.portal.access','clinic.health_records.view']);
    expect((await request(viewOnly).get('/api/v1/clinic/students/11111111-1111-4111-8111-111111111111')).status).toBe(200);
    expect((await request(viewOnly).put('/api/v1/clinic/students/11111111-1111-4111-8111-111111111111/health-profile').send({bloodType:'O+'})).status).toBe(403);
  });
  it('protects every health-record endpoint behind portal access',async()=>{
    const response=await request(app(['clinic.health_records.manage'])).post('/api/v1/clinic/students/11111111-1111-4111-8111-111111111111/immunizations').send({});
    expect(response.status).toBe(403);
  });
  it('supports allergy, condition, immunization, and physical-exam writes for managers',async()=>{
    const manager=app(['clinic.portal.access','clinic.health_records.manage']);
    vi.spyOn(clinicRepository,'addAlert').mockResolvedValue({id:'alert'} as never);
    vi.spyOn(clinicRepository,'addImmunization').mockResolvedValue({id:'immunization'} as never);
    vi.spyOn(clinicRepository,'addPhysicalExam').mockResolvedValue({id:'exam',bmi:19.53} as never);
    const student='11111111-1111-4111-8111-111111111111';
    expect((await request(manager).post(`/api/v1/clinic/students/${student}/alerts`).send({alertType:'allergy',severity:'critical',title:'Peanuts'})).status).toBe(201);
    expect((await request(manager).post(`/api/v1/clinic/students/${student}/alerts`).send({alertType:'medical_condition',severity:'high',title:'Asthma'})).status).toBe(201);
    expect((await request(manager).post(`/api/v1/clinic/students/${student}/immunizations`).send({vaccineName:'Influenza',administeredOn:'2026-08-27'})).status).toBe(201);
    expect((await request(manager).post(`/api/v1/clinic/students/${student}/physical-exams`).send({examinedOn:'2026-08-27',heightCm:160,weightKg:50})).status).toBe(201);
  });
  it('opens an active consultation from the queue with encounter view access',async()=>{
    vi.spyOn(consultationRepository,'detail').mockResolvedValue({encounter:{id:'encounter'},alerts:[]} as never);
    const response=await request(app(['clinic.portal.access','clinic.encounter.view'])).get('/api/v1/clinic/encounters/11111111-1111-4111-8111-111111111111');
    expect(response.status).toBe(200);
  });
  it('loads the paginated daily log with empty optional filters',async()=>{vi.spyOn(consultationRepository,'dailyLog').mockResolvedValue({items:[],total:0,page:1,pageSize:25});const response=await request(app(['clinic.portal.access','clinic.encounter.view'])).get('/api/v1/clinic/encounters/log?date=2026-08-27&status=&disposition=&page=1');expect(response.status).toBe(200)});
  it('requires both encounter and inventory management to dispense',async()=>{
    const response=await request(app(['clinic.portal.access','clinic.inventory.manage'])).post('/api/v1/clinic/encounters/11111111-1111-4111-8111-111111111111/dispense').send({itemId:'22222222-2222-4222-8222-222222222222',quantity:1});
    expect(response.status).toBe(403);
  });
  it('completes a visit with disposition, Guardian contact, and follow-up in one operation',async()=>{
    vi.spyOn(consultationRepository,'complete').mockResolvedValue({ok:true});const manager=app(['clinic.portal.access','clinic.encounter.manage']);
    const response=await request(manager).post('/api/v1/clinic/encounters/11111111-1111-4111-8111-111111111111/complete').send({disposition:'follow_up_required',guardianContact:{guardianId:'22222222-2222-4222-8222-222222222222',method:'phone',reason:'Student needs pickup'},followUp:{dueDate:'2026-08-30',reason:'Reassessment'}});
    expect(response.status).toBe(200);expect(consultationRepository.complete).toHaveBeenCalled();
  });
  it('supports the emergency minimum-save flow without optional vitals',async()=>{
    vi.spyOn(clinicRepository,'createEncounter').mockResolvedValue({id:'encounter'} as never);const manager=app(['clinic.portal.access','clinic.encounter.manage']);
    const response=await request(manager).post('/api/v1/clinic/encounters').send({studentId:'11111111-1111-4111-8111-111111111111',source:'injury',chiefComplaint:'Emergency injury'});
    expect(response.status).toBe(201);
  });
  it('separates appointment viewing from management',async()=>{vi.spyOn(schedulingRepository,'appointments').mockResolvedValue([]);const viewer=app(['clinic.portal.access','clinic.appointment.view']);expect((await request(viewer).get('/api/v1/clinic/appointments')).status).toBe(200);expect((await request(viewer).post('/api/v1/clinic/appointments').send({})).status).toBe(403)});
  it('creates, reschedules, and starts an appointment without duplicating its linked encounter',async()=>{const manager=app(['clinic.portal.access','clinic.appointment.manage','clinic.encounter.manage']);vi.spyOn(schedulingRepository,'createAppointment').mockResolvedValue({id:'a'} as never);vi.spyOn(schedulingRepository,'updateAppointment').mockResolvedValue({id:'a',status:'rescheduled'} as never);const start=vi.spyOn(schedulingRepository,'startAppointment').mockResolvedValue({encounterId:'e',created:false});const student='11111111-1111-4111-8111-111111111111',appointment='22222222-2222-4222-8222-222222222222';expect((await request(manager).post('/api/v1/clinic/appointments').send({studentId:student,appointmentType:'Follow-up',scheduledAt:'2026-08-30T09:00:00.000Z',reason:'Review'})).status).toBe(201);expect((await request(manager).patch(`/api/v1/clinic/appointments/${appointment}`).send({version:1,status:'rescheduled',scheduledAt:'2026-08-31T09:00:00.000Z'})).status).toBe(200);expect((await request(manager).post(`/api/v1/clinic/appointments/${appointment}/start`)).body).toEqual({encounterId:'e',created:false});expect(start).toHaveBeenCalledTimes(1)});
  it('requires the dedicated notification permission for portal-safe releases',async()=>{const response=await request(app(['clinic.portal.access','clinic.appointment.manage'])).post('/api/v1/clinic/portal-releases').send({});expect(response.status).toBe(403)});
});
