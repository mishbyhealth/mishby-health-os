// features/services/userService.ts
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

const VERSION = 1

export interface UserProfile {
  id: string
  name: string
  dosha: string
  [key: string]: any
}

export async function setUserData(userId: string, userData: Partial<UserProfile>) {
  const ref = doc(db, 'users', userId)
  await setDoc(ref, {
    ...userData,
    schemaVersion: VERSION,
    lastUpdated: serverTimestamp()
  }, { merge: true })
}

export async function getCurrentUserData(): Promise<UserProfile> {
  const user = auth.currentUser
  if (!user) throw new Error('No user')

  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('No user doc')

  const data = snap.data()

  // Type assertion to ensure TypeScript sees name and dosha
  return {
    id: user.uid,
    name: data?.name ?? '',
    dosha: data?.dosha ?? '',
    ...data
  }
}

export async function updateUserData(userId: string, updates: Partial<UserProfile>) {
  const ref = doc(db, 'users', userId)
  await updateDoc(ref, {
    ...updates,
    lastUpdated: serverTimestamp()
  })
}
