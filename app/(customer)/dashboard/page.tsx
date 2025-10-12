import { redirect } from 'next/navigation'

export default function CustomerDashboard() {
  // Redirect server-side ke halaman produk customer
  redirect('/products')
}