'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  MessageCircle, 
  FileText,
  Heart,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CreditCard
} from 'lucide-react'
import Link from 'next/link'
import { PDFDownloadLink } from '@react-pdf/renderer'
import InvoicePDF from '@/components/pdf/InvoicePDF'

interface OrderItem {
  id: string
  quantity: number
  price_at_purchase: number
  products: {
    name: string
    image_url: string | null
  }
}

interface Order {
  id: string
  created_at: string
  status: string
  total_amount: number
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address: string
  order_items: OrderItem[]
}

export default function InvoicePage() {
  const params = useParams()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  // Mock data untuk demo
  const mockInvoiceData = {
    storeName: "Susu Baroka",
    storeAddress: "Jl. Merdeka No. 123, Jakarta Selatan",
    storePhone: "+62 812-3456-7890",
    storeEmail: "info@susubaroka.com",
    bankName: "BCA",
    accountNumber: "1234567890",
    accountName: "Susu Baroka"
  }

  useEffect(() => {
    // Mock order data
    const mockOrder: Order = {
      id: orderId,
      created_at: '2024-01-15T10:30:00Z',
      status: 'completed',
      total_amount: 250000,
      customer_name: 'John Doe',
      customer_email: 'john.doe@email.com',
      customer_phone: '+62 812-3456-7890',
      customer_address: 'Jl. Sudirman No. 123, Jakarta Selatan',
      order_items: [
        {
          id: '1',
          quantity: 2,
          price_at_purchase: 25000,
          products: {
            name: 'Susu Steril 1L',
            image_url: null
          }
        },
        {
          id: '2',
          quantity: 3,
          price_at_purchase: 15000,
          products: {
            name: 'Susu Pasteurisasi 500ml',
            image_url: null
          }
        },
        {
          id: '3',
          quantity: 1,
          price_at_purchase: 35000,
          products: {
            name: 'Susu Organik 1L',
            image_url: null
          }
        }
      ]
    }

    setOrder(mockOrder)
    setLoading(false)
  }, [orderId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDateFull = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateSubtotal = () => {
    if (!order) return 0
    return order.order_items.reduce((sum, item) => sum + (item.quantity * item.price_at_purchase), 0)
  }

  const calculateTax = () => {
    return 0 // No tax for now
  }

  const calculateShipping = () => {
    return 0 // Free shipping
  }

  const getDueDate = () => {
    if (!order) return ''
    const invoiceDate = new Date(order.created_at)
    const dueDate = new Date(invoiceDate)
    dueDate.setDate(dueDate.getDate() + 7)
    return formatDate(dueDate.toISOString())
  }

  // Removed legacy HTML2Canvas/jsPDF implementation in favor of React-PDF

  const handleSendWhatsApp = () => {
    if (!order) return

    // Format phone number
    let phoneNumber = order.customer_phone.replace(/[\s\-\(\)]/g, '')
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '62' + phoneNumber.substring(1)
    } else if (phoneNumber.startsWith('+62')) {
      phoneNumber = phoneNumber.substring(1)
    } else if (!phoneNumber.startsWith('62')) {
      phoneNumber = '62' + phoneNumber
    }

    // Create message
    const message = `Halo ${order.customer_name},

Terima kasih sudah berbelanja di Susu Baroka!

Invoice: INV-${order.id}
Total: ${formatCurrency(order.total_amount)}
Status: ${order.status}

Lihat invoice lengkap di:
${window.location.href}

Silakan transfer ke:
Bank: ${mockInvoiceData.bankName}
No. Rek: ${mockInvoiceData.accountNumber}
A/N: ${mockInvoiceData.accountName}

Terima kasih!`

    // Encode message
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`

    // Open WhatsApp
    window.open(whatsappUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-gray-600">Memuat invoice...</span>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invoice Tidak Ditemukan</h1>
          <p className="text-gray-600 mb-6">Invoice dengan ID {orderId} tidak ditemukan</p>
          <Button asChild>
            <Link href="/admin/orders">
              <ArrowLeft className="mr-2" />
              Kembali ke Orders
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const subtotal = calculateSubtotal()
  const tax = calculateTax()
  const shipping = calculateShipping()
  const total = subtotal + tax + shipping

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Action Buttons - Hidden when printing */}
      <div className="no-print p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" asChild>
              <Link href={`/admin/orders/${orderId}`}>
                <ArrowLeft className="mr-2" />
                Kembali ke Order
              </Link>
            </Button>
            <div className="flex space-x-3">
              <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700">
                <Printer className="mr-2" />
                Print Invoice
              </Button>
              <PDFDownloadLink
                document={order ? (
                  <InvoicePDF
                    order={order}
                    store={{
                      storeName: mockInvoiceData.storeName,
                      storeAddress: mockInvoiceData.storeAddress,
                      storePhone: mockInvoiceData.storePhone,
                      storeEmail: mockInvoiceData.storeEmail,
                      bankName: mockInvoiceData.bankName,
                      accountNumber: mockInvoiceData.accountNumber,
                      accountName: mockInvoiceData.accountName,
                    }}
                    subtotal={calculateSubtotal()}
                    tax={calculateTax()}
                    shipping={calculateShipping()}
                    total={calculateSubtotal() + calculateTax() + calculateShipping()}
                    formatted={{
                      currency: (n: number) => formatCurrency(n),
                      dateFull: (iso: string) => formatDateFull(iso),
                    }}
                  />
                ) : (<></>)}
                fileName={`Invoice-${orderId}.pdf`}
              >
                {({ loading }) => (
                  <Button variant="outline" data-pdf-button>
                    <Download className="mr-2" />
                    {loading ? 'Menyiapkan...' : 'Download PDF'}
                  </Button>
                )}
              </PDFDownloadLink>
              <Button onClick={handleSendWhatsApp} className="bg-green-600 hover:bg-green-700">
                <MessageCircle className="mr-2" />
                Kirim ke WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Container */}
      <div id="invoice-content" className="invoice-container max-w-4xl mx-auto bg-white shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center mr-4">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{mockInvoiceData.storeName}</h1>
              <p className="text-gray-600">Susu Steril Berkualitas Tinggi</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-blue-600 mb-2">INVOICE</h2>
            <p className="text-sm text-gray-500">INV-{order.id}</p>
          </div>
        </div>

        {/* Invoice Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Invoice</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">Tanggal Invoice: {formatDateFull(order.created_at)}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">Jatuh Tempo: {getDueDate()}</span>
              </div>
              <div className="flex items-center">
                <FileText className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">Status: <Badge variant="secondary" className="ml-1">{order.status}</Badge></span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Toko</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">{mockInvoiceData.storeAddress}</span>
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">{mockInvoiceData.storePhone}</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">{mockInvoiceData.storeEmail}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill To:</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-medium text-gray-900">{order.customer_name}</p>
            <p className="text-sm text-gray-600">{order.customer_address}</p>
            <p className="text-sm text-gray-600">{order.customer_phone}</p>
            <p className="text-sm text-gray-600">{order.customer_email}</p>
          </div>
        </div>

        {/* Order Details Table */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detail Pesanan</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">No.</th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">Produk</th>
                  <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900">Qty</th>
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-900">Harga Satuan</th>
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-900">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.order_items.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                    <td className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-900">{item.products.name}</td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-600 text-center">{item.quantity}</td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-600 text-right">{formatCurrency(item.price_at_purchase)}</td>
                    <td className="border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(item.quantity * item.price_at_purchase)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Pembayaran</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <CreditCard className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-900">Bank Transfer</span>
              </div>
              <p className="text-sm text-blue-800">Bank: {mockInvoiceData.bankName}</p>
              <p className="text-sm text-blue-800">No. Rekening: {mockInvoiceData.accountNumber}</p>
              <p className="text-sm text-blue-800">Atas Nama: {mockInvoiceData.accountName}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">PPN (0%):</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Ongkir:</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(shipping)}</span>
              </div>
              <div className="border-t border-gray-300 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-gray-900">Total:</span>
                  <span className="text-lg font-bold text-blue-600">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 mt-8">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Terima kasih telah mempercayai Susu Baroka untuk kebutuhan Susu Steril keluarga Anda.
            </p>
            <p className="text-xs text-gray-500">
              Invoice ini dibuat secara otomatis. Untuk pertanyaan atau bantuan, silakan hubungi customer service kami.
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .invoice-container {
            max-width: 100% !important;
            padding: 20mm !important;
            box-shadow: none !important;
            margin: 0 !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  )
}
