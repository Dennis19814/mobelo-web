'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, LogOut, ChevronDown } from 'lucide-react'
import { SigninModal, OTPModal } from '../modals'
import { apiService } from '@/lib/api-service'
import type { User } from '@/types'

interface FeaturesNavigationProps {
  isLoading?: boolean
}

export default function FeaturesNavigation({ isLoading = false }: FeaturesNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showSigninModal, setShowSigninModal] = useState(false)
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const checkAuthStatus = () => {
    const accessToken = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user')
    
    if (accessToken && userData) {
      setIsAuthenticated(true)
      setUser(JSON.parse(userData))
    } else {
      setIsAuthenticated(false)
      setUser(null)
    }
  }

  const handleLogout = async () => {
    const accessToken = localStorage.getItem('access_token')
    
    if (accessToken) {
      try {
        const response = await apiService.logout()
        
        if (response.ok) {
          logger.debug('Logout successful on server')
        } else {
          logger.warn('Logout API failed, but continuing with local cleanup')
        }
      } catch (error) {
        logger.warn('Logout API error, but continuing with local cleanup:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
      }
    }
    
    // Clear auth data
    try {
      const { clearOwnerAuthData } = await import('@/lib/auth-utils')
      clearOwnerAuthData()
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      localStorage.removeItem('userApiKey')
      localStorage.removeItem('appSecretKey')
      // Clear merchant panel section keys
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('merchant-panel-section-')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    }
    setIsAuthenticated(false)
    setUser(null)
    setShowUserMenu(false)
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const getUserInitials = (user: User | null) => {
    if (!user) return 'U'
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    }
    if (user.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  return (
    <>
      <nav className="bg-white px-6 py-4 border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <Image 
                  src="/logo.png" 
                  alt="mobelo" 
                  width={40}
                  height={40}
                  className="w-10 h-10"
                />
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-logo">
                  mobelo
                </div>
              </Link>
            </div>
            
            <div className="flex items-center space-x-3">
              {isAuthenticated ? (
                <div className="hidden md:block relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    disabled={isLoading}
                    className={`flex items-center space-x-2 px-4 py-2 font-medium transition-all duration-200 rounded-xl ${
                      isLoading 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                      isLoading ? 'bg-gray-400 text-gray-200' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md'
                    }`}>
                      {getUserInitials(user)}
                    </div>
                    <span className="text-sm">{user?.firstName || user?.email?.split('@')[0] || 'User'}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {showUserMenu && !isLoading && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
                      <div className="py-1">
                        <div className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100">
                          <div className="font-medium">{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'User'}</div>
                          <div className="text-gray-500 text-xs">{user?.email}</div>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-3">
                  <button
                    onClick={() => !isLoading && setShowSigninModal(true)}
                    disabled={isLoading}
                    className={`px-5 py-2.5 font-medium transition-all duration-200 rounded-xl ${
                      isLoading 
                        ? 'text-gray-400 cursor-not-allowed bg-gray-100' 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => !isLoading && setShowSigninModal(true)}
                    disabled={isLoading}
                    className={`px-5 py-2.5 font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 ${
                      isLoading 
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              )}
              
              <button
                onClick={toggleMobileMenu}
                disabled={isLoading}
                className={`md:hidden p-2 transition-all duration-200 rounded-lg ${
                  isLoading 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
        
        {isMobileMenuOpen && !isLoading && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-6 py-4 space-y-4">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="px-4 py-2 text-sm text-gray-700">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        {getUserInitials(user)}
                      </div>
                      <div>
                        <div className="font-medium">{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'User'}</div>
                        <div className="text-gray-500 text-xs">{user?.email}</div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {handleLogout(); setIsMobileMenuOpen(false)}}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 font-medium transition-all duration-200 rounded-md"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => {setShowSigninModal(true); setIsMobileMenuOpen(false)}}
                    className="block w-full px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 font-medium transition-all duration-200 rounded-md text-center"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {setShowSigninModal(true); setIsMobileMenuOpen(false)}}
                    className="block w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 hover:shadow-md transition-all duration-200 text-center"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
      
      <SigninModal
        isOpen={showSigninModal}
        onClose={() => setShowSigninModal(false)}
        onSigninSuccess={(email) => {
          logger.debug('Signin successful for:', { value: email })
          setTimeout(() => {
            checkAuthStatus()
          }, 100)
        }}
      />
      
      <OTPModal
        isOpen={showOTPModal}
        onClose={() => {
          setShowOTPModal(false)
          setUserEmail('')
        }}
        onBack={() => {
          setShowOTPModal(false)
          setShowSigninModal(true)
        }}
        email={userEmail}
        onVerifySuccess={(token) => {
          logger.debug('OTP verification successful, token:', { value: token })
          setShowOTPModal(false)
          setUserEmail('')
        }}
      />
    </>
  )
}
