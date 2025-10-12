'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

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

interface InvoicePDFProps {
  order: Order
  store: {
    storeName: string
    storeAddress: string
    storePhone: string
    storeEmail: string
    bankName: string
    accountNumber: string
    accountName: string
  }
  subtotal: number
  tax: number
  shipping: number
  total: number
  formatted: {
    currency: (n: number) => string
    dateFull: (iso: string) => string
  }
}

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 12,
    color: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 8,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  gridCol: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoLabel: {
    width: 120,
    color: '#6B7280',
  },
  infoValue: {
    flex: 1,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginTop: 8,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderColor: '#D1D5DB',
  },
  th: {
    flex: 1,
    padding: 6,
    fontWeight: 600,
  },
  tr: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  td: {
    flex: 1,
    padding: 6,
  },
  totals: {
    marginTop: 8,
    gap: 4,
  },
  footer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    paddingTop: 8,
    color: '#1E40AF',
  },
})

export default function InvoicePDF({ order, store, subtotal, tax, shipping, total, formatted }: InvoicePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{store.storeName}</Text>
            <Text style={styles.subtitle}>Susu Steril Berkualitas Tinggi</Text>
          </View>
          <View>
            <Text style={{ fontSize: 18, fontWeight: 700, color: '#2563EB' }}>INVOICE</Text>
            <Text style={styles.subtitle}>INV-{order.id}</Text>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <Text style={styles.sectionTitle}>Informasi Invoice</Text>
            <View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tanggal Invoice</Text>
                <Text style={styles.infoValue}>{formatted.dateFull(order.created_at)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Jatuh Tempo</Text>
                <Text style={styles.infoValue}>{formatted.dateFull(order.created_at)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={styles.infoValue}>{order.status}</Text>
              </View>
            </View>
          </View>

          <View style={styles.gridCol}>
            <Text style={styles.sectionTitle}>Informasi Toko</Text>
            <View>
              <Text>{store.storeAddress}</Text>
              <Text>{store.storePhone}</Text>
              <Text>{store.storeEmail}</Text>
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>Bill To:</Text>
          <View style={{ padding: 8, backgroundColor: '#F9FAFB', borderRadius: 6 }}>
            <Text style={{ fontWeight: 600 }}>{order.customer_name}</Text>
            <Text>{order.customer_address}</Text>
            <Text>{order.customer_phone}</Text>
            <Text>{order.customer_email}</Text>
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>Detail Pesanan</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.th}>Produk</Text>
              <Text style={styles.th}>Jumlah</Text>
              <Text style={styles.th}>Harga</Text>
              <Text style={styles.th}>Subtotal</Text>
            </View>
            {order.order_items.map((item) => (
              <View key={item.id} style={styles.tr}>
                <Text style={styles.td}>{item.products.name}</Text>
                <Text style={styles.td}>{item.quantity}</Text>
                <Text style={styles.td}>{formatted.currency(item.price_at_purchase)}</Text>
                <Text style={styles.td}>{formatted.currency(item.price_at_purchase * item.quantity)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.totals}>
          <Text>Subtotal: {formatted.currency(subtotal)}</Text>
          <Text>Tax (10%): {formatted.currency(tax)}</Text>
          <Text>Shipping: {formatted.currency(shipping)}</Text>
          <Text style={{ fontWeight: 700 }}>Total: {formatted.currency(total)}</Text>
        </View>

        <View style={styles.footer}>
          <Text>Bank: {store.bankName}</Text>
          <Text>No. Rekening: {store.accountNumber}</Text>
          <Text>Atas Nama: {store.accountName}</Text>
        </View>
      </Page>
    </Document>
  )
}