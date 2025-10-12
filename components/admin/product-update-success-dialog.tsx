'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { CheckCircle } from 'lucide-react'

interface Props {
  show?: boolean
}

export default function ProductUpdateSuccessDialog({ show = false }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (show) {
      setOpen(true)
    }
  }, [show])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Berhasil Disimpan
          </DialogTitle>
          <DialogDescription>
            Perubahan produk telah berhasil disimpan.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}