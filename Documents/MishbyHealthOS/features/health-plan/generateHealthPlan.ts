// features/health-plan/generateHealthPlan.ts
import { getFunctions, httpsCallable } from 'firebase/functions'

export const generateHealthPlan = async (userData: any) => {
  const functions = getFunctions()
  const generate = httpsCallable(functions, 'generateHealthPlan')
  const result = await generate({ user: userData, timestamp: new Date().toISOString() })
  return result.data
}
