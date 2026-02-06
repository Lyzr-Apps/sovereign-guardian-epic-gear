'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FiCheckCircle,
  FiCircle,
  FiClock,
  FiFileText,
  FiSend,
  FiAward,
  FiChevronDown,
  FiChevronUp,
  FiAlertCircle
} from 'react-icons/fi'
import { BenefitClaimStatus } from '@/types/advanced-features'

interface BenefitTrackerStepperProps {
  claimStatus: BenefitClaimStatus
  onActionClick?: (action: string) => void
}

export function BenefitTrackerStepper({ claimStatus, onActionClick }: BenefitTrackerStepperProps) {
  const [expanded, setExpanded] = useState(true)
  const [showDocuments, setShowDocuments] = useState(false)

  // Define steps with icons and descriptions
  const steps = [
    {
      id: 'not_started',
      label: 'Getting Ready',
      icon: FiCircle,
      description: 'Review requirements and prepare'
    },
    {
      id: 'document_collection',
      label: 'Collect Documents',
      icon: FiFileText,
      description: 'Gather all required paperwork'
    },
    {
      id: 'form_filled',
      label: 'Fill Application',
      icon: FiSend,
      description: 'Complete application form'
    },
    {
      id: 'submitted',
      label: 'Submitted',
      icon: FiClock,
      description: 'Application under review'
    },
    {
      id: 'approved',
      label: 'Approved',
      icon: FiAward,
      description: 'Benefit approved and active'
    }
  ]

  // Handle rejected status separately
  const isRejected = claimStatus.status === 'rejected'

  // Find current step index
  const currentStepIndex = steps.findIndex(step => step.id === claimStatus.status)

  // Calculate progress percentage
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100

  // Determine overall status color
  const getStatusColor = () => {
    if (isRejected) return { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700', progress: 'from-red-400 to-red-600' }
    if (claimStatus.status === 'approved') return { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', progress: 'from-green-400 to-green-600' }
    if (claimStatus.status === 'submitted') return { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700', progress: 'from-blue-400 to-blue-600' }
    return { bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-700', progress: 'from-amber-400 to-amber-600' }
  }

  const statusColor = getStatusColor()

  // Check if step is completed
  const isStepCompleted = (stepIndex: number) => {
    if (isRejected) return stepIndex < currentStepIndex
    return stepIndex < currentStepIndex
  }

  // Check if step is current
  const isStepCurrent = (stepIndex: number) => {
    return stepIndex === currentStepIndex && !isRejected
  }

  // Format date
  const formatDate = (date?: Date) => {
    if (!date) return 'Not started'
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <Card className={`${statusColor.bg} border-l-4 ${statusColor.border} shadow-lg`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <FiAward size={32} className={statusColor.text} />
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold">{claimStatus.schemeName}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {isRejected ? 'Application Rejected' :
                 claimStatus.status === 'approved' ? 'Benefit Approved!' :
                 claimStatus.status === 'submitted' ? 'Under Review' :
                 'Application In Progress'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-600 hover:text-gray-800"
          >
            {expanded ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
          </button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-6">
          {/* Progress Overview */}
          <div className="bg-white bg-opacity-70 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-600">Current Step</p>
                <p className="text-lg font-bold text-gray-800">
                  {isRejected ? 'Rejected' : `${claimStatus.currentStep} of ${claimStatus.totalSteps}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Expected Completion</p>
                <p className="text-lg font-bold text-gray-800">
                  {isRejected ? 'N/A' : `${claimStatus.expectedCompletionDays} days`}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`absolute h-full bg-gradient-to-r ${statusColor.progress} transition-all duration-1000`}
                style={{ width: `${isRejected ? 0 : progressPercentage}%` }}
              />
            </div>

            {claimStatus.appliedDate && (
              <p className="text-xs text-gray-500 mt-2">
                Applied on: {formatDate(claimStatus.appliedDate)}
              </p>
            )}
          </div>

          {/* Step Tracker */}
          <div className="bg-white bg-opacity-70 p-6 rounded-lg">
            <h4 className="font-semibold text-lg mb-4">Application Progress</h4>

            <div className="space-y-6">
              {steps.map((step, index) => {
                const StepIcon = step.icon
                const completed = isStepCompleted(index)
                const current = isStepCurrent(index)

                return (
                  <div key={step.id} className="flex items-start gap-4">
                    {/* Icon with connector line */}
                    <div className="flex flex-col items-center">
                      <div className={`rounded-full p-2 ${
                        completed ? 'bg-green-500' :
                        current ? 'bg-amber-500 animate-pulse' :
                        'bg-gray-300'
                      }`}>
                        {completed ? (
                          <FiCheckCircle size={24} className="text-white" />
                        ) : (
                          <StepIcon size={24} className="text-white" />
                        )}
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`w-0.5 h-12 ${
                          completed ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                      )}
                    </div>

                    {/* Step content */}
                    <div className="flex-1 pb-4">
                      <h5 className={`font-semibold text-base ${
                        current ? 'text-amber-700' :
                        completed ? 'text-green-700' :
                        'text-gray-500'
                      }`}>
                        {step.label}
                      </h5>
                      <p className="text-sm text-gray-600 mt-1">{step.description}</p>

                      {/* Show current step indicator */}
                      {current && (
                        <div className="mt-2 flex items-center gap-2 text-amber-600">
                          <FiAlertCircle size={16} />
                          <span className="text-sm font-semibold">Current Step</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Next Action Card */}
          {!isRejected && claimStatus.status !== 'approved' && (
            <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
              <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <FiAlertCircle className="text-amber-600" size={20} />
                Next Action Required
              </h4>
              <p className="text-base text-gray-800 leading-relaxed mb-4">
                {claimStatus.nextAction}
              </p>

              {claimStatus.status === 'document_collection' && (
                <Button
                  onClick={() => setShowDocuments(!showDocuments)}
                  variant="outline"
                  className="w-full text-base"
                >
                  {showDocuments ? 'Hide' : 'Show'} Document Checklist
                </Button>
              )}
            </div>
          )}

          {/* Document Checklist */}
          {showDocuments && claimStatus.status === 'document_collection' && (
            <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <FiFileText className="text-blue-600" size={20} />
                Document Checklist
              </h4>

              <div className="space-y-2">
                {claimStatus.documentsRequired.map((doc, idx) => {
                  const isCollected = claimStatus.documentsCollected.includes(doc)
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        isCollected ? 'bg-green-50' : 'bg-gray-50'
                      }`}
                    >
                      {isCollected ? (
                        <FiCheckCircle className="text-green-600 flex-shrink-0" size={20} />
                      ) : (
                        <FiCircle className="text-gray-400 flex-shrink-0" size={20} />
                      )}
                      <span className={`text-base ${
                        isCollected ? 'text-green-700 line-through' : 'text-gray-800'
                      }`}>
                        {doc}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-blue-700">
                    {claimStatus.documentsCollected.length} of {claimStatus.documentsRequired.length} documents collected
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Approved/Rejected Status */}
          {claimStatus.status === 'approved' && (
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-400">
              <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <FiAward className="text-green-600" size={24} />
                <span className="text-green-800">Congratulations!</span>
              </h4>
              <p className="text-base leading-relaxed text-gray-800">
                Your application has been approved. The benefit will be credited to your account within 7-14 working days.
              </p>
            </div>
          )}

          {isRejected && (
            <div className="bg-red-50 p-4 rounded-lg border-2 border-red-400">
              <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <FiAlertCircle className="text-red-600" size={24} />
                <span className="text-red-800">Application Rejected</span>
              </h4>
              <p className="text-base leading-relaxed text-gray-800 mb-3">
                Unfortunately, your application was not approved. Common reasons include incomplete documents or eligibility criteria not met.
              </p>
              <Button
                onClick={() => onActionClick && onActionClick('reapply')}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full"
              >
                Apply for Different Scheme
              </Button>
            </div>
          )}

          {/* Action Buttons for Active Applications */}
          {!isRejected && claimStatus.status !== 'approved' && claimStatus.status !== 'submitted' && (
            <div className="flex gap-3">
              <Button
                onClick={() => onActionClick && onActionClick('continue')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-base py-6"
              >
                Continue Application
              </Button>
              <Button
                onClick={() => onActionClick && onActionClick('help')}
                variant="outline"
                className="text-base py-6"
              >
                Get Help
              </Button>
            </div>
          )}

          {claimStatus.status === 'submitted' && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-base text-gray-700 text-center">
                Your application is under review. You will be notified once a decision is made.
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
