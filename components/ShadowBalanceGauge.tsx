'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiDollarSign,
  FiTrendingDown,
  FiX,
  FiCalendar,
  FiZap
} from 'react-icons/fi'
import { ShadowBalance, RecurringBill } from '@/types/advanced-features'

interface ShadowBalanceGaugeProps {
  shadowBalance: ShadowBalance
  onCancelBill?: (billId: string) => void
}

export function ShadowBalanceGauge({ shadowBalance, onCancelBill }: ShadowBalanceGaugeProps) {
  const [expandedVampire, setExpandedVampire] = useState(false)

  const safePercentage = Math.min(
    100,
    Math.max(0, (shadowBalance.safeToSpend / shadowBalance.bankBalance) * 100)
  )

  const riskColors = {
    safe: {
      bg: 'bg-green-200',
      border: 'border-black',
      text: 'text-black',
      gauge: 'bg-green-500',
      icon: <FiCheckCircle size={24} className="text-black" />
    },
    caution: {
      bg: 'bg-amber-200',
      border: 'border-black',
      text: 'text-black',
      gauge: 'bg-amber-500',
      icon: <FiAlertTriangle size={24} className="text-black" />
    },
    danger: {
      bg: 'bg-red-200',
      border: 'border-black',
      text: 'text-black',
      gauge: 'bg-red-500',
      icon: <FiAlertTriangle size={24} className="text-black" />
    }
  }

  const currentRisk = riskColors[shadowBalance.riskLevel]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getNextDueDate = (bill: RecurringBill) => {
    const days = Math.ceil((new Date(bill.nextDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  const getDaysSinceLastUse = (bill: RecurringBill) => {
    if (!bill.lastUsedDate) return 'Never used'
    const days = Math.ceil((new Date().getTime() - new Date(bill.lastUsedDate).getTime()) / (1000 * 60 * 60 * 24))
    return `${days} days ago`
  }

  return (
    <Card className={`${currentRisk.bg}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiDollarSign size={32} className="text-black" />
            <div>
              <CardTitle className="text-2xl font-bold text-black">Shadow Balance</CardTitle>
              <p className="text-sm font-bold text-black mt-1">Your real spending power</p>
            </div>
          </div>
          {currentRisk.icon}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Balance Comparison Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 border-4 border-black">
            <p className="text-sm font-bold text-black mb-1">Bank Balance</p>
            <p className="text-2xl font-bold text-black">{formatCurrency(shadowBalance.bankBalance)}</p>
          </div>
          <div className="bg-white p-4 border-4 border-black">
            <p className="text-sm font-bold text-black mb-1">Predicted Bills (14 days)</p>
            <p className="text-2xl font-bold text-red-600">-{formatCurrency(shadowBalance.predictedBills14Days)}</p>
          </div>
        </div>

        {/* Safe to Spend Gauge */}
        <div className="bg-white p-6 border-4 border-black">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-black">Safe to Spend</p>
              <p className="text-4xl font-bold text-black mt-1">{formatCurrency(shadowBalance.realBalance)}</p>
            </div>
            <div className="px-4 py-2 font-bold text-black bg-white border-2 border-black">
              {shadowBalance.riskLevel.toUpperCase()}
            </div>
          </div>

          {/* Visual Gauge */}
          <div className="relative h-12 bg-gray-200 border-2 border-black overflow-hidden mt-4">
            <div
              className={`absolute h-full ${currentRisk.gauge} transition-all duration-1000 flex items-center justify-end px-4`}
              style={{ width: `${safePercentage}%` }}
            >
              {safePercentage > 20 && (
                <span className="text-white text-sm font-bold">
                  {safePercentage.toFixed(0)}% Available
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-between mt-2 text-xs font-bold text-black">
            <span>0</span>
            <span>Bank Balance: {formatCurrency(shadowBalance.bankBalance)}</span>
          </div>
        </div>

        {/* Risk Level Explanation */}
        <div className="p-4 border-4 border-black bg-white">
          <h4 className="font-bold text-lg mb-2 flex items-center gap-2 text-black">
            {currentRisk.icon}
            {shadowBalance.riskLevel === 'safe' && 'You have enough for upcoming bills'}
            {shadowBalance.riskLevel === 'caution' && 'Watch your spending - bills coming soon'}
            {shadowBalance.riskLevel === 'danger' && 'Warning: Predicted bills exceed balance'}
          </h4>
          <p className="text-base leading-relaxed font-medium text-black">
            {shadowBalance.riskLevel === 'safe' &&
              'Your real balance is healthy. You can spend safely after accounting for upcoming bills.'}
            {shadowBalance.riskLevel === 'caution' &&
              'Your balance is tight. Avoid large expenses until bills are paid.'}
            {shadowBalance.riskLevel === 'danger' &&
              'You may not have enough to cover upcoming bills. Cancel unused subscriptions or add funds.'}
          </p>
        </div>

        {/* Vampire Bills Section */}
        {shadowBalance.vampireBills.length > 0 && (
          <div className="bg-red-200 p-4 border-4 border-black">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FiZap size={24} className="text-black" />
                <h4 className="font-bold text-lg text-black">
                  Vampire Bills Detected ({shadowBalance.vampireBills.length})
                </h4>
              </div>
              <button
                onClick={() => setExpandedVampire(!expandedVampire)}
                className="text-black hover:scale-110 transition-transform font-bold text-sm"
              >
                {expandedVampire ? 'Hide' : 'Show All'}
              </button>
            </div>

            <p className="text-sm font-medium text-black mb-4">
              You have subscriptions you haven't used in 30+ days. Cancel them to save money!
            </p>

            {expandedVampire && (
              <div className="space-y-3">
                {shadowBalance.vampireBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="bg-white p-4 border-4 border-black"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h5 className="font-bold text-base text-black">{bill.name}</h5>
                        <p className="text-sm font-medium text-black mt-1">{bill.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-red-600">{formatCurrency(bill.amount)}</p>
                        <p className="text-xs font-bold text-black">
                          {bill.frequency === 'monthly' && 'per month'}
                          {bill.frequency === 'yearly' && 'per year'}
                          {bill.frequency === 'weekly' && 'per week'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm font-medium text-black mb-3">
                      <div className="flex items-center gap-1">
                        <FiCalendar size={14} />
                        <span>Due in {getNextDueDate(bill)} days</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiTrendingDown size={14} />
                        <span>Last used: {getDaysSinceLastUse(bill)}</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => onCancelBill && onCancelBill(bill.id)}
                      className="w-full bg-red-500 hover:bg-red-400 text-white flex items-center justify-center gap-2 font-bold"
                    >
                      <FiX size={18} />
                      Cancel This Subscription
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {!expandedVampire && (
              <div className="bg-white p-3 border-2 border-black">
                <p className="text-sm font-medium text-black">
                  <span className="font-bold text-black">
                    Total wasted per month:{' '}
                    {formatCurrency(
                      shadowBalance.vampireBills.reduce((sum, bill) => {
                        const monthlyAmount =
                          bill.frequency === 'monthly'
                            ? bill.amount
                            : bill.frequency === 'yearly'
                            ? bill.amount / 12
                            : bill.frequency === 'weekly'
                            ? bill.amount * 4
                            : bill.amount * 30
                        return sum + monthlyAmount
                      }, 0)
                    )}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
