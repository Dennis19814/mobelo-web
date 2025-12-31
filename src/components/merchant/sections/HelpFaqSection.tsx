'use client'

import { useState } from 'react'
import { Search, ChevronDown, ThumbsUp, ThumbsDown, ArrowLeft, ChevronRight } from 'lucide-react'

interface HelpFaqSectionProps {
  onNavigate?: (section: 'help-center') => void
}

interface FAQ {
  question: string
  answer: string
}

interface FAQCategory {
  id: string
  name: string
  color: string
  bgColor: string
  borderColor: string
  faqs: FAQ[]
}

export default function HelpFaqSection({ onNavigate }: HelpFaqSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedFAQs, setExpandedFAQs] = useState<Set<string>>(new Set())

  const categories: FAQCategory[] = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      faqs: [
        {
          question: 'How do I publish my app to production?',
          answer: 'To publish your app: 1) Complete all product setup in the merchant panel, 2) Configure your payment gateway (Stripe) in Settings, 3) Test thoroughly in sandbox mode, 4) Navigate to Settings > App Status and click "Publish to Production". Your app will be reviewed and published within 24 hours.'
        },
        {
          question: 'How do I customize my app\'s theme and branding?',
          answer: 'Go to Settings > App Appearance. Here you can customize: primary and secondary colors, logo and splash screen, font styles, button styles, and navigation layout. Changes are reflected instantly in the preview and take effect immediately in your published app.'
        },
        {
          question: 'What payment methods are supported out of the box?',
          answer: 'We support Stripe as the primary payment gateway, which includes: Credit/Debit cards (Visa, Mastercard, Amex), Apple Pay, Google Pay, and various regional payment methods. You can configure these in Settings > Payment Configuration.'
        },
        {
          question: 'How do I add my first product to the catalog?',
          answer: 'Navigate to Products > Product Catalog and click "Add Product". Fill in: product name, description, pricing, upload images (up to 5), select category and brand, set inventory levels, and add variants if needed (sizes, colors). Click Save to publish the product to your app.'
        },
        {
          question: 'Can I import products in bulk via CSV?',
          answer: 'Yes! Go to Products > Product Catalog and click "Import Products". Download our CSV template, fill in your product data (name, price, SKU, description, images, etc.), then upload the file. The system will validate and import your products. You can import up to 1,000 products at once.'
        }
      ]
    },
    {
      id: 'products-inventory',
      name: 'Products & Inventory',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      faqs: [
        {
          question: 'How do I create product variants (sizes, colors, materials)?',
          answer: 'When adding/editing a product, scroll to the "Variants" section. Click "Add Variant Group" and choose type (size, color, material, custom). Add variant options (e.g., Small, Medium, Large). Set individual pricing and SKUs for each combination. You can also upload variant-specific images.'
        },
        {
          question: 'How do I track inventory levels and stock?',
          answer: 'Go to Inventory to view real-time stock levels for all products and variants. The system automatically decrements inventory on order placement and increments on order cancellation. Set up low stock alerts in Settings > Inventory to receive notifications when items run low.'
        },
        {
          question: 'Can I set up low stock alerts and notifications?',
          answer: 'Yes. Navigate to Settings > Inventory Settings and enable "Low Stock Alerts". Set your threshold (e.g., 10 units) and choose notification methods: email, SMS, or in-app notifications. You\'ll be alerted when any product falls below the threshold.'
        },
        {
          question: 'How do I manage product reviews and ratings?',
          answer: 'Go to Products > Product Reviews to view all customer reviews. You can: approve/reject reviews, respond to customer feedback, flag inappropriate content, and view aggregate ratings. Reviews are automatically displayed on product pages in your app once approved.'
        },
        {
          question: 'What image formats and sizes are recommended for products?',
          answer: 'Recommended specs: Format: JPG, PNG, or WebP; Size: 1200x1200px (square) for best results; Max file size: 5MB per image; Upload 3-5 images per product showing different angles. Images are automatically optimized and served via CDN for fast loading.'
        },
        {
          question: 'How do I organize products into categories and subcategories?',
          answer: 'Navigate to Categories to create your category hierarchy. Click "Add Category" for main categories (e.g., Electronics, Clothing). To add subcategories, select a parent category and click "Add Subcategory". Assign products to categories when creating/editing products. You can also bulk reassign categories from the Products page.'
        }
      ]
    },
    {
      id: 'orders-fulfillment',
      name: 'Orders & Fulfillment',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      faqs: [
        {
          question: 'How do I process and fulfill customer orders?',
          answer: 'Go to Orders to view all incoming orders. Click on an order to view details. Process orders by: 1) Reviewing order items and customer info, 2) Updating status to "Processing", 3) Printing packing slip, 4) Preparing shipment, 5) Updating status to "Shipped" with tracking number. Customers receive automated email notifications at each stage.'
        },
        {
          question: 'Can I print packing slips and shipping labels?',
          answer: 'Yes. Open any order and click "Print Packing Slip" for a printable invoice with order details. For shipping labels, if you have integrated with a shipping provider (USPS, FedEx, UPS), you can generate labels directly. Otherwise, you can manually enter tracking information.'
        },
        {
          question: 'How do I handle returns, refunds, and cancellations?',
          answer: 'Open the order and click "Actions" > "Process Refund". Choose: full or partial refund, reason for refund, and whether to restock items. For returns, update order status to "Returned". The refund is processed through your payment gateway (Stripe) and customers are notified automatically. Inventory is updated if you selected restock.'
        },
        {
          question: 'What order statuses are available and what do they mean?',
          answer: 'Order statuses: Pending (payment received, awaiting processing), Processing (being prepared for shipment), Shipped (sent to customer with tracking), Delivered (confirmed delivery), Cancelled (order cancelled before shipping), Refunded (payment returned), Returned (items received back). Customers can track status in their app.'
        },
        {
          question: 'How do I configure shipping rates and zones?',
          answer: 'Go to Settings > Shipping Configuration. Create shipping zones (e.g., Local, National, International). For each zone, set rates based on: flat rate, weight-based, price-based, or free shipping over amount. You can also integrate with shipping carriers for real-time rates.'
        }
      ]
    },
    {
      id: 'customers-staff',
      name: 'Customers & Staff',
      color: 'text-purple-700',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      faqs: [
        {
          question: 'How do I view and manage customer information?',
          answer: 'Navigate to App Users to view all registered customers. You can: view customer profiles (name, email, phone, addresses), see order history and total spend, view saved carts and wishlists, export customer data to CSV, and send targeted marketing emails. Customer data is encrypted and GDPR compliant.'
        },
        {
          question: 'Can customers create accounts and save preferences?',
          answer: 'Yes. Customers can register via email, phone (SMS OTP), or social login (Google, Facebook, Apple). Once registered, they can: save multiple shipping addresses, store payment methods securely, track order history, save wishlists, and receive personalized recommendations.'
        },
        {
          question: 'How do I add staff members with limited permissions?',
          answer: 'Go to Team > Team Members and click "Add Staff Member". Enter their email and app ID, assign a role (Admin, Manager, Staff, Viewer). They\'ll receive an email with login instructions. Staff members use separate authentication and can only access features based on their assigned permissions.'
        },
        {
          question: 'What are the different staff roles (Admin, Manager, Staff, Viewer)?',
          answer: 'Admin: Full access including refunds, deletions, and customer blocking. Manager: Most features except refunds and permanent deletions. Staff: Basic operations like products, inventory, and viewing orders. Viewer: Read-only access to all sections. You can customize permissions per role in Team > Team Roles.'
        },
        {
          question: 'Can I block or ban problematic customers?',
          answer: 'Yes (Admin only). In App Users, select a customer and click "Actions" > "Block Customer". This prevents them from placing new orders. Existing orders remain intact. You can also report suspicious activity for fraud detection. Unblock customers anytime from the same menu.'
        },
        {
          question: 'How do I export customer data for marketing?',
          answer: 'Go to App Users, apply any filters (e.g., customers who ordered in last 30 days), then click "Export to CSV". The export includes: email, name, phone, total orders, total spent, last order date, and registration date. Use this data for email marketing campaigns (ensure GDPR compliance).'
        }
      ]
    },
    {
      id: 'payments-taxes',
      name: 'Payments & Taxes',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      faqs: [
        {
          question: 'How do I connect my Stripe payment gateway?',
          answer: 'Go to Settings > Payment Configuration. Click "Connect Stripe" and you\'ll be redirected to Stripe\'s secure connection page. Authorize the connection and you\'ll be returned to the merchant panel. Your API keys are securely encrypted. Enable test mode for sandbox testing before going live.'
        },
        {
          question: 'Are test payments supported before going live?',
          answer: 'Absolutely! In Settings > Payment Configuration, enable "Sandbox Mode". Use Stripe test card numbers (4242 4242 4242 4242) to place test orders without real charges. All test orders are clearly marked in the Orders section. Switch to production mode when you\'re ready to accept real payments.'
        },
        {
          question: 'How do I set up tax categories and tax rules?',
          answer: 'Go to Taxes > Tax Categories to create categories (Electronics, Food, Clothing, etc.). Then go to Taxes > Tax Rules to define rules: select category, set percentage or fixed amount, choose geographic targeting (country, state), and set compound tax if needed. Taxes are automatically calculated at checkout.'
        },
        {
          question: 'Can I create compound taxes (tax-on-tax like GST+PST)?',
          answer: 'Yes. In Taxes > Tax Rules, create your first tax rule (e.g., GST 5%). Then create a second rule (e.g., PST 7%) and enable "Compound Tax". This calculates the second tax on the subtotal including the first tax. Common for Canadian provinces and other regions with layered tax systems.'
        },
        {
          question: 'How do I create and manage discount coupons and promotions?',
          answer: 'Navigate to Coupons and click "Create Coupon". Set: coupon code, discount type (percentage or fixed amount), minimum purchase amount, valid date range, usage limits (per customer or total), and applicable products/categories. Active coupons are automatically applied at checkout when customers enter the code.'
        }
      ]
    },
    {
      id: 'analytics-reports',
      name: 'Analytics & Reports',
      color: 'text-cyan-700',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
      faqs: [
        {
          question: 'What metrics are available in the analytics dashboard?',
          answer: 'The Dashboard shows: Sales (revenue, orders, AOV), Customers (new, returning, lifetime value), Products (top sellers, low stock), Conversion (cart abandonment, checkout completion), App Users (registrations, active users), Reviews (average rating, recent reviews), and Operations (pending orders, refund requests). All metrics are real-time.'
        },
        {
          question: 'Can I export sales reports to CSV or Excel?',
          answer: 'Yes. In the Dashboard, select your date range and click "Export Report". Choose format (CSV or Excel) and data to include: sales summary, detailed orders, customer breakdown, or product performance. Reports are generated instantly and downloaded to your device.'
        },
        {
          question: 'How do I track conversion rates and customer behavior?',
          answer: 'Go to Dashboard and scroll to the Conversion section. View: cart abandonment rate, checkout completion rate, average time to purchase, and bounce rates. Click "View Details" for deeper insights like drop-off points in checkout, popular entry pages, and customer journey analytics.'
        },
        {
          question: 'What time periods can I view analytics for?',
          answer: 'Choose from 8 time periods: Today, Last 7 Days, Last 30 Days, Last 90 Days, This Month, Last Month, Last 12 Months, or Custom Date Range. All charts and metrics update instantly when you change the period. Compare periods to track growth trends.'
        }
      ]
    },
    {
      id: 'mobile-app-settings',
      name: 'Mobile App Settings',
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      faqs: [
        {
          question: 'How do I configure push notifications for customers?',
          answer: 'Go to Settings > Notifications and enable "Push Notifications". Configure notification triggers: order updates, abandoned cart reminders, new product alerts, and promotional messages. Customize message templates and timing. Customers can opt-in/out in their app settings. Requires app submission to Apple/Google for certification.'
        },
        {
          question: 'Can I enable SMS verification and two-factor auth?',
          answer: 'Yes. Navigate to Settings > SMS Configuration. Connect your Twilio account (SMS provider). Enable "SMS Verification" for customer logins and "Two-Factor Authentication" for staff accounts. Customers receive OTP codes for login, and staff members get 2FA codes for enhanced security.'
        },
        {
          question: 'How do I set up automated email notifications?',
          answer: 'Go to Settings > Email Configuration. Connect your email provider (Brevo, SendGrid, or Mailgun). Configure automatic emails for: order confirmation, shipping updates, delivery confirmation, password resets, and account verification. Customize email templates with your branding and logo.'
        },
        {
          question: 'What\'s the difference between sandbox and production mode?',
          answer: 'Sandbox mode is for testing with fake data and test payment cards - no real charges occur. Production mode processes real orders and payments. In sandbox, all features work identically but orders are marked as "Test". Always test thoroughly in sandbox before switching to production in Settings > App Status.'
        },
        {
          question: 'How do I update my app\'s logo, colors, and splash screen?',
          answer: 'Navigate to Settings > App Appearance. Upload logo (PNG, 512x512px), choose primary and accent colors using the color picker, upload splash screen (PNG, 1242x2688px for best quality). Changes preview in real-time. Click "Save Changes" to update your published app. Updates take effect within 5 minutes.'
        }
      ]
    },
    {
      id: 'troubleshooting',
      name: 'Troubleshooting',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      faqs: [
        {
          question: 'Why aren\'t my products showing in the mobile app?',
          answer: 'Check: 1) Product status is "Active" (not Draft), 2) Product is assigned to at least one category, 3) Product has at least one image, 4) Inventory is not zero (if track inventory is enabled), 5) App is published to production mode. Refresh your app and check the specific category where the product should appear.'
        },
        {
          question: 'Orders aren\'t syncing - what should I check first?',
          answer: 'Verify: 1) Internet connection is stable, 2) API keys are valid (Settings > API Keys), 3) App secret key is correctly configured, 4) Payment gateway (Stripe) is connected and active, 5) No server errors in Activity log. If issues persist, check the browser console for error messages or contact support.'
        },
        {
          question: 'How do I reset or regenerate my API keys?',
          answer: 'Go to Settings > API Keys and click "Regenerate Keys". WARNING: This immediately invalidates old keys and may break existing integrations. Update your mobile app configuration with new keys within the same session. Store keys securely - they grant full access to your app data.'
        },
        {
          question: 'Why are tax calculations showing incorrect amounts?',
          answer: 'Common causes: 1) Tax rules not properly configured for customer\'s location, 2) Tax category not assigned to products, 3) Compound tax settings incorrect, 4) Customer address missing state/province. Review Taxes > Tax Rules and ensure geographic targeting matches customer locations. Test with sample orders to verify.'
        },
        {
          question: 'My product images aren\'t loading - what went wrong?',
          answer: 'Check: 1) Image format is JPG, PNG, or WebP (not TIFF, BMP), 2) File size under 5MB, 3) Images uploaded successfully (check for upload errors), 4) CDN is not blocked by firewall/adblocker, 5) Clear browser cache. Re-upload images if needed. Images are served from CloudFront CDN - regional issues may cause temporary delays.'
        }
      ]
    }
  ]

  const toggleFAQ = (categoryId: string, faqIndex: number) => {
    const key = `${categoryId}-${faqIndex}`
    setExpandedFAQs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const isFAQExpanded = (categoryId: string, faqIndex: number) => {
    return expandedFAQs.has(`${categoryId}-${faqIndex}`)
  }

  const filteredCategories = categories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq =>
      (selectedCategory === 'all' || selectedCategory === category.id) &&
      (searchQuery === '' ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })).filter(category => category.faqs.length > 0)

  const totalFAQs = categories.reduce((sum, cat) => sum + cat.faqs.length, 0)

  return (
    <div className="max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <button
        onClick={() => onNavigate && onNavigate('help-center')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm">Back to Help Center</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h1>
          <span className="px-3 py-1 bg-blue-100 text-orange-700 rounded-full text-sm font-medium">
            {totalFAQs} Articles
          </span>
        </div>
        <p className="text-gray-600">
          Find answers to common questions about using the platform
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search FAQs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            selectedCategory === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Categories
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedCategory === category.id
                ? `${category.bgColor} ${category.color} border ${category.borderColor}`
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* FAQ Categories */}
      <div className="space-y-8">
        {filteredCategories.map((category) => (
          <div key={category.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className={`${category.bgColor} border-l-4 ${category.borderColor} px-6 py-4`}>
              <h2 className={`text-xl font-bold ${category.color}`}>
                {category.name}
                <span className="ml-2 text-sm font-normal opacity-75">
                  ({category.faqs.length} {category.faqs.length === 1 ? 'question' : 'questions'})
                </span>
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {category.faqs.map((faq, index) => {
                const isExpanded = isFAQExpanded(category.id, index)
                return (
                  <div key={index}>
                    <button
                      onClick={() => toggleFAQ(category.id, index)}
                      className="w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors flex-1">
                          {faq.question}
                        </h3>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-4">
                        <div className={`pl-4 border-l-2 ${category.borderColor}`}>
                          <p className="text-gray-700 leading-relaxed">{faq.answer}</p>

                          {/* Feedback */}
                          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                            <span className="text-sm text-gray-500">Was this helpful?</span>
                            <div className="flex gap-2">
                              <button className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm text-gray-600 hover:bg-green-50 hover:text-green-600 transition-colors">
                                <ThumbsUp className="w-4 h-4" />
                                <span>Yes</span>
                              </button>
                              <button className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                                <ThumbsDown className="w-4 h-4" />
                                <span>No</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search or browse all categories
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('all')
            }}
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-12 text-center">
        <p className="text-gray-500">
          Still have questions?{' '}
          <a href="#" className="text-orange-600 hover:text-orange-700 font-medium">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  )
}
