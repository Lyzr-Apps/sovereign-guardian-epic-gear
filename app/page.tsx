'use client'

import { useState, useRef, useEffect } from 'react'
import { callAIAgent, uploadFiles } from '@/lib/aiAgent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
  FiMic,
  FiPaperclip,
  FiSend,
  FiMenu,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiFilter,
  FiGift,
  FiFileText,
  FiMessageSquare,
  FiAlertOctagon,
  FiCamera,
  FiTrendingUp,
  FiDollarSign,
  FiEye,
  FiEyeOff,
  FiAward
} from 'react-icons/fi'
import { ShadowBalanceGauge } from '@/components/ShadowBalanceGauge'
import { EARCalculationDisplay } from '@/components/EARCalculationDisplay'
import { BenefitTrackerStepper } from '@/components/BenefitTrackerStepper'
import { MagicWandForm } from '@/components/MagicWandForm'
import { ShadowBalance, RecurringBill, UserFinancialProfile, EARCalculation, BenefitClaimStatus, PrefilledFormData } from '@/types/advanced-features'

// Agent IDs
const AGENTS = {
  COORDINATOR: '69857fdbf5dba64760ed7ec0',
  PHISH_DETECTOR: '69857f9a0ee88347863f06f1',
  DOCUMENT_ANALYZER: '69857fadb90162af337b1db1',
  BENEFITS_NAVIGATOR: '69857fc5a051b79c1135a033',
}

// TypeScript interfaces from test responses
interface PhishDetectorResult {
  risk_level: 'Red' | 'Yellow' | 'Green'
  threat_type: string
  indicators_found: string[]
  explanation: string
  recommended_action: string
}

interface DocumentAnalyzerResult {
  stated_interest_rate: string
  effective_interest_rate: string
  hidden_charges: string[]
  compliance_status: string
  risk_level: 'Red' | 'Yellow' | 'Green'
  explanation: string
  rbi_violations: string[]
  recommended_action: string
  ear_calculation?: EARCalculation
}

interface MatchedScheme {
  scheme_name: string
  benefit_amount: string
  eligibility_match: string
  application_difficulty: string
  priority: string
}

interface BenefitsNavigatorResult {
  matched_schemes: MatchedScheme[]
  total_potential_benefits: string
  next_steps: string[]
  required_documents: string[]
  explanation: string
  claim_status?: BenefitClaimStatus  // Optional: Track application progress
  prefilled_form?: PrefilledFormData  // Optional: Auto-filled form data for Magic Wand
}

interface Message {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: Date
  agentResponse?: PhishDetectorResult | DocumentAnalyzerResult | BenefitsNavigatorResult
  responseType?: 'phish' | 'document' | 'benefits' | 'general'
  alertType?: 'SCAM_ALERT' | 'WARNING' | 'SAFE' | 'OPPORTUNITY' | 'INFO'
  severity?: 'RED' | 'YELLOW' | 'GREEN' | 'BLUE'
}

