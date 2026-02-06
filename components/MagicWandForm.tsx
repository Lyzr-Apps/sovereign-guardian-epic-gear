'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FiWand2,
  FiCheckCircle,
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp,
  FiEdit3,
  FiSend,
  FiSparkles,
  FiUser,
  FiLock
} from 'react-icons/fi'
import { PrefilledFormData, UserFinancialProfile } from '@/types/advanced-features'

interface MagicWandFormProps {
  formData: PrefilledFormData
  userProfile?: Partial<UserFinancialProfile>
  onSubmit?: (data: Record<string, any>) => void
  onCancel?: () => void
}

export function MagicWandForm({ formData, userProfile, onSubmit, onCancel }: MagicWandFormProps) {
  const [expanded, setExpanded] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [formFields, setFormFields] = useState<Record<string, any>>(formData.formFields)
  const [magicWandActivated, setMagicWandActivated] = useState(false)

  // Determine field status
  const isAutoPopulated = (fieldName: string) => {
    return formData.autoPopulatedFields.includes(fieldName)
  }

  const needsVerification = (fieldName: string) => {
    return formData.userVerificationRequired.includes(fieldName)
  }

  // Handle field editing
  const handleFieldChange = (fieldName: string, value: any) => {
    setFormFields(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  // Handle magic wand activation animation
  const handleMagicWand = () => {
    setMagicWandActivated(true)
    setTimeout(() => setMagicWandActivated(false), 2000)
  }

  // Handle form submission
  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(formFields)
    }
  }

  // Count populated vs total fields
  const totalFields = Object.keys(formData.formFields).length
  const populatedFields = formData.autoPopulatedFields.length
  const verificationNeeded = formData.userVerificationRequired.length
  const completionPercentage = (populatedFields / totalFields) * 100

  return (
    <Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-l-4 border-purple-500 shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <FiWand2
                size={32}
                className={`text-purple-600 ${magicWandActivated ? 'animate-spin' : ''}`}
              />
              {magicWandActivated && (
                <FiSparkles
                  size={20}
                  className="absolute -top-1 -right-1 text-yellow-400 animate-ping"
                />
              )}
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                {formData.schemeName}
                <span className="text-sm font-normal px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                  Auto-Filled
                </span>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {populatedFields} of {totalFields} fields automatically filled using your profile
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
                <p className="text-sm text-gray-600">Form Completion</p>
                <p className="text-2xl font-bold text-purple-700">{completionPercentage.toFixed(0)}%</p>
              </div>
              <button
                onClick={handleMagicWand}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md"
              >
                <FiWand2 size={20} />
                Magic Wand
              </button>
            </div>

            {/* Progress Bar */}
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-1000"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span>{populatedFields} auto-filled</span>
              <span>{verificationNeeded} need verification</span>
            </div>
          </div>

          {/* Magic Wand Info */}
          <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
            <div className="flex items-start gap-3">
              <FiSparkles className="text-purple-600 mt-1 flex-shrink-0" size={20} />
              <div>
                <h4 className="font-semibold text-base mb-2 text-purple-900">How Magic Wand Works</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  We used information you already shared with us to automatically fill {populatedFields} fields.
                  {verificationNeeded > 0 && ` Please verify ${verificationNeeded} highlighted fields before submitting.`}
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields Display */}
          <div className="bg-white bg-opacity-70 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-lg">Application Form</h4>
              <button
                onClick={() => setEditMode(!editMode)}
                className="flex items-center gap-2 text-sm text-purple-700 hover:text-purple-900"
              >
                <FiEdit3 size={16} />
                {editMode ? 'View Mode' : 'Edit Mode'}
              </button>
            </div>

            <div className="space-y-4">
              {Object.entries(formFields).map(([fieldName, fieldValue]) => {
                const autoFilled = isAutoPopulated(fieldName)
                const needsCheck = needsVerification(fieldName)

                return (
                  <div
                    key={fieldName}
                    className={`p-4 rounded-lg border-2 ${
                      needsCheck
                        ? 'border-amber-300 bg-amber-50'
                        : autoFilled
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <label className="font-medium text-sm text-gray-700 capitalize">
                          {fieldName.replace(/_/g, ' ')}
                        </label>
                        {autoFilled && !needsCheck && (
                          <div className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                            <FiCheckCircle size={12} />
                            Auto-filled
                          </div>
                        )}
                        {needsCheck && (
                          <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                            <FiAlertCircle size={12} />
                            Verify
                          </div>
                        )}
                      </div>
                      {autoFilled && (
                        <FiSparkles className="text-purple-500" size={16} />
                      )}
                    </div>

                    {editMode ? (
                      <Input
                        value={fieldValue || ''}
                        onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                        className={`w-full ${
                          needsCheck ? 'border-amber-400 focus:ring-amber-500' : ''
                        }`}
                      />
                    ) : (
                      <p className="text-base text-gray-800 font-medium">
                        {fieldValue || <span className="text-gray-400 italic">Not provided</span>}
                      </p>
                    )}

                    {needsCheck && (
                      <p className="text-xs text-amber-700 mt-2 flex items-center gap-1">
                        <FiAlertCircle size={12} />
                        Please verify this information is correct
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Auto-Populated Fields Summary */}
          {formData.autoPopulatedFields.length > 0 && (
            <div className="bg-white bg-opacity-70 p-4 rounded-lg">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between text-left"
              >
                <h4 className="font-semibold text-base flex items-center gap-2">
                  <FiUser className="text-purple-600" size={18} />
                  Auto-Populated Fields ({formData.autoPopulatedFields.length})
                </h4>
                {showDetails ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
              </button>

              {showDetails && (
                <div className="mt-3 space-y-2">
                  {formData.autoPopulatedFields.map((field, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm text-gray-700 bg-green-50 p-2 rounded"
                    >
                      <FiCheckCircle className="text-green-600 flex-shrink-0" size={14} />
                      <span className="capitalize">{field.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Required Documents */}
          {formData.documentPaths.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
              <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                <FiLock className="text-blue-600" size={18} />
                Documents Ready to Upload
              </h4>
              <div className="space-y-2">
                {formData.documentPaths.map((docPath, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-sm text-gray-700 bg-white p-3 rounded border border-blue-200"
                  >
                    <FiCheckCircle className="text-blue-600 flex-shrink-0" size={16} />
                    <span className="flex-1">{docPath}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification Warning */}
          {verificationNeeded > 0 && (
            <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
              <div className="flex items-start gap-3">
                <FiAlertCircle className="text-amber-600 mt-1 flex-shrink-0" size={20} />
                <div>
                  <h4 className="font-semibold text-base mb-2 text-amber-900">
                    Verification Required
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    Please verify the following fields before submitting:
                  </p>
                  <ul className="space-y-1">
                    {formData.userVerificationRequired.map((field, idx) => (
                      <li key={idx} className="text-sm text-amber-800 flex items-center gap-2">
                        <FiAlertCircle size={12} />
                        <span className="capitalize">{field.replace(/_/g, ' ')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-lg py-6 flex items-center justify-center gap-2"
            >
              <FiSend size={20} />
              Submit Application
            </Button>
            {onCancel && (
              <Button
                onClick={onCancel}
                variant="outline"
                className="text-lg py-6 px-6"
              >
                Cancel
              </Button>
            )}
          </div>

          {/* Privacy Notice */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 text-center flex items-center justify-center gap-2">
              <FiLock size={12} />
              Your data is encrypted and used only for this application
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
