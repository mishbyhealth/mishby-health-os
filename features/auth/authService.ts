// features/auth/authService.ts
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { auth } from '@/features/services/firebase'
import { setUserData } from '@/features/services/userService'

export async function login(email: string, password: string) {
  const userCred = await signInWithEmailAndPassword(auth, email, password)
  return userCred.user
}

export async function register(email: string, password: string, userData: any) {
  const userCred = await createUserWithEmailAndPassword(auth, email, password)
  await setUserData(userCred.user.uid, userData)
  return userCred.user
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email)
}

export async function logout() {
  await signOut(auth)
}

export function onAuthChange(callback: (user: any) => void) {
  return onAuthStateChanged(auth, callback)
}