interface HistoryItem {
  id: string
  date: Date
  snippet: string
  verdict: 'safe' | 'caution' | 'danger' | 'benefits'
  responseType?: string
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'mr', name: 'Marathi' },
  { code: 'es', name: 'Spanish' },
]

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyFilter, setHistoryFilter] = useState<'all' | 'scams' | 'benefits'>('all')
  const [uploadingFile, setUploadingFile] = useState(false)
  const [recording, setRecording] = useState(false)
  const [panicMode, setPanicMode] = useState(false)
  const [showRedAlert, setShowRedAlert] = useState(false)
  const [showLoanCalculator, setShowLoanCalculator] = useState(false)
  const [showShadowBalance, setShowShadowBalance] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  // Shadow Balance state - demo data (would come from agent in production)
  const [shadowBalance, setShadowBalance] = useState<ShadowBalance>({
    bankBalance: 15000,
    predictedBills14Days: 8500,
    realBalance: 6500,
    vampireBills: [
      {
        id: '1',
        name: 'Netflix Premium',
        amount: 649,
        frequency: 'monthly',
        nextDueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        lastUsedDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        isVampire: true,
        category: 'Entertainment'
      },
      {
        id: '2',
        name: 'Gym Membership',
        amount: 1500,
        frequency: 'monthly',
        nextDueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        lastUsedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        isVampire: true,
        category: 'Health'
      }
    ],
    safeToSpend: 6500,
    riskLevel: 'caution'
  })

  // Benefit Claim Tracking state - demo data (would come from agent in production)
  const [activeClaims, setActiveClaims] = useState<BenefitClaimStatus[]>([
    {
      schemeId: 'pm-kisan-001',
      schemeName: 'PM-Kisan (Farmer Direct Benefit)',
      status: 'document_collection',
      appliedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      expectedCompletionDays: 45,
      currentStep: 2,
      totalSteps: 5,
      nextAction: 'Collect your land ownership documents (7/12 extract) and Aadhaar card. Upload them in the next step.',
      documentsRequired: [
        'Aadhaar Card',
        'Land Ownership Records (7/12 Extract)',
        'Bank Account Passbook',
        'Passport-size Photo'
      ],
      documentsCollected: [
        'Aadhaar Card',
        'Bank Account Passbook'
      ]
    }
  ])
  const [showBenefitTracker, setShowBenefitTracker] = useState(false)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Vibrate and flash red screen on scam alert
  useEffect(() => {
    if (showRedAlert) {
      // Trigger vibration if supported
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200])
      }
      // Auto-hide after 3 seconds
      const timeout = setTimeout(() => setShowRedAlert(false), 3000)
      return () => clearTimeout(timeout)
    }
  }, [showRedAlert])

  const determineResponseType = (result: any): 'phish' | 'document' | 'benefits' | 'general' => {
    if (result.risk_level && result.threat_type) return 'phish'
    if (result.stated_interest_rate && result.effective_interest_rate) return 'document'
    if (result.matched_schemes) return 'benefits'
    return 'general'
  }

  const handleSendMessage = async (customMessage?: string) => {
    const messageToSend = customMessage || inputMessage
    if (!messageToSend.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setLoading(true)

    try {
      // Call the Guardian Coordinator (Manager agent)
      const response = await callAIAgent(messageToSend, AGENTS.COORDINATOR)

      if (response.success && response.response.result) {
        const result = response.response.result
        const responseType = determineResponseType(result)

        // Parse alert type from response content
        let alertType: Message['alertType'] = 'INFO'
        let severity: Message['severity'] = 'BLUE'

        if (result.alert_type) {
          alertType = result.alert_type
          severity = result.severity
        } else if (result.risk_level === 'Red') {
          alertType = 'SCAM_ALERT'
          severity = 'RED'
        } else if (result.risk_level === 'Yellow') {
          alertType = 'WARNING'
          severity = 'YELLOW'
        } else if (result.risk_level === 'Green') {
          alertType = 'SAFE'
          severity = 'GREEN'
        } else if (responseType === 'benefits') {
          alertType = 'OPPORTUNITY'
          severity = 'GREEN'
        }

        // Trigger red alert screen for scam detection
        if (alertType === 'SCAM_ALERT' && severity === 'RED') {
          setShowRedAlert(true)
        }

        const agentMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'agent',
          content: result.explanation || result.message || 'Response received',
          timestamp: new Date(),
          agentResponse: result,
          responseType,
          alertType,
          severity,
        }

        setMessages(prev => [...prev, agentMessage])

        // Add to history
        const historyItem: HistoryItem = {
          id: agentMessage.id,
          date: new Date(),
          snippet: messageToSend.substring(0, 50) + (messageToSend.length > 50 ? '...' : ''),
          verdict: result.risk_level === 'Red' ? 'danger' :
                   result.risk_level === 'Yellow' ? 'caution' :
                   result.risk_level === 'Green' ? 'safe' :
                   responseType === 'benefits' ? 'benefits' : 'safe',
          responseType,
        }
        setHistory(prev => [historyItem, ...prev])
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'agent',
          content: response.error || 'Sorry, I could not process your request. Please try again.',
          timestamp: new Date(),
          responseType: 'general',
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: 'An error occurred. Please try again.',
        timestamp: new Date(),
        responseType: 'general',
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
      setPanicMode(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (file.size > maxSize) {
      alert('File size must be less than 10MB')
      return
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      alert('Only PDF, JPG, and PNG files are allowed')
      return
    }

    setUploadingFile(true)

    try {
      const uploadResult = await uploadFiles(file)

      if (uploadResult.success && uploadResult.asset_ids.length > 0) {
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: `Uploaded file: ${file.name}`,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, userMessage])

        // Send to Document Analyzer with file
        const response = await callAIAgent(
          `Please analyze this document: ${file.name}`,
          AGENTS.DOCUMENT_ANALYZER,
          { assets: uploadResult.asset_ids }
        )

        if (response.success && response.response.result) {
          const result = response.response.result
          const agentMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'agent',
            content: result.explanation || 'Document analyzed',
            timestamp: new Date(),
            agentResponse: result,
            responseType: 'document',
          }
          setMessages(prev => [...prev, agentMessage])

          // Add to history
          const historyItem: HistoryItem = {
            id: agentMessage.id,
            date: new Date(),
            snippet: `Document: ${file.name}`,
            verdict: result.risk_level === 'Red' ? 'danger' :
                     result.risk_level === 'Yellow' ? 'caution' : 'safe',
            responseType: 'document',
          }
          setHistory(prev => [historyItem, ...prev])
        }
      } else {
        alert('File upload failed. Please try again.')
      }
    } catch (error) {
      alert('Error uploading file')
    } finally {
      setUploadingFile(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'sms':
        setInputMessage('I received an SMS that says: ')
        break
      case 'benefits':
        setInputMessage('I want to know what government benefits I am eligible for. ')
        break
      case 'document':
        fileInputRef.current?.click()
        break
    }
  }

  const handleVoiceRecord = async () => {
    if (!recording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        const chunks: Blob[] = []

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data)
          }
        }

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' })
          stream.getTracks().forEach(track => track.stop())

          // Convert to file and send for analysis
          const audioFile = new File([audioBlob], 'voice-recording.webm', { type: 'audio/webm' })

          // For now, just indicate voice was recorded
          setInputMessage('Voice message recorded - transcription would happen here')
        }

        mediaRecorder.start()
        setRecording(true)
      } catch (error) {
        console.error('Error accessing microphone:', error)
      }
    } else {
      mediaRecorderRef.current?.stop()
      setRecording(false)
    }
  }

  const handlePanicButton = async () => {
    setPanicMode(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' })
        stream.getTracks().forEach(track => track.stop())

        // Emergency report
        await handleSendMessage('EMERGENCY: I am being pressured by someone about a loan or financial matter. This is a panic button report.')
        setPanicMode(false)
      }

      mediaRecorder.start()

      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      }, 10000)
    } catch (error) {
      console.error('Panic button error:', error)
      await handleSendMessage('EMERGENCY: I need help with a suspicious financial situation.')
      setPanicMode(false)
    }
  }

  const handleCameraUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setUploadingFile(true)

    try {
      const uploadResult = await uploadFiles(file)

      if (uploadResult.success && uploadResult.asset_ids.length > 0) {
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: `Screenshot uploaded: ${file.name}`,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, userMessage])

        // Send to Document Analyzer for loan transparency check
        const response = await callAIAgent(
          `Please analyze this loan app screenshot and calculate the true cost with all hidden fees.`,
          AGENTS.DOCUMENT_ANALYZER,
          { assets: uploadResult.asset_ids }
        )

        if (response.success && response.response.result) {
          const result = response.response.result
          const agentMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'agent',
            content: result.explanation || 'Screenshot analyzed',
            timestamp: new Date(),
            agentResponse: result,
            responseType: 'document',
          }
          setMessages(prev => [...prev, agentMessage])
        }
      }
    } catch (error) {
      console.error('Error uploading screenshot')
    } finally {
      setUploadingFile(false)
      if (cameraInputRef.current) {
        cameraInputRef.current.value = ''
      }
    }
  }

  const handleCancelVampireBill = (billId: string) => {
    setShadowBalance(prev => {
      const canceledBill = prev.vampireBills.find(b => b.id === billId)
      const updatedVampireBills = prev.vampireBills.filter(b => b.id !== billId)

      // Recalculate predicted bills
      const billAmount = canceledBill?.amount || 0
      const newPredictedBills = prev.predictedBills14Days - billAmount
      const newRealBalance = prev.bankBalance - newPredictedBills

      // Determine new risk level
      let newRiskLevel: 'safe' | 'caution' | 'danger' = 'safe'
      if (newRealBalance < 0) {
        newRiskLevel = 'danger'
      } else if (newRealBalance < prev.bankBalance * 0.3) {
        newRiskLevel = 'caution'
      }

      return {
        ...prev,
        vampireBills: updatedVampireBills,
        predictedBills14Days: newPredictedBills,
        realBalance: newRealBalance,
        safeToSpend: newRealBalance,
        riskLevel: newRiskLevel
      }
    })
  }

  const filteredHistory = history.filter(item => {
    if (historyFilter === 'all') return true
    if (historyFilter === 'scams') return item.verdict === 'danger' || item.verdict === 'caution'
    if (historyFilter === 'benefits') return item.verdict === 'benefits'
    return true
  })

  return (
    <div className="flex h-screen bg-gradient-to-br from-amber-50 via-cream-50 to-green-50 relative">
      {/* Red Alert Overlay */}
      {showRedAlert && (
        <div className="fixed inset-0 z-[100] bg-red-600 bg-opacity-95 flex items-center justify-center animate-pulse">
          <div className="text-center text-white p-8">
            <FiAlertOctagon size={120} className="mx-auto mb-6 animate-bounce" />
            <h1 className="text-6xl font-bold mb-4">SCAM DETECTED</h1>
            <p className="text-3xl">Do not proceed! This is a trap!</p>
          </div>
        </div>
      )}

      {/* Loan Transparency Calculator Modal */}
      {showLoanCalculator && (
        <div className="fixed inset-0 z-[90] bg-black bg-opacity-50 flex items-center justify-center" onClick={() => setShowLoanCalculator(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FiDollarSign size={32} className="text-purple-600" />
                <h2 className="text-3xl font-bold text-gray-800">Loan Transparency Calculator</h2>
              </div>
              <button onClick={() => setShowLoanCalculator(false)} className="text-gray-500 hover:text-gray-700">
                <FiX size={28} />
              </button>
            </div>

            <p className="text-xl text-gray-600 mb-6">
              Upload a screenshot of a loan app or offer to see the true cost with all hidden fees exposed.
            </p>

            <div className="space-y-4">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 px-6 py-6 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-xl font-semibold"
              >
                <FiCamera size={28} />
                Take Screenshot or Upload Image
              </button>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraUpload}
                className="hidden"
              />

              <div className="bg-purple-50 p-6 rounded-xl border-2 border-purple-200">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <FiTrendingUp className="text-purple-600" />
                  What we analyze:
                </h3>
                <ul className="space-y-2 text-lg text-gray-700">
                  <li>• Stated vs. Effective Interest Rate</li>
                  <li>• Hidden processing fees and charges</li>
                  <li>• Compliance with RBI guidelines</li>
                  <li>• True cost visualization</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panic Button FAB */}
      <button
        onClick={handlePanicButton}
        disabled={panicMode}
        className={`fixed bottom-8 right-8 z-50 w-20 h-20 rounded-full shadow-2xl flex items-center justify-center transition-all ${
          panicMode
            ? 'bg-red-700 animate-pulse scale-110'
            : 'bg-red-600 hover:bg-red-700 hover:scale-110'
        }`}
        title="Panic Button - Report emergency"
      >
        <FiAlertOctagon size={40} className="text-white" />
      </button>

      {panicMode && (
        <div className="fixed bottom-32 right-8 z-50 bg-white p-4 rounded-xl shadow-xl border-2 border-red-600">
          <p className="text-lg font-semibold text-red-600 flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600" />
            Recording emergency report...
          </p>
        </div>
      )}
      {/* History Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">History</h2>
          <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-gray-700">
            <FiX size={24} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setHistoryFilter('all')}
            className={`flex-1 py-3 text-sm font-medium ${
              historyFilter === 'all' ? 'text-green-700 border-b-2 border-green-700' : 'text-gray-500'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setHistoryFilter('scams')}
            className={`flex-1 py-3 text-sm font-medium ${
              historyFilter === 'scams' ? 'text-red-700 border-b-2 border-red-700' : 'text-gray-500'
            }`}
          >
            Scams Blocked
          </button>
          <button
            onClick={() => setHistoryFilter('benefits')}
            className={`flex-1 py-3 text-sm font-medium ${
              historyFilter === 'benefits' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-500'
            }`}
          >
            Benefits Found
          </button>
        </div>

        {/* History Items */}
        <div className="overflow-y-auto h-[calc(100%-140px)]">
          {filteredHistory.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <FiClock size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-lg">No history yet</p>
            </div>
          ) : (
            filteredHistory.map(item => (
              <div key={item.id} className="p-4 border-b hover:bg-gray-50 cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm text-gray-600">
                    {item.date.toLocaleDateString()} {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    item.verdict === 'danger' ? 'bg-red-100 text-red-700' :
                    item.verdict === 'caution' ? 'bg-amber-100 text-amber-700' :
                    item.verdict === 'benefits' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {item.verdict === 'danger' ? 'Scam' :
                     item.verdict === 'caution' ? 'Warning' :
                     item.verdict === 'benefits' ? 'Benefits' : 'Safe'}
                  </span>
                </div>
                <p className="text-sm text-gray-800">{item.snippet}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-md px-6 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-600 hover:text-gray-800"
              >
                <FiMenu size={24} />
              </button>
              <div className="flex items-center gap-3">
                <FiShield size={32} className="text-green-700" />
                <h1 className="text-2xl font-bold text-gray-800">Sovereign Financial Guardian</h1>
              </div>
            </div>

            {/* Language Selector */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <FiShield size={64} className="mx-auto mb-6 text-green-700 opacity-50" />
                <h2 className="text-3xl font-bold text-gray-800 mb-3">Welcome to Your Financial Guardian</h2>
                <p className="text-xl text-gray-600 mb-8">
                  Protecting you from scams and helping you discover benefits
                </p>

                {/* Large Microphone - Dialect First Interface */}
                <div className="mb-8">
                  <button
                    onClick={handleVoiceRecord}
                    className={`mx-auto w-32 h-32 rounded-full shadow-2xl flex items-center justify-center transition-all ${
                      recording
                        ? 'bg-red-600 text-white animate-pulse scale-110'
                        : 'bg-green-600 text-white hover:bg-green-700 hover:scale-110'
                    }`}
                    title="Tap to speak in your language"
                  >
                    <FiMic size={64} />
                  </button>
                  <p className="mt-4 text-xl font-semibold text-gray-700">
                    {recording ? 'Listening...' : 'Tap to speak in your language'}
                  </p>
                </div>

                {/* Quick Action Chips */}
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={() => handleQuickAction('sms')}
                    className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-green-600 text-green-700 rounded-full hover:bg-green-50 transition-colors text-lg font-medium shadow-md"
                  >
                    <FiMessageSquare size={20} />
                    Check SMS
                  </button>
                  <button
                    onClick={() => handleQuickAction('benefits')}
                    className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-blue-600 text-blue-700 rounded-full hover:bg-blue-50 transition-colors text-lg font-medium shadow-md"
                  >
                    <FiGift size={20} />
                    Find Benefits
                  </button>
                  <button
                    onClick={() => setShowLoanCalculator(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-purple-600 text-purple-700 rounded-full hover:bg-purple-50 transition-colors text-lg font-medium shadow-md"
                  >
                    <FiDollarSign size={20} />
                    Loan Calculator
                  </button>
                  <button
                    onClick={() => setShowShadowBalance(!showShadowBalance)}
                    className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-teal-600 text-teal-700 rounded-full hover:bg-teal-50 transition-colors text-lg font-medium shadow-md"
                  >
                    {showShadowBalance ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                    Shadow Balance
                  </button>
                  <button
                    onClick={() => handleQuickAction('document')}
                    className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-orange-600 text-orange-700 rounded-full hover:bg-orange-50 transition-colors text-lg font-medium shadow-md"
                  >
                    <FiFileText size={20} />
                    Upload Document
                  </button>
                  <button
                    onClick={() => setShowBenefitTracker(!showBenefitTracker)}
                    className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-indigo-600 text-indigo-700 rounded-full hover:bg-indigo-50 transition-colors text-lg font-medium shadow-md"
                  >
                    <FiAward size={20} />
                    Track Applications
                  </button>
                </div>

                {/* Shadow Balance Widget */}
                {showShadowBalance && (
                  <div className="mt-8 max-w-3xl mx-auto">
                    <ShadowBalanceGauge
                      shadowBalance={shadowBalance}
                      onCancelBill={handleCancelVampireBill}
                    />
                  </div>
                )}

                {/* Benefit Tracker Widget */}
                {showBenefitTracker && activeClaims.length > 0 && (
                  <div className="mt-8 max-w-3xl mx-auto space-y-4">
                    <h3 className="text-2xl font-bold text-gray-800">Your Active Applications</h3>
                    {activeClaims.map((claim, idx) => (
                      <BenefitTrackerStepper key={claim.schemeId} claimStatus={claim} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Shadow Balance in Chat View */}
                {showShadowBalance && (
                  <ShadowBalanceGauge
                    shadowBalance={shadowBalance}
                    onCancelBill={handleCancelVampireBill}
                  />
                )}

                {/* Benefit Tracker in Chat View */}
                {showBenefitTracker && activeClaims.length > 0 && (
                  <div className="space-y-4 mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">Your Active Applications</h3>
                    {activeClaims.map((claim) => (
                      <BenefitTrackerStepper key={claim.schemeId} claimStatus={claim} />
                    ))}
                  </div>
                )}

                {messages.map(message => (
                  <ChatMessage key={message.id} message={message} />
                ))}
              </>
            )}

            {loading && (
              <div className="flex items-center gap-3 text-gray-600">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-700" />
                <span className="text-lg">Analyzing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white border-t shadow-lg px-6 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Paste message or describe your question..."
                  rows={3}
                  className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col gap-2">
                {/* Voice Record Button */}
                <button
                  onClick={handleVoiceRecord}
                  className={`p-4 rounded-xl transition-colors ${
                    recording
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Voice input"
                  disabled={loading}
                >
                  <FiMic size={24} />
                </button>

                {/* File Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                  title="Upload document"
                  disabled={loading || uploadingFile}
                >
                  {uploadingFile ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600" />
                  ) : (
                    <FiPaperclip size={24} />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !inputMessage.trim()}
                  className="p-4 bg-green-700 text-white rounded-xl hover:bg-green-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  title="Send message"
                >
                  <FiSend size={24} />
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-500 mt-3 text-center">
              Documents: PDF, JPG, PNG (max 10MB) • Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Chat Message Component
function ChatMessage({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-green-700 text-white px-6 py-4 rounded-2xl rounded-tr-sm max-w-2xl shadow-md">
          <p className="text-lg leading-relaxed">{message.content}</p>
          <p className="text-xs text-green-100 mt-2">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-3xl w-full">
        {message.agentResponse && message.responseType !== 'general' ? (
          <VerdictCard response={message.agentResponse} responseType={message.responseType!} />
        ) : (
          <div className="bg-white px-6 py-4 rounded-2xl rounded-tl-sm shadow-md border border-gray-200">
            <p className="text-lg leading-relaxed text-gray-800">{message.content}</p>
            <p className="text-xs text-gray-500 mt-2">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Verdict Card Component
function VerdictCard({
  response,
  responseType
}: {
  response: PhishDetectorResult | DocumentAnalyzerResult | BenefitsNavigatorResult
  responseType: 'phish' | 'document' | 'benefits' | 'general'
}) {
  const [expanded, setExpanded] = useState(true)

  if (responseType === 'phish') {
    const phishResponse = response as PhishDetectorResult
    const colorClasses = {
      Red: 'bg-red-50 border-red-500',
      Yellow: 'bg-amber-50 border-amber-500',
      Green: 'bg-green-50 border-green-500',
    }
    const iconClasses = {
      Red: 'text-red-600',
      Yellow: 'text-amber-600',
      Green: 'text-green-600',
    }
    const Icon = phishResponse.risk_level === 'Red' ? FiAlertTriangle :
                 phishResponse.risk_level === 'Yellow' ? FiAlertTriangle : FiCheckCircle

    return (
      <Card className={`${colorClasses[phishResponse.risk_level]} border-l-4 shadow-lg`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Icon size={32} className={iconClasses[phishResponse.risk_level]} />
              <div>
                <CardTitle className="text-2xl font-bold">
                  {phishResponse.risk_level === 'Red' ? 'DANGER: Scam Detected' :
                   phishResponse.risk_level === 'Yellow' ? 'CAUTION: Suspicious' :
                   'SAFE: No Threats Detected'}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Threat Type: {phishResponse.threat_type}</p>
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
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Explanation:</h4>
              <p className="text-lg leading-relaxed text-gray-800">{phishResponse.explanation}</p>
            </div>

            {phishResponse.indicators_found.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-2">Warning Signs Found:</h4>
                <ul className="space-y-2">
                  {phishResponse.indicators_found.map((indicator, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FiAlertTriangle className="text-red-600 mt-1 flex-shrink-0" size={18} />
                      <span className="text-lg">{indicator}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-white bg-opacity-70 p-4 rounded-lg">
              <h4 className="font-semibold text-lg mb-2">What You Should Do:</h4>
              <p className="text-lg leading-relaxed">{phishResponse.recommended_action}</p>
            </div>

            {phishResponse.risk_level === 'Red' && (
              <div className="flex gap-3 pt-2">
                <Button className="bg-red-600 hover:bg-red-700 text-white text-lg px-6 py-3">
                  Block Sender
                </Button>
                <Button variant="outline" className="text-lg px-6 py-3">
                  Report Scam
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    )
  }

  if (responseType === 'document') {
    const docResponse = response as DocumentAnalyzerResult
    const colorClasses = {
      Red: 'bg-red-50 border-red-500',
      Yellow: 'bg-amber-50 border-amber-500',
      Green: 'bg-green-50 border-green-500',
    }
    const riskLevel = docResponse.risk_level || 'Yellow'

    // If EAR calculation is provided, show the dedicated EAR component
    if (docResponse.ear_calculation) {
      return <EARCalculationDisplay calculation={docResponse.ear_calculation} />
    }

    return (
      <Card className={`${colorClasses[riskLevel]} border-l-4 shadow-lg`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <FiFileText size={32} className="text-purple-600" />
              <CardTitle className="text-2xl font-bold">Loan Document Analysis</CardTitle>
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
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white bg-opacity-70 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Stated Interest Rate</p>
                <p className="text-2xl font-bold text-gray-800">{docResponse.stated_interest_rate}</p>
              </div>
              <div className="bg-white bg-opacity-70 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Effective Interest Rate</p>
                <p className="text-2xl font-bold text-red-600">{docResponse.effective_interest_rate}</p>
              </div>
            </div>

            {/* Hidden Cost Progress Bar */}
            <div className="bg-white bg-opacity-70 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">Hidden Cost Breakdown</p>
                <FiTrendingUp className="text-red-600" size={20} />
              </div>
              <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="absolute h-full bg-gradient-to-r from-red-500 to-red-700 transition-all duration-1000 flex items-center justify-end px-3"
                  style={{ width: '75%' }}
                >
                  <span className="text-white text-xs font-bold">True Cost Much Higher</span>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-600">
                <span>What they show</span>
                <span>What you actually pay</span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-2">Explanation:</h4>
              <p className="text-lg leading-relaxed text-gray-800">{docResponse.explanation}</p>
            </div>

            {docResponse.hidden_charges.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-2">Hidden Charges Found:</h4>
                <ul className="space-y-2">
                  {docResponse.hidden_charges.map((charge, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FiAlertTriangle className="text-amber-600 mt-1 flex-shrink-0" size={18} />
                      <span className="text-lg">{charge}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {docResponse.rbi_violations.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-2">RBI Compliance:</h4>
                <ul className="space-y-2">
                  {docResponse.rbi_violations.map((violation, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FiAlertTriangle className="text-red-600 mt-1 flex-shrink-0" size={18} />
                      <span className="text-lg">{violation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-white bg-opacity-70 p-4 rounded-lg">
              <h4 className="font-semibold text-lg mb-2">Recommended Action:</h4>
              <p className="text-lg leading-relaxed">{docResponse.recommended_action}</p>
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  if (responseType === 'benefits') {
    const benefitsResponse = response as BenefitsNavigatorResult

    // If claim status tracking is provided, show the Benefit Tracker instead
    if (benefitsResponse.claim_status) {
      return <BenefitTrackerStepper claimStatus={benefitsResponse.claim_status} />
    }

    return (
      <Card className="bg-blue-50 border-l-4 border-blue-500 shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <FiGift size={32} className="text-blue-600" />
              <CardTitle className="text-2xl font-bold">Benefits You Can Claim</CardTitle>
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
          <CardContent className="space-y-4">
            <div>
              <p className="text-lg leading-relaxed text-gray-800 mb-4">{benefitsResponse.explanation}</p>
              <div className="bg-blue-100 p-4 rounded-lg">
                <p className="text-sm text-gray-700 mb-1">Total Potential Benefits</p>
                <p className="text-3xl font-bold text-blue-700">{benefitsResponse.total_potential_benefits}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-3">Matched Schemes:</h4>
              <div className="space-y-3">
                {benefitsResponse.matched_schemes.map((scheme, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-semibold text-lg text-gray-800">{scheme.scheme_name}</h5>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        scheme.priority === 'high' ? 'bg-green-100 text-green-700' :
                        scheme.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {scheme.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xl font-bold text-blue-600 mb-2">{scheme.benefit_amount}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Match: {scheme.eligibility_match}</span>
                      <span>Difficulty: {scheme.application_difficulty}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {benefitsResponse.next_steps.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-2">Next Steps:</h4>
                <ol className="space-y-2 list-decimal list-inside">
                  {benefitsResponse.next_steps.map((step, idx) => (
                    <li key={idx} className="text-lg leading-relaxed">{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {benefitsResponse.required_documents.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-2">Required Documents:</h4>
                <div className="flex flex-wrap gap-2">
                  {benefitsResponse.required_documents.map((doc, idx) => (
                    <span key={idx} className="px-3 py-2 bg-white rounded-lg text-sm border border-blue-200">
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Button className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-6 py-3 w-full">
              Start Application Process
            </Button>
          </CardContent>
        )}
      </Card>
    )
  }

  return null
}
