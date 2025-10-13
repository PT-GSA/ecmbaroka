import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickActionCardProps {
  title: string
  description: string
  icon: LucideIcon
  href: string
  className?: string
  variant?: 'default' | 'primary' | 'secondary'
}

export default function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  className,
  variant = 'default'
}: QuickActionCardProps) {
  const variantStyles = {
    default: "hover:shadow-md transition-all duration-200 hover:scale-105",
    primary: "bg-gradient-to-r from-blue-500 to-green-500 text-white hover:shadow-lg transition-all duration-200 hover:scale-105",
    secondary: "bg-gray-50 hover:bg-gray-100 transition-all duration-200 hover:scale-105"
  }

  const iconStyles = {
    default: "h-8 w-8 text-blue-600",
    primary: "h-8 w-8 text-white",
    secondary: "h-8 w-8 text-gray-600"
  }

  return (
    <Link href={href} className="block">
      <Card className={cn(variantStyles[variant], className)}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className={cn(
              "p-3 rounded-lg",
              variant === 'primary' ? "bg-white/20" : "bg-blue-50"
            )}>
              <Icon className={iconStyles[variant]} />
            </div>
            <div className="flex-1">
              <h3 className={cn(
                "font-semibold text-lg",
                variant === 'primary' ? "text-white" : "text-gray-900"
              )}>
                {title}
              </h3>
              <p className={cn(
                "text-sm mt-1",
                variant === 'primary' ? "text-white/90" : "text-gray-600"
              )}>
                {description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
