'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Navigation, Footer } from '@/components/layout'

export default function PrivacyPage() {
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
              Privacy Policy
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
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
                <p className="text-gray-700 leading-relaxed">
                  mobelo ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile app design platform and related services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
                
                <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">2.1 Information You Provide</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Account registration information (email address, username)</li>
                  <li>Profile information and preferences</li>
                  <li>App designs, content, and creative materials you create</li>
                  <li>Communications with our support team</li>
                  <li>Payment and billing information (processed securely by third parties)</li>
                  <li>Feedback, surveys, and user-generated content</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">2.2 Information Automatically Collected</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Device information (IP address, browser type, operating system)</li>
                  <li>Usage data (features used, time spent, interaction patterns)</li>
                  <li>Log files and error reports for service improvement</li>
                  <li>Cookies and similar tracking technologies</li>
                  <li>Analytics data to understand service performance</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We use the collected information for the following purposes:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process user registrations and manage accounts</li>
                  <li>Enable app design creation, editing, and collaboration features</li>
                  <li>Process payments and manage subscriptions</li>
                  <li>Send service-related communications and updates</li>
                  <li>Provide customer support and respond to inquiries</li>
                  <li>Analyze usage patterns and improve user experience</li>
                  <li>Detect, prevent, and address security issues</li>
                  <li>Comply with legal obligations and enforce our terms</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We do not sell, rent, or trade your personal information. We may share your information in the following circumstances:
                </p>
                
                <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">4.1 Service Providers</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We work with trusted third-party service providers who assist us in operating our platform:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Cloud hosting and data storage providers</li>
                  <li>Payment processing services</li>
                  <li>Email communication platforms</li>
                  <li>Analytics and performance monitoring tools</li>
                  <li>Customer support platforms</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">4.2 Legal Requirements</h3>
                <p className="text-gray-700 leading-relaxed">
                  We may disclose your information if required by law, court order, or government request, or to protect our rights, property, or safety, or that of our users or others.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We implement appropriate security measures to protect your information:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security assessments and updates</li>
                  <li>Access controls and authentication mechanisms</li>
                  <li>Monitoring for suspicious activities</li>
                  <li>Secure development practices</li>
                  <li>Regular backup and disaster recovery procedures</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee its absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
                <p className="text-gray-700 leading-relaxed">
                  We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. We will delete or anonymize your information when it's no longer needed, unless we're required to retain it for legal compliance.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Privacy Rights</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You have the following rights regarding your personal information:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li><strong>Access:</strong> Request a copy of your personal information</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                  <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                  <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                  <li><strong>Restriction:</strong> Limit how we process your information</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  To exercise these rights, please contact us using the information provided in Section 11. To request deletion of your data, please visit our <a href="/data-deletion-request" className="text-orange-600 hover:text-orange-700 font-medium underline">Data Deletion Request</a> page.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking Technologies</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We use cookies and similar technologies to:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Remember your preferences and settings</li>
                  <li>Analyze how you use our services</li>
                  <li>Provide personalized experiences</li>
                  <li>Ensure security and prevent fraud</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  You can control cookies through your browser settings, but this may affect the functionality of our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
                <p className="text-gray-700 leading-relaxed">
                  Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
                <p className="text-gray-700 leading-relaxed">
                  Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards to protect your information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Information</h2>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions about this Privacy Policy or our privacy practices, please contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg mt-4">
                  <p className="text-gray-700 font-medium">Email: privacy@mobelo.com</p>
                  <p className="text-gray-700 font-medium">Data Protection Officer: dpo@mobelo.com</p>
                  <p className="text-gray-700 font-medium">Address: mobelo Privacy Team</p>
                  <p className="text-gray-700">123 Innovation Drive, Tech City, TC 12345</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically for any changes.
                </p>
              </section>

            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                This privacy policy is effective as of the date listed above and will remain in effect until modified.
              </p>
              <div className="flex justify-center space-x-6 text-sm">
                <a href="/terms" className="text-orange-600 hover:text-orange-700 font-medium">
                  Terms of Service
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
