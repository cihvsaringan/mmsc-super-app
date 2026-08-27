import{describe,expect,it}from'vitest';
import{canTransitionCopy}from'./catalog-repository.js';

describe('Library copy status transitions',()=>{
 it('allows operational condition transitions',()=>{expect(canTransitionCopy('available','damaged')).toBe(true);expect(canTransitionCopy('damaged','under_repair')).toBe(true);expect(canTransitionCopy('under_repair','available')).toBe(true);expect(canTransitionCopy('lost','available')).toBe(true)});
 it('prevents copy management from bypassing circulation',()=>{expect(canTransitionCopy('checked_out','available')).toBe(false);expect(canTransitionCopy('reserved','available')).toBe(false)});
 it('keeps withdrawal terminal and permits idempotent updates',()=>{expect(canTransitionCopy('available','withdrawn')).toBe(true);expect(canTransitionCopy('withdrawn','available')).toBe(false);expect(canTransitionCopy('withdrawn','withdrawn')).toBe(true)});
});
