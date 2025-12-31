'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/layout'
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge, Button } from '@/components/ui'
import { apiService } from '@/lib/api-service'
import { Loader2, CreditCard, Download } from 'lucide-react'

type InvoiceRow = { id: string; number: string; date: string; amount: number; currency: string; status: string; pdfUrl?: string }

function statusBadge(status: string) {
  if (status === 'Paid') return <Badge variant="success" size="sm">Paid</Badge>
  if (status === 'Past Due') return <Badge variant="destructive" size="sm">Past Due</Badge>
  return <Badge variant="secondary" size="sm">{status}</Badge>
}

export default function BillingPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [pageLoading, setPageLoading] = useState(true)
  const limit = 5

  useEffect(() => {
    let mounted = true
    setLoading(true)
    apiService.getInvoices(currentPage, limit).then((res) => {
      if (res.ok && mounted) {
        setInvoices(res.data.data || [])
        setTotalPages(Math.ceil(res.data.total / limit))
      }
    }).catch(() => { }).finally(() => {
      if (mounted) {
        setLoading(false)
        setPageLoading(false)
      }
    })
    return () => { mounted = false }
  }, [currentPage])

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      <main className="flex-1">
        {pageLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
              <p className="text-sm text-gray-600">Loading billing information...</p>
            </div>
          </div>
        ) : (
          <section className="py-16 px-6">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-2xl font-semibold text-gray-900">Billing</h1>
              <p className="mt-2 text-sm text-gray-600">Manage your payment method and download invoices.</p>

              <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="border-2 border-gray-200 transition-all hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-orange-600" />
                      <CardTitle className="text-base">Payment method</CardTitle>
                    </div>
                    <CardDescription>Used for renewals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-900">Visa •••• 4242</div>
                      <div className="text-xs text-gray-500">Expires 08/28</div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      size="sm"
                      fullWidth
                      onClick={() => router.push('/account/billing/payment-method')}
                      className="hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300"
                    >
                      Update card
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="border-2 border-gray-200 lg:col-span-2 transition-all hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base">Invoices</CardTitle>
                    <CardDescription>Download your payment history</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto -mx-6 px-6">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="pb-3 text-left font-medium text-gray-600">Date</th>
                            <th className="pb-3 text-left font-medium text-gray-600">Invoice #</th>
                            <th className="pb-3 text-left font-medium text-gray-600">Amount</th>
                            <th className="pb-3 text-left font-medium text-gray-600">Status</th>
                            <th className="pb-3 text-right font-medium text-gray-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {loading ? (
                            <tr>
                              <td colSpan={5} className="py-12 text-center">
                                <div className="flex flex-col items-center gap-2">
                                  <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />
                                  <span className="text-sm text-gray-500">Loading invoices...</span>
                                </div>
                              </td>
                            </tr>
                          ) : invoices.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-12 text-center">
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                    <CreditCard className="w-6 h-6 text-gray-400" />
                                  </div>
                                  <span className="text-sm font-medium text-gray-900">No invoices yet</span>
                                  <span className="text-xs text-gray-500">Your invoices will appear here</span>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            invoices.map((inv) => (
                              <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                <td className="py-3 text-gray-700">{inv.date}</td>
                                <td className="py-3 text-gray-700 font-medium">{inv.number}</td>
                                <td className="py-3 text-gray-900 font-semibold">
                                  {(inv.amount / 100).toLocaleString(undefined, {
                                    style: 'currency',
                                    currency: inv.currency?.toUpperCase?.() || 'USD'
                                  })}
                                </td>
                                <td className="py-3">{statusBadge(inv.status)}</td>
                                <td className="py-3 text-right">
                                  {inv.pdfUrl ? (
                                    <a
                                      href={inv.pdfUrl}
                                      target="_blank"
                                      className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-700 hover:underline"
                                      rel="noreferrer"
                                    >
                                      <Download className="w-4 h-4" />
                                      Download
                                    </a>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    {totalPages > 1 && (
                      <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage <= 1 || loading}
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        >
                          Previous
                        </Button>
                        <span className="text-xs font-medium text-gray-600">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage >= totalPages || loading}
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
