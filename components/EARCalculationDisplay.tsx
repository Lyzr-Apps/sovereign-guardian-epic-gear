'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FiAlertTriangle, FiCheckCircle, FiTrendingUp } from 'react-icons/fi'
import { EARCalculation } from '@/types/advanced-features'

interface EARCalculationDisplayProps {
  calculation: EARCalculation
}

export function EARCalculationDisplay({ calculation }: EARCalculationDisplayProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (rate: number) => {
    return `${rate.toFixed(2)}%`
  }

  // Calculate periodic rate for formula display
  const periodicRate = calculation.statedRate
  const periodsPerYear =
    calculation.statedPeriod === 'daily' ? 365 :
    calculation.statedPeriod === 'weekly' ? 52 :
    calculation.statedPeriod === 'monthly' ? 12 : 1

  // EAR formula: (1 + i/n)^n - 1
  const earFormulaStep1 = 1 + (periodicRate / 100)
  const earFormulaStep2 = Math.pow(earFormulaStep1, periodsPerYear)
  const earFormulaStep3 = earFormulaStep2 - 1
  const earPercentage = earFormulaStep3 * 100

  // Risk color based on compliance
  const riskColor = calculation.isAboveLimit ? 'red' : 'green'
  const riskBg = calculation.isAboveLimit ? 'bg-red-200' : 'bg-green-200'
  const riskBorder = calculation.isAboveLimit ? 'border-red-500' : 'border-green-500'

  return (
    <Card className={`${riskBg}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          {calculation.isAboveLimit ? (
            <FiAlertTriangle size={32} className="text-black" />
          ) : (
            <FiCheckCircle size={32} className="text-black" />
          )}
          <div>
            <CardTitle className="text-2xl font-bold text-black">
              Effective Annual Rate (EAR) Calculation
            </CardTitle>
            <p className="text-sm font-bold text-black mt-1">
              {calculation.isAboveLimit
                ? `DANGER: Rate exceeds RBI limit of ${calculation.rbiLimit}%`
                : `SAFE: Within RBI limit of ${calculation.rbiLimit}%`
              }
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Mathematical Formula Display */}
        <div className="bg-white p-6 border-4 border-black">
          <h4 className="font-bold text-lg mb-4 text-center text-black">
            The Real Cost Formula (Simplified)
          </h4>

          <div className="space-y-4">
            {/* Step 1: What they tell you */}
            <div className="bg-blue-200 p-4 border-4 border-black">
              <p className="text-sm font-bold text-black mb-2">Step 1: What they tell you</p>
              <p className="text-lg text-black">
                <span className="font-bold">{formatPercentage(calculation.statedRate)}</span> per {calculation.statedPeriod}
              </p>
              <p className="text-sm font-medium text-black mt-1">
                This is the rate they advertise, but it's not the full picture
              </p>
            </div>

            {/* Step 2: Formula breakdown */}
            <div className="bg-purple-200 p-4 border-4 border-black">
              <p className="text-sm font-bold text-black mb-3">Step 2: Convert to yearly rate</p>
              <div className="font-mono text-base text-black space-y-2">
                <p>EAR = (1 + rate/100)<sup>{periodsPerYear}</sup> - 1</p>
                <p className="text-sm font-medium text-black">Where rate = {formatPercentage(calculation.statedRate)} and periods = {periodsPerYear} per year</p>
              </div>
            </div>

            {/* Step 3: Calculate */}
            <div className="bg-amber-200 p-4 border-4 border-black">
              <p className="text-sm font-bold text-black mb-3">Step 3: Do the math</p>
              <div className="space-y-2 text-base text-black">
                <p>= (1 + {(periodicRate / 100).toFixed(4)})<sup>{periodsPerYear}</sup> - 1</p>
                <p>= {earFormulaStep1.toFixed(4)}<sup>{periodsPerYear}</sup> - 1</p>
                <p>= {earFormulaStep2.toFixed(4)} - 1</p>
                <p className="font-bold text-xl text-red-600">= {formatPercentage(earPercentage)} per year</p>
              </div>
            </div>

            {/* Step 4: Add hidden fees */}
            <div className={`${calculation.processingFee > 0 || calculation.otherCharges > 0 ? 'bg-red-200' : 'bg-green-200'} p-4 border-4 border-black`}>
              <p className="text-sm font-bold text-black mb-3">Step 4: Add hidden charges</p>
              <div className="space-y-2">
                {calculation.processingFee > 0 && (
                  <div className="flex justify-between">
                    <span className="font-medium text-black">Processing Fee:</span>
                    <span className="font-bold text-red-600">+{formatCurrency(calculation.processingFee)}</span>
                  </div>
                )}
                {calculation.otherCharges > 0 && (
                  <div className="flex justify-between">
                    <span className="font-medium text-black">Other Charges:</span>
                    <span className="font-bold text-red-600">+{formatCurrency(calculation.otherCharges)}</span>
                  </div>
                )}
                <div className="border-t-4 border-black pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-black">True Annual Rate:</span>
                    <span className="font-bold text-2xl text-red-600">{formatPercentage(calculation.effectiveAnnualRate)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Breakdown Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 border-4 border-black">
            <p className="text-sm font-bold text-black mb-1">Loan Amount (Principal)</p>
            <p className="text-2xl font-bold text-black">{formatCurrency(calculation.breakdown.principal)}</p>
          </div>
          <div className="bg-white p-4 border-4 border-black">
            <p className="text-sm font-bold text-black mb-1">Interest You Pay</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(calculation.breakdown.interest)}</p>
          </div>
          <div className="bg-white p-4 border-4 border-black">
            <p className="text-sm font-bold text-black mb-1">All Fees</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(calculation.breakdown.fees)}</p>
          </div>
          <div className="bg-white p-4 border-4 border-black">
            <p className="text-sm font-bold text-black mb-1">Total You Repay</p>
            <p className="text-2xl font-bold text-red-700">{formatCurrency(calculation.breakdown.total)}</p>
          </div>
        </div>

        {/* Visual Progress Bar - How Much Goes to Fees */}
        <div className="bg-white p-6 border-4 border-black">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-black">Cost Breakdown</p>
            <FiTrendingUp className="text-black" size={20} />
          </div>

          <div className="relative h-12 bg-gray-200 border-2 border-black overflow-hidden">
            {/* Principal */}
            <div
              className="absolute h-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold"
              style={{ width: `${(calculation.breakdown.principal / calculation.breakdown.total) * 100}%`, left: 0 }}
            >
              {((calculation.breakdown.principal / calculation.breakdown.total) * 100).toFixed(0)}% Principal
            </div>
            {/* Interest */}
            <div
              className="absolute h-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold"
              style={{
                width: `${(calculation.breakdown.interest / calculation.breakdown.total) * 100}%`,
                left: `${(calculation.breakdown.principal / calculation.breakdown.total) * 100}%`
              }}
            >
              {((calculation.breakdown.interest / calculation.breakdown.total) * 100).toFixed(0)}% Interest
            </div>
            {/* Fees */}
            <div
              className="absolute h-full bg-red-600 flex items-center justify-center text-white text-sm font-bold"
              style={{
                width: `${(calculation.breakdown.fees / calculation.breakdown.total) * 100}%`,
                left: `${((calculation.breakdown.principal + calculation.breakdown.interest) / calculation.breakdown.total) * 100}%`
              }}
            >
              {((calculation.breakdown.fees / calculation.breakdown.total) * 100).toFixed(0)}% Fees
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm font-medium text-black">
              For every {formatCurrency(100)} you borrow, you pay back{' '}
              <span className="font-bold text-red-600">
                {formatCurrency((calculation.breakdown.total / calculation.breakdown.principal) * 100)}
              </span>
            </p>
          </div>
        </div>

        {/* Simplified Explanation */}
        <div className={`p-4 border-4 border-black ${calculation.isAboveLimit ? 'bg-red-200' : 'bg-green-200'}`}>
          <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
            {calculation.isAboveLimit ? (
              <>
                <FiAlertTriangle className="text-black" />
                <span className="text-black">What this means for you</span>
              </>
            ) : (
              <>
                <FiCheckCircle className="text-black" />
                <span className="text-black">What this means for you</span>
              </>
            )}
          </h4>
          <p className="text-base leading-relaxed font-medium text-black">
            {calculation.isAboveLimit ? (
              <>
                <span className="font-bold">This loan is dangerous.</span> The true yearly cost is{' '}
                <span className="font-bold text-red-600">{formatPercentage(calculation.effectiveAnnualRate)}</span>, which is{' '}
                <span className="font-bold">{formatPercentage(calculation.effectiveAnnualRate - calculation.rbiLimit)}</span> above
                the legal limit. This is a predatory loan. Do not accept it.
              </>
            ) : (
              <>
                <span className="font-bold">This loan follows the rules.</span> The true yearly cost is{' '}
                <span className="font-bold text-green-600">{formatPercentage(calculation.effectiveAnnualRate)}</span>, which is
                within the RBI limit of {formatPercentage(calculation.rbiLimit)}. However, still compare with other options.
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
