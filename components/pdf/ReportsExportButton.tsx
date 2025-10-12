'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import ReportsPDF from '@/components/pdf/ReportsPDF'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'

type Summary = {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  averageOrderValue: number
  profitMargin: number
}

type Growth = {
  revenueGrowth: number
  ordersGrowth: number
  customersGrowth: number
  profitGrowth: number
}

type Formatted = {
  currency: (value: number) => string
  percent: (value: number) => string
}

export default function ReportsExportButton({
  summary,
  growth,
  formatted,
  fileName
}: {
  summary: Summary
  growth: Growth
  formatted: Formatted
  fileName: string
}) {
  return (
    <PDFDownloadLink
      document={<ReportsPDF summary={summary} growth={growth} formatted={formatted} />}
      fileName={fileName}
    >
      {({ loading }) => (
        <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" data-pdf-button>
          <FileText className="w-4 h-4 mr-2" />
          {loading ? 'Menyiapkan PDF...' : 'Export PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  )
}