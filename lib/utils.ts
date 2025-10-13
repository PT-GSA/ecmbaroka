import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

// Harga bertingkat per karton berdasarkan jumlah pembelian
// Tiers (jumlah karton -> harga per karton):
// 5: 196800, 10: 192000, 50: 187200, 100: 182400, 500: 177600, 1000: 165600
export function getTierPriceForQty(qty: number): number {
  const q = Math.max(0, Math.floor(qty || 0))
  if (q >= 1000) return 165_600
  if (q >= 500) return 177_600
  if (q >= 100) return 182_400
  if (q >= 50) return 187_200
  if (q >= 10) return 192_000
  // Default dan minimum 5 karton
  return 196_800
}
