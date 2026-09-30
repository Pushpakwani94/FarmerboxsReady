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
import type { Order, OrderStatus } from '../../types';

const COLLECTION = 'orders';

export const orderService = {
  subscribe(onUpdate: (orders: Order[]) => void, onError?: (error: Error) => void): Unsubscribe {
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

          const orders: Order[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            orders.push({
              ...data,
              id: String(data.id || data.orderId || d.id),
              orderId: String(data.orderId || data.id || d.id),
              hotelId: data.hotelId,
              hotelName: data.hotelName || 'Partner Hotel',
              zone: data.zone || data.hotelZone || 'Kharadi',
              joiner: data.joiner || data.assignedJoiner || '',
              joinerId: data.joinerId || '',
              date: data.date || 'Today',
              time: data.time || '10:00 AM',
              amount: Number(data.totalAmount ?? data.amount ?? 0),
              totalAmount: Number(data.totalAmount ?? data.amount ?? 0),
              subtotal: Number(data.subtotal ?? data.amount ?? 0),
              deliveryCharge: Number(data.deliveryCharge ?? 0),
              paymentMode: data.paymentMode || data.paymentMethod || 'Online',
              paymentStatus: data.paymentStatus || 'Pending',
              driver: data.driver || 'Unassigned',
              status: data.status || data.orderStatus || 'Pending',
              orderStatus: data.orderStatus || data.status || 'Pending',
              commission: Number(data.commission ?? 100),
              items: data.items || []
            } as Order);
          });

          onUpdate(orders);
        },
        (error) => {
          console.error('orderService snapshot error:', error);
          if (onError) onError(error);
          onUpdate([]);
        }
      );
    } catch (err: any) {
      console.error('orderService subscribe exception:', err);
      if (onError) onError(err);
      onUpdate([]);
      return () => {};
    }
  },

  subscribeForJoiner(
    joinerOrUid: string | { uid: string; name?: string; zone?: string; phone?: string },
    onUpdate: (orders: Order[]) => void,
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

          const orders: Order[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            const joinerId = String(data.joinerId || data.joinedBy || '');
            const orderJoiner = String(data.joiner || data.assignedJoiner || '').trim().toLowerCase();
            const orderZone = String(data.zone || data.hotelZone || '').trim().toLowerCase().replace(' zone', '');
            const orderPhone = String(data.joinerPhone || data.phone || data.mobile || '').replace(/[^0-9]/g, '').slice(-10);
            const addedBy = String(data.addedBy || '');

            const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
            const cleanOrderPhone = orderPhone.replace(/[^0-9]/g, '').slice(-10);
            const cleanJoinerId = joinerId.replace(/[^0-9]/g, '').slice(-10);

            const matchesUid = Boolean(
              uid && (
                joinerId === uid ||
                String(data.joinedBy || '') === uid ||
                (cleanUid && cleanUid.length >= 6 && (joinerId.includes(cleanUid) || String(data.joinedBy || '').includes(cleanUid))) ||
                (cleanPhone && cleanPhone.length >= 6 && (cleanJoinerId === cleanPhone || joinerId.includes(cleanPhone) || String(data.joinedBy || '').includes(cleanPhone)))
              )
            );
            const matchesPhone = Boolean(
              cleanPhone && cleanPhone.length >= 6 && cleanOrderPhone && (cleanOrderPhone === cleanPhone || cleanOrderPhone.includes(cleanPhone) || cleanPhone.includes(cleanOrderPhone))
            );
            const matchesName = Boolean(
              name && name.length >= 2 && (
                orderJoiner === name ||
                (name.length >= 3 && orderJoiner.includes(name)) ||
                (orderJoiner.length >= 3 && name.includes(orderJoiner))
              )
            );
            const matchesZone = Boolean(
              zone && zone !== 'all' && zone !== 'all zones (hq)' && orderZone && (orderZone === zone || orderZone.includes(zone) || zone.includes(orderZone))
            );
            const matchesAdminZone = (addedBy === 'Admin' || !joinerId || joinerId === 'Admin') &&
              (!zone || zone === 'all' || zone === 'all zones (hq)' || orderZone === zone || orderZone.includes(zone) || zone.includes(orderZone) || orderJoiner === 'admin' || orderJoiner === 'all' || !orderZone);

            // Order matches if placed by joiner, assigned to joiner, or created/updated in the joiner's zone
            if (matchesUid || matchesPhone || matchesName || matchesZone || matchesAdminZone) {
              orders.push({
                ...data,
                id: String(data.id || data.orderId || d.id),
                orderId: String(data.orderId || data.id || d.id),
                hotelId: data.hotelId,
                hotelName: data.hotelName || 'Partner Hotel',
                zone: data.zone || data.hotelZone || 'Kharadi',
                joiner: data.joiner || data.assignedJoiner || '',
                joinerId: joinerId,
                date: data.date || 'Today',
                time: data.time || '10:00 AM',
                amount: Number(data.totalAmount ?? data.amount ?? 0),
                totalAmount: Number(data.totalAmount ?? data.amount ?? 0),
                subtotal: Number(data.subtotal ?? data.amount ?? 0),
                deliveryCharge: Number(data.deliveryCharge ?? 0),
                paymentMode: data.paymentMode || data.paymentMethod || 'Online',
                paymentStatus: data.paymentStatus || 'Pending',
                driver: data.driver || 'Unassigned',
                status: data.status || data.orderStatus || 'Pending',
                orderStatus: data.orderStatus || data.status || 'Pending',
                commission: Number(data.commission ?? 100),
                items: data.items || []
              } as Order);
            }
          });

          onUpdate(orders);
        },
        (error) => {
          console.error('orderService subscribeForJoiner error:', error);
          if (onError) onError(error);
          onUpdate([]);
        }
      );
    } catch (err: any) {
      console.error('orderService subscribeForJoiner exception:', err);
      if (onError) onError(err);
      onUpdate([]);
      return () => {};
    }
  },

  async getAll(): Promise<Order[]> {
    if (!isFirebaseConfigured() || !db) return [];
    try {
      const colRef = collection(db, COLLECTION);
      const snap = await getDocs(colRef);
      return snap.docs.map((d) => ({
        ...d.data(),
        id: String(d.data().id || d.id)
      })) as Order[];
    } catch (e) {
      console.error('orderService.getAll error:', e);
      return [];
    }
  },

  async getById(orderId: string): Promise<Order | null> {
    if (!isFirebaseConfigured() || !db) return null;
    try {
      const docRef = doc(db, COLLECTION, orderId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return { ...snap.data(), id: snap.id } as Order;
    } catch (e) {
      console.error(`orderService.getById(${orderId}) error:`, e);
      return null;
    }
  },

  async add(order: Partial<Order>): Promise<string> {
    const orderId = order.id || order.orderId || `#FB${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: any = {
      ...order,
      id: orderId,
      orderId,
      date: order.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: order.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: order.status || 'Pending',
      paymentStatus: order.paymentStatus || 'Pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (isFirebaseConfigured() && db) {
      const docRef = doc(db, COLLECTION, orderId);
      await setDoc(docRef, newOrder, { merge: true });
      const verifySnap = await getDoc(docRef);
      if (!verifySnap.exists()) {
        throw new Error(`Failed to verify order document ${orderId} in Firestore`);
      }
    }

    return orderId;
  },

  async updateStatus(orderId: string, status: OrderStatus): Promise<void> {
    if (isFirebaseConfigured() && db) {
      const docRef = doc(db, COLLECTION, orderId);
      await updateDoc(docRef, {
        status,
        orderStatus: status,
        updatedAt: serverTimestamp()
      });
      const verifySnap = await getDoc(docRef);
      if (!verifySnap.exists()) {
        throw new Error(`Order ${orderId} not found in Firestore after status update`);
      }
    }
  },

  async delete(orderId: string): Promise<void> {
    if (isFirebaseConfigured() && db) {
      const docRef = doc(db, COLLECTION, orderId);
      await deleteDoc(docRef);
    }
  }
};
