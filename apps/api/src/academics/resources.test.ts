import { describe, expect, it } from 'vitest';
import { isResourceName, resourceDefinitions } from './resources.js';

describe('academic resource definitions', () => {
  it('allowlists only implemented Phase 2 resources', () => {
    expect(isResourceName('school-years')).toBe(true); expect(isResourceName('students')).toBe(false); expect(isResourceName('grades')).toBe(false);
  });
  it('rejects an inverted school year date range', () => {
    const result = resourceDefinitions['school-years'].schema.safeParse({ schoolId: '08f35c64-1fd8-4c59-abd9-03466935c97b', name: '2026–2027', startsOn: '2027-01-01', endsOn: '2026-01-01' }); expect(result.success).toBe(false);
  });
  it('accepts a valid hierarchical calendar event', () => {
    const result = resourceDefinitions.events.schema.safeParse({ schoolId: '08f35c64-1fd8-4c59-abd9-03466935c97b', title: 'Foundation Day', eventType: 'community', startsAt: '2026-08-18T08:00:00+08:00', endsAt: '2026-08-18T17:00:00+08:00' }); expect(result.success).toBe(true);
  });
});
