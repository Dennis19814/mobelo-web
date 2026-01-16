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
      id: 'general',
      name: 'General Questions',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      faqs: [
        {
          question: 'How long does it take to launch?',
          answer: 'Mobelo generates your complete mobile app in 4-8 minutes. You can refine it using simple prompts and publish with a few clicks. App Store and Play Store approvals may take a few days and are subject to their review processes, which are outside Mobelo\'s control.'
        },
        {
          question: 'Do I need design or coding skills?',
          answer: 'No design or coding skills are required. Mobelo uses premium layouts, follows industry standards, and builds fully functional features, so you can launch without any technical expertise.'
        },
        {
          question: 'Can I publish to both iOS and Android?',
          answer: 'Yes. You can publish your app to both iOS and Android, and book a support session with our team for hands-on assistance if needed.'
        },
        {
          question: 'Can I use my own products and content?',
          answer: 'Yes. You have full control over your app\'s products and content. Manage products, orders, inventory, and more through the merchant panel.'
        },
        {
          question: 'Are there any hidden or upfront costs?',
          answer: 'No. There are no hidden or upfront costs. You only pay a monthly fee plus a sales-based commission, ranging from 0.4% to a maximum of 1%, depending on your plan.'
        }
      ]
    },
    {
      id: 'ownership-features',
      name: 'Ownership & Features',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      faqs: [
        {
          question: 'Who owns the app and source code?',
          answer: 'You own your mobile app and its source code. You can export the full source code at any time.'
        },
        {
          question: 'Is the app production-ready or just a demo?',
          answer: 'Mobelo builds fully production-ready mobile apps designed for real users, real traffic, and real transactions.'
        },
        {
          question: 'Can I customize the design and features later?',
          answer: 'Yes. You can customize layouts, styles, colors, and features at any time using simple prompts or the merchant panel.'
        },
        {
          question: 'What happens if I cancel my subscription?',
          answer: 'You can cancel at any time. Your app will stop receiving updates and managed services, but your data and source code remain yours.'
        },
        {
          question: 'Does Mobelo handle hosting and infrastructure?',
          answer: 'Yes. Mobelo provides fully managed infrastructure, including hosting, updates, monitoring, and maintenance.'
        }
      ]
    },
    {
      id: 'technical-support',
      name: 'Technical & Support',
      color: 'text-purple-700',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      faqs: [
        {
          question: 'Can Mobelo handle high traffic and large order volumes?',
          answer: 'Yes. Mobelo is built on scalable infrastructure designed to handle growth from launch to high transaction volumes.'
        },
        {
          question: 'Is Mobelo secure?',
          answer: 'Yes. Mobelo follows enterprise-grade security best practices to protect user data, payments, and platform operations.'
        },
        {
          question: 'Is Mobelo GDPR compliant?',
          answer: 'Yes. Mobelo is designed with GDPR compliance in mind, including data handling and privacy controls.'
        },
        {
          question: 'Do you provide onboarding or launch support?',
          answer: 'Yes. We offer guided onboarding and 1-on-1 app launch support depending on your plan.'
        },
        {
          question: 'What kind of support do you offer?',
          answer: 'Mobelo offers email and chat support, with priority and dedicated support available on higher plans.'
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
          question: 'How do I add products to my app?',
          answer: 'Navigate to the Products section in your merchant panel, click "Add Product", and fill in the product details including name, description, price, and images. Products are instantly synced to your mobile app.'
        },
        {
          question: 'Can I add product variants (sizes, colors, etc.)?',
          answer: 'Yes. When creating or editing a product, you can add variants such as sizes, colors, or any custom options. Each variant can have its own price and inventory tracking.'
        },
        {
          question: 'How do I organize products into categories?',
          answer: 'In the Products section, you can create and manage categories. Assign products to categories during product creation or editing. Categories help customers browse your app more easily.'
        },
        {
          question: 'How does inventory tracking work?',
          answer: 'Mobelo automatically tracks inventory levels for each product and variant. When customers place orders, inventory is automatically decremented. You can set up low-stock alerts and manage stock levels from the merchant panel.'
        },
        {
          question: 'Can I import products in bulk?',
          answer: 'Yes. You can use the bulk import feature to upload multiple products at once using a CSV file. This is useful when migrating from another platform or adding many products quickly.'
        },
        {
          question: 'What image formats and sizes are recommended for products?',
          answer: 'We recommend using high-quality JPG or PNG images with a minimum resolution of 1000x1000 pixels. Square images work best for consistent display across your app.'
        }
      ]
    },
    {
      id: 'orders-fulfillment',
      name: 'Orders & Fulfillment',
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      faqs: [
        {
          question: 'How do I manage and fulfill orders?',
          answer: 'All orders appear in the Orders section of your merchant panel. You can view order details, update status (processing, shipped, delivered), add tracking information, and communicate with customers directly.'
        },
        {
          question: 'Can I set up different shipping options?',
          answer: 'Yes. You can configure multiple shipping methods with different rates, delivery times, and availability by region. Customers can choose their preferred shipping method at checkout.'
        },
        {
          question: 'How do I handle refunds and cancellations?',
          answer: 'You can process full or partial refunds directly from the order details page. Refunds are automatically processed through your payment gateway, and inventory is adjusted accordingly.'
        },
        {
          question: 'What notifications do customers receive about their orders?',
          answer: 'Customers receive automated push notifications and emails for order confirmation, shipping updates, and delivery. You can customize these notification templates in your settings.'
        },
        {
          question: 'Can I print packing slips and shipping labels?',
          answer: 'Yes. From the order details page, you can generate and print packing slips. If you integrate with shipping carriers, you can also generate shipping labels directly.'
        }
      ]
    },
    {
      id: 'payments-stripe',
      name: 'Payments & Stripe',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      faqs: [
        {
          question: 'How do I set up Stripe payments?',
          answer: 'Go to Settings > Payment Methods and connect your Stripe account. You\'ll need to complete Stripe\'s onboarding process. Once connected, your app can accept credit cards, Apple Pay, and Google Pay.'
        },
        {
          question: 'When do I receive payments from orders?',
          answer: 'Payments are processed through Stripe and follow Stripe\'s payout schedule (typically 2-7 business days). You can view your payout schedule and transaction history in your Stripe dashboard.'
        },
        {
          question: 'What payment methods can customers use?',
          answer: 'Customers can pay using credit/debit cards (Visa, Mastercard, Amex), Apple Pay, Google Pay, and other payment methods supported by Stripe in your region.'
        },
        {
          question: 'How are transaction fees calculated?',
          answer: 'Stripe charges standard payment processing fees (typically 2.9% + $0.30 per transaction). Mobelo\'s platform fee ranges from 0.4% to 1% depending on your subscription plan.'
        },
        {
          question: 'Can I offer discount codes or promotions?',
          answer: 'Yes. You can create discount codes with percentage or fixed-amount discounts, set validity periods, usage limits, and minimum order requirements from the Promotions section.'
        },
        {
          question: 'Is my payment information secure?',
          answer: 'Yes. All payment processing is handled securely by Stripe, a PCI-DSS compliant payment processor. Mobelo never stores or has access to customer credit card information.'
        }
      ]
    },
    {
      id: 'customization-branding',
      name: 'Customization & Branding',
      color: 'text-rose-700',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      faqs: [
        {
          question: 'How do I customize my app\'s appearance?',
          answer: 'Use the App Customization section to modify colors, fonts, logos, and layouts. You can also use natural language prompts to describe changes you want, and the AI will update your app accordingly.'
        },
        {
          question: 'Can I change the app icon and splash screen?',
          answer: 'Yes. Upload your custom app icon and splash screen images in the Branding settings. Make sure to use the recommended dimensions for best results across all devices.'
        },
        {
          question: 'How do I add my logo and brand colors?',
          answer: 'In Settings > Branding, upload your logo and set your primary and secondary brand colors. These will be applied consistently throughout your app\'s interface.'
        },
        {
          question: 'Can I customize the navigation and menu structure?',
          answer: 'Yes. You can rearrange menu items, add custom pages, and configure your app\'s navigation structure to match your business needs and improve user experience.'
        },
        {
          question: 'What legal documents do I need to provide?',
          answer: 'You must provide Terms and Conditions and a Privacy Policy for your app. You can create and edit these documents directly in Settings > Legal Documents. These are required for app store submissions.'
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
    <div className="max-w-5xl mx-auto overflow-x-hidden min-w-0">
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
