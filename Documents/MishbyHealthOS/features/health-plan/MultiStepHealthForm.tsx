// features/health-plan/MultiStepHealthForm.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import BasicInfoStep from './BasicInfoStep'
import HealthInfoStep from './HealthInfoStep'
import ReproductiveHealthStep from './ReproductiveHealthStep'
import DoshaAssessmentStep from './DoshaAssessmentStep'
import { Stepper, Button, Card } from '@/features/component-library'

const schemas = [
  z.object({
    name: z.string().min(2),
    age: z.number().min(1).max(120),
    gender: z.enum(['male', 'female', 'other']),
    region: z.string(),
    country: z.string()
  }),
  z.object({
    workType: z.enum(['sedentary', 'active', 'laborious']),
    allergies: z.array(z.string()).optional(),
    dietType: z.enum(['vegetarian', 'non-vegetarian', 'vegan', 'other']),
  }),
  z.object({
    isPregnant: z.boolean().default(false),
    lastPeriod: z.date().optional(),
    pregnancyTrimester: z.number().min(1).max(3).optional(),
    notes: z.string().optional()
  }),
  z.object({
    dosha: z.enum(['vata', 'pitta', 'kapha', 'mixed']),
    doshaDetails: z.object({
      vata: z.number().min(0).max(10),
      pitta: z.number().min(0).max(10),
      kapha: z.number().min(0).max(10),
    }),
  })
]

export default function MultiStepHealthForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [step, setStep] = useState(0)
  const { register, handleSubmit, formState: { errors }, control, watch } = useForm({
    resolver: zodResolver(schemas[step])
  })

  const steps = ['Basic Info', 'Health Info', 'Reproductive Health', 'Dosha']

  const next = (data: any) => {
    if (step < steps.length - 1) setStep(step + 1)
    else onSubmit(data)
  }

  return (
    <Card>
      <Stepper steps={steps} currentStep={step} />
      <form onSubmit={handleSubmit(next)}>
        {step === 0 && <BasicInfoStep {...{ register, errors, control }} />}
        {step === 1 && <HealthInfoStep {...{ register, errors, control }} />}
        {step === 2 && <ReproductiveHealthStep {...{ register, errors, control, watch }} />}
        {step === 3 && <DoshaAssessmentStep {...{ register, errors, control }} />}
        <div className="flex justify-between mt-6">
          {step > 0 && <Button type="button" onClick={() => setStep(step - 1)}>Back</Button>}
          <Button type="submit">{step === steps.length - 1 ? 'Submit' : 'Next'}</Button>
        </div>
      </form>
    </Card>
  )
}
