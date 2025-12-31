'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, User as UserIcon, LogOut, ChevronDown, Grid3x3, Plus, CreditCard, Settings } from 'lucide-react'
import { SigninModal, OTPModal, LogoutConfirmationModal } from '../modals'
import { apiService } from '@/lib/api-service'
import { AppTimer } from '@/components/AppTimer'
import type { User } from '@/types'

interface NavigationProps {
  hideMenuItems?: boolean
  showGenerateNewApp?: boolean
  appId?: string | number
  currentUserId?: number
  onTimerExpire?: () => void
  pageTitle?: string
}

export default function Navigation({ hideMenuItems = false, showGenerateNewApp = false, appId, currentUserId, onTimerExpire, pageTitle }: NavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showSigninModal, setShowSigninModal] = useState(false)
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const scrollToSection = (sectionId: string) => {
    // Close mobile menu immediately
    setIsMobileMenuOpen(false)

    // If we're on the home page, scroll directly to the section
    if (pathname === '/') {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }
    } else {
      // If we're on another page, navigate to home page with the section hash
      router.push(`/#${sectionId}`)
    }
  }

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

  const handleLogout = () => {
    // Open confirmation modal instead of immediate sign-out
    setShowUserMenu(false)
    setShowLogoutModal(true)
  }

  const handleLogoutConfirm = async () => {
    // Perform proper sign-out then navigate home
    try {
      const accessToken = localStorage.getItem('access_token')
      if (accessToken) {
        const logoutPromise = apiService.logout()
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Logout timeout')), 3000))
        await Promise.race([logoutPromise, timeoutPromise]).catch(() => {})
      }
    } catch {}

    // Clear all auth data
    try {
      const { clearOwnerAuthData, clearStaffAuthData } = await import('@/lib/auth-utils')
      clearOwnerAuthData()
      clearStaffAuthData()
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
    }

    // Update UI state
    setIsAuthenticated(false)
    setUser(null)
    setIsMobileMenuOpen(false)
    setShowLogoutModal(false)

    // Redirect to home page
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  // Handle scrolling to section after navigation from another page
  useEffect(() => {
    if (pathname === '/' && typeof window !== 'undefined' && window.location.hash) {
      const sectionId = window.location.hash.substring(1) // Remove the '#'
      setTimeout(() => {
        const element = document.getElementById(sectionId)
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }
      }, 100)
    }
  }, [pathname])

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
      <nav className="bg-white border-b border-orange-100 px-4 md:px-6 py-3 md:py-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-3 md:gap-4">
            <div className="flex items-center space-x-3 md:space-x-4 lg:space-x-6 min-w-0 flex-1">
              <Link
                href="/"
                aria-label="Go to home"
                className="flex items-center group shrink-0"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {/* mobelo logo image - responsive sizing */}
                <Image
                  src="/logo.png"
                  alt="Mobelo - AI-Powered Mobile App Builder"
                  width={120}
                  height={40}
                  className="h-8 md:h-9 lg:h-10 w-auto transition-transform duration-150 group-hover:scale-105"
                  priority
                />
              </Link>

              {/* Page title - hidden on smaller screens */}
              {pageTitle && (
                <div className="hidden xl:block">
                  <span className="text-xs md:text-sm text-gray-500 truncate">{pageTitle}</span>
                </div>
              )}
            </div>

            {/* Navigation Menu - responsive spacing */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-6 xl:space-x-8 shrink-0">
              {!hideMenuItems && (
                <>
                  <button
                    onClick={() => scrollToSection('features')}
                    className="text-slate-700 hover:text-orange-600 font-medium transition-all duration-200 hover:bg-orange-50 px-2 md:px-3 py-1.5 md:py-2 rounded-[14px] text-sm lg:text-base whitespace-nowrap"
                  >
                    Features
                  </button>
                  <button
                    onClick={() => scrollToSection('how-it-works')}
                    className="text-slate-700 hover:text-orange-600 font-medium transition-all duration-200 hover:bg-orange-50 px-2 md:px-3 py-1.5 md:py-2 rounded-[14px] text-sm lg:text-base whitespace-nowrap"
                  >
                    How it works
                  </button>
                  <Link
                    href="/pricing"
                    className="text-slate-700 hover:text-orange-600 font-medium transition-all duration-200 hover:bg-orange-50 px-2 md:px-3 py-1.5 md:py-2 rounded-[14px] text-sm lg:text-base whitespace-nowrap"
                  >
                    Pricing
                  </Link>
                  <button
                    onClick={() => scrollToSection('faq')}
                    className="text-slate-700 hover:text-orange-600 font-medium transition-all duration-200 hover:bg-orange-50 px-2 md:px-3 py-1.5 md:py-2 rounded-[14px] text-sm lg:text-base whitespace-nowrap"
                  >
                    FAQ
                  </button>
                </>
              )}
              {isAuthenticated && (
                <>
                  <Link
                    href="/my-apps"
                    className="flex items-center space-x-1.5 md:space-x-2 border-2 border-orange-500 text-orange-600 font-semibold transition-all duration-200 hover:bg-orange-50 px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 rounded-[14px] text-sm lg:text-base whitespace-nowrap"
                  >
                    <Grid3x3 className="w-4 h-4" />
                    <span className="hidden lg:inline">My Apps</span>
                    <span className="lg:hidden">Apps</span>
                  </Link>
                  {showGenerateNewApp && (
                    <Link
                      href="/"
                      className="flex items-center space-x-1.5 md:space-x-2 bg-orange-500 text-white font-semibold transition-all duration-200 hover:bg-orange-600 px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 rounded-[14px] shadow-md text-sm lg:text-base whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden xl:inline">Generate New App</span>
                      <span className="xl:hidden">New App</span>
                    </Link>
                  )}
                </>
              )}
              {appId && currentUserId && (
                <AppTimer appId={appId} userId={currentUserId} onTimerExpire={onTimerExpire} />
              )}
            </div>
            
            {/* Auth buttons/User menu + Mobile menu button - responsive */}
            <div className="flex items-center space-x-2 md:space-x-3 shrink-0">
              {/* Desktop Auth buttons or User menu */}
              {isAuthenticated ? (
                <div className="hidden md:block relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-1.5 md:space-x-2 px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 text-slate-700 hover:text-orange-600 hover:bg-orange-50 font-medium transition-all duration-200 rounded-[14px]"
                    aria-expanded={showUserMenu}
                    aria-label="User menu"
                  >
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center text-xs md:text-sm font-semibold shadow-md shrink-0">
                      {getUserInitials(user)}
                    </div>
                    <span className="text-xs md:text-sm truncate max-w-[100px] lg:max-w-[120px]">{user?.firstName || user?.email?.split('@')[0] || 'User'}</span>
                    <ChevronDown className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-44 md:w-48 bg-white rounded-[14px] shadow-lg border border-orange-100 z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 text-sm text-slate-700 border-b border-orange-100">
                          <div className="font-semibold">{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'User'}</div>
                          <div className="text-slate-500 text-xs">{user?.email}</div>
                        </div>
                        <Link
                          href="/account/plan"
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="w-4 h-4" />
                          <span>Plan</span>
                        </Link>
                        <Link
                          href="/account/billing"
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Billing</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-2 md:space-x-3">
                  <button
                    onClick={() => setShowSigninModal(true)}
                    className="px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 text-slate-700 hover:text-orange-600 hover:bg-orange-50 font-medium transition-all duration-200 rounded-[14px] text-sm lg:text-base whitespace-nowrap"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setShowSigninModal(true)}
                    className="px-3 md:px-4 lg:px-6 py-1.5 md:py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-[14px] hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-300/40 transition-all duration-200 text-sm lg:text-base whitespace-nowrap"
                  >
                    Get started
                  </button>
                </div>
              )}
              
              {/* Mobile menu button - responsive */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 text-slate-700 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200 rounded-[14px]"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-orange-100 bg-white shadow-lg">
            <div className="px-6 py-4 space-y-4">
              {/* Mobile Navigation Menu */}
              <div className="space-y-2">
                {!hideMenuItems && (
                  <>
                    <button
                      onClick={() => scrollToSection('features')}
                      className="block w-full text-left px-3 py-2 text-slate-700 hover:text-orange-600 hover:bg-orange-50 font-medium transition-all duration-200 rounded-[14px]"
                    >
                      Features
                    </button>
                    <button
                      onClick={() => scrollToSection('how-it-works')}
                      className="block w-full text-left px-3 py-2 text-slate-700 hover:text-orange-600 hover:bg-orange-50 font-medium transition-all duration-200 rounded-[14px]"
                    >
                      How it works
                    </button>
                    <Link
                      href="/pricing"
                      className="block w-full text-left px-3 py-2 text-slate-700 hover:text-orange-600 hover:bg-orange-50 font-medium transition-all duration-200 rounded-[14px]"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Pricing
                    </Link>
                    <button
                      onClick={() => scrollToSection('faq')}
                      className="block w-full text-left px-3 py-2 text-slate-700 hover:text-orange-600 hover:bg-orange-50 font-medium transition-all duration-200 rounded-[14px]"
                    >
                      FAQ
                    </button>
                  </>
                )}
                {isAuthenticated && (
                  <>
                    <Link
                      href="/my-apps"
                      className="flex items-center space-x-2 w-full px-4 py-2 border-2 border-orange-500 text-orange-600 font-semibold transition-all duration-200 hover:bg-orange-50 rounded-[14px]"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Grid3x3 className="w-4 h-4" />
                      <span>My Apps</span>
                    </Link>
                    {showGenerateNewApp && (
                      <Link
                        href="/"
                        className="flex items-center space-x-2 w-full px-4 py-2 bg-orange-500 text-white font-semibold transition-all duration-200 hover:bg-orange-600 rounded-[14px] shadow-md"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Generate New App</span>
                      </Link>
                    )}
                  </>
                )}
                {appId && currentUserId && (
                  <div className="flex justify-center">
                    <AppTimer appId={appId} userId={currentUserId} onTimerExpire={onTimerExpire} />
                  </div>
                )}
              </div>
              
              {/* Mobile Auth buttons or User menu */}
              {isAuthenticated ? (
                <div className="pt-4 border-t border-orange-100 space-y-2">
                  <div className="px-4 py-2 text-sm text-slate-700">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center text-sm font-semibold shadow-md">
                        {getUserInitials(user)}
                      </div>
                      <div>
                        <div className="font-semibold">{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'User'}</div>
                        <div className="text-slate-500 text-xs">{user?.email}</div>
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/account/plan"
                    className="flex items-center space-x-2 w-full px-4 py-2 text-slate-700 hover:text-orange-600 hover:bg-orange-50 font-medium transition-all duration-200 rounded-[14px]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Plan</span>
                  </Link>
                  <Link
                    href="/account/billing"
                    className="flex items-center space-x-2 w-full px-4 py-2 text-slate-700 hover:text-orange-600 hover:bg-orange-50 font-medium transition-all duration-200 rounded-[14px]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Billing</span>
                  </Link>
                  <button
                    onClick={() => {handleLogout(); setIsMobileMenuOpen(false)}}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-slate-700 hover:text-orange-600 hover:bg-orange-50 font-medium transition-all duration-200 rounded-[14px]"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-orange-100 space-y-2">
                  <button
                    onClick={() => {setShowSigninModal(true); setIsMobileMenuOpen(false)}}
                    className="block w-full px-4 py-2 text-slate-700 hover:text-orange-600 hover:bg-orange-50 font-medium transition-all duration-200 rounded-[14px] text-center"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {setShowSigninModal(true); setIsMobileMenuOpen(false)}}
                    className="block w-full px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-[14px] hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-300/40 transition-all duration-200 text-center"
                  >
                    Get started
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
      
      
      {/* Signin Modal */}
      <SigninModal
        isOpen={showSigninModal}
        onClose={() => setShowSigninModal(false)}
        onSigninSuccess={(email) => {
          logger.debug('Signin successful for:', { value: email })
          // Check auth status after successful signin to update UI
          setTimeout(() => {
            checkAuthStatus()
          }, 100)
        }}
      />
      
      {/* OTP Modal */}
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
          // TODO: Handle successful verification (redirect to dashboard, etc.)
        }}
      />
      
      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onLogoutSuccess={handleLogoutConfirm}
      />
    </>
  )
}
