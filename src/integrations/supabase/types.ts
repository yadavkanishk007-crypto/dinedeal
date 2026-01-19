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
        Relationships: []
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
        Relationships: []
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
          customer_id: string
          expires_at: string
          id: string
          restaurant_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          expires_at?: string
          id?: string
          restaurant_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          expires_at?: string
          id?: string
          restaurant_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dinein_sessions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
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
        Relationships: []
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
      otp_verifications: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_verified: boolean | null
          otp_code: string
          otp_type: string
          phone: string | null
          user_email: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          is_verified?: boolean | null
          otp_code: string
          otp_type: string
          phone?: string | null
          user_email?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_verified?: boolean | null
          otp_code?: string
          otp_type?: string
          phone?: string | null
          user_email?: string | null
        }
        Relationships: []
      }
      posted_bills: {
        Row: {
          bill_amount: number
          created_at: string
          discount_amount: number | null
          final_amount: number
          id: string
          offer_id: string | null
          payment_reference: string | null
          pos_bill_no: string | null
          restaurant_id: string
          session_id: string
          status: string
          updated_at: string
        }
        Insert: {
          bill_amount: number
          created_at?: string
          discount_amount?: number | null
          final_amount: number
          id?: string
          offer_id?: string | null
          payment_reference?: string | null
          pos_bill_no?: string | null
          restaurant_id: string
          session_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          bill_amount?: number
          created_at?: string
          discount_amount?: number | null
          final_amount?: number
          id?: string
          offer_id?: string | null
          payment_reference?: string | null
          pos_bill_no?: string | null
          restaurant_id?: string
          session_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posted_bills_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posted_bills_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posted_bills_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "dinein_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
        Relationships: []
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
          city: string
          created_at: string
          cuisine: string
          description: string | null
          email: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_approved: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          open_hours: string | null
          owner_id: string
          phone: string | null
          rating: number | null
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          address: string
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          city?: string
          created_at?: string
          cuisine: string
          description?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_approved?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          open_hours?: string | null
          owner_id: string
          phone?: string | null
          rating?: number | null
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          address?: string
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          city?: string
          created_at?: string
          cuisine?: string
          description?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_approved?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          open_hours?: string | null
          owner_id?: string
          phone?: string | null
          rating?: number | null
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: []
      }
      rewards: {
        Row: {
          created_at: string
          id: string
          points: number
          total_earned: number
          total_redeemed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points?: number
          total_earned?: number
          total_redeemed?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          total_earned?: number
          total_redeemed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      settlements: {
        Row: {
          created_at: string
          created_by: string | null
          gross_amount: number
          id: string
          net_payable: number
          notes: string | null
          payout_date: string | null
          payout_reference: string | null
          period_end: string
          period_start: string
          platform_commission: number
          restaurant_id: string
          status: string
          total_orders: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          gross_amount?: number
          id?: string
          net_payable?: number
          notes?: string | null
          payout_date?: string | null
          payout_reference?: string | null
          period_end: string
          period_start: string
          platform_commission?: number
          restaurant_id: string
          status?: string
          total_orders?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          gross_amount?: number
          id?: string
          net_payable?: number
          notes?: string | null
          payout_date?: string | null
          payout_reference?: string | null
          period_end?: string
          period_start?: string
          platform_commission?: number
          restaurant_id?: string
          status?: string
          total_orders?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          bill_amount: number
          created_at: string
          discount_amount: number
          final_amount: number
          id: string
          is_settled: boolean | null
          offer_id: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          platform_commission: number | null
          restaurant_earning: number | null
          restaurant_id: string | null
          rewards_earned: number | null
          settlement_id: string | null
          user_id: string | null
        }
        Insert: {
          bill_amount: number
          created_at?: string
          discount_amount?: number
          final_amount: number
          id?: string
          is_settled?: boolean | null
          offer_id?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          platform_commission?: number | null
          restaurant_earning?: number | null
          restaurant_id?: string | null
          rewards_earned?: number | null
          settlement_id?: string | null
          user_id?: string | null
        }
        Update: {
          bill_amount?: number
          created_at?: string
          discount_amount?: number
          final_amount?: number
          id?: string
          is_settled?: boolean | null
          offer_id?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          platform_commission?: number | null
          restaurant_earning?: number | null
          restaurant_id?: string | null
          rewards_earned?: number | null
          settlement_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_restaurant_id_fkey"
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
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
    }
    Enums: {
      app_role: "customer" | "restaurant" | "admin"
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
      app_role: ["customer", "restaurant", "admin"],
    },
  },
} as const
