export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      Adatbázis: {
        Row: {
          Elkészítés: string | null
          Elkeszitesi_Ido: string | null
          Feherje_g: number | null
          Hozzavalo_1: string | null
          Hozzavalo_10: string | null
          Hozzavalo_11: string | null
          Hozzavalo_12: string | null
          Hozzavalo_13: string | null
          Hozzavalo_14: string | null
          Hozzavalo_15: string | null
          Hozzavalo_16: string | null
          Hozzavalo_17: string | null
          Hozzavalo_18: string | null
          Hozzavalo_2: string | null
          Hozzavalo_3: string | null
          Hozzavalo_4: string | null
          Hozzavalo_5: string | null
          Hozzavalo_6: string | null
          Hozzavalo_7: string | null
          Hozzavalo_8: string | null
          Hozzavalo_9: string | null
          "Kép URL": string | null
          Recept_Neve: string | null
          Szenhidrat_g: number | null
          Zsir_g: number | null
        }
        Insert: {
          Elkészítés?: string | null
          Elkeszitesi_Ido?: string | null
          Feherje_g?: number | null
          Hozzavalo_1?: string | null
          Hozzavalo_10?: string | null
          Hozzavalo_11?: string | null
          Hozzavalo_12?: string | null
          Hozzavalo_13?: string | null
          Hozzavalo_14?: string | null
          Hozzavalo_15?: string | null
          Hozzavalo_16?: string | null
          Hozzavalo_17?: string | null
          Hozzavalo_18?: string | null
          Hozzavalo_2?: string | null
          Hozzavalo_3?: string | null
          Hozzavalo_4?: string | null
          Hozzavalo_5?: string | null
          Hozzavalo_6?: string | null
          Hozzavalo_7?: string | null
          Hozzavalo_8?: string | null
          Hozzavalo_9?: string | null
          "Kép URL"?: string | null
          Recept_Neve?: string | null
          Szenhidrat_g?: number | null
          Zsir_g?: number | null
        }
        Update: {
          Elkészítés?: string | null
          Elkeszitesi_Ido?: string | null
          Feherje_g?: number | null
          Hozzavalo_1?: string | null
          Hozzavalo_10?: string | null
          Hozzavalo_11?: string | null
          Hozzavalo_12?: string | null
          Hozzavalo_13?: string | null
          Hozzavalo_14?: string | null
          Hozzavalo_15?: string | null
          Hozzavalo_16?: string | null
          Hozzavalo_17?: string | null
          Hozzavalo_18?: string | null
          Hozzavalo_2?: string | null
          Hozzavalo_3?: string | null
          Hozzavalo_4?: string | null
          Hozzavalo_5?: string | null
          Hozzavalo_6?: string | null
          Hozzavalo_7?: string | null
          Hozzavalo_8?: string | null
          Hozzavalo_9?: string | null
          "Kép URL"?: string | null
          Recept_Neve?: string | null
          Szenhidrat_g?: number | null
          Zsir_g?: number | null
        }
        Relationships: []
      }
      Értékelések: {
        Row: {
          Dátum: string | null
          Értékelés: string | null
          "Recept neve": string | null
        }
        Insert: {
          Dátum?: string | null
          Értékelés?: string | null
          "Recept neve"?: string | null
        }
        Update: {
          Dátum?: string | null
          Értékelés?: string | null
          "Recept neve"?: string | null
        }
        Relationships: []
      }
      Ételkategóriák: {
        Row: {
          "Gabonák és Tészták": string | null
          Gyümölcsök: string | null
          Halak: string | null
          Húsfélék: string | null
          id: number
          "Olajok és Magvak": string | null
          Tejtermékek: string | null
          "Zöldségek / Vegetáriánus": string | null
        }
        Insert: {
          "Gabonák és Tészták"?: string | null
          Gyümölcsök?: string | null
          Halak?: string | null
          Húsfélék?: string | null
          id?: number
          "Olajok és Magvak"?: string | null
          Tejtermékek?: string | null
          "Zöldségek / Vegetáriánus"?: string | null
        }
        Update: {
          "Gabonák és Tészták"?: string | null
          Gyümölcsök?: string | null
          Halak?: string | null
          Húsfélék?: string | null
          id?: number
          "Olajok és Magvak"?: string | null
          Tejtermékek?: string | null
          "Zöldségek / Vegetáriánus"?: string | null
        }
        Relationships: []
      }
      Ételkategóriák_Új: {
        Row: {
          "Gabonák és Tészták": string | null
          Gyümölcsök: string | null
          Halak: string | null
          Húsfélék: string | null
          id: number
          "Olajok és Magvak": string | null
          Tejtermékek: string | null
          "Zöldségek / Vegetáriánus": string | null
        }
        Insert: {
          "Gabonák és Tészták"?: string | null
          Gyümölcsök?: string | null
          Halak?: string | null
          Húsfélék?: string | null
          id?: number
          "Olajok és Magvak"?: string | null
          Tejtermékek?: string | null
          "Zöldségek / Vegetáriánus"?: string | null
        }
        Update: {
          "Gabonák és Tészták"?: string | null
          Gyümölcsök?: string | null
          Halak?: string | null
          Húsfélék?: string | null
          id?: number
          "Olajok és Magvak"?: string | null
          Tejtermékek?: string | null
          "Zöldségek / Vegetáriánus"?: string | null
        }
        Relationships: []
      }
      Ételpreferenciák: {
        Row: {
          category: string
          created_at: string
          id: string
          ingredient: string
          preference: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          ingredient: string
          preference: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          ingredient?: string
          preference?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Ételpreferenciák_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      Étkezések: {
        Row: {
          Desszert: string | null
          Ebéd: string | null
          Előétel: string | null
          Köret: string | null
          Leves: string | null
          "Recept Neve": string | null
          Reggeli: string | null
          Tízórai: string | null
          Uzsonna: string | null
          Vacsora: string | null
        }
        Insert: {
          Desszert?: string | null
          Ebéd?: string | null
          Előétel?: string | null
          Köret?: string | null
          Leves?: string | null
          "Recept Neve"?: string | null
          Reggeli?: string | null
          Tízórai?: string | null
          Uzsonna?: string | null
          Vacsora?: string | null
        }
        Update: {
          Desszert?: string | null
          Ebéd?: string | null
          Előétel?: string | null
          Köret?: string | null
          Leves?: string | null
          "Recept Neve"?: string | null
          Reggeli?: string | null
          Tízórai?: string | null
          Uzsonna?: string | null
          Vacsora?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          recipe_data: Json
          recipe_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipe_data: Json
          recipe_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          recipe_data?: Json
          recipe_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          allergies: string[] | null
          avatar_url: string | null
          created_at: string
          dietary_preferences: string[] | null
          full_name: string | null
          height: number | null
          id: string
          updated_at: string
          weight: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[] | null
          avatar_url?: string | null
          created_at?: string
          dietary_preferences?: string[] | null
          full_name?: string | null
          height?: number | null
          id: string
          updated_at?: string
          weight?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[] | null
          avatar_url?: string | null
          created_at?: string
          dietary_preferences?: string[] | null
          full_name?: string | null
          height?: number | null
          id?: string
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "admin_user_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "admin_user_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_overview"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_user_overview: {
        Row: {
          activity_level: string | null
          age: number | null
          allergies: string[] | null
          avatar_url: string | null
          dietary_preferences: string[] | null
          email: string | null
          favorites_count: number | null
          full_name: string | null
          height: number | null
          id: string | null
          preferences_count: number | null
          ratings_count: number | null
          role: Database["public"]["Enums"]["user_role"] | null
          user_created_at: string | null
          weight: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "user"],
    },
  },
} as const
