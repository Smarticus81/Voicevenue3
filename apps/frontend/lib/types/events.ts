export type UUID = string;

export interface CreateEventInput {
  venueId: UUID;
  eventTypeId: UUID;
  packageId: UUID;
  name: string;
  startsAt: string; // ISO
  endsAt: string;   // ISO
  expectedGuests: number;
  notes?: string;
}

export interface AllocationResult {
  allocations: Array<{
    inventoryItemId: UUID;
    requiredQty: number;
    allocatedQty: number;
    shortageQty: number;
    substitutedFrom?: UUID;
    suggestedSubs?: Array<{ inventoryItemId: UUID; availableQty: number }>;
  }>;
  hadShortages: boolean;
}


