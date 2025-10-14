'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Wand2 } from 'lucide-react'

function generateAffiliateCode(): string {
  const prefix = 'AFF-'
  const rand = Math.random().toString(36).toUpperCase().slice(2, 8)
  // Ensure alphanumeric only
  const cleaned = rand.replace(/[^A-Z0-9]/g, '')
  return `${prefix}${cleaned}`
}

export function AffiliateCodeField() {
  const [code, setCode] = useState('')

  const handleGenerate = () => {
    setCode(generateAffiliateCode())
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="code">Kode Affiliate</Label>
      <div className="flex gap-2">
        <Input
          id="code"
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          required
          placeholder="contoh: AFF-ABC123"
        />
        <Button type="button" variant="secondary" onClick={handleGenerate} title="Generate kode">
          <Wand2 className="h-4 w-4 mr-1" /> Generate
        </Button>
      </div>
      <p className="text-xs text-gray-500">Harus unik. Gunakan huruf/angka, otomatis uppercase.</p>
    </div>
  )
}