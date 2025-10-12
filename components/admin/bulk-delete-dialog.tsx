'use client'

import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface BulkDeleteDialogProps {
  formId: string
}

export default function BulkDeleteDialog({ formId }: BulkDeleteDialogProps) {
  const handleConfirm = () => {
    const form = document.getElementById(formId) as HTMLFormElement | null
    if (form) {
      form.requestSubmit()
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" type="button">
          <Trash2 className="mr-2 h-4 w-4" />
          Hapus Terpilih
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Konfirmasi Hapus</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus produk yang dipilih? Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Batal</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleConfirm}>
            Ya, Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}