import { UseFormRegister, FieldErrors, Control } from 'react-hook-form'

interface BasicInfoStepProps {
  register: UseFormRegister<any>
  errors: FieldErrors<any>
  control: Control<any>
}

export default function BasicInfoStep({ register, errors }: BasicInfoStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Full Name</label>
        <input
          className="w-full px-3 py-2 border rounded"
          {...register("name")}
          placeholder="Enter your full name"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message as string}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Age</label>
        <input
          className="w-full px-3 py-2 border rounded"
          type="number"
          {...register("age", { valueAsNumber: true })}
          placeholder="Enter your age"
        />
        {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age.message as string}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Gender</label>
        <select 
          className="w-full px-3 py-2 border rounded"
          {...register("gender")}
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender.message as string}</p>}
      </div>
    </div>
  )
}