import { MetadataRoute } from 'next'

// Force static generation so lastModified is set at build time, not per-request
export const dynamic = 'force-static'

const BASE_URL = 'https://mobelo.dev'

// Stable date for pages that rarely change
const STABLE_DATE = new Date('2025-12-26')

export default function sitemap(): MetadataRoute.Sitemap {
  const buildDate = new Date()

  return [
    {
      url: `${BASE_URL}/`,
      lastModified: buildDate,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: buildDate,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/app-builder`,
      lastModified: buildDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/app-spec`,
      lastModified: buildDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: STABLE_DATE,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: STABLE_DATE,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
