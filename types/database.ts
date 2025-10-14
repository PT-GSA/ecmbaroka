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
          affiliate_id: string | null
          commission_rate: number
          commission_amount: number
          commission_calculated_at: string | null
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
          affiliate_id?: string | null
          commission_rate?: number
          commission_amount?: number
          commission_calculated_at?: string | null
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
          affiliate_id?: string | null
          commission_rate?: number
          commission_amount?: number
          commission_calculated_at?: string | null
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
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'order' | 'payment' | 'review' | 'system'
          link: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'order' | 'payment' | 'review' | 'system'
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'order' | 'payment' | 'review' | 'system'
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
      affiliates: {
        Row: {
          id: string
          user_id: string
          code: string
          name: string | null
          email: string | null
          status: 'active' | 'inactive'
          visibility_level: 'basic' | 'enhanced'
          commission_rate: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          code: string
          name?: string | null
          email?: string | null
          status?: 'active' | 'inactive'
          visibility_level?: 'basic' | 'enhanced'
          commission_rate?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          code?: string
          name?: string | null
          email?: string | null
          status?: 'active' | 'inactive'
          visibility_level?: 'basic' | 'enhanced'
          commission_rate?: number
          created_at?: string
        }
      }
      affiliate_links: {
        Row: {
          id: string
          affiliate_id: string
          campaign: string | null
          url_slug: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          affiliate_id: string
          campaign?: string | null
          url_slug: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          affiliate_id?: string
          campaign?: string | null
          url_slug?: string
          active?: boolean
          created_at?: string
        }
      }
      affiliate_clicks: {
        Row: {
          id: string
          affiliate_id: string
          campaign: string | null
          referrer: string | null
          ua_hash: string | null
          ip_hash: string | null
          clicked_at: string
        }
        Insert: {
          id?: string
          affiliate_id: string
          campaign?: string | null
          referrer?: string | null
          ua_hash?: string | null
          ip_hash?: string | null
          clicked_at?: string
        }
        Update: {
          id?: string
          affiliate_id?: string
          campaign?: string | null
          referrer?: string | null
          ua_hash?: string | null
          ip_hash?: string | null
          clicked_at?: string
        }
      }
      customer_consent: {
        Row: {
          user_id: string
          marketing_share_optin: boolean
          source: string | null
          updated_at: string
        }
        Insert: {
          user_id: string
          marketing_share_optin?: boolean
          source?: string | null
          updated_at?: string
        }
        Update: {
          user_id?: string
          marketing_share_optin?: boolean
          source?: string | null
          updated_at?: string
        }
      }
      affiliate_commission_rules: {
        Row: {
          id: string
          name: string
          description: string | null
          rule_type: 'percentage' | 'fixed'
          value: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          rule_type: 'percentage' | 'fixed'
          value: number
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          rule_type?: 'percentage' | 'fixed'
          value?: number
          active?: boolean
          created_at?: string
        }
      }
      audit_events: {
        Row: {
          id: string
          event_type: string
          actor_user_id: string | null
          target_table: string
          target_id: string | null
          metadata: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          actor_user_id?: string | null
          target_table: string
          target_id?: string | null
          metadata?: Record<string, unknown> | null
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          actor_user_id?: string | null
          target_table?: string
          target_id?: string | null
          metadata?: Record<string, unknown> | null
          created_at?: string
        }
      }
    }
    Views: {
      v_affiliate_orders: {
        Row: {
          order_id: string
          order_date: string
          status: string
          item_count: number
          total_value: number
          customer_masked_name: string
          affiliate_id: string | null
        }
      }
      v_affiliate_customers: {
        Row: {
          customer_id: string
          first_name_initial: string
          masked_phone: string | null
          order_count: number
          total_value: number
          last_order_date: string
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
