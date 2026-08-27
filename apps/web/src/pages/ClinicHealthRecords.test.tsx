import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
let permissions=['clinic.health_records.view'];
vi.mock('../auth/AuthContext',()=>({useAuth:()=>({has:(permission:string)=>permissions.includes(permission)})}));
import { ClinicHealthRecords } from './ClinicHealthRecords';

const student={id:'student-1',studentNumber:'STU-001',firstName:'Ana',lastName:'Santos',gradeLevel:'Grade 7',section:'Faith',profilePhotoUrl:null,enrollmentStatus:'enrolled',bloodType:null,pastIllnesses:null,surgeriesHospitalizations:null,longTermMedications:null,medicationRestrictions:null,emergencyNotes:null,physicianRecommendations:null,healthProfileVersion:null};
const json=(body:unknown)=>Promise.resolve(new Response(JSON.stringify(body),{status:200,headers:{'Content-Type':'application/json'}}));
describe('Clinic student health records',()=>{
 beforeEach(()=>{permissions=['clinic.health_records.view'];vi.stubGlobal('fetch',vi.fn().mockImplementation((input:unknown)=>String(input).includes('health-records/students')?json({students:[{...student,alerts:[{id:'a',severity:'critical',title:'Peanut allergy',type:'allergy'}]}]}):json({student,alerts:[{id:'a',alertType:'allergy',severity:'critical',title:'Peanut allergy',notes:'Carries epinephrine',active:true,version:1}],immunizations:[],physicalExams:[],visits:[],guardians:[],appointments:[],followUps:[]})))});
 afterEach(()=>{cleanup();vi.unstubAllGlobals()});
 it('renders critical alerts prominently and keeps view-only records read-only',async()=>{render(<ClinicHealthRecords/>);fireEvent.change(screen.getByLabelText('Student number or name'),{target:{value:'Ana'}});fireEvent.click(screen.getByRole('button',{name:'Search'}));fireEvent.click(await screen.findByRole('button',{name:/Ana Santos/}));expect(await screen.findByRole('region',{name:'Critical health alerts'})).toHaveTextContent('Peanut allergy');expect(screen.queryByRole('button',{name:/edit profile/i})).not.toBeInTheDocument()});
 it('shows management actions only with the manage permission',async()=>{permissions.push('clinic.health_records.manage');render(<ClinicHealthRecords/>);fireEvent.change(screen.getByLabelText('Student number or name'),{target:{value:'Ana'}});fireEvent.click(screen.getByRole('button',{name:'Search'}));fireEvent.click(await screen.findByRole('button',{name:/Ana Santos/}));expect(await screen.findByRole('button',{name:/edit profile/i})).toBeInTheDocument()});
});
