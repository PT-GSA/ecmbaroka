'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'

export default function CopyInput({
  value,
  label,
  className,
}: {
  value: string
  label?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  return (
    <div className={className ?? ''}>
      {label && (
        <div className="text-xs text-gray-500 mb-1">{label}</div>
      )}
      <div className="flex items-center gap-2">
        <Input value={value} readOnly className="text-sm" />
        <Button type="button" variant="outline" onClick={onCopy} title="Copy link">
          <Copy className="w-4 h-4 mr-1" />
          {copied ? 'Tersalin' : 'Copy'}
        </Button>
      </div>
    </div>
  )
}