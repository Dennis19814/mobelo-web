'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail } from 'lucide-react'
import { Navigation, Footer } from '@/components/layout'

export default function DataDeletionRequestPage() {
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
              Data Deletion Request
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
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Right to Data Deletion</h2>
                <p className="text-gray-700 leading-relaxed">
                  At mobelo, we respect your privacy and your right to control your personal data. Under data protection regulations including GDPR (General Data Protection Regulation) and CCPA (California Consumer Privacy Act), you have the right to request the deletion of your personal information that we have collected through our website and mobile applications.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">What Data Can Be Deleted</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  When you submit a data deletion request, we can remove the following types of information:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Account registration information (email address, username, password)</li>
                  <li>Profile information and user preferences</li>
                  <li>App designs, content, and creative materials you have created</li>
                  <li>Communications with our support team</li>
                  <li>Usage data and analytics associated with your account</li>
                  <li>Device information and log files linked to your account</li>
                  <li>Marketing preferences and communication history</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">How to Request Data Deletion</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  To request the deletion of your personal data collected from our website or mobile applications, please contact us at:
                </p>

                <div className="bg-orange-50 border-2 border-orange-200 p-6 rounded-lg my-6">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-gray-900 font-semibold text-lg mb-2">Email Contact</p>
                      <a
                        href="mailto:info@mobelo.dev"
                        className="text-orange-600 hover:text-orange-700 font-medium text-xl transition-colors"
                      >
                        info@mobelo.dev
                      </a>
                      <p className="text-gray-600 text-sm mt-3">
                        Our data protection team will respond to your request within 30 days.
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">Information to Include in Your Request</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  To help us process your request efficiently, please include the following information:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Your full name as registered on your account</li>
                  <li>The email address associated with your mobelo account</li>
                  <li>A clear statement that you wish to delete your personal data</li>
                  <li>Any additional account identifiers (username, phone number if provided)</li>
                  <li>Confirmation that you are the account holder or authorized representative</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">What Happens After Your Request</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Once we receive your data deletion request:
                </p>
                <ol className="list-decimal list-inside text-gray-700 space-y-3 ml-4">
                  <li className="leading-relaxed">
                    <strong>Verification:</strong> We will verify your identity to protect your data from unauthorized deletion requests. This may require additional information or confirmation.
                  </li>
                  <li className="leading-relaxed">
                    <strong>Processing:</strong> Upon successful verification, we will process your request within 30 days and delete your personal information from our active systems.
                  </li>
                  <li className="leading-relaxed">
                    <strong>Confirmation:</strong> You will receive a confirmation email once your data has been deleted.
                  </li>
                  <li className="leading-relaxed">
                    <strong>Account Closure:</strong> Your mobelo account will be permanently closed and cannot be recovered after deletion.
                  </li>
                </ol>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Important Considerations</h2>

                <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">Data Retention Exceptions</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  While we will delete your personal data as requested, certain information may be retained for limited periods in the following circumstances:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Legal and regulatory compliance (tax records, transaction history)</li>
                  <li>Fraud prevention and security purposes</li>
                  <li>Resolution of disputes or enforcement of our agreements</li>
                  <li>Backup systems (data will be deleted from backups during regular cycles)</li>
                  <li>Anonymized or aggregated data that cannot identify you personally</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">Impact of Deletion</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Please be aware that deleting your data will result in:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Permanent loss of access to your mobelo account</li>
                  <li>Deletion of all app designs and projects you have created</li>
                  <li>Loss of subscription benefits and any remaining credits</li>
                  <li>Inability to recover any data after the deletion is complete</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4 italic">
                  We recommend exporting any important data or designs before submitting a deletion request.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Alternative Options</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you're concerned about your privacy but don't want to delete all your data, consider these alternatives:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li><strong>Account Deactivation:</strong> Temporarily deactivate your account while retaining your data</li>
                  <li><strong>Data Portability:</strong> Request a copy of your data in a portable format</li>
                  <li><strong>Privacy Settings:</strong> Adjust your privacy settings and communication preferences</li>
                  <li><strong>Selective Deletion:</strong> Request deletion of specific data categories rather than all data</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Questions or Concerns</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you have any questions about the data deletion process or need assistance with your request, please don't hesitate to contact us:
                </p>
                <div className="bg-gray-50 p-6 rounded-lg mt-4">
                  <p className="text-gray-700 mb-2">
                    <span className="font-semibold">Email:</span>{' '}
                    <a href="mailto:info@mobelo.dev" className="text-orange-600 hover:text-orange-700 font-medium">
                      info@mobelo.dev
                    </a>
                  </p>
                  <p className="text-gray-700 mb-2">
                    <span className="font-semibold">Privacy Inquiries:</span>{' '}
                    <a href="mailto:privacy@mobelo.com" className="text-orange-600 hover:text-orange-700 font-medium">
                      privacy@mobelo.com
                    </a>
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Data Protection Officer:</span>{' '}
                    <a href="mailto:dpo@mobelo.com" className="text-orange-600 hover:text-orange-700 font-medium">
                      dpo@mobelo.com
                    </a>
                  </p>
                </div>
              </section>

            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                This data deletion policy is effective as of the date listed above and is part of our commitment to data privacy compliance.
              </p>
              <div className="flex justify-center space-x-6 text-sm">
                <a href="/privacy" className="text-orange-600 hover:text-orange-700 font-medium">
                  Privacy Policy
                </a>
                <a href="/terms" className="text-orange-600 hover:text-orange-700 font-medium">
                  Terms of Service
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
