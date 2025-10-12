'use client'

import { useState } from 'react'
import { Star, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ProductReviewFormProps {
  productId: string
  productName: string
}

export default function ProductReviewForm({
  productId,
  productName
}: ProductReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      alert('Pilih rating terlebih dahulu')
      return
    }
    
    if (comment.trim().length < 10) {
      alert('Komentar minimal 10 karakter')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          rating,
          comment: comment.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengirim review')
      }

      alert('Review berhasil dikirim! Terima kasih atas feedback Anda.')
      setRating(0)
      setComment('')
      // Refresh halaman untuk menampilkan review baru
      window.location.reload()
    } catch (error) {
      console.error('Error submitting review:', error)
      alert(error instanceof Error ? error.message : 'Gagal mengirim review')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStars = () => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 rounded"
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                star <= (hoverRating || rating)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300 hover:text-yellow-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-3 text-sm text-gray-600">
          {rating > 0 && (
            <>
              {rating === 1 && 'Sangat Buruk'}
              {rating === 2 && 'Buruk'}
              {rating === 3 && 'Biasa'}
              {rating === 4 && 'Bagus'}
              {rating === 5 && 'Sangat Bagus'}
            </>
          )}
        </span>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Berikan Review Anda
        </CardTitle>
        <div className="text-sm text-gray-600">
          Bagikan pengalaman Anda menggunakan <strong>{productName}</strong>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating *
            </label>
            {renderStars()}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Komentar *
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ceritakan pengalaman Anda menggunakan produk ini..."
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">
                Minimal 10 karakter
              </span>
              <span className="text-xs text-gray-500">
                {comment.length}/500
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Star className="w-3 h-3 mr-1" />
                Verified Purchase
              </Badge>
            </div>
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0 || comment.trim().length < 10}
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Mengirim...' : 'Kirim Review'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
