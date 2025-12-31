'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, CheckCircle, Loader2 } from 'lucide-react'
import type { AppIdea, ConversationData, ConversationResponse } from '@/types'

interface ConversationalFlowProps {
  appIdea: AppIdea
  onComplete: (data: ConversationData) => void
}

const mockQuestions = [
  "Who is your target audience for this app?",
  "What is the main problem your app solves?",
  "How do you plan to monetize your app?",
  "What is your expected timeline for launch?"
]

export default function ConversationalFlow({ appIdea, onComplete }: ConversationalFlowProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [responses, setResponses] = useState<ConversationResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const currentQuestion = mockQuestions[currentQuestionIndex] || ''
  const isComplete = currentQuestionIndex >= mockQuestions.length

  useEffect(() => {
    if (isComplete && responses.length > 0) {
      // Generate mock conversation data
      const conversationData: ConversationData = {
        responses,
        targetAudience: responses[0]?.answer || 'General users',
        features: ['User authentication', 'Core functionality', 'Data storage'],
        monetization: responses[2]?.answer || 'Freemium',
        timeline: responses[3]?.answer || '3-6 months'
      }
      
      setTimeout(() => {
        onComplete(conversationData)
      }, 1000)
    }
  }, [isComplete, responses, onComplete])

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentAnswer.trim() || isLoading) return

    setIsLoading(true)
    
    setTimeout(() => {
      const newResponse: ConversationResponse = {
        question: currentQuestion,
        answer: currentAnswer.trim()
      }
      
      setResponses([...responses, newResponse])
      setCurrentAnswer('')
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setIsLoading(false)
    }, 1000)
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-main mx-auto mb-6"></div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Processing Your Responses
            </h1>
            <p className="text-lg text-gray-600">
              We're analyzing your answers to create the perfect app plan...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Let's learn more about your app
          </h1>
          <p className="text-lg text-gray-600">
            Question {currentQuestionIndex + 1} of {mockQuestions.length}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-start space-x-4 mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <MessageCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {currentQuestion}
              </h2>
            </div>
          </div>

          <form onSubmit={handleSubmitAnswer} className="space-y-4">
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading || !currentAnswer.trim()}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>{isLoading ? 'Processing...' : 'Continue'}</span>
              </button>
            </div>
          </form>
        </div>

        {responses.length > 0 && (
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Previous Answers</h3>
            {responses.map((response, index) => (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                <p className="font-medium text-gray-900 mb-2">{response.question}</p>
                <p className="text-gray-600">{response.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}