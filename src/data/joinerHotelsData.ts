import type { AssignedHotel, Joiner } from '../types';

export const verifiedPuneHotels: AssignedHotel[] = [];

/**
 * Returns the complete list of hotels onboarded/joined by a given joiner.
 */
export const getHotelsForJoiner = (joiner?: Joiner | null): AssignedHotel[] => {
  if (!joiner) return [];

  // Return real assigned hotels if present
  if (joiner.assignedHotelsList && joiner.assignedHotelsList.length > 0) {
    return joiner.assignedHotelsList.map((h, i) => ({
      id: i + 1,
      name: h.name,
      location: h.location || joiner.zone || 'Pune',
      owner: (h as any).owner || 'Hotel Manager',
      phone: (h as any).phone || '',
      orders: (h as any).orders || 0,
      joinedDate: (h as any).joinedDate || '',
      status: h.status || 'Active'
    }));
  }

  return [];
};
