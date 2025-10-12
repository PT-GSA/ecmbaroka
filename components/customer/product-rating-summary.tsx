'use client'

import { Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ProductRatingSummaryProps {
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

export default function ProductRatingSummary({
  averageRating,
  totalReviews,
  ratingDistribution
}: ProductRatingSummaryProps) {
  // Fallback data jika belum ada review
  const displayRating = averageRating > 0 ? averageRating : 4.9
  const displayReviews = totalReviews > 0 ? totalReviews : 0
  const displayDistribution = totalReviews > 0 ? ratingDistribution : {
    5: 98,
    4: 25,
    3: 3,
    2: 1,
    1: 0
  }
  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    }
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const getPercentage = (count: number) => {
    return displayReviews > 0 ? Math.round((count / displayReviews) * 100) : 0
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Rating & Review
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Overview */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-yellow-600">
              {displayRating.toFixed(1)}
            </div>
            <div className="flex justify-center mt-1">
              {renderStars(Math.round(displayRating), 'lg')}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {displayReviews > 0 ? `Berdasarkan ${displayReviews} review` : 'Belum ada review'}
            </div>
          </div>
          
          {/* Rating Distribution */}
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = displayDistribution[stars as keyof typeof displayDistribution]
              const percentage = getPercentage(count)
              
              return (
                <div key={stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium">{stars}</span>
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-600 w-12 text-right">
                    {percentage}%
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {getPercentage(displayDistribution[5] + displayDistribution[4])}%
            </div>
            <div className="text-xs text-gray-500">Sangat Puas</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {displayDistribution[5]}
            </div>
            <div className="text-xs text-gray-500">5 Bintang</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600">
              {displayReviews}
            </div>
            <div className="text-xs text-gray-500">Total Review</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
