import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
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

          const hotels: Hotel[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            const idVal = data.id !== undefined ? data.id : d.id;
            hotels.push({
              ...data,
              id: idVal,
              hotelId: data.hotelId || String(idVal),
              name: data.name || 'Unnamed Hotel',
              ownerName: data.ownerName || data.contactPerson || 'Manager',
              mobile: data.mobile || data.phone || '9876543210',
              email: data.email || 'hotel@farmerbox.com',
              zone: data.zone || 'Kharadi',
              joiner: data.joiner || data.assignedJoiner || '',
              joinedBy: data.joinedBy || data.joinerId || '',
              joinerId: data.joinerId || data.joinedBy || '',
              address: data.address || '',
              totalOrders: Number(data.totalOrders ?? data.orders ?? 0),
              totalSpent: Number(data.totalSpent ?? 0),
              registrationDate: data.registrationDate || 'Just now',
              gstNumber: data.gstNumber || '',
              fssaiNumber: data.fssaiNumber || '',
              rating: Number(data.rating ?? 5.0),
              status: data.status === 'Inactive' ? 'Inactive' : 'Active',
              image: data.image || data.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100'
            } as Hotel);
          });

          onUpdate(hotels);
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

          const hotels: Hotel[] = [];
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

            const matchesUid = Boolean(
              uid && (
                joinedBy === uid ||
                joinerId === uid ||
                (cleanUid && cleanUid.length >= 6 && (joinedBy.includes(cleanUid) || joinerId.includes(cleanUid))) ||
                (cleanPhone && cleanPhone.length >= 6 && (cleanJoinedBy === cleanPhone || cleanJoinerId === cleanPhone || joinedBy.includes(cleanPhone) || joinerId.includes(cleanPhone)))
              )
            );
            const matchesName = Boolean(
              name && name.length >= 2 && (
                assignedJoiner === name ||
                assignedJoiner.includes(name) ||
                name.includes(assignedJoiner) ||
                String(data.joiner || '').toLowerCase().includes(name)
              )
            );
            const matchesPhone = Boolean(
              cleanPhone && cleanPhone.length >= 6 && cleanHotelPhone && (cleanHotelPhone === cleanPhone || cleanHotelPhone.includes(cleanPhone) || cleanPhone.includes(cleanHotelPhone))
            );
            const matchesZone = Boolean(
              zone && zone !== 'all' && zone !== 'all zones (hq)' && hotelZone && (hotelZone === zone || hotelZone.includes(zone) || zone.includes(hotelZone))
            );
            const matchesAdminZone = (addedBy === 'Admin' || joinedBy === 'Admin' || !joinedBy) &&
              (!zone || zone === 'all' || zone === 'all zones (hq)' || hotelZone === zone || hotelZone.includes(zone) || zone.includes(hotelZone) || assignedJoiner === 'admin' || assignedJoiner === 'all' || !hotelZone);

            // Hotel matches if directly created by joiner, assigned by name/phone, in zone, or published by Admin
            if (matchesUid || matchesName || matchesPhone || matchesZone || matchesAdminZone) {
              const idVal = data.id !== undefined ? data.id : d.id;
              hotels.push({
                ...data,
                id: idVal,
                hotelId: data.hotelId || String(idVal),
                name: data.name || 'Unnamed Hotel',
                ownerName: data.ownerName || data.contactPerson || 'Manager',
                mobile: data.mobile || data.phone || '9876543210',
                email: data.email || 'hotel@farmerbox.com',
                zone: data.zone || 'Kharadi',
                joiner: data.joiner || data.assignedJoiner || '',
                joinedBy: joinedBy,
                joinerId: joinerId,
                address: data.address || '',
                totalOrders: Number(data.totalOrders ?? data.orders ?? 0),
                totalSpent: Number(data.totalSpent ?? 0),
                registrationDate: data.registrationDate || 'Just now',
                gstNumber: data.gstNumber || '',
                fssaiNumber: data.fssaiNumber || '',
                rating: Number(data.rating ?? 5.0),
                status: data.status === 'Inactive' ? 'Inactive' : 'Active',
                image: data.image || data.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100'
              } as Hotel);
            }
          });

          onUpdate(hotels);
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

  async add(hotel: Partial<Hotel>): Promise<number> {
    const id = typeof hotel.id === 'number' ? hotel.id : Date.now();
    const docId = String(id);
    const newHotel: any = {
      ...hotel,
      id,
      name: hotel.name || 'Unnamed Hotel',
      ownerName: hotel.ownerName || hotel.contactPerson || 'Manager',
      mobile: hotel.mobile || hotel.phone || '9876543210',
      email: hotel.email || 'hotel@farmerbox.com',
      zone: hotel.zone || 'Kharadi',
      joiner: hotel.joiner || hotel.assignedJoiner || 'Unassigned',
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
      const verifySnap = await getDoc(docRef);
      if (!verifySnap.exists()) {
        throw new Error(`Failed to verify hotel document ${docId} in Firestore`);
      }
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
      const verifySnap = await getDoc(docRef);
      if (!verifySnap.exists()) {
        throw new Error(`Hotel ${docId} not found in Firestore after update`);
      }
    }
  },

  async delete(id: number | string): Promise<void> {
    const docId = String(id);
    if (isFirebaseConfigured() && db) {
      const docRef = doc(db, COLLECTION, docId);
      await deleteDoc(docRef);
    }
  }
};
