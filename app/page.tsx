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
import { VigilanteShield } from '@/components/VigilanteShield'
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
  { code: 'pa', name: 'Punjabi' },
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

  // User Profile - demo data (would come from agent in production)
  const [userProfile] = useState<Partial<UserFinancialProfile>>({
    userId: 'demo-user-001',
    location: 'Maharashtra, India',
    income: 180000, // Annual income in INR
    occupation: 'Farmer',
    languagePreference: 'en',
    bankBalance: 15000
  })

  // Vigilante Shield state
  const [vigilanteActive, setVigilanteActive] = useState(true)
  const [vigilanteThreats, setVigilanteThreats] = useState<number>(2)
  const [recentThreats] = useState([
    {
      id: '1',
      source: 'SMS from +91-XXXXX123',
      message: 'URGENT: Your bank account will be blocked. Click link to verify: bit.ly/scam123',
      detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      id: '2',
      source: 'WhatsApp from Unknown',
      message: 'Get instant loan ₹50,000 in 5 minutes! 0% interest for first month. Apply now!',
      detectedAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    }
  ])

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
      // Check if browser supports speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (SpeechRecognition) {
        // Use Web Speech Recognition API
        const recognition = new SpeechRecognition()

        // Map language codes to speech recognition locale codes
        const languageMap: Record<string, string> = {
          'en': 'en-US',
          'hi': 'hi-IN',
          'mr': 'mr-IN',
          'es': 'es-ES',
          'pa': 'pa-IN'
        }

        recognition.lang = languageMap[selectedLanguage] || 'en-US'
        recognition.continuous = false
        recognition.interimResults = false
        recognition.maxAlternatives = 1

        recognition.onstart = () => {
          setRecording(true)
        }

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setInputMessage(transcript)
          setRecording(false)
        }

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setRecording(false)
        }

        recognition.onend = () => {
          setRecording(false)
        }

        try {
          recognition.start()
        } catch (error) {
          console.error('Error starting speech recognition:', error)
          setRecording(false)
        }
      } else {
        // Fallback to audio recording if speech recognition not supported
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
      }
    } else {
      // Stop recording
      setRecording(false)
      mediaRecorderRef.current?.stop()
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
    <div className="flex h-screen bg-yellow-100 relative">
      {/* Vigilante Shield */}
      <VigilanteShield
        isActive={vigilanteActive}
        threatsDetected={vigilanteThreats}
        onToggle={() => setVigilanteActive(!vigilanteActive)}
        recentThreats={recentThreats}
      />

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
          <div className="bg-white border-4 border-black p-8 max-w-2xl w-full mx-4 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FiDollarSign size={32} className="text-purple-600" />
                <h2 className="text-3xl font-bold text-black">Loan Transparency Calculator</h2>
              </div>
              <button onClick={() => setShowLoanCalculator(false)} className="text-black hover:scale-110 transition-transform">
                <FiX size={28} />
              </button>
            </div>

            <p className="text-xl text-black font-medium mb-6">
              Upload a screenshot of a loan app or offer to see the true cost with all hidden fees exposed.
            </p>

            <div className="space-y-4">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 px-6 py-6 bg-purple-400 text-black border-4 border-black hover:bg-purple-300 transition-all text-xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
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

              <div className="bg-purple-200 p-6 border-4 border-black">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <FiTrendingUp className="text-black" />
                  What we analyze:
                </h3>
                <ul className="space-y-2 text-lg text-black font-medium">
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

      {/* Panic Button FAB - Neobrutalism */}
      <button
        onClick={handlePanicButton}
        disabled={panicMode}
        className={`fixed bottom-8 right-8 z-50 w-20 h-20 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center transition-all ${
          panicMode
            ? 'bg-red-700 animate-pulse scale-110'
            : 'bg-red-600 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px]'
        }`}
        title="Panic Button - Report emergency"
      >
        <FiAlertOctagon size={40} className="text-white" />
      </button>

      {panicMode && (
        <div className="fixed bottom-32 right-8 z-50 bg-white p-4 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-lg font-bold text-red-600 flex items-center gap-2">
            <div className="animate-spin h-5 w-5 border-b-4 border-red-600" />
            Recording emergency report...
          </p>
        </div>
      )}
      {/* History Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-cyan-200 border-r-4 border-black shadow-[8px_0px_0px_0px_rgba(0,0,0,1)] transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b-4 border-black">
          <h2 className="text-xl font-bold text-black">History</h2>
          <button onClick={() => setSidebarOpen(false)} className="text-black hover:scale-110 transition-transform">
            <FiX size={24} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b-4 border-black">
          <button
            onClick={() => setHistoryFilter('all')}
            className={`flex-1 py-3 text-sm font-bold border-r-4 border-black transition-all ${
              historyFilter === 'all' ? 'bg-green-400 text-black' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setHistoryFilter('scams')}
            className={`flex-1 py-3 text-sm font-bold border-r-4 border-black transition-all ${
              historyFilter === 'scams' ? 'bg-red-400 text-black' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Scams Blocked
          </button>
          <button
            onClick={() => setHistoryFilter('benefits')}
            className={`flex-1 py-3 text-sm font-bold transition-all ${
              historyFilter === 'benefits' ? 'bg-blue-400 text-black' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Benefits Found
          </button>
        </div>

        {/* History Items */}
        <div className="overflow-y-auto h-[calc(100%-140px)]">
          {filteredHistory.length === 0 ? (
            <div className="p-6 text-center text-black">
              <FiClock size={48} className="mx-auto mb-3" />
              <p className="text-lg font-bold">No history yet</p>
            </div>
          ) : (
            filteredHistory.map(item => (
              <div key={item.id} className="p-4 border-b-4 border-black bg-white hover:bg-yellow-100 cursor-pointer transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium text-black">
                    {item.date.toLocaleDateString()} {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <span className={`px-3 py-1 text-xs font-bold border-2 border-black ${
                    item.verdict === 'danger' ? 'bg-red-400 text-black' :
                    item.verdict === 'caution' ? 'bg-amber-400 text-black' :
                    item.verdict === 'benefits' ? 'bg-blue-400 text-black' :
                    'bg-green-400 text-black'
                  }`}>
                    {item.verdict === 'danger' ? 'Scam' :
                     item.verdict === 'caution' ? 'Warning' :
                     item.verdict === 'benefits' ? 'Benefits' : 'Safe'}
                  </span>
                </div>
                <p className="text-sm font-medium text-black">{item.snippet}</p>
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
        <header className="bg-white border-b-4 border-black shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] px-6 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-black hover:scale-110 transition-transform"
              >
                <FiMenu size={24} />
              </button>
              <div className="flex items-center gap-3">
                <FiShield size={32} className="text-green-600" />
                <h1 className="text-2xl font-bold text-black">Sovereign Financial Guardian</h1>
              </div>
            </div>

            {/* Language Selector */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-4 py-2 border-4 border-black bg-white text-lg font-bold focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
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
                <h2 className="text-3xl font-bold text-gray-800 mb-3">
                  {selectedLanguage === 'hi' ? 'आपके वित्तीय संरक्षक में आपका स्वागत है' :
                   selectedLanguage === 'mr' ? 'तुमच्या आर्थिक संरक्षकाकडे स्वागत आहे' :
                   selectedLanguage === 'es' ? 'Bienvenido a su Guardián Financiero' :
                   'Welcome to Your Financial Guardian'}
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  {selectedLanguage === 'hi' ? 'घोटालों से आपकी रक्षा और लाभ खोजने में मदद' :
                   selectedLanguage === 'mr' ? 'घोटाळ्यांपासून संरक्षण आणि फायदे शोधण्यास मदत' :
                   selectedLanguage === 'es' ? 'Protegiéndote de estafas y ayudándote a descubrir beneficios' :
                   'Protecting you from scams and helping you discover benefits'}
                </p>

                {/* Large Microphone - Dialect First Interface */}
                <div className="mb-10">
                  {/* Language Indicator Badges */}
                  <div className="flex justify-center gap-3 mb-6">
                    {languages.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => setSelectedLanguage(lang.code)}
                        className={`px-4 py-2 text-sm font-bold transition-all cursor-pointer border-4 border-black ${
                          selectedLanguage === lang.code
                            ? 'bg-green-400 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] scale-105'
                            : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:scale-105'
                        }`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>

                  {/* Center-Stage Microphone Button */}
                  <div className="relative inline-flex">
                    {/* Animated ring indicator */}
                    {recording && (
                      <>
                        <span className="absolute inset-0 w-48 h-48 rounded-full bg-red-400 opacity-75 animate-ping"></span>
                        <span className="absolute inset-0 w-48 h-48 rounded-full bg-red-400 opacity-50 animate-pulse"></span>
                      </>
                    )}
                    <button
                      onClick={handleVoiceRecord}
                      className={`relative mx-auto w-48 h-48 border-8 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center transition-all transform ${
                        recording
                          ? 'bg-red-500 text-white scale-110'
                          : 'bg-green-400 text-black hover:bg-green-300 hover:scale-110 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px]'
                      }`}
                      title="Tap to speak in your language"
                    >
                      <FiMic size={96} />
                    </button>
                  </div>

                  {/* Instruction Text */}
                  <div className="mt-6 text-center">
                    <p className="text-2xl font-bold text-gray-800 mb-2">
                      {recording ? (
                        selectedLanguage === 'hi' ? 'सुन रहे हैं...' :
                        selectedLanguage === 'mr' ? 'ऐकत आहे...' :
                        selectedLanguage === 'es' ? 'Escuchando...' :
                        'Listening...'
                      ) : (
                        selectedLanguage === 'hi' ? 'अपनी भाषा में बोलें' :
                        selectedLanguage === 'mr' ? 'तुमच्या भाषेत बोला' :
                        selectedLanguage === 'es' ? 'Habla en tu idioma' :
                        'Speak in Your Language'
                      )}
                    </p>
                    <p className="text-base text-gray-600">
                      {recording ? (
                        selectedLanguage === 'hi' ? 'आपकी बात सुन रहे हैं...' :
                        selectedLanguage === 'mr' ? 'तुमचं बोलणं ऐकत आहे...' :
                        selectedLanguage === 'es' ? 'Te estamos escuchando...' :
                        'We are listening to you...'
                      ) : (
                        selectedLanguage === 'hi' ? 'माइक्रोफोन पर टैप करें और बोलना शुरू करें' :
                        selectedLanguage === 'mr' ? 'मायक्रोफोनवर टॅप करा आणि बोलणे सुरू करा' :
                        selectedLanguage === 'es' ? 'Toca el micrófono y empieza a hablar' :
                        'Tap the microphone and start speaking'
                      )}
                    </p>
                  </div>
                </div>

                {/* Quick Action Chips */}
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={() => handleQuickAction('sms')}
                    className="flex items-center gap-2 px-6 py-3 bg-green-400 border-4 border-black text-black hover:bg-green-300 transition-all text-lg font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
                  >
                    <FiMessageSquare size={20} />
                    Check SMS
                  </button>
                  <button
                    onClick={() => handleQuickAction('benefits')}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-400 border-4 border-black text-black hover:bg-blue-300 transition-all text-lg font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
                  >
                    <FiGift size={20} />
                    Find Benefits
                  </button>
                  <button
                    onClick={() => setShowLoanCalculator(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-400 border-4 border-black text-black hover:bg-purple-300 transition-all text-lg font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
                  >
                    <FiDollarSign size={20} />
                    Loan Calculator
                  </button>
                  <button
                    onClick={() => setShowShadowBalance(!showShadowBalance)}
                    className="flex items-center gap-2 px-6 py-3 bg-cyan-400 border-4 border-black text-black hover:bg-cyan-300 transition-all text-lg font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
                  >
                    {showShadowBalance ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                    Shadow Balance
                  </button>
                  <button
                    onClick={() => handleQuickAction('document')}
                    className="flex items-center gap-2 px-6 py-3 bg-orange-400 border-4 border-black text-black hover:bg-orange-300 transition-all text-lg font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
                  >
                    <FiFileText size={20} />
                    Upload Document
                  </button>
                  <button
                    onClick={() => setShowBenefitTracker(!showBenefitTracker)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-400 border-4 border-black text-black hover:bg-indigo-300 transition-all text-lg font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
                  >
                    <FiAward size={20} />
                    Track Applications
                  </button>
                </div>

                {/* Voice Command Examples */}
                <div className="mt-8 max-w-2xl mx-auto bg-blue-200 p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <h3 className="text-lg font-bold text-black mb-4 text-center flex items-center justify-center gap-2">
                    <FiMic className="text-black" size={20} />
                    {selectedLanguage === 'hi' ? 'उदाहरण वॉयस कमांड' :
                     selectedLanguage === 'mr' ? 'उदाहरण व्हॉइस कमांड' :
                     selectedLanguage === 'es' ? 'Comandos de voz de ejemplo' :
                     'Example Voice Commands'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedLanguage === 'hi' ? (
                      <>
                        <div className="bg-white p-3 border-2 border-black text-sm">
                          <span className="font-bold text-black">"मुझे एक SMS मिला है..."</span>
                        </div>
                        <div className="bg-white p-3 border-2 border-black text-sm">
                          <span className="font-bold text-black">"मुझे कौन से लाभ मिल सकते हैं?"</span>
                        </div>
                        <div className="bg-white p-3 border-2 border-black text-sm">
                          <span className="font-bold text-black">"यह लोन सुरक्षित है?"</span>
                        </div>
                        <div className="bg-white p-3 border-2 border-black text-sm">
                          <span className="font-bold text-black">"मेरा बैलेंस क्या है?"</span>
                        </div>
                      </>
                    ) : selectedLanguage === 'mr' ? (
                      <>
                        <div className="bg-white p-3 border-2 border-black text-sm">
                          <span className="font-bold text-black">"मला एक SMS आला आहे..."</span>
                        </div>
                        <div className="bg-white p-3 border-2 border-black text-sm">
                          <span className="font-bold text-black">"मला कोणते फायदे मिळू शकतात?"</span>
                        </div>
                        <div className="bg-white p-3 border-2 border-black text-sm">
                          <span className="font-bold text-black">"हे कर्ज सुरक्षित आहे का?"</span>
                        </div>
                        <div className="bg-white p-3 border-2 border-black text-sm">
                          <span className="font-bold text-black">"माझे बॅलन्स काय आहे?"</span>
                        </div>
                      </>
                    ) : selectedLanguage === 'es' ? (
                      <>
                        <div className="bg-white p-3 border-2 border-black text-sm">
                          <span className="font-bold text-black">"Recibí un SMS..."</span>
                        </div>
                        <div className="bg-white p-3 border-2 border-black text-sm">
                          <span className="font-bold text-black">"¿Qué beneficios puedo obtener?"</span>
                        </div>
                        <div className="bg-white p-3 border-2 border-black text-sm">
                          <span className="font-bold text-black">"¿Este préstamo es seguro?"</span>
                        </div>
                        <div className="bg-white p-3 border-2 border-black text-sm">
                          <span className="font-bold text-black">"¿Cuál es mi saldo?"</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-white p-3 border-2 border-black text-sm">
                          <span className="font-bold text-black">"I received an SMS..."</span>
                        </div>
                        <div className="bg-white p-3 border-2 border-black text-sm">
                          <span className="font-bold text-black">"What benefits can I get?"</span>
                        </div>
                        <div className="bg-white p-3 border-2 border-black text-sm">
                          <span className="font-bold text-black">"Is this loan safe?"</span>
                        </div>
                        <div className="bg-white p-3 border-2 border-black text-sm">
                          <span className="font-bold text-black">"What's my balance?"</span>
                        </div>
                      </>
                    )}
                  </div>
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
              <div className="flex items-center gap-3 text-black">
                <div className="animate-spin h-6 w-6 border-b-4 border-black" />
                <span className="text-lg font-bold">Analyzing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white border-t-4 border-black shadow-[0px_-4px_0px_0px_rgba(0,0,0,1)] px-6 py-6">
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
                  className="w-full px-6 py-4 border-4 border-black text-lg font-medium focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] resize-none transition-all"
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col gap-2">
                {/* Voice Record Button */}
                <button
                  onClick={handleVoiceRecord}
                  className={`p-4 border-4 border-black transition-all ${
                    recording
                      ? 'bg-red-500 text-white animate-pulse shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-gray-200 text-black hover:bg-gray-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]'
                  }`}
                  title="Voice input"
                  disabled={loading}
                >
                  <FiMic size={24} />
                </button>

                {/* File Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 bg-gray-200 text-black border-4 border-black hover:bg-gray-300 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
                  title="Upload document"
                  disabled={loading || uploadingFile}
                >
                  {uploadingFile ? (
                    <div className="animate-spin h-6 w-6 border-b-4 border-black" />
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
                  className="p-4 bg-green-500 text-black border-4 border-black hover:bg-green-400 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
                  title="Send message"
                >
                  <FiSend size={24} />
                </button>
              </div>
            </div>

            <p className="text-sm font-medium text-black mt-3 text-center">
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
        <div className="bg-green-400 text-black px-6 py-4 border-4 border-black max-w-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-lg leading-relaxed font-medium">{message.content}</p>
          <p className="text-xs font-bold mt-2">
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
          <VerdictCard response={message.agentResponse} responseType={message.responseType!} userProfile={userProfile} />
        ) : (
          <div className="bg-white px-6 py-4 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-lg leading-relaxed text-black font-medium">{message.content}</p>
            <p className="text-xs text-black font-bold mt-2">
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
  responseType,
  userProfile
}: {
  response: PhishDetectorResult | DocumentAnalyzerResult | BenefitsNavigatorResult
  responseType: 'phish' | 'document' | 'benefits' | 'general'
  userProfile?: Partial<UserFinancialProfile>
}) {
  const [expanded, setExpanded] = useState(true)

  if (responseType === 'phish') {
    const phishResponse = response as PhishDetectorResult
    const colorClasses = {
      Red: 'bg-red-200',
      Yellow: 'bg-amber-200',
      Green: 'bg-green-200',
    }
    const iconClasses = {
      Red: 'text-black',
      Yellow: 'text-black',
      Green: 'text-black',
    }
    const Icon = phishResponse.risk_level === 'Red' ? FiAlertTriangle :
                 phishResponse.risk_level === 'Yellow' ? FiAlertTriangle : FiCheckCircle

    return (
      <Card className={`${colorClasses[phishResponse.risk_level]}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Icon size={32} className={iconClasses[phishResponse.risk_level]} />
              <div>
                <CardTitle className="text-2xl font-bold text-black">
                  {phishResponse.risk_level === 'Red' ? 'DANGER: Scam Detected' :
                   phishResponse.risk_level === 'Yellow' ? 'CAUTION: Suspicious' :
                   'SAFE: No Threats Detected'}
                </CardTitle>
                <p className="text-sm font-bold text-black mt-1">Threat Type: {phishResponse.threat_type}</p>
              </div>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-black hover:scale-110 transition-transform"
            >
              {expanded ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
            </button>
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-bold text-lg mb-2 text-black">Explanation:</h4>
              <p className="text-lg leading-relaxed text-black font-medium">{phishResponse.explanation}</p>
            </div>

            {phishResponse.indicators_found.length > 0 && (
              <div>
                <h4 className="font-bold text-lg mb-2 text-black">Warning Signs Found:</h4>
                <ul className="space-y-2">
                  {phishResponse.indicators_found.map((indicator, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FiAlertTriangle className="text-black mt-1 flex-shrink-0" size={18} />
                      <span className="text-lg font-medium text-black">{indicator}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-white p-4 border-2 border-black">
              <h4 className="font-bold text-lg mb-2 text-black">What You Should Do:</h4>
              <p className="text-lg leading-relaxed font-medium text-black">{phishResponse.recommended_action}</p>
            </div>

            {phishResponse.risk_level === 'Red' && (
              <div className="flex gap-3 pt-2">
                <Button className="bg-red-500 hover:bg-red-400 text-black text-lg px-6 py-3 font-bold">
                  Block Sender
                </Button>
                <Button variant="outline" className="text-lg px-6 py-3 font-bold">
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
      Red: 'bg-red-200',
      Yellow: 'bg-amber-200',
      Green: 'bg-green-200',
    }
    const riskLevel = docResponse.risk_level || 'Yellow'

    // If EAR calculation is provided, show the dedicated EAR component
    if (docResponse.ear_calculation) {
      return <EARCalculationDisplay calculation={docResponse.ear_calculation} />
    }

    return (
      <Card className={`${colorClasses[riskLevel]}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <FiFileText size={32} className="text-black" />
              <CardTitle className="text-2xl font-bold text-black">Loan Document Analysis</CardTitle>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-black hover:scale-110 transition-transform"
            >
              {expanded ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
            </button>
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 border-4 border-black">
                <p className="text-sm font-bold text-black mb-1">Stated Interest Rate</p>
                <p className="text-2xl font-bold text-black">{docResponse.stated_interest_rate}</p>
              </div>
              <div className="bg-white p-4 border-4 border-black">
                <p className="text-sm font-bold text-black mb-1">Effective Interest Rate</p>
                <p className="text-2xl font-bold text-red-600">{docResponse.effective_interest_rate}</p>
              </div>
            </div>

            {/* Hidden Cost Progress Bar */}
            <div className="bg-white p-4 border-4 border-black">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-black">Hidden Cost Breakdown</p>
                <FiTrendingUp className="text-black" size={20} />
              </div>
              <div className="relative h-8 bg-gray-200 border-2 border-black overflow-hidden">
                <div
                  className="absolute h-full bg-red-500 transition-all duration-1000 flex items-center justify-end px-3"
                  style={{ width: '75%' }}
                >
                  <span className="text-white text-xs font-bold">True Cost Much Higher</span>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs font-bold text-black">
                <span>What they show</span>
                <span>What you actually pay</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-2 text-black">Explanation:</h4>
              <p className="text-lg leading-relaxed text-black font-medium">{docResponse.explanation}</p>
            </div>

            {docResponse.hidden_charges.length > 0 && (
              <div>
                <h4 className="font-bold text-lg mb-2 text-black">Hidden Charges Found:</h4>
                <ul className="space-y-2">
                  {docResponse.hidden_charges.map((charge, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FiAlertTriangle className="text-black mt-1 flex-shrink-0" size={18} />
                      <span className="text-lg font-medium text-black">{charge}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {docResponse.rbi_violations.length > 0 && (
              <div>
                <h4 className="font-bold text-lg mb-2 text-black">RBI Compliance:</h4>
                <ul className="space-y-2">
                  {docResponse.rbi_violations.map((violation, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FiAlertTriangle className="text-black mt-1 flex-shrink-0" size={18} />
                      <span className="text-lg font-medium text-black">{violation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-white p-4 border-2 border-black">
              <h4 className="font-bold text-lg mb-2 text-black">Recommended Action:</h4>
              <p className="text-lg leading-relaxed font-medium text-black">{docResponse.recommended_action}</p>
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

    // If pre-filled form is provided, show Magic Wand Form
    if (benefitsResponse.prefilled_form) {
      return <MagicWandForm
        formData={benefitsResponse.prefilled_form}
        userProfile={userProfile}
        onSubmit={(data) => {
          console.log('Submitting benefit application:', data)
        }}
      />
    }

    return (
      <Card className="bg-blue-200">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <FiGift size={32} className="text-black" />
              <CardTitle className="text-2xl font-bold text-black">Benefits You Can Claim</CardTitle>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-black hover:scale-110 transition-transform"
            >
              {expanded ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
            </button>
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="space-y-4">
            <div>
              <p className="text-lg leading-relaxed text-black font-medium mb-4">{benefitsResponse.explanation}</p>
              <div className="bg-white p-4 border-4 border-black">
                <p className="text-sm font-bold text-black mb-1">Total Potential Benefits</p>
                <p className="text-3xl font-bold text-black">{benefitsResponse.total_potential_benefits}</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-3 text-black">Matched Schemes:</h4>
              <div className="space-y-3">
                {benefitsResponse.matched_schemes.map((scheme, idx) => (
                  <div key={idx} className="bg-white p-4 border-4 border-black">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-bold text-lg text-black">{scheme.scheme_name}</h5>
                      <span className={`px-3 py-1 text-sm font-bold border-2 border-black ${
                        scheme.priority === 'high' ? 'bg-green-400 text-black' :
                        scheme.priority === 'medium' ? 'bg-amber-400 text-black' :
                        'bg-gray-300 text-black'
                      }`}>
                        {scheme.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xl font-bold text-black mb-2">{scheme.benefit_amount}</p>
                    <div className="flex items-center gap-4 text-sm font-medium text-black">
                      <span>Match: {scheme.eligibility_match}</span>
                      <span>Difficulty: {scheme.application_difficulty}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {benefitsResponse.next_steps.length > 0 && (
              <div>
                <h4 className="font-bold text-lg mb-2 text-black">Next Steps:</h4>
                <ol className="space-y-2 list-decimal list-inside">
                  {benefitsResponse.next_steps.map((step, idx) => (
                    <li key={idx} className="text-lg leading-relaxed font-medium text-black">{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {benefitsResponse.required_documents.length > 0 && (
              <div>
                <h4 className="font-bold text-lg mb-2 text-black">Required Documents:</h4>
                <div className="flex flex-wrap gap-2">
                  {benefitsResponse.required_documents.map((doc, idx) => (
                    <span key={idx} className="px-3 py-2 bg-white text-sm font-medium border-2 border-black">
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Button className="bg-blue-400 hover:bg-blue-300 text-black text-lg px-6 py-3 w-full font-bold">
              Start Application Process
            </Button>
          </CardContent>
        )}
      </Card>
    )
  }

  return null
}
