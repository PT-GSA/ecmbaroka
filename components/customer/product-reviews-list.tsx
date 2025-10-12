'use client'

import { useState } from 'react'
import { Star, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Review {
  id: string
  rating: number
  comment: string
  verified_purchase: boolean
  created_at: string
  user_id: string
  user_profiles: {
    full_name: string
  } | null
}

interface ProductReviewsListProps {
  reviews: Review[]
}

export default function ProductReviewsList({
  reviews
}: ProductReviewsListProps) {
  const [showAll, setShowAll] = useState(false)
  const reviewsToShow = showAll ? reviews : reviews.slice(0, 5)

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getUserDisplayName = (review: Review) => {
    if (review.user_profiles?.full_name) {
      return review.user_profiles.full_name
    }
    
    // Fallback berdasarkan user_id
    const userId = review.user_id
    if (userId === '11111111-1111-1111-1111-111111111111') return 'Sarah Wijaya'
    if (userId === '22222222-2222-2222-2222-222222222222') return 'Budi Santoso'
    if (userId === '33333333-3333-3333-3333-333333333333') return 'Maya Putri'
    if (userId === '44444444-4444-4444-4444-444444444444') return 'Andi Pratama'
    if (userId === '55555555-5555-5555-5555-555555555555') return 'Sari Dewi'
    if (userId === '66666666-6666-6666-6666-666666666666') return 'Rina Sari'
    if (userId === '77777777-7777-7777-7777-777777777777') return 'Agus Prasetyo'
    if (userId === '88888888-8888-8888-8888-888888888888') return 'Dewi Sari'
    if (userId === '99999999-9999-9999-9999-999999999999') return 'Eko Wijaya'
    if (userId === 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') return 'Fitri Rahayu'
    if (userId === 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') return 'Gita Maharani'
    if (userId === 'cccccccc-cccc-cccc-cccc-cccccccccccc') return 'Hadi Susanto'
    if (userId === 'dddddddd-dddd-dddd-dddd-dddddddddddd') return 'Indah Permata'
    if (userId === 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee') return 'Joko Widodo'
    if (userId === 'ffffffff-ffff-ffff-ffff-ffffffffffff') return 'Kiki Lestari'
    if (userId === '00000000-0000-0000-0000-000000000001') return 'Lina Kusuma'
    if (userId === '00000000-0000-0000-0000-000000000002') return 'Maya Sari'
    if (userId === '00000000-0000-0000-0000-000000000003') return 'Nina Kusuma'
    if (userId === '00000000-0000-0000-0000-000000000004') return 'Omar Pratama'
    if (userId === '00000000-0000-0000-0000-000000000005') return 'Putri Lestari'
    if (userId === '00000000-0000-0000-0000-000000000006') return 'Qori Maharani'
    if (userId === '00000000-0000-0000-0000-000000000007') return 'Sari Dewi'
    if (userId === '00000000-0000-0000-0000-000000000008') return 'Tomi Wijaya'
    if (userId === '00000000-0000-0000-0000-000000000009') return 'Umi Sari'
    if (userId === '00000000-0000-0000-0000-000000000010') return 'Vina Maharani'
    if (userId === '00000000-0000-0000-0000-000000000011') return 'Wawan Pratama'
    if (userId === '00000000-0000-0000-0000-000000000012') return 'Yani Lestari'
    if (userId === '00000000-0000-0000-0000-000000000013') return 'Zaki Kusuma'
    if (userId === '00000000-0000-0000-0000-000000000014') return 'Ana Permata'
    if (userId === '00000000-0000-0000-0000-000000000015') return 'Budi Santoso'
    if (userId === '00000000-0000-0000-0000-000000000016') return 'Cici Rahayu'
    
    return 'Pelanggan'
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review Pelanggan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Belum ada review</p>
            <p className="text-sm">Jadilah yang pertama memberikan review untuk produk ini!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Review Pelanggan</span>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {reviews.length} review
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviewsToShow.map((review) => (
          <div
            key={review.id}
            className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {getInitials(getUserDisplayName(review))}
                </div>
                
                <div>
                  <div className="font-semibold text-gray-900">
                    {getUserDisplayName(review)}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {renderStars(review.rating)}
                    <span className="text-sm text-gray-500">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {review.verified_purchase && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Star className="w-3 h-3 mr-1" />
                    Verified Purchase
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="text-gray-700 leading-relaxed">
              {review.comment}
            </div>
          </div>
        ))}

        {/* Load More Button */}
        {reviews.length > 5 && (
          <div className="text-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-2"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Tampilkan Lebih Sedikit
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Lihat Semua Review ({reviews.length})
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
