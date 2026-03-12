import { fetchAllPortfolioItems } from '@/lib/portfolio-client'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const portfolioData = await fetchAllPortfolioItems()
    
    return NextResponse.json({
      socialMedia: portfolioData.socialMedia,
      drone: portfolioData.drone,
      portfolio: portfolioData.portfolio,
      all: portfolioData.all,
      stats: {
        totalItems: portfolioData.all.length,
        socialMediaCount: portfolioData.socialMedia.length,
        droneCount: portfolioData.drone.length,
        portfolioCount: portfolioData.portfolio.length
      }
    })
  } catch (error) {
    console.error('Error fetching portfolio:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch portfolio',
      socialMedia: [],
      drone: [],
      portfolio: [],
      all: [],
      stats: {
        totalItems: 0,
        socialMediaCount: 0,
        droneCount: 0,
        portfolioCount: 0
      }
    }, { status: 500 })
  }
}
