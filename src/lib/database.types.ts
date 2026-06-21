export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  api: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      crm_account_list: {
        Row: {
          account_owner_profile_id: string | null
          chain_type: string | null
          company_type: string | null
          customer_status: string | null
          domain: string | null
          id: string | null
          name: string | null
          primary_salesperson_profile_id: string | null
          routing_aliases: string | null
          so_patterns: string | null
          status: Database["app"]["Enums"]["entity_status"] | null
          updated_at: string | null
        }
        Insert: {
          account_owner_profile_id?: string | null
          chain_type?: string | null
          company_type?: string | null
          customer_status?: string | null
          domain?: string | null
          id?: string | null
          name?: string | null
          primary_salesperson_profile_id?: string | null
          routing_aliases?: string | null
          so_patterns?: string | null
          status?: Database["app"]["Enums"]["entity_status"] | null
          updated_at?: string | null
        }
        Update: {
          account_owner_profile_id?: string | null
          chain_type?: string | null
          company_type?: string | null
          customer_status?: string | null
          domain?: string | null
          id?: string | null
          name?: string | null
          primary_salesperson_profile_id?: string | null
          routing_aliases?: string | null
          so_patterns?: string | null
          status?: Database["app"]["Enums"]["entity_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_account_overview: {
        Row: {
          company_id: string | null
          company_name: string | null
          company_status: Database["app"]["Enums"]["entity_status"] | null
          contact_count: number | null
          department_count: number | null
          latest_opportunity_at: string | null
          opportunity_count: number | null
          production_order_count: number | null
          project_count: number | null
        }
        Relationships: []
      }
      crm_ai_model_config_list: {
        Row: {
          email_routing_model: string | null
          fireflies_routing_model: string | null
          id: string | null
          name: string | null
          opportunity_summary_model: string | null
          transcript_split_model: string | null
          updated_at: string | null
        }
        Insert: {
          email_routing_model?: string | null
          fireflies_routing_model?: string | null
          id?: string | null
          name?: string | null
          opportunity_summary_model?: string | null
          transcript_split_model?: string | null
          updated_at?: string | null
        }
        Update: {
          email_routing_model?: string | null
          fireflies_routing_model?: string | null
          id?: string | null
          name?: string | null
          opportunity_summary_model?: string | null
          transcript_split_model?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_approval_queue: {
        Row: {
          due_date: string | null
          id: string | null
          licensor_comments: string | null
          name: string | null
          opportunity_id: string | null
          opportunity_name: string | null
          opportunity_stage: string | null
          property_name: string | null
          response_date: string | null
          stage: string | null
          submitted_date: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "licensor_approval_thread_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunity_list"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contact_list: {
        Row: {
          company_customer_status: string | null
          company_id: string | null
          company_name: string | null
          contact_type: string | null
          department_id: string | null
          department_name: string | null
          email: string | null
          first_name: string | null
          id: string | null
          job_title: string | null
          last_name: string | null
          name: string | null
          phone: string | null
          scope: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_company_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_account_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_company_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_account_overview"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contact_company_crm_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "crm_department_list"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_department_list: {
        Row: {
          active: boolean | null
          category: string | null
          company_id: string | null
          company_name: string | null
          division: string | null
          id: string | null
          name: string | null
          primary_contact_email: string | null
          primary_contact_id: string | null
          primary_contact_name: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "department_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_account_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_account_overview"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "department_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contact_list"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_email_routing_queue: {
        Row: {
          body_preview: string | null
          company_id: string | null
          company_name: string | null
          department_id: string | null
          department_name: string | null
          detected_po_numbers: string | null
          detected_so_numbers: string | null
          id: string | null
          opportunity_id: string | null
          opportunity_name: string | null
          opportunity_stage: string | null
          received_at: string | null
          recipients: string | null
          routing_method: string | null
          routing_status: string | null
          sender: string | null
          subject: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_message_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_account_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_message_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_account_overview"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "email_message_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "crm_department_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_message_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunity_list"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_ignore_rule_list: {
        Row: {
          created_at: string | null
          emails_skipped: number | null
          id: string | null
          match_type: string | null
          name: string | null
          pattern: string | null
        }
        Insert: {
          created_at?: string | null
          emails_skipped?: number | null
          id?: string | null
          match_type?: string | null
          name?: string | null
          pattern?: string | null
        }
        Update: {
          created_at?: string | null
          emails_skipped?: number | null
          id?: string | null
          match_type?: string | null
          name?: string | null
          pattern?: string | null
        }
        Relationships: []
      }
      crm_meeting_list: {
        Row: {
          action_items: string | null
          company_customer_status: string | null
          company_id: string | null
          company_name: string | null
          contact_email: string | null
          contact_id: string | null
          contact_name: string | null
          date: string | null
          department_id: string | null
          department_name: string | null
          fireflies_transcript_id: string | null
          id: string | null
          name: string | null
          participants: string | null
          source: string | null
          summary: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_note_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_account_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_note_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_account_overview"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "meeting_note_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contact_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_note_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "crm_department_list"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_note_list: {
        Row: {
          action_items: string | null
          body: string | null
          company_id: string | null
          company_name: string | null
          contact_email: string | null
          contact_id: string | null
          contact_name: string | null
          created_at: string | null
          department_id: string | null
          department_name: string | null
          fireflies_transcript_id: string | null
          id: string | null
          opportunity_id: string | null
          opportunity_name: string | null
          opportunity_stage: string | null
          source: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "note_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_account_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_account_overview"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "note_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contact_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "crm_department_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunity_list"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_opportunity_list: {
        Row: {
          ai_state: string | null
          ai_summary: string | null
          amount: number | null
          close_date: string | null
          company_customer_status: string | null
          company_id: string | null
          company_name: string | null
          contact_email: string | null
          contact_id: string | null
          contact_name: string | null
          department_id: string | null
          department_name: string | null
          division: string | null
          factory_id: string | null
          factory_name: string | null
          hard_delivery_date: string | null
          id: string | null
          name: string | null
          owner_profile_id: string | null
          production_po_number: string | null
          program_type: string | null
          project_id: string | null
          project_title: string | null
          sales_order_number: string | null
          season_year: string | null
          stage: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_account_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_account_overview"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "opportunity_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contact_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "crm_department_list"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_task_list: {
        Row: {
          assignee_email: string | null
          assignee_name: string | null
          assignee_profile_id: string | null
          body: string | null
          company_id: string | null
          company_name: string | null
          contact_email: string | null
          contact_id: string | null
          contact_name: string | null
          created_at: string | null
          department_id: string | null
          department_name: string | null
          due_at: string | null
          id: string | null
          opportunity_id: string | null
          opportunity_name: string | null
          opportunity_stage: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_account_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_account_overview"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "task_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contact_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "crm_department_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunity_list"
            referencedColumns: ["id"]
          },
        ]
      }
      dam_asset_library: {
        Row: {
          asset_type: string | null
          company_name: string | null
          file_type: string | null
          filename: string | null
          id: string | null
          licensor_name: string | null
          product_subtype_name: string | null
          property_name: string | null
          relative_path: string | null
          sku: string | null
          style_group_id: string | null
          style_group_sku: string | null
          style_group_title: string | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          workflow_status: string | null
        }
        Relationships: []
      }
      global_search: {
        Row: {
          entity_type: string | null
          id: string | null
          source_table: string | null
          subtitle: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      plm_item_status: {
        Row: {
          company_name: string | null
          item_id: string | null
          item_number: string | null
          item_status: string | null
          licensing_milestone: string | null
          licensing_status: string | null
          licensor_name: string | null
          name: string | null
          production_order_line_id: string | null
          production_order_number: string | null
          production_status: string | null
          property_name: string | null
          quantity_ordered: number | null
          quantity_shipped: number | null
          style_number: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      pm_product_assets: {
        Row: {
          asset_id: string | null
          asset_title: string | null
          design_id: string | null
          design_title: string | null
          filename: string | null
          link_confidence: Database["app"]["Enums"]["source_confidence"] | null
          product_code: string | null
          product_id: string | null
          product_name: string | null
          relative_path: string | null
          style_group_id: string | null
          style_group_sku: string | null
          style_group_title: string | null
          thumbnail_url: string | null
        }
        Relationships: []
      }
      pm_product_board: {
        Row: {
          buyer_contact_id: string | null
          buyer_name: string | null
          clickup_task_id: string | null
          code: string | null
          company_id: string | null
          company_name: string | null
          cover_url: string | null
          factory_id: string | null
          factory_name: string | null
          id: string | null
          licensor_id: string | null
          licensor_name: string | null
          lifecycle_status: string | null
          name: string | null
          plm_item_id: string | null
          plm_item_number: string | null
          product_type_id: string | null
          product_type_name: string | null
          project_id: string | null
          project_title: string | null
          property_id: string | null
          property_name: string | null
          stage: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_buyer_contact_id_fkey"
            columns: ["buyer_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contact_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_account_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_account_overview"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_plm_item_id_fkey"
            columns: ["plm_item_id"]
            isOneToOne: false
            referencedRelation: "plm_item_status"
            referencedColumns: ["item_id"]
          },
        ]
      }
    }
    Functions: {
      crm_set_opportunity_stage: {
        Args: { p_opportunity_id: string; p_stage: string }
        Returns: Database["crm"]["Tables"]["opportunity"]["Row"]
        SetofOptions: {
          from: "*"
          to: "opportunity"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      crm_update_account: {
        Args: {
          p_chain_type?: string
          p_company_id: string
          p_customer_status?: string
          p_domain?: string
          p_name?: string
          p_routing_aliases?: string
          p_so_patterns?: string
        }
        Returns: Database["core"]["Tables"]["company"]["Row"]
        SetofOptions: {
          from: "*"
          to: "company"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      crm_update_contact: {
        Args: {
          p_company_id?: string
          p_contact_id: string
          p_contact_type?: string
          p_crm_department_id?: string
          p_email?: string
          p_first_name?: string
          p_full_name?: string
          p_job_title?: string
          p_last_name?: string
          p_phone?: string
          p_scope?: string
        }
        Returns: Database["core"]["Tables"]["contact"]["Row"]
        SetofOptions: {
          from: "*"
          to: "contact"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_user_profile: { Args: never; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  app: {
    Tables: {
      activity: {
        Row: {
          action: string
          actor_profile_id: string | null
          created_at: string
          id: string
          payload: Json
          source_id: string | null
          source_system: string | null
          summary: string | null
          target_id: string
          target_schema: string
          target_table: string
        }
        Insert: {
          action: string
          actor_profile_id?: string | null
          created_at?: string
          id?: string
          payload?: Json
          source_id?: string | null
          source_system?: string | null
          summary?: string | null
          target_id: string
          target_schema: string
          target_table: string
        }
        Update: {
          action?: string
          actor_profile_id?: string | null
          created_at?: string
          id?: string
          payload?: Json
          source_id?: string | null
          source_system?: string | null
          summary?: string | null
          target_id?: string
          target_schema?: string
          target_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      app_access: {
        Row: {
          app: Database["app"]["Enums"]["app_name"]
          granted_at: string
          granted_by_profile_id: string | null
          id: string
          profile_id: string
          revoked_at: string | null
        }
        Insert: {
          app: Database["app"]["Enums"]["app_name"]
          granted_at?: string
          granted_by_profile_id?: string | null
          id?: string
          profile_id: string
          revoked_at?: string | null
        }
        Update: {
          app?: Database["app"]["Enums"]["app_name"]
          granted_at?: string
          granted_by_profile_id?: string | null
          id?: string
          profile_id?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_access_granted_by_profile_id_fkey"
            columns: ["granted_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_access_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      comment: {
        Row: {
          body: string
          created_at: string
          created_by_profile_id: string | null
          id: string
          metadata: Json
          source_id: string | null
          source_system: string | null
          target_id: string
          target_schema: string
          target_table: string
          updated_at: string
          visibility: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by_profile_id?: string | null
          id?: string
          metadata?: Json
          source_id?: string | null
          source_system?: string | null
          target_id: string
          target_schema: string
          target_table: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by_profile_id?: string | null
          id?: string
          metadata?: Json
          source_id?: string | null
          source_system?: string | null
          target_id?: string
          target_schema?: string
          target_table?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      file_object: {
        Row: {
          bucket: string | null
          byte_size: number | null
          checksum: string | null
          created_at: string
          created_by_profile_id: string | null
          filename: string | null
          id: string
          metadata: Json
          mime_type: string | null
          object_key: string | null
          source_id: string | null
          source_system: string | null
          source_table: string | null
          storage_provider: Database["app"]["Enums"]["file_storage_provider"]
          thumbnail_url: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          bucket?: string | null
          byte_size?: number | null
          checksum?: string | null
          created_at?: string
          created_by_profile_id?: string | null
          filename?: string | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          object_key?: string | null
          source_id?: string | null
          source_system?: string | null
          source_table?: string | null
          storage_provider?: Database["app"]["Enums"]["file_storage_provider"]
          thumbnail_url?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          bucket?: string | null
          byte_size?: number | null
          checksum?: string | null
          created_at?: string
          created_by_profile_id?: string | null
          filename?: string | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          object_key?: string | null
          source_id?: string | null
          source_system?: string | null
          source_table?: string | null
          storage_provider?: Database["app"]["Enums"]["file_storage_provider"]
          thumbnail_url?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_object_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      notification: {
        Row: {
          app: Database["app"]["Enums"]["app_name"]
          body: string | null
          created_at: string
          id: string
          payload: Json
          profile_id: string
          read_at: string | null
          target_id: string | null
          target_schema: string | null
          target_table: string | null
          title: string
        }
        Insert: {
          app: Database["app"]["Enums"]["app_name"]
          body?: string | null
          created_at?: string
          id?: string
          payload?: Json
          profile_id: string
          read_at?: string | null
          target_id?: string | null
          target_schema?: string | null
          target_table?: string | null
          title: string
        }
        Update: {
          app?: Database["app"]["Enums"]["app_name"]
          body?: string | null
          created_at?: string
          id?: string
          payload?: Json
          profile_id?: string
          read_at?: string | null
          target_id?: string | null
          target_schema?: string | null
          target_table?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      profile: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          external_identifier: string | null
          id: string
          provider: string | null
          source_refs: Json
          status: Database["app"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          external_identifier?: string | null
          id?: string
          provider?: string | null
          source_refs?: Json
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          external_identifier?: string | null
          id?: string
          provider?: string | null
          source_refs?: Json
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: []
      }
      role: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: Database["app"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: Database["app"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: Database["app"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      user_role: {
        Row: {
          granted_at: string
          granted_by_profile_id: string | null
          id: string
          profile_id: string
          revoked_at: string | null
          role_id: string
        }
        Insert: {
          granted_at?: string
          granted_by_profile_id?: string | null
          id?: string
          profile_id: string
          revoked_at?: string | null
          role_id: string
        }
        Update: {
          granted_at?: string
          granted_by_profile_id?: string | null
          id?: string
          profile_id?: string
          revoked_at?: string | null
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_granted_by_profile_id_fkey"
            columns: ["granted_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "role"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_profile_id: { Args: never; Returns: string }
      has_any_role: {
        Args: { required_roles: Database["app"]["Enums"]["app_role"][] }
        Returns: boolean
      }
      has_app_access: {
        Args: { required_app: Database["app"]["Enums"]["app_name"] }
        Returns: boolean
      }
      has_role: {
        Args: { required_role: Database["app"]["Enums"]["app_role"] }
        Returns: boolean
      }
      jwt_role_names: { Args: never; Returns: string[] }
    }
    Enums: {
      app_name: "dam" | "crm" | "pm" | "plm" | "admin"
      app_role:
        | "administrator"
        | "sales"
        | "licensing"
        | "designer"
        | "viewer"
        | "vendor"
      entity_status: "active" | "inactive" | "archived" | "deleted"
      file_storage_provider:
        | "supabase"
        | "spaces"
        | "directus"
        | "external"
        | "local"
      source_confidence:
        | "verified"
        | "probable"
        | "possible"
        | "unmatched"
        | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  core: {
    Tables: {
      character: {
        Row: {
          code: string | null
          created_at: string
          id: string
          metadata: Json
          name: string
          property_id: string | null
          status: Database["app"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          property_id?: string | null
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          property_id?: string | null
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property"
            referencedColumns: ["id"]
          },
        ]
      }
      company: {
        Row: {
          account_owner_profile_id: string | null
          address: Json
          chain_type: string | null
          company_type: string
          created_at: string
          customer_status: string | null
          domain: string | null
          id: string
          legal_name: string | null
          metadata: Json
          name: string
          normalized_name: string | null
          phone: string | null
          primary_salesperson_profile_id: string | null
          routing_aliases: string | null
          so_patterns: string | null
          status: Database["app"]["Enums"]["entity_status"]
          updated_at: string
          website: string | null
        }
        Insert: {
          account_owner_profile_id?: string | null
          address?: Json
          chain_type?: string | null
          company_type?: string
          created_at?: string
          customer_status?: string | null
          domain?: string | null
          id?: string
          legal_name?: string | null
          metadata?: Json
          name: string
          normalized_name?: string | null
          phone?: string | null
          primary_salesperson_profile_id?: string | null
          routing_aliases?: string | null
          so_patterns?: string | null
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          account_owner_profile_id?: string | null
          address?: Json
          chain_type?: string | null
          company_type?: string
          created_at?: string
          customer_status?: string | null
          domain?: string | null
          id?: string
          legal_name?: string | null
          metadata?: Json
          name?: string
          normalized_name?: string | null
          phone?: string | null
          primary_salesperson_profile_id?: string | null
          routing_aliases?: string | null
          so_patterns?: string | null
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      company_source_ref: {
        Row: {
          company_id: string
          confidence: Database["app"]["Enums"]["source_confidence"]
          created_at: string
          id: string
          raw: Json
          source_code: string | null
          source_id: string
          source_name: string | null
          source_system: string
          source_table: string
        }
        Insert: {
          company_id: string
          confidence?: Database["app"]["Enums"]["source_confidence"]
          created_at?: string
          id?: string
          raw?: Json
          source_code?: string | null
          source_id: string
          source_name?: string | null
          source_system: string
          source_table: string
        }
        Update: {
          company_id?: string
          confidence?: Database["app"]["Enums"]["source_confidence"]
          created_at?: string
          id?: string
          raw?: Json
          source_code?: string | null
          source_id?: string
          source_name?: string | null
          source_system?: string
          source_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_source_ref_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      contact: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          metadata: Json
          phone: string | null
          status: Database["app"]["Enums"]["entity_status"]
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          metadata?: Json
          phone?: string | null
          status?: Database["app"]["Enums"]["entity_status"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          metadata?: Json
          phone?: string | null
          status?: Database["app"]["Enums"]["entity_status"]
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contact_company: {
        Row: {
          company_id: string
          contact_id: string
          contact_type: string | null
          crm_department_id: string | null
          ended_at: string | null
          id: string
          is_primary: boolean
          metadata: Json
          relationship_type: string
          scope: string | null
          started_at: string | null
          title: string | null
        }
        Insert: {
          company_id: string
          contact_id: string
          contact_type?: string | null
          crm_department_id?: string | null
          ended_at?: string | null
          id?: string
          is_primary?: boolean
          metadata?: Json
          relationship_type?: string
          scope?: string | null
          started_at?: string | null
          title?: string | null
        }
        Update: {
          company_id?: string
          contact_id?: string
          contact_type?: string | null
          crm_department_id?: string | null
          ended_at?: string | null
          id?: string
          is_primary?: boolean
          metadata?: Json
          relationship_type?: string
          scope?: string | null
          started_at?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_company_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_company_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_source_ref: {
        Row: {
          confidence: Database["app"]["Enums"]["source_confidence"]
          contact_id: string
          created_at: string
          id: string
          raw: Json
          source_email: string | null
          source_id: string
          source_system: string
          source_table: string
        }
        Insert: {
          confidence?: Database["app"]["Enums"]["source_confidence"]
          contact_id: string
          created_at?: string
          id?: string
          raw?: Json
          source_email?: string | null
          source_id: string
          source_system: string
          source_table: string
        }
        Update: {
          confidence?: Database["app"]["Enums"]["source_confidence"]
          contact_id?: string
          created_at?: string
          id?: string
          raw?: Json
          source_email?: string | null
          source_id?: string
          source_system?: string
          source_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_source_ref_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact"
            referencedColumns: ["id"]
          },
        ]
      }
      factory: {
        Row: {
          code: string | null
          company_id: string | null
          country: string | null
          created_at: string
          id: string
          metadata: Json
          name: string
          status: Database["app"]["Enums"]["entity_status"]
          updated_at: string
          vendor_group: string | null
        }
        Insert: {
          code?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
          vendor_group?: string | null
        }
        Update: {
          code?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
          vendor_group?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "factory_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      factory_source_ref: {
        Row: {
          confidence: Database["app"]["Enums"]["source_confidence"]
          created_at: string
          factory_id: string
          id: string
          raw: Json
          source_code: string | null
          source_id: string
          source_system: string
          source_table: string
        }
        Insert: {
          confidence?: Database["app"]["Enums"]["source_confidence"]
          created_at?: string
          factory_id: string
          id?: string
          raw?: Json
          source_code?: string | null
          source_id: string
          source_system: string
          source_table: string
        }
        Update: {
          confidence?: Database["app"]["Enums"]["source_confidence"]
          created_at?: string
          factory_id?: string
          id?: string
          raw?: Json
          source_code?: string | null
          source_id?: string
          source_system?: string
          source_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "factory_source_ref_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factory"
            referencedColumns: ["id"]
          },
        ]
      }
      licensor: {
        Row: {
          code: string | null
          created_at: string
          id: string
          metadata: Json
          name: string
          status: Database["app"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: []
      }
      merch_group: {
        Row: {
          code: string | null
          created_at: string
          id: string
          level: number
          metadata: Json
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          level?: number
          metadata?: Json
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          level?: number
          metadata?: Json
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merch_group_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "merch_group"
            referencedColumns: ["id"]
          },
        ]
      }
      product_category: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_category_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_category"
            referencedColumns: ["id"]
          },
        ]
      }
      product_subtype: {
        Row: {
          code: string | null
          created_at: string
          id: string
          metadata: Json
          name: string
          product_type_id: string | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          product_type_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          product_type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_subtype_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_type"
            referencedColumns: ["id"]
          },
        ]
      }
      product_type: {
        Row: {
          category_id: string | null
          code: string | null
          created_at: string
          id: string
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          code?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          code?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_type_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_category"
            referencedColumns: ["id"]
          },
        ]
      }
      property: {
        Row: {
          code: string | null
          created_at: string
          id: string
          licensor_id: string | null
          metadata: Json
          name: string
          status: Database["app"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          licensor_id?: string | null
          metadata?: Json
          name: string
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          licensor_id?: string | null
          metadata?: Json
          name?: string
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_licensor_id_fkey"
            columns: ["licensor_id"]
            isOneToOne: false
            referencedRelation: "licensor"
            referencedColumns: ["id"]
          },
        ]
      }
      sku_ref: {
        Row: {
          confidence: Database["app"]["Enums"]["source_confidence"]
          created_at: string
          entity_id: string
          entity_schema: string
          entity_table: string
          id: string
          normalized_sku: string | null
          raw: Json
          sku: string
          source_id: string | null
          source_system: string | null
          source_table: string | null
        }
        Insert: {
          confidence?: Database["app"]["Enums"]["source_confidence"]
          created_at?: string
          entity_id: string
          entity_schema: string
          entity_table: string
          id?: string
          normalized_sku?: string | null
          raw?: Json
          sku: string
          source_id?: string | null
          source_system?: string | null
          source_table?: string | null
        }
        Update: {
          confidence?: Database["app"]["Enums"]["source_confidence"]
          created_at?: string
          entity_id?: string
          entity_schema?: string
          entity_table?: string
          id?: string
          normalized_sku?: string | null
          raw?: Json
          sku?: string
          source_id?: string | null
          source_system?: string | null
          source_table?: string | null
        }
        Relationships: []
      }
      taxonomy_source_ref: {
        Row: {
          confidence: Database["app"]["Enums"]["source_confidence"]
          created_at: string
          entity_id: string
          entity_schema: string
          entity_table: string
          id: string
          raw: Json
          source_code: string | null
          source_id: string
          source_name: string | null
          source_system: string
          source_table: string
        }
        Insert: {
          confidence?: Database["app"]["Enums"]["source_confidence"]
          created_at?: string
          entity_id: string
          entity_schema?: string
          entity_table: string
          id?: string
          raw?: Json
          source_code?: string | null
          source_id: string
          source_name?: string | null
          source_system: string
          source_table: string
        }
        Update: {
          confidence?: Database["app"]["Enums"]["source_confidence"]
          created_at?: string
          entity_id?: string
          entity_schema?: string
          entity_table?: string
          id?: string
          raw?: Json
          source_code?: string | null
          source_id?: string
          source_name?: string | null
          source_system?: string
          source_table?: string
        }
        Relationships: []
      }
      vendor_contact: {
        Row: {
          contact_id: string | null
          factory_id: string | null
          id: string
          is_primary: boolean
          metadata: Json
          role: string | null
        }
        Insert: {
          contact_id?: string | null
          factory_id?: string | null
          id?: string
          is_primary?: boolean
          metadata?: Json
          role?: string | null
        }
        Update: {
          contact_id?: string | null
          factory_id?: string | null
          id?: string
          is_primary?: boolean
          metadata?: Json
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_contact_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contact_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factory"
            referencedColumns: ["id"]
          },
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
  crm: {
    Tables: {
      ai_model_config: {
        Row: {
          config: Json
          email_routing_model: string | null
          feature: string | null
          fireflies_routing_model: string | null
          id: string
          model: string | null
          name: string | null
          opportunity_summary_model: string | null
          provider: string | null
          transcript_split_model: string | null
          updated_at: string
          updated_by_profile_id: string | null
        }
        Insert: {
          config?: Json
          email_routing_model?: string | null
          feature?: string | null
          fireflies_routing_model?: string | null
          id?: string
          model?: string | null
          name?: string | null
          opportunity_summary_model?: string | null
          provider?: string | null
          transcript_split_model?: string | null
          updated_at?: string
          updated_by_profile_id?: string | null
        }
        Update: {
          config?: Json
          email_routing_model?: string | null
          feature?: string | null
          fireflies_routing_model?: string | null
          id?: string
          model?: string | null
          name?: string | null
          opportunity_summary_model?: string | null
          provider?: string | null
          transcript_split_model?: string | null
          updated_at?: string
          updated_by_profile_id?: string | null
        }
        Relationships: []
      }
      department: {
        Row: {
          category: string | null
          company_id: string
          created_at: string
          division: string | null
          id: string
          is_active: boolean
          metadata: Json
          name: string
          primary_contact_id: string | null
          sort_order: number | null
          status: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string
          division?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          primary_contact_id?: string | null
          sort_order?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string
          division?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          primary_contact_id?: string | null
          sort_order?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_message: {
        Row: {
          body_preview: string | null
          body_storage_ref: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          department_id: string | null
          detected_po_numbers: string | null
          detected_so_numbers: string | null
          direction: string | null
          external_id: string | null
          external_source: string | null
          id: string
          mailbox_owner_profile_id: string | null
          metadata: Json
          opportunity_id: string | null
          outlook_message_id: string | null
          received_at: string | null
          recipients: string | null
          routing_method: string | null
          routing_status: string | null
          sender: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          body_preview?: string | null
          body_storage_ref?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          department_id?: string | null
          detected_po_numbers?: string | null
          detected_so_numbers?: string | null
          direction?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          mailbox_owner_profile_id?: string | null
          metadata?: Json
          opportunity_id?: string | null
          outlook_message_id?: string | null
          received_at?: string | null
          recipients?: string | null
          routing_method?: string | null
          routing_status?: string | null
          sender?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          body_preview?: string | null
          body_storage_ref?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          department_id?: string | null
          detected_po_numbers?: string | null
          detected_so_numbers?: string | null
          direction?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          mailbox_owner_profile_id?: string | null
          metadata?: Json
          opportunity_id?: string | null
          outlook_message_id?: string | null
          received_at?: string | null
          recipients?: string | null
          routing_method?: string | null
          routing_status?: string | null
          sender?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_message_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_message_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunity"
            referencedColumns: ["id"]
          },
        ]
      }
      ignore_rule: {
        Row: {
          created_at: string
          created_by_profile_id: string | null
          emails_skipped: number
          id: string
          match_type: string | null
          name: string | null
          pattern: string
          reason: string | null
          rule_type: string
        }
        Insert: {
          created_at?: string
          created_by_profile_id?: string | null
          emails_skipped?: number
          id?: string
          match_type?: string | null
          name?: string | null
          pattern: string
          reason?: string | null
          rule_type?: string
        }
        Update: {
          created_at?: string
          created_by_profile_id?: string | null
          emails_skipped?: number
          id?: string
          match_type?: string | null
          name?: string | null
          pattern?: string
          reason?: string | null
          rule_type?: string
        }
        Relationships: []
      }
      licensor_approval_thread: {
        Row: {
          company_id: string | null
          created_at: string
          due_date: string | null
          external_id: string | null
          external_source: string | null
          id: string
          licensor_comments: string | null
          licensor_id: string | null
          metadata: Json
          name: string | null
          opportunity_id: string | null
          product_submission_id: string | null
          property_id: string | null
          property_name: string | null
          response_date: string | null
          revision_request_id: string | null
          stage: string | null
          status: string | null
          subject: string | null
          submitted_date: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          due_date?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          licensor_comments?: string | null
          licensor_id?: string | null
          metadata?: Json
          name?: string | null
          opportunity_id?: string | null
          product_submission_id?: string | null
          property_id?: string | null
          property_name?: string | null
          response_date?: string | null
          revision_request_id?: string | null
          stage?: string | null
          status?: string | null
          subject?: string | null
          submitted_date?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          due_date?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          licensor_comments?: string | null
          licensor_id?: string | null
          metadata?: Json
          name?: string | null
          opportunity_id?: string | null
          product_submission_id?: string | null
          property_id?: string | null
          property_name?: string | null
          response_date?: string | null
          revision_request_id?: string | null
          stage?: string | null
          status?: string | null
          subject?: string | null
          submitted_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "licensor_approval_thread_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunity"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_note: {
        Row: {
          action_items: string | null
          body: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          created_by_profile_id: string | null
          department_id: string | null
          external_id: string | null
          external_source: string | null
          fireflies_transcript_id: string | null
          id: string
          meeting_at: string | null
          metadata: Json
          opportunity_id: string | null
          participants: string | null
          source: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          action_items?: string | null
          body?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by_profile_id?: string | null
          department_id?: string | null
          external_id?: string | null
          external_source?: string | null
          fireflies_transcript_id?: string | null
          id?: string
          meeting_at?: string | null
          metadata?: Json
          opportunity_id?: string | null
          participants?: string | null
          source?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          action_items?: string | null
          body?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by_profile_id?: string | null
          department_id?: string | null
          external_id?: string | null
          external_source?: string | null
          fireflies_transcript_id?: string | null
          id?: string
          meeting_at?: string | null
          metadata?: Json
          opportunity_id?: string | null
          participants?: string | null
          source?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_note_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_note_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunity"
            referencedColumns: ["id"]
          },
        ]
      }
      note: {
        Row: {
          action_items: string | null
          body: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          created_by_profile_id: string | null
          department_id: string | null
          fireflies_transcript_id: string | null
          id: string
          opportunity_id: string | null
          source: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          action_items?: string | null
          body?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by_profile_id?: string | null
          department_id?: string | null
          fireflies_transcript_id?: string | null
          id?: string
          opportunity_id?: string | null
          source?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          action_items?: string | null
          body?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by_profile_id?: string | null
          department_id?: string | null
          fireflies_transcript_id?: string | null
          id?: string
          opportunity_id?: string | null
          source?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunity"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity: {
        Row: {
          ai_state: string | null
          ai_summary: string | null
          close_date: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          customer_incoterms: string | null
          department_id: string | null
          directive_source: string | null
          division: string | null
          estimated_value: number | null
          external_id: string | null
          external_source: string | null
          factory_id: string | null
          factory_incoterms: string | null
          hard_delivery_date: string | null
          id: string
          import_po_number: string | null
          licensed: boolean | null
          metadata: Json
          name: string
          origin_country: string | null
          owner_profile_id: string | null
          probability: number | null
          production_order_id: string | null
          production_po_number: string | null
          program_type: string | null
          project_id: string | null
          requires_new_pricing: boolean | null
          sales_order_number: string | null
          sample_approval_method: string | null
          sample_required: boolean | null
          season_year: string | null
          stage: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          ai_state?: string | null
          ai_summary?: string | null
          close_date?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          customer_incoterms?: string | null
          department_id?: string | null
          directive_source?: string | null
          division?: string | null
          estimated_value?: number | null
          external_id?: string | null
          external_source?: string | null
          factory_id?: string | null
          factory_incoterms?: string | null
          hard_delivery_date?: string | null
          id?: string
          import_po_number?: string | null
          licensed?: boolean | null
          metadata?: Json
          name: string
          origin_country?: string | null
          owner_profile_id?: string | null
          probability?: number | null
          production_order_id?: string | null
          production_po_number?: string | null
          program_type?: string | null
          project_id?: string | null
          requires_new_pricing?: boolean | null
          sales_order_number?: string | null
          sample_approval_method?: string | null
          sample_required?: boolean | null
          season_year?: string | null
          stage?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          ai_state?: string | null
          ai_summary?: string | null
          close_date?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          customer_incoterms?: string | null
          department_id?: string | null
          directive_source?: string | null
          division?: string | null
          estimated_value?: number | null
          external_id?: string | null
          external_source?: string | null
          factory_id?: string | null
          factory_incoterms?: string | null
          hard_delivery_date?: string | null
          id?: string
          import_po_number?: string | null
          licensed?: boolean | null
          metadata?: Json
          name?: string
          origin_country?: string | null
          owner_profile_id?: string | null
          probability?: number | null
          production_order_id?: string | null
          production_po_number?: string | null
          program_type?: string | null
          project_id?: string | null
          requires_new_pricing?: boolean | null
          sales_order_number?: string | null
          sample_approval_method?: string | null
          sample_required?: boolean | null
          season_year?: string | null
          stage?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_product: {
        Row: {
          created_at: string
          id: string
          opportunity_id: string
          product_id: string
          relationship_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          opportunity_id: string
          product_id: string
          relationship_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          opportunity_id?: string
          product_id?: string
          relationship_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_product_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunity"
            referencedColumns: ["id"]
          },
        ]
      }
      task: {
        Row: {
          assignee_profile_id: string | null
          body: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          department_id: string | null
          due_at: string | null
          id: string
          opportunity_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_profile_id?: string | null
          body?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          department_id?: string | null
          due_at?: string | null
          id?: string
          opportunity_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_profile_id?: string | null
          body?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          department_id?: string | null
          due_at?: string | null
          id?: string
          opportunity_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunity"
            referencedColumns: ["id"]
          },
        ]
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
  api: {
    Enums: {},
  },
  app: {
    Enums: {
      app_name: ["dam", "crm", "pm", "plm", "admin"],
      app_role: [
        "administrator",
        "sales",
        "licensing",
        "designer",
        "viewer",
        "vendor",
      ],
      entity_status: ["active", "inactive", "archived", "deleted"],
      file_storage_provider: [
        "supabase",
        "spaces",
        "directus",
        "external",
        "local",
      ],
      source_confidence: [
        "verified",
        "probable",
        "possible",
        "unmatched",
        "rejected",
      ],
    },
  },
  core: {
    Enums: {},
  },
  crm: {
    Enums: {},
  },
} as const

