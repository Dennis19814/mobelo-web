'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Navigation, Footer } from '@/components/layout'

export default function TermsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      
      <main className="flex-1 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 font-medium mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-lg text-gray-600">
              Last updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="space-y-8">
              
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  By accessing and using mobelo ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  mobelo is an AI-powered mobile app design and development platform that helps users create, customize, and preview mobile applications through an intuitive interface. The Service includes:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>App idea validation and enhancement tools</li>
                  <li>Mobile app screen design and customization</li>
                  <li>Preview and prototyping capabilities</li>
                  <li>Template libraries and inspiration galleries</li>
                  <li>Export and deployment assistance</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts and Registration</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  To access certain features of the Service, you must register for an account. You agree to:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Provide accurate, current, and complete information during registration</li>
                  <li>Maintain the security of your password and account</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use Policy</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You agree not to use the Service to:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Create or design applications that violate applicable laws or regulations</li>
                  <li>Infringe upon intellectual property rights of others</li>
                  <li>Upload or distribute malicious code, viruses, or harmful content</li>
                  <li>Attempt to reverse engineer, decompile, or hack the Service</li>
                  <li>Use the Service for commercial purposes without proper licensing</li>
                  <li>Create apps containing hate speech, harassment, or discriminatory content</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Intellectual Property Rights</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  The Service and its original content, features, and functionality are owned by mobelo and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  You retain ownership of the app concepts and content you create using our Service. However, you grant us a limited license to use, display, and process your content as necessary to provide the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Subscription and Payment Terms</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Certain features of the Service may require payment of fees. For paid subscriptions:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Fees are billed in advance on a recurring basis</li>
                  <li>All fees are non-refundable except as required by law</li>
                  <li>We reserve the right to modify pricing with 30 days notice</li>
                  <li>Your subscription will automatically renew unless cancelled</li>
                  <li>You may cancel your subscription at any time from your account settings</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Privacy and Data Protection</h2>
                <p className="text-gray-700 leading-relaxed">
                  Your privacy is important to us. Please review our <a href="/privacy" className="text-orange-600 hover:text-orange-700 font-medium underline">Privacy Policy</a>, which also governs your use of the Service, to understand our practices regarding the collection, use, and disclosure of your personal information. You have the right to request deletion of your personal data at any time through our <a href="/data-deletion-request" className="text-orange-600 hover:text-orange-700 font-medium underline">Data Deletion Request</a> page.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Service Availability and Modifications</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We strive to maintain the Service's availability but do not guarantee uninterrupted access. We reserve the right to:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Modify, suspend, or discontinue the Service at any time</li>
                  <li>Perform maintenance and updates as necessary</li>
                  <li>Implement new features or remove existing ones</li>
                  <li>Set usage limits or restrictions</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Disclaimer of Warranties</h2>
                <p className="text-gray-700 leading-relaxed">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
                <p className="text-gray-700 leading-relaxed">
                  IN NO EVENT SHALL MOBELO BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR USE, ARISING OUT OF OR RELATING TO YOUR USE OF THE SERVICE.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Termination</h2>
                <p className="text-gray-700 leading-relaxed">
                  We may terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to modify these Terms at any time. We will notify users of any material changes via email or through the Service. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Information</h2>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg mt-4">
                  <p className="text-gray-700 font-medium">Email: legal@mobelo.com</p>
                  <p className="text-gray-700 font-medium">Address: mobelo Legal Department</p>
                  <p className="text-gray-700">123 Innovation Drive, Tech City, TC 12345</p>
                </div>
              </section>

            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                These terms are effective as of the date listed above and will remain in effect until modified.
              </p>
              <div className="flex justify-center space-x-6 text-sm">
                <a href="/privacy" className="text-orange-600 hover:text-orange-700 font-medium">
                  Privacy Policy
                </a>
                <a href="/data-deletion-request" className="text-orange-600 hover:text-orange-700 font-medium">
                  Data Deletion Request
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
