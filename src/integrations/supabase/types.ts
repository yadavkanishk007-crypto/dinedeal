export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "user_reward_balance_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      admin_permissions: {
        Row: {
          can_manage_coupons: boolean | null
          can_manage_restaurants: boolean | null
          can_manage_users: boolean | null
          can_send_notifications: boolean | null
          can_view_audit: boolean | null
          can_view_revenue: boolean | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_manage_coupons?: boolean | null
          can_manage_restaurants?: boolean | null
          can_manage_users?: boolean | null
          can_send_notifications?: boolean | null
          can_view_audit?: boolean | null
          can_view_revenue?: boolean | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_manage_coupons?: boolean | null
          can_manage_restaurants?: boolean | null
          can_manage_users?: boolean | null
          can_send_notifications?: boolean | null
          can_view_audit?: boolean | null
          can_view_revenue?: boolean | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_reward_balance_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      admins: {
        Row: {
          city: string | null
          created_at: string | null
          email: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_reward_balance_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      coupon_usages: {
        Row: {
          coupon_id: string
          id: string
          transaction_id: string | null
          used_at: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          id?: string
          transaction_id?: string | null
          used_at?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          id?: string
          transaction_id?: string | null
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usages_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usages_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_reward_balance_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      coupons: {
        Row: {
          city: string | null
          code: string
          created_at: string
          created_by: string
          current_uses: number | null
          description: string | null
          discount_percent: number
          id: string
          is_active: boolean | null
          max_discount: number | null
          max_uses: number | null
          min_order_amount: number | null
          restaurant_id: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          city?: string | null
          code: string
          created_at?: string
          created_by: string
          current_uses?: number | null
          description?: string | null
          discount_percent: number
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          max_uses?: number | null
          min_order_amount?: number | null
          restaurant_id?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          city?: string | null
          code?: string
          created_at?: string
          created_by?: string
          current_uses?: number | null
          description?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          max_uses?: number | null
          min_order_amount?: number | null
          restaurant_id?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_reward_balance_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "coupons_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      dinein_sessions: {
        Row: {
          created_at: string
          customer_id: string | null
          expires_at: string
          id: string
          is_expired: boolean | null
          restaurant_id: string
          session_code: string
          status: string
          table_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          expires_at?: string
          id?: string
          is_expired?: boolean | null
          restaurant_id: string
          session_code?: string
          status?: string
          table_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          expires_at?: string
          id?: string
          is_expired?: boolean | null
          restaurant_id?: string
          session_code?: string
          status?: string
          table_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dinein_sessions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "user_reward_balance_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "dinein_sessions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      event_bookings: {
        Row: {
          amount_paid: number | null
          booking_status: Database["public"]["Enums"]["booking_status"] | null
          checked_in_at: string | null
          created_at: string | null
          event_id: string
          id: string
          qr_code_hash: string
          seats_booked: number
          ticket_tier_name: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          booking_status?: Database["public"]["Enums"]["booking_status"] | null
          checked_in_at?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          qr_code_hash: string
          seats_booked?: number
          ticket_tier_name?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          booking_status?: Database["public"]["Enums"]["booking_status"] | null
          checked_in_at?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          qr_code_hash?: string
          seats_booked?: number
          ticket_tier_name?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_availability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_with_availability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_bookings_transaction_fk"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          booking_deadline: string | null
          city: string
          cover_image: string | null
          created_at: string | null
          created_by_id: string
          description: string | null
          end_time: string | null
          event_date: string
          id: string
          is_paid: boolean | null
          start_time: string
          status: Database["public"]["Enums"]["event_status"] | null
          ticket_price: number | null
          ticket_tiers: Json | null
          title: string
          total_seats: number
          updated_at: string | null
          venue_name: string
        }
        Insert: {
          booking_deadline?: string | null
          city?: string
          cover_image?: string | null
          created_at?: string | null
          created_by_id: string
          description?: string | null
          end_time?: string | null
          event_date: string
          id?: string
          is_paid?: boolean | null
          start_time: string
          status?: Database["public"]["Enums"]["event_status"] | null
          ticket_price?: number | null
          ticket_tiers?: Json | null
          title: string
          total_seats?: number
          updated_at?: string | null
          venue_name: string
        }
        Update: {
          booking_deadline?: string | null
          city?: string
          cover_image?: string | null
          created_at?: string | null
          created_by_id?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          id?: string
          is_paid?: boolean | null
          start_time?: string
          status?: Database["public"]["Enums"]["event_status"] | null
          ticket_price?: number | null
          ticket_tiers?: Json | null
          title?: string
          total_seats?: number
          updated_at?: string | null
          venue_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          restaurant_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          restaurant_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          restaurant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_reward_balance_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string | null
          id: string
          invoice_date: string
          invoice_number: string
          invoice_type: string
          pdf_url: string
          settlement_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invoice_date: string
          invoice_number: string
          invoice_type: string
          pdf_url: string
          settlement_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          invoice_type?: string
          pdf_url?: string
          settlement_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_settlement_id_fkey"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "settlements"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          is_veg: boolean | null
          name: string
          price: number
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_veg?: boolean | null
          name: string
          price: number
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_veg?: boolean | null
          name?: string
          price?: number
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          body: string
          created_at: string
          id: string
          sent_by: string
          target_type: string
          title: string
          total_failed: number | null
          total_sent: number | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sent_by: string
          target_type?: string
          title: string
          total_failed?: number | null
          total_sent?: number | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sent_by?: string
          target_type?: string
          title?: string
          total_failed?: number | null
          total_sent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "user_reward_balance_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      offers: {
        Row: {
          created_at: string
          discount_percent: number
          id: string
          is_active: boolean | null
          max_discount: number
          min_order_amount: number | null
          restaurant_id: string
          terms: string | null
          title: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          discount_percent: number
          id?: string
          is_active?: boolean | null
          max_discount?: number
          min_order_amount?: number | null
          restaurant_id: string
          terms?: string | null
          title: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          discount_percent?: number
          id?: string
          is_active?: boolean | null
          max_discount?: number
          min_order_amount?: number | null
          restaurant_id?: string
          terms?: string | null
          title?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          agreed_to_terms: boolean | null
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agreed_to_terms?: boolean | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agreed_to_terms?: boolean | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_reward_balance_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_reward_balance_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ratings: {
        Row: {
          app_rating: number | null
          created_at: string
          dining_rating: number
          feedback: string | null
          id: string
          restaurant_id: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          app_rating?: number | null
          created_at?: string
          dining_rating: number
          feedback?: string | null
          id?: string
          restaurant_id?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          app_rating?: number | null
          created_at?: string
          dining_rating?: number
          feedback?: string | null
          id?: string
          restaurant_id?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_reward_balance_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      razorpay_orders: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          order_id: string
          restaurant_id: string | null
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          order_id: string
          restaurant_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          order_id?: string
          restaurant_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "razorpay_orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          party_size: number
          phone: string | null
          reminder_sent: boolean | null
          reservation_date: string
          reservation_time: string
          restaurant_id: string
          special_requests: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          party_size?: number
          phone?: string | null
          reminder_sent?: boolean | null
          reservation_date: string
          reservation_time: string
          restaurant_id: string
          special_requests?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          party_size?: number
          phone?: string | null
          reminder_sent?: boolean | null
          reservation_date?: string
          reservation_time?: string
          restaurant_id?: string
          special_requests?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_reward_balance_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      restaurant_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          restaurant_id: string
          sort_order: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          restaurant_id: string
          sort_order?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          restaurant_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_images_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_ifsc: string | null
          bank_verified: boolean | null
          city: string
          commission_type: string | null
          commission_value: number | null
          created_at: string
          cuisine: string
          description: string | null
          email: string | null
          id: string
          image_url: string | null
          instagram: string | null
          is_active: boolean | null
          is_approved: boolean | null
          is_auto_eligible: boolean | null
          is_event_organiser: boolean | null
          latitude: number | null
          longitude: number | null
          min_payout_threshold: number | null
          name: string
          open_hours: string | null
          organiser_type: string | null
          owner_id: string
          phone: string | null
          rating: number | null
          settlement_cycle: string | null
          tier: string | null
          twitter: string | null
          updated_at: string
          upi_id: string | null
          website: string | null
        }
        Insert: {
          address: string
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_verified?: boolean | null
          city?: string
          commission_type?: string | null
          commission_value?: number | null
          created_at?: string
          cuisine: string
          description?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          instagram?: string | null
          is_active?: boolean | null
          is_approved?: boolean | null
          is_auto_eligible?: boolean | null
          is_event_organiser?: boolean | null
          latitude?: number | null
          longitude?: number | null
          min_payout_threshold?: number | null
          name: string
          open_hours?: string | null
          organiser_type?: string | null
          owner_id: string
          phone?: string | null
          rating?: number | null
          settlement_cycle?: string | null
          tier?: string | null
          twitter?: string | null
          updated_at?: string
          upi_id?: string | null
          website?: string | null
        }
        Update: {
          address?: string
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_verified?: boolean | null
          city?: string
          commission_type?: string | null
          commission_value?: number | null
          created_at?: string
          cuisine?: string
          description?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          instagram?: string | null
          is_active?: boolean | null
          is_approved?: boolean | null
          is_auto_eligible?: boolean | null
          is_event_organiser?: boolean | null
          latitude?: number | null
          longitude?: number | null
          min_payout_threshold?: number | null
          name?: string
          open_hours?: string | null
          organiser_type?: string | null
          owner_id?: string
          phone?: string | null
          rating?: number | null
          settlement_cycle?: string | null
          tier?: string | null
          twitter?: string | null
          updated_at?: string
          upi_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "user_reward_balance_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string
          id: string
          points: number
          total_earned: number
          total_redeemed: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points?: number
          total_earned?: number
          total_redeemed?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          total_earned?: number
          total_redeemed?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_user_fk"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_reward_balance_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      settlements: {
        Row: {
          created_at: string
          created_by: string | null
          failure_reason: string | null
          from_date: string | null
          gross_amount: number
          id: string
          net_amount: number | null
          net_payable: number
          notes: string | null
          payout_date: string | null
          payout_id: string | null
          payout_method: string | null
          payout_reference: string | null
          payout_status: string | null
          period_end: string
          period_start: string
          platform_commission: number
          restaurant_id: string
          settlement_cycle: string | null
          settlement_number: string | null
          status: string
          to_date: string | null
          total_orders: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          failure_reason?: string | null
          from_date?: string | null
          gross_amount?: number
          id?: string
          net_amount?: number | null
          net_payable?: number
          notes?: string | null
          payout_date?: string | null
          payout_id?: string | null
          payout_method?: string | null
          payout_reference?: string | null
          payout_status?: string | null
          period_end: string
          period_start: string
          platform_commission?: number
          restaurant_id: string
          settlement_cycle?: string | null
          settlement_number?: string | null
          status?: string
          to_date?: string | null
          total_orders?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          failure_reason?: string | null
          from_date?: string | null
          gross_amount?: number
          id?: string
          net_amount?: number | null
          net_payable?: number
          notes?: string | null
          payout_date?: string | null
          payout_id?: string | null
          payout_method?: string | null
          payout_reference?: string | null
          payout_status?: string | null
          period_end?: string
          period_start?: string
          platform_commission?: number
          restaurant_id?: string
          settlement_cycle?: string | null
          settlement_number?: string | null
          status?: string
          to_date?: string | null
          total_orders?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_reward_balance_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "settlements_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          created_at: string
          id: string
          is_from_support: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_from_support?: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_from_support?: boolean
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_reward_balance_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_reward_balance_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      transactions: {
        Row: {
          bill_amount: number
          cashback_applied: number | null
          created_at: string | null
          dinein_session_id: string | null
          discount_amount: number
          final_amount: number
          id: string
          is_settled: boolean | null
          offer_id: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          platform_commission: number | null
          platform_commission_percent: number | null
          pos_bill_no: string | null
          razorpay_order_id: string | null
          restaurant_bill: number | null
          restaurant_earning: number | null
          restaurant_id: string | null
          rewards_earned: number | null
          settled_at: string | null
          settlement_id: string | null
          user_id: string | null
        }
        Insert: {
          bill_amount: number
          cashback_applied?: number | null
          created_at?: string | null
          dinein_session_id?: string | null
          discount_amount?: number
          final_amount: number
          id?: string
          is_settled?: boolean | null
          offer_id?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          platform_commission?: number | null
          platform_commission_percent?: number | null
          pos_bill_no?: string | null
          razorpay_order_id?: string | null
          restaurant_bill?: number | null
          restaurant_earning?: number | null
          restaurant_id?: string | null
          rewards_earned?: number | null
          settled_at?: string | null
          settlement_id?: string | null
          user_id?: string | null
        }
        Update: {
          bill_amount?: number
          cashback_applied?: number | null
          created_at?: string | null
          dinein_session_id?: string | null
          discount_amount?: number
          final_amount?: number
          id?: string
          is_settled?: boolean | null
          offer_id?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          platform_commission?: number | null
          platform_commission_percent?: number | null
          pos_bill_no?: string | null
          razorpay_order_id?: string | null
          restaurant_bill?: number | null
          restaurant_earning?: number | null
          restaurant_id?: string | null
          rewards_earned?: number | null
          settled_at?: string | null
          settlement_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_dinein_session_id_fkey"
            columns: ["dinein_session_id"]
            isOneToOne: false
            referencedRelation: "dinein_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_offer_fk"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_restaurant_fk"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_settlement_id_fkey"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "settlements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_reward_balance_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_reward_balance_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      event_availability: {
        Row: {
          available_seats: number | null
          booked_seats: number | null
          event_date: string | null
          id: string | null
          title: string | null
          total_seats: number | null
        }
        Relationships: []
      }
      event_with_availability: {
        Row: {
          booking_deadline: string | null
          city: string | null
          cover_image: string | null
          created_at: string | null
          created_by_id: string | null
          description: string | null
          end_time: string | null
          event_date: string | null
          id: string | null
          is_paid: boolean | null
          remaining_seats: number | null
          start_time: string | null
          status: Database["public"]["Enums"]["event_status"] | null
          ticket_price: number | null
          ticket_tiers: Json | null
          title: string | null
          total_seats: number | null
          updated_at: string | null
          venue_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reward_balance_view: {
        Row: {
          points: number | null
          redeemable_amount: number | null
          total_earned: number | null
          total_redeemed: number | null
          user_id: string | null
        }
        Relationships: []
      }
      user_reward_earned_view: {
        Row: {
          total_earned_points: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_reward_balance_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_reward_redeemed_view: {
        Row: {
          total_redeemed_points: number | null
          user_id: string | null
        }
        Insert: {
          total_redeemed_points?: never
          user_id?: string | null
        }
        Update: {
          total_redeemed_points?: never
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rewards_user_fk"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_reward_balance_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Functions: {
      book_event_seats: {
        Args: {
          p_amount?: number
          p_event_id: string
          p_seats: number
          p_tier_name: string
          p_user_id: string
        }
        Returns: undefined
      }
      book_event_tickets: {
        Args: {
          p_event_id: string
          p_seats_to_book: number
          p_tier_name: string
        }
        Returns: undefined
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { uid: string }; Returns: boolean }
    }
    Enums: {
      app_role: "customer" | "restaurant" | "admin" | "event_organiser"
      booking_status: "confirmed" | "cancelled" | "attended" | "expired"
      event_status: "draft" | "published" | "cancelled" | "completed"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["customer", "restaurant", "admin", "event_organiser"],
      booking_status: ["confirmed", "cancelled", "attended", "expired"],
      event_status: ["draft", "published", "cancelled", "completed"],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
    },
  },
} as const
