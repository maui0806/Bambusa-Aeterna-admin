import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'

import { db } from '@/config/firebase'

const USERS = 'users'

export function mapStaffUserDoc(id, data) {
  const status = data.accountStatus === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
  return {
    id,
    uid: data.uid ?? id,
    fullName: data.fullName ?? '',
    email: data.email ?? '',
    phone: data.phone ?? '',
    warehouseId: data.warehouseId ?? '',
    warehouseName: data.warehouseName ?? '',
    phoneverifystatus: data.phoneverifystatus === true,
    accountStatus: status,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  }
}

export function subscribeStaffUsers(onData, onError) {
  const q = query(collection(db, USERS), where('role', '==', 'staff'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => mapStaffUserDoc(d.id, d.data())))
    },
    onError,
  )
}

export async function setStaffAccountStatus(userId, accountStatus) {
  if (accountStatus !== 'ACTIVE' && accountStatus !== 'INACTIVE') {
    throw new Error('Invalid account status.')
  }
  await updateDoc(doc(db, USERS, userId), {
    accountStatus,
    updatedAt: serverTimestamp(),
  })
}
