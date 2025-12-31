'use client'
import { logger } from '@/lib/logger'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, CheckCircle, Wand2, Dumbbell, ChefHat, Heart, Globe } from 'lucide-react'
import { apiService } from '@/lib/api-service'
// import { TemplateBreakdownModal } from '@/components/modals'
import AppSpecErrorModal from '@/components/modals/AppSpecErrorModal'
import { GenerationProgressModal } from '@/components/modals'
import { TypewriterText } from '@/components/ui'
import type { AppIdea } from '@/types'

interface AppIdeaFormProps {
  onSubmit: (idea: AppIdea) => void
}



export default function AppIdeaForm({ onSubmit }: AppIdeaFormProps) {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [selectedInspiration, setSelectedInspiration] = useState<string | null>(null)
  const [showBreakdownModal, setShowBreakdownModal] = useState(false)
  const [breakdownResult, setBreakdownResult] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showGenerationModal, setShowGenerationModal] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [specError, setSpecError] = useState<{ open: boolean; message?: string; status?: number }>({ open: false })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!description.trim()) {
      return
    }

    const appIdea: AppIdea = {
      description: description.trim(),
      platform: 'iOS & Android'
    }

    // Store app idea in localStorage
    localStorage.setItem('mobile_app_idea', description.trim())
    
    // Call spec generation endpoint
    logger.debug('Starting app spec generation...')
    await analyzeTemplateBreakdown(description.trim(), appIdea)
  }

  const analyzeTemplateBreakdown = async (appIdea: string, appIdeaObj: AppIdea) => {
    setIsAnalyzing(true)
    setShowGenerationModal(true)
    logger.debug('Analyzing template for app idea:', { value: appIdea })
    
    try {
      const response = await apiService.getAppSpec(appIdea)
      logger.debug('AppSpec response:', { value: response })

      if (response.ok && response.data) {
        const rand = Math.random().toString(36).slice(2, 8)
        const token = `s_${Date.now().toString(36)}_${rand}`
        const payload = { prompt: appIdea, spec: response.data, at: Date.now() }
        try {
          sessionStorage.setItem(`appSpec:${token}`, JSON.stringify(payload))
          sessionStorage.setItem('lastAppSpec', JSON.stringify(payload))
        } catch {}
        // Redirect to /app-spec (relies on lastAppSpec fallback)
        router.push(`/app-spec`)
        return
      }

      setSpecError({ open: true, message: typeof response.data === 'string' ? response.data : 'Failed to generate spec', status: response.status })
    } catch (error: any) {
      logger.error('AppSpec error:', { error: error instanceof Error ? error.message : String(error) })
      const status = (error && (error as any).status) || undefined
      const msg = (error && (error as any).message) || 'Please try again.'
      setSpecError({ open: true, message: msg, status })
    } finally {
      setIsAnalyzing(false)
      setShowGenerationModal(false)
    }
  }

  const handleModalClose = () => {
    setShowBreakdownModal(false)
    // Do not redirect to features page - just close the modal for testing
  }

  return (
    <div className="bg-white pt-36 pb-4 px-4">
      <div className="max-w-4xl mx-auto">
        {/* AI Badge */}
        
        <div className="text-center mb-3">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 leading-tight">
            What App are we building today?
          </h1>
        </div>

        {/* Main Form Section */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gray-600 text-lg">
              Build Mobile Commerce App - Faster Than Ever
            </p>
          </div>
        
          
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="mb-8">
              <div className="relative">
                {/* Typewriter animation placeholder - visible when input is empty and not focused */}
                {!description && !isInputFocused && (
                  <div className="absolute inset-0 p-6 pointer-events-none">
                    <span className="text-sm text-gray-400">
                      <TypewriterText />
                    </span>
                  </div>
                )}
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  placeholder={isInputFocused ? "Describe your mobile app idea, its main features, target audience, and what problem it solves..." : ""}
                  className="w-full h-32 p-6 border-2 border-gray-200 rounded-2xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-400 shadow-sm bg-transparent relative z-10"
                  required
                  maxLength={1000}
                />
                <div className="absolute bottom-4 right-4 z-20">
                  <span className="text-xs text-gray-400">
                    {description.length}/1000
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isAnalyzing || !description.trim()}
                onClick={() => console.log('Button clicked', { isAnalyzing, description: description.trim(), disabled: isAnalyzing || !description.trim() })}
                className="bg-orange-600 text-white px-12 py-4 rounded-xl hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl min-w-[280px] flex items-center justify-center"
              >
                {isAnalyzing ? (
                  <>
                    Generating your app...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    <span>Generate My Mobile App</span>
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </div>
            
            <div className="flex justify-center mt-4">
              <div className="flex items-center gap-2 text-orange-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Empowering entrepreneurs without the tech headache</span>
              </div>
            </div>
          </form>


        </div>

        {/* Inspiration Section */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Need inspiration?
            </h2>
            <p className="text-lg text-gray-600">
              Explore trending premium app concepts
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { title: 'Premium Fitness Tracker', subtitle: 'AI-powered workouts with personalized coaching', icon: Dumbbell },
              { title: 'Gourmet Recipe Hub', subtitle: 'Chef-curated recipes with video tutorials', icon: ChefHat },
              { title: 'Smart Pet Care', subtitle: 'Vet consultations & health monitoring', icon: Heart },
              { title: 'AI Language Tutor', subtitle: 'Immersive learning with native speakers', icon: Globe }
            ].map((idea, index) => {
              const IconComponent = idea.icon
              return (
                <button
                  key={index}
                  type="button"
                  className="group bg-white p-6 rounded-2xl cursor-pointer hover:shadow-xl transition-all duration-300 text-left border border-gray-200 relative overflow-hidden hover:border-orange-300 hover:-translate-y-1"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const description = `${idea.title} - ${idea.subtitle}. A premium mobile app with advanced features.`
                    setDescription(description)
                    setSelectedInspiration(idea.title)
                    setTimeout(() => setSelectedInspiration(null), 2000)
                  }}
                >
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-gray-100 rounded-xl mr-3">
                      <IconComponent className="w-6 h-6 text-gray-700" />
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-orange-600 transition-colors">
                    {idea.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {idea.subtitle}
                  </p>
                  
                  {selectedInspiration === idea.title && (
                    <div className="absolute top-4 right-4 bg-green-500 text-white p-2 rounded-full shadow-lg">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Footer removed here to avoid duplicate on home page. Footer is rendered at the page level. */}
      </div>

      {/* Error Modal for spec generation */}
      <AppSpecErrorModal
        isOpen={specError.open}
        status={specError.status}
        message={specError.message}
        onClose={() => setSpecError({ open: false })}
        onBackHome={() => {
          setSpecError({ open: false })
          window.location.href = '/'
        }}
      />

      {/* Generation Steps Modal */}
      <GenerationProgressModal
        isOpen={showGenerationModal}
        onClose={() => {
          setShowGenerationModal(false)
          setIsAnalyzing(false)
        }}
      />
    </div>
  )
}
