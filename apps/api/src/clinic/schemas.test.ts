import { describe, expect, it } from 'vitest';
import { calculateBmi, dispense, encounterComplete, encounterCreate, encounterUpdate, healthProfileUpdate, interventionCreate, physicalExamCreate } from './schemas.js';

describe('clinic schemas',()=>{
  it('allows partial visit vitals and an assessment without diagnosis',()=>{
    expect(encounterCreate.parse({studentId:'00000000-0000-4000-8000-000000000001',source:'self_initiated',chiefComplaint:'Headache'}).symptoms).toEqual([]);
  });
  it('rejects non-positive dispensing',()=>expect(()=>dispense.parse({itemId:'00000000-0000-4000-8000-000000000001',quantity:0})).toThrow());
  it('accepts an initially empty health profile',()=>expect(healthProfileUpdate.parse({bloodType:'unknown'}).bloodType).toBe('unknown'));
  it('calculates BMI consistently and never from missing or zero values',()=>{
    expect(calculateBmi(160,50)).toBe(19.53);expect(calculateBmi(0,50)).toBeNull();expect(calculateBmi(undefined,50)).toBeNull();
  });
  it('validates physical measurement units',()=>{
    expect(()=>physicalExamCreate.parse({examinedOn:'2026-08-27',heightCm:0,weightKg:45})).toThrow();
    expect(physicalExamCreate.parse({examinedOn:'2026-08-27',heightCm:150,weightKg:45}).heightCm).toBe(150);
  });
  it('keeps assessment separate from optional diagnosis and accepts optional vitals',()=>{
    const value=encounterUpdate.parse({symptoms:['headache','other symptom'],temperatureC:37.2,assessment:'Monitor and hydrate'});expect(value.assessment).toBe('Monitor and hydrate');expect(value.diagnosis).toBeUndefined();
  });
  it('supports structured interventions and requires disposition on completion',()=>{
    expect(interventionCreate.parse({interventionType:'wound_cleaning'}).interventionType).toBe('wound_cleaning');expect(()=>encounterComplete.parse({})).toThrow();
  });
});
