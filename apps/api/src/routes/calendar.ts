import { Router } from 'express';
import { z } from 'zod';
import { calendarRepository } from '../calendar/repository.js';
import { requirePermission } from '../security/middleware.js';

export const calendarRouter = Router();
const querySchema = z.object({
  from: z.iso.date(), to: z.iso.date(),
  eventType: z.enum(['academic','holiday','administrative','community','other']).optional(),
  campusId: z.string().uuid().optional(), schoolYearId: z.string().uuid().optional(),
}).strict().refine(value => value.to >= value.from, { message: 'Calendar end must not precede its start', path: ['to'] });

calendarRouter.get('/calendar/context', requirePermission('calendar.experience.access'), async (_req,res,next) => {
  try { res.json(await calendarRepository.context()); } catch (error) { next(error); }
});
calendarRouter.get('/calendar/events', requirePermission('calendar.experience.access'), async (req,res,next) => {
  try {
    const query = querySchema.parse(req.query);
    const includeUnpublished = Boolean(req.auth.permissions?.includes('academic.calendar.manage'));
    res.json({ items: await calendarRepository.events({ ...query, includeUnpublished }) });
  } catch (error) { next(error); }
});
