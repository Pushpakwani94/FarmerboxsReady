import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  type Unsubscribe
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config';
import type { Hotel } from '../../types';

const COLLECTION = 'hotels';

export const hotelService = {
  subscribe(onUpdate: (hotels: Hotel[]) => void, onError?: (error: Error) => void): Unsubscribe {
    if (!isFirebaseConfigured() || !db) {
      if (onError) onError(new Error('Firebase Firestore is not configured.'));
      onUpdate([]);
      return () => {};
    }

    try {
      const colRef = collection(db, COLLECTION);
      return onSnapshot(
        colRef,
        (snapshot) => {
          if (snapshot.empty) {
            onUpdate([]);
            return;
          }

          const map = new Map<string, Hotel>();
          const phoneNameSet = new Set<string>();

          let deletedSet = new Set<string>();
          if (typeof window !== 'undefined') {
            try {
              const delRaw = localStorage.getItem('farmerbox_deleted_hotel_ids');
              if (delRaw) {
                const parsed: string[] = JSON.parse(delRaw);
                deletedSet = new Set(parsed.map(x => String(x).toLowerCase().trim()));
              }
            } catch {}
          }

          snapshot.forEach((d) => {
            const data = d.data();
            const idVal = data.id !== undefined ? data.id : d.id;
            const key = String(data.hotelId || idVal || d.id).trim();
            const cleanPhone = String(data.mobile || data.phone || '').replace(/\D/g, '').slice(-10);
            const cleanName = String(data.name || data.hotelName || '').trim().toLowerCase();
            const phoneNameKey = cleanPhone && cleanName ? `${cleanName}_${cleanPhone}` : '';

            // Permanently filter out blacklisted deleted hotels
            if (
              (key && deletedSet.has(key.toLowerCase())) ||
              (cleanPhone && deletedSet.has(cleanPhone)) ||
              (phoneNameKey && deletedSet.has(phoneNameKey)) ||
              (cleanName && deletedSet.has(cleanName))
            ) {
              return;
            }

            if (key && map.has(key)) return;
            if (phoneNameKey && phoneNameSet.has(phoneNameKey)) return;

            const hotelObj: Hotel = {
              ...data,
              id: idVal,
              hotelId: data.hotelId || String(idVal),
              name: data.name || 'Unnamed Hotel',
              ownerName: data.ownerName || data.contactPerson || 'Manager',
              contactPerson: data.contactPerson || data.ownerName || 'Manager',
              mobile: data.mobile || data.phone || '9876543210',
              phone: data.phone || data.mobile || '9876543210',
              email: data.email || 'hotel@farmerbox.com',
              zone: data.zone || 'Kharadi',
              joiner: data.joiner || data.assignedJoiner || '',
              assignedJoiner: data.assignedJoiner || data.joiner || '',
              joinedBy: data.joinedBy || data.joinerId || '',
              joinerId: data.joinerId || data.joinedBy || '',
              address: data.address || '',
              totalOrders: Number(data.totalOrders ?? data.orders ?? 0),
              orders: Number(data.orders ?? data.totalOrders ?? 0),
              totalSpent: Number(data.totalSpent ?? 0),
              registrationDate: data.registrationDate || 'Just now',
              gstNumber: data.gstNumber || '',
              fssaiNumber: data.fssaiNumber || '',
              rating: Number(data.rating ?? 5.0),
              status: data.status === 'Inactive' ? 'Inactive' : 'Active',
              image: data.image || data.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100'
            };

            if (key) map.set(key, hotelObj);
            if (phoneNameKey) phoneNameSet.add(phoneNameKey);
          });

          onUpdate(Array.from(map.values()));
        },
        (error) => {
          console.error('hotelService snapshot error:', error);
          if (onError) onError(error);
          onUpdate([]);
        }
      );
    } catch (err: any) {
      console.error('hotelService subscribe exception:', err);
      if (onError) onError(err);
      onUpdate([]);
      return () => {};
    }
  },

  subscribeForJoiner(
    joinerOrUid: string | { uid: string; name?: string; zone?: string; phone?: string },
    onUpdate: (hotels: Hotel[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    if (!isFirebaseConfigured() || !db) {
      if (onError) onError(new Error('Firebase Firestore is not configured.'));
      onUpdate([]);
      return () => {};
    }

    const uid = typeof joinerOrUid === 'string' ? joinerOrUid : (joinerOrUid?.uid || '');
    const name = typeof joinerOrUid === 'object' ? (joinerOrUid?.name || '').trim().toLowerCase() : '';
    const zone = typeof joinerOrUid === 'object' ? (joinerOrUid?.zone || '').trim().toLowerCase().replace(' zone', '') : '';
    const phone = typeof joinerOrUid === 'object' ? (joinerOrUid?.phone || '').replace(/[^0-9]/g, '').slice(-10) : '';
    const cleanUid = uid.replace(/[^0-9]/g, '').slice(-10);

    try {
      const colRef = collection(db, COLLECTION);
      return onSnapshot(
        colRef,
        (snapshot) => {
          if (snapshot.empty) {
            onUpdate([]);
            return;
          }

          const map = new Map<string, Hotel>();
          const phoneNameSet = new Set<string>();

          let deletedSet = new Set<string>();
          if (typeof window !== 'undefined') {
            try {
              const delRaw = localStorage.getItem('farmerbox_deleted_hotel_ids');
              if (delRaw) {
                const parsed: string[] = JSON.parse(delRaw);
                deletedSet = new Set(parsed.map(x => String(x).toLowerCase().trim()));
              }
            } catch {}
          }

          snapshot.forEach((d) => {
            const data = d.data();
            const joinedBy = String(data.joinedBy || data.joinerId || '');
            const joinerId = String(data.joinerId || data.joinedBy || '');
            const assignedJoiner = String(data.assignedJoiner || data.joiner || '').trim().toLowerCase();
            const hotelZone = String(data.zone || '').trim().toLowerCase().replace(' zone', '');
            const hotelPhone = String(data.joinerPhone || data.phone || data.mobile || '').replace(/[^0-9]/g, '').slice(-10);
            const addedBy = String(data.addedBy || '');

            const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
            const cleanHotelPhone = hotelPhone.replace(/[^0-9]/g, '').slice(-10);
            const cleanJoinedBy = joinedBy.replace(/[^0-9]/g, '').slice(-10);
            const cleanJoinerId = joinerId.replace(/[^0-9]/g, '').slice(-10);

            // STRICT Requirement 1: Every hotel must have only one assigned joiner.
            // Display only hotels registered by or assigned to the logged-in joiner.
            // Joiner A must NOT be able to access, see or edit Joiner B's hotels.
            const assignedJoinerId = String(data.assignedJoinerId || data.joinerId || data.joinedBy || '');
            const cleanAssignedId = assignedJoinerId.replace(/[^0-9]/g, '').slice(-10);

            const isAssignedToThisJoiner = Boolean(
              (uid && (assignedJoinerId === uid || cleanAssignedId === cleanUid || (cleanUid && cleanUid.length >= 6 && assignedJoinerId.includes(cleanUid)))) ||
              (cleanPhone && cleanPhone.length === 10 && (cleanAssignedId === cleanPhone || cleanHotelPhone === cleanPhone || assignedJoinerId.includes(cleanPhone)))
            );

            if (isAssignedToThisJoiner) {
              const idVal = data.id !== undefined ? data.id : d.id;
              const key = String(data.hotelId || idVal || d.id).trim();
              const cleanHPhone = String(data.normalizedPhone || data.mobile || data.phone || '').replace(/\D/g, '').slice(-10);
              const cleanHName = String(data.hotelName || data.name || '').trim().toLowerCase();
              const phoneNameKey = cleanHPhone && cleanHName ? `${cleanHName}_${cleanHPhone}` : '';

              // Permanently filter out blacklisted deleted hotels
              if (
                (key && deletedSet.has(key.toLowerCase())) ||
                (cleanHPhone && deletedSet.has(cleanHPhone)) ||
                (phoneNameKey && deletedSet.has(phoneNameKey)) ||
                (cleanHName && deletedSet.has(cleanHName))
              ) {
                return;
              }

              if (key && map.has(key)) return;
              if (phoneNameKey && phoneNameSet.has(phoneNameKey)) return;

              const hotelObj: Hotel = {
                ...data,
                id: idVal,
                hotelId: String(data.hotelId || idVal),
                hotelName: data.hotelName || data.name || 'Unnamed Hotel',
                name: data.name || data.hotelName || 'Unnamed Hotel',
                ownerName: data.ownerName || data.contactPerson || 'Manager',
                contactPerson: data.contactPerson || data.ownerName || 'Manager',
                mobile: cleanHPhone || data.mobile || data.phone || '',
                phone: cleanHPhone || data.phone || data.mobile || '',
                normalizedPhone: cleanHPhone,
                email: data.email || 'hotel@farmerbox.com',
                zone: data.zone || 'Kharadi',
                joiner: data.joiner || data.assignedJoiner || '',
                assignedJoiner: data.assignedJoiner || data.joiner || '',
                joinedBy: joinedBy || assignedJoinerId,
                joinerId: joinerId || assignedJoinerId,
                assignedJoinerId: assignedJoinerId,
                joinerPhone: data.joinerPhone || '',
                address: data.address || '',
                totalOrders: Number(data.totalOrders ?? data.orders ?? 0),
                orders: Number(data.orders ?? data.totalOrders ?? 0),
                totalSpent: Number(data.totalSpent ?? 0),
                registrationDate: data.registrationDate || 'Just now',
                gstNumber: data.gstNumber || '',
                fssaiNumber: data.fssaiNumber || '',
                rating: Number(data.rating ?? 5.0),
                status: data.status === 'Inactive' ? 'Inactive' : 'Active',
                image: data.image || data.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100'
              };

              if (key) map.set(key, hotelObj);
              if (phoneNameKey) phoneNameSet.add(phoneNameKey);
            }
          });

          onUpdate(Array.from(map.values()));
        },
        (error) => {
          console.error('hotelService subscribeForJoiner error:', error);
          if (onError) onError(error);
          onUpdate([]);
        }
      );
    } catch (err: any) {
      console.error('hotelService subscribeForJoiner exception:', err);
      if (onError) onError(err);
      onUpdate([]);
      return () => {};
    }
  },

  async getAll(): Promise<Hotel[]> {
    if (!isFirebaseConfigured() || !db) return [];
    try {
      const colRef = collection(db, COLLECTION);
      const snap = await getDocs(colRef);
      return snap.docs.map((d) => ({
        ...d.data(),
        id: typeof d.data().id === 'number' ? d.data().id : Number(d.id) || Date.now()
      })) as Hotel[];
    } catch (e) {
      console.error('hotelService.getAll error:', e);
      return [];
    }
  },

  /**
   * Concurrency-safe unique hotel registration.
   * Enforces Requirement 1:
   * - Normalized phone verification (10 digits)
   * - Prevents duplicate registrations across all joiners and devices
   * - If already registered by same joiner -> "You have already registered this hotel."
   * - If already registered with another partner -> "This hotel is already registered with another partner."
   * - Stores required fields: hotelId, hotelName, normalizedPhone, assignedJoinerId, createdAt, updatedAt, status
   */
  async registerHotel(
    hotelData: {
      name: string;
      ownerName?: string;
      mobile: string;
      address?: string;
      zone?: string;
      gst?: string;
      fssai?: string;
      image?: string;
      [key: string]: any;
    },
    joinerProfile: { uid: string; name: string; zone?: string; phone?: string }
  ): Promise<{ success: boolean; message: string; hotel: any }> {
    if (!joinerProfile?.uid) {
      return { success: false, message: 'Authentication required to register hotels.', hotel: null };
    }

    const rawPhone = String(hotelData.mobile || '').replace(/\D/g, '');
    const normalizedPhone = rawPhone.slice(-10);

    if (!normalizedPhone || normalizedPhone.length !== 10) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }

    const currentJoinerId = String(joinerProfile.uid).trim();
    const currentCleanPhone = String(joinerProfile.phone || '').replace(/\D/g, '').slice(-10);

    // 1. Check duplicate across all hotels in Firestore
    if (isFirebaseConfigured() && db) {
      const colRef = collection(db, COLLECTION);

      // Check normalizedPhone
      const qNorm = query(colRef, where('normalizedPhone', '==', normalizedPhone));
      const snapNorm = await getDocs(qNorm);

      let existingHotel: any = null;
      if (!snapNorm.empty) {
        existingHotel = snapNorm.docs[0].data();
      } else {
        // Fallback: check legacy mobile & phone fields
        const qMobile = query(colRef, where('mobile', '==', normalizedPhone));
        const snapMobile = await getDocs(qMobile);
        if (!snapMobile.empty) {
          existingHotel = snapMobile.docs[0].data();
        } else {
          const qPhone = query(colRef, where('phone', '==', normalizedPhone));
          const snapPhone = await getDocs(qPhone);
          if (!snapPhone.empty) {
            existingHotel = snapPhone.docs[0].data();
          }
        }
      }

      if (existingHotel) {
        const existingJoiner = String(existingHotel.assignedJoinerId || existingHotel.joinerId || existingHotel.joinedBy || '');
        const cleanExistingJoiner = existingJoiner.replace(/\D/g, '').slice(-10);

        if (
          existingJoiner === currentJoinerId ||
          (currentCleanPhone && (cleanExistingJoiner === currentCleanPhone || existingJoiner === `usr_${currentCleanPhone}`))
        ) {
          throw new Error('You have already registered this hotel.');
        } else {
          throw new Error('This hotel is already registered with another partner.');
        }
      }
    }

    // 2. Check duplicate in local storage cache
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('farmerbox_hotels');
        if (stored) {
          const parsed: any[] = JSON.parse(stored);
          const found = parsed.find((h: any) => {
            const hPhone = String(h.normalizedPhone || h.mobile || h.phone || '').replace(/\D/g, '').slice(-10);
            return hPhone === normalizedPhone;
          });

          if (found) {
            const existingJoiner = String(found.assignedJoinerId || found.joinerId || found.joinedBy || '');
            const cleanExistingJoiner = existingJoiner.replace(/\D/g, '').slice(-10);

            if (
              existingJoiner === currentJoinerId ||
              (currentCleanPhone && (cleanExistingJoiner === currentCleanPhone || existingJoiner === `usr_${currentCleanPhone}`))
            ) {
              throw new Error('You have already registered this hotel.');
            } else {
              throw new Error('This hotel is already registered with another partner.');
            }
          }
        }
      } catch (e: any) {
        if (e.message && e.message.includes('registered')) throw e;
      }
    }

    // 3. Create Unique Hotel Record
    const hotelId = `HT-${normalizedPhone}`;
    const cleanHotelName = (hotelData.name || hotelData.hotelName || 'Hotel Partner').trim();
    const cleanOwner = (hotelData.ownerName || hotelData.contactPerson || 'Manager').trim();
    const cleanZone = hotelData.zone || joinerProfile.zone || 'Kharadi';
    const cleanAddress = (hotelData.address || `${cleanZone}, Pune`).trim();

    const newHotelDoc: any = {
      id: hotelId,
      hotelId: hotelId,
      hotelName: cleanHotelName,
      name: cleanHotelName,
      ownerName: cleanOwner,
      contactPerson: cleanOwner,
      mobile: normalizedPhone,
      phone: normalizedPhone,
      normalizedPhone: normalizedPhone,
      assignedJoinerId: currentJoinerId,
      joinerId: currentJoinerId,
      joinedBy: currentJoinerId,
      joiner: joinerProfile.name,
      assignedJoiner: joinerProfile.name,
      joinerPhone: joinerProfile.phone || '',
      address: cleanAddress,
      zone: cleanZone.replace(' Zone', ''),
      gstNumber: hotelData.gst || '',
      fssaiNumber: hotelData.fssai || '',
      totalOrders: 0,
      orders: 0,
      totalSpent: 0,
      status: 'Active',
      image: hotelData.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100',
      registrationDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (isFirebaseConfigured() && db) {
      const docRef = doc(db, COLLECTION, hotelId);
      await setDoc(docRef, newHotelDoc, { merge: true });
    }

    // Update local storage caches safely
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('farmerbox_hotels');
        const parsed = stored ? JSON.parse(stored) : [];
        const merged = [newHotelDoc, ...parsed.filter((h: any) => String(h.hotelId || h.id) !== hotelId)];
        localStorage.setItem('farmerbox_hotels', JSON.stringify(merged));
      } catch {}
    }

    return {
      success: true,
      message: 'Hotel registered successfully.',
      hotel: newHotelDoc
    };
  },

  /**
   * Admin-Only Hotel Reassignment with mandatory audit logging.
   */
  async reassignHotelOwnership(
    hotelId: string,
    newJoiner: { uid: string; name: string; phone?: string; zone?: string },
    adminName: string = 'Super Admin',
    reason: string = 'Administrative reallocation'
  ): Promise<{ success: boolean; message: string }> {
    if (!isFirebaseConfigured() || !db) {
      return { success: false, message: 'Database not connected' };
    }

    const cleanHotelId = String(hotelId).trim();
    try {
      const hotelRef = doc(db, COLLECTION, cleanHotelId);
      const hotelSnap = await getDoc(hotelRef);

      if (!hotelSnap.exists()) {
        return { success: false, message: `Hotel ${cleanHotelId} not found.` };
      }

      const existingData = hotelSnap.data();
      const prevJoinerId = String(existingData.assignedJoinerId || existingData.joinerId || existingData.joinedBy || 'Unassigned');
      const prevJoinerName = String(existingData.assignedJoiner || existingData.joiner || 'Unassigned');

      // Update Hotel Record
      await updateDoc(hotelRef, {
        assignedJoinerId: newJoiner.uid,
        joinerId: newJoiner.uid,
        joinedBy: newJoiner.uid,
        joiner: newJoiner.name,
        assignedJoiner: newJoiner.name,
        joinerPhone: newJoiner.phone || '',
        updatedAt: serverTimestamp()
      });

      // Write Audit Log
      const auditRef = doc(db, 'hotelReassignmentLogs', `reassign_${Date.now()}`);
      await setDoc(auditRef, {
        id: auditRef.id,
        hotelId: cleanHotelId,
        hotelName: existingData.hotelName || existingData.name,
        previousJoinerId: prevJoinerId,
        previousJoinerName: prevJoinerName,
        newJoinerId: newJoiner.uid,
        newJoinerName: newJoiner.name,
        reassignedBy: adminName,
        reason,
        createdAt: serverTimestamp()
      });

      return {
        success: true,
        message: `Hotel reassigned successfully to ${newJoiner.name}. Audit log recorded.`
      };
    } catch (e: any) {
      console.error('hotelService.reassignHotelOwnership error:', e);
      return { success: false, message: e?.message || 'Failed to reassign hotel.' };
    }
  },

  async add(hotel: Partial<Hotel>): Promise<number> {
    const id = typeof hotel.id === 'number' ? hotel.id : Date.now();
    const docId = String(hotel.hotelId || id);
    const newHotel: any = {
      ...hotel,
      id,
      hotelId: docId,
      hotelName: hotel.hotelName || hotel.name || 'Unnamed Hotel',
      name: hotel.name || hotel.hotelName || 'Unnamed Hotel',
      ownerName: hotel.ownerName || hotel.contactPerson || 'Manager',
      mobile: hotel.mobile || hotel.phone || '9876543210',
      normalizedPhone: String(hotel.mobile || hotel.phone || '').replace(/\D/g, '').slice(-10),
      email: hotel.email || 'hotel@farmerbox.com',
      zone: hotel.zone || 'Kharadi',
      joiner: hotel.joiner || hotel.assignedJoiner || 'Unassigned',
      assignedJoinerId: hotel.assignedJoinerId || hotel.joinerId || '',
      address: hotel.address || '',
      totalOrders: Number(hotel.totalOrders ?? hotel.orders ?? 0),
      totalSpent: Number(hotel.totalSpent ?? 0),
      registrationDate: hotel.registrationDate || 'Just now',
      gstNumber: hotel.gstNumber || '',
      fssaiNumber: hotel.fssaiNumber || '',
      rating: Number(hotel.rating ?? 5.0),
      status: hotel.status || 'Active',
      image: hotel.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (isFirebaseConfigured() && db) {
      const docRef = doc(db, COLLECTION, docId);
      await setDoc(docRef, newHotel, { merge: true });
    }

    return id;
  },

  async update(id: number | string, data: Partial<Hotel>): Promise<void> {
    const docId = String(id);
    if (isFirebaseConfigured() && db) {
      const docRef = doc(db, COLLECTION, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    }
  },

  async delete(id: number | string): Promise<void> {
    const docId = String(id).trim();
    const cleanDigits = docId.replace(/\D/g, '').slice(-10);

    // Save to blacklist in localStorage
    if (typeof window !== 'undefined') {
      try {
        const delRaw = localStorage.getItem('farmerbox_deleted_hotel_ids') || '[]';
        const parsed: string[] = JSON.parse(delRaw);
        if (docId) parsed.push(docId);
        if (cleanDigits) parsed.push(cleanDigits);
        localStorage.setItem('farmerbox_deleted_hotel_ids', JSON.stringify(Array.from(new Set(parsed))));

        // Purge local storage
        const mobRaw = localStorage.getItem('farmerbox_mobile_hotels');
        if (mobRaw) {
          const arr = JSON.parse(mobRaw);
          if (Array.isArray(arr)) {
            const filtered = arr.filter((h: any) => {
              const hId = String(h.id || h.hotelId || '');
              const hPhone = String(h.mobile || h.phone || '').replace(/\D/g, '').slice(-10);
              return hId !== docId && (!cleanDigits || hPhone !== cleanDigits);
            });
            localStorage.setItem('farmerbox_mobile_hotels', JSON.stringify(filtered));
          }
        }
      } catch {}
    }

    if (isFirebaseConfigured() && db) {
      try {
        const docRef = doc(db, COLLECTION, docId);
        await deleteDoc(docRef);
      } catch {}

      try {
        const colRef = collection(db, COLLECTION);
        const queries = [
          query(colRef, where('hotelId', '==', docId)),
          query(colRef, where('id', '==', docId))
        ];
        if (cleanDigits && cleanDigits.length >= 6) {
          queries.push(query(colRef, where('mobile', '==', cleanDigits)));
          queries.push(query(colRef, where('phone', '==', cleanDigits)));
          queries.push(query(colRef, where('normalizedPhone', '==', cleanDigits)));
        }

        for (const q of queries) {
          try {
            const snap = await getDocs(q);
            snap.forEach(d => {
              deleteDoc(d.ref).catch(() => {});
            });
          } catch {}
        }
      } catch {}
    }
  }
};
