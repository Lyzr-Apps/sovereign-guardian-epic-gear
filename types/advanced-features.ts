// Advanced Financial Guardian Types

export interface UserFinancialProfile {
  userId: string
  financialGoals: FinancialGoal[]
  location: string
  income: number
  occupation: string
  caste?: string
  languagePreference: string
  bankBalance: number
  recurringBills: RecurringBill[]
}

export interface FinancialGoal {
  id: string
  name: string
  target: number
  current: number
  deadline: Date
  priority: 'high' | 'medium' | 'low'
  icon: string
}

export interface RecurringBill {
  id: string
  name: string
  amount: number
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  nextDueDate: Date
  lastUsedDate?: Date
  isVampire: boolean
  category: string
}

export interface ShadowBalance {
  bankBalance: number
  predictedBills14Days: number
  realBalance: number
  vampireBills: RecurringBill[]
  safeToSpend: number
  riskLevel: 'safe' | 'caution' | 'danger'
}

export interface BenefitClaimStatus {
  schemeId: string
  schemeName: string
  status: 'not_started' | 'document_collection' | 'form_filled' | 'submitted' | 'approved' | 'rejected'
  appliedDate?: Date
  expectedCompletionDays: number
  currentStep: number
  totalSteps: number
  nextAction: string
  documentsRequired: string[]
  documentsCollected: string[]
}

export interface EARCalculation {
  loanAmount: number
  statedRate: number
  statedPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly'
  processingFee: number
  otherCharges: number
  totalCost: number
  effectiveAnnualRate: number
  isAboveLimit: boolean
  rbiLimit: number
  breakdown: {
    principal: number
    interest: number
    fees: number
    total: number
  }
}

export interface UIMetadata {
  theme: 'URGENT' | 'OPPORTUNITY' | 'SAFE' | 'INFO'
  actionId?: 'INITIATE_CLAIM' | 'BLOCK_SENDER' | 'CANCEL_SUBSCRIPTION' | 'FILL_FORM'
  animationType?: 'pulse' | 'glow' | 'shake' | 'bounce'
  soundEffect?: 'alert' | 'success' | 'warning'
}

export interface EnhancedAgentResponse {
  status: 'success' | 'error'
  result: any
  metadata: {
    agent_name: string
    timestamp: string
    ui_metadata?: UIMetadata
    user_profile?: Partial<UserFinancialProfile>
  }
}

export interface VigilanteShieldAlert {
  id: string
  detectedAt: Date
  source: 'sms' | 'email' | 'call' | 'notification'
  content: string
  threatLevel: 'high' | 'medium' | 'low'
  threatType: 'phishing' | 'predatory_loan' | 'data_harvesting' | 'urgent_scam'
  autoBlocked: boolean
  userNotified: boolean
}

export interface SimplifiedJargon {
  original: string
  simplified: string
  example?: string
}

// Common financial jargon simplifications
export const JARGON_MAP: SimplifiedJargon[] = [
  {
    original: 'Compound Interest',
    simplified: 'Money that grows on itself',
    example: 'Like a tree that drops seeds to grow more trees'
  },
  {
    original: 'Liquidity Risk',
    simplified: 'Not having cash when you need it',
    example: 'Your money is locked up when an emergency happens'
  },
  {
    original: 'Effective Annual Rate',
    simplified: 'True yearly cost of borrowing',
    example: 'The real amount you pay per year including all hidden fees'
  },
  {
    original: 'Processing Fee',
    simplified: 'Hidden cost they charge to start your loan',
    example: 'Extra money you pay before getting the loan'
  },
  {
    original: 'Principal Amount',
    simplified: 'The money you actually borrow',
    example: 'If you borrow 10,000, that is your principal'
  },
  {
    original: 'Default',
    simplified: 'Missing a payment',
    example: 'When you cannot pay on time'
  },
  {
    original: 'Collateral',
    simplified: 'Something valuable you give as security',
    example: 'Like giving your gold to get a loan'
  },
  {
    original: 'Subsidy',
    simplified: 'Free money from government',
    example: 'Government pays part of your cost'
  },
  {
    original: 'Eligibility Criteria',
    simplified: 'Rules to qualify for benefit',
    example: 'What you need to get government help'
  }
]

export interface PrefilledFormData {
  schemeId: string
  schemeName: string
  formFields: Record<string, any>
  documentPaths: string[]
  autoPopulatedFields: string[]
  userVerificationRequired: string[]
}
