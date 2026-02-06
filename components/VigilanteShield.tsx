'use client'

import { useState, useEffect } from 'react'
import { FiShield, FiAlertTriangle, FiX, FiCheck } from 'react-icons/fi'

interface VigilanteShieldProps {
  isActive: boolean
  threatsDetected: number
  onToggle: () => void
  recentThreats?: Array<{
    id: string
    source: string
    message: string
    detectedAt: Date
  }>
}

export function VigilanteShield({
  isActive,
  threatsDetected,
  onToggle,
  recentThreats = []
}: VigilanteShieldProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [pulse, setPulse] = useState(false)

  // Pulse animation when new threat detected
  useEffect(() => {
    if (threatsDetected > 0) {
      setPulse(true)
      const timeout = setTimeout(() => setPulse(false), 2000)
      return () => clearTimeout(timeout)
    }
  }, [threatsDetected])

  return (
    <>
      {/* Floating Shield Button - Top Right Corner */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl transition-all ${
          isActive
            ? threatsDetected > 0
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-gray-400 text-white hover:bg-gray-500'
        } ${pulse ? 'animate-pulse scale-110' : ''}`}
        title={isActive ? 'Vigilante Shield Active' : 'Vigilante Shield Inactive'}
      >
        <FiShield size={24} />
        {threatsDetected > 0 && (
          <span className="flex items-center justify-center w-6 h-6 bg-white text-red-600 rounded-full text-xs font-bold">
            {threatsDetected}
          </span>
        )}
      </button>

      {/* Details Panel */}
      {showDetails && (
        <div className="fixed top-20 right-4 z-50 w-96 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden">
          <div className={`p-4 ${
            isActive
              ? threatsDetected > 0
                ? 'bg-red-50 border-b-2 border-red-200'
                : 'bg-green-50 border-b-2 border-green-200'
              : 'bg-gray-50 border-b-2 border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <FiShield size={28} className={
                  isActive
                    ? threatsDetected > 0 ? 'text-red-600' : 'text-green-600'
                    : 'text-gray-400'
                } />
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Vigilante Shield</h3>
                  <p className="text-xs text-gray-600">
                    {isActive ? 'Actively Monitoring' : 'Inactive'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center justify-between bg-white bg-opacity-70 p-3 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Background Monitoring</span>
              <button
                onClick={onToggle}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  isActive ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    isActive ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Stats Section */}
          <div className="p-4 bg-white">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Threats Blocked</p>
                <p className={`text-2xl font-bold ${
                  threatsDetected > 0 ? 'text-red-600' : 'text-gray-800'
                }`}>
                  {threatsDetected}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Status</p>
                <p className={`text-sm font-bold ${
                  isActive ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {isActive ? 'Protected' : 'Offline'}
                </p>
              </div>
            </div>

            {/* What Shield Monitors */}
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">What We Monitor</h4>
              <ul className="space-y-2 text-xs text-gray-700">
                <li className="flex items-start gap-2">
                  <FiCheck className="text-blue-600 mt-0.5 flex-shrink-0" size={14} />
                  <span>SMS messages for phishing links</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiCheck className="text-blue-600 mt-0.5 flex-shrink-0" size={14} />
                  <span>Predatory loan app notifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiCheck className="text-blue-600 mt-0.5 flex-shrink-0" size={14} />
                  <span>Urgent payment scam alerts</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiCheck className="text-blue-600 mt-0.5 flex-shrink-0" size={14} />
                  <span>Suspicious contact requests</span>
                </li>
              </ul>
            </div>

            {/* Recent Threats */}
            {recentThreats.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Recent Threats Blocked</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recentThreats.map((threat) => (
                    <div
                      key={threat.id}
                      className="bg-red-50 p-3 rounded-lg border border-red-200"
                    >
                      <div className="flex items-start gap-2 mb-1">
                        <FiAlertTriangle className="text-red-600 mt-0.5 flex-shrink-0" size={16} />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-red-800">{threat.source}</p>
                          <p className="text-xs text-gray-700 mt-1 line-clamp-2">{threat.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {threat.detectedAt.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Threats Message */}
            {recentThreats.length === 0 && isActive && (
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <FiShield className="mx-auto mb-2 text-green-600" size={32} />
                <p className="text-sm font-semibold text-green-800">All Clear</p>
                <p className="text-xs text-gray-600 mt-1">
                  No threats detected. You're protected.
                </p>
              </div>
            )}

            {/* Inactive State Message */}
            {!isActive && (
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2">
                  <FiAlertTriangle className="text-amber-600 mt-0.5 flex-shrink-0" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 mb-1">
                      Protection Disabled
                    </p>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      Turn on Vigilante Shield to automatically scan SMS messages and notifications for scams.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay when details open */}
      {showDetails && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-40"
          onClick={() => setShowDetails(false)}
        />
      )}
    </>
  )
}
