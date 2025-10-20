'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Banknote, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Withdrawal {
  id: string
  affiliate_id: string
  affiliate_code: string
  affiliate_name: string
  amount: number
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected'
  bank_name: string
  account_number: string
  account_holder_name: string
  request_notes?: string
  admin_notes?: string
  transfer_reference?: string
  created_at: string
  processed_at?: string
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateData, setUpdateData] = useState({
    status: '',
    admin_notes: '',
    transfer_reference: ''
  })

  const fetchWithdrawals = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      
      const response = await fetch(`/api/admin/withdrawals?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch withdrawals')
      }

      setWithdrawals(data.withdrawals || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  const updateWithdrawal = async () => {
    if (!selectedWithdrawal || !updateData.status) return

    try {
      setUpdateLoading(true)
      setError('')
      setSuccess('')

      const response = await fetch('/api/admin/withdrawals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawal_id: selectedWithdrawal.id,
          ...updateData
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update withdrawal')
      }

      setSuccess('Withdrawal updated successfully')
      setSelectedWithdrawal(null)
      setUpdateData({ status: '', admin_notes: '', transfer_reference: '' })
      fetchWithdrawals()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setUpdateLoading(false)
    }
  }

  useEffect(() => {
    fetchWithdrawals()
  }, [statusFilter, fetchWithdrawals])

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesSearch = searchTerm === '' || 
      withdrawal.affiliate_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.affiliate_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.account_number.includes(searchTerm)
    
    return matchesSearch
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      processing: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }

    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    )
  }

  const totalPending = withdrawals.filter(w => w.status === 'pending').length
  const totalAmount = withdrawals.reduce((sum, w) => sum + w.amount, 0)
  const pendingAmount = withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Withdrawal Management</h1>
        <p className="text-gray-600 mt-2">Manage affiliate withdrawal requests and bank transfers</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Banknote className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{withdrawals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{totalPending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(pendingAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by affiliate code, name, or account number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-40 pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <Button variant="outline" onClick={fetchWithdrawals}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Withdrawals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading withdrawals...</span>
            </div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Banknote className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No withdrawal requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Affiliate</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Bank Details</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Requested</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{withdrawal.affiliate_code}</p>
                          <p className="text-sm text-gray-600">{withdrawal.affiliate_name}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium">{formatCurrency(withdrawal.amount)}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <p>{withdrawal.bank_name}</p>
                          <p className="text-gray-600">{withdrawal.account_number}</p>
                          <p className="text-gray-600">{withdrawal.account_holder_name}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(withdrawal.status)}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm">{formatDate(withdrawal.created_at)}</p>
                        {withdrawal.processed_at && (
                          <p className="text-xs text-gray-500">
                            Processed: {formatDate(withdrawal.processed_at)}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedWithdrawal(withdrawal)}
                        >
                          Manage
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Update Withdrawal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Affiliate</Label>
                <p className="text-sm text-gray-600">
                  {selectedWithdrawal.affiliate_code} - {selectedWithdrawal.affiliate_name}
                </p>
              </div>
              
              <div>
                <Label>Amount</Label>
                <p className="text-sm text-gray-600">{formatCurrency(selectedWithdrawal.amount)}</p>
              </div>

              <div>
                <Label>Bank Details</Label>
                <p className="text-sm text-gray-600">
                  {selectedWithdrawal.bank_name} - {selectedWithdrawal.account_number}
                </p>
                <p className="text-sm text-gray-600">{selectedWithdrawal.account_holder_name}</p>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={updateData.status}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <Label htmlFor="transfer_reference">Transfer Reference</Label>
                <Input
                  id="transfer_reference"
                  value={updateData.transfer_reference}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, transfer_reference: e.target.value }))}
                  placeholder="Bank transfer reference number"
                />
              </div>

              <div>
                <Label htmlFor="admin_notes">Admin Notes</Label>
                <Textarea
                  id="admin_notes"
                  value={updateData.admin_notes}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, admin_notes: e.target.value }))}
                  placeholder="Notes for affiliate..."
                  rows={3}
                />
              </div>

              {selectedWithdrawal.request_notes && (
                <div>
                  <Label>Affiliate Notes</Label>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {selectedWithdrawal.request_notes}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={updateWithdrawal}
                  disabled={updateLoading || !updateData.status}
                  className="flex-1"
                >
                  {updateLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Withdrawal'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedWithdrawal(null)
                    setUpdateData({ status: '', admin_notes: '', transfer_reference: '' })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
