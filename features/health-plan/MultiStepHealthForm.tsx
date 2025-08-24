import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../../firebase' // Make sure this path points to your firebase config
import BasicInfoStep from './BasicInfoStep'
import HealthInfoStep from './HealthInfoStep'
import ReproductiveHealthStep from './ReproductiveHealthStep'
import DoshaAssessmentStep from './DoshaAssessmentStep'
import { Stepper, Button, Card } from '../../../components/ui' // Adjust path as needed

interface HealthRanges {
  bp: {
    systolic: number
    diastolic: number
  }
  sugar: {
    fasting: number
    postMeal: number
  }
}

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
    bloodPressure: z.object({
      systolic: z.number().min(70).max(200),
      diastolic: z.number().min(40).max(120)
    }).optional(),
    bloodSugar: z.object({
      fasting: z.number().min(50).max(300).optional(),
      postMeal: z.number().min(50).max(400).optional()
    }).optional()
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

interface MultiStepHealthFormProps {
  onSubmit: (data: any) => void
}

export default function MultiStepHealthForm({ onSubmit }: MultiStepHealthFormProps) {
  const [step, setStep] = useState(0)
  const [healthRanges, setHealthRanges] = useState<HealthRanges>({
    bp: { systolic: 120, diastolic: 80 },
    sugar: { fasting: 100, postMeal: 140 }
  })

  useEffect(() => {
    const fetchRanges = async () => {
      try {
        const docRef = doc(db, 'healthGuides', 'ranges')
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          setHealthRanges({
            bp: {
              systolic: data.normalBP_systolic || 120,
              diastolic: data.normalBP_diastolic || 80
            },
            sugar: {
              fasting: data.normalSugar_fasting || 100,
              postMeal: data.normalSugar_postMeal || 140
            }
          })
        }
      } catch (error) {
        console.error("Error loading health ranges:", error)
      }
    }
    fetchRanges()
  }, [])

  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    control, 
    watch 
  } = useForm({
    resolver: zodResolver(schemas[step])
  })

  const steps = ['Basic Info', 'Health Info', 'Reproductive Health', 'Dosha']

  const next = (data: any) => {
    if (step < steps.length - 1) setStep(step + 1)
    else onSubmit(data)
  }

  return (
    <Card className="max-w-3xl mx-auto p-6">
      <Stepper steps={steps} currentStep={step} className="mb-8" />
      
      {step === 1 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="font-bold text-lg mb-2 text-blue-800">Healthy Reference Ranges</h3>
          <ul className="list-disc pl-5 space-y-1 text-blue-700">
            <li>Blood Pressure: &lt;{healthRanges.bp.systolic}/{healthRanges.bp.diastolic} mmHg</li>
            <li>Fasting Sugar: &lt;{healthRanges.sugar.fasting} mg/dL</li>
            <li>Post-Meal Sugar (2hr): &lt;{healthRanges.sugar.postMeal} mg/dL</li>
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit(next)} className="space-y-6">
        {step === 0 && <BasicInfoStep register={register} errors={errors} control={control} />}
        {step === 1 && (
          <HealthInfoStep 
            register={register} 
            errors={errors} 
            control={control}
            healthRanges={healthRanges}
          />
        )}
        {step === 2 && (
          <ReproductiveHealthStep 
            register={register} 
            errors={errors} 
            control={control} 
            watch={watch} 
          />
        )}
        {step === 3 && <DoshaAssessmentStep register={register} errors={errors} control={control} />}
        
        <div className="flex justify-between mt-8">
          {step > 0 && (
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="px-6 py-2"
            >
              Back
            </Button>
          )}
          <Button type="submit" className="px-6 py-2">
            {step === steps.length - 1 ? 'Submit Health Plan' : 'Next Step'}
          </Button>
        </div>
      </form>
    </Card>
  )
}