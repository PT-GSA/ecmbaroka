export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          image_url: string | null
          stock: number
          is_active: boolean
          created_at: string
          sku: string | null
          updated_at: string | null
          specs: Record<string, unknown> | null
          average_rating: number
          total_reviews: number
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          stock: number
          is_active?: boolean
          created_at?: string
          sku?: string | null
          updated_at?: string | null
          specs?: Record<string, unknown> | null
          average_rating?: number
          total_reviews?: number
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          stock?: number
          is_active?: boolean
          created_at?: string
          sku?: string | null
          updated_at?: string | null
          specs?: Record<string, unknown> | null
          average_rating?: number
          total_reviews?: number
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          total_amount: number
          status: 'pending' | 'paid' | 'verified' | 'processing' | 'shipped' | 'completed' | 'cancelled'
          shipping_address: string
          phone: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_amount: number
          status?: 'pending' | 'paid' | 'verified' | 'processing' | 'shipped' | 'completed' | 'cancelled'
          shipping_address: string
          phone: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_amount?: number
          status?: 'pending' | 'paid' | 'verified' | 'processing' | 'shipped' | 'completed' | 'cancelled'
          shipping_address?: string
          phone?: string
          notes?: string | null
          created_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price_at_purchase: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          price_at_purchase: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          price_at_purchase?: number
        }
      }
      payments: {
        Row: {
          id: string
          order_id: string
          proof_image_url: string | null
          bank_name: string
          account_name: string
          transfer_date: string
          amount: number
          status: 'pending' | 'verified' | 'rejected'
          admin_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          proof_image_url?: string | null
          bank_name: string
          account_name: string
          transfer_date: string
          amount: number
          status?: 'pending' | 'verified' | 'rejected'
          admin_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          proof_image_url?: string | null
          bank_name?: string
          account_name?: string
          transfer_date?: string
          amount?: number
          status?: 'pending' | 'verified' | 'rejected'
          admin_notes?: string | null
          created_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          address: string | null
          role: 'customer' | 'admin'
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          phone?: string | null
          address?: string | null
          role?: 'customer' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          address?: string | null
          role?: 'customer' | 'admin'
          created_at?: string
        }
      }
      product_reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string
          rating: number
          comment: string
          verified_purchase: boolean
          is_approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          rating: number
          comment: string
          verified_purchase?: boolean
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          rating?: number
          comment?: string
          verified_purchase?: boolean
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
