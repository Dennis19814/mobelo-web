'use client'

import React from 'react'
import { X, CheckCircle, AlertCircle, FileText, ArrowRight } from 'lucide-react'

interface ScreenMapping {
  screenName: string
  templateScreen: string
  mappingScore: number
  explanation: string
}

interface TemplateBreakdownResult {
  templateId: number | null
  matchScore: number
  screenMapping: ScreenMapping[]
  reason?: string
  templateTitle?: string
}

interface TemplateBreakdownModalProps {
  isOpen: boolean
  onClose: () => void
  result: TemplateBreakdownResult | null
  appIdea: string
}

export default function TemplateBreakdownModal({ 
  isOpen, 
  onClose, 
  result, 
  appIdea 
}: TemplateBreakdownModalProps) {
  if (!isOpen || !result) return null

  const hasMatch = result.templateId !== null && result.matchScore >= 6
  
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50'
    if (score >= 6) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 8) return 'bg-green-500'
    if (score >= 6) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              hasMatch ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {hasMatch ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Template Analysis Result
              </h2>
              <p className="text-sm text-gray-500">
                AI-powered template matching for your app idea
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* App Idea Summary */}
          <div className="mb-6 p-4 bg-orange-50 rounded-lg">
            <h3 className="font-medium text-slate-900 mb-2">Your App Idea:</h3>
            <p className="text-blue-800 text-sm">{appIdea}</p>
          </div>

          {/* Match Score */}
          <div className="mb-6 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Overall Match Score</h3>
              <p className="text-sm text-gray-600">
                {hasMatch ? 'Template found and analyzed' : 'No suitable template match'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(result.matchScore)}`}>
                {result.matchScore}/10
              </div>
              <div className={`w-3 h-3 rounded-full ${getScoreBadgeColor(result.matchScore)}`} />
            </div>
          </div>

          {hasMatch ? (
            <>
              {/* Template Information */}
              <div className="mb-6 p-4 border border-green-200 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <h3 className="font-medium text-green-900">Matched Template</h3>
                </div>
                <p className="text-green-800 font-medium">{result.templateTitle}</p>
                <p className="text-green-700 text-sm mt-1">Template ID: {result.templateId}</p>
              </div>

              {/* Screen Mapping */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-4">Screen Mapping Analysis</h3>
                <div className="space-y-3">
                  {result.screenMapping.map((mapping, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {mapping.screenName}
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <div className="text-sm text-orange-600">
                            {mapping.templateScreen}
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(mapping.mappingScore)}`}>
                          {mapping.mappingScore}/10
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 ml-0">
                        {mapping.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* No Match Found */
            <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-medium text-red-900">No Template Match</h3>
              </div>
              <p className="text-red-800 text-sm">
                {result.reason || 'No existing template matches your app idea requirements.'}
              </p>
            </div>
          )}

          {/* Additional Information */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">What This Means:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              {hasMatch ? (
                <>
                  <li>• Your app idea has been matched with an existing template</li>
                  <li>• The screen mapping shows how your app features align with the template</li>
                  <li>• Higher scores indicate better compatibility between your idea and the template</li>
                  <li>• You can use this template as a starting point for your app development</li>
                </>
              ) : (
                <>
                  <li>• No existing template closely matches your unique app idea</li>
                  <li>• This means your idea is innovative and may require custom development</li>
                  <li>• Consider refining your idea or proceeding with custom development</li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
          {hasMatch && (
            <button
              onClick={() => {
                // Show template details for testing
                alert(`Template Analysis Complete!\n\nTemplate ID: ${result.templateId}\nMatch Score: ${result.matchScore}/10\nTemplate: ${result.templateTitle}\n\nThis would normally continue to the app builder with this template.`)
                onClose()
              }}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Continue with Template
            </button>
          )}
        </div>
      </div>
    </div>
  )
}