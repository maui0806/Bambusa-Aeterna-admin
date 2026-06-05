import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore'

import { db } from '@/config/firebase'

const MATERIAL_CATALOG = 'materialCatalog'

function normalizeMaterialName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ')
}

function materialNameKey(name) {
  return normalizeMaterialName(name).toLowerCase()
}

function materialDocIdFromName(name) {
  return `material-${encodeURIComponent(materialNameKey(name))}`
}

export async function listMaterialCatalog() {
  const snap = await getDocs(query(collection(db, MATERIAL_CATALOG), orderBy('name', 'asc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function addMaterialNameFromAdmin(name, adminUid) {
  const normalized = normalizeMaterialName(name)
  if (!normalized) {
    throw new Error('Material name is required.')
  }

  const docId = materialDocIdFromName(normalized)
  const ref = doc(db, MATERIAL_CATALOG, docId)
  const existing = await getDoc(ref)
  if (existing.exists()) {
    throw new Error('This material name already exists in the archive.')
  }

  const now = serverTimestamp()
  await setDoc(ref, {
    name: normalized,
    nameKey: materialNameKey(normalized),
    createdByRole: 'admin',
    createdById: adminUid || null,
    createdAt: now,
    updatedAt: now,
  })

  return { id: docId, name: normalized }
}

export async function updateMaterialName(materialId, newName, adminUid) {
  const normalized = normalizeMaterialName(newName)
  if (!normalized) {
    throw new Error('Material name is required.')
  }

  const oldRef = doc(db, MATERIAL_CATALOG, materialId)
  const oldSnap = await getDoc(oldRef)
  if (!oldSnap.exists()) {
    throw new Error('Material name not found.')
  }

  const newDocId = materialDocIdFromName(normalized)
  const newKey = materialNameKey(normalized)
  const now = serverTimestamp()

  if (newDocId === materialId) {
    await setDoc(
      oldRef,
      {
        name: normalized,
        nameKey: newKey,
        updatedAt: now,
        updatedById: adminUid || null,
      },
      { merge: true },
    )
    return { id: materialId, name: normalized }
  }

  const newRef = doc(db, MATERIAL_CATALOG, newDocId)
  const duplicate = await getDoc(newRef)
  if (duplicate.exists()) {
    throw new Error('Another material already uses this name.')
  }

  const oldData = oldSnap.data()
  const batch = writeBatch(db)
  batch.set(newRef, {
    name: normalized,
    nameKey: newKey,
    createdByRole: oldData.createdByRole || 'admin',
    createdById: oldData.createdById || adminUid || null,
    createdAt: oldData.createdAt || now,
    updatedAt: now,
    updatedById: adminUid || null,
  })
  batch.delete(oldRef)
  await batch.commit()

  return { id: newDocId, name: normalized }
}

export async function deleteMaterialName(materialId) {
  const ref = doc(db, MATERIAL_CATALOG, materialId)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    throw new Error('Material name not found.')
  }
  await deleteDoc(ref)
}
