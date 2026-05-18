import { create } from 'zustand'

export type SignupPlan = 'free' | 'pro' | 'studio' | 'ultimate'
export type SignupBilling = 'monthly' | 'yearly'
export type SignupStep = 1 | 2 | 3

interface SignupStore {
  step: SignupStep
  name: string
  email: string
  password: string
  plan: SignupPlan
  billing: SignupBilling
  userId: string | null
  agreedToTerms: boolean
  setStep: (step: SignupStep) => void
  setField: (field: 'name' | 'email' | 'password', value: string) => void
  setPlan: (plan: SignupPlan) => void
  setBilling: (billing: SignupBilling) => void
  setUserId: (id: string) => void
  setAgreedToTerms: (v: boolean) => void
  reset: () => void
}

const INITIAL: Omit<SignupStore, keyof { setStep: unknown; setField: unknown; setPlan: unknown; setBilling: unknown; setUserId: unknown; setAgreedToTerms: unknown; reset: unknown }> = {
  step: 1,
  name: '',
  email: '',
  password: '',
  plan: 'free',
  billing: 'monthly',
  userId: null,
  agreedToTerms: false,
}

export const useSignupStore = create<SignupStore>((set) => ({
  ...INITIAL,
  setStep: (step) => set({ step }),
  setField: (field, value) => set({ [field]: value }),
  setPlan: (plan) => set({ plan }),
  setBilling: (billing) => set({ billing }),
  setUserId: (userId) => set({ userId }),
  setAgreedToTerms: (agreedToTerms) => set({ agreedToTerms }),
  reset: () => set(INITIAL),
}))
