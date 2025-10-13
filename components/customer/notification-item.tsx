import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { 
  Bell, 
  Package, 
  CreditCard, 
  Star, 
  ExternalLink,
  Check,
  Loader2
} from 'lucide-react'

interface NotificationItemProps {
  id: string
  type: 'order_status' | 'payment' | 'product' | 'review'
  title: string
  message: string
  link?: string
  isRead: boolean
  createdAt: string
  onMarkAsRead?: (id: string) => void
  loading?: boolean
}

export default function NotificationItem({
  id,
  type,
  title,
  message,
  link,
  isRead,
  createdAt,
  onMarkAsRead,
  loading = false
}: NotificationItemProps) {
  const getTypeIcon = () => {
    switch (type) {
      case 'order_status':
        return <Package className="h-5 w-5" />
      case 'payment':
        return <CreditCard className="h-5 w-5" />
      case 'product':
        return <Bell className="h-5 w-5" />
      case 'review':
        return <Star className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getTypeColor = () => {
    switch (type) {
      case 'order_status':
        return 'text-blue-600 bg-blue-50'
      case 'payment':
        return 'text-green-600 bg-green-50'
      case 'product':
        return 'text-purple-600 bg-purple-50'
      case 'review':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <Card className={cn(
      "transition-all duration-200",
      isRead ? "bg-gray-50/50" : "bg-white border-l-4 border-l-blue-500"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className={cn(
            "p-2 rounded-lg flex-shrink-0",
            getTypeColor()
          )}>
            {getTypeIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className={cn(
                  "font-medium text-sm",
                  isRead ? "text-gray-600" : "text-gray-900"
                )}>
                  {title}
                </h4>
                <p className={cn(
                  "text-sm mt-1",
                  isRead ? "text-gray-500" : "text-gray-700"
                )}>
                  {message}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400">
                    {formatDate(createdAt)}
                  </span>
                  {!isRead && (
                    <Badge variant="secondary" className="text-xs">
                      Baru
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                {!isRead && onMarkAsRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMarkAsRead(id)}
                    className="h-8 w-8 p-0"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                )}
                {link && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-8 w-8 p-0"
                  >
                    <a href={link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
