'use client'

import { useState } from 'react'
import { PlayCircle, Clock, ArrowLeft, Filter } from 'lucide-react'

interface HelpTutorialsSectionProps {
  onNavigate?: (section: 'help-center') => void
}

interface Tutorial {
  title: string
  duration: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  views?: number
  rating?: number
  comingSoon?: boolean
}

interface TutorialCategory {
  id: string
  name: string
  color: string
  bgColor: string
  tutorials: Tutorial[]
}

export default function HelpTutorialsSection({ onNavigate }: HelpTutorialsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'duration'>('newest')

  const categories: TutorialCategory[] = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      color: 'text-orange-700',
      bgColor: 'bg-orange-500',
      tutorials: [
        {
          title: 'Setting Up Your First Mobile App',
          duration: '5:30',
          difficulty: 'Beginner',
          views: 12453,
          rating: 4.8
        },
        {
          title: 'Customizing Your App Theme, Colors & Branding',
          duration: '8:45',
          difficulty: 'Beginner',
          views: 9821,
          rating: 4.9
        },
        {
          title: 'Publishing Your App to Production Mode',
          duration: '6:15',
          difficulty: 'Beginner',
          views: 8234,
          rating: 4.7
        }
      ]
    },
    {
      id: 'product-management',
      name: 'Product Management',
      color: 'text-green-700',
      bgColor: 'bg-green-500',
      tutorials: [
        {
          title: 'Adding and Managing Your Product Catalog',
          duration: '12:20',
          difficulty: 'Beginner',
          views: 15678,
          rating: 4.9
        },
        {
          title: 'Creating Product Variants, Options & SKUs',
          duration: '9:40',
          difficulty: 'Intermediate',
          views: 7432,
          rating: 4.6
        },
        {
          title: 'Bulk Product Import and Export with CSV',
          duration: '7:55',
          difficulty: 'Intermediate',
          views: 5621,
          rating: 4.5
        }
      ]
    },
    {
      id: 'order-processing',
      name: 'Order Processing',
      color: 'text-orange-700',
      bgColor: 'bg-orange-500',
      tutorials: [
        {
          title: 'Processing Orders from Start to Finish',
          duration: '11:30',
          difficulty: 'Beginner',
          views: 11234,
          rating: 4.8
        },
        {
          title: 'Managing Returns, Refunds & Cancellations',
          duration: '8:20',
          difficulty: 'Intermediate',
          views: 6543,
          rating: 4.7
        }
      ]
    },
    {
      id: 'team-permissions',
      name: 'Team & Permissions',
      color: 'text-purple-700',
      bgColor: 'bg-purple-500',
      tutorials: [
        {
          title: 'Adding Staff Members and Assigning Roles',
          duration: '10:15',
          difficulty: 'Advanced',
          views: 4321,
          rating: 4.6
        },
        {
          title: 'Understanding Permission Levels and RBAC',
          duration: '6:45',
          difficulty: 'Advanced',
          views: 3876,
          rating: 4.7
        }
      ]
    },
    {
      id: 'payment-setup',
      name: 'Payment Setup',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-500',
      tutorials: [
        {
          title: 'Connecting Stripe Payment Gateway',
          duration: '9:30',
          difficulty: 'Intermediate',
          views: 9654,
          rating: 4.8
        },
        {
          title: 'Configuring Taxes, Coupons & Discounts',
          duration: '13:25',
          difficulty: 'Intermediate',
          views: 7123,
          rating: 4.6
        }
      ]
    },
    {
      id: 'settings-configuration',
      name: 'Settings & Configuration',
      color: 'text-pink-700',
      bgColor: 'bg-pink-500',
      tutorials: [
        {
          title: 'App Settings: Notifications, SMS & Email Setup',
          duration: '12:45',
          difficulty: 'Intermediate',
          views: 5432,
          rating: 4.7
        },
        {
          title: 'Configuring Payment Methods and Currency',
          duration: '8:20',
          difficulty: 'Intermediate',
          views: 4876,
          rating: 4.5
        },
        {
          title: 'Advanced Settings: API Keys, Webhooks & Integrations',
          duration: '15:30',
          difficulty: 'Advanced',
          views: 3210,
          rating: 4.8,
          comingSoon: true
        }
      ]
    },
    {
      id: 'analytics-growth',
      name: 'Analytics & Growth',
      color: 'text-cyan-700',
      bgColor: 'bg-cyan-500',
      tutorials: [
        {
          title: 'Understanding Your Dashboard Metrics & KPIs',
          duration: '14:10',
          difficulty: 'Intermediate',
          views: 6789,
          rating: 4.9
        },
        {
          title: 'Using Analytics to Grow Your E-commerce Business',
          duration: '16:50',
          difficulty: 'Advanced',
          views: 4321,
          rating: 4.7,
          comingSoon: true
        }
      ]
    },
    {
      id: 'advanced-features',
      name: 'Advanced Features',
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-500',
      tutorials: [
        {
          title: 'Mobile App Push Notifications & Deep Linking',
          duration: '10:35',
          difficulty: 'Advanced',
          views: 3654,
          rating: 4.6,
          comingSoon: true
        }
      ]
    }
  ]

  const allTutorials = categories.flatMap(cat =>
    cat.tutorials.map(tutorial => ({
      ...tutorial,
      category: cat.name,
      categoryColor: cat.bgColor
    }))
  )

  const filteredTutorials = allTutorials.filter(tutorial =>
    selectedCategory === 'all' ||
    categories.find(cat => cat.id === selectedCategory)?.tutorials.includes(tutorial as any)
  )

  const sortedTutorials = [...filteredTutorials].sort((a, b) => {
    if (sortBy === 'popular') {
      return (b.views || 0) - (a.views || 0)
    } else if (sortBy === 'duration') {
      const [aMin, aSec] = a.duration.split(':').map(Number)
      const [bMin, bSec] = b.duration.split(':').map(Number)
      return (aMin * 60 + aSec) - (bMin * 60 + bSec)
    }
    return 0 // newest (default order)
  })

  const totalDuration = allTutorials.reduce((sum, tutorial) => {
    const [min, sec] = tutorial.duration.split(':').map(Number)
    return sum + min * 60 + sec
  }, 0)

  const hours = Math.floor(totalDuration / 3600)
  const minutes = Math.floor((totalDuration % 3600) / 60)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-700'
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-700'
      case 'Advanced':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <button
        onClick={() => onNavigate && onNavigate('help-center')}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm">Back to Help Center</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-3xl font-bold text-slate-900">Video Tutorials</h1>
          <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">
            {allTutorials.length} Videos
          </span>
        </div>
        <p className="text-slate-600 mb-4">
          Step-by-step video guides to help you master the platform
        </p>

        {/* Total Watch Time */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-full">
          <Clock className="w-4 h-4 text-teal-600" />
          <span className="text-sm font-medium text-teal-900">
            {hours}h {minutes}m total content
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Category Filters */}
        <div className="flex-1 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === category.id
                  ? `${category.bgColor} text-white`
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="newest">Newest</option>
            <option value="popular">Most Popular</option>
            <option value="duration">Duration</option>
          </select>
        </div>
      </div>

      {/* Tutorials Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedTutorials.map((tutorial, index) => (
          <div
            key={index}
            className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${tutorial.categoryColor} opacity-80`}></div>

              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all duration-300 shadow-lg">
                  <PlayCircle className="w-8 h-8 text-gray-900" />
                </div>
              </div>

              {/* Duration Badge */}
              <div className="absolute top-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-white text-xs font-medium">
                {tutorial.duration}
              </div>

              {/* Coming Soon Badge */}
              {tutorial.comingSoon && (
                <div className="absolute top-3 left-3 px-3 py-1 bg-yellow-400 text-yellow-900 rounded-lg text-xs font-bold shadow-md">
                  Coming Soon
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-5">
              {/* Category & Difficulty */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-1 ${tutorial.categoryColor} text-white rounded-md text-xs font-medium`}>
                  {tutorial.category}
                </span>
                <span className={`px-2 py-1 ${getDifficultyColor(tutorial.difficulty)} rounded-md text-xs font-medium`}>
                  {tutorial.difficulty}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-slate-900 mb-3 line-clamp-2 group-hover:text-teal-600 transition-colors">
                {tutorial.title}
              </h3>


              {/* Action Button */}
              <button
                className={`mt-4 w-full py-2 px-4 rounded-lg font-medium transition-all ${
                  tutorial.comingSoon
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-teal-600 text-white hover:bg-teal-700'
                }`}
                disabled={tutorial.comingSoon}
              >
                {tutorial.comingSoon ? 'Coming Soon' : 'Watch Now'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {sortedTutorials.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PlayCircle className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No tutorials found</h3>
          <p className="text-slate-600 mb-4">
            Try selecting a different category
          </p>
          <button
            onClick={() => setSelectedCategory('all')}
            className="text-teal-600 hover:text-teal-700 font-medium"
          >
            View all tutorials
          </button>
        </div>
      )}

    </div>
  )
}
