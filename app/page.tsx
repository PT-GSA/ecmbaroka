import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to customer homepage
  redirect('/customer')
}
