import { z } from "zod";

export const createEventSchema = z.object({
  venueId: z.string().min(1),
  eventTypeId: z.string().min(1),
  packageId: z.string().min(1),
  name: z.string().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  expectedGuests: z.number().int().nonnegative(),
  notes: z.string().optional(),
});

export type CreateEventSchema = z.infer<typeof createEventSchema>;


