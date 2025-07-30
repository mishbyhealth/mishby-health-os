// features/health-plan/planGenerator.ts

import { z } from 'zod'

export const healthPlanSchema = z.object({
  name: z.string(),
  age: z.number().min(0).max(120),
  dosha: z.enum(['vata', 'pitta', 'kapha']),
  goal: z.enum(['weight-loss', 'energy-boost', 'mental-peace']),
})

export type HealthPlanInput = z.infer<typeof healthPlanSchema>

export interface HealthPlan {
  title: string
  recommendations: string[]
  tips: string[]
}

export function generatePlan(data: HealthPlanInput): HealthPlan {
  const { name, dosha, goal } = data

  let recommendations: string[] = []
  let tips: string[] = []

  // Basic logic based on dosha and goal
  if (dosha === 'vata') {
    recommendations.push('Warm, cooked meals', 'Regular routine', 'Healthy oils like ghee')
    tips.push('Avoid cold/raw food', 'Stay hydrated', 'Practice grounding yoga')
  } else if (dosha === 'pitta') {
    recommendations.push('Cooling foods like cucumber', 'Avoid spicy food', 'Stay cool in heat')
    tips.push('Meditate daily', 'Avoid conflict', 'Use coconut oil')
  } else if (dosha === 'kapha') {
    recommendations.push('Light, dry meals', 'Exercise daily', 'Avoid sugar and dairy')
    tips.push('Wake early', 'Stay active', 'Use warming spices like ginger')
  }

  if (goal === 'weight-loss') {
    tips.push('Increase physical activity', 'Drink herbal teas', 'Avoid heavy dinners')
  } else if (goal === 'energy-boost') {
    tips.push('Get morning sunlight', 'Eat fresh fruits', 'Practice breathwork')
  } else if (goal === 'mental-peace') {
    tips.push('Limit screen time', 'Chant “Om” daily', 'Sleep before 10 PM')
  }

  return {
    title: `Personalized Plan for ${name}`,
    recommendations,
    tips,
  }
}
