import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load env variables (prefer .env.local, then .env)
const root = process.cwd()
const envLocal = path.join(root, '.env.local')
const envDefault = path.join(root, '.env')
if (fs.existsSync(envLocal)) {
  dotenv.config({ path: envLocal })
} else if (fs.existsSync(envDefault)) {
  dotenv.config({ path: envDefault })
} else {
  dotenv.config()
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const orderId = process.argv[2]
if (!orderId) {
  console.error('Usage: node scripts/delete-order.mjs <orderId>')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

async function main() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)
      .select()

    if (error) {
      console.error('Failed to delete order:', error)
      process.exit(1)
    }

    if (!data || data.length === 0) {
      console.log(`No order found with id: ${orderId}`)
      process.exit(0)
    }

    console.log(`Deleted order ${orderId}. Cascade removed related items and payments.`)
    process.exit(0)
  } catch (e) {
    console.error('Unexpected error deleting order:', e)
    process.exit(1)
  }
}

main()