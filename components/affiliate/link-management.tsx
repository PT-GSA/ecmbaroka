'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Edit, Eye, EyeOff, Trash2, Save, X } from 'lucide-react'

interface AffiliateLink {
  id: string
  campaign: string | null
  url_slug: string
  active: boolean
  created_at: string
}

interface LinkManagementProps {
  link: AffiliateLink
  onUpdate: (id: string, data: { campaign?: string; url_slug?: string; active?: boolean }) => Promise<void>
  onDelete: (id: string) => Promise<void>
  isUpdating?: boolean
  isDeleting?: boolean
}

export default function LinkManagement({ link, onUpdate, onDelete, isUpdating: parentIsUpdating, isDeleting: parentIsDeleting }: LinkManagementProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Use parent loading states if provided, otherwise use local states
  const isCurrentlyUpdating = parentIsUpdating ?? isUpdating
  const isCurrentlyDeleting = parentIsDeleting ?? isDeleting
  const [editData, setEditData] = useState({
    campaign: link.campaign || '',
    url_slug: link.url_slug
  })

  const handleUpdate = async () => {
    setIsUpdating(true)
    try {
      await onUpdate(link.id, editData)
      setIsEditOpen(false)
    } catch (error) {
      console.error('Failed to update link:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleToggleStatus = async () => {
    setIsUpdating(true)
    try {
      await onUpdate(link.id, { active: !link.active })
    } catch (error) {
      console.error('Failed to toggle link status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(link.id)
      setIsDeleteOpen(false)
    } catch (error) {
      console.error('Failed to delete link:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex gap-2">
      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Link Referral</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-campaign">Nama Campaign</Label>
              <Input
                id="edit-campaign"
                value={editData.campaign}
                onChange={(e) => setEditData(prev => ({ ...prev, campaign: e.target.value }))}
                placeholder="Masukkan nama campaign"
              />
            </div>
            <div>
              <Label htmlFor="edit-slug">Slug Link</Label>
              <Input
                id="edit-slug"
                value={editData.url_slug}
                onChange={(e) => setEditData(prev => ({ ...prev, url_slug: e.target.value }))}
                placeholder="Masukkan slug link"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Batal
            </Button>
            <Button onClick={handleUpdate} disabled={isCurrentlyUpdating}>
              <Save className="w-4 h-4 mr-2" />
              {isCurrentlyUpdating ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Toggle Status */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleToggleStatus}
        disabled={isCurrentlyUpdating}
      >
        {link.active ? (
          <>
            <EyeOff className="w-4 h-4 mr-2" />
            Nonaktifkan
          </>
        ) : (
          <>
            <Eye className="w-4 h-4 mr-2" />
            Aktifkan
          </>
        )}
      </Button>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4 mr-2" />
            Hapus
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              Apakah Anda yakin ingin menghapus link referral &quot;{link.campaign || link.url_slug}&quot;? 
              Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait link ini.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleDelete}
              disabled={isCurrentlyDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCurrentlyDeleting ? 'Menghapus...' : 'Hapus'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
