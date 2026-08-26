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
    PostgrestVersion: "14.5"
  }
  api: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      art_piece_library: {
        Row: {
          art_type: string | null
          artist_id: string | null
          artist_name: string | null
          created_at: string | null
          id: string | null
          legacy_artist_text: string | null
          linked_items: Json | null
          name: string | null
          raw: Json | null
          source_id: string | null
          source_system: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      coldlion_licensor_reconciliation: {
        Row: {
          canonical_not_active: boolean | null
          coldlion_source_ref_count: number | null
          company_code: string | null
          designflow_source_ref_count: number | null
          division_code: string | null
          first_seen_at: string | null
          item_cooccurrence_count: number | null
          last_seen_at: string | null
          last_sync_run_id: string | null
          matched_code: string | null
          matched_licensor_id: string | null
          matched_name: string | null
          matched_status: Database["app"]["Enums"]["entity_status"] | null
          mg_code: string | null
          mg_type_code: string | null
          mg_type_desc: string | null
          name_differs_from_canonical: boolean | null
          open_review_confidence: string | null
          open_review_id: string | null
          open_review_proposed_licensor_id: string | null
          open_review_reason: string | null
          open_review_resolved_licensor_id: string | null
          open_review_status: string | null
          resolution_reason: string | null
          resolution_status: string | null
          source_name: string | null
        }
        Relationships: []
      }
      coldlion_property_reconciliation: {
        Row: {
          canonical_not_active: boolean | null
          canonical_parent_code: string | null
          canonical_parent_licensor_id: string | null
          canonical_parent_name: string | null
          canonical_parent_status:
            | Database["app"]["Enums"]["entity_status"]
            | null
          coldlion_lacks_parent_edge: boolean | null
          coldlion_source_ref_count: number | null
          company_code: string | null
          designflow_source_ref_count: number | null
          division_code: string | null
          first_seen_at: string | null
          item_cooccurrence_count: number | null
          last_seen_at: string | null
          last_sync_run_id: string | null
          matched_code: string | null
          matched_name: string | null
          matched_property_id: string | null
          matched_status: Database["app"]["Enums"]["entity_status"] | null
          mg_code: string | null
          mg_type_code: string | null
          mg_type_desc: string | null
          name_differs_from_canonical: boolean | null
          open_review_confidence: string | null
          open_review_id: string | null
          open_review_proposed_property_id: string | null
          open_review_reason: string | null
          open_review_resolved_property_id: string | null
          open_review_status: string | null
          resolution_reason: string | null
          resolution_status: string | null
          source_name: string | null
        }
        Relationships: []
      }
      coldlion_taxonomy_cutover_summary: {
        Row: {
          division_count: number | null
          earliest_first_seen_at: string | null
          entity_type: string | null
          latest_last_seen_at: string | null
          linked_rows: number | null
          mirror_rows: number | null
          resolution_status: string | null
          unlinked_rows: number | null
        }
        Relationships: []
      }
      crm_account_list: {
        Row: {
          account_owner_profile_id: string | null
          chain_type: string | null
          company_type: string | null
          customer_status: string | null
          display_name: string | null
          domain: string | null
          id: string | null
          is_potential: boolean | null
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
          display_name?: string | null
          domain?: string | null
          id?: string | null
          is_potential?: boolean | null
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
          display_name?: string | null
          domain?: string | null
          id?: string | null
          is_potential?: boolean | null
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
            foreignKeyName: "contact_company_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_company_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_overview"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contact_company_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_picker_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_company_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dam_customer_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_company_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "pm_customer_list"
            referencedColumns: ["id"]
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
      crm_contact_segment_counts: {
        Row: {
          contact_count: number | null
          crm_segment: string | null
        }
        Relationships: []
      }
      crm_contact_segment_list: {
        Row: {
          company_customer_status: string | null
          company_id: string | null
          company_name: string | null
          contact_type: string | null
          crm_segment: string | null
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
            foreignKeyName: "contact_company_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_company_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_overview"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contact_company_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_picker_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_company_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dam_customer_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_company_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "pm_customer_list"
            referencedColumns: ["id"]
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
      crm_customer_list: {
        Row: {
          account_owner_profile_id: string | null
          chain_type: string | null
          company_type: string | null
          customer_status: string | null
          display_name: string | null
          domain: string | null
          id: string | null
          is_potential: boolean | null
          logo_url: string | null
          name: string | null
          primary_salesperson_profile_id: string | null
          routing_aliases: string | null
          so_patterns: string | null
          status: Database["app"]["Enums"]["entity_status"] | null
          updated_at: string | null
        }
        Relationships: []
      }
      crm_customer_overview: {
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
      crm_customer_picker_list: {
        Row: {
          core_status: Database["app"]["Enums"]["entity_status"] | null
          crm_status: Database["app"]["Enums"]["entity_status"] | null
          crm_status_changed_at: string | null
          crm_status_reason: string | null
          display_name: string | null
          id: string | null
          name: string | null
          updated_at: string | null
        }
        Relationships: []
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
            foreignKeyName: "department_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_overview"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "department_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_picker_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dam_customer_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "pm_customer_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contact_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contact_segment_list"
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
            foreignKeyName: "email_message_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_message_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_overview"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "email_message_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_picker_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_message_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dam_customer_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_message_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "pm_customer_list"
            referencedColumns: ["id"]
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
      crm_factory_picker_list: {
        Row: {
          code: string | null
          core_status: Database["app"]["Enums"]["entity_status"] | null
          crm_status: Database["app"]["Enums"]["entity_status"] | null
          crm_status_changed_at: string | null
          crm_status_reason: string | null
          display_name: string | null
          id: string | null
          name: string | null
          updated_at: string | null
        }
        Relationships: []
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
      crm_ingested_domain_list: {
        Row: {
          display_name: string | null
          domain: string | null
          email_count: number | null
          first_seen_at: string | null
          id: string | null
          last_seen_at: string | null
          last_sender: string | null
          sample_subject: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          display_name?: string | null
          domain?: never
          email_count?: number | null
          first_seen_at?: string | null
          id?: string | null
          last_seen_at?: string | null
          last_sender?: never
          sample_subject?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          display_name?: string | null
          domain?: never
          email_count?: number | null
          first_seen_at?: string | null
          id?: string | null
          last_seen_at?: string | null
          last_sender?: never
          sample_subject?: string | null
          status?: string | null
          updated_at?: string | null
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
            foreignKeyName: "meeting_note_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_note_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_overview"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "meeting_note_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_picker_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_note_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dam_customer_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_note_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "pm_customer_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_note_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contact_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_note_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contact_segment_list"
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
            foreignKeyName: "note_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_overview"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "note_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_picker_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dam_customer_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "pm_customer_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contact_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contact_segment_list"
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
            foreignKeyName: "opportunity_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_overview"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "opportunity_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_picker_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dam_customer_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "pm_customer_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contact_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contact_segment_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "crm_department_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "crm_factory_picker_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "dam_factory_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "pm_factory_list"
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
            foreignKeyName: "task_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_overview"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "task_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_picker_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dam_customer_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "pm_customer_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contact_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contact_segment_list"
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
      dam_customer_list: {
        Row: {
          core_status: Database["app"]["Enums"]["entity_status"] | null
          dam_settings_updated_at: string | null
          dam_status: Database["app"]["Enums"]["entity_status"] | null
          dam_status_changed_at: string | null
          dam_status_reason: string | null
          display_name: string | null
          id: string | null
          name: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      dam_factory_list: {
        Row: {
          code: string | null
          core_status: Database["app"]["Enums"]["entity_status"] | null
          dam_status: Database["app"]["Enums"]["entity_status"] | null
          dam_status_changed_at: string | null
          dam_status_reason: string | null
          display_name: string | null
          id: string | null
          name: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      dam_order_list: {
        Row: {
          actual_ship_date: string | null
          assortment_component_ordinal: number | null
          assortment_id: string | null
          booking_state: string | null
          cancel_date: string | null
          cancel_raw: string | null
          cargo_forecast_date: string | null
          cargo_forecast_raw: string | null
          case_pack: number | null
          cases_reported: number | null
          close_tracking: boolean | null
          coldlion_source_id: string | null
          company_id: string | null
          container_booking_group: string | null
          contractual_sample_reorder: boolean | null
          customer_name: string | null
          customer_po_number: string | null
          customer_suffix: string | null
          eta: string | null
          etd: string | null
          factory_id: string | null
          google_source_id: string | null
          item_description: string | null
          item_id: string | null
          item_link_missing: boolean | null
          item_link_type_mismatch: boolean | null
          item_name: string | null
          item_number: string | null
          item_style_number: string | null
          line_created_at: string | null
          line_number: string | null
          line_status: string | null
          line_updated_at: string | null
          line_void_reason: string | null
          line_voided_at: string | null
          master_data_customer: string | null
          master_data_default_vendor: string | null
          master_data_description: string | null
          master_data_license_status: string | null
          master_data_licensor: string | null
          master_data_match_status: string | null
          master_data_tracker_type: string | null
          mbl: string | null
          order_date: string | null
          order_depth_inches: number | null
          order_id: string | null
          order_line_id: string | null
          order_person: string | null
          order_status: string | null
          order_type: string | null
          order_void_reason: string | null
          order_voided_at: string | null
          ordering_company: string | null
          production_order_number: string | null
          professional_photos: string | null
          quantity_ordered: number | null
          quantity_shipped: number | null
          requested_ship_date: string | null
          seal_container_date: string | null
          sent_po_date: string | null
          ship_to: string | null
          sku: string | null
          sku_normalized: string | null
          snapshot_description: string | null
          snapshot_license_status: string | null
          snapshot_sku: string | null
          snapshot_source_row: string | null
          snapshot_style_type: string | null
          source_style_type: string | null
          start_ship_date: string | null
          start_ship_raw: string | null
          style_tracker_bridge_id: string | null
          style_tracker_row_id: string | null
          test_report: string | null
          unit_cost: number | null
          vendor_delivery_date: string | null
          vendor_name: string | null
          warehouse_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_order_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_account_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_account_overview"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "production_order_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_overview"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "production_order_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_picker_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dam_customer_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "pm_customer_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "crm_factory_picker_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "dam_factory_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "pm_factory_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_line_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "plm_item_status"
            referencedColumns: ["item_id"]
          },
        ]
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
      opa_property_character: {
        Row: {
          base_property_name_interpreted: string | null
          brand_property_id: number | null
          captured_at: string | null
          character_id: number | null
          character_name: string | null
          character_name_normalised_interpreted: string | null
          entitlement_scope: string | null
          licensed_property_id: number | null
          likeness_interpreted: string | null
          likeness_parse_confident: boolean | null
          line_of_business: string | null
          name_is_surname_first_interpreted: boolean | null
          property_name: string | null
          source_url: string | null
        }
        Insert: {
          base_property_name_interpreted?: never
          brand_property_id?: number | null
          captured_at?: string | null
          character_id?: number | null
          character_name?: string | null
          character_name_normalised_interpreted?: never
          entitlement_scope?: string | null
          licensed_property_id?: number | null
          likeness_interpreted?: never
          likeness_parse_confident?: never
          line_of_business?: string | null
          name_is_surname_first_interpreted?: never
          property_name?: string | null
          source_url?: string | null
        }
        Update: {
          base_property_name_interpreted?: never
          brand_property_id?: number | null
          captured_at?: string | null
          character_id?: number | null
          character_name?: string | null
          character_name_normalised_interpreted?: never
          entitlement_scope?: string | null
          licensed_property_id?: number | null
          likeness_interpreted?: never
          likeness_parse_confident?: never
          line_of_business?: string | null
          name_is_surname_first_interpreted?: never
          property_name?: string | null
          source_url?: string | null
        }
        Relationships: []
      }
      opa_property_reconciliation: {
        Row: {
          captured_at: string | null
          core_licensor_codes: string[] | null
          core_property_names: string[] | null
          entitlement_scope: string | null
          last_resolved_at: string | null
          licensed_property_id: number | null
          line_of_business: string | null
          matched_core_property_count: number | null
          matched_core_property_ids: string[] | null
          opa_character_count: number | null
          opa_property_name: string | null
          resolution_status: string | null
          unresolved_character_count: number | null
        }
        Relationships: []
      }
      plm_item_list: {
        Row: {
          dismissed: boolean | null
          division_code: string | null
          erp_updated_at: string | null
          id: string | null
          item_description: string | null
          licensor_code: string | null
          mg_category: string | null
          mg01_code: string | null
          mg02_code: string | null
          mg03_code: string | null
          mg04_code: string | null
          mg05_code: string | null
          mg06_code: string | null
          prepack_code: string | null
          prepack_codes: Json | null
          property_code: string | null
          size_code: string | null
          source_id: string | null
          source_system: string | null
          style_number: string | null
          synced_at: string | null
        }
        Insert: {
          dismissed?: boolean | null
          division_code?: string | null
          erp_updated_at?: string | null
          id?: string | null
          item_description?: string | null
          licensor_code?: string | null
          mg_category?: string | null
          mg01_code?: string | null
          mg02_code?: string | null
          mg03_code?: string | null
          mg04_code?: string | null
          mg05_code?: string | null
          mg06_code?: string | null
          prepack_code?: string | null
          prepack_codes?: Json | null
          property_code?: string | null
          size_code?: string | null
          source_id?: string | null
          source_system?: string | null
          style_number?: string | null
          synced_at?: string | null
        }
        Update: {
          dismissed?: boolean | null
          division_code?: string | null
          erp_updated_at?: string | null
          id?: string | null
          item_description?: string | null
          licensor_code?: string | null
          mg_category?: string | null
          mg01_code?: string | null
          mg02_code?: string | null
          mg03_code?: string | null
          mg04_code?: string | null
          mg05_code?: string | null
          mg06_code?: string | null
          prepack_code?: string | null
          prepack_codes?: Json | null
          property_code?: string | null
          size_code?: string | null
          source_id?: string | null
          source_system?: string | null
          style_number?: string | null
          synced_at?: string | null
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
      pm_customer_list: {
        Row: {
          core_status: Database["app"]["Enums"]["entity_status"] | null
          display_name: string | null
          id: string | null
          name: string | null
          pm_status: Database["app"]["Enums"]["entity_status"] | null
          pm_status_changed_at: string | null
          pm_status_reason: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      pm_factory_list: {
        Row: {
          code: string | null
          core_status: Database["app"]["Enums"]["entity_status"] | null
          display_name: string | null
          id: string | null
          name: string | null
          pm_status: Database["app"]["Enums"]["entity_status"] | null
          pm_status_changed_at: string | null
          pm_status_reason: string | null
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
          blocker_reason: string | null
          brand_assurance_number: string | null
          business_unit: string | null
          buyer_contact_id: string | null
          buyer_name: string | null
          clickup_creator_id: string | null
          clickup_creator_name: string | null
          clickup_folder_id: string | null
          clickup_folder_name: string | null
          clickup_list_id: string | null
          clickup_list_name: string | null
          clickup_orderindex: string | null
          clickup_parent_id: string | null
          clickup_space_id: string | null
          clickup_space_name: string | null
          clickup_status: string | null
          clickup_status_color: string | null
          clickup_status_order: number | null
          clickup_status_type: string | null
          clickup_task_id: string | null
          clickup_time_estimate_ms: number | null
          closure_reason: string | null
          code: string | null
          company_id: string | null
          company_name: string | null
          cover_url: string | null
          created_at: string | null
          department: string | null
          description: string | null
          factory_id: string | null
          factory_name: string | null
          id: string | null
          licensor_id: string | null
          licensor_name: string | null
          lifecycle_status: string | null
          name: string | null
          next_action: string | null
          next_owner_name: string | null
          next_owner_role_name: string | null
          on_shelf_date: string | null
          pi_status: string | null
          plm_item_id: string | null
          plm_item_number: string | null
          pps_requested_date: string | null
          product_type_id: string | null
          product_type_name: string | null
          project_id: string | null
          project_title: string | null
          property_id: string | null
          property_name: string | null
          risk_level: string | null
          stage: string | null
          status: string | null
          updated_at: string | null
          waiting_on: string | null
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
            foreignKeyName: "product_buyer_contact_id_fkey"
            columns: ["buyer_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contact_segment_list"
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
            foreignKeyName: "product_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_overview"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_customer_picker_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dam_customer_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "pm_customer_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "crm_factory_picker_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "dam_factory_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "pm_factory_list"
            referencedColumns: ["id"]
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
      pmt_assets: {
        Row: {
          asset_id: string | null
          asset_name: string | null
          asset_version: number | null
          brand_names: string[] | null
          capture_id: string | null
          character_names: string[] | null
          content_size_bytes: number | null
          content_type: string | null
          date_imported: string | null
          date_last_updated: string | null
          franchise_names: string[] | null
          mime_type: string | null
          property_names: string[] | null
          style_guide_names: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "pmt_asset_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture_health"
            referencedColumns: ["capture_id"]
          },
          {
            foreignKeyName: "pmt_asset_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_latest_capture"
            referencedColumns: ["capture_id"]
          },
        ]
      }
      pmt_authorized_title_summary: {
        Row: {
          absent_from_current_portal_view: boolean | null
          authorized_title_key: string | null
          authorized_title_name: string | null
          capture_id: string | null
          capture_status: string | null
          full_metadata_count: number | null
          notes: string | null
          resolved_property_count: number | null
          unique_asset_count: number | null
          zero_count_meaning: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pmt_authorized_title_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture_health"
            referencedColumns: ["capture_id"]
          },
          {
            foreignKeyName: "pmt_authorized_title_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_latest_capture"
            referencedColumns: ["capture_id"]
          },
        ]
      }
      pmt_capture_health: {
        Row: {
          actual: number | null
          anomaly_count: number | null
          capture_id: string | null
          capture_kind: string | null
          check_passed: boolean | null
          completed_at: string | null
          detail: string | null
          expected_count: number | null
          failure_count: number | null
          failure_message: string | null
          manifest_sha256: string | null
          population: string | null
          private_source_commit: string | null
          started_at: string | null
          status: string | null
          validated_at: string | null
          validation_passed: boolean | null
        }
        Relationships: []
      }
      pmt_characters: {
        Row: {
          asset_count: number | null
          capture_id: string | null
          character_name: string | null
          character_source_id: number | null
          core_character_id: string | null
          explicit_property_names: string[] | null
          resolution_reason: string | null
          resolution_status: string | null
          resolved_at: string | null
          style_guide_names: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "pmt_character_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture_health"
            referencedColumns: ["capture_id"]
          },
          {
            foreignKeyName: "pmt_character_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_latest_capture"
            referencedColumns: ["capture_id"]
          },
        ]
      }
      pmt_latest_capture: {
        Row: {
          anomaly_count: number | null
          capture_id: string | null
          captured_by: string | null
          completed_at: string | null
          entitlement_scope: string | null
          library_name: string | null
          licensed_property_selection_count: number | null
          licensed_title_count: number | null
          manifest_sha256: string | null
          metadata_batch_count: number | null
          notes: string | null
          portal_global_asset_count: number | null
          private_source_commit: string | null
          property_result_row_count: number | null
          source_system: string | null
          source_url: string | null
          started_at: string | null
          unique_asset_count: number | null
        }
        Relationships: []
      }
      pmt_properties: {
        Row: {
          asset_count: number | null
          business_title_names: string[] | null
          capture_id: string | null
          character_count: number | null
          core_property_id: string | null
          franchise_link_is_a_direct_source_relationship: boolean | null
          franchise_names_cooccurrence_evidence_only: string[] | null
          is_licensed_selection: boolean | null
          property_name: string | null
          property_source_id: number | null
          resolution_reason: string | null
          resolution_status: string | null
          resolved_at: string | null
          style_guide_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pmt_property_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture_health"
            referencedColumns: ["capture_id"]
          },
          {
            foreignKeyName: "pmt_property_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_latest_capture"
            referencedColumns: ["capture_id"]
          },
        ]
      }
      pmt_property_franchise_evidence: {
        Row: {
          authority_warning: string | null
          capture_id: string | null
          evidence_asset_count: number | null
          evidence_kind: string | null
          franchise_name: string | null
          franchise_source_id: number | null
          is_direct_source_relationship: boolean | null
          property_name: string | null
          property_source_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pmt_property_franchise_evidence_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture_health"
            referencedColumns: ["capture_id"]
          },
          {
            foreignKeyName: "pmt_property_franchise_evidence_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_latest_capture"
            referencedColumns: ["capture_id"]
          },
        ]
      }
      pmt_style_guides: {
        Row: {
          asset_count: number | null
          capture_id: string | null
          captured_at: string | null
          character_count: number | null
          paramount_term: string | null
          property_names: string[] | null
          style_guide_name: string | null
          style_guide_source_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pmt_collection_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture_health"
            referencedColumns: ["capture_id"]
          },
          {
            foreignKeyName: "pmt_collection_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_latest_capture"
            referencedColumns: ["capture_id"]
          },
        ]
      }
      wb_property_character: {
        Row: {
          captured_at: string | null
          character_label: string | null
          character_source_id: string | null
          id_fallback: boolean | null
          property_label: string | null
          property_source_id: string | null
          source_url: string | null
        }
        Insert: {
          captured_at?: string | null
          character_label?: string | null
          character_source_id?: string | null
          id_fallback?: boolean | null
          property_label?: string | null
          property_source_id?: string | null
          source_url?: string | null
        }
        Update: {
          captured_at?: string | null
          character_label?: string | null
          character_source_id?: string | null
          id_fallback?: boolean | null
          property_label?: string | null
          property_source_id?: string | null
          source_url?: string | null
        }
        Relationships: []
      }
      wb_property_reconciliation: {
        Row: {
          captured_at: string | null
          core_licensor_code: string | null
          core_property_name: string | null
          property_id: string | null
          property_source_id: string | null
          resolution_reason: string | null
          resolution_status: string | null
          resolved_at: string | null
          resolved_by: string | null
          warner_character_count: number | null
          warner_property_label: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      clickup_task_sync_run_list: {
        Args: { p_limit?: number }
        Returns: Database["ingest"]["Tables"]["sync_run"]["Row"][]
        SetofOptions: {
          from: "*"
          to: "sync_run"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      coldlion_licensor_property_run_list: {
        Args: { p_limit?: number }
        Returns: Database["ingest"]["Tables"]["sync_run"]["Row"][]
        SetofOptions: {
          from: "*"
          to: "sync_run"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      coldlion_parallel_observation_list: {
        Args: { p_limit?: number }
        Returns: Database["plm"]["Tables"]["taxonomy_parallel_observation"]["Row"][]
        SetofOptions: {
          from: "*"
          to: "taxonomy_parallel_observation"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      coldlion_promotion_audit_list: {
        Args: { p_limit?: number }
        Returns: Database["plm"]["Tables"]["coldlion_promotion_audit"]["Row"][]
        SetofOptions: {
          from: "*"
          to: "coldlion_promotion_audit"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      coldlion_promotion_quarantine_list: {
        Args: { p_limit?: number }
        Returns: Database["plm"]["Tables"]["coldlion_promotion_quarantine"]["Row"][]
        SetofOptions: {
          from: "*"
          to: "coldlion_promotion_quarantine"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      crm_admin_user_list: { Args: never; Returns: Json }
      crm_customer_logo_url: {
        Args: { p_import_logo_url: string; p_metadata: Json }
        Returns: string
      }
      crm_customer_segment_counts: {
        Args: never
        Returns: {
          active: number
          all: number
          dismissed: number
          triage: number
        }[]
      }
      crm_customer_segment_list: {
        Args: { p_limit?: number; p_segment?: string }
        Returns: {
          account_owner_profile_id: string
          chain_type: string
          company_type: string
          customer_status: string
          display_name: string
          domain: string
          id: string
          is_potential: boolean
          logo_url: string
          name: string
          primary_salesperson_profile_id: string
          routing_aliases: string
          so_patterns: string
          status: string
          updated_at: string
        }[]
      }
      crm_email_routing_recent: {
        Args: { p_limit?: number }
        Returns: {
          body_preview: string
          company_id: string
          company_name: string
          department_id: string
          department_name: string
          detected_po_numbers: string
          detected_so_numbers: string
          id: string
          opportunity_id: string
          opportunity_name: string
          opportunity_stage: string
          received_at: string
          recipients: string
          routing_method: string
          routing_status: string
          sender: string
          subject: string
          updated_at: string
        }[]
      }
      crm_email_routing_segment_counts: {
        Args: never
        Returns: {
          all: number
          company: number
          department: number
          program: number
          triage: number
        }[]
      }
      crm_overview_counts: {
        Args: never
        Returns: {
          contacts: number
          customers: number
          meetings: number
          open_opportunities: number
          open_tasks: number
          pending_approvals: number
        }[]
      }
      crm_overview_email_counts: {
        Args: never
        Returns: {
          company_dept: number
          company_only: number
          needs_routing: number
          no_company: number
          other: number
          routed: number
          skipped: number
          total: number
          unrouted: number
        }[]
      }
      crm_overview_email_volume: {
        Args: { p_weeks?: number }
        Returns: {
          ingested: number
          routed: number
          week_start: string
        }[]
      }
      crm_overview_pending_approvals: {
        Args: { p_limit?: number }
        Returns: {
          id: string
          name: string
          opportunity_id: string
          opportunity_name: string
          property_name: string
          stage: string
        }[]
      }
      crm_overview_pipeline_stages: {
        Args: never
        Returns: {
          count: number
          stage: string
        }[]
      }
      crm_overview_recent_meetings: {
        Args: { p_limit?: number }
        Returns: {
          company_id: string
          company_name: string
          date: string
          id: string
          name: string
        }[]
      }
      crm_overview_recent_unrouted: {
        Args: { p_limit?: number }
        Returns: {
          id: string
          routing_status: string
          sender: string
          subject: string
        }[]
      }
      crm_set_customer_logo: {
        Args: { p_customer_id: string; p_logo_url?: string }
        Returns: Database["core"]["Tables"]["customer"]["Row"]
        SetofOptions: {
          from: "*"
          to: "customer"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
          p_display_name?: string
          p_name?: string
          p_routing_aliases?: string
          p_so_patterns?: string
        }
        Returns: Database["core"]["Tables"]["customer"]["Row"]
        SetofOptions: {
          from: "*"
          to: "customer"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      crm_update_contact: {
        Args: {
          p_clear_company?: boolean
          p_clear_contact_type?: boolean
          p_clear_crm_department?: boolean
          p_clear_scope?: boolean
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
      crm_update_customer: {
        Args: {
          p_chain_type?: string
          p_customer_id: string
          p_customer_status?: string
          p_domain?: string
          p_name?: string
          p_routing_aliases?: string
          p_so_patterns?: string
        }
        Returns: Database["core"]["Tables"]["customer"]["Row"]
        SetofOptions: {
          from: "*"
          to: "customer"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_user_profile: { Args: never; Returns: Json }
      db_data_admin_audit_list: {
        Args: {
          p_action?: string
          p_actor_profile_id?: string
          p_cursor?: string
          p_entity_id?: string
          p_entity_type?: string
          p_page_size?: number
          p_since?: string
          p_until?: string
        }
        Returns: Json
      }
      db_data_admin_channel_list: { Args: never; Returns: Json }
      db_data_admin_customer_detail: { Args: { p_id: string }; Returns: Json }
      db_data_admin_customer_list: {
        Args: {
          p_app?: string
          p_app_status?: string
          p_channel_id?: string
          p_cursor?: string
          p_include_inactive?: boolean
          p_page_size?: number
          p_search?: string
          p_sort?: string
          p_sort_dir?: string
          p_status?: string
        }
        Returns: Json
      }
      db_data_admin_grid_state_get: {
        Args: { p_entity_type: string; p_view_key: string }
        Returns: Json
      }
      db_data_admin_grid_state_upsert: {
        Args: {
          p_entity_type: string
          p_expected_version?: number
          p_state: Json
          p_view_key: string
        }
        Returns: Json
      }
      db_data_admin_licensor_property_list: {
        Args: {
          p_cursor?: string
          p_include_inactive?: boolean
          p_page_size?: number
          p_search?: string
        }
        Returns: Json
      }
      db_data_admin_licensor_property_tree: {
        Args: {
          p_cursor?: string
          p_include_inactive?: boolean
          p_page_size?: number
          p_search?: string
        }
        Returns: Json
      }
      db_data_admin_merge_customer: {
        Args: {
          p_loser_id: string
          p_operation_id: string
          p_preview_token: string
          p_reason: string
          p_resolutions?: Json
          p_survivor_id: string
        }
        Returns: Json
      }
      db_data_admin_merge_vendor: {
        Args: {
          p_loser_id: string
          p_operation_id: string
          p_preview_token: string
          p_reason: string
          p_resolutions?: Json
          p_survivor_id: string
        }
        Returns: Json
      }
      db_data_admin_preview_customer_merge: {
        Args: { p_loser_id: string; p_survivor_id: string }
        Returns: Json
      }
      db_data_admin_preview_vendor_merge: {
        Args: { p_loser_id: string; p_survivor_id: string }
        Returns: Json
      }
      db_data_admin_product_depth_list: {
        Args: {
          p_include_inactive?: boolean
          p_page_size?: number
          p_search?: string
        }
        Returns: Json
      }
      db_data_admin_set_product_depth_status: {
        Args: {
          p_depth_id: string
          p_expected_updated_at: string
          p_operation_id: string
          p_reason: string
          p_status: string
        }
        Returns: Json
      }
      db_data_admin_update_customer: {
        Args: {
          p_app?: string
          p_app_status?: string
          p_channel_ids?: string[]
          p_customer_id: string
          p_display_name?: string
          p_expected_updated_at: string
          p_operation_id: string
          p_reason: string
          p_status?: string
        }
        Returns: Json
      }
      db_data_admin_update_vendor: {
        Args: {
          p_app?: string
          p_app_status?: string
          p_display_name?: string
          p_expected_updated_at: string
          p_operation_id: string
          p_reason: string
          p_status?: string
          p_vendor_id: string
        }
        Returns: Json
      }
      db_data_admin_upsert_product_depth: {
        Args: {
          p_code: string
          p_depth_id?: string
          p_expected_updated_at?: string
          p_label: string
          p_operation_id: string
          p_reason: string
        }
        Returns: Json
      }
      db_data_admin_vendor_detail: { Args: { p_id: string }; Returns: Json }
      db_data_admin_vendor_list: {
        Args: {
          p_app?: string
          p_app_status?: string
          p_cursor?: string
          p_include_inactive?: boolean
          p_page_size?: number
          p_search?: string
          p_sort?: string
          p_sort_dir?: string
          p_status?: string
        }
        Returns: Json
      }
      pm_account_page: {
        Args: {
          p_after_id?: string
          p_after_name?: string
          p_business_unit: string
          p_limit?: number
          p_search?: string
        }
        Returns: {
          buyers: Json
          core_status: string
          id: string
          name: string
          order_count: number
          project_count: number
        }[]
      }
      pm_department_handoffs: {
        Args: { p_business_unit: string; p_limit?: number; p_since?: string }
        Returns: {
          changed_at: string
          from_stage_id: string
          from_stage_name: string
          id: string
          product_id: string
          product_name: string
          to_stage_id: string
          to_stage_name: string
        }[]
      }
      pm_department_report: { Args: { p_business_unit: string }; Returns: Json }
      pm_design_collection_page: {
        Args: {
          p_after_id?: string
          p_after_updated_at?: string
          p_business_unit: string
          p_limit?: number
          p_search?: string
        }
        Returns: {
          company_id: string
          id: string
          metadata: Json
          name: string
          project_count: number
          season: string
          status: string
          updated_at: string
        }[]
      }
      pm_design_page: {
        Args: {
          p_after_id?: string
          p_after_updated_at?: string
          p_business_unit: string
          p_limit?: number
          p_search?: string
        }
        Returns: {
          id: string
          metadata: Json
          nas_path: string
          product_count: number
          status: string
          thumbnail_url: string
          title: string
          updated_at: string
        }[]
      }
      pm_my_reminder_page: {
        Args: { p_business_unit: string; p_limit?: number }
        Returns: {
          body: string
          created_at: string
          id: string
          payload: Json
          profile_id: string
          read_at: string
          target_id: string
          target_table: string
          title: string
        }[]
      }
      pm_my_revision_page: {
        Args: { p_business_unit: string; p_limit?: number }
        Returns: {
          body: string
          id: string
          metadata: Json
          product_id: string
          requested_at: string
          requested_by_profile_id: string
          resolved_at: string
          status: string
          submission_id: string
        }[]
      }
      pm_my_work_page: {
        Args: {
          p_after_id?: string
          p_after_updated_at?: string
          p_business_unit: string
          p_limit?: number
          p_role_id?: string
        }
        Returns: {
          buyer_contact_id: string
          company_id: string
          cover_url: string
          design_id: string
          factory_id: string
          id: string
          licensor_id: string
          lifecycle_status: string
          metadata: Json
          name: string
          product_type_id: string
          project_id: string
          property_id: string
          stage: string
          status: string
          updated_at: string
        }[]
      }
      pm_notes_page: {
        Args: {
          p_before_created_at?: string
          p_before_id?: string
          p_before_kind?: string
          p_business_unit: string
          p_limit?: number
          p_search?: string
          p_since?: string
        }
        Returns: {
          author: string
          body: string
          created_at: string
          id: string
          kind: string
          target: string
        }[]
      }
      pm_order_page: {
        Args: {
          p_after_id?: string
          p_after_updated_at?: string
          p_business_unit: string
          p_limit?: number
          p_search?: string
        }
        Returns: {
          company_id: string
          id: string
          metadata: Json
          notes: string
          order_date: string
          order_number: string
          product_id: string
          status: string
          updated_at: string
        }[]
      }
      pm_patch_product_metadata: {
        Args: {
          p_expected_updated_at?: string
          p_patch: Json
          p_product_id: string
        }
        Returns: {
          id: string
          metadata: Json
          updated_at: string
        }[]
      }
      pm_people_workload_page: {
        Args: {
          p_after_id?: string
          p_after_name?: string
          p_business_unit: string
          p_limit?: number
          p_search?: string
        }
        Returns: {
          assignments: number
          avatar_url: string
          display_name: string
          email: string
          id: string
          reminders: number
          revisions: number
          status: string
        }[]
      }
      pm_pipeline_count: {
        Args: {
          p_business_unit: string
          p_licensor_ids?: string[]
          p_lifecycle_states?: string[]
          p_list_names?: string[]
          p_search?: string
        }
        Returns: number
      }
      pm_pipeline_list_facets: {
        Args: { p_business_unit: string }
        Returns: {
          folder_name: string
          list_name: string
          product_count: number
        }[]
      }
      pm_pipeline_page: {
        Args: {
          p_after_id?: string
          p_after_updated_at?: string
          p_business_unit: string
          p_licensor_ids?: string[]
          p_lifecycle_states?: string[]
          p_limit?: number
          p_list_names?: string[]
          p_search?: string
        }
        Returns: {
          blocker_reason: string
          brand_assurance_number: string
          business_unit: string
          buyer_contact_id: string
          buyer_name: string
          clickup_folder_name: string
          clickup_list_name: string
          clickup_orderindex: string
          clickup_parent_id: string
          clickup_status: string
          clickup_status_color: string
          clickup_status_order: number
          clickup_status_type: string
          clickup_task_id: string
          clickup_time_estimate_ms: number
          closure_reason: string
          code: string
          company_id: string
          company_name: string
          cover_url: string
          created_at: string
          description: string
          factory_id: string
          factory_name: string
          id: string
          licensor_id: string
          licensor_name: string
          lifecycle_status: string
          name: string
          next_action: string
          next_owner_name: string
          next_owner_role_name: string
          on_shelf_date: string
          pi_status: string
          plm_item_id: string
          plm_item_number: string
          pps_requested_date: string
          product_type_id: string
          product_type_name: string
          project_id: string
          project_title: string
          property_id: string
          property_name: string
          risk_level: string
          stage: string
          status: string
          updated_at: string
          waiting_on: string
        }[]
      }
      pm_project_page: {
        Args: {
          p_after_id?: string
          p_after_updated_at?: string
          p_business_unit: string
          p_limit?: number
          p_search?: string
        }
        Returns: {
          brief: string
          business_unit: string
          collection_name: string
          company_id: string
          company_name: string
          contact_id: string
          contact_name: string
          design_collection_id: string
          id: string
          on_shelf_date: string
          pps_requested_date: string
          product_count: number
          restrictions: string
          status: string
          title: string
          updated_at: string
        }[]
      }
      pm_schedule_page: {
        Args: {
          p_after_date?: string
          p_after_id?: string
          p_business_unit: string
          p_end: string
          p_limit?: number
          p_search?: string
          p_start: string
        }
        Returns: {
          context: string
          event_date: string
          id: string
          kind: string
          status: string
          title: string
        }[]
      }
      pm_set_product_stage: {
        Args: { p_product_id: string; p_target_stage_id: string }
        Returns: {
          id: string
          lifecycle_status: string
          name: string
          stage: string
          updated_at: string
        }[]
      }
      pm_upsert_view_pref: {
        Args: { p_patch: Json; p_scope: string }
        Returns: {
          config: Json
          id: string
          profile_id: string
          scope: string
          updated_at: string
        }[]
      }
      product_depth_list: {
        Args: { p_limit?: number; p_search?: string; p_selected_ids?: string[] }
        Returns: {
          code: string
          currently_selected: boolean
          id: string
          label: string
          legacy_id: number
          selectable: boolean
          status: string
        }[]
      }
      product_size_list: {
        Args: {
          p_division_code?: string
          p_limit?: number
          p_search?: string
          p_selected_ids?: string[]
        }
        Returns: {
          code: string
          company_code: string
          currently_selected: boolean
          division_code: string
          id: string
          label: string
          mg_type_code: string
          selectable: boolean
          status: string
        }[]
      }
      taxonomy_baseline_pin_list: {
        Args: { p_baseline_key?: string; p_include_superseded?: boolean }
        Returns: Database["plm"]["Tables"]["taxonomy_baseline_pin"]["Row"][]
        SetofOptions: {
          from: "*"
          to: "taxonomy_baseline_pin"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      taxonomy_sync_alert_list: {
        Args: { p_limit?: number }
        Returns: Database["plm"]["Tables"]["taxonomy_sync_alert"]["Row"][]
        SetofOptions: {
          from: "*"
          to: "taxonomy_sync_alert"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      vendor_exclusion_list: {
        Args: never
        Returns: Database["plm"]["Tables"]["vendor_exclusion"]["Row"][]
        SetofOptions: {
          from: "*"
          to: "vendor_exclusion"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      vendor_quarantine_list: {
        Args: never
        Returns: Database["plm"]["Tables"]["vendor_quarantine"]["Row"][]
        SetofOptions: {
          from: "*"
          to: "vendor_quarantine"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      vendor_sync_run_list: {
        Args: { p_limit?: number }
        Returns: Database["ingest"]["Tables"]["sync_run"]["Row"][]
        SetofOptions: {
          from: "*"
          to: "sync_run"
          isOneToOne: false
          isSetofReturn: true
        }
      }
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
      AdditionalUserEmail: {
        Row: {
          email: string | null
          id: number
          user_id_fk: number | null
          userType: string | null
        }
        Insert: {
          email?: string | null
          id?: never
          user_id_fk?: number | null
          userType?: string | null
        }
        Update: {
          email?: string | null
          id?: never
          user_id_fk?: number | null
          userType?: string | null
        }
        Relationships: []
      }
      ai_cache_events: {
        Row: {
          api_backend: string
          cache_creation_tokens: number
          cache_hit_rate_pct: number
          cache_hit_tokens: number
          cache_miss_tokens: number
          cache_strategy: string
          completion_tokens: number
          created_at: string
          feature: string
          id: string
          model: string
          prompt_tokens: number
          provider: string
          reasoning_tokens: number
          session_id: string | null
          telemetry_available: boolean
          total_tokens: number
        }
        Insert: {
          api_backend: string
          cache_creation_tokens?: number
          cache_hit_rate_pct?: number
          cache_hit_tokens?: number
          cache_miss_tokens?: number
          cache_strategy: string
          completion_tokens?: number
          created_at?: string
          feature?: string
          id: string
          model: string
          prompt_tokens?: number
          provider: string
          reasoning_tokens?: number
          session_id?: string | null
          telemetry_available?: boolean
          total_tokens?: number
        }
        Update: {
          api_backend?: string
          cache_creation_tokens?: number
          cache_hit_rate_pct?: number
          cache_hit_tokens?: number
          cache_miss_tokens?: number
          cache_strategy?: string
          completion_tokens?: number
          created_at?: string
          feature?: string
          id?: string
          model?: string
          prompt_tokens?: number
          provider?: string
          reasoning_tokens?: number
          session_id?: string | null
          telemetry_available?: boolean
          total_tokens?: number
        }
        Relationships: []
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
      app_settings: {
        Row: {
          created_at: string | null
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      AuditLog: {
        Row: {
          actionDate: string | null
          actionType: string | null
          element_id: string | null
          id: number
          moduleName: string | null
          newValue: string | null
          oldValue: string | null
          ref_id_fk: number | null
          user_id_fk: number | null
          username: string | null
        }
        Insert: {
          actionDate?: string | null
          actionType?: string | null
          element_id?: string | null
          id?: number
          moduleName?: string | null
          newValue?: string | null
          oldValue?: string | null
          ref_id_fk?: number | null
          user_id_fk?: number | null
          username?: string | null
        }
        Update: {
          actionDate?: string | null
          actionType?: string | null
          element_id?: string | null
          id?: number
          moduleName?: string | null
          newValue?: string | null
          oldValue?: string | null
          ref_id_fk?: number | null
          user_id_fk?: number | null
          username?: string | null
        }
        Relationships: []
      }
      auth_token: {
        Row: {
          email: string | null
          id: number
          status: boolean | null
          token: string | null
        }
        Insert: {
          email?: string | null
          id?: never
          status?: boolean | null
          token?: string | null
        }
        Update: {
          email?: string | null
          id?: never
          status?: boolean | null
          token?: string | null
        }
        Relationships: []
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
      db_data_admin_audit_event: {
        Row: {
          action: string
          actor_profile_id: string | null
          actor_user_id: string | null
          entity_id: string
          entity_type: string
          error_code: string | null
          error_detail: Json | null
          id: string
          merge_loser_id: string | null
          merge_survivor_id: string | null
          new_snapshot: Json | null
          occurred_at: string
          old_snapshot: Json | null
          operation_id: string
          operation_item_key: string
          reason: string
          succeeded: boolean
        }
        Insert: {
          action: string
          actor_profile_id?: string | null
          actor_user_id?: string | null
          entity_id: string
          entity_type: string
          error_code?: string | null
          error_detail?: Json | null
          id?: string
          merge_loser_id?: string | null
          merge_survivor_id?: string | null
          new_snapshot?: Json | null
          occurred_at?: string
          old_snapshot?: Json | null
          operation_id: string
          operation_item_key?: string
          reason: string
          succeeded: boolean
        }
        Update: {
          action?: string
          actor_profile_id?: string | null
          actor_user_id?: string | null
          entity_id?: string
          entity_type?: string
          error_code?: string | null
          error_detail?: Json | null
          id?: string
          merge_loser_id?: string | null
          merge_survivor_id?: string | null
          new_snapshot?: Json | null
          occurred_at?: string
          old_snapshot?: Json | null
          operation_id?: string
          operation_item_key?: string
          reason?: string
          succeeded?: boolean
        }
        Relationships: []
      }
      db_data_admin_feature_gate: {
        Row: {
          enabled: boolean
          feature: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          enabled: boolean
          feature: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          feature?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      db_data_admin_grid_state: {
        Row: {
          created_at: string
          entity_type: string
          profile_id: string
          state: Json
          updated_at: string
          version: number
          view_key: string
        }
        Insert: {
          created_at?: string
          entity_type: string
          profile_id: string
          state?: Json
          updated_at?: string
          version?: number
          view_key: string
        }
        Update: {
          created_at?: string
          entity_type?: string
          profile_id?: string
          state?: Json
          updated_at?: string
          version?: number
          view_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "db_data_admin_grid_state_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          emails: string
          id: number
          message_id: string
          sent_at: string
          subject: string
          template: string
        }
        Insert: {
          emails: string
          id?: number
          message_id: string
          sent_at?: string
          subject: string
          template: string
        }
        Update: {
          emails?: string
          id?: number
          message_id?: string
          sent_at?: string
          subject?: string
          template?: string
        }
        Relationships: []
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
      quote_auth_token: {
        Row: {
          expired_date: string | null
          id: number
          initiated_token: string | null
          replaced_token: string | null
          start_date: string | null
          user_email: string | null
        }
        Insert: {
          expired_date?: string | null
          id?: never
          initiated_token?: string | null
          replaced_token?: string | null
          start_date?: string | null
          user_email?: string | null
        }
        Update: {
          expired_date?: string | null
          id?: never
          initiated_token?: string | null
          replaced_token?: string | null
          start_date?: string | null
          user_email?: string | null
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
      RolePermissions: {
        Row: {
          Access: boolean
          ElementId: number
          Id: number
          RoleId: number
          UserId: number | null
        }
        Insert: {
          Access: boolean
          ElementId: number
          Id?: never
          RoleId: number
          UserId?: number | null
        }
        Update: {
          Access?: boolean
          ElementId?: number
          Id?: never
          RoleId?: number
          UserId?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "RolePermissions_ElementId_fkey"
            columns: ["ElementId"]
            isOneToOne: false
            referencedRelation: "UIElements"
            referencedColumns: ["Id"]
          },
          {
            foreignKeyName: "RolePermissions_UserId_fkey"
            columns: ["UserId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      UIElements: {
        Row: {
          Id: number
          Name: string
          ParentId: number | null
          Type: string
        }
        Insert: {
          Id?: never
          Name: string
          ParentId?: number | null
          Type: string
        }
        Update: {
          Id?: never
          Name?: string
          ParentId?: number | null
          Type?: string
        }
        Relationships: [
          {
            foreignKeyName: "UIElements_ParentId_fkey"
            columns: ["ParentId"]
            isOneToOne: false
            referencedRelation: "UIElements"
            referencedColumns: ["Id"]
          },
        ]
      }
      user_notification: {
        Row: {
          created_date: string | null
          event: string | null
          id: number
          message: string | null
          title: string | null
          type: string | null
          unread: boolean | null
          user_id_fk: number | null
        }
        Insert: {
          created_date?: string | null
          event?: string | null
          id?: never
          message?: string | null
          title?: string | null
          type?: string | null
          unread?: boolean | null
          user_id_fk?: number | null
        }
        Update: {
          created_date?: string | null
          event?: string | null
          id?: never
          message?: string | null
          title?: string | null
          type?: string | null
          unread?: boolean | null
          user_id_fk?: number | null
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
      users: {
        Row: {
          _airbyte_emitted_at: string | null
          _airbyte_users_hashid: string | null
          adddate: string | null
          auditlog: string | null
          email: string | null
          expire: string | null
          graph_photo: string | null
          graph_photo_synced_at: string | null
          id: number
          lastname: string | null
          level: string | null
          name: string | null
          notes: string | null
          notificationemail: string | null
          notificationsms: string | null
          passw: string | null
          phonenum: string | null
          profile_photo: string | null
          status: string | null
          subleveladmin: string | null
          subscription: string | null
        }
        Insert: {
          _airbyte_emitted_at?: string | null
          _airbyte_users_hashid?: string | null
          adddate?: string | null
          auditlog?: string | null
          email?: string | null
          expire?: string | null
          graph_photo?: string | null
          graph_photo_synced_at?: string | null
          id?: never
          lastname?: string | null
          level?: string | null
          name?: string | null
          notes?: string | null
          notificationemail?: string | null
          notificationsms?: string | null
          passw?: string | null
          phonenum?: string | null
          profile_photo?: string | null
          status?: string | null
          subleveladmin?: string | null
          subscription?: string | null
        }
        Update: {
          _airbyte_emitted_at?: string | null
          _airbyte_users_hashid?: string | null
          adddate?: string | null
          auditlog?: string | null
          email?: string | null
          expire?: string | null
          graph_photo?: string | null
          graph_photo_synced_at?: string | null
          id?: never
          lastname?: string | null
          level?: string | null
          name?: string | null
          notes?: string | null
          notificationemail?: string | null
          notificationsms?: string | null
          passw?: string | null
          phonenum?: string | null
          profile_photo?: string | null
          status?: string | null
          subleveladmin?: string | null
          subscription?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_profile_id: { Args: never; Returns: string }
      db_data_admin_customer_row: { Args: { p_id: string }; Returns: Json }
      db_data_admin_extension_conflicts: {
        Args: {
          p_key: string
          p_loser: string
          p_prefix: string
          p_survivor: string
          p_table: unknown
        }
        Returns: Json
      }
      db_data_admin_latest_plm_customer_status: {
        Args: { p_company_id: string }
        Returns: string
      }
      db_data_admin_merge_execute: {
        Args: {
          p_kind: string
          p_loser: string
          p_operation_id: string
          p_preview_token: string
          p_reason: string
          p_resolutions: Json
          p_survivor: string
        }
        Returns: Json
      }
      db_data_admin_merge_fk_counts: {
        Args: { p_loser: string; p_target: unknown }
        Returns: Json
      }
      db_data_admin_merge_preview: {
        Args: { p_kind: string; p_loser: string; p_survivor: string }
        Returns: Json
      }
      db_data_admin_product_depth_row: { Args: { p_id: string }; Returns: Json }
      db_data_admin_reconcile_extension: {
        Args: {
          p_key: string
          p_loser: string
          p_prefix: string
          p_resolutions: Json
          p_survivor: string
          p_table: unknown
        }
        Returns: undefined
      }
      db_data_admin_single_record_writes_enabled: {
        Args: never
        Returns: boolean
      }
      db_data_admin_vendor_row: { Args: { p_id: string }; Returns: Json }
      has_any_role: {
        Args: { required_roles: Database["app"]["Enums"]["app_role"][] }
        Returns: boolean
      }
      has_app_access: {
        Args: { required_app: Database["app"]["Enums"]["app_name"] }
        Returns: boolean
      }
      has_explicit_app_access: {
        Args: { required_app: Database["app"]["Enums"]["app_name"] }
        Returns: boolean
      }
      has_role: {
        Args: { required_role: Database["app"]["Enums"]["app_role"] }
        Returns: boolean
      }
      jwt_role_names: { Args: never; Returns: string[] }
      require_db_data_admin_access: { Args: never; Returns: undefined }
      require_db_data_admin_product_depth_access: {
        Args: never
        Returns: undefined
      }
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
      entity_status:
        | "active"
        | "inactive"
        | "archived"
        | "deleted"
        | "potential"
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
      age_group: {
        Row: {
          created_at: string
          created_by: number
          id: number
          is_active: boolean
          name: string
          updated_at: string | null
          updated_by: number | null
        }
        Insert: {
          created_at?: string
          created_by: number
          id?: number
          is_active?: boolean
          name: string
          updated_at?: string | null
          updated_by?: number | null
        }
        Update: {
          created_at?: string
          created_by?: number
          id?: number
          is_active?: boolean
          name?: string
          updated_at?: string | null
          updated_by?: number | null
        }
        Relationships: []
      }
      art_types: {
        Row: {
          code: string
          created_at: string
          created_by: number
          divisioncode_id: number
          id: number
          is_active: boolean
          name: string
          updated_at: string | null
          updated_by: number | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: number
          divisioncode_id: number
          id?: number
          is_active?: boolean
          name: string
          updated_at?: string | null
          updated_by?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: number
          divisioncode_id?: number
          id?: number
          is_active?: boolean
          name?: string
          updated_at?: string | null
          updated_by?: number | null
        }
        Relationships: []
      }
      artist: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          name: string
          normalized_name: string | null
          status: Database["app"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          normalized_name?: string | null
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          normalized_name?: string | null
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: []
      }
      artist_types: {
        Row: {
          code: string
          created_at: string
          created_by: number
          id: number
          is_active: boolean
          name: string
          updated_at: string | null
          updated_by: number | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: number
          id?: number
          is_active?: boolean
          name: string
          updated_at?: string | null
          updated_by?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: number
          id?: number
          is_active?: boolean
          name?: string
          updated_at?: string | null
          updated_by?: number | null
        }
        Relationships: []
      }
      channel: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number
          status: Database["app"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: []
      }
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
            referencedRelation: "customer"
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
            referencedRelation: "customer"
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
      creative_designer: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          name: string
          normalized_name: string | null
          status: Database["app"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          normalized_name?: string | null
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          normalized_name?: string | null
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: []
      }
      customer: {
        Row: {
          account_owner_profile_id: string | null
          address: Json
          chain_type: string | null
          company_type: string
          created_at: string
          customer_status: string | null
          display_name: string | null
          domain: string | null
          id: string
          is_potential: boolean
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
          display_name?: string | null
          domain?: string | null
          id?: string
          is_potential?: boolean
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
          display_name?: string | null
          domain?: string | null
          id?: string
          is_potential?: boolean
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
      customer_alias: {
        Row: {
          alias: string
          alias_type: string
          created_at: string
          customer_id: string
          id: string
          normalized_alias: string | null
          notes: string | null
          source_system: string | null
          updated_at: string
        }
        Insert: {
          alias: string
          alias_type?: string
          created_at?: string
          customer_id: string
          id?: string
          normalized_alias?: string | null
          notes?: string | null
          source_system?: string | null
          updated_at?: string
        }
        Update: {
          alias?: string
          alias_type?: string
          created_at?: string
          customer_id?: string
          id?: string
          normalized_alias?: string | null
          notes?: string | null
          source_system?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_alias_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_channel: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          channel_id: string
          customer_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          channel_id: string
          customer_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          channel_id?: string
          customer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_channel_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_channel_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer"
            referencedColumns: ["id"]
          },
        ]
      }
      externalCustomer: {
        Row: {
          active: string | null
          address1: string | null
          address2: string | null
          address3: string | null
          aRCustomerCode: string | null
          city: string | null
          commissionPerc1: string | null
          commissionPerc2: string | null
          companyCode: string | null
          countryCode: string | null
          createdTime: string | null
          createdUser: string | null
          currencyCode: string | null
          customerCode: string
          customerDBA: string | null
          customerDesc: string | null
          customerTypeCode: string | null
          dsCat: string | null
          factorCode: string | null
          faxNo: string | null
          glCode: string | null
          id: number
          modTime: string | null
          modUser: string | null
          oldCustomerCode: string | null
          parentCustomerCode: string | null
          phoneNo: string | null
          regionCode: string | null
          salesPersonCode1: string | null
          salesPersonCode2: string | null
          state: string | null
          udf01: string | null
          udf02: string | null
          udf03: string | null
          udf04: string | null
          udfDate01: string | null
          udfDate02: string | null
          useConsolidatedInvoice: string | null
          vendorNumber: string | null
          zipCode: string | null
        }
        Insert: {
          active?: string | null
          address1?: string | null
          address2?: string | null
          address3?: string | null
          aRCustomerCode?: string | null
          city?: string | null
          commissionPerc1?: string | null
          commissionPerc2?: string | null
          companyCode?: string | null
          countryCode?: string | null
          createdTime?: string | null
          createdUser?: string | null
          currencyCode?: string | null
          customerCode: string
          customerDBA?: string | null
          customerDesc?: string | null
          customerTypeCode?: string | null
          dsCat?: string | null
          factorCode?: string | null
          faxNo?: string | null
          glCode?: string | null
          id?: never
          modTime?: string | null
          modUser?: string | null
          oldCustomerCode?: string | null
          parentCustomerCode?: string | null
          phoneNo?: string | null
          regionCode?: string | null
          salesPersonCode1?: string | null
          salesPersonCode2?: string | null
          state?: string | null
          udf01?: string | null
          udf02?: string | null
          udf03?: string | null
          udf04?: string | null
          udfDate01?: string | null
          udfDate02?: string | null
          useConsolidatedInvoice?: string | null
          vendorNumber?: string | null
          zipCode?: string | null
        }
        Update: {
          active?: string | null
          address1?: string | null
          address2?: string | null
          address3?: string | null
          aRCustomerCode?: string | null
          city?: string | null
          commissionPerc1?: string | null
          commissionPerc2?: string | null
          companyCode?: string | null
          countryCode?: string | null
          createdTime?: string | null
          createdUser?: string | null
          currencyCode?: string | null
          customerCode?: string
          customerDBA?: string | null
          customerDesc?: string | null
          customerTypeCode?: string | null
          dsCat?: string | null
          factorCode?: string | null
          faxNo?: string | null
          glCode?: string | null
          id?: never
          modTime?: string | null
          modUser?: string | null
          oldCustomerCode?: string | null
          parentCustomerCode?: string | null
          phoneNo?: string | null
          regionCode?: string | null
          salesPersonCode1?: string | null
          salesPersonCode2?: string | null
          state?: string | null
          udf01?: string | null
          udf02?: string | null
          udf03?: string | null
          udf04?: string | null
          udfDate01?: string | null
          udfDate02?: string | null
          useConsolidatedInvoice?: string | null
          vendorNumber?: string | null
          zipCode?: string | null
        }
        Relationships: []
      }
      externalVendor: {
        Row: {
          active: string | null
          address1: string | null
          address2: string | null
          address3: string | null
          city: string | null
          companyCode: string | null
          countryCode: string | null
          createdTime: string | null
          createdUser: string | null
          email: string | null
          faxNo: string | null
          femaExpDate: string | null
          glCode: string | null
          id: number
          modTime: string | null
          modUser: string | null
          nbcExpDate: string | null
          payTermCode: string | null
          phoneNo: string | null
          separateCheck: string | null
          state: string | null
          udf01: string | null
          udf02: string | null
          udf03: string | null
          udf04: string | null
          udfDate01: string | null
          udfDate02: string | null
          vendorCode: string
          vendorDesc: string | null
          zipCode: string | null
        }
        Insert: {
          active?: string | null
          address1?: string | null
          address2?: string | null
          address3?: string | null
          city?: string | null
          companyCode?: string | null
          countryCode?: string | null
          createdTime?: string | null
          createdUser?: string | null
          email?: string | null
          faxNo?: string | null
          femaExpDate?: string | null
          glCode?: string | null
          id?: never
          modTime?: string | null
          modUser?: string | null
          nbcExpDate?: string | null
          payTermCode?: string | null
          phoneNo?: string | null
          separateCheck?: string | null
          state?: string | null
          udf01?: string | null
          udf02?: string | null
          udf03?: string | null
          udf04?: string | null
          udfDate01?: string | null
          udfDate02?: string | null
          vendorCode: string
          vendorDesc?: string | null
          zipCode?: string | null
        }
        Update: {
          active?: string | null
          address1?: string | null
          address2?: string | null
          address3?: string | null
          city?: string | null
          companyCode?: string | null
          countryCode?: string | null
          createdTime?: string | null
          createdUser?: string | null
          email?: string | null
          faxNo?: string | null
          femaExpDate?: string | null
          glCode?: string | null
          id?: never
          modTime?: string | null
          modUser?: string | null
          nbcExpDate?: string | null
          payTermCode?: string | null
          phoneNo?: string | null
          separateCheck?: string | null
          state?: string | null
          udf01?: string | null
          udf02?: string | null
          udf03?: string | null
          udf04?: string | null
          udfDate01?: string | null
          udfDate02?: string | null
          vendorCode?: string
          vendorDesc?: string | null
          zipCode?: string | null
        }
        Relationships: []
      }
      factory: {
        Row: {
          code: string | null
          company_id: string | null
          country: string | null
          created_at: string
          display_name: string | null
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
          display_name?: string | null
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
          display_name?: string | null
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
            referencedRelation: "customer"
            referencedColumns: ["id"]
          },
        ]
      }
      factory_alias: {
        Row: {
          alias: string
          alias_type: string
          created_at: string
          factory_id: string
          id: string
          normalized_alias: string | null
          notes: string | null
          source_system: string | null
          updated_at: string
        }
        Insert: {
          alias: string
          alias_type?: string
          created_at?: string
          factory_id: string
          id?: string
          normalized_alias?: string | null
          notes?: string | null
          source_system?: string | null
          updated_at?: string
        }
        Update: {
          alias?: string
          alias_type?: string
          created_at?: string
          factory_id?: string
          id?: string
          normalized_alias?: string | null
          notes?: string | null
          source_system?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "factory_alias_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factory"
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
      freelance_designer: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          name: string
          normalized_name: string | null
          status: Database["app"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          normalized_name?: string | null
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          normalized_name?: string | null
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: []
      }
      licenseList: {
        Row: {
          licenseList_airbyte_emitted_at: string | null
          licenseList_airbyte_licenses_hashid: string | null
          licenseList_auditlog: string | null
          licenseList_code: string | null
          licenseList_fob_royalty_rate: number | null
          licenseList_id: number
          licenseList_royalty_rate: number | null
          licenseList_status: string | null
          licenseList_title: string | null
        }
        Insert: {
          licenseList_airbyte_emitted_at?: string | null
          licenseList_airbyte_licenses_hashid?: string | null
          licenseList_auditlog?: string | null
          licenseList_code?: string | null
          licenseList_fob_royalty_rate?: number | null
          licenseList_id?: number
          licenseList_royalty_rate?: number | null
          licenseList_status?: string | null
          licenseList_title?: string | null
        }
        Update: {
          licenseList_airbyte_emitted_at?: string | null
          licenseList_airbyte_licenses_hashid?: string | null
          licenseList_auditlog?: string | null
          licenseList_code?: string | null
          licenseList_fob_royalty_rate?: number | null
          licenseList_id?: number
          licenseList_royalty_rate?: number | null
          licenseList_status?: string | null
          licenseList_title?: string | null
        }
        Relationships: []
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
      licensor_alias: {
        Row: {
          alias: string
          approval_evidence: string | null
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          dormancy_evidence: string | null
          evidence_notes: string | null
          id: string
          is_dormant: boolean
          licensor_id: string
          normalized_alias: string | null
          source_system: string | null
          updated_at: string
        }
        Insert: {
          alias: string
          approval_evidence?: string | null
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          dormancy_evidence?: string | null
          evidence_notes?: string | null
          id?: string
          is_dormant?: boolean
          licensor_id: string
          normalized_alias?: string | null
          source_system?: string | null
          updated_at?: string
        }
        Update: {
          alias?: string
          approval_evidence?: string | null
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          dormancy_evidence?: string | null
          evidence_notes?: string | null
          id?: string
          is_dormant?: boolean
          licensor_id?: string
          normalized_alias?: string | null
          source_system?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "licensor_alias_licensor_id_fkey"
            columns: ["licensor_id"]
            isOneToOne: false
            referencedRelation: "licensor"
            referencedColumns: ["id"]
          },
        ]
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
      merchGroup: {
        Row: {
          companyCode_fk: string | null
          companyCode_id_fk: number | null
          createdTime: string | null
          createdUser: string | null
          divisionCode_fk: string | null
          divisionCode_id_fk: number | null
          is_active: boolean | null
          ItemNoCode: string | null
          mg_code: string | null
          mg_desc: string | null
          mg_id: number
          mgCategory: string | null
          mgCode2: string | null
          mgTypeCode: string | null
          modTime: string | null
          modUser: string | null
          parent_id: number | null
        }
        Insert: {
          companyCode_fk?: string | null
          companyCode_id_fk?: number | null
          createdTime?: string | null
          createdUser?: string | null
          divisionCode_fk?: string | null
          divisionCode_id_fk?: number | null
          is_active?: boolean | null
          ItemNoCode?: string | null
          mg_code?: string | null
          mg_desc?: string | null
          mg_id?: never
          mgCategory?: string | null
          mgCode2?: string | null
          mgTypeCode?: string | null
          modTime?: string | null
          modUser?: string | null
          parent_id?: number | null
        }
        Update: {
          companyCode_fk?: string | null
          companyCode_id_fk?: number | null
          createdTime?: string | null
          createdUser?: string | null
          divisionCode_fk?: string | null
          divisionCode_id_fk?: number | null
          is_active?: boolean | null
          ItemNoCode?: string | null
          mg_code?: string | null
          mg_desc?: string | null
          mg_id?: never
          mgCategory?: string | null
          mgCode2?: string | null
          mgTypeCode?: string | null
          modTime?: string | null
          modUser?: string | null
          parent_id?: number | null
        }
        Relationships: []
      }
      merchGroupHeaders: {
        Row: {
          companyCode: string | null
          companyCode_id_fk: number | null
          createdTime: string | null
          createdUser: string | null
          divisionCode: string | null
          divisionCode_id_fk: number | null
          id: number
          mgTypeCode: string | null
          mgTypeDesc: string | null
          modTime: string | null
          modUser: string | null
        }
        Insert: {
          companyCode?: string | null
          companyCode_id_fk?: number | null
          createdTime?: string | null
          createdUser?: string | null
          divisionCode?: string | null
          divisionCode_id_fk?: number | null
          id?: never
          mgTypeCode?: string | null
          mgTypeDesc?: string | null
          modTime?: string | null
          modUser?: string | null
        }
        Update: {
          companyCode?: string | null
          companyCode_id_fk?: number | null
          createdTime?: string | null
          createdUser?: string | null
          divisionCode?: string | null
          divisionCode_id_fk?: number | null
          id?: never
          mgTypeCode?: string | null
          mgTypeDesc?: string | null
          modTime?: string | null
          modUser?: string | null
        }
        Relationships: []
      }
      merchGroupMaster: {
        Row: {
          companyCode_fk: string | null
          companyCode_id_fk: number | null
          createdTime: string | null
          createdUser: string | null
          divisionCode_fk: string | null
          divisionCode_id_fk: number | null
          is_active: boolean | null
          ItemNoCode: string | null
          mg_code: string | null
          mg_desc: string | null
          mg_id: number
          mgCategory: string | null
          mgCode2: string | null
          mgTypeCode: string | null
          modTime: string | null
          modUser: string | null
        }
        Insert: {
          companyCode_fk?: string | null
          companyCode_id_fk?: number | null
          createdTime?: string | null
          createdUser?: string | null
          divisionCode_fk?: string | null
          divisionCode_id_fk?: number | null
          is_active?: boolean | null
          ItemNoCode?: string | null
          mg_code?: string | null
          mg_desc?: string | null
          mg_id?: never
          mgCategory?: string | null
          mgCode2?: string | null
          mgTypeCode?: string | null
          modTime?: string | null
          modUser?: string | null
        }
        Update: {
          companyCode_fk?: string | null
          companyCode_id_fk?: number | null
          createdTime?: string | null
          createdUser?: string | null
          divisionCode_fk?: string | null
          divisionCode_id_fk?: number | null
          is_active?: boolean | null
          ItemNoCode?: string | null
          mg_code?: string | null
          mg_desc?: string | null
          mg_id?: never
          mgCategory?: string | null
          mgCode2?: string | null
          mgTypeCode?: string | null
          modTime?: string | null
          modUser?: string | null
        }
        Relationships: []
      }
      merchGroupRelations: {
        Row: {
          child_mg_id: number
          createdTime: string | null
          createdUser: number
          divisionCode_id_fk: number
          grand_parent_mg_id: number | null
          id: number
          is_active: boolean | null
          modTime: string | null
          modUser: number | null
          parent_mg_id: number
        }
        Insert: {
          child_mg_id: number
          createdTime?: string | null
          createdUser: number
          divisionCode_id_fk: number
          grand_parent_mg_id?: number | null
          id?: never
          is_active?: boolean | null
          modTime?: string | null
          modUser?: number | null
          parent_mg_id: number
        }
        Update: {
          child_mg_id?: number
          createdTime?: string | null
          createdUser?: number
          divisionCode_id_fk?: number
          grand_parent_mg_id?: number | null
          id?: never
          is_active?: boolean | null
          modTime?: string | null
          modUser?: number | null
          parent_mg_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "merchGroupRelations_child_mg_id_fkey"
            columns: ["child_mg_id"]
            isOneToOne: false
            referencedRelation: "merchGroupMaster"
            referencedColumns: ["mg_id"]
          },
          {
            foreignKeyName: "merchGroupRelations_grand_parent_mg_id_fkey"
            columns: ["grand_parent_mg_id"]
            isOneToOne: false
            referencedRelation: "merchGroupMaster"
            referencedColumns: ["mg_id"]
          },
          {
            foreignKeyName: "merchGroupRelations_parent_mg_id_fkey"
            columns: ["parent_mg_id"]
            isOneToOne: false
            referencedRelation: "merchGroupMaster"
            referencedColumns: ["mg_id"]
          },
        ]
      }
      packaging_type: {
        Row: {
          code: string | null
          created_at: string
          id: string
          metadata: Json
          name: string
          normalized_name: string | null
          status: Database["app"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          normalized_name?: string | null
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          normalized_name?: string | null
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: []
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
      product_depth: {
        Row: {
          code: string
          created_at: string
          id: string
          label: string
          legacy_audit_text: string | null
          legacy_id: number | null
          legacy_status: string | null
          metadata: Json
          sort_order: number | null
          source_system: string
          status: Database["app"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          label: string
          legacy_audit_text?: string | null
          legacy_id?: number | null
          legacy_status?: string | null
          metadata?: Json
          sort_order?: number | null
          source_system?: string
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          label?: string
          legacy_audit_text?: string | null
          legacy_id?: number | null
          legacy_status?: string | null
          metadata?: Json
          sort_order?: number | null
          source_system?: string
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: []
      }
      product_depth_source_ref: {
        Row: {
          captured_at: string
          id: string
          metadata: Json
          product_depth_id: string
          source_code: string | null
          source_id: string
          source_label: string | null
          source_system: string
          source_table: string
        }
        Insert: {
          captured_at?: string
          id?: string
          metadata?: Json
          product_depth_id: string
          source_code?: string | null
          source_id: string
          source_label?: string | null
          source_system: string
          source_table: string
        }
        Update: {
          captured_at?: string
          id?: string
          metadata?: Json
          product_depth_id?: string
          source_code?: string | null
          source_id?: string
          source_label?: string | null
          source_system?: string
          source_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_depth_source_ref_product_depth_id_fkey"
            columns: ["product_depth_id"]
            isOneToOne: false
            referencedRelation: "product_depth"
            referencedColumns: ["id"]
          },
        ]
      }
      product_material: {
        Row: {
          code: string | null
          created_at: string
          id: string
          material: string | null
          metadata: Json
          name: string
          product_subtype_id: string | null
          product_type_id: string | null
          status: Database["app"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          material?: string | null
          metadata?: Json
          name: string
          product_subtype_id?: string | null
          product_type_id?: string | null
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          material?: string | null
          metadata?: Json
          name?: string
          product_subtype_id?: string | null
          product_type_id?: string | null
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_material_product_subtype_id_fkey"
            columns: ["product_subtype_id"]
            isOneToOne: false
            referencedRelation: "product_subtype"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_material_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_type"
            referencedColumns: ["id"]
          },
        ]
      }
      product_size: {
        Row: {
          code: string
          company_code: string
          created_at: string
          division_code: string
          first_seen_at: string
          id: string
          label: string
          label_source: string
          last_seen_in_source_at: string | null
          legacy_label: string | null
          metadata: Json
          mg_type_code: string
          retired_at: string | null
          status: Database["app"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          code: string
          company_code: string
          created_at?: string
          division_code: string
          first_seen_at?: string
          id?: string
          label: string
          label_source?: string
          last_seen_in_source_at?: string | null
          legacy_label?: string | null
          metadata?: Json
          mg_type_code?: string
          retired_at?: string | null
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          code?: string
          company_code?: string
          created_at?: string
          division_code?: string
          first_seen_at?: string
          id?: string
          label?: string
          label_source?: string
          last_seen_in_source_at?: string | null
          legacy_label?: string | null
          metadata?: Json
          mg_type_code?: string
          retired_at?: string | null
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: []
      }
      product_size_source_ref: {
        Row: {
          captured_at: string
          id: string
          metadata: Json
          product_size_id: string
          source_code: string | null
          source_id: string
          source_is_active: boolean | null
          source_label: string | null
          source_system: string
          source_table: string
        }
        Insert: {
          captured_at?: string
          id?: string
          metadata?: Json
          product_size_id: string
          source_code?: string | null
          source_id: string
          source_is_active?: boolean | null
          source_label?: string | null
          source_system: string
          source_table: string
        }
        Update: {
          captured_at?: string
          id?: string
          metadata?: Json
          product_size_id?: string
          source_code?: string | null
          source_id?: string
          source_is_active?: boolean | null
          source_label?: string | null
          source_system?: string
          source_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_size_source_ref_product_size_id_fkey"
            columns: ["product_size_id"]
            isOneToOne: false
            referencedRelation: "product_size"
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
      properties_and_characters: {
        Row: {
          created_at: string
          id: number
          licensor_id: number
          name: string
          source_character_id: string | null
          source_licensed_property_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: number
          licensor_id: number
          name: string
          source_character_id?: string | null
          source_licensed_property_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          licensor_id?: number
          name?: string
          source_character_id?: string | null
          source_licensed_property_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_and_characters_licensor_id_fkey"
            columns: ["licensor_id"]
            isOneToOne: false
            referencedRelation: "licenseList"
            referencedColumns: ["licenseList_id"]
          },
        ]
      }
      property: {
        Row: {
          code: string | null
          created_at: string
          id: string
          licensor_id: string
          metadata: Json
          name: string
          status: Database["app"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          licensor_id: string
          metadata?: Json
          name: string
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          licensor_id?: string
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
      property_alias: {
        Row: {
          alias: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          cross_app_certified: boolean
          evidence_notes: string | null
          id: string
          licensor_id: string
          normalized_alias: string | null
          property_id: string
          source_system: string | null
          updated_at: string
        }
        Insert: {
          alias: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          cross_app_certified?: boolean
          evidence_notes?: string | null
          id?: string
          licensor_id: string
          normalized_alias?: string | null
          property_id: string
          source_system?: string | null
          updated_at?: string
        }
        Update: {
          alias?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          cross_app_certified?: boolean
          evidence_notes?: string | null
          id?: string
          licensor_id?: string
          normalized_alias?: string | null
          property_id?: string
          source_system?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_alias_licensor_id_fkey"
            columns: ["licensor_id"]
            isOneToOne: false
            referencedRelation: "licensor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_alias_parent_matches_property"
            columns: ["property_id", "licensor_id"]
            isOneToOne: false
            referencedRelation: "property"
            referencedColumns: ["id", "licensor_id"]
          },
          {
            foreignKeyName: "property_alias_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property"
            referencedColumns: ["id"]
          },
        ]
      }
      property_character: {
        Row: {
          character_id: string
          created_at: string
          is_primary: boolean
          property_id: string
          source: string
        }
        Insert: {
          character_id: string
          created_at?: string
          is_primary?: boolean
          property_id: string
          source?: string
        }
        Update: {
          character_id?: string
          created_at?: string
          is_primary?: boolean
          property_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_character_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "character"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_character_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property"
            referencedColumns: ["id"]
          },
        ]
      }
      property_character_associations: {
        Row: {
          character_id: number
          created_at: string
          licensor_id: number
          property_id: number
          updated_at: string | null
        }
        Insert: {
          character_id: number
          created_at?: string
          licensor_id: number
          property_id: number
          updated_at?: string | null
        }
        Update: {
          character_id?: number
          created_at?: string
          licensor_id?: number
          property_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_character_associations_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "properties_and_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_character_associations_licensor_id_fkey"
            columns: ["licensor_id"]
            isOneToOne: false
            referencedRelation: "licenseList"
            referencedColumns: ["licenseList_id"]
          },
          {
            foreignKeyName: "property_character_associations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_and_characters"
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
      style_guide: {
        Row: {
          code: string | null
          created_at: string
          id: string
          licensor_id: string | null
          metadata: Json
          name: string
          parent_style_guide_id: string | null
          property_id: string | null
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
          parent_style_guide_id?: string | null
          property_id?: string | null
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
          parent_style_guide_id?: string | null
          property_id?: string | null
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "style_guide_licensor_id_fkey"
            columns: ["licensor_id"]
            isOneToOne: false
            referencedRelation: "licensor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "style_guide_parent_style_guide_id_fkey"
            columns: ["parent_style_guide_id"]
            isOneToOne: false
            referencedRelation: "style_guide"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "style_guide_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property"
            referencedColumns: ["id"]
          },
        ]
      }
      style_guide_character: {
        Row: {
          character_id: string
          created_at: string
          metadata: Json
          style_guide_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          metadata?: Json
          style_guide_id: string
        }
        Update: {
          character_id?: string
          created_at?: string
          metadata?: Json
          style_guide_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "style_guide_character_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "character"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "style_guide_character_style_guide_id_fkey"
            columns: ["style_guide_id"]
            isOneToOne: false
            referencedRelation: "style_guide"
            referencedColumns: ["id"]
          },
        ]
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
      technical_designer: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          name: string
          normalized_name: string | null
          status: Database["app"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          normalized_name?: string | null
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          normalized_name?: string | null
          status?: Database["app"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: []
      }
      vendor: {
        Row: {
          factory_id_fk: number | null
          vendor_access: string | null
          vendor_address1: string | null
          vendor_address2: string | null
          vendor_company_name: string | null
          vendor_company_nickname: string | null
          vendor_country: string | null
          vendor_email: string | null
          vendor_id: number
          vendor_lastname: string | null
          vendor_name: string | null
          vendor_passw: string | null
          vendor_phone1: string | null
          vendor_phone2: string | null
          vendor_profile_photo: string | null
          vendor_status: string | null
          vendor_wechatId: string | null
        }
        Insert: {
          factory_id_fk?: number | null
          vendor_access?: string | null
          vendor_address1?: string | null
          vendor_address2?: string | null
          vendor_company_name?: string | null
          vendor_company_nickname?: string | null
          vendor_country?: string | null
          vendor_email?: string | null
          vendor_id?: number
          vendor_lastname?: string | null
          vendor_name?: string | null
          vendor_passw?: string | null
          vendor_phone1?: string | null
          vendor_phone2?: string | null
          vendor_profile_photo?: string | null
          vendor_status?: string | null
          vendor_wechatId?: string | null
        }
        Update: {
          factory_id_fk?: number | null
          vendor_access?: string | null
          vendor_address1?: string | null
          vendor_address2?: string | null
          vendor_company_name?: string | null
          vendor_company_nickname?: string | null
          vendor_country?: string | null
          vendor_email?: string | null
          vendor_id?: number
          vendor_lastname?: string | null
          vendor_name?: string | null
          vendor_passw?: string | null
          vendor_phone1?: string | null
          vendor_phone2?: string | null
          vendor_profile_photo?: string | null
          vendor_status?: string | null
          vendor_wechatId?: string | null
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
      vendorGroup: {
        Row: {
          factory_ids: number[] | null
          id: number
          name: string
        }
        Insert: {
          factory_ids?: number[] | null
          id?: number
          name: string
        }
        Update: {
          factory_ids?: number[] | null
          id?: number
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_customer: {
        Args: {
          match_threshold?: number
          p_domain?: string
          p_name: string
          review_threshold?: number
        }
        Returns: {
          match_id: string
          review_id: string
          review_sim: number
        }[]
      }
      merge_customer: {
        Args: {
          p_alias_loser_name?: boolean
          p_loser: string
          p_survivor: string
        }
        Returns: undefined
      }
      merge_factory: {
        Args: {
          p_alias_loser_name?: boolean
          p_loser: string
          p_survivor: string
        }
        Returns: undefined
      }
      normalize_popsg_property_observation: {
        Args: { p_input: string }
        Returns: string
      }
      reconcile_merge_extension_row: {
        Args: {
          p_key_column: string
          p_loser: string
          p_survivor: string
          p_table: unknown
        }
        Returns: undefined
      }
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
      customer_ext: {
        Row: {
          created_at: string
          customer_id: string
          status: Database["app"]["Enums"]["entity_status"]
          status_changed_at: string | null
          status_changed_by: string | null
          status_reason: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          status?: Database["app"]["Enums"]["entity_status"]
          status_changed_at?: string | null
          status_changed_by?: string | null
          status_reason?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          status?: Database["app"]["Enums"]["entity_status"]
          status_changed_at?: string | null
          status_changed_by?: string | null
          status_reason?: string | null
          updated_at?: string
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
      factory_ext: {
        Row: {
          created_at: string
          factory_id: string
          status: Database["app"]["Enums"]["entity_status"]
          status_changed_at: string | null
          status_changed_by: string | null
          status_reason: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          factory_id: string
          status?: Database["app"]["Enums"]["entity_status"]
          status_changed_at?: string | null
          status_changed_by?: string | null
          status_reason?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          factory_id?: string
          status?: Database["app"]["Enums"]["entity_status"]
          status_changed_at?: string | null
          status_changed_by?: string | null
          status_reason?: string | null
          updated_at?: string
        }
        Relationships: []
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
      ingested_domain: {
        Row: {
          created_at: string
          display_name: string | null
          domain: string
          email_count: number
          first_seen_at: string | null
          id: string
          last_seen_at: string | null
          last_sender: string | null
          metadata: Json
          sample_subject: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          domain: string
          email_count?: number
          first_seen_at?: string | null
          id?: string
          last_seen_at?: string | null
          last_sender?: string | null
          metadata?: Json
          sample_subject?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          domain?: string
          email_count?: number
          first_seen_at?: string | null
          id?: string
          last_seen_at?: string | null
          last_sender?: string | null
          metadata?: Json
          sample_subject?: string | null
          status?: string
          updated_at?: string
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
      worker_delta_cursor: {
        Row: {
          advanced_at: string | null
          created_at: string
          cursor_key: string
          delta_link: string | null
          delta_link_sha256: string | null
          owner_identity: string | null
          purpose: string
          save_count: number
          updated_at: string
          version: string
        }
        Insert: {
          advanced_at?: string | null
          created_at?: string
          cursor_key: string
          delta_link?: string | null
          delta_link_sha256?: string | null
          owner_identity?: string | null
          purpose: string
          save_count?: number
          updated_at?: string
          version?: string
        }
        Update: {
          advanced_at?: string | null
          created_at?: string
          cursor_key?: string
          delta_link?: string | null
          delta_link_sha256?: string | null
          owner_identity?: string | null
          purpose?: string
          save_count?: number
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      load_worker_delta_cursor: {
        Args: { p_cursor_key: string }
        Returns: Json
      }
      record_ingested_domain: {
        Args: {
          p_display_name?: string
          p_domain: string
          p_sender?: string
          p_subject?: string
        }
        Returns: {
          created_at: string
          display_name: string | null
          domain: string
          email_count: number
          first_seen_at: string | null
          id: string
          last_seen_at: string | null
          last_sender: string | null
          metadata: Json
          sample_subject: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "ingested_domain"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      save_worker_delta_cursor: {
        Args: {
          p_cursor_key: string
          p_delta_link: string
          p_expected_version: string
          p_owner_identity: string
          p_purpose: string
        }
        Returns: Json
      }
      worker_cursor_privilege_ok: {
        Args: { p_role: string; p_session_user: string }
        Returns: boolean
      }
      worker_delta_cursor_status: {
        Args: { p_cursor_key: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  dam: {
    Tables: {
      agent_registration: {
        Row: {
          agent_name: string
          capabilities: Json
          created_at: string
          device_name: string | null
          id: string
          last_seen_at: string | null
          metadata: Json
          status: string
          updated_at: string
        }
        Insert: {
          agent_name: string
          capabilities?: Json
          created_at?: string
          device_name?: string | null
          id?: string
          last_seen_at?: string | null
          metadata?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          agent_name?: string
          capabilities?: Json
          created_at?: string
          device_name?: string | null
          id?: string
          last_seen_at?: string | null
          metadata?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      asset: {
        Row: {
          asset_type: string | null
          company_id: string | null
          created_at: string
          file_object_id: string | null
          file_type: string | null
          filename: string | null
          id: string
          licensor_id: string | null
          metadata: Json
          product_subtype_id: string | null
          property_id: string | null
          relative_path: string | null
          sku: string | null
          source_id: string | null
          source_system: string | null
          style_group_id: string | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string
          workflow_status: string | null
        }
        Insert: {
          asset_type?: string | null
          company_id?: string | null
          created_at?: string
          file_object_id?: string | null
          file_type?: string | null
          filename?: string | null
          id?: string
          licensor_id?: string | null
          metadata?: Json
          product_subtype_id?: string | null
          property_id?: string | null
          relative_path?: string | null
          sku?: string | null
          source_id?: string | null
          source_system?: string | null
          style_group_id?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          workflow_status?: string | null
        }
        Update: {
          asset_type?: string | null
          company_id?: string | null
          created_at?: string
          file_object_id?: string | null
          file_type?: string | null
          filename?: string | null
          id?: string
          licensor_id?: string | null
          metadata?: Json
          product_subtype_id?: string | null
          property_id?: string | null
          relative_path?: string | null
          sku?: string | null
          source_id?: string | null
          source_system?: string | null
          style_group_id?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          workflow_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_style_group_id_fkey"
            columns: ["style_group_id"]
            isOneToOne: false
            referencedRelation: "style_group"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_character: {
        Row: {
          asset_id: string
          character_id: string
          id: string
        }
        Insert: {
          asset_id: string
          character_id: string
          id?: string
        }
        Update: {
          asset_id?: string
          character_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_character_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "asset"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_checkout: {
        Row: {
          asset_id: string
          checked_in_at: string | null
          checked_out_at: string
          checked_out_by_profile_id: string | null
          helper_device_id: string | null
          id: string
          metadata: Json
          status: string
        }
        Insert: {
          asset_id: string
          checked_in_at?: string | null
          checked_out_at?: string
          checked_out_by_profile_id?: string | null
          helper_device_id?: string | null
          id?: string
          metadata?: Json
          status?: string
        }
        Update: {
          asset_id?: string
          checked_in_at?: string | null
          checked_out_at?: string
          checked_out_by_profile_id?: string | null
          helper_device_id?: string | null
          id?: string
          metadata?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_checkout_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "asset"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dam_asset_checkout_helper_device_fk"
            columns: ["helper_device_id"]
            isOneToOne: false
            referencedRelation: "helper_device"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_path_history: {
        Row: {
          asset_id: string
          changed_at: string
          id: string
          metadata: Json
          new_path: string
          old_path: string | null
          source_system: string | null
        }
        Insert: {
          asset_id: string
          changed_at?: string
          id?: string
          metadata?: Json
          new_path: string
          old_path?: string | null
          source_system?: string | null
        }
        Update: {
          asset_id?: string
          changed_at?: string
          id?: string
          metadata?: Json
          new_path?: string
          old_path?: string | null
          source_system?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_path_history_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "asset"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_tag: {
        Row: {
          asset_id: string
          created_at: string
          id: string
          source_system: string | null
          tag: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          id?: string
          source_system?: string | null
          tag: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          id?: string
          source_system?: string | null
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_tag_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "asset"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_ext: {
        Row: {
          created_at: string
          customer_id: string
          metadata: Json
          status: Database["app"]["Enums"]["entity_status"]
          status_changed_at: string | null
          status_changed_by: string | null
          status_reason: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          metadata?: Json
          status?: Database["app"]["Enums"]["entity_status"]
          status_changed_at?: string | null
          status_changed_by?: string | null
          status_reason?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          metadata?: Json
          status?: Database["app"]["Enums"]["entity_status"]
          status_changed_at?: string | null
          status_changed_by?: string | null
          status_reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      erp_item_snapshot: {
        Row: {
          id: string
          imported_at: string
          item_id: string | null
          payload: Json
          source_id: string | null
          source_system: string
          style_number: string | null
          sync_run_id: string | null
        }
        Insert: {
          id?: string
          imported_at?: string
          item_id?: string | null
          payload: Json
          source_id?: string | null
          source_system?: string
          style_number?: string | null
          sync_run_id?: string | null
        }
        Update: {
          id?: string
          imported_at?: string
          item_id?: string | null
          payload?: Json
          source_id?: string | null
          source_system?: string
          style_number?: string | null
          sync_run_id?: string | null
        }
        Relationships: []
      }
      factory_ext: {
        Row: {
          created_at: string
          factory_id: string
          status: Database["app"]["Enums"]["entity_status"]
          status_changed_at: string | null
          status_changed_by: string | null
          status_reason: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          factory_id: string
          status?: Database["app"]["Enums"]["entity_status"]
          status_changed_at?: string | null
          status_changed_by?: string | null
          status_reason?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          factory_id?: string
          status?: Database["app"]["Enums"]["entity_status"]
          status_changed_at?: string | null
          status_changed_by?: string | null
          status_reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      helper_device: {
        Row: {
          created_at: string
          id: string
          last_seen_at: string | null
          metadata: Json
          name: string
          paired_profile_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_seen_at?: string | null
          metadata?: Json
          name: string
          paired_profile_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_seen_at?: string | null
          metadata?: Json
          name?: string
          paired_profile_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      pdf_rich_extraction: {
        Row: {
          asset_id: string
          confidence: number | null
          data: Json
          doc_kind: string | null
          extracted_at: string
          model: string | null
          parse_error: string | null
          prompt_version: string | null
          schema_version: number
          sku: string | null
          source_text_sha256: string | null
          style_group_id: string | null
        }
        Insert: {
          asset_id: string
          confidence?: number | null
          data?: Json
          doc_kind?: string | null
          extracted_at?: string
          model?: string | null
          parse_error?: string | null
          prompt_version?: string | null
          schema_version?: number
          sku?: string | null
          source_text_sha256?: string | null
          style_group_id?: string | null
        }
        Update: {
          asset_id?: string
          confidence?: number | null
          data?: Json
          doc_kind?: string | null
          extracted_at?: string
          model?: string | null
          parse_error?: string | null
          prompt_version?: string | null
          schema_version?: number
          sku?: string | null
          source_text_sha256?: string | null
          style_group_id?: string | null
        }
        Relationships: []
      }
      popsg_property_resolution: {
        Row: {
          activated_at: string | null
          activated_by: string | null
          created_at: string
          decision_state: string
          disposition: string
          evidence_batch_id: string | null
          evidence_batch_sha256: string | null
          evidence_run_id: string | null
          id: string
          licensor_id: string
          normalized_observed_value: string | null
          occurrence_count: number
          property_id: string | null
          proposed_at: string
          proposed_by: string
          raw_observed_value: string
          review_notes: string | null
          superseded_at: string | null
          superseded_by: string | null
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          activated_by?: string | null
          created_at?: string
          decision_state?: string
          disposition: string
          evidence_batch_id?: string | null
          evidence_batch_sha256?: string | null
          evidence_run_id?: string | null
          id?: string
          licensor_id: string
          normalized_observed_value?: string | null
          occurrence_count?: number
          property_id?: string | null
          proposed_at?: string
          proposed_by: string
          raw_observed_value: string
          review_notes?: string | null
          superseded_at?: string | null
          superseded_by?: string | null
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          activated_by?: string | null
          created_at?: string
          decision_state?: string
          disposition?: string
          evidence_batch_id?: string | null
          evidence_batch_sha256?: string | null
          evidence_run_id?: string | null
          id?: string
          licensor_id?: string
          normalized_observed_value?: string | null
          occurrence_count?: number
          property_id?: string | null
          proposed_at?: string
          proposed_by?: string
          raw_observed_value?: string
          review_notes?: string | null
          superseded_at?: string | null
          superseded_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "popsg_property_resolution_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "popsg_property_resolution"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_queue: {
        Row: {
          asset_id: string | null
          claimed_at: string | null
          claimed_by: string | null
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          payload: Json
          priority: number
          queue_name: string
          status: string
          updated_at: string
        }
        Insert: {
          asset_id?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json
          priority?: number
          queue_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          asset_id?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json
          priority?: number
          queue_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processing_queue_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "asset"
            referencedColumns: ["id"]
          },
        ]
      }
      production_order_snapshot: {
        Row: {
          id: string
          imported_at: string
          payload: Json
          production_order_line_id: string | null
          production_order_number: string | null
          source_id: string | null
          source_system: string
          style_number: string | null
          sync_run_id: string | null
        }
        Insert: {
          id?: string
          imported_at?: string
          payload: Json
          production_order_line_id?: string | null
          production_order_number?: string | null
          source_id?: string | null
          source_system?: string
          style_number?: string | null
          sync_run_id?: string | null
        }
        Update: {
          id?: string
          imported_at?: string
          payload?: Json
          production_order_line_id?: string | null
          production_order_number?: string | null
          source_id?: string | null
          source_system?: string
          style_number?: string | null
          sync_run_id?: string | null
        }
        Relationships: []
      }
      sku_human_description: {
        Row: {
          description: string
          refreshed_at: string
          sku: string
          source_row_id: string
          source_updated_at: string | null
          tracker_type: string
        }
        Insert: {
          description: string
          refreshed_at?: string
          sku: string
          source_row_id: string
          source_updated_at?: string | null
          tracker_type: string
        }
        Update: {
          description?: string
          refreshed_at?: string
          sku?: string
          source_row_id?: string
          source_updated_at?: string | null
          tracker_type?: string
        }
        Relationships: []
      }
      sku_style_guide_source: {
        Row: {
          confidence: Database["app"]["Enums"]["source_confidence"]
          created_at: string
          evidence: string | null
          id: string
          sku_ref_id: string | null
          style_guide_file_id: string
        }
        Insert: {
          confidence?: Database["app"]["Enums"]["source_confidence"]
          created_at?: string
          evidence?: string | null
          id?: string
          sku_ref_id?: string | null
          style_guide_file_id: string
        }
        Update: {
          confidence?: Database["app"]["Enums"]["source_confidence"]
          created_at?: string
          evidence?: string | null
          id?: string
          sku_ref_id?: string | null
          style_guide_file_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sku_style_guide_source_style_guide_file_id_fkey"
            columns: ["style_guide_file_id"]
            isOneToOne: false
            referencedRelation: "style_guide_file"
            referencedColumns: ["id"]
          },
        ]
      }
      style_group: {
        Row: {
          asset_count: number
          company_id: string | null
          cover_asset_id: string | null
          created_at: string
          id: string
          licensor_id: string | null
          metadata: Json
          product_id: string | null
          product_type_id: string | null
          property_id: string | null
          sku: string | null
          source_id: string | null
          source_system: string | null
          status: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          asset_count?: number
          company_id?: string | null
          cover_asset_id?: string | null
          created_at?: string
          id?: string
          licensor_id?: string | null
          metadata?: Json
          product_id?: string | null
          product_type_id?: string | null
          property_id?: string | null
          sku?: string | null
          source_id?: string | null
          source_system?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          asset_count?: number
          company_id?: string | null
          cover_asset_id?: string | null
          created_at?: string
          id?: string
          licensor_id?: string | null
          metadata?: Json
          product_id?: string | null
          product_type_id?: string | null
          property_id?: string | null
          sku?: string | null
          source_id?: string | null
          source_system?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dam_style_group_cover_asset_fk"
            columns: ["cover_asset_id"]
            isOneToOne: false
            referencedRelation: "asset"
            referencedColumns: ["id"]
          },
        ]
      }
      style_guide_file: {
        Row: {
          company_id: string | null
          created_at: string
          file_object_id: string | null
          folder: string | null
          id: string
          licensor_id: string | null
          metadata: Json
          property_id: string | null
          relative_path: string | null
          source_id: string | null
          source_system: string | null
          status: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          file_object_id?: string | null
          folder?: string | null
          id?: string
          licensor_id?: string | null
          metadata?: Json
          property_id?: string | null
          relative_path?: string | null
          source_id?: string | null
          source_system?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          file_object_id?: string | null
          folder?: string | null
          id?: string
          licensor_id?: string | null
          metadata?: Json
          property_id?: string | null
          relative_path?: string | null
          source_id?: string | null
          source_system?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      jsonb_leaf_text: { Args: { p: Json }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  ingest: {
    Tables: {
      coldlion_product_size_landing: {
        Row: {
          code: string
          company_code: string
          division_code: string
          fetched_at: string
          id: string
          label: string
          mg_type_code: string
          raw: Json
          run_id: string
        }
        Insert: {
          code: string
          company_code: string
          division_code: string
          fetched_at?: string
          id?: string
          label: string
          mg_type_code: string
          raw?: Json
          run_id: string
        }
        Update: {
          code?: string
          company_code?: string
          division_code?: string
          fetched_at?: string
          id?: string
          label?: string
          mg_type_code?: string
          raw?: Json
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coldlion_product_size_landing_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "coldlion_product_size_run"
            referencedColumns: ["id"]
          },
        ]
      }
      coldlion_product_size_run: {
        Row: {
          error_detail: string | null
          fetched_row_count: number | null
          finished_at: string | null
          id: string
          mode: string
          page_count: number | null
          requested_by: string
          result: Json
          source_endpoint: string | null
          started_at: string
          status: Database["ingest"]["Enums"]["sync_status"]
        }
        Insert: {
          error_detail?: string | null
          fetched_row_count?: number | null
          finished_at?: string | null
          id?: string
          mode: string
          page_count?: number | null
          requested_by: string
          result?: Json
          source_endpoint?: string | null
          started_at?: string
          status?: Database["ingest"]["Enums"]["sync_status"]
        }
        Update: {
          error_detail?: string | null
          fetched_row_count?: number | null
          finished_at?: string | null
          id?: string
          mode?: string
          page_count?: number | null
          requested_by?: string
          result?: Json
          source_endpoint?: string | null
          started_at?: string
          status?: Database["ingest"]["Enums"]["sync_status"]
        }
        Relationships: []
      }
      dedupe_candidate: {
        Row: {
          confidence: Database["app"]["Enums"]["source_confidence"]
          created_at: string
          entity_schema: string
          entity_table: string
          id: string
          left_entity_id: string | null
          raw: Json
          reason: string | null
          resolved_at: string | null
          resolved_by_profile_id: string | null
          right_entity_id: string | null
          source_system: string | null
        }
        Insert: {
          confidence?: Database["app"]["Enums"]["source_confidence"]
          created_at?: string
          entity_schema: string
          entity_table: string
          id?: string
          left_entity_id?: string | null
          raw?: Json
          reason?: string | null
          resolved_at?: string | null
          resolved_by_profile_id?: string | null
          right_entity_id?: string | null
          source_system?: string | null
        }
        Update: {
          confidence?: Database["app"]["Enums"]["source_confidence"]
          created_at?: string
          entity_schema?: string
          entity_table?: string
          id?: string
          left_entity_id?: string | null
          raw?: Json
          reason?: string | null
          resolved_at?: string | null
          resolved_by_profile_id?: string | null
          right_entity_id?: string | null
          source_system?: string | null
        }
        Relationships: []
      }
      raw_record: {
        Row: {
          id: string
          imported_at: string
          payload: Json
          record_hash: string | null
          source_id: string
          source_system: string
          source_table: string
          sync_run_id: string | null
        }
        Insert: {
          id?: string
          imported_at?: string
          payload: Json
          record_hash?: string | null
          source_id: string
          source_system: string
          source_table: string
          sync_run_id?: string | null
        }
        Update: {
          id?: string
          imported_at?: string
          payload?: Json
          record_hash?: string | null
          source_id?: string
          source_system?: string
          source_table?: string
          sync_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raw_record_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_run"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_run: {
        Row: {
          created_at: string
          error: string | null
          finished_at: string | null
          id: string
          metadata: Json
          rows_failed: number
          rows_inserted: number
          rows_seen: number
          rows_updated: number
          source_name: string | null
          source_system: string
          started_at: string | null
          status: Database["ingest"]["Enums"]["sync_status"]
        }
        Insert: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          metadata?: Json
          rows_failed?: number
          rows_inserted?: number
          rows_seen?: number
          rows_updated?: number
          source_name?: string | null
          source_system: string
          started_at?: string | null
          status?: Database["ingest"]["Enums"]["sync_status"]
        }
        Update: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          metadata?: Json
          rows_failed?: number
          rows_inserted?: number
          rows_seen?: number
          rows_updated?: number
          source_name?: string | null
          source_system?: string
          started_at?: string | null
          status?: Database["ingest"]["Enums"]["sync_status"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_coldlion_product_size: {
        Args: {
          p_apply?: boolean
          p_max_retirements?: number
          p_max_rows?: number
          p_min_rows?: number
          p_run_id: string
        }
        Returns: Json
      }
      assert_coldlion_product_size_authority: { Args: never; Returns: string }
    }
    Enums: {
      sync_status: "pending" | "running" | "succeeded" | "failed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  pim: {
    Tables: {
      checklist_item: {
        Row: {
          created_at: string
          external_id: string | null
          external_source: string | null
          id: string
          metadata: Json
          product_id: string | null
          project_id: string | null
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          external_source?: string | null
          id?: string
          metadata?: Json
          product_id?: string | null
          project_id?: string | null
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_id?: string | null
          external_source?: string | null
          id?: string
          metadata?: Json
          product_id?: string | null
          project_id?: string | null
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_item_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_item_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_ext: {
        Row: {
          created_at: string
          customer_id: string
          status: Database["app"]["Enums"]["entity_status"]
          status_changed_at: string | null
          status_changed_by: string | null
          status_reason: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          status?: Database["app"]["Enums"]["entity_status"]
          status_changed_at?: string | null
          status_changed_by?: string | null
          status_reason?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          status?: Database["app"]["Enums"]["entity_status"]
          status_changed_at?: string | null
          status_changed_by?: string | null
          status_reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customer_order: {
        Row: {
          company_id: string | null
          created_at: string
          due_date: string | null
          external_id: string | null
          external_source: string | null
          id: string
          metadata: Json
          notes: string | null
          order_date: string | null
          order_number: string | null
          product_id: string | null
          production_order_id: string | null
          project_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          due_date?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          order_date?: string | null
          order_number?: string | null
          product_id?: string | null
          production_order_id?: string | null
          project_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          due_date?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          order_date?: string | null
          order_number?: string | null
          product_id?: string | null
          production_order_id?: string | null
          project_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_order_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_order_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      design: {
        Row: {
          created_at: string
          design_collection_id: string | null
          external_id: string | null
          external_source: string | null
          id: string
          metadata: Json
          nas_path: string | null
          primary_asset_id: string | null
          status: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          design_collection_id?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          metadata?: Json
          nas_path?: string | null
          primary_asset_id?: string | null
          status?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          design_collection_id?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          metadata?: Json
          nas_path?: string | null
          primary_asset_id?: string | null
          status?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_design_collection_id_fkey"
            columns: ["design_collection_id"]
            isOneToOne: false
            referencedRelation: "design_collection"
            referencedColumns: ["id"]
          },
        ]
      }
      design_asset: {
        Row: {
          asset_id: string
          confidence: Database["app"]["Enums"]["source_confidence"]
          created_at: string
          design_id: string
          id: string
          is_primary: boolean
          link_type: string
        }
        Insert: {
          asset_id: string
          confidence?: Database["app"]["Enums"]["source_confidence"]
          created_at?: string
          design_id: string
          id?: string
          is_primary?: boolean
          link_type?: string
        }
        Update: {
          asset_id?: string
          confidence?: Database["app"]["Enums"]["source_confidence"]
          created_at?: string
          design_id?: string
          id?: string
          is_primary?: boolean
          link_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_asset_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "design"
            referencedColumns: ["id"]
          },
        ]
      }
      design_collection: {
        Row: {
          company_id: string | null
          created_at: string
          external_id: string | null
          external_source: string | null
          id: string
          metadata: Json
          name: string
          season: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          external_id?: string | null
          external_source?: string | null
          id?: string
          metadata?: Json
          name: string
          season?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          external_id?: string | null
          external_source?: string | null
          id?: string
          metadata?: Json
          name?: string
          season?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      factory_ext: {
        Row: {
          created_at: string
          factory_id: string
          status: Database["app"]["Enums"]["entity_status"]
          status_changed_at: string | null
          status_changed_by: string | null
          status_reason: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          factory_id: string
          status?: Database["app"]["Enums"]["entity_status"]
          status_changed_at?: string | null
          status_changed_by?: string | null
          status_reason?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          factory_id?: string
          status?: Database["app"]["Enums"]["entity_status"]
          status_changed_at?: string | null
          status_changed_by?: string | null
          status_reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product: {
        Row: {
          buyer_contact_id: string | null
          clickup_creator_id: string | null
          clickup_creator_name: string | null
          clickup_folder_id: string | null
          clickup_list_id: string | null
          clickup_orderindex: string | null
          clickup_parent_id: string | null
          clickup_space_id: string | null
          clickup_space_name: string | null
          clickup_status: string | null
          clickup_status_color: string | null
          clickup_status_order: number | null
          clickup_status_type: string | null
          clickup_task_id: string | null
          clickup_time_estimate_ms: number | null
          code: string | null
          company_id: string | null
          cover_url: string | null
          created_at: string
          design_id: string | null
          external_id: string | null
          external_source: string | null
          factory_id: string | null
          id: string
          licensor_id: string | null
          lifecycle_status: string | null
          metadata: Json
          name: string
          plm_item_id: string | null
          product_type_id: string | null
          project_id: string | null
          property_id: string | null
          stage: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          buyer_contact_id?: string | null
          clickup_creator_id?: string | null
          clickup_creator_name?: string | null
          clickup_folder_id?: string | null
          clickup_list_id?: string | null
          clickup_orderindex?: string | null
          clickup_parent_id?: string | null
          clickup_space_id?: string | null
          clickup_space_name?: string | null
          clickup_status?: string | null
          clickup_status_color?: string | null
          clickup_status_order?: number | null
          clickup_status_type?: string | null
          clickup_task_id?: string | null
          clickup_time_estimate_ms?: number | null
          code?: string | null
          company_id?: string | null
          cover_url?: string | null
          created_at?: string
          design_id?: string | null
          external_id?: string | null
          external_source?: string | null
          factory_id?: string | null
          id?: string
          licensor_id?: string | null
          lifecycle_status?: string | null
          metadata?: Json
          name: string
          plm_item_id?: string | null
          product_type_id?: string | null
          project_id?: string | null
          property_id?: string | null
          stage?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          buyer_contact_id?: string | null
          clickup_creator_id?: string | null
          clickup_creator_name?: string | null
          clickup_folder_id?: string | null
          clickup_list_id?: string | null
          clickup_orderindex?: string | null
          clickup_parent_id?: string | null
          clickup_space_id?: string | null
          clickup_space_name?: string | null
          clickup_status?: string | null
          clickup_status_color?: string | null
          clickup_status_order?: number | null
          clickup_status_type?: string | null
          clickup_task_id?: string | null
          clickup_time_estimate_ms?: number | null
          code?: string | null
          company_id?: string | null
          cover_url?: string | null
          created_at?: string
          design_id?: string | null
          external_id?: string | null
          external_source?: string | null
          factory_id?: string | null
          id?: string
          licensor_id?: string | null
          lifecycle_status?: string | null
          metadata?: Json
          name?: string
          plm_item_id?: string | null
          product_type_id?: string | null
          project_id?: string | null
          property_id?: string | null
          stage?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "design"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      product_assignee: {
        Row: {
          assignment_type: string
          created_at: string
          id: string
          product_id: string
          profile_id: string
        }
        Insert: {
          assignment_type?: string
          created_at?: string
          id?: string
          product_id: string
          profile_id: string
        }
        Update: {
          assignment_type?: string
          created_at?: string
          id?: string
          product_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_assignee_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      product_field: {
        Row: {
          created_at: string
          external_id: string | null
          external_source: string | null
          field_name: string
          id: string
          product_id: string
          updated_at: string
          value_json: Json | null
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          external_source?: string | null
          field_name: string
          id?: string
          product_id: string
          updated_at?: string
          value_json?: Json | null
        }
        Update: {
          created_at?: string
          external_id?: string | null
          external_source?: string | null
          field_name?: string
          id?: string
          product_id?: string
          updated_at?: string
          value_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "product_field_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      product_file: {
        Row: {
          created_at: string
          dam_asset_id: string | null
          external_id: string | null
          external_source: string | null
          file_object_id: string | null
          id: string
          metadata: Json
          product_id: string
          source_url: string | null
          stored_url: string | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dam_asset_id?: string | null
          external_id?: string | null
          external_source?: string | null
          file_object_id?: string | null
          id?: string
          metadata?: Json
          product_id: string
          source_url?: string | null
          stored_url?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dam_asset_id?: string | null
          external_id?: string | null
          external_source?: string | null
          file_object_id?: string | null
          id?: string
          metadata?: Json
          product_id?: string
          source_url?: string | null
          stored_url?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_file_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      product_link: {
        Row: {
          created_at: string
          from_product_id: string
          id: string
          link_type: string
          metadata: Json
          to_product_id: string
        }
        Insert: {
          created_at?: string
          from_product_id: string
          id?: string
          link_type: string
          metadata?: Json
          to_product_id: string
        }
        Update: {
          created_at?: string
          from_product_id?: string
          id?: string
          link_type?: string
          metadata?: Json
          to_product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_link_from_product_id_fkey"
            columns: ["from_product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_link_to_product_id_fkey"
            columns: ["to_product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sample: {
        Row: {
          created_at: string
          external_id: string | null
          external_source: string | null
          factory_id: string | null
          id: string
          metadata: Json
          product_id: string
          received_at: string | null
          requested_at: string | null
          sample_type: string | null
          status: string
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          external_source?: string | null
          factory_id?: string | null
          id?: string
          metadata?: Json
          product_id: string
          received_at?: string | null
          requested_at?: string | null
          sample_type?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_id?: string | null
          external_source?: string | null
          factory_id?: string | null
          id?: string
          metadata?: Json
          product_id?: string
          received_at?: string | null
          requested_at?: string | null
          sample_type?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_sample_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      product_style_group: {
        Row: {
          confidence: Database["app"]["Enums"]["source_confidence"]
          created_at: string
          id: string
          product_id: string
          style_group_id: string
        }
        Insert: {
          confidence?: Database["app"]["Enums"]["source_confidence"]
          created_at?: string
          id?: string
          product_id: string
          style_group_id: string
        }
        Update: {
          confidence?: Database["app"]["Enums"]["source_confidence"]
          created_at?: string
          id?: string
          product_id?: string
          style_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_style_group_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      product_submission: {
        Row: {
          approved_at: string | null
          created_at: string
          external_id: string | null
          external_source: string | null
          id: string
          licensor_id: string | null
          metadata: Json
          product_id: string
          property_id: string | null
          rejected_at: string | null
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          external_id?: string | null
          external_source?: string | null
          id?: string
          licensor_id?: string | null
          metadata?: Json
          product_id: string
          property_id?: string | null
          rejected_at?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          external_id?: string | null
          external_source?: string | null
          id?: string
          licensor_id?: string | null
          metadata?: Json
          product_id?: string
          property_id?: string | null
          rejected_at?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_submission_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tag: {
        Row: {
          created_at: string
          id: string
          product_id: string
          source_system: string | null
          tag: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          source_system?: string | null
          tag: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          source_system?: string | null
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tag_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      product_time_entry: {
        Row: {
          created_at: string
          external_id: string | null
          external_source: string | null
          id: string
          metadata: Json
          product_id: string
          profile_id: string | null
          seconds_spent: number
          started_at: string | null
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          external_source?: string | null
          id?: string
          metadata?: Json
          product_id: string
          profile_id?: string | null
          seconds_spent: number
          started_at?: string | null
        }
        Update: {
          created_at?: string
          external_id?: string | null
          external_source?: string | null
          id?: string
          metadata?: Json
          product_id?: string
          profile_id?: string | null
          seconds_spent?: number
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_time_entry_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      product_update: {
        Row: {
          body: string | null
          created_at: string
          external_id: string | null
          external_source: string | null
          id: string
          metadata: Json
          product_id: string
          profile_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          external_id?: string | null
          external_source?: string | null
          id?: string
          metadata?: Json
          product_id: string
          profile_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          external_id?: string | null
          external_source?: string | null
          id?: string
          metadata?: Json
          product_id?: string
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_update_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      project: {
        Row: {
          company_id: string | null
          created_at: string
          design_collection_id: string | null
          external_id: string | null
          external_source: string | null
          id: string
          licensor_id: string | null
          metadata: Json
          primary_contact_id: string | null
          property_id: string | null
          stage: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          design_collection_id?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          licensor_id?: string | null
          metadata?: Json
          primary_contact_id?: string | null
          property_id?: string | null
          stage?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          design_collection_id?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          licensor_id?: string | null
          metadata?: Json
          primary_contact_id?: string | null
          property_id?: string | null
          stage?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_design_collection_id_fkey"
            columns: ["design_collection_id"]
            isOneToOne: false
            referencedRelation: "design_collection"
            referencedColumns: ["id"]
          },
        ]
      }
      revision_request: {
        Row: {
          body: string | null
          external_id: string | null
          external_source: string | null
          id: string
          metadata: Json
          product_id: string
          requested_at: string
          requested_by_profile_id: string | null
          resolved_at: string | null
          status: string
          submission_id: string | null
        }
        Insert: {
          body?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          metadata?: Json
          product_id: string
          requested_at?: string
          requested_by_profile_id?: string | null
          resolved_at?: string | null
          status?: string
          submission_id?: string | null
        }
        Update: {
          body?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          metadata?: Json
          product_id?: string
          requested_at?: string
          requested_by_profile_id?: string | null
          resolved_at?: string | null
          status?: string
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revision_request_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revision_request_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "product_submission"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_view: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_default: boolean
          name: string
          owner_profile_id: string | null
          role_id: string | null
          scope: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          owner_profile_id?: string | null
          role_id?: string | null
          scope: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          owner_profile_id?: string | null
          role_id?: string | null
          scope?: string
          updated_at?: string
        }
        Relationships: []
      }
      stage: {
        Row: {
          code: string | null
          id: string
          metadata: Json
          name: string
          pipeline: string
          sort_order: number
        }
        Insert: {
          code?: string | null
          id?: string
          metadata?: Json
          name: string
          pipeline?: string
          sort_order?: number
        }
        Update: {
          code?: string | null
          id?: string
          metadata?: Json
          name?: string
          pipeline?: string
          sort_order?: number
        }
        Relationships: []
      }
      stage_history: {
        Row: {
          changed_at: string
          changed_by_profile_id: string | null
          from_stage_id: string | null
          id: string
          metadata: Json
          notes: string | null
          product_id: string | null
          project_id: string | null
          to_stage_id: string | null
        }
        Insert: {
          changed_at?: string
          changed_by_profile_id?: string | null
          from_stage_id?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          product_id?: string | null
          project_id?: string | null
          to_stage_id?: string | null
        }
        Update: {
          changed_at?: string
          changed_by_profile_id?: string | null
          from_stage_id?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          product_id?: string | null
          project_id?: string | null
          to_stage_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stage_history_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "stage"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_history_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "stage"
            referencedColumns: ["id"]
          },
        ]
      }
      view_pref: {
        Row: {
          config: Json
          id: string
          profile_id: string
          scope: string
          updated_at: string
        }
        Insert: {
          config?: Json
          id?: string
          profile_id: string
          scope: string
          updated_at?: string
        }
        Update: {
          config?: Json
          id?: string
          profile_id?: string
          scope?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      sync_clickup_tasks: {
        Args: { p_mode?: string; p_snapshot: Json }
        Returns: {
          locked: boolean
          mode: string
          rows_failed: number
          rows_inserted: number
          rows_seen: number
          rows_unchanged: number
          rows_updated: number
          snapshot_hash: string
          sync_run_id: string
          watermark_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  plm: {
    Tables: {
      art_piece: {
        Row: {
          art_type: string | null
          artist: string | null
          artist_id: string | null
          created_at: string
          id: string
          item_id: string | null
          name: string | null
          raw: Json
          source_id: string | null
          source_system: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          art_type?: string | null
          artist?: string | null
          artist_id?: string | null
          created_at?: string
          id?: string
          item_id?: string | null
          name?: string | null
          raw?: Json
          source_id?: string | null
          source_system?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          art_type?: string | null
          artist?: string | null
          artist_id?: string | null
          created_at?: string
          id?: string
          item_id?: string | null
          name?: string | null
          raw?: Json
          source_id?: string | null
          source_system?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "art_piece_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item"
            referencedColumns: ["id"]
          },
        ]
      }
      art_piece_attachment: {
        Row: {
          art_piece_id: number
          company_code: number
          created_at: string
          created_by: number
          display_type: string | null
          divisioncode_id: number
          file_name: string | null
          id: number
          is_active: boolean
          link: string | null
          primary_image: boolean
          type: string | null
          updated_at: string | null
          updated_by: number | null
          uuid: string
        }
        Insert: {
          art_piece_id: number
          company_code: number
          created_at?: string
          created_by: number
          display_type?: string | null
          divisioncode_id: number
          file_name?: string | null
          id?: number
          is_active?: boolean
          link?: string | null
          primary_image?: boolean
          type?: string | null
          updated_at?: string | null
          updated_by?: number | null
          uuid: string
        }
        Update: {
          art_piece_id?: number
          company_code?: number
          created_at?: string
          created_by?: number
          display_type?: string | null
          divisioncode_id?: number
          file_name?: string | null
          id?: number
          is_active?: boolean
          link?: string | null
          primary_image?: boolean
          type?: string | null
          updated_at?: string | null
          updated_by?: number | null
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "art_piece_attachment_company_code_fkey"
            columns: ["company_code"]
            isOneToOne: false
            referencedRelation: "companyCode"
            referencedColumns: ["comCode_id"]
          },
          {
            foreignKeyName: "art_piece_attachment_divisioncode_id_fkey"
            columns: ["divisioncode_id"]
            isOneToOne: false
            referencedRelation: "divisionCode"
            referencedColumns: ["divCode_id"]
          },
        ]
      }
      art_piece_item: {
        Row: {
          art_piece_id: string
          confidence: Database["app"]["Enums"]["source_confidence"]
          created_at: string
          id: string
          item_id: string | null
          metadata: Json
          normalized_sku: string | null
          normalized_style_number: string | null
          sku: string | null
          source_id: string | null
          source_system: string | null
          style_number: string | null
          updated_at: string
        }
        Insert: {
          art_piece_id: string
          confidence?: Database["app"]["Enums"]["source_confidence"]
          created_at?: string
          id?: string
          item_id?: string | null
          metadata?: Json
          normalized_sku?: string | null
          normalized_style_number?: string | null
          sku?: string | null
          source_id?: string | null
          source_system?: string | null
          style_number?: string | null
          updated_at?: string
        }
        Update: {
          art_piece_id?: string
          confidence?: Database["app"]["Enums"]["source_confidence"]
          created_at?: string
          id?: string
          item_id?: string | null
          metadata?: Json
          normalized_sku?: string | null
          normalized_style_number?: string | null
          sku?: string | null
          source_id?: string | null
          source_system?: string | null
          style_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "art_piece_item_art_piece_id_fkey"
            columns: ["art_piece_id"]
            isOneToOne: false
            referencedRelation: "art_piece"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "art_piece_item_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item"
            referencedColumns: ["id"]
          },
        ]
      }
      coldlion_promotion_audit: {
        Row: {
          company_code: string
          decided_at: string
          decided_by: string
          decision: string
          decision_detail: string | null
          division_code: string
          entity_id: string
          entity_table: string
          entity_type: string
          environment: string | null
          field_name: string
          id: string
          is_drill: boolean
          mg_code: string
          mg_type_code: string
          new_value: string | null
          old_value: string | null
          rule_id: string
          sync_run_id: string | null
        }
        Insert: {
          company_code: string
          decided_at?: string
          decided_by?: string
          decision: string
          decision_detail?: string | null
          division_code: string
          entity_id: string
          entity_table: string
          entity_type: string
          environment?: string | null
          field_name: string
          id?: string
          is_drill?: boolean
          mg_code: string
          mg_type_code: string
          new_value?: string | null
          old_value?: string | null
          rule_id: string
          sync_run_id?: string | null
        }
        Update: {
          company_code?: string
          decided_at?: string
          decided_by?: string
          decision?: string
          decision_detail?: string | null
          division_code?: string
          entity_id?: string
          entity_table?: string
          entity_type?: string
          environment?: string | null
          field_name?: string
          id?: string
          is_drill?: boolean
          mg_code?: string
          mg_type_code?: string
          new_value?: string | null
          old_value?: string | null
          rule_id?: string
          sync_run_id?: string | null
        }
        Relationships: []
      }
      coldlion_promotion_quarantine: {
        Row: {
          canonical_id: string | null
          canonical_name: string | null
          company_code: string
          detail: string | null
          detected_at: string
          division_code: string
          entity_type: string | null
          environment: string | null
          id: string
          is_drill: boolean
          mg_code: string
          mg_type_code: string
          reason: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          source_name: string | null
          sync_run_id: string | null
        }
        Insert: {
          canonical_id?: string | null
          canonical_name?: string | null
          company_code: string
          detail?: string | null
          detected_at?: string
          division_code: string
          entity_type?: string | null
          environment?: string | null
          id?: string
          is_drill?: boolean
          mg_code: string
          mg_type_code: string
          reason: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          source_name?: string | null
          sync_run_id?: string | null
        }
        Update: {
          canonical_id?: string | null
          canonical_name?: string | null
          company_code?: string
          detail?: string | null
          detected_at?: string
          division_code?: string
          entity_type?: string | null
          environment?: string | null
          id?: string
          is_drill?: boolean
          mg_code?: string
          mg_type_code?: string
          reason?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          source_name?: string | null
          sync_run_id?: string | null
        }
        Relationships: []
      }
      companyCode: {
        Row: {
          comCode_id: number
          company_name: string
          compCode_cl_id: string
        }
        Insert: {
          comCode_id?: never
          company_name: string
          compCode_cl_id: string
        }
        Update: {
          comCode_id?: never
          company_name?: string
          compCode_cl_id?: string
        }
        Relationships: []
      }
      ContainerHeader: {
        Row: {
          CompanyCode: string | null
          ContainerNo: string | null
          ContainerPriority: string | null
          ContainerRecvd: string | null
          ContainerSize: string | null
          ContainerStatus: string | null
          ContainerType: string | null
          ContainerVolume: string | null
          EDI943Proc: string | null
          EDI943ProcDate: string | null
          EstWhseArrivalDate: string | null
          fkey: number | null
          id: number
          LFDDate: string | null
          ProNo: string | null
          ReceiveFkey: string | null
          ReceiveNo: string | null
          Remarks: string | null
          SealNo: string | null
          ShipmentNo: string | null
          ShipViaCode: string | null
          TotalCartons: string | null
          TotalQty: string | null
          WarehouseCode: string | null
          WhseArrivalDate: string | null
        }
        Insert: {
          CompanyCode?: string | null
          ContainerNo?: string | null
          ContainerPriority?: string | null
          ContainerRecvd?: string | null
          ContainerSize?: string | null
          ContainerStatus?: string | null
          ContainerType?: string | null
          ContainerVolume?: string | null
          EDI943Proc?: string | null
          EDI943ProcDate?: string | null
          EstWhseArrivalDate?: string | null
          fkey?: number | null
          id?: never
          LFDDate?: string | null
          ProNo?: string | null
          ReceiveFkey?: string | null
          ReceiveNo?: string | null
          Remarks?: string | null
          SealNo?: string | null
          ShipmentNo?: string | null
          ShipViaCode?: string | null
          TotalCartons?: string | null
          TotalQty?: string | null
          WarehouseCode?: string | null
          WhseArrivalDate?: string | null
        }
        Update: {
          CompanyCode?: string | null
          ContainerNo?: string | null
          ContainerPriority?: string | null
          ContainerRecvd?: string | null
          ContainerSize?: string | null
          ContainerStatus?: string | null
          ContainerType?: string | null
          ContainerVolume?: string | null
          EDI943Proc?: string | null
          EDI943ProcDate?: string | null
          EstWhseArrivalDate?: string | null
          fkey?: number | null
          id?: never
          LFDDate?: string | null
          ProNo?: string | null
          ReceiveFkey?: string | null
          ReceiveNo?: string | null
          Remarks?: string | null
          SealNo?: string | null
          ShipmentNo?: string | null
          ShipViaCode?: string | null
          TotalCartons?: string | null
          TotalQty?: string | null
          WarehouseCode?: string | null
          WhseArrivalDate?: string | null
        }
        Relationships: []
      }
      customer_import: {
        Row: {
          airbyte_customers_hashid: string | null
          airbyte_emitted_at: string | null
          company_id: string
          customer_code: string | null
          customer_name: string
          dilution: number | null
          email: string | null
          imported_at: string
          logistic_load: number | null
          logo_url: string | null
          phone: string | null
          plm_customer_id: string
          raw: Json
          status: string | null
          updated_at: string
        }
        Insert: {
          airbyte_customers_hashid?: string | null
          airbyte_emitted_at?: string | null
          company_id: string
          customer_code?: string | null
          customer_name: string
          dilution?: number | null
          email?: string | null
          imported_at?: string
          logistic_load?: number | null
          logo_url?: string | null
          phone?: string | null
          plm_customer_id: string
          raw?: Json
          status?: string | null
          updated_at?: string
        }
        Update: {
          airbyte_customers_hashid?: string | null
          airbyte_emitted_at?: string | null
          company_id?: string
          customer_code?: string | null
          customer_name?: string
          dilution?: number | null
          email?: string | null
          imported_at?: string
          logistic_load?: number | null
          logo_url?: string | null
          phone?: string | null
          plm_customer_id?: string
          raw?: Json
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      deliveryLocation: {
        Row: {
          deliveryLocation_airbyte_deliverys_hashid: string | null
          deliveryLocation_airbyte_emitted_at: string | null
          deliveryLocation_auditlog: string | null
          deliveryLocation_code: string | null
          deliveryLocation_id: number
          deliveryLocation_status: string | null
          deliveryLocation_title: string | null
        }
        Insert: {
          deliveryLocation_airbyte_deliverys_hashid?: string | null
          deliveryLocation_airbyte_emitted_at?: string | null
          deliveryLocation_auditlog?: string | null
          deliveryLocation_code?: string | null
          deliveryLocation_id?: number
          deliveryLocation_status?: string | null
          deliveryLocation_title?: string | null
        }
        Update: {
          deliveryLocation_airbyte_deliverys_hashid?: string | null
          deliveryLocation_airbyte_emitted_at?: string | null
          deliveryLocation_auditlog?: string | null
          deliveryLocation_code?: string | null
          deliveryLocation_id?: number
          deliveryLocation_status?: string | null
          deliveryLocation_title?: string | null
        }
        Relationships: []
      }
      deployment_environment: {
        Row: {
          configured_at: string | null
          configured_by: string | null
          configured_reason: string | null
          environment_name: string
          singleton: boolean
          updated_at: string
        }
        Insert: {
          configured_at?: string | null
          configured_by?: string | null
          configured_reason?: string | null
          environment_name: string
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          configured_at?: string | null
          configured_by?: string | null
          configured_reason?: string | null
          environment_name?: string
          singleton?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      DesignTeamTime: {
        Row: {
          brief_mins: number | null
          created_at: string
          design_mins: number | null
          files_mins: number | null
          id: number
          product_category: string | null
          product_subtype: string
          revision_mins: number | null
          techpack_mins: number | null
          total_hours: number | null
          updated_at: string
        }
        Insert: {
          brief_mins?: number | null
          created_at: string
          design_mins?: number | null
          files_mins?: number | null
          id?: number
          product_category?: string | null
          product_subtype: string
          revision_mins?: number | null
          techpack_mins?: number | null
          total_hours?: number | null
          updated_at: string
        }
        Update: {
          brief_mins?: number | null
          created_at?: string
          design_mins?: number | null
          files_mins?: number | null
          id?: number
          product_category?: string | null
          product_subtype?: string
          revision_mins?: number | null
          techpack_mins?: number | null
          total_hours?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      DesignTeamTimes: {
        Row: {
          brief_time: number
          design_time: number
          files_factory_time: number
          id: number
          nickname_id_fk: number
          revisions_time: number
          tech_packing_time: number
        }
        Insert: {
          brief_time: number
          design_time: number
          files_factory_time: number
          id?: number
          nickname_id_fk: number
          revisions_time: number
          tech_packing_time: number
        }
        Update: {
          brief_time?: number
          design_time?: number
          files_factory_time?: number
          id?: number
          nickname_id_fk?: number
          revisions_time?: number
          tech_packing_time?: number
        }
        Relationships: []
      }
      divisionCode: {
        Row: {
          company_name_fk: string | null
          divCode_code: string
          divCode_id: number
          division_name: string
          external_divisoncode: string | null
          is_divcode_active: boolean | null
        }
        Insert: {
          company_name_fk?: string | null
          divCode_code: string
          divCode_id?: never
          division_name: string
          external_divisoncode?: string | null
          is_divcode_active?: boolean | null
        }
        Update: {
          company_name_fk?: string | null
          divCode_code?: string
          divCode_id?: never
          division_name?: string
          external_divisoncode?: string | null
          is_divcode_active?: boolean | null
        }
        Relationships: []
      }
      erp_customer: {
        Row: {
          active: boolean
          address: Json
          ar_customer_code: string | null
          commission_perc_1: number | null
          commission_perc_2: number | null
          company_code: string | null
          currency_code: string | null
          customer_code: string
          customer_id: string | null
          customer_type_code: string | null
          dba: string | null
          erp_created_at: string | null
          erp_updated_at: string | null
          factor_code: string | null
          fax: string | null
          gl_code: string | null
          imported_at: string
          name: string
          old_customer_code: string | null
          parent_customer_code: string | null
          phone: string | null
          raw: Json
          region_code: string | null
          salesperson_code_1: string | null
          salesperson_code_2: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: Json
          ar_customer_code?: string | null
          commission_perc_1?: number | null
          commission_perc_2?: number | null
          company_code?: string | null
          currency_code?: string | null
          customer_code: string
          customer_id?: string | null
          customer_type_code?: string | null
          dba?: string | null
          erp_created_at?: string | null
          erp_updated_at?: string | null
          factor_code?: string | null
          fax?: string | null
          gl_code?: string | null
          imported_at?: string
          name: string
          old_customer_code?: string | null
          parent_customer_code?: string | null
          phone?: string | null
          raw?: Json
          region_code?: string | null
          salesperson_code_1?: string | null
          salesperson_code_2?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: Json
          ar_customer_code?: string | null
          commission_perc_1?: number | null
          commission_perc_2?: number | null
          company_code?: string | null
          currency_code?: string | null
          customer_code?: string
          customer_id?: string | null
          customer_type_code?: string | null
          dba?: string | null
          erp_created_at?: string | null
          erp_updated_at?: string | null
          factor_code?: string | null
          fax?: string | null
          gl_code?: string | null
          imported_at?: string
          name?: string
          old_customer_code?: string | null
          parent_customer_code?: string | null
          phone?: string | null
          raw?: Json
          region_code?: string | null
          salesperson_code_1?: string | null
          salesperson_code_2?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      erp_licensor: {
        Row: {
          company_code: string
          division_code: string
          erp_created_at: string | null
          erp_updated_at: string | null
          first_seen_at: string
          imported_at: string
          last_seen_at: string
          last_sync_run_id: string | null
          licensor_id: string | null
          mg_code: string
          mg_type_code: string
          mg_type_desc: string
          name: string
          raw: Json
          resolution_reason: string | null
          resolution_status: string
          resolved_at: string | null
          resolved_by: string | null
          source_hash: string
          updated_at: string
        }
        Insert: {
          company_code: string
          division_code: string
          erp_created_at?: string | null
          erp_updated_at?: string | null
          first_seen_at?: string
          imported_at?: string
          last_seen_at?: string
          last_sync_run_id?: string | null
          licensor_id?: string | null
          mg_code: string
          mg_type_code: string
          mg_type_desc: string
          name: string
          raw: Json
          resolution_reason?: string | null
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          source_hash: string
          updated_at?: string
        }
        Update: {
          company_code?: string
          division_code?: string
          erp_created_at?: string | null
          erp_updated_at?: string | null
          first_seen_at?: string
          imported_at?: string
          last_seen_at?: string
          last_sync_run_id?: string | null
          licensor_id?: string | null
          mg_code?: string
          mg_type_code?: string
          mg_type_desc?: string
          name?: string
          raw?: Json
          resolution_reason?: string | null
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          source_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plm_erp_licensor_header_semantic_fkey"
            columns: [
              "company_code",
              "division_code",
              "mg_type_code",
              "mg_type_desc",
            ]
            isOneToOne: false
            referencedRelation: "merch_group_header"
            referencedColumns: [
              "company_code",
              "division_code",
              "mg_type_code",
              "mg_type_desc",
            ]
          },
        ]
      }
      erp_property: {
        Row: {
          company_code: string
          division_code: string
          erp_created_at: string | null
          erp_updated_at: string | null
          first_seen_at: string
          imported_at: string
          last_seen_at: string
          last_sync_run_id: string | null
          mg_code: string
          mg_type_code: string
          mg_type_desc: string
          name: string
          property_id: string | null
          raw: Json
          resolution_reason: string | null
          resolution_status: string
          resolved_at: string | null
          resolved_by: string | null
          source_hash: string
          updated_at: string
        }
        Insert: {
          company_code: string
          division_code: string
          erp_created_at?: string | null
          erp_updated_at?: string | null
          first_seen_at?: string
          imported_at?: string
          last_seen_at?: string
          last_sync_run_id?: string | null
          mg_code: string
          mg_type_code: string
          mg_type_desc: string
          name: string
          property_id?: string | null
          raw: Json
          resolution_reason?: string | null
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          source_hash: string
          updated_at?: string
        }
        Update: {
          company_code?: string
          division_code?: string
          erp_created_at?: string | null
          erp_updated_at?: string | null
          first_seen_at?: string
          imported_at?: string
          last_seen_at?: string
          last_sync_run_id?: string | null
          mg_code?: string
          mg_type_code?: string
          mg_type_desc?: string
          name?: string
          property_id?: string | null
          raw?: Json
          resolution_reason?: string | null
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          source_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plm_erp_property_header_semantic_fkey"
            columns: [
              "company_code",
              "division_code",
              "mg_type_code",
              "mg_type_desc",
            ]
            isOneToOne: false
            referencedRelation: "merch_group_header"
            referencedColumns: [
              "company_code",
              "division_code",
              "mg_type_code",
              "mg_type_desc",
            ]
          },
        ]
      }
      erp_vendor: {
        Row: {
          active: boolean
          address: Json
          company_code: string | null
          country_code: string | null
          email: string | null
          erp_created_at: string | null
          erp_updated_at: string | null
          factory_id: string | null
          fax: string | null
          gl_code: string | null
          imported_at: string
          name: string
          pay_term_code: string | null
          phone: string | null
          raw: Json
          separate_check: string | null
          updated_at: string
          vendor_code: string
        }
        Insert: {
          active?: boolean
          address?: Json
          company_code?: string | null
          country_code?: string | null
          email?: string | null
          erp_created_at?: string | null
          erp_updated_at?: string | null
          factory_id?: string | null
          fax?: string | null
          gl_code?: string | null
          imported_at?: string
          name: string
          pay_term_code?: string | null
          phone?: string | null
          raw?: Json
          separate_check?: string | null
          updated_at?: string
          vendor_code: string
        }
        Update: {
          active?: boolean
          address?: Json
          company_code?: string | null
          country_code?: string | null
          email?: string | null
          erp_created_at?: string | null
          erp_updated_at?: string | null
          factory_id?: string | null
          fax?: string | null
          gl_code?: string | null
          imported_at?: string
          name?: string
          pay_term_code?: string | null
          phone?: string | null
          raw?: Json
          separate_check?: string | null
          updated_at?: string
          vendor_code?: string
        }
        Relationships: []
      }
      externalApi: {
        Row: {
          externalApi_company_id: string
          externalApi_hostname: string
          externalApi_id: number
          externalApi_method: string
          externalApi_path: string | null
          externalApi_port: number | null
        }
        Insert: {
          externalApi_company_id: string
          externalApi_hostname: string
          externalApi_id?: never
          externalApi_method: string
          externalApi_path?: string | null
          externalApi_port?: number | null
        }
        Update: {
          externalApi_company_id?: string
          externalApi_hostname?: string
          externalApi_id?: never
          externalApi_method?: string
          externalApi_path?: string | null
          externalApi_port?: number | null
        }
        Relationships: []
      }
      FactoryTime: {
        Row: {
          created_at: string
          id: number
          mass_production_days: number | null
          product_category: string | null
          product_subtype: string
          resampling_days: number | null
          sampling_days: number | null
          updated_at: string
        }
        Insert: {
          created_at: string
          id?: number
          mass_production_days?: number | null
          product_category?: string | null
          product_subtype: string
          resampling_days?: number | null
          sampling_days?: number | null
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: number
          mass_production_days?: number | null
          product_category?: string | null
          product_subtype?: string
          resampling_days?: number | null
          sampling_days?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      FactoryTimes: {
        Row: {
          id: number
          mass_production_time: number | null
          nickname_id_fk: number | null
          resampling_time: number | null
          sampling_time: number | null
        }
        Insert: {
          id?: never
          mass_production_time?: number | null
          nickname_id_fk?: number | null
          resampling_time?: number | null
          sampling_time?: number | null
        }
        Update: {
          id?: never
          mass_production_time?: number | null
          nickname_id_fk?: number | null
          resampling_time?: number | null
          sampling_time?: number | null
        }
        Relationships: []
      }
      FOBCountry: {
        Row: {
          FOBCountry_id: number
          FOBCountry_status: string | null
          FOBCountry_title: string | null
        }
        Insert: {
          FOBCountry_id?: number
          FOBCountry_status?: string | null
          FOBCountry_title?: string | null
        }
        Update: {
          FOBCountry_id?: number
          FOBCountry_status?: string | null
          FOBCountry_title?: string | null
        }
        Relationships: []
      }
      grid_cell_notes: {
        Row: {
          col_id: string
          created_at: string
          grid_type: string
          id: string
          note_author: string | null
          note_read_only: boolean
          note_text: string | null
          row_id: string
          updated_at: string
        }
        Insert: {
          col_id: string
          created_at: string
          grid_type: string
          id: string
          note_author?: string | null
          note_read_only?: boolean
          note_text?: string | null
          row_id: string
          updated_at: string
        }
        Update: {
          col_id?: string
          created_at?: string
          grid_type?: string
          id?: string
          note_author?: string | null
          note_read_only?: boolean
          note_text?: string | null
          row_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      GridAccessLevel: {
        Row: {
          access: boolean | null
          col_access_level: string | null
          col_id: string | null
          grid_id: string | null
          id: number
        }
        Insert: {
          access?: boolean | null
          col_access_level?: string | null
          col_id?: string | null
          grid_id?: string | null
          id?: never
        }
        Update: {
          access?: boolean | null
          col_access_level?: string | null
          col_id?: string | null
          grid_id?: string | null
          id?: never
        }
        Relationships: []
      }
      GridChildrenLayout: {
        Row: {
          cellRenderer: string | null
          checkboxSelection: string | null
          col_order: number | null
          col_pinned: string | null
          columnGroupShow: string | null
          factory_id_fk: number | null
          field: string
          filter: string | null
          grid_id: string | null
          GridLayout_id_fk: number | null
          headerName: string | null
          hide: string | null
          id: number
          layout_name: string | null
          rowDrag: string | null
          rowGroup: string | null
          std_prod_id_fk: number | null
          user_id_fk: number | null
          width: number | null
        }
        Insert: {
          cellRenderer?: string | null
          checkboxSelection?: string | null
          col_order?: number | null
          col_pinned?: string | null
          columnGroupShow?: string | null
          factory_id_fk?: number | null
          field: string
          filter?: string | null
          grid_id?: string | null
          GridLayout_id_fk?: number | null
          headerName?: string | null
          hide?: string | null
          id?: never
          layout_name?: string | null
          rowDrag?: string | null
          rowGroup?: string | null
          std_prod_id_fk?: number | null
          user_id_fk?: number | null
          width?: number | null
        }
        Update: {
          cellRenderer?: string | null
          checkboxSelection?: string | null
          col_order?: number | null
          col_pinned?: string | null
          columnGroupShow?: string | null
          factory_id_fk?: number | null
          field?: string
          filter?: string | null
          grid_id?: string | null
          GridLayout_id_fk?: number | null
          headerName?: string | null
          hide?: string | null
          id?: never
          layout_name?: string | null
          rowDrag?: string | null
          rowGroup?: string | null
          std_prod_id_fk?: number | null
          user_id_fk?: number | null
          width?: number | null
        }
        Relationships: []
      }
      GridChildrenLayoutOrder: {
        Row: {
          cellRenderer: string | null
          checkboxSelection: string | null
          col_order: number | null
          col_pinned: string | null
          columnGroupShow: string | null
          factory_id_fk: number | null
          field: string | null
          filter: string | null
          grid_id: string | null
          GridLayout_id_fk: string | null
          headerName: string | null
          hide: string | null
          id: number
          layout_name: string | null
          rowDrag: string | null
          rowGroup: string | null
          std_prod_id_fk: number | null
          user_id_fk: number | null
          width: number | null
        }
        Insert: {
          cellRenderer?: string | null
          checkboxSelection?: string | null
          col_order?: number | null
          col_pinned?: string | null
          columnGroupShow?: string | null
          factory_id_fk?: number | null
          field?: string | null
          filter?: string | null
          grid_id?: string | null
          GridLayout_id_fk?: string | null
          headerName?: string | null
          hide?: string | null
          id?: never
          layout_name?: string | null
          rowDrag?: string | null
          rowGroup?: string | null
          std_prod_id_fk?: number | null
          user_id_fk?: number | null
          width?: number | null
        }
        Update: {
          cellRenderer?: string | null
          checkboxSelection?: string | null
          col_order?: number | null
          col_pinned?: string | null
          columnGroupShow?: string | null
          factory_id_fk?: number | null
          field?: string | null
          filter?: string | null
          grid_id?: string | null
          GridLayout_id_fk?: string | null
          headerName?: string | null
          hide?: string | null
          id?: never
          layout_name?: string | null
          rowDrag?: string | null
          rowGroup?: string | null
          std_prod_id_fk?: number | null
          user_id_fk?: number | null
          width?: number | null
        }
        Relationships: []
      }
      GridLayout: {
        Row: {
          cellEditor: string | null
          cellRenderer: string | null
          checkboxSelection: string | null
          col_id: string | null
          col_order: number | null
          col_pinned: string | null
          companyCode_name: string | null
          divisionCode_name: string | null
          editable: boolean | null
          field: string | null
          filter: string | null
          grid_id: string | null
          headerName: string | null
          hide: string | null
          id: number
          layout_name: string | null
          rowDrag: string | null
          rowGroup: string | null
          std_prod_id_fk: number | null
          user_id_fk: number | null
          width: number | null
        }
        Insert: {
          cellEditor?: string | null
          cellRenderer?: string | null
          checkboxSelection?: string | null
          col_id?: string | null
          col_order?: number | null
          col_pinned?: string | null
          companyCode_name?: string | null
          divisionCode_name?: string | null
          editable?: boolean | null
          field?: string | null
          filter?: string | null
          grid_id?: string | null
          headerName?: string | null
          hide?: string | null
          id?: never
          layout_name?: string | null
          rowDrag?: string | null
          rowGroup?: string | null
          std_prod_id_fk?: number | null
          user_id_fk?: number | null
          width?: number | null
        }
        Update: {
          cellEditor?: string | null
          cellRenderer?: string | null
          checkboxSelection?: string | null
          col_id?: string | null
          col_order?: number | null
          col_pinned?: string | null
          companyCode_name?: string | null
          divisionCode_name?: string | null
          editable?: boolean | null
          field?: string | null
          filter?: string | null
          grid_id?: string | null
          headerName?: string | null
          hide?: string | null
          id?: never
          layout_name?: string | null
          rowDrag?: string | null
          rowGroup?: string | null
          std_prod_id_fk?: number | null
          user_id_fk?: number | null
          width?: number | null
        }
        Relationships: []
      }
      GridViewState: {
        Row: {
          column_state: Json | null
          created_at: string | null
          filter_model: Json | null
          grid_id: string
          id: number
          is_default: boolean
          updated_at: string | null
          user_id_fk: number | null
          view_name: string
        }
        Insert: {
          column_state?: Json | null
          created_at?: string | null
          filter_model?: Json | null
          grid_id: string
          id?: number
          is_default?: boolean
          updated_at?: string | null
          user_id_fk?: number | null
          view_name: string
        }
        Update: {
          column_state?: Json | null
          created_at?: string | null
          filter_model?: Json | null
          grid_id?: string
          id?: number
          is_default?: boolean
          updated_at?: string | null
          user_id_fk?: number | null
          view_name?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          created_at: string | null
          id: number
          member_user_ids: Json
          name: string
          teams_app_installed_at: string | null
          teams_chat_id: string | null
          teams_conversation_id: string | null
          teams_conversation_reference: Json | null
          teams_members_hash: string | null
          teams_service_url: string | null
          teams_sync_error: string | null
          teams_sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          member_user_ids?: Json
          name: string
          teams_app_installed_at?: string | null
          teams_chat_id?: string | null
          teams_conversation_id?: string | null
          teams_conversation_reference?: Json | null
          teams_members_hash?: string | null
          teams_service_url?: string | null
          teams_sync_error?: string | null
          teams_sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          member_user_ids?: Json
          name?: string
          teams_app_installed_at?: string | null
          teams_chat_id?: string | null
          teams_conversation_id?: string | null
          teams_conversation_reference?: Json | null
          teams_members_hash?: string | null
          teams_service_url?: string | null
          teams_sync_error?: string | null
          teams_sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      item: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          item_number: string | null
          licensor_id: string | null
          merch_group_id: string | null
          name: string | null
          product_depth_id: string | null
          product_size_id: string | null
          product_type_id: string | null
          property_id: string | null
          raw: Json
          source_id: string | null
          source_system: string | null
          status: string | null
          style_number: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          item_number?: string | null
          licensor_id?: string | null
          merch_group_id?: string | null
          name?: string | null
          product_depth_id?: string | null
          product_size_id?: string | null
          product_type_id?: string | null
          property_id?: string | null
          raw?: Json
          source_id?: string | null
          source_system?: string | null
          status?: string | null
          style_number?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          item_number?: string | null
          licensor_id?: string | null
          merch_group_id?: string | null
          name?: string | null
          product_depth_id?: string | null
          product_size_id?: string | null
          product_type_id?: string | null
          property_id?: string | null
          raw?: Json
          source_id?: string | null
          source_system?: string | null
          status?: string | null
          style_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      item_attachment: {
        Row: {
          attachment_type: string | null
          created_at: string
          file_object_id: string | null
          id: string
          item_id: string
          metadata: Json
          source_id: string | null
          source_system: string | null
          url: string | null
        }
        Insert: {
          attachment_type?: string | null
          created_at?: string
          file_object_id?: string | null
          id?: string
          item_id: string
          metadata?: Json
          source_id?: string | null
          source_system?: string | null
          url?: string | null
        }
        Update: {
          attachment_type?: string | null
          created_at?: string
          file_object_id?: string | null
          id?: string
          item_id?: string
          metadata?: Json
          source_id?: string | null
          source_system?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_attachment_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item"
            referencedColumns: ["id"]
          },
        ]
      }
      item_character_associations: {
        Row: {
          character_id: number
          created_at: string
          id: number
          item_header_id: number
          updated_at: string
        }
        Insert: {
          character_id: number
          created_at?: string
          id?: number
          item_header_id: number
          updated_at?: string
        }
        Update: {
          character_id?: number
          created_at?: string
          id?: number
          item_header_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_character_associations_item_header_id_fkey"
            columns: ["item_header_id"]
            isOneToOne: true
            referencedRelation: "itemHeader"
            referencedColumns: ["item_id_pk"]
          },
        ]
      }
      item_detail: {
        Row: {
          created_at: string
          detail_type: string
          id: string
          item_id: string
          source_id: string | null
          source_system: string | null
          value_json: Json
          value_number: number | null
          value_text: string | null
        }
        Insert: {
          created_at?: string
          detail_type: string
          id?: string
          item_id: string
          source_id?: string | null
          source_system?: string | null
          value_json?: Json
          value_number?: number | null
          value_text?: string | null
        }
        Update: {
          created_at?: string
          detail_type?: string
          id?: string
          item_id?: string
          source_id?: string | null
          source_system?: string | null
          value_json?: Json
          value_number?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_detail_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item"
            referencedColumns: ["id"]
          },
        ]
      }
      item_import: {
        Row: {
          company_code: string
          division_code: string
          imported_at: string
          item_description: string | null
          item_id: string | null
          item_no: string
          merch_group_01: string | null
          merch_group_02: string | null
          merch_group_03: string | null
          merch_group_04: string | null
          merch_group_05: string | null
          merch_group_06: string | null
          merch_groups: Json
          raw: Json
          resolution_outcome: string
          status: string | null
          style_number: string | null
          updated_at: string
        }
        Insert: {
          company_code: string
          division_code: string
          imported_at?: string
          item_description?: string | null
          item_id?: string | null
          item_no: string
          merch_group_01?: string | null
          merch_group_02?: string | null
          merch_group_03?: string | null
          merch_group_04?: string | null
          merch_group_05?: string | null
          merch_group_06?: string | null
          merch_groups?: Json
          raw: Json
          resolution_outcome?: string
          status?: string | null
          style_number?: string | null
          updated_at?: string
        }
        Update: {
          company_code?: string
          division_code?: string
          imported_at?: string
          item_description?: string | null
          item_id?: string | null
          item_no?: string
          merch_group_01?: string | null
          merch_group_02?: string | null
          merch_group_03?: string | null
          merch_group_04?: string | null
          merch_group_05?: string | null
          merch_group_06?: string | null
          merch_groups?: Json
          raw?: Json
          resolution_outcome?: string
          status?: string | null
          style_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_import_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item"
            referencedColumns: ["id"]
          },
        ]
      }
      item_import_staging: {
        Row: {
          company_code: string
          division_code: string
          item_description: string | null
          item_no: string
          merch_group_01: string | null
          merch_group_02: string | null
          merch_group_03: string | null
          merch_group_04: string | null
          merch_group_05: string | null
          merch_group_06: string | null
          merch_groups: Json
          raw: Json
          staged_at: string
          status: string | null
          style_number: string | null
          sweep_id: string
        }
        Insert: {
          company_code: string
          division_code: string
          item_description?: string | null
          item_no: string
          merch_group_01?: string | null
          merch_group_02?: string | null
          merch_group_03?: string | null
          merch_group_04?: string | null
          merch_group_05?: string | null
          merch_group_06?: string | null
          merch_groups?: Json
          raw: Json
          staged_at?: string
          status?: string | null
          style_number?: string | null
          sweep_id: string
        }
        Update: {
          company_code?: string
          division_code?: string
          item_description?: string | null
          item_no?: string
          merch_group_01?: string | null
          merch_group_02?: string | null
          merch_group_03?: string | null
          merch_group_04?: string | null
          merch_group_05?: string | null
          merch_group_06?: string | null
          merch_groups?: Json
          raw?: Json
          staged_at?: string
          status?: string | null
          style_number?: string | null
          sweep_id?: string
        }
        Relationships: []
      }
      item_import_unresolved: {
        Row: {
          candidate_count: number
          company_code: string
          division_code: string
          first_seen_at: string
          item_no: string
          last_seen_at: string
          outcome: string
          reason: string
          slot_code: string
          slot_meaning: string | null
          source_code: string | null
          sync_run_id: string | null
          tiebreak: string
        }
        Insert: {
          candidate_count?: number
          company_code: string
          division_code: string
          first_seen_at?: string
          item_no: string
          last_seen_at?: string
          outcome: string
          reason: string
          slot_code: string
          slot_meaning?: string | null
          source_code?: string | null
          sync_run_id?: string | null
          tiebreak?: string
        }
        Update: {
          candidate_count?: number
          company_code?: string
          division_code?: string
          first_seen_at?: string
          item_no?: string
          last_seen_at?: string
          outcome?: string
          reason?: string
          slot_code?: string
          slot_meaning?: string | null
          source_code?: string | null
          sync_run_id?: string | null
          tiebreak?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_import_unresolved_company_code_division_code_item_no_fkey"
            columns: ["company_code", "division_code", "item_no"]
            isOneToOne: false
            referencedRelation: "item_import"
            referencedColumns: ["company_code", "division_code", "item_no"]
          },
        ]
      }
      item_prod_order_detail_associations: {
        Row: {
          created_at: string
          id: number
          item_header_id: number
          master_quantity: number | null
          match_source: string
          matched_item_number: string
          prod_order_detail_pkey: number
          updated_at: string
        }
        Insert: {
          created_at: string
          id?: number
          item_header_id: number
          master_quantity?: number | null
          match_source?: string
          matched_item_number: string
          prod_order_detail_pkey: number
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: number
          item_header_id?: number
          master_quantity?: number | null
          match_source?: string
          matched_item_number?: string
          prod_order_detail_pkey?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_prod_order_detail_associations_item_header_id_fkey"
            columns: ["item_header_id"]
            isOneToOne: false
            referencedRelation: "itemHeader"
            referencedColumns: ["item_id_pk"]
          },
          {
            foreignKeyName: "item_prod_order_detail_associations_prod_order_detail_pkey_fkey"
            columns: ["prod_order_detail_pkey"]
            isOneToOne: false
            referencedRelation: "ProdOrderDetail"
            referencedColumns: ["pkey"]
          },
        ]
      }
      item_taxonomy_disagreement: {
        Row: {
          company_code: string
          division_code: string
          first_seen_at: string
          item_no: string
          last_seen_at: string
          licensor_slot_code: string | null
          property_id: string
          property_licensor_id: string | null
          property_slot_code: string | null
          reason: string
          slot_licensor_id: string | null
          status: string
          sync_run_id: string | null
        }
        Insert: {
          company_code: string
          division_code: string
          first_seen_at?: string
          item_no: string
          last_seen_at?: string
          licensor_slot_code?: string | null
          property_id: string
          property_licensor_id?: string | null
          property_slot_code?: string | null
          reason: string
          slot_licensor_id?: string | null
          status?: string
          sync_run_id?: string | null
        }
        Update: {
          company_code?: string
          division_code?: string
          first_seen_at?: string
          item_no?: string
          last_seen_at?: string
          licensor_slot_code?: string | null
          property_id?: string
          property_licensor_id?: string | null
          property_slot_code?: string | null
          reason?: string
          slot_licensor_id?: string | null
          status?: string
          sync_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_taxonomy_disagreement_company_code_division_code_item_fkey"
            columns: ["company_code", "division_code", "item_no"]
            isOneToOne: true
            referencedRelation: "item_import"
            referencedColumns: ["company_code", "division_code", "item_no"]
          },
        ]
      }
      itemAttachment: {
        Row: {
          attachment_display_name: string
          attachment_link: string
          attachment_type: string
          comment_id: number | null
          companyCode_name: string | null
          divisionCode_name: string | null
          dsn_ref_num: string | null
          item_attachment_colorCode: string | null
          item_attachment_createdTime: string | null
          item_attachment_createdUser: string | null
          item_attachment_fileName: string | null
          item_attachment_id: number
          item_attachment_modTime: string | null
          item_attachment_modUser: string | null
          item_attachment_resourceId: number | null
          item_num_id_fk: number
          license_status: string | null
          licensing_attachment: boolean | null
          licensing_feedback_id_fk: number | null
          primary_image: boolean | null
          uuid: string | null
        }
        Insert: {
          attachment_display_name: string
          attachment_link: string
          attachment_type: string
          comment_id?: number | null
          companyCode_name?: string | null
          divisionCode_name?: string | null
          dsn_ref_num?: string | null
          item_attachment_colorCode?: string | null
          item_attachment_createdTime?: string | null
          item_attachment_createdUser?: string | null
          item_attachment_fileName?: string | null
          item_attachment_id?: never
          item_attachment_modTime?: string | null
          item_attachment_modUser?: string | null
          item_attachment_resourceId?: number | null
          item_num_id_fk: number
          license_status?: string | null
          licensing_attachment?: boolean | null
          licensing_feedback_id_fk?: number | null
          primary_image?: boolean | null
          uuid?: string | null
        }
        Update: {
          attachment_display_name?: string
          attachment_link?: string
          attachment_type?: string
          comment_id?: number | null
          companyCode_name?: string | null
          divisionCode_name?: string | null
          dsn_ref_num?: string | null
          item_attachment_colorCode?: string | null
          item_attachment_createdTime?: string | null
          item_attachment_createdUser?: string | null
          item_attachment_fileName?: string | null
          item_attachment_id?: never
          item_attachment_modTime?: string | null
          item_attachment_modUser?: string | null
          item_attachment_resourceId?: number | null
          item_num_id_fk?: number
          license_status?: string | null
          licensing_attachment?: boolean | null
          licensing_feedback_id_fk?: number | null
          primary_image?: boolean | null
          uuid?: string | null
        }
        Relationships: []
      }
      itemDepth: {
        Row: {
          itemDepth_airbyte_depths_hashid: string | null
          itemDepth_airbyte_emitted_at: string | null
          itemDepth_auditlog: string | null
          itemDepth_code: string | null
          itemDepth_id: number
          itemDepth_status: string | null
          itemDepth_title: string | null
        }
        Insert: {
          itemDepth_airbyte_depths_hashid?: string | null
          itemDepth_airbyte_emitted_at?: string | null
          itemDepth_auditlog?: string | null
          itemDepth_code?: string | null
          itemDepth_id?: never
          itemDepth_status?: string | null
          itemDepth_title?: string | null
        }
        Update: {
          itemDepth_airbyte_depths_hashid?: string | null
          itemDepth_airbyte_emitted_at?: string | null
          itemDepth_auditlog?: string | null
          itemDepth_code?: string | null
          itemDepth_id?: never
          itemDepth_status?: string | null
          itemDepth_title?: string | null
        }
        Relationships: []
      }
      itemDetail: {
        Row: {
          base_qty_hed: number | null
          carton_code_ext: string | null
          carton_depth_size_hed: number | null
          carton_length_size_hed: number | null
          carton_packtype_fk: string | null
          carton_qty: number | null
          carton_weight_size_hed: number | null
          carton_width_size_hed: number | null
          color_code_fk: string | null
          compare_price_hed: number | null
          created_timedate: string | null
          created_user_fk: string | null
          dim_code_fk: string | null
          discont_status: string | null
          ds_cat: string | null
          EAN: string | null
          GenerateUPC: string | null
          GTIN: string | null
          hts_num_hed_ext_fk: string | null
          innerpk_qty_hed: number | null
          item_active_status: string | null
          item_avail_status: string | null
          item_cbm_size: number | null
          item_content_hed: string | null
          item_cost_hed_ext: number | null
          item_depth_size_hed: number | null
          item_length_size_hed: number | null
          item_pk: number
          item_status_hed: string | null
          item_weight_size_hed: number | null
          item_width_size_hed: number | null
          label_code_fk: string | null
          mod_timedate: string | null
          mod_user_fk: string | null
          NMFC_code_hed: string | null
          non_inv_item: string | null
          pack_type_hed: string | null
          prepack_code_fk: string | null
          reserved_qty: number | null
          retail_pric_hed: number | null
          royalty_code_fk: string | null
          salesperson_fk: string | null
          season_code_hed: string | null
          selling_price_hed: number | null
          share_UPC: string | null
          size_allowed_hed: string | null
          size_code_fk: string | null
          size_explo_code_hed_ext: string | null
          size_seq: number | null
          udf_date01: string | null
          udf_date02: string | null
          udf_date03: string | null
          udf_date04: string | null
          udf_date05: string | null
          udf_date06: string | null
          udf_date07: string | null
          udf_date08: string | null
          udf_date09: string | null
          udf_date10: string | null
          udf_date11: string | null
          udf_date12: string | null
          udf_date13: string | null
          udf_date14: string | null
          udf_date15: string | null
          udf_date16: string | null
          udf_date17: string | null
          udf_date18: string | null
          udf_date19: string | null
          udf_date20: string | null
          udf_freeform_01: string | null
          udf_freeform_02: string | null
          udf_freeform_03: string | null
          udf_freeform_04: string | null
          udf_freeform_05: string | null
          udf_freeform_06: string | null
          udf_freeform_07: string | null
          udf_freeform_08: string | null
          udf_freeform_09: string | null
          udf_freeform_10: string | null
          udf_freeform_11: string | null
          udf_freeform_12: string | null
          udf_freeform_13: string | null
          udf_freeform_14: string | null
          udf_freeform_15: string | null
          udf_freeform_16: string | null
          udf_freeform_17: string | null
          udf_freeform_18: string | null
          udf_freeform_19: string | null
          udf_freeform_20: string | null
          udf_int01: number | null
          udf_int02: number | null
          udf_int03: number | null
          udf_int04: number | null
          udf_int05: number | null
          udf_int06: number | null
          udf_int07: number | null
          udf_int08: number | null
          udf_int09: number | null
          udf_int10: number | null
          udf_item_priceA: number | null
          udf_item_priceB: number | null
          udf_item_priceC: number | null
          udf_item_priceD: number | null
          udf_item_priceE: number | null
          udf_item_priceF: number | null
          udf_item_priceG: number | null
          udf_item_priceH: number | null
          udf_merchgroup01: string | null
          udf_merchgroup02: string | null
          udf_merchgroup03: string | null
          udf_merchgroup04: string | null
          udf_merchgroup05: string | null
          udf_merchgroup06: string | null
          udf_merchgroup07: string | null
          udf_merchgroup08: string | null
          udf_merchgroup09: string | null
          udf_merchgroup10: string | null
          udf_merchgroup11: string | null
          udf_merchgroup12: string | null
          udf_merchgroup13: string | null
          udf_merchgroup14: string | null
          udf_merchgroup15: string | null
          udf_merchgroup16: string | null
          udf_merchgroup17: string | null
          udf_merchgroup18: string | null
          udf_merchgroup19: string | null
          udf_merchgroup20: string | null
          udf_merchgroup21: string | null
          udf_merchgroup22: string | null
          udf_merchgroup23: string | null
          udf_merchgroup24: string | null
          udf_merchgroup25: string | null
          udf_num01: number | null
          udf_num02: number | null
          udf_num03: number | null
          udf_num04: number | null
          udf_num05: number | null
          udf_num06: number | null
          udf_num07: number | null
          udf_num08: number | null
          udf_num09: number | null
          udf_num10: number | null
          udf_yesno01: string | null
          udf_yesno02: string | null
          udf_yesno03: string | null
          udf_yesno04: string | null
          udf_yesno05: string | null
          udf_yesno06: string | null
          udf_yesno07: string | null
          udf_yesno08: string | null
          udf_yesno09: string | null
          udf_yesno10: string | null
          udf_yesno11: string | null
          udf_yesno12: string | null
          udf_yesno13: string | null
          udf_yesno14: string | null
          udf_yesno15: string | null
          uom_code_hed_fk: string | null
          uom_size_fk_hed: string | null
          uom_weight_fk_hed: string | null
          UPC: string | null
          upc_created_timedate: string | null
          vendor_code_hed_fk: string | null
          whse_sku_id: string | null
        }
        Insert: {
          base_qty_hed?: number | null
          carton_code_ext?: string | null
          carton_depth_size_hed?: number | null
          carton_length_size_hed?: number | null
          carton_packtype_fk?: string | null
          carton_qty?: number | null
          carton_weight_size_hed?: number | null
          carton_width_size_hed?: number | null
          color_code_fk?: string | null
          compare_price_hed?: number | null
          created_timedate?: string | null
          created_user_fk?: string | null
          dim_code_fk?: string | null
          discont_status?: string | null
          ds_cat?: string | null
          EAN?: string | null
          GenerateUPC?: string | null
          GTIN?: string | null
          hts_num_hed_ext_fk?: string | null
          innerpk_qty_hed?: number | null
          item_active_status?: string | null
          item_avail_status?: string | null
          item_cbm_size?: number | null
          item_content_hed?: string | null
          item_cost_hed_ext?: number | null
          item_depth_size_hed?: number | null
          item_length_size_hed?: number | null
          item_pk?: never
          item_status_hed?: string | null
          item_weight_size_hed?: number | null
          item_width_size_hed?: number | null
          label_code_fk?: string | null
          mod_timedate?: string | null
          mod_user_fk?: string | null
          NMFC_code_hed?: string | null
          non_inv_item?: string | null
          pack_type_hed?: string | null
          prepack_code_fk?: string | null
          reserved_qty?: number | null
          retail_pric_hed?: number | null
          royalty_code_fk?: string | null
          salesperson_fk?: string | null
          season_code_hed?: string | null
          selling_price_hed?: number | null
          share_UPC?: string | null
          size_allowed_hed?: string | null
          size_code_fk?: string | null
          size_explo_code_hed_ext?: string | null
          size_seq?: number | null
          udf_date01?: string | null
          udf_date02?: string | null
          udf_date03?: string | null
          udf_date04?: string | null
          udf_date05?: string | null
          udf_date06?: string | null
          udf_date07?: string | null
          udf_date08?: string | null
          udf_date09?: string | null
          udf_date10?: string | null
          udf_date11?: string | null
          udf_date12?: string | null
          udf_date13?: string | null
          udf_date14?: string | null
          udf_date15?: string | null
          udf_date16?: string | null
          udf_date17?: string | null
          udf_date18?: string | null
          udf_date19?: string | null
          udf_date20?: string | null
          udf_freeform_01?: string | null
          udf_freeform_02?: string | null
          udf_freeform_03?: string | null
          udf_freeform_04?: string | null
          udf_freeform_05?: string | null
          udf_freeform_06?: string | null
          udf_freeform_07?: string | null
          udf_freeform_08?: string | null
          udf_freeform_09?: string | null
          udf_freeform_10?: string | null
          udf_freeform_11?: string | null
          udf_freeform_12?: string | null
          udf_freeform_13?: string | null
          udf_freeform_14?: string | null
          udf_freeform_15?: string | null
          udf_freeform_16?: string | null
          udf_freeform_17?: string | null
          udf_freeform_18?: string | null
          udf_freeform_19?: string | null
          udf_freeform_20?: string | null
          udf_int01?: number | null
          udf_int02?: number | null
          udf_int03?: number | null
          udf_int04?: number | null
          udf_int05?: number | null
          udf_int06?: number | null
          udf_int07?: number | null
          udf_int08?: number | null
          udf_int09?: number | null
          udf_int10?: number | null
          udf_item_priceA?: number | null
          udf_item_priceB?: number | null
          udf_item_priceC?: number | null
          udf_item_priceD?: number | null
          udf_item_priceE?: number | null
          udf_item_priceF?: number | null
          udf_item_priceG?: number | null
          udf_item_priceH?: number | null
          udf_merchgroup01?: string | null
          udf_merchgroup02?: string | null
          udf_merchgroup03?: string | null
          udf_merchgroup04?: string | null
          udf_merchgroup05?: string | null
          udf_merchgroup06?: string | null
          udf_merchgroup07?: string | null
          udf_merchgroup08?: string | null
          udf_merchgroup09?: string | null
          udf_merchgroup10?: string | null
          udf_merchgroup11?: string | null
          udf_merchgroup12?: string | null
          udf_merchgroup13?: string | null
          udf_merchgroup14?: string | null
          udf_merchgroup15?: string | null
          udf_merchgroup16?: string | null
          udf_merchgroup17?: string | null
          udf_merchgroup18?: string | null
          udf_merchgroup19?: string | null
          udf_merchgroup20?: string | null
          udf_merchgroup21?: string | null
          udf_merchgroup22?: string | null
          udf_merchgroup23?: string | null
          udf_merchgroup24?: string | null
          udf_merchgroup25?: string | null
          udf_num01?: number | null
          udf_num02?: number | null
          udf_num03?: number | null
          udf_num04?: number | null
          udf_num05?: number | null
          udf_num06?: number | null
          udf_num07?: number | null
          udf_num08?: number | null
          udf_num09?: number | null
          udf_num10?: number | null
          udf_yesno01?: string | null
          udf_yesno02?: string | null
          udf_yesno03?: string | null
          udf_yesno04?: string | null
          udf_yesno05?: string | null
          udf_yesno06?: string | null
          udf_yesno07?: string | null
          udf_yesno08?: string | null
          udf_yesno09?: string | null
          udf_yesno10?: string | null
          udf_yesno11?: string | null
          udf_yesno12?: string | null
          udf_yesno13?: string | null
          udf_yesno14?: string | null
          udf_yesno15?: string | null
          uom_code_hed_fk?: string | null
          uom_size_fk_hed?: string | null
          uom_weight_fk_hed?: string | null
          UPC?: string | null
          upc_created_timedate?: string | null
          vendor_code_hed_fk?: string | null
          whse_sku_id?: string | null
        }
        Update: {
          base_qty_hed?: number | null
          carton_code_ext?: string | null
          carton_depth_size_hed?: number | null
          carton_length_size_hed?: number | null
          carton_packtype_fk?: string | null
          carton_qty?: number | null
          carton_weight_size_hed?: number | null
          carton_width_size_hed?: number | null
          color_code_fk?: string | null
          compare_price_hed?: number | null
          created_timedate?: string | null
          created_user_fk?: string | null
          dim_code_fk?: string | null
          discont_status?: string | null
          ds_cat?: string | null
          EAN?: string | null
          GenerateUPC?: string | null
          GTIN?: string | null
          hts_num_hed_ext_fk?: string | null
          innerpk_qty_hed?: number | null
          item_active_status?: string | null
          item_avail_status?: string | null
          item_cbm_size?: number | null
          item_content_hed?: string | null
          item_cost_hed_ext?: number | null
          item_depth_size_hed?: number | null
          item_length_size_hed?: number | null
          item_pk?: never
          item_status_hed?: string | null
          item_weight_size_hed?: number | null
          item_width_size_hed?: number | null
          label_code_fk?: string | null
          mod_timedate?: string | null
          mod_user_fk?: string | null
          NMFC_code_hed?: string | null
          non_inv_item?: string | null
          pack_type_hed?: string | null
          prepack_code_fk?: string | null
          reserved_qty?: number | null
          retail_pric_hed?: number | null
          royalty_code_fk?: string | null
          salesperson_fk?: string | null
          season_code_hed?: string | null
          selling_price_hed?: number | null
          share_UPC?: string | null
          size_allowed_hed?: string | null
          size_code_fk?: string | null
          size_explo_code_hed_ext?: string | null
          size_seq?: number | null
          udf_date01?: string | null
          udf_date02?: string | null
          udf_date03?: string | null
          udf_date04?: string | null
          udf_date05?: string | null
          udf_date06?: string | null
          udf_date07?: string | null
          udf_date08?: string | null
          udf_date09?: string | null
          udf_date10?: string | null
          udf_date11?: string | null
          udf_date12?: string | null
          udf_date13?: string | null
          udf_date14?: string | null
          udf_date15?: string | null
          udf_date16?: string | null
          udf_date17?: string | null
          udf_date18?: string | null
          udf_date19?: string | null
          udf_date20?: string | null
          udf_freeform_01?: string | null
          udf_freeform_02?: string | null
          udf_freeform_03?: string | null
          udf_freeform_04?: string | null
          udf_freeform_05?: string | null
          udf_freeform_06?: string | null
          udf_freeform_07?: string | null
          udf_freeform_08?: string | null
          udf_freeform_09?: string | null
          udf_freeform_10?: string | null
          udf_freeform_11?: string | null
          udf_freeform_12?: string | null
          udf_freeform_13?: string | null
          udf_freeform_14?: string | null
          udf_freeform_15?: string | null
          udf_freeform_16?: string | null
          udf_freeform_17?: string | null
          udf_freeform_18?: string | null
          udf_freeform_19?: string | null
          udf_freeform_20?: string | null
          udf_int01?: number | null
          udf_int02?: number | null
          udf_int03?: number | null
          udf_int04?: number | null
          udf_int05?: number | null
          udf_int06?: number | null
          udf_int07?: number | null
          udf_int08?: number | null
          udf_int09?: number | null
          udf_int10?: number | null
          udf_item_priceA?: number | null
          udf_item_priceB?: number | null
          udf_item_priceC?: number | null
          udf_item_priceD?: number | null
          udf_item_priceE?: number | null
          udf_item_priceF?: number | null
          udf_item_priceG?: number | null
          udf_item_priceH?: number | null
          udf_merchgroup01?: string | null
          udf_merchgroup02?: string | null
          udf_merchgroup03?: string | null
          udf_merchgroup04?: string | null
          udf_merchgroup05?: string | null
          udf_merchgroup06?: string | null
          udf_merchgroup07?: string | null
          udf_merchgroup08?: string | null
          udf_merchgroup09?: string | null
          udf_merchgroup10?: string | null
          udf_merchgroup11?: string | null
          udf_merchgroup12?: string | null
          udf_merchgroup13?: string | null
          udf_merchgroup14?: string | null
          udf_merchgroup15?: string | null
          udf_merchgroup16?: string | null
          udf_merchgroup17?: string | null
          udf_merchgroup18?: string | null
          udf_merchgroup19?: string | null
          udf_merchgroup20?: string | null
          udf_merchgroup21?: string | null
          udf_merchgroup22?: string | null
          udf_merchgroup23?: string | null
          udf_merchgroup24?: string | null
          udf_merchgroup25?: string | null
          udf_num01?: number | null
          udf_num02?: number | null
          udf_num03?: number | null
          udf_num04?: number | null
          udf_num05?: number | null
          udf_num06?: number | null
          udf_num07?: number | null
          udf_num08?: number | null
          udf_num09?: number | null
          udf_num10?: number | null
          udf_yesno01?: string | null
          udf_yesno02?: string | null
          udf_yesno03?: string | null
          udf_yesno04?: string | null
          udf_yesno05?: string | null
          udf_yesno06?: string | null
          udf_yesno07?: string | null
          udf_yesno08?: string | null
          udf_yesno09?: string | null
          udf_yesno10?: string | null
          udf_yesno11?: string | null
          udf_yesno12?: string | null
          udf_yesno13?: string | null
          udf_yesno14?: string | null
          udf_yesno15?: string | null
          uom_code_hed_fk?: string | null
          uom_size_fk_hed?: string | null
          uom_weight_fk_hed?: string | null
          UPC?: string | null
          upc_created_timedate?: string | null
          vendor_code_hed_fk?: string | null
          whse_sku_id?: string | null
        }
        Relationships: []
      }
      itemHeader: {
        Row: {
          AllowedSizes_ext: string | null
          art_piece_id: number | null
          base_qty: number | null
          carton_code_ext: string | null
          carton_depth_size: number | null
          carton_length_size: number | null
          carton_packtype_fk: string | null
          carton_qty: number | null
          carton_weight_size: number | null
          carton_width_size: number | null
          comm_code_ext: string | null
          compan_code: string | null
          compan_code_fk: number | null
          compare_price: number | null
          costcomp1: number | null
          costcomp2: number | null
          costcomp3: number | null
          costcomp4: number | null
          costcomp5: number | null
          created_time_date: string | null
          created_user_fk: string | null
          discont_status: string | null
          div_code: string | null
          div_code_fk: number | null
          ds_cat: string | null
          dsn_ref_num: string | null
          due_date: string | null
          giftwrap: string | null
          hts_num_ext_fk: string | null
          hts2_num_ext_fk: string | null
          innerpack_qty: number | null
          is_item_active: boolean | null
          is_item_old: boolean | null
          item_active_status: string | null
          item_avail_status: string | null
          item_cbm_size: number | null
          item_content: string | null
          item_cost_ext: number | null
          item_depth_size: string | null
          item_descr_name: string | null
          item_displ_descr_name: string | null
          item_id_pk: number
          item_length_size: number | null
          item_note: string | null
          item_num_id: string | null
          item_type_id_fk: number | null
          item_weight_size: number | null
          item_width_size: number | null
          lic_brand_assurance_number: string | null
          lic_comment: string | null
          lic_compnay: string | null
          lic_concept_approved: string | null
          lic_concept_approved_date: string | null
          lic_concept_rejected: string | null
          lic_concept_rejected_date: string | null
          lic_concept_submiteed: string | null
          lic_concept_submitted_date: string | null
          lic_dev_received: string | null
          lic_dev_sample_recv_date: string | null
          lic_dev_sample_sent: string | null
          lic_dev_sample_sent_date: string | null
          lic_item_desc: string | null
          lic_licensorcode: string | null
          lic_office_received: string | null
          lic_office_received_date: string | null
          lic_office_sent: string | null
          lic_office_sent_date: string | null
          lic_order_placed: string | null
          lic_order_placed_date: string | null
          lic_prepo_approved: string | null
          lic_prepo_approved_date: string | null
          lic_prepo_rejected: string | null
          lic_prepo_rejected_date: string | null
          lic_sample_made: string | null
          lic_sample_made_date: string | null
          lic_sample_no: string | null
          lic_sample_requested: string | null
          lic_sample_requested_date: string | null
          lic_tracking_updated_date: string | null
          lic_vendor_sent: string | null
          lic_vendor_sent_date: string | null
          mfg_lead_time: number | null
          mod_time_date: string | null
          mod_user_fk: string | null
          non_inv_item: string | null
          OH_min_qty: number | null
          old_item_num: string | null
          origin_country_fk: string | null
          pack_type: string | null
          product_manager_fk: string | null
          productmanager: string | null
          ref_num: string | null
          retail_price: number | null
          royalty_code_fk: string | null
          royalty2_code_fk: string | null
          salesper_code_fk: string | null
          salesper2_code_fk: string | null
          sample_start_date: string | null
          season_code_fk: string | null
          season_code_fk_id: number | null
          selling_price: number | null
          size_explo_code_ext: string | null
          size_range_code_ext: string | null
          tags: string | null
          udf_date01: string | null
          udf_date02: string | null
          udf_date03: string | null
          udf_date04: string | null
          udf_date05: string | null
          udf_date06: string | null
          udf_date07: string | null
          udf_date08: string | null
          udf_date09: string | null
          udf_date10: string | null
          udf_date11: string | null
          udf_date12: string | null
          udf_date13: string | null
          udf_date14: string | null
          udf_date15: string | null
          udf_date16: string | null
          udf_date17: string | null
          udf_date18: string | null
          udf_date19: string | null
          udf_date20: string | null
          udf_freeform_01: string | null
          udf_freeform_02: string | null
          udf_freeform_03: string | null
          udf_freeform_04: string | null
          udf_freeform_05: string | null
          udf_freeform_06: string | null
          udf_freeform_07: string | null
          udf_freeform_08: string | null
          udf_freeform_09: string | null
          udf_freeform_10: string | null
          udf_freeform_11: string | null
          udf_freeform_12: string | null
          udf_freeform_13: string | null
          udf_freeform_14: string | null
          udf_freeform_15: string | null
          udf_freeform_16: string | null
          udf_freeform_17: string | null
          udf_freeform_18: string | null
          udf_freeform_19: string | null
          udf_freeform_20: string | null
          udf_int01: number | null
          udf_int02: number | null
          udf_int03: number | null
          udf_int04: number | null
          udf_int05: number | null
          udf_int06: number | null
          udf_int07: number | null
          udf_int08: number | null
          udf_int09: number | null
          udf_int10: number | null
          udf_item_priceA: number | null
          udf_item_priceB: number | null
          udf_item_priceC: number | null
          udf_item_priceD: number | null
          udf_item_priceE: number | null
          udf_item_priceF: number | null
          udf_item_priceG: number | null
          udf_item_priceH: number | null
          udf_merchgroup01: string | null
          udf_merchgroup01_id: number | null
          udf_merchgroup02: string | null
          udf_merchgroup02_id: number | null
          udf_merchgroup03: string | null
          udf_merchgroup03_id: number | null
          udf_merchgroup04: string | null
          udf_merchgroup04_id: number | null
          udf_merchgroup05_fk: string | null
          udf_merchgroup05_fk_id: number | null
          udf_merchgroup06_fk: string | null
          udf_merchgroup06_fk_id: number | null
          udf_merchgroup07_fk: string | null
          udf_merchgroup07_fk_id: number | null
          udf_merchgroup08_fk: string | null
          udf_merchgroup08_fk_id: number | null
          udf_merchgroup09_fk: string | null
          udf_merchgroup09_fk_id: number | null
          udf_merchgroup10_fk: string | null
          udf_merchgroup10_fk_id: number | null
          udf_merchgroup11_fk: string | null
          udf_merchgroup12_fk: string | null
          udf_merchgroup13_fk: string | null
          udf_merchgroup14_fk: string | null
          udf_merchgroup15_fk: string | null
          udf_merchgroup15_fk_id: number | null
          udf_merchgroup16_fk: string | null
          udf_merchgroup17_fk: string | null
          udf_merchgroup18_fk: string | null
          udf_merchgroup19_fk: string | null
          udf_merchgroup20_fk: string | null
          udf_merchgroup21_fk: string | null
          udf_merchgroup22_fk: string | null
          udf_merchgroup23_fk: string | null
          udf_merchgroup24_fk: string | null
          udf_merchgroup25_fk: string | null
          udf_num01: number | null
          udf_num02: number | null
          udf_num03: number | null
          udf_num04: number | null
          udf_num05: number | null
          udf_num06: number | null
          udf_num07: number | null
          udf_num08: number | null
          udf_num09: number | null
          udf_num10: number | null
          udf_yesno01: string | null
          udf_yesno02: string | null
          udf_yesno03: string | null
          udf_yesno04: string | null
          udf_yesno05: string | null
          udf_yesno06: string | null
          udf_yesno07: string | null
          udf_yesno08: string | null
          udf_yesno09: string | null
          udf_yesno10: string | null
          udf_yesno11: string | null
          udf_yesno12: string | null
          udf_yesno13: string | null
          udf_yesno14: string | null
          udf_yesno15: string | null
          udfnum01: string | null
          uom_code: string | null
          uom_size_fk: string | null
          uom_weight_fk: string | null
          vendor_code_fk: string | null
        }
        Insert: {
          AllowedSizes_ext?: string | null
          art_piece_id?: number | null
          base_qty?: number | null
          carton_code_ext?: string | null
          carton_depth_size?: number | null
          carton_length_size?: number | null
          carton_packtype_fk?: string | null
          carton_qty?: number | null
          carton_weight_size?: number | null
          carton_width_size?: number | null
          comm_code_ext?: string | null
          compan_code?: string | null
          compan_code_fk?: number | null
          compare_price?: number | null
          costcomp1?: number | null
          costcomp2?: number | null
          costcomp3?: number | null
          costcomp4?: number | null
          costcomp5?: number | null
          created_time_date?: string | null
          created_user_fk?: string | null
          discont_status?: string | null
          div_code?: string | null
          div_code_fk?: number | null
          ds_cat?: string | null
          dsn_ref_num?: string | null
          due_date?: string | null
          giftwrap?: string | null
          hts_num_ext_fk?: string | null
          hts2_num_ext_fk?: string | null
          innerpack_qty?: number | null
          is_item_active?: boolean | null
          is_item_old?: boolean | null
          item_active_status?: string | null
          item_avail_status?: string | null
          item_cbm_size?: number | null
          item_content?: string | null
          item_cost_ext?: number | null
          item_depth_size?: string | null
          item_descr_name?: string | null
          item_displ_descr_name?: string | null
          item_id_pk?: never
          item_length_size?: number | null
          item_note?: string | null
          item_num_id?: string | null
          item_type_id_fk?: number | null
          item_weight_size?: number | null
          item_width_size?: number | null
          lic_brand_assurance_number?: string | null
          lic_comment?: string | null
          lic_compnay?: string | null
          lic_concept_approved?: string | null
          lic_concept_approved_date?: string | null
          lic_concept_rejected?: string | null
          lic_concept_rejected_date?: string | null
          lic_concept_submiteed?: string | null
          lic_concept_submitted_date?: string | null
          lic_dev_received?: string | null
          lic_dev_sample_recv_date?: string | null
          lic_dev_sample_sent?: string | null
          lic_dev_sample_sent_date?: string | null
          lic_item_desc?: string | null
          lic_licensorcode?: string | null
          lic_office_received?: string | null
          lic_office_received_date?: string | null
          lic_office_sent?: string | null
          lic_office_sent_date?: string | null
          lic_order_placed?: string | null
          lic_order_placed_date?: string | null
          lic_prepo_approved?: string | null
          lic_prepo_approved_date?: string | null
          lic_prepo_rejected?: string | null
          lic_prepo_rejected_date?: string | null
          lic_sample_made?: string | null
          lic_sample_made_date?: string | null
          lic_sample_no?: string | null
          lic_sample_requested?: string | null
          lic_sample_requested_date?: string | null
          lic_tracking_updated_date?: string | null
          lic_vendor_sent?: string | null
          lic_vendor_sent_date?: string | null
          mfg_lead_time?: number | null
          mod_time_date?: string | null
          mod_user_fk?: string | null
          non_inv_item?: string | null
          OH_min_qty?: number | null
          old_item_num?: string | null
          origin_country_fk?: string | null
          pack_type?: string | null
          product_manager_fk?: string | null
          productmanager?: string | null
          ref_num?: string | null
          retail_price?: number | null
          royalty_code_fk?: string | null
          royalty2_code_fk?: string | null
          salesper_code_fk?: string | null
          salesper2_code_fk?: string | null
          sample_start_date?: string | null
          season_code_fk?: string | null
          season_code_fk_id?: number | null
          selling_price?: number | null
          size_explo_code_ext?: string | null
          size_range_code_ext?: string | null
          tags?: string | null
          udf_date01?: string | null
          udf_date02?: string | null
          udf_date03?: string | null
          udf_date04?: string | null
          udf_date05?: string | null
          udf_date06?: string | null
          udf_date07?: string | null
          udf_date08?: string | null
          udf_date09?: string | null
          udf_date10?: string | null
          udf_date11?: string | null
          udf_date12?: string | null
          udf_date13?: string | null
          udf_date14?: string | null
          udf_date15?: string | null
          udf_date16?: string | null
          udf_date17?: string | null
          udf_date18?: string | null
          udf_date19?: string | null
          udf_date20?: string | null
          udf_freeform_01?: string | null
          udf_freeform_02?: string | null
          udf_freeform_03?: string | null
          udf_freeform_04?: string | null
          udf_freeform_05?: string | null
          udf_freeform_06?: string | null
          udf_freeform_07?: string | null
          udf_freeform_08?: string | null
          udf_freeform_09?: string | null
          udf_freeform_10?: string | null
          udf_freeform_11?: string | null
          udf_freeform_12?: string | null
          udf_freeform_13?: string | null
          udf_freeform_14?: string | null
          udf_freeform_15?: string | null
          udf_freeform_16?: string | null
          udf_freeform_17?: string | null
          udf_freeform_18?: string | null
          udf_freeform_19?: string | null
          udf_freeform_20?: string | null
          udf_int01?: number | null
          udf_int02?: number | null
          udf_int03?: number | null
          udf_int04?: number | null
          udf_int05?: number | null
          udf_int06?: number | null
          udf_int07?: number | null
          udf_int08?: number | null
          udf_int09?: number | null
          udf_int10?: number | null
          udf_item_priceA?: number | null
          udf_item_priceB?: number | null
          udf_item_priceC?: number | null
          udf_item_priceD?: number | null
          udf_item_priceE?: number | null
          udf_item_priceF?: number | null
          udf_item_priceG?: number | null
          udf_item_priceH?: number | null
          udf_merchgroup01?: string | null
          udf_merchgroup01_id?: number | null
          udf_merchgroup02?: string | null
          udf_merchgroup02_id?: number | null
          udf_merchgroup03?: string | null
          udf_merchgroup03_id?: number | null
          udf_merchgroup04?: string | null
          udf_merchgroup04_id?: number | null
          udf_merchgroup05_fk?: string | null
          udf_merchgroup05_fk_id?: number | null
          udf_merchgroup06_fk?: string | null
          udf_merchgroup06_fk_id?: number | null
          udf_merchgroup07_fk?: string | null
          udf_merchgroup07_fk_id?: number | null
          udf_merchgroup08_fk?: string | null
          udf_merchgroup08_fk_id?: number | null
          udf_merchgroup09_fk?: string | null
          udf_merchgroup09_fk_id?: number | null
          udf_merchgroup10_fk?: string | null
          udf_merchgroup10_fk_id?: number | null
          udf_merchgroup11_fk?: string | null
          udf_merchgroup12_fk?: string | null
          udf_merchgroup13_fk?: string | null
          udf_merchgroup14_fk?: string | null
          udf_merchgroup15_fk?: string | null
          udf_merchgroup15_fk_id?: number | null
          udf_merchgroup16_fk?: string | null
          udf_merchgroup17_fk?: string | null
          udf_merchgroup18_fk?: string | null
          udf_merchgroup19_fk?: string | null
          udf_merchgroup20_fk?: string | null
          udf_merchgroup21_fk?: string | null
          udf_merchgroup22_fk?: string | null
          udf_merchgroup23_fk?: string | null
          udf_merchgroup24_fk?: string | null
          udf_merchgroup25_fk?: string | null
          udf_num01?: number | null
          udf_num02?: number | null
          udf_num03?: number | null
          udf_num04?: number | null
          udf_num05?: number | null
          udf_num06?: number | null
          udf_num07?: number | null
          udf_num08?: number | null
          udf_num09?: number | null
          udf_num10?: number | null
          udf_yesno01?: string | null
          udf_yesno02?: string | null
          udf_yesno03?: string | null
          udf_yesno04?: string | null
          udf_yesno05?: string | null
          udf_yesno06?: string | null
          udf_yesno07?: string | null
          udf_yesno08?: string | null
          udf_yesno09?: string | null
          udf_yesno10?: string | null
          udf_yesno11?: string | null
          udf_yesno12?: string | null
          udf_yesno13?: string | null
          udf_yesno14?: string | null
          udf_yesno15?: string | null
          udfnum01?: string | null
          uom_code?: string | null
          uom_size_fk?: string | null
          uom_weight_fk?: string | null
          vendor_code_fk?: string | null
        }
        Update: {
          AllowedSizes_ext?: string | null
          art_piece_id?: number | null
          base_qty?: number | null
          carton_code_ext?: string | null
          carton_depth_size?: number | null
          carton_length_size?: number | null
          carton_packtype_fk?: string | null
          carton_qty?: number | null
          carton_weight_size?: number | null
          carton_width_size?: number | null
          comm_code_ext?: string | null
          compan_code?: string | null
          compan_code_fk?: number | null
          compare_price?: number | null
          costcomp1?: number | null
          costcomp2?: number | null
          costcomp3?: number | null
          costcomp4?: number | null
          costcomp5?: number | null
          created_time_date?: string | null
          created_user_fk?: string | null
          discont_status?: string | null
          div_code?: string | null
          div_code_fk?: number | null
          ds_cat?: string | null
          dsn_ref_num?: string | null
          due_date?: string | null
          giftwrap?: string | null
          hts_num_ext_fk?: string | null
          hts2_num_ext_fk?: string | null
          innerpack_qty?: number | null
          is_item_active?: boolean | null
          is_item_old?: boolean | null
          item_active_status?: string | null
          item_avail_status?: string | null
          item_cbm_size?: number | null
          item_content?: string | null
          item_cost_ext?: number | null
          item_depth_size?: string | null
          item_descr_name?: string | null
          item_displ_descr_name?: string | null
          item_id_pk?: never
          item_length_size?: number | null
          item_note?: string | null
          item_num_id?: string | null
          item_type_id_fk?: number | null
          item_weight_size?: number | null
          item_width_size?: number | null
          lic_brand_assurance_number?: string | null
          lic_comment?: string | null
          lic_compnay?: string | null
          lic_concept_approved?: string | null
          lic_concept_approved_date?: string | null
          lic_concept_rejected?: string | null
          lic_concept_rejected_date?: string | null
          lic_concept_submiteed?: string | null
          lic_concept_submitted_date?: string | null
          lic_dev_received?: string | null
          lic_dev_sample_recv_date?: string | null
          lic_dev_sample_sent?: string | null
          lic_dev_sample_sent_date?: string | null
          lic_item_desc?: string | null
          lic_licensorcode?: string | null
          lic_office_received?: string | null
          lic_office_received_date?: string | null
          lic_office_sent?: string | null
          lic_office_sent_date?: string | null
          lic_order_placed?: string | null
          lic_order_placed_date?: string | null
          lic_prepo_approved?: string | null
          lic_prepo_approved_date?: string | null
          lic_prepo_rejected?: string | null
          lic_prepo_rejected_date?: string | null
          lic_sample_made?: string | null
          lic_sample_made_date?: string | null
          lic_sample_no?: string | null
          lic_sample_requested?: string | null
          lic_sample_requested_date?: string | null
          lic_tracking_updated_date?: string | null
          lic_vendor_sent?: string | null
          lic_vendor_sent_date?: string | null
          mfg_lead_time?: number | null
          mod_time_date?: string | null
          mod_user_fk?: string | null
          non_inv_item?: string | null
          OH_min_qty?: number | null
          old_item_num?: string | null
          origin_country_fk?: string | null
          pack_type?: string | null
          product_manager_fk?: string | null
          productmanager?: string | null
          ref_num?: string | null
          retail_price?: number | null
          royalty_code_fk?: string | null
          royalty2_code_fk?: string | null
          salesper_code_fk?: string | null
          salesper2_code_fk?: string | null
          sample_start_date?: string | null
          season_code_fk?: string | null
          season_code_fk_id?: number | null
          selling_price?: number | null
          size_explo_code_ext?: string | null
          size_range_code_ext?: string | null
          tags?: string | null
          udf_date01?: string | null
          udf_date02?: string | null
          udf_date03?: string | null
          udf_date04?: string | null
          udf_date05?: string | null
          udf_date06?: string | null
          udf_date07?: string | null
          udf_date08?: string | null
          udf_date09?: string | null
          udf_date10?: string | null
          udf_date11?: string | null
          udf_date12?: string | null
          udf_date13?: string | null
          udf_date14?: string | null
          udf_date15?: string | null
          udf_date16?: string | null
          udf_date17?: string | null
          udf_date18?: string | null
          udf_date19?: string | null
          udf_date20?: string | null
          udf_freeform_01?: string | null
          udf_freeform_02?: string | null
          udf_freeform_03?: string | null
          udf_freeform_04?: string | null
          udf_freeform_05?: string | null
          udf_freeform_06?: string | null
          udf_freeform_07?: string | null
          udf_freeform_08?: string | null
          udf_freeform_09?: string | null
          udf_freeform_10?: string | null
          udf_freeform_11?: string | null
          udf_freeform_12?: string | null
          udf_freeform_13?: string | null
          udf_freeform_14?: string | null
          udf_freeform_15?: string | null
          udf_freeform_16?: string | null
          udf_freeform_17?: string | null
          udf_freeform_18?: string | null
          udf_freeform_19?: string | null
          udf_freeform_20?: string | null
          udf_int01?: number | null
          udf_int02?: number | null
          udf_int03?: number | null
          udf_int04?: number | null
          udf_int05?: number | null
          udf_int06?: number | null
          udf_int07?: number | null
          udf_int08?: number | null
          udf_int09?: number | null
          udf_int10?: number | null
          udf_item_priceA?: number | null
          udf_item_priceB?: number | null
          udf_item_priceC?: number | null
          udf_item_priceD?: number | null
          udf_item_priceE?: number | null
          udf_item_priceF?: number | null
          udf_item_priceG?: number | null
          udf_item_priceH?: number | null
          udf_merchgroup01?: string | null
          udf_merchgroup01_id?: number | null
          udf_merchgroup02?: string | null
          udf_merchgroup02_id?: number | null
          udf_merchgroup03?: string | null
          udf_merchgroup03_id?: number | null
          udf_merchgroup04?: string | null
          udf_merchgroup04_id?: number | null
          udf_merchgroup05_fk?: string | null
          udf_merchgroup05_fk_id?: number | null
          udf_merchgroup06_fk?: string | null
          udf_merchgroup06_fk_id?: number | null
          udf_merchgroup07_fk?: string | null
          udf_merchgroup07_fk_id?: number | null
          udf_merchgroup08_fk?: string | null
          udf_merchgroup08_fk_id?: number | null
          udf_merchgroup09_fk?: string | null
          udf_merchgroup09_fk_id?: number | null
          udf_merchgroup10_fk?: string | null
          udf_merchgroup10_fk_id?: number | null
          udf_merchgroup11_fk?: string | null
          udf_merchgroup12_fk?: string | null
          udf_merchgroup13_fk?: string | null
          udf_merchgroup14_fk?: string | null
          udf_merchgroup15_fk?: string | null
          udf_merchgroup15_fk_id?: number | null
          udf_merchgroup16_fk?: string | null
          udf_merchgroup17_fk?: string | null
          udf_merchgroup18_fk?: string | null
          udf_merchgroup19_fk?: string | null
          udf_merchgroup20_fk?: string | null
          udf_merchgroup21_fk?: string | null
          udf_merchgroup22_fk?: string | null
          udf_merchgroup23_fk?: string | null
          udf_merchgroup24_fk?: string | null
          udf_merchgroup25_fk?: string | null
          udf_num01?: number | null
          udf_num02?: number | null
          udf_num03?: number | null
          udf_num04?: number | null
          udf_num05?: number | null
          udf_num06?: number | null
          udf_num07?: number | null
          udf_num08?: number | null
          udf_num09?: number | null
          udf_num10?: number | null
          udf_yesno01?: string | null
          udf_yesno02?: string | null
          udf_yesno03?: string | null
          udf_yesno04?: string | null
          udf_yesno05?: string | null
          udf_yesno06?: string | null
          udf_yesno07?: string | null
          udf_yesno08?: string | null
          udf_yesno09?: string | null
          udf_yesno10?: string | null
          udf_yesno11?: string | null
          udf_yesno12?: string | null
          udf_yesno13?: string | null
          udf_yesno14?: string | null
          udf_yesno15?: string | null
          udfnum01?: string | null
          uom_code?: string | null
          uom_size_fk?: string | null
          uom_weight_fk?: string | null
          vendor_code_fk?: string | null
        }
        Relationships: []
      }
      itemLicenseImage: {
        Row: {
          created_time: string | null
          created_user: string | null
          id: number
          image_link: string
          itemheader_id_fk: number
          phase: string | null
          thumb_link: string | null
        }
        Insert: {
          created_time?: string | null
          created_user?: string | null
          id?: never
          image_link: string
          itemheader_id_fk: number
          phase?: string | null
          thumb_link?: string | null
        }
        Update: {
          created_time?: string | null
          created_user?: string | null
          id?: never
          image_link?: string
          itemheader_id_fk?: number
          phase?: string | null
          thumb_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itemLicenseImage_itemheader_id_fk_fkey"
            columns: ["itemheader_id_fk"]
            isOneToOne: false
            referencedRelation: "itemHeader"
            referencedColumns: ["item_id_pk"]
          },
        ]
      }
      itemSize: {
        Row: {
          itemSize_airbyte_emitted_at: string | null
          itemSize_airbyte_sizes_hashid: string | null
          itemSize_auditlog: string | null
          itemSize_code: string | null
          itemSize_id: number
          itemSize_status: string | null
          itemSize_title: string | null
          itemSize_unit: string | null
        }
        Insert: {
          itemSize_airbyte_emitted_at?: string | null
          itemSize_airbyte_sizes_hashid?: string | null
          itemSize_auditlog?: string | null
          itemSize_code?: string | null
          itemSize_id?: number
          itemSize_status?: string | null
          itemSize_title?: string | null
          itemSize_unit?: string | null
        }
        Update: {
          itemSize_airbyte_emitted_at?: string | null
          itemSize_airbyte_sizes_hashid?: string | null
          itemSize_auditlog?: string | null
          itemSize_code?: string | null
          itemSize_id?: number
          itemSize_status?: string | null
          itemSize_title?: string | null
          itemSize_unit?: string | null
        }
        Relationships: []
      }
      itemType: {
        Row: {
          created_time_date: string | null
          created_user_fk: string | null
          item_type_description: string
          item_type_id: number
          item_type_img_fullsize: string
          item_type_img_thumbnail: string
          item_type_name: string
          item_type_status: string
          mod_time_date: string | null
          mod_user_fk: string | null
        }
        Insert: {
          created_time_date?: string | null
          created_user_fk?: string | null
          item_type_description: string
          item_type_id?: number
          item_type_img_fullsize: string
          item_type_img_thumbnail: string
          item_type_name: string
          item_type_status?: string
          mod_time_date?: string | null
          mod_user_fk?: string | null
        }
        Update: {
          created_time_date?: string | null
          created_user_fk?: string | null
          item_type_description?: string
          item_type_id?: number
          item_type_img_fullsize?: string
          item_type_img_thumbnail?: string
          item_type_name?: string
          item_type_status?: string
          mod_time_date?: string | null
          mod_user_fk?: string | null
        }
        Relationships: []
      }
      LicenseFeedBacks: {
        Row: {
          access: string | null
          duplicable: boolean | null
          explanation: string | null
          id: number
          item_order: number | null
          order: string | null
          phase: string | null
          status: string | null
        }
        Insert: {
          access?: string | null
          duplicable?: boolean | null
          explanation?: string | null
          id?: never
          item_order?: number | null
          order?: string | null
          phase?: string | null
          status?: string | null
        }
        Update: {
          access?: string | null
          duplicable?: boolean | null
          explanation?: string | null
          id?: never
          item_order?: number | null
          order?: string | null
          phase?: string | null
          status?: string | null
        }
        Relationships: []
      }
      licensing_feedback: {
        Row: {
          author_name: string | null
          body: string | null
          created_at: string
          id: string
          licensing_status_id: string | null
          reply_to_id: string | null
          source_id: string | null
          source_system: string | null
        }
        Insert: {
          author_name?: string | null
          body?: string | null
          created_at?: string
          id?: string
          licensing_status_id?: string | null
          reply_to_id?: string | null
          source_id?: string | null
          source_system?: string | null
        }
        Update: {
          author_name?: string | null
          body?: string | null
          created_at?: string
          id?: string
          licensing_status_id?: string | null
          reply_to_id?: string | null
          source_id?: string | null
          source_system?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "licensing_feedback_licensing_status_id_fkey"
            columns: ["licensing_status_id"]
            isOneToOne: false
            referencedRelation: "licensing_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licensing_feedback_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "licensing_feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      licensing_status: {
        Row: {
          completed_at: string | null
          created_at: string
          due_date: string | null
          id: string
          item_id: string | null
          licensor_id: string | null
          metadata: Json
          milestone: string | null
          property_id: string | null
          source_id: string | null
          source_system: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          item_id?: string | null
          licensor_id?: string | null
          metadata?: Json
          milestone?: string | null
          property_id?: string | null
          source_id?: string | null
          source_system?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          item_id?: string | null
          licensor_id?: string | null
          metadata?: Json
          milestone?: string | null
          property_id?: string | null
          source_id?: string | null
          source_system?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "licensing_status_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item"
            referencedColumns: ["id"]
          },
        ]
      }
      licensingFeedbackReply: {
        Row: {
          attachments: Json | null
          comment: string
          created_at: string
          created_by: number
          id: number
          licensing_status_id_fk: number
          tagged_user_ids: Json | null
        }
        Insert: {
          attachments?: Json | null
          comment: string
          created_at?: string
          created_by: number
          id?: number
          licensing_status_id_fk: number
          tagged_user_ids?: Json | null
        }
        Update: {
          attachments?: Json | null
          comment?: string
          created_at?: string
          created_by?: number
          id?: number
          licensing_status_id_fk?: number
          tagged_user_ids?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "licensingFeedbackReply_licensing_status_id_fk_fkey"
            columns: ["licensing_status_id_fk"]
            isOneToOne: false
            referencedRelation: "licensingStatus"
            referencedColumns: ["id"]
          },
        ]
      }
      licensingMilestone: {
        Row: {
          checked_by_name: string | null
          checked_by_user_id: number | null
          created_at: string | null
          id: number
          itemheader_id_fk: number
          milestone_date: string
          stage: string
          updated_at: string | null
        }
        Insert: {
          checked_by_name?: string | null
          checked_by_user_id?: number | null
          created_at?: string | null
          id?: number
          itemheader_id_fk: number
          milestone_date: string
          stage: string
          updated_at?: string | null
        }
        Update: {
          checked_by_name?: string | null
          checked_by_user_id?: number | null
          created_at?: string | null
          id?: number
          itemheader_id_fk?: number
          milestone_date?: string
          stage?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      licensingStatus: {
        Row: {
          assignee_id: number | null
          assignee_ids: Json
          assignor_id: number | null
          attachments: Json | null
          date: string | null
          feedback: string | null
          from: string | null
          id: number
          itemheader_id_fk: number | null
          moduser: string | null
          package: boolean | null
          pop_comments: string | null
          status: string | null
          tagged_group_id: number | null
        }
        Insert: {
          assignee_id?: number | null
          assignee_ids?: Json
          assignor_id?: number | null
          attachments?: Json | null
          date?: string | null
          feedback?: string | null
          from?: string | null
          id?: number
          itemheader_id_fk?: number | null
          moduser?: string | null
          package?: boolean | null
          pop_comments?: string | null
          status?: string | null
          tagged_group_id?: number | null
        }
        Update: {
          assignee_id?: number | null
          assignee_ids?: Json
          assignor_id?: number | null
          attachments?: Json | null
          date?: string | null
          feedback?: string | null
          from?: string | null
          id?: number
          itemheader_id_fk?: number | null
          moduser?: string | null
          package?: boolean | null
          pop_comments?: string | null
          status?: string | null
          tagged_group_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "licensingStatus_tagged_group_id_fkey"
            columns: ["tagged_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      LicensingTime: {
        Row: {
          created_at: string
          id: number
          licensor_name: string
          pps_approval_days: number | null
          resubmission_days: number | null
          submission_days: number | null
          total_days: number | null
          updated_at: string
        }
        Insert: {
          created_at: string
          id?: number
          licensor_name: string
          pps_approval_days?: number | null
          resubmission_days?: number | null
          submission_days?: number | null
          total_days?: number | null
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: number
          licensor_name?: string
          pps_approval_days?: number | null
          resubmission_days?: number | null
          submission_days?: number | null
          total_days?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      LicensingTimes: {
        Row: {
          id: number
          licensor_id_fk: number | null
          linesheet_resubmission_time: number | null
          linesheet_submission_time: number | null
          pps_approval_time: number | null
          resubmission_time: number | null
          submission_time: number | null
        }
        Insert: {
          id?: never
          licensor_id_fk?: number | null
          linesheet_resubmission_time?: number | null
          linesheet_submission_time?: number | null
          pps_approval_time?: number | null
          resubmission_time?: number | null
          submission_time?: number | null
        }
        Update: {
          id?: never
          licensor_id_fk?: number | null
          linesheet_resubmission_time?: number | null
          linesheet_submission_time?: number | null
          pps_approval_time?: number | null
          resubmission_time?: number | null
          submission_time?: number | null
        }
        Relationships: []
      }
      licensor_import: {
        Row: {
          division_code: string | null
          imported_at: string
          licensor_id: string
          mg_category: string | null
          mg_code: string | null
          mg_code2: string | null
          parent_id: string | null
          plm_licensor_id: string
          raw: Json
          title: string
          updated_at: string
        }
        Insert: {
          division_code?: string | null
          imported_at?: string
          licensor_id: string
          mg_category?: string | null
          mg_code?: string | null
          mg_code2?: string | null
          parent_id?: string | null
          plm_licensor_id: string
          raw?: Json
          title: string
          updated_at?: string
        }
        Update: {
          division_code?: string | null
          imported_at?: string
          licensor_id?: string
          mg_category?: string | null
          mg_code?: string | null
          mg_code2?: string | null
          parent_id?: string | null
          plm_licensor_id?: string
          raw?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      merch_group_header: {
        Row: {
          company_code: string
          division_code: string
          imported_at: string
          last_seen_at: string
          last_sync_run_id: string | null
          mg_type_code: string
          mg_type_desc: string
          raw: Json
          source_created_at: string | null
          source_created_by: string | null
          source_hash: string | null
          source_modified_at: string | null
          source_modified_by: string | null
          updated_at: string
        }
        Insert: {
          company_code: string
          division_code: string
          imported_at?: string
          last_seen_at?: string
          last_sync_run_id?: string | null
          mg_type_code: string
          mg_type_desc: string
          raw?: Json
          source_created_at?: string | null
          source_created_by?: string | null
          source_hash?: string | null
          source_modified_at?: string | null
          source_modified_by?: string | null
          updated_at?: string
        }
        Update: {
          company_code?: string
          division_code?: string
          imported_at?: string
          last_seen_at?: string
          last_sync_run_id?: string | null
          mg_type_code?: string
          mg_type_desc?: string
          raw?: Json
          source_created_at?: string | null
          source_created_by?: string | null
          source_hash?: string | null
          source_modified_at?: string | null
          source_modified_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      nbcu_asset: {
        Row: {
          asset_path: string
          asset_source_key: string
          capture_id: string
          character_labels: Json
          dam_asset_id: string | null
          display_modified: string | null
          display_size: string | null
          file_name: string
          ip_family_labels: Json
          media_type: string | null
          property_labels: Json
          raw: Json
          resolution_reason: string | null
          resolution_status: string
          resolved_at: string | null
          resolved_by: string | null
          restriction_labels: Json
          scope_paths: Json
          source_captured_at: string
          source_hash: string
          source_url: string
          studio_labels: Json
          style_guide_natural_keys: Json
        }
        Insert: {
          asset_path: string
          asset_source_key: string
          capture_id: string
          character_labels: Json
          dam_asset_id?: string | null
          display_modified?: string | null
          display_size?: string | null
          file_name: string
          ip_family_labels: Json
          media_type?: string | null
          property_labels: Json
          raw: Json
          resolution_reason?: string | null
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          restriction_labels: Json
          scope_paths: Json
          source_captured_at: string
          source_hash: string
          source_url: string
          studio_labels: Json
          style_guide_natural_keys: Json
        }
        Update: {
          asset_path?: string
          asset_source_key?: string
          capture_id?: string
          character_labels?: Json
          dam_asset_id?: string | null
          display_modified?: string | null
          display_size?: string | null
          file_name?: string
          ip_family_labels?: Json
          media_type?: string | null
          property_labels?: Json
          raw?: Json
          resolution_reason?: string | null
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          restriction_labels?: Json
          scope_paths?: Json
          source_captured_at?: string
          source_hash?: string
          source_url?: string
          studio_labels?: Json
          style_guide_natural_keys?: Json
        }
        Relationships: [
          {
            foreignKeyName: "nbcu_asset_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "nbcu_capture"
            referencedColumns: ["id"]
          },
        ]
      }
      nbcu_asset_character: {
        Row: {
          asset_source_key: string
          capture_id: string
          character_key: string
          character_label: string
          evidence_type: string
          evidence_value: string
          raw: Json
          source_captured_at: string
          source_url: string
        }
        Insert: {
          asset_source_key: string
          capture_id: string
          character_key: string
          character_label: string
          evidence_type: string
          evidence_value: string
          raw: Json
          source_captured_at: string
          source_url: string
        }
        Update: {
          asset_source_key?: string
          capture_id?: string
          character_key?: string
          character_label?: string
          evidence_type?: string
          evidence_value?: string
          raw?: Json
          source_captured_at?: string
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "nbcu_asset_character_asset_fkey"
            columns: ["capture_id", "asset_source_key"]
            isOneToOne: false
            referencedRelation: "nbcu_asset"
            referencedColumns: ["capture_id", "asset_source_key"]
          },
          {
            foreignKeyName: "nbcu_asset_character_character_fkey"
            columns: ["capture_id", "character_key"]
            isOneToOne: false
            referencedRelation: "nbcu_character"
            referencedColumns: ["capture_id", "character_key"]
          },
        ]
      }
      nbcu_asset_metadata_value: {
        Row: {
          asset_source_key: string
          capture_id: string
          field_name: string
          raw: Json
          value_attributes: Json
          value_ordinal: number
          value_text: string | null
        }
        Insert: {
          asset_source_key: string
          capture_id: string
          field_name: string
          raw: Json
          value_attributes?: Json
          value_ordinal: number
          value_text?: string | null
        }
        Update: {
          asset_source_key?: string
          capture_id?: string
          field_name?: string
          raw?: Json
          value_attributes?: Json
          value_ordinal?: number
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nbcu_asset_metadata_value_asset_fkey"
            columns: ["capture_id", "asset_source_key"]
            isOneToOne: false
            referencedRelation: "nbcu_asset"
            referencedColumns: ["capture_id", "asset_source_key"]
          },
        ]
      }
      nbcu_asset_property: {
        Row: {
          asset_source_key: string
          capture_id: string
          evidence_type: string
          evidence_value: string
          property_key: string
          property_label: string
          raw: Json
          source_captured_at: string
          source_url: string
        }
        Insert: {
          asset_source_key: string
          capture_id: string
          evidence_type: string
          evidence_value: string
          property_key: string
          property_label: string
          raw: Json
          source_captured_at: string
          source_url: string
        }
        Update: {
          asset_source_key?: string
          capture_id?: string
          evidence_type?: string
          evidence_value?: string
          property_key?: string
          property_label?: string
          raw?: Json
          source_captured_at?: string
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "nbcu_asset_property_asset_fkey"
            columns: ["capture_id", "asset_source_key"]
            isOneToOne: false
            referencedRelation: "nbcu_asset"
            referencedColumns: ["capture_id", "asset_source_key"]
          },
          {
            foreignKeyName: "nbcu_asset_property_property_fkey"
            columns: ["capture_id", "property_key"]
            isOneToOne: false
            referencedRelation: "nbcu_property"
            referencedColumns: ["capture_id", "property_key"]
          },
        ]
      }
      nbcu_asset_scope: {
        Row: {
          asset_source_key: string
          capture_id: string
          evidence_type: string
          scope_key: string
        }
        Insert: {
          asset_source_key: string
          capture_id: string
          evidence_type?: string
          scope_key: string
        }
        Update: {
          asset_source_key?: string
          capture_id?: string
          evidence_type?: string
          scope_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "nbcu_asset_scope_asset_fkey"
            columns: ["capture_id", "asset_source_key"]
            isOneToOne: false
            referencedRelation: "nbcu_asset"
            referencedColumns: ["capture_id", "asset_source_key"]
          },
          {
            foreignKeyName: "nbcu_asset_scope_scope_fkey"
            columns: ["capture_id", "scope_key"]
            isOneToOne: false
            referencedRelation: "nbcu_scope"
            referencedColumns: ["capture_id", "scope_key"]
          },
        ]
      }
      nbcu_asset_style_guide: {
        Row: {
          asset_source_key: string
          capture_id: string
          evidence_type: string
          evidence_value: string
          raw: Json
          source_captured_at: string
          source_url: string
          style_guide_key: string
        }
        Insert: {
          asset_source_key: string
          capture_id: string
          evidence_type: string
          evidence_value: string
          raw: Json
          source_captured_at: string
          source_url: string
          style_guide_key: string
        }
        Update: {
          asset_source_key?: string
          capture_id?: string
          evidence_type?: string
          evidence_value?: string
          raw?: Json
          source_captured_at?: string
          source_url?: string
          style_guide_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "nbcu_asset_style_guide_asset_fkey"
            columns: ["capture_id", "asset_source_key"]
            isOneToOne: false
            referencedRelation: "nbcu_asset"
            referencedColumns: ["capture_id", "asset_source_key"]
          },
          {
            foreignKeyName: "nbcu_asset_style_guide_guide_fkey"
            columns: ["capture_id", "style_guide_key"]
            isOneToOne: false
            referencedRelation: "nbcu_style_guide"
            referencedColumns: ["capture_id", "style_guide_key"]
          },
        ]
      }
      nbcu_capture: {
        Row: {
          capture_key: string
          created_by: string
          error_summary: Json
          excluded_unlicensed_assets: number
          expected_counts: Json
          id: string
          load_completed_at: string | null
          load_started_at: string
          media_downloaded: number
          observed_counts: Json
          portal_base_url: string
          raw_summary: Json
          read_commit_sha: string | null
          source_captured_at: string
          source_commit_sha: string
          source_manifest_sha256: string
          source_repository: string
          status: string
        }
        Insert: {
          capture_key: string
          created_by: string
          error_summary?: Json
          excluded_unlicensed_assets?: number
          expected_counts: Json
          id?: string
          load_completed_at?: string | null
          load_started_at?: string
          media_downloaded?: number
          observed_counts?: Json
          portal_base_url: string
          raw_summary: Json
          read_commit_sha?: string | null
          source_captured_at: string
          source_commit_sha: string
          source_manifest_sha256: string
          source_repository: string
          status?: string
        }
        Update: {
          capture_key?: string
          created_by?: string
          error_summary?: Json
          excluded_unlicensed_assets?: number
          expected_counts?: Json
          id?: string
          load_completed_at?: string | null
          load_started_at?: string
          media_downloaded?: number
          observed_counts?: Json
          portal_base_url?: string
          raw_summary?: Json
          read_commit_sha?: string | null
          source_captured_at?: string
          source_commit_sha?: string
          source_manifest_sha256?: string
          source_repository?: string
          status?: string
        }
        Relationships: []
      }
      nbcu_character: {
        Row: {
          capture_id: string
          character_key: string
          character_label: string
          character_source_id: string | null
          core_character_id: string | null
          id_fallback: string | null
          raw: Json
          resolution_reason: string | null
          resolution_status: string
          resolved_at: string | null
          resolved_by: string | null
          source_captured_at: string
          source_url: string
          tag_namespace: string | null
        }
        Insert: {
          capture_id: string
          character_key: string
          character_label: string
          character_source_id?: string | null
          core_character_id?: string | null
          id_fallback?: string | null
          raw: Json
          resolution_reason?: string | null
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          source_captured_at: string
          source_url: string
          tag_namespace?: string | null
        }
        Update: {
          capture_id?: string
          character_key?: string
          character_label?: string
          character_source_id?: string | null
          core_character_id?: string | null
          id_fallback?: string | null
          raw?: Json
          resolution_reason?: string | null
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          source_captured_at?: string
          source_url?: string
          tag_namespace?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nbcu_character_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "nbcu_capture"
            referencedColumns: ["id"]
          },
        ]
      }
      nbcu_ip_family: {
        Row: {
          capture_id: string
          ip_family_key: string
          ip_family_label: string
          raw: Json
          source_id: string | null
          source_url: string
        }
        Insert: {
          capture_id: string
          ip_family_key: string
          ip_family_label: string
          raw: Json
          source_id?: string | null
          source_url: string
        }
        Update: {
          capture_id?: string
          ip_family_key?: string
          ip_family_label?: string
          raw?: Json
          source_id?: string | null
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "nbcu_ip_family_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "nbcu_capture"
            referencedColumns: ["id"]
          },
        ]
      }
      nbcu_ip_family_property: {
        Row: {
          capture_id: string
          evidence_type: string
          evidence_value: string
          ip_family_key: string
          ip_family_label: string
          property_key: string
          property_label: string
          raw: Json
          source_captured_at: string
          source_url: string
        }
        Insert: {
          capture_id: string
          evidence_type: string
          evidence_value: string
          ip_family_key: string
          ip_family_label: string
          property_key: string
          property_label: string
          raw: Json
          source_captured_at: string
          source_url: string
        }
        Update: {
          capture_id?: string
          evidence_type?: string
          evidence_value?: string
          ip_family_key?: string
          ip_family_label?: string
          property_key?: string
          property_label?: string
          raw?: Json
          source_captured_at?: string
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "nbcu_ip_family_property_family_fkey"
            columns: ["capture_id", "ip_family_key"]
            isOneToOne: false
            referencedRelation: "nbcu_ip_family"
            referencedColumns: ["capture_id", "ip_family_key"]
          },
          {
            foreignKeyName: "nbcu_ip_family_property_property_fkey"
            columns: ["capture_id", "property_key"]
            isOneToOne: false
            referencedRelation: "nbcu_property"
            referencedColumns: ["capture_id", "property_key"]
          },
        ]
      }
      nbcu_property: {
        Row: {
          capture_id: string
          core_property_id: string | null
          ip_family_label: string | null
          ip_family_source_key: string | null
          licensed_scope_label: string | null
          property_key: string
          property_label: string
          property_source_id: string | null
          raw: Json
          resolution_reason: string | null
          resolution_status: string
          resolved_at: string | null
          resolved_by: string | null
          source_captured_at: string
          source_kind: string
          source_url: string
        }
        Insert: {
          capture_id: string
          core_property_id?: string | null
          ip_family_label?: string | null
          ip_family_source_key?: string | null
          licensed_scope_label?: string | null
          property_key: string
          property_label: string
          property_source_id?: string | null
          raw: Json
          resolution_reason?: string | null
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          source_captured_at: string
          source_kind: string
          source_url: string
        }
        Update: {
          capture_id?: string
          core_property_id?: string | null
          ip_family_label?: string | null
          ip_family_source_key?: string | null
          licensed_scope_label?: string | null
          property_key?: string
          property_label?: string
          property_source_id?: string | null
          raw?: Json
          resolution_reason?: string | null
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          source_captured_at?: string
          source_kind?: string
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "nbcu_property_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "nbcu_capture"
            referencedColumns: ["id"]
          },
        ]
      }
      nbcu_property_character: {
        Row: {
          capture_id: string
          character_key: string
          character_label: string
          evidence_type: string
          evidence_value: string
          property_key: string
          property_label: string
          raw: Json
          source_captured_at: string
          source_url: string
        }
        Insert: {
          capture_id: string
          character_key: string
          character_label: string
          evidence_type: string
          evidence_value: string
          property_key: string
          property_label: string
          raw: Json
          source_captured_at: string
          source_url: string
        }
        Update: {
          capture_id?: string
          character_key?: string
          character_label?: string
          evidence_type?: string
          evidence_value?: string
          property_key?: string
          property_label?: string
          raw?: Json
          source_captured_at?: string
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "nbcu_property_character_character_fkey"
            columns: ["capture_id", "character_key"]
            isOneToOne: false
            referencedRelation: "nbcu_character"
            referencedColumns: ["capture_id", "character_key"]
          },
          {
            foreignKeyName: "nbcu_property_character_property_fkey"
            columns: ["capture_id", "property_key"]
            isOneToOne: false
            referencedRelation: "nbcu_property"
            referencedColumns: ["capture_id", "property_key"]
          },
        ]
      }
      nbcu_right: {
        Row: {
          business_title: string
          capture_id: string
          global_rule_applied: boolean
          ordinal: number
          raw: Json
          restriction_text: string | null
          right_key: string
          rights_scope: string
          source_document: string
        }
        Insert: {
          business_title: string
          capture_id: string
          global_rule_applied?: boolean
          ordinal: number
          raw: Json
          restriction_text?: string | null
          right_key: string
          rights_scope: string
          source_document: string
        }
        Update: {
          business_title?: string
          capture_id?: string
          global_rule_applied?: boolean
          ordinal?: number
          raw?: Json
          restriction_text?: string | null
          right_key?: string
          rights_scope?: string
          source_document?: string
        }
        Relationships: [
          {
            foreignKeyName: "nbcu_right_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "nbcu_capture"
            referencedColumns: ["id"]
          },
        ]
      }
      nbcu_scope: {
        Row: {
          capture_id: string
          indexed_rows: number
          missing_offsets: number[]
          page_count: number
          raw: Json
          scope_href: string
          scope_key: string
          scope_label: string
          source_files: Json
          terminal: boolean
          unique_assets: number
        }
        Insert: {
          capture_id: string
          indexed_rows: number
          missing_offsets?: number[]
          page_count: number
          raw: Json
          scope_href: string
          scope_key: string
          scope_label: string
          source_files: Json
          terminal: boolean
          unique_assets: number
        }
        Update: {
          capture_id?: string
          indexed_rows?: number
          missing_offsets?: number[]
          page_count?: number
          raw?: Json
          scope_href?: string
          scope_key?: string
          scope_label?: string
          source_files?: Json
          terminal?: boolean
          unique_assets?: number
        }
        Relationships: [
          {
            foreignKeyName: "nbcu_scope_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "nbcu_capture"
            referencedColumns: ["id"]
          },
        ]
      }
      nbcu_style_guide: {
        Row: {
          capture_id: string
          core_style_guide_id: string | null
          folder_path: string
          identity_basis: string
          raw: Json
          resolution_reason: string | null
          resolution_status: string
          resolved_at: string | null
          resolved_by: string | null
          source_captured_at: string
          source_url: string
          style_guide_key: string
          style_guide_label: string
          style_guide_source_id: string | null
        }
        Insert: {
          capture_id: string
          core_style_guide_id?: string | null
          folder_path: string
          identity_basis?: string
          raw: Json
          resolution_reason?: string | null
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          source_captured_at: string
          source_url: string
          style_guide_key: string
          style_guide_label: string
          style_guide_source_id?: string | null
        }
        Update: {
          capture_id?: string
          core_style_guide_id?: string | null
          folder_path?: string
          identity_basis?: string
          raw?: Json
          resolution_reason?: string | null
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          source_captured_at?: string
          source_url?: string
          style_guide_key?: string
          style_guide_label?: string
          style_guide_source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nbcu_style_guide_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "nbcu_capture"
            referencedColumns: ["id"]
          },
        ]
      }
      nbcu_style_guide_property: {
        Row: {
          capture_id: string
          evidence_type: string
          evidence_value: string
          property_key: string
          property_label: string
          raw: Json
          source_captured_at: string
          source_url: string
          style_guide_key: string
        }
        Insert: {
          capture_id: string
          evidence_type: string
          evidence_value: string
          property_key: string
          property_label: string
          raw: Json
          source_captured_at: string
          source_url: string
          style_guide_key: string
        }
        Update: {
          capture_id?: string
          evidence_type?: string
          evidence_value?: string
          property_key?: string
          property_label?: string
          raw?: Json
          source_captured_at?: string
          source_url?: string
          style_guide_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "nbcu_style_guide_property_guide_fkey"
            columns: ["capture_id", "style_guide_key"]
            isOneToOne: false
            referencedRelation: "nbcu_style_guide"
            referencedColumns: ["capture_id", "style_guide_key"]
          },
          {
            foreignKeyName: "nbcu_style_guide_property_property_fkey"
            columns: ["capture_id", "property_key"]
            isOneToOne: false
            referencedRelation: "nbcu_property"
            referencedColumns: ["capture_id", "property_key"]
          },
        ]
      }
      opa_property_character: {
        Row: {
          brand_property_id: number
          captured_at: string
          character_id: number
          character_name: string
          entitlement_scope: string
          first_seen_at: string
          imported_at: string
          last_seen_at: string
          licensed_property_id: number
          line_of_business: string
          option_source_id: number
          property_id: string | null
          property_name: string
          raw: Json
          resolution_reason: string | null
          resolution_status: string
          resolved_at: string | null
          resolved_by: string | null
          source_hash: string
          source_url: string
          updated_at: string
        }
        Insert: {
          brand_property_id: number
          captured_at: string
          character_id: number
          character_name: string
          entitlement_scope?: string
          first_seen_at?: string
          imported_at?: string
          last_seen_at?: string
          licensed_property_id: number
          line_of_business?: string
          option_source_id: number
          property_id?: string | null
          property_name: string
          raw: Json
          resolution_reason?: string | null
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          source_hash: string
          source_url: string
          updated_at?: string
        }
        Update: {
          brand_property_id?: number
          captured_at?: string
          character_id?: number
          character_name?: string
          entitlement_scope?: string
          first_seen_at?: string
          imported_at?: string
          last_seen_at?: string
          licensed_property_id?: number
          line_of_business?: string
          option_source_id?: number
          property_id?: string | null
          property_name?: string
          raw?: Json
          resolution_reason?: string | null
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          source_hash?: string
          source_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      OrderLeadTime: {
        Row: {
          design_number: number | null
          design_techpacking_time: number | null
          licensing_time: number | null
          licensor_id_fk: number | null
          mass_production_time: number | null
          order_id: number
          product_type_id_fk: number | null
          sampling_time: number | null
          total_lead_time: number | null
        }
        Insert: {
          design_number?: number | null
          design_techpacking_time?: number | null
          licensing_time?: number | null
          licensor_id_fk?: number | null
          mass_production_time?: number | null
          order_id?: never
          product_type_id_fk?: number | null
          sampling_time?: number | null
          total_lead_time?: number | null
        }
        Update: {
          design_number?: number | null
          design_techpacking_time?: number | null
          licensing_time?: number | null
          licensor_id_fk?: number | null
          mass_production_time?: number | null
          order_id?: never
          product_type_id_fk?: number | null
          sampling_time?: number | null
          total_lead_time?: number | null
        }
        Relationships: []
      }
      pmt_asset: {
        Row: {
          asset_id: string
          asset_name: string
          asset_version: number
          capture_id: string
          content_size_bytes: number
          content_type: string
          date_imported: string | null
          date_last_updated: string | null
          imported_at: string
          mime_type: string
          raw: Json
          source_hash: string
        }
        Insert: {
          asset_id: string
          asset_name: string
          asset_version: number
          capture_id: string
          content_size_bytes: number
          content_type: string
          date_imported?: string | null
          date_last_updated?: string | null
          imported_at?: string
          mime_type: string
          raw?: Json
          source_hash: string
        }
        Update: {
          asset_id?: string
          asset_name?: string
          asset_version?: number
          capture_id?: string
          content_size_bytes?: number
          content_type?: string
          date_imported?: string | null
          date_last_updated?: string | null
          imported_at?: string
          mime_type?: string
          raw?: Json
          source_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "pmt_asset_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture"
            referencedColumns: ["capture_id"]
          },
        ]
      }
      pmt_asset_brand: {
        Row: {
          asset_id: string
          brand_source_id: number
          capture_id: string
          imported_at: string
          source_evidence: string
          source_hash: string
        }
        Insert: {
          asset_id: string
          brand_source_id: number
          capture_id: string
          imported_at?: string
          source_evidence?: string
          source_hash: string
        }
        Update: {
          asset_id?: string
          brand_source_id?: number
          capture_id?: string
          imported_at?: string
          source_evidence?: string
          source_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "pmt_asset_brand_asset_fkey"
            columns: ["capture_id", "asset_id"]
            isOneToOne: false
            referencedRelation: "pmt_asset"
            referencedColumns: ["capture_id", "asset_id"]
          },
          {
            foreignKeyName: "pmt_asset_brand_brand_fkey"
            columns: ["capture_id", "brand_source_id"]
            isOneToOne: false
            referencedRelation: "pmt_brand"
            referencedColumns: ["capture_id", "brand_source_id"]
          },
          {
            foreignKeyName: "pmt_asset_brand_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture"
            referencedColumns: ["capture_id"]
          },
        ]
      }
      pmt_asset_character: {
        Row: {
          asset_id: string
          capture_id: string
          character_source_id: number
          imported_at: string
          source_evidence: string
          source_hash: string
        }
        Insert: {
          asset_id: string
          capture_id: string
          character_source_id: number
          imported_at?: string
          source_evidence?: string
          source_hash: string
        }
        Update: {
          asset_id?: string
          capture_id?: string
          character_source_id?: number
          imported_at?: string
          source_evidence?: string
          source_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "pmt_asset_character_asset_fkey"
            columns: ["capture_id", "asset_id"]
            isOneToOne: false
            referencedRelation: "pmt_asset"
            referencedColumns: ["capture_id", "asset_id"]
          },
          {
            foreignKeyName: "pmt_asset_character_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture"
            referencedColumns: ["capture_id"]
          },
          {
            foreignKeyName: "pmt_asset_character_character_fkey"
            columns: ["capture_id", "character_source_id"]
            isOneToOne: false
            referencedRelation: "pmt_character"
            referencedColumns: ["capture_id", "character_source_id"]
          },
        ]
      }
      pmt_asset_collection: {
        Row: {
          asset_id: string
          capture_id: string
          collection_source_id: number
          imported_at: string
          source_evidence: string
          source_hash: string
        }
        Insert: {
          asset_id: string
          capture_id: string
          collection_source_id: number
          imported_at?: string
          source_evidence?: string
          source_hash: string
        }
        Update: {
          asset_id?: string
          capture_id?: string
          collection_source_id?: number
          imported_at?: string
          source_evidence?: string
          source_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "pmt_asset_collection_asset_fkey"
            columns: ["capture_id", "asset_id"]
            isOneToOne: false
            referencedRelation: "pmt_asset"
            referencedColumns: ["capture_id", "asset_id"]
          },
          {
            foreignKeyName: "pmt_asset_collection_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture"
            referencedColumns: ["capture_id"]
          },
          {
            foreignKeyName: "pmt_asset_collection_collection_fkey"
            columns: ["capture_id", "collection_source_id"]
            isOneToOne: false
            referencedRelation: "pmt_collection"
            referencedColumns: ["capture_id", "collection_source_id"]
          },
        ]
      }
      pmt_asset_franchise: {
        Row: {
          asset_id: string
          capture_id: string
          franchise_source_id: number
          imported_at: string
          source_evidence: string
          source_hash: string
        }
        Insert: {
          asset_id: string
          capture_id: string
          franchise_source_id: number
          imported_at?: string
          source_evidence?: string
          source_hash: string
        }
        Update: {
          asset_id?: string
          capture_id?: string
          franchise_source_id?: number
          imported_at?: string
          source_evidence?: string
          source_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "pmt_asset_franchise_asset_fkey"
            columns: ["capture_id", "asset_id"]
            isOneToOne: false
            referencedRelation: "pmt_asset"
            referencedColumns: ["capture_id", "asset_id"]
          },
          {
            foreignKeyName: "pmt_asset_franchise_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture"
            referencedColumns: ["capture_id"]
          },
          {
            foreignKeyName: "pmt_asset_franchise_franchise_fkey"
            columns: ["capture_id", "franchise_source_id"]
            isOneToOne: false
            referencedRelation: "pmt_franchise"
            referencedColumns: ["capture_id", "franchise_source_id"]
          },
        ]
      }
      pmt_asset_property: {
        Row: {
          asset_id: string
          capture_id: string
          imported_at: string
          property_source_id: number
          source_evidence: string
          source_hash: string
        }
        Insert: {
          asset_id: string
          capture_id: string
          imported_at?: string
          property_source_id: number
          source_evidence?: string
          source_hash: string
        }
        Update: {
          asset_id?: string
          capture_id?: string
          imported_at?: string
          property_source_id?: number
          source_evidence?: string
          source_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "pmt_asset_property_asset_fkey"
            columns: ["capture_id", "asset_id"]
            isOneToOne: false
            referencedRelation: "pmt_asset"
            referencedColumns: ["capture_id", "asset_id"]
          },
          {
            foreignKeyName: "pmt_asset_property_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture"
            referencedColumns: ["capture_id"]
          },
          {
            foreignKeyName: "pmt_asset_property_property_fkey"
            columns: ["capture_id", "property_source_id"]
            isOneToOne: false
            referencedRelation: "pmt_property"
            referencedColumns: ["capture_id", "property_source_id"]
          },
        ]
      }
      pmt_authorized_property_asset: {
        Row: {
          asset_id: string
          capture_id: string
          imported_at: string
          licensed_property_source_id: number
          source_evidence: string
          source_hash: string
        }
        Insert: {
          asset_id: string
          capture_id: string
          imported_at?: string
          licensed_property_source_id: number
          source_evidence?: string
          source_hash: string
        }
        Update: {
          asset_id?: string
          capture_id?: string
          imported_at?: string
          licensed_property_source_id?: number
          source_evidence?: string
          source_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "pmt_apa_asset_fkey"
            columns: ["capture_id", "asset_id"]
            isOneToOne: false
            referencedRelation: "pmt_asset"
            referencedColumns: ["capture_id", "asset_id"]
          },
          {
            foreignKeyName: "pmt_apa_property_fkey"
            columns: ["capture_id", "licensed_property_source_id"]
            isOneToOne: false
            referencedRelation: "pmt_property"
            referencedColumns: ["capture_id", "property_source_id"]
          },
          {
            foreignKeyName: "pmt_authorized_property_asset_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture"
            referencedColumns: ["capture_id"]
          },
        ]
      }
      pmt_authorized_title: {
        Row: {
          authorized_title_key: string
          authorized_title_name: string
          capture_id: string
          capture_status: string
          full_metadata_count: number
          imported_at: string
          notes: string | null
          resolved_property_count: number
          source_hash: string
          unique_asset_count: number
        }
        Insert: {
          authorized_title_key: string
          authorized_title_name: string
          capture_id: string
          capture_status: string
          full_metadata_count?: number
          imported_at?: string
          notes?: string | null
          resolved_property_count?: number
          source_hash: string
          unique_asset_count?: number
        }
        Update: {
          authorized_title_key?: string
          authorized_title_name?: string
          capture_id?: string
          capture_status?: string
          full_metadata_count?: number
          imported_at?: string
          notes?: string | null
          resolved_property_count?: number
          source_hash?: string
          unique_asset_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "pmt_authorized_title_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture"
            referencedColumns: ["capture_id"]
          },
        ]
      }
      pmt_authorized_title_property: {
        Row: {
          authorized_title_key: string
          capture_id: string
          imported_at: string
          mapping_status: string
          notes: string | null
          paramount_property_name: string
          property_source_id: number
          reported_asset_count: number
          source_evidence: string
          source_hash: string
        }
        Insert: {
          authorized_title_key: string
          capture_id: string
          imported_at?: string
          mapping_status?: string
          notes?: string | null
          paramount_property_name: string
          property_source_id: number
          reported_asset_count?: number
          source_evidence?: string
          source_hash: string
        }
        Update: {
          authorized_title_key?: string
          capture_id?: string
          imported_at?: string
          mapping_status?: string
          notes?: string | null
          paramount_property_name?: string
          property_source_id?: number
          reported_asset_count?: number
          source_evidence?: string
          source_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "pmt_authorized_title_property_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture"
            referencedColumns: ["capture_id"]
          },
          {
            foreignKeyName: "pmt_authorized_title_property_property_fkey"
            columns: ["capture_id", "property_source_id"]
            isOneToOne: false
            referencedRelation: "pmt_property"
            referencedColumns: ["capture_id", "property_source_id"]
          },
          {
            foreignKeyName: "pmt_authorized_title_property_title_fkey"
            columns: ["capture_id", "authorized_title_key"]
            isOneToOne: false
            referencedRelation: "pmt_authorized_title"
            referencedColumns: ["capture_id", "authorized_title_key"]
          },
        ]
      }
      pmt_brand: {
        Row: {
          brand_name: string
          brand_source_id: number
          capture_id: string
          imported_at: string
          raw: Json
          source_hash: string
        }
        Insert: {
          brand_name: string
          brand_source_id: number
          capture_id: string
          imported_at?: string
          raw?: Json
          source_hash: string
        }
        Update: {
          brand_name?: string
          brand_source_id?: number
          capture_id?: string
          imported_at?: string
          raw?: Json
          source_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "pmt_brand_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture"
            referencedColumns: ["capture_id"]
          },
        ]
      }
      pmt_capture: {
        Row: {
          anomaly_count: number
          capture_id: string
          capture_kind: string
          captured_by: string
          completed_at: string | null
          created_at: string
          failure_count: number
          failure_message: string | null
          library_name: string
          licensed_property_selection_count: number
          licensed_title_count: number
          manifest_sha256: string
          metadata_batch_count: number
          notes: string | null
          portal_global_asset_count: number
          private_source_commit: string
          property_result_row_count: number
          source_system: string
          source_url: string
          started_at: string
          status: string
          unique_asset_count: number
          updated_at: string
          validated_at: string | null
          validation_passed: boolean | null
        }
        Insert: {
          anomaly_count?: number
          capture_id?: string
          capture_kind: string
          captured_by: string
          completed_at?: string | null
          created_at?: string
          failure_count?: number
          failure_message?: string | null
          library_name: string
          licensed_property_selection_count: number
          licensed_title_count: number
          manifest_sha256: string
          metadata_batch_count: number
          notes?: string | null
          portal_global_asset_count: number
          private_source_commit: string
          property_result_row_count: number
          source_system?: string
          source_url: string
          started_at: string
          status?: string
          unique_asset_count: number
          updated_at?: string
          validated_at?: string | null
          validation_passed?: boolean | null
        }
        Update: {
          anomaly_count?: number
          capture_id?: string
          capture_kind?: string
          captured_by?: string
          completed_at?: string | null
          created_at?: string
          failure_count?: number
          failure_message?: string | null
          library_name?: string
          licensed_property_selection_count?: number
          licensed_title_count?: number
          manifest_sha256?: string
          metadata_batch_count?: number
          notes?: string | null
          portal_global_asset_count?: number
          private_source_commit?: string
          property_result_row_count?: number
          source_system?: string
          source_url?: string
          started_at?: string
          status?: string
          unique_asset_count?: number
          updated_at?: string
          validated_at?: string | null
          validation_passed?: boolean | null
        }
        Relationships: []
      }
      pmt_capture_batch: {
        Row: {
          batch_number: number
          capture_id: string
          captured_at: string
          complete: boolean
          content_was_json: boolean
          expected_asset_count: number
          failure_message: string | null
          first_asset_id: string
          http_status: number
          id_sets_matched: boolean
          imported_at: string
          last_asset_id: string
          requested_ids_sha256: string
          returned_asset_count: number
          returned_ids_sha256: string
          source_hash: string
        }
        Insert: {
          batch_number: number
          capture_id: string
          captured_at: string
          complete: boolean
          content_was_json: boolean
          expected_asset_count: number
          failure_message?: string | null
          first_asset_id: string
          http_status: number
          id_sets_matched: boolean
          imported_at?: string
          last_asset_id: string
          requested_ids_sha256: string
          returned_asset_count: number
          returned_ids_sha256: string
          source_hash: string
        }
        Update: {
          batch_number?: number
          capture_id?: string
          captured_at?: string
          complete?: boolean
          content_was_json?: boolean
          expected_asset_count?: number
          failure_message?: string | null
          first_asset_id?: string
          http_status?: number
          id_sets_matched?: boolean
          imported_at?: string
          last_asset_id?: string
          requested_ids_sha256?: string
          returned_asset_count?: number
          returned_ids_sha256?: string
          source_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "pmt_capture_batch_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture"
            referencedColumns: ["capture_id"]
          },
        ]
      }
      pmt_capture_expectation: {
        Row: {
          capture_id: string
          expected_count: number
          imported_at: string
          population: string
          source_hash: string
        }
        Insert: {
          capture_id: string
          expected_count: number
          imported_at?: string
          population: string
          source_hash: string
        }
        Update: {
          capture_id?: string
          expected_count?: number
          imported_at?: string
          population?: string
          source_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "pmt_capture_expectation_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture"
            referencedColumns: ["capture_id"]
          },
        ]
      }
      pmt_character: {
        Row: {
          capture_id: string
          character_name: string
          character_source_id: number
          core_character_id: string | null
          imported_at: string
          raw: Json
          resolution_reason: string | null
          resolution_status: string
          resolved_at: string | null
          resolved_by: string | null
          source_hash: string
        }
        Insert: {
          capture_id: string
          character_name: string
          character_source_id: number
          core_character_id?: string | null
          imported_at?: string
          raw?: Json
          resolution_reason?: string | null
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          source_hash: string
        }
        Update: {
          capture_id?: string
          character_name?: string
          character_source_id?: number
          core_character_id?: string | null
          imported_at?: string
          raw?: Json
          resolution_reason?: string | null
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          source_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "pmt_character_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture"
            referencedColumns: ["capture_id"]
          },
        ]
      }
      pmt_collection: {
        Row: {
          capture_id: string
          collection_name: string
          collection_source_id: number
          imported_at: string
          paramount_term: string
          raw: Json
          source_hash: string
        }
        Insert: {
          capture_id: string
          collection_name: string
          collection_source_id: number
          imported_at?: string
          paramount_term: string
          raw?: Json
          source_hash: string
        }
        Update: {
          capture_id?: string
          collection_name?: string
          collection_source_id?: number
          imported_at?: string
          paramount_term?: string
          raw?: Json
          source_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "pmt_collection_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture"
            referencedColumns: ["capture_id"]
          },
        ]
      }
      pmt_franchise: {
        Row: {
          capture_id: string
          franchise_name: string
          franchise_source_id: number
          imported_at: string
          raw: Json
          source_hash: string
        }
        Insert: {
          capture_id: string
          franchise_name: string
          franchise_source_id: number
          imported_at?: string
          raw?: Json
          source_hash: string
        }
        Update: {
          capture_id?: string
          franchise_name?: string
          franchise_source_id?: number
          imported_at?: string
          raw?: Json
          source_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "pmt_franchise_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture"
            referencedColumns: ["capture_id"]
          },
        ]
      }
      pmt_property: {
        Row: {
          capture_id: string
          core_property_id: string | null
          imported_at: string
          is_licensed_selection: boolean
          property_name: string
          property_source_id: number
          raw: Json
          resolution_reason: string | null
          resolution_status: string
          resolved_at: string | null
          resolved_by: string | null
          source_hash: string
        }
        Insert: {
          capture_id: string
          core_property_id?: string | null
          imported_at?: string
          is_licensed_selection?: boolean
          property_name: string
          property_source_id: number
          raw?: Json
          resolution_reason?: string | null
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          source_hash: string
        }
        Update: {
          capture_id?: string
          core_property_id?: string | null
          imported_at?: string
          is_licensed_selection?: boolean
          property_name?: string
          property_source_id?: number
          raw?: Json
          resolution_reason?: string | null
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          source_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "pmt_property_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture"
            referencedColumns: ["capture_id"]
          },
        ]
      }
      pmt_property_capture_log: {
        Row: {
          capture_id: string
          captured_asset_count: number
          complete: boolean
          failure_message: string | null
          imported_at: string
          page_count: number
          property_name: string
          property_source_id: number
          reported_asset_count: number
          source_hash: string
        }
        Insert: {
          capture_id: string
          captured_asset_count: number
          complete: boolean
          failure_message?: string | null
          imported_at?: string
          page_count: number
          property_name: string
          property_source_id: number
          reported_asset_count: number
          source_hash: string
        }
        Update: {
          capture_id?: string
          captured_asset_count?: number
          complete?: boolean
          failure_message?: string | null
          imported_at?: string
          page_count?: number
          property_name?: string
          property_source_id?: number
          reported_asset_count?: number
          source_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "pmt_pcl_property_fkey"
            columns: ["capture_id", "property_source_id"]
            isOneToOne: true
            referencedRelation: "pmt_property"
            referencedColumns: ["capture_id", "property_source_id"]
          },
          {
            foreignKeyName: "pmt_property_capture_log_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture"
            referencedColumns: ["capture_id"]
          },
        ]
      }
      pmt_property_character: {
        Row: {
          capture_id: string
          character_source_id: number
          evidence_asset_count: number
          imported_at: string
          property_source_id: number
          source_evidence: string
          source_hash: string
        }
        Insert: {
          capture_id: string
          character_source_id: number
          evidence_asset_count?: number
          imported_at?: string
          property_source_id: number
          source_evidence?: string
          source_hash: string
        }
        Update: {
          capture_id?: string
          character_source_id?: number
          evidence_asset_count?: number
          imported_at?: string
          property_source_id?: number
          source_evidence?: string
          source_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "pmt_property_character_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture"
            referencedColumns: ["capture_id"]
          },
          {
            foreignKeyName: "pmt_property_character_character_fkey"
            columns: ["capture_id", "character_source_id"]
            isOneToOne: false
            referencedRelation: "pmt_character"
            referencedColumns: ["capture_id", "character_source_id"]
          },
          {
            foreignKeyName: "pmt_property_character_property_fkey"
            columns: ["capture_id", "property_source_id"]
            isOneToOne: false
            referencedRelation: "pmt_property"
            referencedColumns: ["capture_id", "property_source_id"]
          },
        ]
      }
      pmt_property_collection: {
        Row: {
          capture_id: string
          collection_source_id: number
          evidence_asset_count: number
          imported_at: string
          property_source_id: number
          source_evidence: string
          source_hash: string
        }
        Insert: {
          capture_id: string
          collection_source_id: number
          evidence_asset_count?: number
          imported_at?: string
          property_source_id: number
          source_evidence?: string
          source_hash: string
        }
        Update: {
          capture_id?: string
          collection_source_id?: number
          evidence_asset_count?: number
          imported_at?: string
          property_source_id?: number
          source_evidence?: string
          source_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "pmt_property_collection_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture"
            referencedColumns: ["capture_id"]
          },
          {
            foreignKeyName: "pmt_property_collection_collection_fkey"
            columns: ["capture_id", "collection_source_id"]
            isOneToOne: false
            referencedRelation: "pmt_collection"
            referencedColumns: ["capture_id", "collection_source_id"]
          },
          {
            foreignKeyName: "pmt_property_collection_property_fkey"
            columns: ["capture_id", "property_source_id"]
            isOneToOne: false
            referencedRelation: "pmt_property"
            referencedColumns: ["capture_id", "property_source_id"]
          },
        ]
      }
      pmt_property_franchise_evidence: {
        Row: {
          capture_id: string
          evidence_asset_count: number
          evidence_kind: string
          franchise_source_id: number
          imported_at: string
          is_direct_source_relationship: boolean
          property_source_id: number
          source_hash: string
        }
        Insert: {
          capture_id: string
          evidence_asset_count?: number
          evidence_kind?: string
          franchise_source_id: number
          imported_at?: string
          is_direct_source_relationship?: boolean
          property_source_id: number
          source_hash: string
        }
        Update: {
          capture_id?: string
          evidence_asset_count?: number
          evidence_kind?: string
          franchise_source_id?: number
          imported_at?: string
          is_direct_source_relationship?: boolean
          property_source_id?: number
          source_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "pmt_pfe_franchise_fkey"
            columns: ["capture_id", "franchise_source_id"]
            isOneToOne: false
            referencedRelation: "pmt_franchise"
            referencedColumns: ["capture_id", "franchise_source_id"]
          },
          {
            foreignKeyName: "pmt_pfe_property_fkey"
            columns: ["capture_id", "property_source_id"]
            isOneToOne: false
            referencedRelation: "pmt_property"
            referencedColumns: ["capture_id", "property_source_id"]
          },
          {
            foreignKeyName: "pmt_property_franchise_evidence_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture"
            referencedColumns: ["capture_id"]
          },
        ]
      }
      pmt_relationship_anomaly: {
        Row: {
          action: string
          anomaly_id: number
          asset_id: string
          capture_id: string
          details: string | null
          imported_at: string
          raw_value: string
          relationship_field: string
          source_hash: string
        }
        Insert: {
          action: string
          anomaly_id?: never
          asset_id: string
          capture_id: string
          details?: string | null
          imported_at?: string
          raw_value: string
          relationship_field: string
          source_hash: string
        }
        Update: {
          action?: string
          anomaly_id?: never
          asset_id?: string
          capture_id?: string
          details?: string | null
          imported_at?: string
          raw_value?: string
          relationship_field?: string
          source_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "pmt_relationship_anomaly_asset_fkey"
            columns: ["capture_id", "asset_id"]
            isOneToOne: false
            referencedRelation: "pmt_asset"
            referencedColumns: ["capture_id", "asset_id"]
          },
          {
            foreignKeyName: "pmt_relationship_anomaly_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture"
            referencedColumns: ["capture_id"]
          },
        ]
      }
      pmt_shrink_override: {
        Row: {
          approved_at: string
          approver: string
          capture_id: string
          compared_capture_id: string
          created_at: string
          new_count: number
          old_count: number
          operator: string
          override_id: number
          population: string
          reason: string
        }
        Insert: {
          approved_at: string
          approver: string
          capture_id: string
          compared_capture_id: string
          created_at?: string
          new_count: number
          old_count: number
          operator: string
          override_id?: never
          population: string
          reason: string
        }
        Update: {
          approved_at?: string
          approver?: string
          capture_id?: string
          compared_capture_id?: string
          created_at?: string
          new_count?: number
          old_count?: number
          operator?: string
          override_id?: never
          population?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "pmt_shrink_override_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture"
            referencedColumns: ["capture_id"]
          },
          {
            foreignKeyName: "pmt_shrink_override_compared_capture_id_fkey"
            columns: ["compared_capture_id"]
            isOneToOne: false
            referencedRelation: "pmt_capture"
            referencedColumns: ["capture_id"]
          },
        ]
      }
      ProdOrderDetail: {
        Row: {
          AllocatableWip: string | null
          BOMFKey: number | null
          CancelledQty: number | null
          colorCode: string | null
          CompanyCode: string | null
          ContainerDtlFkey: number | null
          ContainerFkey: number | null
          CostSheetFkey: number | null
          createdTime: string | null
          createdUser: string | null
          CustomerCode: string | null
          CustPONumber: string | null
          dimCode: string | null
          DivisionCode: string | null
          DueDate: string | null
          EDI943Proc: string | null
          id: number
          itemDesc: string | null
          itemNo: string | null
          itemPkey: number | null
          labelCode: string | null
          merchGroup05Desc: string | null
          modTime: string | null
          modUser: string | null
          MovedQty: number | null
          OrigDueDate: string | null
          OrigShipCancelDate: string | null
          OrigShipDate: string | null
          pkey: number
          prepackCode: string | null
          ProdCost: number | null
          ProdLineFkey: number | null
          prodLineSeq: number | null
          ProdOrderCancelType: string | null
          prodOrderNo: string | null
          prodQty: number | null
          ProdSeq: number | null
          ReceiveFkey: number | null
          RecvDtlFkey: number | null
          SalesOrderFkey: number | null
          SalesOrderNo: number | null
          ShipCancelDate: string | null
          ShipDate: string | null
          ShipmentFkey: number | null
          sizeCode: string | null
          SizeExplosionCode: string | null
          StageCode: string | null
          StageSeq: number | null
          UDF01: string | null
          UOMCode: string | null
          VendorCode: string | null
          VendorInvoiceFKey: number | null
          WarehouseCode: string | null
          wipQty: number | null
        }
        Insert: {
          AllocatableWip?: string | null
          BOMFKey?: number | null
          CancelledQty?: number | null
          colorCode?: string | null
          CompanyCode?: string | null
          ContainerDtlFkey?: number | null
          ContainerFkey?: number | null
          CostSheetFkey?: number | null
          createdTime?: string | null
          createdUser?: string | null
          CustomerCode?: string | null
          CustPONumber?: string | null
          dimCode?: string | null
          DivisionCode?: string | null
          DueDate?: string | null
          EDI943Proc?: string | null
          id?: never
          itemDesc?: string | null
          itemNo?: string | null
          itemPkey?: number | null
          labelCode?: string | null
          merchGroup05Desc?: string | null
          modTime?: string | null
          modUser?: string | null
          MovedQty?: number | null
          OrigDueDate?: string | null
          OrigShipCancelDate?: string | null
          OrigShipDate?: string | null
          pkey: number
          prepackCode?: string | null
          ProdCost?: number | null
          ProdLineFkey?: number | null
          prodLineSeq?: number | null
          ProdOrderCancelType?: string | null
          prodOrderNo?: string | null
          prodQty?: number | null
          ProdSeq?: number | null
          ReceiveFkey?: number | null
          RecvDtlFkey?: number | null
          SalesOrderFkey?: number | null
          SalesOrderNo?: number | null
          ShipCancelDate?: string | null
          ShipDate?: string | null
          ShipmentFkey?: number | null
          sizeCode?: string | null
          SizeExplosionCode?: string | null
          StageCode?: string | null
          StageSeq?: number | null
          UDF01?: string | null
          UOMCode?: string | null
          VendorCode?: string | null
          VendorInvoiceFKey?: number | null
          WarehouseCode?: string | null
          wipQty?: number | null
        }
        Update: {
          AllocatableWip?: string | null
          BOMFKey?: number | null
          CancelledQty?: number | null
          colorCode?: string | null
          CompanyCode?: string | null
          ContainerDtlFkey?: number | null
          ContainerFkey?: number | null
          CostSheetFkey?: number | null
          createdTime?: string | null
          createdUser?: string | null
          CustomerCode?: string | null
          CustPONumber?: string | null
          dimCode?: string | null
          DivisionCode?: string | null
          DueDate?: string | null
          EDI943Proc?: string | null
          id?: never
          itemDesc?: string | null
          itemNo?: string | null
          itemPkey?: number | null
          labelCode?: string | null
          merchGroup05Desc?: string | null
          modTime?: string | null
          modUser?: string | null
          MovedQty?: number | null
          OrigDueDate?: string | null
          OrigShipCancelDate?: string | null
          OrigShipDate?: string | null
          pkey?: number
          prepackCode?: string | null
          ProdCost?: number | null
          ProdLineFkey?: number | null
          prodLineSeq?: number | null
          ProdOrderCancelType?: string | null
          prodOrderNo?: string | null
          prodQty?: number | null
          ProdSeq?: number | null
          ReceiveFkey?: number | null
          RecvDtlFkey?: number | null
          SalesOrderFkey?: number | null
          SalesOrderNo?: number | null
          ShipCancelDate?: string | null
          ShipDate?: string | null
          ShipmentFkey?: number | null
          sizeCode?: string | null
          SizeExplosionCode?: string | null
          StageCode?: string | null
          StageSeq?: number | null
          UDF01?: string | null
          UOMCode?: string | null
          VendorCode?: string | null
          VendorInvoiceFKey?: number | null
          WarehouseCode?: string | null
          wipQty?: number | null
        }
        Relationships: []
      }
      ProdOrderHeader: {
        Row: {
          actual_etd: string | null
          actual_prod_complete: string | null
          actual_prod_start: string | null
          actual_Whse_eta: string | null
          adjusted_cust_start_date: string | null
          agentProc: string | null
          agentProcDate: string | null
          aPTransactionNo: string | null
          arrivalPortCode: string | null
          assembly_start_date: string | null
          booking_number: string | null
          buyer_approval_date: string | null
          cal_arrival_date: string | null
          calculate_fob_delivery: string | null
          carrierCode: string | null
          cbm: string | null
          comment: string | null
          companyCode: string | null
          conditions_not_met: string | null
          container_recvd: string | null
          containerNo: string | null
          createdTime: string | null
          createdUser: string | null
          currencyCode: string | null
          cust_cxl: string | null
          cust_order_date: string | null
          cust_start: string | null
          customerCode: string | null
          customerPONo: string | null
          cutterCode: string | null
          depositAmount: string | null
          depositBalance: string | null
          depositDate: string | null
          depositPaid: string | null
          depositPosted: string | null
          discountPerc: string | null
          dlvy_loc_fk: number | null
          doc_athome: boolean | null
          doc_bl: boolean | null
          doc_ctpat: boolean | null
          doc_fcr: boolean | null
          doc_inv: boolean | null
          doc_pl: boolean | null
          doc_qc: boolean | null
          doc_tsca: boolean | null
          dueDate: string | null
          exchangeRatePkey: string | null
          factory_committed_prod_start: string | null
          forwarderProc: string | null
          forwarderProcDate: string | null
          freight_forwarder_name: string | null
          freightForwarderCode: string | null
          ftySalesRep: string | null
          hangTagOrderedDate: string | null
          hangTagReceived: string | null
          hangTagReceivedDate: string | null
          hangTagsOrdered: string | null
          id: number
          inspection_comment: string | null
          inspection_result: string | null
          inspection_start_date: string | null
          item_not_prepro_approved: string | null
          lcno: string | null
          mass_prod_start_date: string | null
          massProductionDays: string | null
          material_arrival_date: string | null
          mg5: string | null
          modtime: string | null
          modUser: string | null
          num_docs: string | null
          ok_to_pay_date: string | null
          origDueDate: string | null
          origShipCancelDate: string | null
          origShipDate: string | null
          packing_start_date: string | null
          paid_date: string | null
          payTermCode: string | null
          photo_needed: boolean | null
          photo_recived: boolean | null
          postedDate: string | null
          prepro_approval_date: string | null
          price_ticket_needed: boolean | null
          printed: string | null
          prod_cost: string | null
          prodCostType: string | null
          prodCountry: string | null
          prodOrderDate: string | null
          prodOrderNo: string
          prodPrinterCode: string | null
          prodQty: number | null
          prodReferenceNo: string | null
          prodRevDate: string | null
          prodRevNo: string | null
          prodTypeCode: string | null
          qc_inspection_date: string | null
          safety_test_date: string | null
          safety_test_needed: boolean | null
          safety_test_passed: boolean | null
          salesOrderNo: string | null
          sample_aprov_lead_days: string | null
          sample_start_date: string | null
          seasonCode: string | null
          sent_po_date: string | null
          sewerCode: string | null
          shipCancelDate: string | null
          shipDate: string | null
          shipPortCode: string | null
          shipViaCode: string | null
          svn: string | null
          ticket_order_date: string | null
          ticket_tracking_number: string | null
          tickets_receive_date: string | null
          uDF01: string | null
          uDFDate01: string | null
          uDFDate02: string | null
          udfnum01: string | null
          vendor_comment: string | null
          vendor_start_date: string | null
          vendorCode: string | null
          vendorConfirm: string | null
          vendorConfirmDate: string | null
          vendorProc: string | null
          vendorProcDate: string | null
          warehouseCode: string | null
        }
        Insert: {
          actual_etd?: string | null
          actual_prod_complete?: string | null
          actual_prod_start?: string | null
          actual_Whse_eta?: string | null
          adjusted_cust_start_date?: string | null
          agentProc?: string | null
          agentProcDate?: string | null
          aPTransactionNo?: string | null
          arrivalPortCode?: string | null
          assembly_start_date?: string | null
          booking_number?: string | null
          buyer_approval_date?: string | null
          cal_arrival_date?: string | null
          calculate_fob_delivery?: string | null
          carrierCode?: string | null
          cbm?: string | null
          comment?: string | null
          companyCode?: string | null
          conditions_not_met?: string | null
          container_recvd?: string | null
          containerNo?: string | null
          createdTime?: string | null
          createdUser?: string | null
          currencyCode?: string | null
          cust_cxl?: string | null
          cust_order_date?: string | null
          cust_start?: string | null
          customerCode?: string | null
          customerPONo?: string | null
          cutterCode?: string | null
          depositAmount?: string | null
          depositBalance?: string | null
          depositDate?: string | null
          depositPaid?: string | null
          depositPosted?: string | null
          discountPerc?: string | null
          dlvy_loc_fk?: number | null
          doc_athome?: boolean | null
          doc_bl?: boolean | null
          doc_ctpat?: boolean | null
          doc_fcr?: boolean | null
          doc_inv?: boolean | null
          doc_pl?: boolean | null
          doc_qc?: boolean | null
          doc_tsca?: boolean | null
          dueDate?: string | null
          exchangeRatePkey?: string | null
          factory_committed_prod_start?: string | null
          forwarderProc?: string | null
          forwarderProcDate?: string | null
          freight_forwarder_name?: string | null
          freightForwarderCode?: string | null
          ftySalesRep?: string | null
          hangTagOrderedDate?: string | null
          hangTagReceived?: string | null
          hangTagReceivedDate?: string | null
          hangTagsOrdered?: string | null
          id?: never
          inspection_comment?: string | null
          inspection_result?: string | null
          inspection_start_date?: string | null
          item_not_prepro_approved?: string | null
          lcno?: string | null
          mass_prod_start_date?: string | null
          massProductionDays?: string | null
          material_arrival_date?: string | null
          mg5?: string | null
          modtime?: string | null
          modUser?: string | null
          num_docs?: string | null
          ok_to_pay_date?: string | null
          origDueDate?: string | null
          origShipCancelDate?: string | null
          origShipDate?: string | null
          packing_start_date?: string | null
          paid_date?: string | null
          payTermCode?: string | null
          photo_needed?: boolean | null
          photo_recived?: boolean | null
          postedDate?: string | null
          prepro_approval_date?: string | null
          price_ticket_needed?: boolean | null
          printed?: string | null
          prod_cost?: string | null
          prodCostType?: string | null
          prodCountry?: string | null
          prodOrderDate?: string | null
          prodOrderNo: string
          prodPrinterCode?: string | null
          prodQty?: number | null
          prodReferenceNo?: string | null
          prodRevDate?: string | null
          prodRevNo?: string | null
          prodTypeCode?: string | null
          qc_inspection_date?: string | null
          safety_test_date?: string | null
          safety_test_needed?: boolean | null
          safety_test_passed?: boolean | null
          salesOrderNo?: string | null
          sample_aprov_lead_days?: string | null
          sample_start_date?: string | null
          seasonCode?: string | null
          sent_po_date?: string | null
          sewerCode?: string | null
          shipCancelDate?: string | null
          shipDate?: string | null
          shipPortCode?: string | null
          shipViaCode?: string | null
          svn?: string | null
          ticket_order_date?: string | null
          ticket_tracking_number?: string | null
          tickets_receive_date?: string | null
          uDF01?: string | null
          uDFDate01?: string | null
          uDFDate02?: string | null
          udfnum01?: string | null
          vendor_comment?: string | null
          vendor_start_date?: string | null
          vendorCode?: string | null
          vendorConfirm?: string | null
          vendorConfirmDate?: string | null
          vendorProc?: string | null
          vendorProcDate?: string | null
          warehouseCode?: string | null
        }
        Update: {
          actual_etd?: string | null
          actual_prod_complete?: string | null
          actual_prod_start?: string | null
          actual_Whse_eta?: string | null
          adjusted_cust_start_date?: string | null
          agentProc?: string | null
          agentProcDate?: string | null
          aPTransactionNo?: string | null
          arrivalPortCode?: string | null
          assembly_start_date?: string | null
          booking_number?: string | null
          buyer_approval_date?: string | null
          cal_arrival_date?: string | null
          calculate_fob_delivery?: string | null
          carrierCode?: string | null
          cbm?: string | null
          comment?: string | null
          companyCode?: string | null
          conditions_not_met?: string | null
          container_recvd?: string | null
          containerNo?: string | null
          createdTime?: string | null
          createdUser?: string | null
          currencyCode?: string | null
          cust_cxl?: string | null
          cust_order_date?: string | null
          cust_start?: string | null
          customerCode?: string | null
          customerPONo?: string | null
          cutterCode?: string | null
          depositAmount?: string | null
          depositBalance?: string | null
          depositDate?: string | null
          depositPaid?: string | null
          depositPosted?: string | null
          discountPerc?: string | null
          dlvy_loc_fk?: number | null
          doc_athome?: boolean | null
          doc_bl?: boolean | null
          doc_ctpat?: boolean | null
          doc_fcr?: boolean | null
          doc_inv?: boolean | null
          doc_pl?: boolean | null
          doc_qc?: boolean | null
          doc_tsca?: boolean | null
          dueDate?: string | null
          exchangeRatePkey?: string | null
          factory_committed_prod_start?: string | null
          forwarderProc?: string | null
          forwarderProcDate?: string | null
          freight_forwarder_name?: string | null
          freightForwarderCode?: string | null
          ftySalesRep?: string | null
          hangTagOrderedDate?: string | null
          hangTagReceived?: string | null
          hangTagReceivedDate?: string | null
          hangTagsOrdered?: string | null
          id?: never
          inspection_comment?: string | null
          inspection_result?: string | null
          inspection_start_date?: string | null
          item_not_prepro_approved?: string | null
          lcno?: string | null
          mass_prod_start_date?: string | null
          massProductionDays?: string | null
          material_arrival_date?: string | null
          mg5?: string | null
          modtime?: string | null
          modUser?: string | null
          num_docs?: string | null
          ok_to_pay_date?: string | null
          origDueDate?: string | null
          origShipCancelDate?: string | null
          origShipDate?: string | null
          packing_start_date?: string | null
          paid_date?: string | null
          payTermCode?: string | null
          photo_needed?: boolean | null
          photo_recived?: boolean | null
          postedDate?: string | null
          prepro_approval_date?: string | null
          price_ticket_needed?: boolean | null
          printed?: string | null
          prod_cost?: string | null
          prodCostType?: string | null
          prodCountry?: string | null
          prodOrderDate?: string | null
          prodOrderNo?: string
          prodPrinterCode?: string | null
          prodQty?: number | null
          prodReferenceNo?: string | null
          prodRevDate?: string | null
          prodRevNo?: string | null
          prodTypeCode?: string | null
          qc_inspection_date?: string | null
          safety_test_date?: string | null
          safety_test_needed?: boolean | null
          safety_test_passed?: boolean | null
          salesOrderNo?: string | null
          sample_aprov_lead_days?: string | null
          sample_start_date?: string | null
          seasonCode?: string | null
          sent_po_date?: string | null
          sewerCode?: string | null
          shipCancelDate?: string | null
          shipDate?: string | null
          shipPortCode?: string | null
          shipViaCode?: string | null
          svn?: string | null
          ticket_order_date?: string | null
          ticket_tracking_number?: string | null
          tickets_receive_date?: string | null
          uDF01?: string | null
          uDFDate01?: string | null
          uDFDate02?: string | null
          udfnum01?: string | null
          vendor_comment?: string | null
          vendor_start_date?: string | null
          vendorCode?: string | null
          vendorConfirm?: string | null
          vendorConfirmDate?: string | null
          vendorProc?: string | null
          vendorProcDate?: string | null
          warehouseCode?: string | null
        }
        Relationships: []
      }
      ProdPaymentTerms: {
        Row: {
          CompanyCode: string | null
          id: number | null
          PaymentCutOffDay: string | null
          PaymentDiscDays: string | null
          PaymentDueDays: string | null
          PaymentFixedDueDay: string | null
          PaymentTermType: string | null
          PayTermCode: string | null
          PayTermDesc: string | null
        }
        Insert: {
          CompanyCode?: string | null
          id?: number | null
          PaymentCutOffDay?: string | null
          PaymentDiscDays?: string | null
          PaymentDueDays?: string | null
          PaymentFixedDueDay?: string | null
          PaymentTermType?: string | null
          PayTermCode?: string | null
          PayTermDesc?: string | null
        }
        Update: {
          CompanyCode?: string | null
          id?: number | null
          PaymentCutOffDay?: string | null
          PaymentDiscDays?: string | null
          PaymentDueDays?: string | null
          PaymentFixedDueDay?: string | null
          PaymentTermType?: string | null
          PayTermCode?: string | null
          PayTermDesc?: string | null
        }
        Relationships: []
      }
      ProdShipmentTransitTime: {
        Row: {
          ArrivalPortCode: string | null
          ArrivalTransitTime: string | null
          CompanyCode: string | null
          id: number
          ShipPortCode: string | null
          WarehouseCode: string | null
          WhseTransitTime: string | null
        }
        Insert: {
          ArrivalPortCode?: string | null
          ArrivalTransitTime?: string | null
          CompanyCode?: string | null
          id?: never
          ShipPortCode?: string | null
          WarehouseCode?: string | null
          WhseTransitTime?: string | null
        }
        Update: {
          ArrivalPortCode?: string | null
          ArrivalTransitTime?: string | null
          CompanyCode?: string | null
          id?: never
          ShipPortCode?: string | null
          WarehouseCode?: string | null
          WhseTransitTime?: string | null
        }
        Relationships: []
      }
      production_lane_canary: {
        Row: {
          applied_at: string
          applied_by: string
          id: number
          note: string
        }
        Insert: {
          applied_at?: string
          applied_by?: string
          id?: never
          note: string
        }
        Update: {
          applied_at?: string
          applied_by?: string
          id?: never
          note?: string
        }
        Relationships: []
      }
      production_order: {
        Row: {
          actual_ship_date: string | null
          booking_state: string | null
          close_tracking: boolean
          company_id: string | null
          container_booking_group: string | null
          created_at: string
          eta: string | null
          etd: string | null
          factory_id: string | null
          id: string
          mbl: string | null
          metadata: Json
          order_date: string | null
          production_order_number: string
          requested_ship_date: string | null
          seal_container_date: string | null
          sent_po_date: string | null
          source_id: string | null
          source_system: string | null
          status: string | null
          updated_at: string
          vendor_delivery_date: string | null
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
          warehouse_date: string | null
        }
        Insert: {
          actual_ship_date?: string | null
          booking_state?: string | null
          close_tracking?: boolean
          company_id?: string | null
          container_booking_group?: string | null
          created_at?: string
          eta?: string | null
          etd?: string | null
          factory_id?: string | null
          id?: string
          mbl?: string | null
          metadata?: Json
          order_date?: string | null
          production_order_number: string
          requested_ship_date?: string | null
          seal_container_date?: string | null
          sent_po_date?: string | null
          source_id?: string | null
          source_system?: string | null
          status?: string | null
          updated_at?: string
          vendor_delivery_date?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
          warehouse_date?: string | null
        }
        Update: {
          actual_ship_date?: string | null
          booking_state?: string | null
          close_tracking?: boolean
          company_id?: string | null
          container_booking_group?: string | null
          created_at?: string
          eta?: string | null
          etd?: string | null
          factory_id?: string | null
          id?: string
          mbl?: string | null
          metadata?: Json
          order_date?: string | null
          production_order_number?: string
          requested_ship_date?: string | null
          seal_container_date?: string | null
          sent_po_date?: string | null
          source_id?: string | null
          source_system?: string | null
          status?: string | null
          updated_at?: string
          vendor_delivery_date?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
          warehouse_date?: string | null
        }
        Relationships: []
      }
      production_order_line: {
        Row: {
          assortment_component_ordinal: number | null
          assortment_id: string | null
          cancel_date: string | null
          cancel_raw: string | null
          cargo_forecast_date: string | null
          cargo_forecast_raw: string | null
          case_pack: number | null
          cases_reported: number | null
          contractual_sample_reorder: boolean
          created_at: string
          customer_po_number: string | null
          customer_suffix: string | null
          id: string
          item_id: string | null
          line_number: string | null
          master_data_match_status: string
          metadata: Json
          order_depth_inches: number | null
          order_person: string | null
          order_type: string | null
          production_order_id: string
          professional_photos: string | null
          quantity_ordered: number | null
          quantity_shipped: number | null
          ship_to: string | null
          sku: string | null
          sku_normalized: string | null
          source_id: string | null
          source_style_type: string | null
          source_system: string | null
          start_ship_date: string | null
          start_ship_raw: string | null
          status: string | null
          test_report: string | null
          unit_cost: number | null
          updated_at: string
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          assortment_component_ordinal?: number | null
          assortment_id?: string | null
          cancel_date?: string | null
          cancel_raw?: string | null
          cargo_forecast_date?: string | null
          cargo_forecast_raw?: string | null
          case_pack?: number | null
          cases_reported?: number | null
          contractual_sample_reorder?: boolean
          created_at?: string
          customer_po_number?: string | null
          customer_suffix?: string | null
          id?: string
          item_id?: string | null
          line_number?: string | null
          master_data_match_status?: string
          metadata?: Json
          order_depth_inches?: number | null
          order_person?: string | null
          order_type?: string | null
          production_order_id: string
          professional_photos?: string | null
          quantity_ordered?: number | null
          quantity_shipped?: number | null
          ship_to?: string | null
          sku?: string | null
          sku_normalized?: string | null
          source_id?: string | null
          source_style_type?: string | null
          source_system?: string | null
          start_ship_date?: string | null
          start_ship_raw?: string | null
          status?: string | null
          test_report?: string | null
          unit_cost?: number | null
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          assortment_component_ordinal?: number | null
          assortment_id?: string | null
          cancel_date?: string | null
          cancel_raw?: string | null
          cargo_forecast_date?: string | null
          cargo_forecast_raw?: string | null
          case_pack?: number | null
          cases_reported?: number | null
          contractual_sample_reorder?: boolean
          created_at?: string
          customer_po_number?: string | null
          customer_suffix?: string | null
          id?: string
          item_id?: string | null
          line_number?: string | null
          master_data_match_status?: string
          metadata?: Json
          order_depth_inches?: number | null
          order_person?: string | null
          order_type?: string | null
          production_order_id?: string
          professional_photos?: string | null
          quantity_ordered?: number | null
          quantity_shipped?: number | null
          ship_to?: string | null
          sku?: string | null
          sku_normalized?: string | null
          source_id?: string | null
          source_style_type?: string | null
          source_system?: string | null
          start_ship_date?: string | null
          start_ship_raw?: string | null
          status?: string | null
          test_report?: string | null
          unit_cost?: number | null
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_order_line_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_line_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_order"
            referencedColumns: ["id"]
          },
        ]
      }
      production_order_line_source_ref: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          metadata: Json
          production_order_line_id: string
          source_id: string
          source_system: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          metadata?: Json
          production_order_line_id: string
          source_id: string
          source_system: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          metadata?: Json
          production_order_line_id?: string
          source_id?: string
          source_system?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_order_line_source_ref_production_order_line_id_fkey"
            columns: ["production_order_line_id"]
            isOneToOne: false
            referencedRelation: "production_order_line"
            referencedColumns: ["id"]
          },
        ]
      }
      production_order_source_ref: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          metadata: Json
          production_order_id: string
          source_id: string
          source_system: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          metadata?: Json
          production_order_id: string
          source_id: string
          source_system: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          metadata?: Json
          production_order_id?: string
          source_id?: string
          source_system?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_order_source_ref_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_order"
            referencedColumns: ["id"]
          },
        ]
      }
      ProductNickname: {
        Row: {
          art_source_id_fk: number | null
          artist_id_fk: number | null
          construction_id_fk: number | null
          demographic_id_fk: number | null
          feature_id_fk: number | null
          group_id_fk: number | null
          id: number
          licensor_id_fk: number | null
          material_id_fk: number | null
          nickname: string
          property_id_fk: number | null
          size_id_fk: number | null
          sub_format_id_fk: number | null
          treatment_id_fk: number | null
        }
        Insert: {
          art_source_id_fk?: number | null
          artist_id_fk?: number | null
          construction_id_fk?: number | null
          demographic_id_fk?: number | null
          feature_id_fk?: number | null
          group_id_fk?: number | null
          id?: number
          licensor_id_fk?: number | null
          material_id_fk?: number | null
          nickname: string
          property_id_fk?: number | null
          size_id_fk?: number | null
          sub_format_id_fk?: number | null
          treatment_id_fk?: number | null
        }
        Update: {
          art_source_id_fk?: number | null
          artist_id_fk?: number | null
          construction_id_fk?: number | null
          demographic_id_fk?: number | null
          feature_id_fk?: number | null
          group_id_fk?: number | null
          id?: number
          licensor_id_fk?: number | null
          material_id_fk?: number | null
          nickname?: string
          property_id_fk?: number | null
          size_id_fk?: number | null
          sub_format_id_fk?: number | null
          treatment_id_fk?: number | null
        }
        Relationships: []
      }
      productUserAssignment: {
        Row: {
          created_by_fk: number | null
          created_date: string
          id: number
          item_id_fk: number
          role: string
          updated_by_fk: number | null
          updated_date: string
          user_id_fk: number
        }
        Insert: {
          created_by_fk?: number | null
          created_date: string
          id?: number
          item_id_fk: number
          role: string
          updated_by_fk?: number | null
          updated_date: string
          user_id_fk: number
        }
        Update: {
          created_by_fk?: number | null
          created_date?: string
          id?: number
          item_id_fk?: number
          role?: string
          updated_by_fk?: number | null
          updated_date?: string
          user_id_fk?: number
        }
        Relationships: [
          {
            foreignKeyName: "productUserAssignment_item_id_fk_fkey"
            columns: ["item_id_fk"]
            isOneToOne: false
            referencedRelation: "itemHeader"
            referencedColumns: ["item_id_pk"]
          },
        ]
      }
      property_import: {
        Row: {
          division_code: string | null
          imported_at: string
          licensor_id: string | null
          mg_category: string | null
          mg_code: string | null
          mg_code2: string | null
          parent_id: string | null
          plm_parent_licensor_id: string | null
          plm_property_id: string
          property_id: string
          raw: Json
          title: string
          updated_at: string
        }
        Insert: {
          division_code?: string | null
          imported_at?: string
          licensor_id?: string | null
          mg_category?: string | null
          mg_code?: string | null
          mg_code2?: string | null
          parent_id?: string | null
          plm_parent_licensor_id?: string | null
          plm_property_id: string
          property_id: string
          raw?: Json
          title: string
          updated_at?: string
        }
        Update: {
          division_code?: string | null
          imported_at?: string
          licensor_id?: string | null
          mg_category?: string | null
          mg_code?: string | null
          mg_code2?: string | null
          parent_id?: string | null
          plm_parent_licensor_id?: string | null
          plm_property_id?: string
          property_id?: string
          raw?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      reference_value: {
        Row: {
          code: string | null
          created_at: string
          family: string
          id: string
          metadata: Json
          name: string
          source_id: string | null
          source_system: string | null
          source_table: string | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          family: string
          id?: string
          metadata?: Json
          name: string
          source_id?: string | null
          source_system?: string | null
          source_table?: string | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          family?: string
          id?: string
          metadata?: Json
          name?: string
          source_id?: string | null
          source_system?: string | null
          source_table?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rfq_group: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          metadata: Json
          name: string | null
          source_id: string | null
          source_system: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          name?: string | null
          source_id?: string | null
          source_system?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          name?: string | null
          source_id?: string | null
          source_system?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rfq_item: {
        Row: {
          created_at: string
          id: string
          item_id: string | null
          metadata: Json
          rfq_group_id: string | null
          source_id: string | null
          source_system: string | null
          status: string | null
          target_cost: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id?: string | null
          metadata?: Json
          rfq_group_id?: string | null
          source_id?: string | null
          source_system?: string | null
          status?: string | null
          target_cost?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string | null
          metadata?: Json
          rfq_group_id?: string | null
          source_id?: string | null
          source_system?: string | null
          status?: string | null
          target_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_item_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_item_rfq_group_id_fkey"
            columns: ["rfq_group_id"]
            isOneToOne: false
            referencedRelation: "rfq_group"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_vendor: {
        Row: {
          created_at: string
          factory_id: string | null
          id: string
          metadata: Json
          rfq_group_id: string | null
          source_id: string | null
          source_system: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          factory_id?: string | null
          id?: string
          metadata?: Json
          rfq_group_id?: string | null
          source_id?: string | null
          source_system?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          factory_id?: string | null
          id?: string
          metadata?: Json
          rfq_group_id?: string | null
          source_id?: string | null
          source_system?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_vendor_rfq_group_id_fkey"
            columns: ["rfq_group_id"]
            isOneToOne: false
            referencedRelation: "rfq_group"
            referencedColumns: ["id"]
          },
        ]
      }
      RFQContainer: {
        Row: {
          created_at: string | null
          RFQContainer_id: number
          RFQContainer_price: number | null
        }
        Insert: {
          created_at?: string | null
          RFQContainer_id?: number
          RFQContainer_price?: number | null
        }
        Update: {
          created_at?: string | null
          RFQContainer_id?: number
          RFQContainer_price?: number | null
        }
        Relationships: []
      }
      RFQGroup: {
        Row: {
          data_added: string | null
          HasDuplicates: boolean | null
          IsLegacy: boolean | null
          RFQGroup_id: number
          RFQGroup_name: string | null
          user_id_fk: number | null
        }
        Insert: {
          data_added?: string | null
          HasDuplicates?: boolean | null
          IsLegacy?: boolean | null
          RFQGroup_id?: never
          RFQGroup_name?: string | null
          user_id_fk?: number | null
        }
        Update: {
          data_added?: string | null
          HasDuplicates?: boolean | null
          IsLegacy?: boolean | null
          RFQGroup_id?: never
          RFQGroup_name?: string | null
          user_id_fk?: number | null
        }
        Relationships: []
      }
      RFQItem: {
        Row: {
          rfq_container_id_fk: number | null
          rfqItem_active: number | null
          rfqItem_adam_fix: string | null
          rfqItem_agent: string | null
          rfqItem_archive: number | null
          rfqItem_auditlog: string | null
          rfqItem_case_pack: string | null
          rfqItem_cbm_per_piece: string | null
          rfqItem_cbm_per_price: string | null
          rfqItem_choosen_vendor: number | null
          rfqItem_comp_retail: string | null
          rfqItem_container_price: number | null
          rfqItem_copied_by: number | null
          rfqItem_copied_from_id: number | null
          rfqItem_copied_on: string | null
          rfqItem_created_date: string | null
          rfqItem_customer: number | null
          rfqItem_date_modified: string | null
          rfqItem_default_cbm: string | null
          rfqItem_delivery_loc: number | null
          rfqItem_depth: number | null
          rfqItem_description: string | null
          rfqItem_dilution: string | null
          rfqItem_divCode_id_fk: string | null
          rfqItem_duty_rate: string | null
          rfqItem_duty_rate_dollar_amount: string | null
          rfqItem_duty_rate_equation: string | null
          rfqItem_factories_step_at: string | null
          rfqItem_fob_cost: string | null
          rfqItem_freight: string | null
          rfqItem_gen_fob_entered_margin: number | null
          rfqItem_gen_fob_entered_sell_price: number | null
          rfqItem_gen_fob_margin: string | null
          rfqItem_gen_fob_netsell: string | null
          rfqItem_gen_fob_pricesale: string | null
          rfqItem_gen_fob_royalty: string | null
          rfqItem_gen_fob_sellprice: string | null
          rfqItem_gen_ldp_margin: string | null
          rfqItem_gen_mddp_entered_margin: number | null
          rfqItem_gen_mddp_entered_sell_price: number | null
          rfqItem_gen_mddp_margin: string | null
          rfqItem_gen_mddp_netsell: string | null
          rfqItem_gen_mddp_pricesale: string | null
          rfqItem_gen_mddp_royalty: string | null
          rfqItem_gen_mddp_sellprice: string | null
          rfqItem_gen_poe_entered_margin: number | null
          rfqItem_gen_poe_entered_sell_price: number | null
          rfqItem_gen_poe_margin: string | null
          rfqItem_gen_poe_netsell: string | null
          rfqItem_gen_poe_pricesale: string | null
          rfqItem_gen_poe_royalty: string | null
          rfqItem_gen_poe_sellprice: string | null
          rfqItem_gen_whse_entered_margin: number | null
          rfqItem_gen_whse_entered_sell_price: number | null
          rfqItem_gen_whse_margin: string | null
          rfqItem_gen_whse_netsell: string | null
          rfqItem_gen_whse_pricesale: string | null
          rfqItem_gen_whse_royalty: string | null
          rfqItem_gen_whse_sellprice: string | null
          rfqItem_id: number
          rfqItem_is_landed_cost_manual: boolean
          rfqItem_landed_cost: string | null
          rfqItem_lic_fob_entered_margin: number | null
          rfqItem_lic_fob_entered_sell_price: number | null
          rfqItem_lic_fob_margin: string | null
          rfqItem_lic_fob_netsell: string | null
          rfqItem_lic_fob_pricesale: string | null
          rfqItem_lic_fob_royalty: string | null
          rfqItem_lic_fob_sellprice: string | null
          rfqItem_lic_mddp_entered_margin: number | null
          rfqItem_lic_mddp_entered_sell_price: number | null
          rfqItem_lic_mddp_margin: string | null
          rfqItem_lic_mddp_netsell: string | null
          rfqItem_lic_mddp_pricesale: string | null
          rfqItem_lic_mddp_royalty: string | null
          rfqItem_lic_mddp_sellprice: string | null
          rfqItem_lic_poe_entered_margin: number | null
          rfqItem_lic_poe_entered_sell_price: number | null
          rfqItem_lic_poe_margin: string | null
          rfqItem_lic_poe_netsell: string | null
          rfqItem_lic_poe_pricesale: string | null
          rfqItem_lic_poe_royalty: string | null
          rfqItem_lic_poe_sellprice: string | null
          rfqItem_lic_whse_entered_margin: number | null
          rfqItem_lic_whse_entered_sell_price: number | null
          rfqItem_lic_whse_margin: string | null
          rfqItem_lic_whse_netsell: string | null
          rfqItem_lic_whse_pricesale: string | null
          rfqItem_lic_whse_royalty: string | null
          rfqItem_lic_whse_sellprice: string | null
          rfqItem_license: string | null
          rfqItem_logistic_load: string | null
          rfqItem_notes: string | null
          rfqItem_picture: string | null
          rfqItem_picturethumb: string | null
          rfqItem_price_per_cbm: string | null
          rfqItem_price_sales_snapshots: string | null
          rfqItem_quantity: string | null
          rfqItem_quote_update: string | null
          rfqItem_requested_price_cells: string | null
          rfqItem_rfq_group: number | null
          rfqItem_royalty: number | null
          rfqItem_size_l_w: number | null
          rfqItem_source_item_id: number | null
          rfqItem_source_item_num: string | null
          rfqItem_standardized_products: string | null
          rfqItem_step: number | null
          rfqItem_style_number: string | null
          rfqItem_tech_pack_link: string | null
          rfqItem_udf1: number | null
          rfqItem_udf2: number | null
          rfqItem_udf3: number | null
          rfqItem_udf4: number | null
          rfqItem_warehouse: string | null
          rfqItem_wholesale: string | null
        }
        Insert: {
          rfq_container_id_fk?: number | null
          rfqItem_active?: number | null
          rfqItem_adam_fix?: string | null
          rfqItem_agent?: string | null
          rfqItem_archive?: number | null
          rfqItem_auditlog?: string | null
          rfqItem_case_pack?: string | null
          rfqItem_cbm_per_piece?: string | null
          rfqItem_cbm_per_price?: string | null
          rfqItem_choosen_vendor?: number | null
          rfqItem_comp_retail?: string | null
          rfqItem_container_price?: number | null
          rfqItem_copied_by?: number | null
          rfqItem_copied_from_id?: number | null
          rfqItem_copied_on?: string | null
          rfqItem_created_date?: string | null
          rfqItem_customer?: number | null
          rfqItem_date_modified?: string | null
          rfqItem_default_cbm?: string | null
          rfqItem_delivery_loc?: number | null
          rfqItem_depth?: number | null
          rfqItem_description?: string | null
          rfqItem_dilution?: string | null
          rfqItem_divCode_id_fk?: string | null
          rfqItem_duty_rate?: string | null
          rfqItem_duty_rate_dollar_amount?: string | null
          rfqItem_duty_rate_equation?: string | null
          rfqItem_factories_step_at?: string | null
          rfqItem_fob_cost?: string | null
          rfqItem_freight?: string | null
          rfqItem_gen_fob_entered_margin?: number | null
          rfqItem_gen_fob_entered_sell_price?: number | null
          rfqItem_gen_fob_margin?: string | null
          rfqItem_gen_fob_netsell?: string | null
          rfqItem_gen_fob_pricesale?: string | null
          rfqItem_gen_fob_royalty?: string | null
          rfqItem_gen_fob_sellprice?: string | null
          rfqItem_gen_ldp_margin?: string | null
          rfqItem_gen_mddp_entered_margin?: number | null
          rfqItem_gen_mddp_entered_sell_price?: number | null
          rfqItem_gen_mddp_margin?: string | null
          rfqItem_gen_mddp_netsell?: string | null
          rfqItem_gen_mddp_pricesale?: string | null
          rfqItem_gen_mddp_royalty?: string | null
          rfqItem_gen_mddp_sellprice?: string | null
          rfqItem_gen_poe_entered_margin?: number | null
          rfqItem_gen_poe_entered_sell_price?: number | null
          rfqItem_gen_poe_margin?: string | null
          rfqItem_gen_poe_netsell?: string | null
          rfqItem_gen_poe_pricesale?: string | null
          rfqItem_gen_poe_royalty?: string | null
          rfqItem_gen_poe_sellprice?: string | null
          rfqItem_gen_whse_entered_margin?: number | null
          rfqItem_gen_whse_entered_sell_price?: number | null
          rfqItem_gen_whse_margin?: string | null
          rfqItem_gen_whse_netsell?: string | null
          rfqItem_gen_whse_pricesale?: string | null
          rfqItem_gen_whse_royalty?: string | null
          rfqItem_gen_whse_sellprice?: string | null
          rfqItem_id?: number
          rfqItem_is_landed_cost_manual?: boolean
          rfqItem_landed_cost?: string | null
          rfqItem_lic_fob_entered_margin?: number | null
          rfqItem_lic_fob_entered_sell_price?: number | null
          rfqItem_lic_fob_margin?: string | null
          rfqItem_lic_fob_netsell?: string | null
          rfqItem_lic_fob_pricesale?: string | null
          rfqItem_lic_fob_royalty?: string | null
          rfqItem_lic_fob_sellprice?: string | null
          rfqItem_lic_mddp_entered_margin?: number | null
          rfqItem_lic_mddp_entered_sell_price?: number | null
          rfqItem_lic_mddp_margin?: string | null
          rfqItem_lic_mddp_netsell?: string | null
          rfqItem_lic_mddp_pricesale?: string | null
          rfqItem_lic_mddp_royalty?: string | null
          rfqItem_lic_mddp_sellprice?: string | null
          rfqItem_lic_poe_entered_margin?: number | null
          rfqItem_lic_poe_entered_sell_price?: number | null
          rfqItem_lic_poe_margin?: string | null
          rfqItem_lic_poe_netsell?: string | null
          rfqItem_lic_poe_pricesale?: string | null
          rfqItem_lic_poe_royalty?: string | null
          rfqItem_lic_poe_sellprice?: string | null
          rfqItem_lic_whse_entered_margin?: number | null
          rfqItem_lic_whse_entered_sell_price?: number | null
          rfqItem_lic_whse_margin?: string | null
          rfqItem_lic_whse_netsell?: string | null
          rfqItem_lic_whse_pricesale?: string | null
          rfqItem_lic_whse_royalty?: string | null
          rfqItem_lic_whse_sellprice?: string | null
          rfqItem_license?: string | null
          rfqItem_logistic_load?: string | null
          rfqItem_notes?: string | null
          rfqItem_picture?: string | null
          rfqItem_picturethumb?: string | null
          rfqItem_price_per_cbm?: string | null
          rfqItem_price_sales_snapshots?: string | null
          rfqItem_quantity?: string | null
          rfqItem_quote_update?: string | null
          rfqItem_requested_price_cells?: string | null
          rfqItem_rfq_group?: number | null
          rfqItem_royalty?: number | null
          rfqItem_size_l_w?: number | null
          rfqItem_source_item_id?: number | null
          rfqItem_source_item_num?: string | null
          rfqItem_standardized_products?: string | null
          rfqItem_step?: number | null
          rfqItem_style_number?: string | null
          rfqItem_tech_pack_link?: string | null
          rfqItem_udf1?: number | null
          rfqItem_udf2?: number | null
          rfqItem_udf3?: number | null
          rfqItem_udf4?: number | null
          rfqItem_warehouse?: string | null
          rfqItem_wholesale?: string | null
        }
        Update: {
          rfq_container_id_fk?: number | null
          rfqItem_active?: number | null
          rfqItem_adam_fix?: string | null
          rfqItem_agent?: string | null
          rfqItem_archive?: number | null
          rfqItem_auditlog?: string | null
          rfqItem_case_pack?: string | null
          rfqItem_cbm_per_piece?: string | null
          rfqItem_cbm_per_price?: string | null
          rfqItem_choosen_vendor?: number | null
          rfqItem_comp_retail?: string | null
          rfqItem_container_price?: number | null
          rfqItem_copied_by?: number | null
          rfqItem_copied_from_id?: number | null
          rfqItem_copied_on?: string | null
          rfqItem_created_date?: string | null
          rfqItem_customer?: number | null
          rfqItem_date_modified?: string | null
          rfqItem_default_cbm?: string | null
          rfqItem_delivery_loc?: number | null
          rfqItem_depth?: number | null
          rfqItem_description?: string | null
          rfqItem_dilution?: string | null
          rfqItem_divCode_id_fk?: string | null
          rfqItem_duty_rate?: string | null
          rfqItem_duty_rate_dollar_amount?: string | null
          rfqItem_duty_rate_equation?: string | null
          rfqItem_factories_step_at?: string | null
          rfqItem_fob_cost?: string | null
          rfqItem_freight?: string | null
          rfqItem_gen_fob_entered_margin?: number | null
          rfqItem_gen_fob_entered_sell_price?: number | null
          rfqItem_gen_fob_margin?: string | null
          rfqItem_gen_fob_netsell?: string | null
          rfqItem_gen_fob_pricesale?: string | null
          rfqItem_gen_fob_royalty?: string | null
          rfqItem_gen_fob_sellprice?: string | null
          rfqItem_gen_ldp_margin?: string | null
          rfqItem_gen_mddp_entered_margin?: number | null
          rfqItem_gen_mddp_entered_sell_price?: number | null
          rfqItem_gen_mddp_margin?: string | null
          rfqItem_gen_mddp_netsell?: string | null
          rfqItem_gen_mddp_pricesale?: string | null
          rfqItem_gen_mddp_royalty?: string | null
          rfqItem_gen_mddp_sellprice?: string | null
          rfqItem_gen_poe_entered_margin?: number | null
          rfqItem_gen_poe_entered_sell_price?: number | null
          rfqItem_gen_poe_margin?: string | null
          rfqItem_gen_poe_netsell?: string | null
          rfqItem_gen_poe_pricesale?: string | null
          rfqItem_gen_poe_royalty?: string | null
          rfqItem_gen_poe_sellprice?: string | null
          rfqItem_gen_whse_entered_margin?: number | null
          rfqItem_gen_whse_entered_sell_price?: number | null
          rfqItem_gen_whse_margin?: string | null
          rfqItem_gen_whse_netsell?: string | null
          rfqItem_gen_whse_pricesale?: string | null
          rfqItem_gen_whse_royalty?: string | null
          rfqItem_gen_whse_sellprice?: string | null
          rfqItem_id?: number
          rfqItem_is_landed_cost_manual?: boolean
          rfqItem_landed_cost?: string | null
          rfqItem_lic_fob_entered_margin?: number | null
          rfqItem_lic_fob_entered_sell_price?: number | null
          rfqItem_lic_fob_margin?: string | null
          rfqItem_lic_fob_netsell?: string | null
          rfqItem_lic_fob_pricesale?: string | null
          rfqItem_lic_fob_royalty?: string | null
          rfqItem_lic_fob_sellprice?: string | null
          rfqItem_lic_mddp_entered_margin?: number | null
          rfqItem_lic_mddp_entered_sell_price?: number | null
          rfqItem_lic_mddp_margin?: string | null
          rfqItem_lic_mddp_netsell?: string | null
          rfqItem_lic_mddp_pricesale?: string | null
          rfqItem_lic_mddp_royalty?: string | null
          rfqItem_lic_mddp_sellprice?: string | null
          rfqItem_lic_poe_entered_margin?: number | null
          rfqItem_lic_poe_entered_sell_price?: number | null
          rfqItem_lic_poe_margin?: string | null
          rfqItem_lic_poe_netsell?: string | null
          rfqItem_lic_poe_pricesale?: string | null
          rfqItem_lic_poe_royalty?: string | null
          rfqItem_lic_poe_sellprice?: string | null
          rfqItem_lic_whse_entered_margin?: number | null
          rfqItem_lic_whse_entered_sell_price?: number | null
          rfqItem_lic_whse_margin?: string | null
          rfqItem_lic_whse_netsell?: string | null
          rfqItem_lic_whse_pricesale?: string | null
          rfqItem_lic_whse_royalty?: string | null
          rfqItem_lic_whse_sellprice?: string | null
          rfqItem_license?: string | null
          rfqItem_logistic_load?: string | null
          rfqItem_notes?: string | null
          rfqItem_picture?: string | null
          rfqItem_picturethumb?: string | null
          rfqItem_price_per_cbm?: string | null
          rfqItem_price_sales_snapshots?: string | null
          rfqItem_quantity?: string | null
          rfqItem_quote_update?: string | null
          rfqItem_requested_price_cells?: string | null
          rfqItem_rfq_group?: number | null
          rfqItem_royalty?: number | null
          rfqItem_size_l_w?: number | null
          rfqItem_source_item_id?: number | null
          rfqItem_source_item_num?: string | null
          rfqItem_standardized_products?: string | null
          rfqItem_step?: number | null
          rfqItem_style_number?: string | null
          rfqItem_tech_pack_link?: string | null
          rfqItem_udf1?: number | null
          rfqItem_udf2?: number | null
          rfqItem_udf3?: number | null
          rfqItem_udf4?: number | null
          rfqItem_warehouse?: string | null
          rfqItem_wholesale?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_rfqItem_copied_from"
            columns: ["rfqItem_copied_from_id"]
            isOneToOne: false
            referencedRelation: "RFQItem"
            referencedColumns: ["rfqItem_id"]
          },
        ]
      }
      RFQItemDivision: {
        Row: {
          divisionCode_id_fk: number | null
          RFQItem_id_fk: number | null
          RFQItemDivision_id: number
        }
        Insert: {
          divisionCode_id_fk?: number | null
          RFQItem_id_fk?: number | null
          RFQItemDivision_id?: never
        }
        Update: {
          divisionCode_id_fk?: number | null
          RFQItem_id_fk?: number | null
          RFQItemDivision_id?: never
        }
        Relationships: []
      }
      RFQItemStatus: {
        Row: {
          RFQItemStatus_airbyte_emitted_at: string | null
          RFQItemStatus_airbyte_productions_hashid: string | null
          RFQItemStatus_auditlog: string | null
          RFQItemStatus_code: string | null
          RFQItemStatus_id: number
          RFQItemStatus_status: string | null
          RFQItemStatus_title: string | null
        }
        Insert: {
          RFQItemStatus_airbyte_emitted_at?: string | null
          RFQItemStatus_airbyte_productions_hashid?: string | null
          RFQItemStatus_auditlog?: string | null
          RFQItemStatus_code?: string | null
          RFQItemStatus_id?: number
          RFQItemStatus_status?: string | null
          RFQItemStatus_title?: string | null
        }
        Update: {
          RFQItemStatus_airbyte_emitted_at?: string | null
          RFQItemStatus_airbyte_productions_hashid?: string | null
          RFQItemStatus_auditlog?: string | null
          RFQItemStatus_code?: string | null
          RFQItemStatus_id?: number
          RFQItemStatus_status?: string | null
          RFQItemStatus_title?: string | null
        }
        Relationships: []
      }
      RFQStep: {
        Row: {
          RFQStep_access_level: string | null
          RFQStep_id: number
          RFQStep_notified_user_level: string | null
          RFQStep_status: string | null
          RFQStep_title: string | null
        }
        Insert: {
          RFQStep_access_level?: string | null
          RFQStep_id?: never
          RFQStep_notified_user_level?: string | null
          RFQStep_status?: string | null
          RFQStep_title?: string | null
        }
        Update: {
          RFQStep_access_level?: string | null
          RFQStep_id?: never
          RFQStep_notified_user_level?: string | null
          RFQStep_status?: string | null
          RFQStep_title?: string | null
        }
        Relationships: []
      }
      RFQVendor: {
        Row: {
          carton_height: number | null
          carton_length: number | null
          carton_width: number | null
          fob_country: string | null
          fob_port: string | null
          lead_time: number | null
          price_terms: string | null
          quote_date: string | null
          req_status: number | null
          requote_requested: boolean | null
          RFQitem_id_fk: number | null
          RFQVendor_amount: string | null
          RFQVendor_archive_optout: boolean | null
          RFQVendor_archived: boolean | null
          RFQVendor_cbm_pc: string | null
          RFQVendor_id: number
          RFQVendor_note: string | null
          RFQVendor_status: string | null
          RFQVendor_suggested_amount: string | null
          RFQVendor_suggested_cbm_pc: string | null
          RFQVendor_suggested_note: string | null
          std_vendor_id_fk: string | null
          suggested_carton_height: number | null
          suggested_carton_length: number | null
          suggested_carton_width: number | null
          vendor_id_fk: number | null
        }
        Insert: {
          carton_height?: number | null
          carton_length?: number | null
          carton_width?: number | null
          fob_country?: string | null
          fob_port?: string | null
          lead_time?: number | null
          price_terms?: string | null
          quote_date?: string | null
          req_status?: number | null
          requote_requested?: boolean | null
          RFQitem_id_fk?: number | null
          RFQVendor_amount?: string | null
          RFQVendor_archive_optout?: boolean | null
          RFQVendor_archived?: boolean | null
          RFQVendor_cbm_pc?: string | null
          RFQVendor_id?: number
          RFQVendor_note?: string | null
          RFQVendor_status?: string | null
          RFQVendor_suggested_amount?: string | null
          RFQVendor_suggested_cbm_pc?: string | null
          RFQVendor_suggested_note?: string | null
          std_vendor_id_fk?: string | null
          suggested_carton_height?: number | null
          suggested_carton_length?: number | null
          suggested_carton_width?: number | null
          vendor_id_fk?: number | null
        }
        Update: {
          carton_height?: number | null
          carton_length?: number | null
          carton_width?: number | null
          fob_country?: string | null
          fob_port?: string | null
          lead_time?: number | null
          price_terms?: string | null
          quote_date?: string | null
          req_status?: number | null
          requote_requested?: boolean | null
          RFQitem_id_fk?: number | null
          RFQVendor_amount?: string | null
          RFQVendor_archive_optout?: boolean | null
          RFQVendor_archived?: boolean | null
          RFQVendor_cbm_pc?: string | null
          RFQVendor_id?: number
          RFQVendor_note?: string | null
          RFQVendor_status?: string | null
          RFQVendor_suggested_amount?: string | null
          RFQVendor_suggested_cbm_pc?: string | null
          RFQVendor_suggested_note?: string | null
          std_vendor_id_fk?: string | null
          suggested_carton_height?: number | null
          suggested_carton_length?: number | null
          suggested_carton_width?: number | null
          vendor_id_fk?: number | null
        }
        Relationships: []
      }
      RFQWhse: {
        Row: {
          RFQWhse_id: number
          RFQWhse_price: number | null
        }
        Insert: {
          RFQWhse_id?: number
          RFQWhse_price?: number | null
        }
        Update: {
          RFQWhse_id?: number
          RFQWhse_price?: number | null
        }
        Relationships: []
      }
      sample: {
        Row: {
          box_id_fk: number | null
          courier: string | null
          customer_id_fk: number | null
          direction: string
          factory_group_id_fk: number | null
          factory_id_fk: number | null
          final_destination: string | null
          fob_cost: number | null
          item_id_fk: number | null
          next_stop: string | null
          notes: string | null
          office_location: string | null
          origin: string
          prod_order_no_fk: string | null
          quantity: number | null
          retail_price: number | null
          sample_createdTime: string | null
          sample_createdUser: string | null
          sample_id_pk: number
          sample_modTime: string | null
          sample_modUser: string | null
          sample_name: string | null
          status: string
          tracking_number: string | null
        }
        Insert: {
          box_id_fk?: number | null
          courier?: string | null
          customer_id_fk?: number | null
          direction: string
          factory_group_id_fk?: number | null
          factory_id_fk?: number | null
          final_destination?: string | null
          fob_cost?: number | null
          item_id_fk?: number | null
          next_stop?: string | null
          notes?: string | null
          office_location?: string | null
          origin: string
          prod_order_no_fk?: string | null
          quantity?: number | null
          retail_price?: number | null
          sample_createdTime?: string | null
          sample_createdUser?: string | null
          sample_id_pk?: number
          sample_modTime?: string | null
          sample_modUser?: string | null
          sample_name?: string | null
          status: string
          tracking_number?: string | null
        }
        Update: {
          box_id_fk?: number | null
          courier?: string | null
          customer_id_fk?: number | null
          direction?: string
          factory_group_id_fk?: number | null
          factory_id_fk?: number | null
          final_destination?: string | null
          fob_cost?: number | null
          item_id_fk?: number | null
          next_stop?: string | null
          notes?: string | null
          office_location?: string | null
          origin?: string
          prod_order_no_fk?: string | null
          quantity?: number | null
          retail_price?: number | null
          sample_createdTime?: string | null
          sample_createdUser?: string | null
          sample_id_pk?: number
          sample_modTime?: string | null
          sample_modUser?: string | null
          sample_name?: string | null
          status?: string
          tracking_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sample_box_id_fk_fkey"
            columns: ["box_id_fk"]
            isOneToOne: false
            referencedRelation: "sample_box"
            referencedColumns: ["box_id_pk"]
          },
          {
            foreignKeyName: "sample_factory_group_id_fk_fkey"
            columns: ["factory_group_id_fk"]
            isOneToOne: false
            referencedRelation: "sample_factory_group"
            referencedColumns: ["factory_group_id_pk"]
          },
        ]
      }
      sample_attachment: {
        Row: {
          attachment_display_name: string | null
          attachment_link: string
          attachment_type: string
          primary_image: boolean | null
          sample_attachment_createdTime: string | null
          sample_attachment_createdUser: string | null
          sample_attachment_fileName: string | null
          sample_attachment_id: number
          sample_attachment_modTime: string | null
          sample_attachment_modUser: string | null
          sample_id_fk: number
          uuid: string | null
        }
        Insert: {
          attachment_display_name?: string | null
          attachment_link: string
          attachment_type: string
          primary_image?: boolean | null
          sample_attachment_createdTime?: string | null
          sample_attachment_createdUser?: string | null
          sample_attachment_fileName?: string | null
          sample_attachment_id?: number
          sample_attachment_modTime?: string | null
          sample_attachment_modUser?: string | null
          sample_id_fk: number
          uuid?: string | null
        }
        Update: {
          attachment_display_name?: string | null
          attachment_link?: string
          attachment_type?: string
          primary_image?: boolean | null
          sample_attachment_createdTime?: string | null
          sample_attachment_createdUser?: string | null
          sample_attachment_fileName?: string | null
          sample_attachment_id?: number
          sample_attachment_modTime?: string | null
          sample_attachment_modUser?: string | null
          sample_id_fk?: number
          uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sample_attachment_sample_id_fk_fkey"
            columns: ["sample_id_fk"]
            isOneToOne: false
            referencedRelation: "sample"
            referencedColumns: ["sample_id_pk"]
          },
        ]
      }
      sample_box: {
        Row: {
          box_createdTime: string | null
          box_createdUser: string | null
          box_id_pk: number
          box_label: string | null
          box_modTime: string | null
          box_modUser: string | null
          dest_office: string | null
          direction: string | null
          final_destination: string | null
          notes: string | null
          origin_office: string | null
          shipped_date: string | null
          status: string | null
          tracking_number: string | null
        }
        Insert: {
          box_createdTime?: string | null
          box_createdUser?: string | null
          box_id_pk?: number
          box_label?: string | null
          box_modTime?: string | null
          box_modUser?: string | null
          dest_office?: string | null
          direction?: string | null
          final_destination?: string | null
          notes?: string | null
          origin_office?: string | null
          shipped_date?: string | null
          status?: string | null
          tracking_number?: string | null
        }
        Update: {
          box_createdTime?: string | null
          box_createdUser?: string | null
          box_id_pk?: number
          box_label?: string | null
          box_modTime?: string | null
          box_modUser?: string | null
          dest_office?: string | null
          direction?: string | null
          final_destination?: string | null
          notes?: string | null
          origin_office?: string | null
          shipped_date?: string | null
          status?: string | null
          tracking_number?: string | null
        }
        Relationships: []
      }
      sample_comments: {
        Row: {
          comment: string
          id: number
          inserted_date: string
          parent_id: number | null
          sample_id_fk: number
          user_id: number
        }
        Insert: {
          comment: string
          id?: number
          inserted_date: string
          parent_id?: number | null
          sample_id_fk: number
          user_id: number
        }
        Update: {
          comment?: string
          id?: number
          inserted_date?: string
          parent_id?: number | null
          sample_id_fk?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "sample_comments_sample_id_fk_fkey"
            columns: ["sample_id_fk"]
            isOneToOne: false
            referencedRelation: "sample"
            referencedColumns: ["sample_id_pk"]
          },
        ]
      }
      sample_event: {
        Row: {
          box_id_fk: number | null
          event_id_pk: number
          event_time: string
          event_type: string
          event_user: string | null
          event_user_id_fk: number | null
          factory_group_id_fk: number | null
          from_status: string | null
          notes: string | null
          office_location: string | null
          sample_id_fk: number | null
          to_status: string | null
        }
        Insert: {
          box_id_fk?: number | null
          event_id_pk?: number
          event_time: string
          event_type: string
          event_user?: string | null
          event_user_id_fk?: number | null
          factory_group_id_fk?: number | null
          from_status?: string | null
          notes?: string | null
          office_location?: string | null
          sample_id_fk?: number | null
          to_status?: string | null
        }
        Update: {
          box_id_fk?: number | null
          event_id_pk?: number
          event_time?: string
          event_type?: string
          event_user?: string | null
          event_user_id_fk?: number | null
          factory_group_id_fk?: number | null
          from_status?: string | null
          notes?: string | null
          office_location?: string | null
          sample_id_fk?: number | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sample_event_sample_id_fk_fkey"
            columns: ["sample_id_fk"]
            isOneToOne: false
            referencedRelation: "sample"
            referencedColumns: ["sample_id_pk"]
          },
        ]
      }
      sample_factory_group: {
        Row: {
          direction: string | null
          factory_group_id_pk: number
          factory_id_fk: number | null
          group_createdTime: string | null
          group_createdUser: string | null
          group_modTime: string | null
          group_modUser: string | null
          group_name: string | null
          notes: string | null
          office_location: string | null
          origin: string | null
          status: string | null
        }
        Insert: {
          direction?: string | null
          factory_group_id_pk?: number
          factory_id_fk?: number | null
          group_createdTime?: string | null
          group_createdUser?: string | null
          group_modTime?: string | null
          group_modUser?: string | null
          group_name?: string | null
          notes?: string | null
          office_location?: string | null
          origin?: string | null
          status?: string | null
        }
        Update: {
          direction?: string | null
          factory_group_id_pk?: number
          factory_id_fk?: number | null
          group_createdTime?: string | null
          group_createdUser?: string | null
          group_modTime?: string | null
          group_modUser?: string | null
          group_name?: string | null
          notes?: string | null
          office_location?: string | null
          origin?: string | null
          status?: string | null
        }
        Relationships: []
      }
      sample_shipment_item: {
        Row: {
          added_date: string | null
          added_user: string | null
          box_id_fk: number | null
          factory_group_id_fk: number | null
          leg_type: string | null
          sample_id_fk: number
          shipment_item_id_pk: number
        }
        Insert: {
          added_date?: string | null
          added_user?: string | null
          box_id_fk?: number | null
          factory_group_id_fk?: number | null
          leg_type?: string | null
          sample_id_fk: number
          shipment_item_id_pk?: number
        }
        Update: {
          added_date?: string | null
          added_user?: string | null
          box_id_fk?: number | null
          factory_group_id_fk?: number | null
          leg_type?: string | null
          sample_id_fk?: number
          shipment_item_id_pk?: number
        }
        Relationships: [
          {
            foreignKeyName: "sample_shipment_item_box_id_fk_fkey"
            columns: ["box_id_fk"]
            isOneToOne: false
            referencedRelation: "sample_box"
            referencedColumns: ["box_id_pk"]
          },
          {
            foreignKeyName: "sample_shipment_item_sample_id_fk_fkey"
            columns: ["sample_id_fk"]
            isOneToOne: false
            referencedRelation: "sample"
            referencedColumns: ["sample_id_pk"]
          },
        ]
      }
      SeasonCode: {
        Row: {
          active: string | null
          companyCode: string | null
          createdTime: string | null
          createdUser: string | null
          divisionCode: string | null
          endDate: string | null
          id: number
          modTime: string | null
          modUser: string | null
          seasonCode: string | null
          seasonDesc: string | null
          shipEndDate: string | null
          shipStartDate: string | null
          startDate: string | null
        }
        Insert: {
          active?: string | null
          companyCode?: string | null
          createdTime?: string | null
          createdUser?: string | null
          divisionCode?: string | null
          endDate?: string | null
          id?: never
          modTime?: string | null
          modUser?: string | null
          seasonCode?: string | null
          seasonDesc?: string | null
          shipEndDate?: string | null
          shipStartDate?: string | null
          startDate?: string | null
        }
        Update: {
          active?: string | null
          companyCode?: string | null
          createdTime?: string | null
          createdUser?: string | null
          divisionCode?: string | null
          endDate?: string | null
          id?: never
          modTime?: string | null
          modUser?: string | null
          seasonCode?: string | null
          seasonDesc?: string | null
          shipEndDate?: string | null
          shipStartDate?: string | null
          startDate?: string | null
        }
        Relationships: []
      }
      ShippingPort: {
        Row: {
          CountryCode: string | null
          id: number
          PortCode: string | null
          PortDesc: string | null
          UNLcode: string | null
        }
        Insert: {
          CountryCode?: string | null
          id?: never
          PortCode?: string | null
          PortDesc?: string | null
          UNLcode?: string | null
        }
        Update: {
          CountryCode?: string | null
          id?: never
          PortCode?: string | null
          PortDesc?: string | null
          UNLcode?: string | null
        }
        Relationships: []
      }
      StandardizedDetail: {
        Row: {
          id: number
          std_prod_id_fk: number | null
          std_size_id_fk: number | null
          std_v_id_fk: number | null
        }
        Insert: {
          id?: number
          std_prod_id_fk?: number | null
          std_size_id_fk?: number | null
          std_v_id_fk?: number | null
        }
        Update: {
          id?: number
          std_prod_id_fk?: number | null
          std_size_id_fk?: number | null
          std_v_id_fk?: number | null
        }
        Relationships: []
      }
      StandardizedGroup: {
        Row: {
          casePack: string | null
          customer_id_fk: number | null
          depth_id_fk: number | null
          id: number
          qty: string | null
          std_prod_id_fk: number | null
          title: string | null
        }
        Insert: {
          casePack?: string | null
          customer_id_fk?: number | null
          depth_id_fk?: number | null
          id?: never
          qty?: string | null
          std_prod_id_fk?: number | null
          title?: string | null
        }
        Update: {
          casePack?: string | null
          customer_id_fk?: number | null
          depth_id_fk?: number | null
          id?: never
          qty?: string | null
          std_prod_id_fk?: number | null
          title?: string | null
        }
        Relationships: []
      }
      StandardizedProductElement: {
        Row: {
          id: number
          std_prod_id_fk: number | null
          title: string | null
          type: string | null
        }
        Insert: {
          id?: never
          std_prod_id_fk?: number | null
          title?: string | null
          type?: string | null
        }
        Update: {
          id?: never
          std_prod_id_fk?: number | null
          title?: string | null
          type?: string | null
        }
        Relationships: []
      }
      StandardizedProductElementValue: {
        Row: {
          id: number
          std_prod_el_id_fk: number | null
          std_prod_id_fk: number | null
          value: string | null
        }
        Insert: {
          id?: never
          std_prod_el_id_fk?: number | null
          std_prod_id_fk?: number | null
          value?: string | null
        }
        Update: {
          id?: never
          std_prod_el_id_fk?: number | null
          std_prod_id_fk?: number | null
          value?: string | null
        }
        Relationships: []
      }
      StandardizedProductType: {
        Row: {
          construction_id_fk: number | null
          id: number
          material_id_fk: number | null
          prod_img_fullsize: string | null
          prod_img_thumbnail: string | null
          prod_name: string | null
          prod_status: string | null
        }
        Insert: {
          construction_id_fk?: number | null
          id?: never
          material_id_fk?: number | null
          prod_img_fullsize?: string | null
          prod_img_thumbnail?: string | null
          prod_name?: string | null
          prod_status?: string | null
        }
        Update: {
          construction_id_fk?: number | null
          id?: never
          material_id_fk?: number | null
          prod_img_fullsize?: string | null
          prod_img_thumbnail?: string | null
          prod_name?: string | null
          prod_status?: string | null
        }
        Relationships: []
      }
      StandardizedSize: {
        Row: {
          id: number
          size_cm_id_fk: number | null
          size_in_id_fk: number | null
          status: string | null
          std_group_id_fk: number | null
          std_prod_id_fk: number | null
        }
        Insert: {
          id?: never
          size_cm_id_fk?: number | null
          size_in_id_fk?: number | null
          status?: string | null
          std_group_id_fk?: number | null
          std_prod_id_fk?: number | null
        }
        Update: {
          id?: never
          size_cm_id_fk?: number | null
          size_in_id_fk?: number | null
          status?: string | null
          std_group_id_fk?: number | null
          std_prod_id_fk?: number | null
        }
        Relationships: []
      }
      StandardizedVendor: {
        Row: {
          factory_id_fk: number | null
          height: string | null
          highlighted: string | null
          id: number
          length: string | null
          pKey: string
          price: number | null
          quote_date: string | null
          std_item_id_fk: number | null
          std_prod_id_fk: number | null
          width: string | null
        }
        Insert: {
          factory_id_fk?: number | null
          height?: string | null
          highlighted?: string | null
          id?: never
          length?: string | null
          pKey: string
          price?: number | null
          quote_date?: string | null
          std_item_id_fk?: number | null
          std_prod_id_fk?: number | null
          width?: string | null
        }
        Update: {
          factory_id_fk?: number | null
          height?: string | null
          highlighted?: string | null
          id?: never
          length?: string | null
          pKey?: string
          price?: number | null
          quote_date?: string | null
          std_item_id_fk?: number | null
          std_prod_id_fk?: number | null
          width?: string | null
        }
        Relationships: []
      }
      StandardizedVersion: {
        Row: {
          id: number
          std_prod_id_fk: number | null
          title: string | null
          treatment_id_fk: number | null
        }
        Insert: {
          id?: never
          std_prod_id_fk?: number | null
          title?: string | null
          treatment_id_fk?: number | null
        }
        Update: {
          id?: never
          std_prod_id_fk?: number | null
          title?: string | null
          treatment_id_fk?: number | null
        }
        Relationships: []
      }
      style_tracker_item_bridge: {
        Row: {
          bridge_source: string
          commissioned: string | null
          company_id: string | null
          concept_status: string | null
          core_licensor_id: string | null
          created_at: string
          creative_designer_id: string | null
          customer_name: string | null
          customer_sku: string | null
          default_vendor_name: string | null
          description: string | null
          designer_name: string | null
          discontinued: boolean | null
          erp_item_id: string | null
          factory_id: string | null
          id: string
          last_matched_at: string | null
          license_status: string | null
          licensor_name: string | null
          match_confidence: string
          match_notes: Json
          match_status: string
          notes: string | null
          plm_item_id: string | null
          pre_production_status: string | null
          production_status: string | null
          public_licensor_id: string | null
          raw_row_data: Json
          royalty: string | null
          sku: string | null
          source_row_number: number | null
          source_sheet: string
          source_workbook_id: string
          style_group_id: string | null
          style_tracker_row_id: string
          tracker_type: string
          upc: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          bridge_source?: string
          commissioned?: string | null
          company_id?: string | null
          concept_status?: string | null
          core_licensor_id?: string | null
          created_at?: string
          creative_designer_id?: string | null
          customer_name?: string | null
          customer_sku?: string | null
          default_vendor_name?: string | null
          description?: string | null
          designer_name?: string | null
          discontinued?: boolean | null
          erp_item_id?: string | null
          factory_id?: string | null
          id?: string
          last_matched_at?: string | null
          license_status?: string | null
          licensor_name?: string | null
          match_confidence?: string
          match_notes?: Json
          match_status?: string
          notes?: string | null
          plm_item_id?: string | null
          pre_production_status?: string | null
          production_status?: string | null
          public_licensor_id?: string | null
          raw_row_data?: Json
          royalty?: string | null
          sku?: string | null
          source_row_number?: number | null
          source_sheet: string
          source_workbook_id: string
          style_group_id?: string | null
          style_tracker_row_id: string
          tracker_type: string
          upc?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          bridge_source?: string
          commissioned?: string | null
          company_id?: string | null
          concept_status?: string | null
          core_licensor_id?: string | null
          created_at?: string
          creative_designer_id?: string | null
          customer_name?: string | null
          customer_sku?: string | null
          default_vendor_name?: string | null
          description?: string | null
          designer_name?: string | null
          discontinued?: boolean | null
          erp_item_id?: string | null
          factory_id?: string | null
          id?: string
          last_matched_at?: string | null
          license_status?: string | null
          licensor_name?: string | null
          match_confidence?: string
          match_notes?: Json
          match_status?: string
          notes?: string | null
          plm_item_id?: string | null
          pre_production_status?: string | null
          production_status?: string | null
          public_licensor_id?: string | null
          raw_row_data?: Json
          royalty?: string | null
          sku?: string | null
          source_row_number?: number | null
          source_sheet?: string
          source_workbook_id?: string
          style_group_id?: string | null
          style_tracker_row_id?: string
          tracker_type?: string
          upc?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "style_tracker_item_bridge_plm_item_id_fkey"
            columns: ["plm_item_id"]
            isOneToOne: false
            referencedRelation: "item"
            referencedColumns: ["id"]
          },
        ]
      }
      style_tracker_value_resolution: {
        Row: {
          confidence: string
          created_at: string
          field_key: string
          id: string
          local_value: string | null
          normalized_value: string
          notes: Json
          raw_value: string
          resolution_type: string
          target_id: string | null
          target_label: string | null
          target_schema: string | null
          target_table: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          confidence?: string
          created_at?: string
          field_key: string
          id?: string
          local_value?: string | null
          normalized_value: string
          notes?: Json
          raw_value: string
          resolution_type: string
          target_id?: string | null
          target_label?: string | null
          target_schema?: string | null
          target_table?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          confidence?: string
          created_at?: string
          field_key?: string
          id?: string
          local_value?: string | null
          normalized_value?: string
          notes?: Json
          raw_value?: string
          resolution_type?: string
          target_id?: string | null
          target_label?: string | null
          target_schema?: string | null
          target_table?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      taxonomy_baseline_activation: {
        Row: {
          activated_at: string
          activated_by: string
          activated_reason: string
          baseline_key: string
          intended_environment: string
          singleton: boolean
          updated_at: string
        }
        Insert: {
          activated_at?: string
          activated_by: string
          activated_reason: string
          baseline_key: string
          intended_environment: string
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          activated_at?: string
          activated_by?: string
          activated_reason?: string
          baseline_key?: string
          intended_environment?: string
          singleton?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      taxonomy_baseline_pin: {
        Row: {
          baseline_key: string
          created_at: string
          effective_from: string
          expected_int: number | null
          expected_text: string | null
          id: string
          metric_key: string
          metric_kind: string
          pinned_by: string
          pinned_reason: string
          source_migration: string
          superseded_at: string | null
        }
        Insert: {
          baseline_key: string
          created_at?: string
          effective_from: string
          expected_int?: number | null
          expected_text?: string | null
          id?: string
          metric_key: string
          metric_kind: string
          pinned_by: string
          pinned_reason: string
          source_migration: string
          superseded_at?: string | null
        }
        Update: {
          baseline_key?: string
          created_at?: string
          effective_from?: string
          expected_int?: number | null
          expected_text?: string | null
          id?: string
          metric_key?: string
          metric_kind?: string
          pinned_by?: string
          pinned_reason?: string
          source_migration?: string
          superseded_at?: string | null
        }
        Relationships: []
      }
      taxonomy_circuit_breaker: {
        Row: {
          alert_id: string | null
          environment: string | null
          failed_invariant: string | null
          lane: string
          related_run_id: string | null
          reset_at: string | null
          reset_authorization: Json | null
          reset_by: string | null
          state: string
          trip_provenance: string | null
          tripped_at: string | null
          tripped_by: string | null
          tripped_reason: string | null
          updated_at: string
        }
        Insert: {
          alert_id?: string | null
          environment?: string | null
          failed_invariant?: string | null
          lane: string
          related_run_id?: string | null
          reset_at?: string | null
          reset_authorization?: Json | null
          reset_by?: string | null
          state?: string
          trip_provenance?: string | null
          tripped_at?: string | null
          tripped_by?: string | null
          tripped_reason?: string | null
          updated_at?: string
        }
        Update: {
          alert_id?: string | null
          environment?: string | null
          failed_invariant?: string | null
          lane?: string
          related_run_id?: string | null
          reset_at?: string | null
          reset_authorization?: Json | null
          reset_by?: string | null
          state?: string
          trip_provenance?: string | null
          tripped_at?: string | null
          tripped_by?: string | null
          tripped_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "taxonomy_circuit_breaker_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_sync_alert"
            referencedColumns: ["id"]
          },
        ]
      }
      taxonomy_circuit_breaker_event: {
        Row: {
          actor: string | null
          alert_id: string | null
          environment: string | null
          event: string
          failed_invariant: string | null
          id: string
          is_drill: boolean
          lane: string
          occurred_at: string
          payload: Json
          reason: string | null
          related_run_id: string | null
          trip_provenance: string | null
        }
        Insert: {
          actor?: string | null
          alert_id?: string | null
          environment?: string | null
          event: string
          failed_invariant?: string | null
          id?: string
          is_drill?: boolean
          lane: string
          occurred_at?: string
          payload?: Json
          reason?: string | null
          related_run_id?: string | null
          trip_provenance?: string | null
        }
        Update: {
          actor?: string | null
          alert_id?: string | null
          environment?: string | null
          event?: string
          failed_invariant?: string | null
          id?: string
          is_drill?: boolean
          lane?: string
          occurred_at?: string
          payload?: Json
          reason?: string | null
          related_run_id?: string | null
          trip_provenance?: string | null
        }
        Relationships: []
      }
      taxonomy_parallel_observation: {
        Row: {
          baseline_ok: boolean
          coldlion_mirror_key_hash: string
          coldlion_ok: boolean
          coldlion_run_finished_at: string | null
          coldlion_run_id: string | null
          coldlion_run_status: string | null
          coldlion_source_ref_count: number
          comparison_run_id: string | null
          created_at: string
          designflow_ok: boolean
          designflow_run_finished_at: string | null
          designflow_run_id: string | null
          designflow_run_status: string | null
          designflow_source_ref_count: number
          details: Json
          id: string
          immutability_ok: boolean
          is_drill: boolean
          licensor_count: number
          licensor_status_hash: string
          licensor_uuid_hash: string
          linked_licensor_count: number
          linked_property_count: number
          links_ok: boolean
          observation_date: string
          observed_at: string
          open_review_count: number
          parent_edge_hash: string
          pass: boolean
          prior_coldlion_source_ref_count: number | null
          prior_licensor_status_hash: string | null
          prior_licensor_uuid_hash: string | null
          prior_linked_licensor_count: number | null
          prior_linked_property_count: number | null
          prior_observation_date: string | null
          prior_observation_id: string | null
          prior_parent_edge_hash: string | null
          prior_property_status_hash: string | null
          prior_property_uuid_hash: string | null
          prior_source_ref_hash: string | null
          prior_status_hash: string | null
          property_count: number
          property_status_hash: string
          property_uuid_hash: string
          source_ref_hash: string
          status_hash: string
          taxonomy_source_ref_count: number
          unexplained_diff_count: number
        }
        Insert: {
          baseline_ok: boolean
          coldlion_mirror_key_hash: string
          coldlion_ok: boolean
          coldlion_run_finished_at?: string | null
          coldlion_run_id?: string | null
          coldlion_run_status?: string | null
          coldlion_source_ref_count: number
          comparison_run_id?: string | null
          created_at?: string
          designflow_ok: boolean
          designflow_run_finished_at?: string | null
          designflow_run_id?: string | null
          designflow_run_status?: string | null
          designflow_source_ref_count: number
          details?: Json
          id?: string
          immutability_ok: boolean
          is_drill?: boolean
          licensor_count: number
          licensor_status_hash: string
          licensor_uuid_hash: string
          linked_licensor_count: number
          linked_property_count: number
          links_ok: boolean
          observation_date: string
          observed_at?: string
          open_review_count?: number
          parent_edge_hash: string
          pass: boolean
          prior_coldlion_source_ref_count?: number | null
          prior_licensor_status_hash?: string | null
          prior_licensor_uuid_hash?: string | null
          prior_linked_licensor_count?: number | null
          prior_linked_property_count?: number | null
          prior_observation_date?: string | null
          prior_observation_id?: string | null
          prior_parent_edge_hash?: string | null
          prior_property_status_hash?: string | null
          prior_property_uuid_hash?: string | null
          prior_source_ref_hash?: string | null
          prior_status_hash?: string | null
          property_count: number
          property_status_hash: string
          property_uuid_hash: string
          source_ref_hash: string
          status_hash: string
          taxonomy_source_ref_count: number
          unexplained_diff_count?: number
        }
        Update: {
          baseline_ok?: boolean
          coldlion_mirror_key_hash?: string
          coldlion_ok?: boolean
          coldlion_run_finished_at?: string | null
          coldlion_run_id?: string | null
          coldlion_run_status?: string | null
          coldlion_source_ref_count?: number
          comparison_run_id?: string | null
          created_at?: string
          designflow_ok?: boolean
          designflow_run_finished_at?: string | null
          designflow_run_id?: string | null
          designflow_run_status?: string | null
          designflow_source_ref_count?: number
          details?: Json
          id?: string
          immutability_ok?: boolean
          is_drill?: boolean
          licensor_count?: number
          licensor_status_hash?: string
          licensor_uuid_hash?: string
          linked_licensor_count?: number
          linked_property_count?: number
          links_ok?: boolean
          observation_date?: string
          observed_at?: string
          open_review_count?: number
          parent_edge_hash?: string
          pass?: boolean
          prior_coldlion_source_ref_count?: number | null
          prior_licensor_status_hash?: string | null
          prior_licensor_uuid_hash?: string | null
          prior_linked_licensor_count?: number | null
          prior_linked_property_count?: number | null
          prior_observation_date?: string | null
          prior_observation_id?: string | null
          prior_parent_edge_hash?: string | null
          prior_property_status_hash?: string | null
          prior_property_uuid_hash?: string | null
          prior_source_ref_hash?: string | null
          prior_status_hash?: string | null
          property_count?: number
          property_status_hash?: string
          property_uuid_hash?: string
          source_ref_hash?: string
          status_hash?: string
          taxonomy_source_ref_count?: number
          unexplained_diff_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "plm_taxonomy_parallel_observation_prior_fk"
            columns: ["prior_observation_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_parallel_observation"
            referencedColumns: ["id"]
          },
        ]
      }
      taxonomy_resolution_review: {
        Row: {
          company_code: string | null
          confidence: string
          created_at: string
          division_code: string | null
          entity_type: string
          evidence: Json
          finding_scope: string
          id: string
          match_method: string | null
          mg_code: string | null
          mg_type_code: string | null
          proposed_licensor_id: string | null
          proposed_property_id: string | null
          reason: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          resolved_licensor_id: string | null
          resolved_property_id: string | null
          source_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_code?: string | null
          confidence: string
          created_at?: string
          division_code?: string | null
          entity_type: string
          evidence?: Json
          finding_scope: string
          id?: string
          match_method?: string | null
          mg_code?: string | null
          mg_type_code?: string | null
          proposed_licensor_id?: string | null
          proposed_property_id?: string | null
          reason: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_licensor_id?: string | null
          resolved_property_id?: string | null
          source_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_code?: string | null
          confidence?: string
          created_at?: string
          division_code?: string | null
          entity_type?: string
          evidence?: Json
          finding_scope?: string
          id?: string
          match_method?: string | null
          mg_code?: string | null
          mg_type_code?: string | null
          proposed_licensor_id?: string | null
          proposed_property_id?: string | null
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_licensor_id?: string | null
          resolved_property_id?: string | null
          source_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      taxonomy_sync_alert: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
          fired_at: string
          id: string
          is_drill: boolean
          observation_date: string | null
          observation_id: string | null
          payload: Json
          reason: string
          related_run_id: string | null
          severity: string
          source_name: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          fired_at?: string
          id?: string
          is_drill?: boolean
          observation_date?: string | null
          observation_id?: string | null
          payload?: Json
          reason: string
          related_run_id?: string | null
          severity: string
          source_name: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          fired_at?: string
          id?: string
          is_drill?: boolean
          observation_date?: string | null
          observation_id?: string | null
          payload?: Json
          reason?: string
          related_run_id?: string | null
          severity?: string
          source_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "taxonomy_sync_alert_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_parallel_observation"
            referencedColumns: ["id"]
          },
        ]
      }
      UDFComponent: {
        Row: {
          UDFComponent_id: number
          UDFComponent_name: string
        }
        Insert: {
          UDFComponent_id?: never
          UDFComponent_name: string
        }
        Update: {
          UDFComponent_id?: never
          UDFComponent_name?: string
        }
        Relationships: []
      }
      UDFElement: {
        Row: {
          UDFElement_component_id_fk: number
          UDFElement_data_key: string
          UDFElement_display_name: string
          UDFElement_height: string
          UDFElement_id: number
          UDFElement_layer: number
          UDFElement_table_id_fk: number
          UDFElement_type_id_fk: number
          UDFElement_visibility: string
          UDFElement_width: string
          UDFGroup_id_fk: number
        }
        Insert: {
          UDFElement_component_id_fk: number
          UDFElement_data_key: string
          UDFElement_display_name: string
          UDFElement_height: string
          UDFElement_id?: never
          UDFElement_layer: number
          UDFElement_table_id_fk: number
          UDFElement_type_id_fk: number
          UDFElement_visibility: string
          UDFElement_width: string
          UDFGroup_id_fk: number
        }
        Update: {
          UDFElement_component_id_fk?: number
          UDFElement_data_key?: string
          UDFElement_display_name?: string
          UDFElement_height?: string
          UDFElement_id?: never
          UDFElement_layer?: number
          UDFElement_table_id_fk?: number
          UDFElement_type_id_fk?: number
          UDFElement_visibility?: string
          UDFElement_width?: string
          UDFGroup_id_fk?: number
        }
        Relationships: []
      }
      UDFElementType: {
        Row: {
          UDFElementType_id: number
          UDFElementType_name: string
        }
        Insert: {
          UDFElementType_id?: never
          UDFElementType_name: string
        }
        Update: {
          UDFElementType_id?: never
          UDFElementType_name?: string
        }
        Relationships: []
      }
      UDFGroup: {
        Row: {
          UDFGroup_id: number
          UDFGroup_layer: string
          UDFGroup_name: string
        }
        Insert: {
          UDFGroup_id?: never
          UDFGroup_layer: string
          UDFGroup_name: string
        }
        Update: {
          UDFGroup_id?: never
          UDFGroup_layer?: string
          UDFGroup_name?: string
        }
        Relationships: []
      }
      UDFQuery: {
        Row: {
          UDFQuery_column_name: string
          UDFQuery_condition: string
          UDFQuery_id: number
        }
        Insert: {
          UDFQuery_column_name: string
          UDFQuery_condition: string
          UDFQuery_id: number
        }
        Update: {
          UDFQuery_column_name?: string
          UDFQuery_condition?: string
          UDFQuery_id?: number
        }
        Relationships: []
      }
      UDFTable: {
        Row: {
          container_id: string | null
          nickname: string | null
          UDFComponent_id_fk: number
          UDFElement_id_fk: number
          UDFTable_associate_type: string
          UDFTable_foreignKey: string
          UDFTable_id: number
          UDFTable_name: string
          UDFTable_primary_id: string
          UDFTable_query_id_fk: number | null
          UDFTable_targetKey: string
        }
        Insert: {
          container_id?: string | null
          nickname?: string | null
          UDFComponent_id_fk: number
          UDFElement_id_fk: number
          UDFTable_associate_type: string
          UDFTable_foreignKey: string
          UDFTable_id: number
          UDFTable_name: string
          UDFTable_primary_id: string
          UDFTable_query_id_fk?: number | null
          UDFTable_targetKey: string
        }
        Update: {
          container_id?: string | null
          nickname?: string | null
          UDFComponent_id_fk?: number
          UDFElement_id_fk?: number
          UDFTable_associate_type?: string
          UDFTable_foreignKey?: string
          UDFTable_id?: number
          UDFTable_name?: string
          UDFTable_primary_id?: string
          UDFTable_query_id_fk?: number | null
          UDFTable_targetKey?: string
        }
        Relationships: []
      }
      vendor_exclusion: {
        Row: {
          created_at: string
          excluded_by: string
          reason: string
          source_id: string
          source_system: string
          source_table: string
        }
        Insert: {
          created_at?: string
          excluded_by?: string
          reason: string
          source_id: string
          source_system?: string
          source_table?: string
        }
        Update: {
          created_at?: string
          excluded_by?: string
          reason?: string
          source_id?: string
          source_system?: string
          source_table?: string
        }
        Relationships: []
      }
      vendor_quarantine: {
        Row: {
          created_at: string
          id: string
          payload: Json
          reason: string
          source_id: string | null
          sync_run_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          payload: Json
          reason: string
          source_id?: string | null
          sync_run_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          reason?: string
          source_id?: string | null
          sync_run_id?: string | null
        }
        Relationships: []
      }
      wb_asset: {
        Row: {
          asset_source_id: string
          captured_date: string
          character_labels: string
          created_date: string | null
          file_name: string
          file_size_bytes: number | null
          first_seen_at: string
          franchise_labels: string
          imported_at: string
          last_seen_at: string
          modified_date: string | null
          property_labels: string
          raw: Json
          season: string | null
          source_hash: string
          source_path: string
          source_url: string
          style_guide_natural_key: string | null
          style_guide_source_id: string
          updated_at: string
          warner_asset_id: string | null
        }
        Insert: {
          asset_source_id: string
          captured_date: string
          character_labels: string
          created_date?: string | null
          file_name: string
          file_size_bytes?: number | null
          first_seen_at?: string
          franchise_labels: string
          imported_at?: string
          last_seen_at?: string
          modified_date?: string | null
          property_labels: string
          raw: Json
          season?: string | null
          source_hash: string
          source_path: string
          source_url: string
          style_guide_natural_key?: string | null
          style_guide_source_id?: string
          updated_at?: string
          warner_asset_id?: string | null
        }
        Update: {
          asset_source_id?: string
          captured_date?: string
          character_labels?: string
          created_date?: string | null
          file_name?: string
          file_size_bytes?: number | null
          first_seen_at?: string
          franchise_labels?: string
          imported_at?: string
          last_seen_at?: string
          modified_date?: string | null
          property_labels?: string
          raw?: Json
          season?: string | null
          source_hash?: string
          source_path?: string
          source_url?: string
          style_guide_natural_key?: string | null
          style_guide_source_id?: string
          updated_at?: string
          warner_asset_id?: string | null
        }
        Relationships: []
      }
      wb_asset_character: {
        Row: {
          asset_source_id: string
          captured_date: string
          character_label: string
          character_source_id: string
          file_name: string
          first_seen_at: string
          imported_at: string
          last_seen_at: string
          raw: Json
          source_hash: string
          source_url: string
          updated_at: string
        }
        Insert: {
          asset_source_id: string
          captured_date: string
          character_label: string
          character_source_id: string
          file_name: string
          first_seen_at?: string
          imported_at?: string
          last_seen_at?: string
          raw: Json
          source_hash: string
          source_url: string
          updated_at?: string
        }
        Update: {
          asset_source_id?: string
          captured_date?: string
          character_label?: string
          character_source_id?: string
          file_name?: string
          first_seen_at?: string
          imported_at?: string
          last_seen_at?: string
          raw?: Json
          source_hash?: string
          source_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      wb_asset_franchise_property: {
        Row: {
          asset_source_id: string
          captured_date: string
          file_name: string
          first_seen_at: string
          franchise_property_label: string
          franchise_property_source_id: string
          imported_at: string
          last_seen_at: string
          raw: Json
          source_hash: string
          source_url: string
          updated_at: string
        }
        Insert: {
          asset_source_id: string
          captured_date: string
          file_name: string
          first_seen_at?: string
          franchise_property_label: string
          franchise_property_source_id?: string
          imported_at?: string
          last_seen_at?: string
          raw: Json
          source_hash: string
          source_url: string
          updated_at?: string
        }
        Update: {
          asset_source_id?: string
          captured_date?: string
          file_name?: string
          first_seen_at?: string
          franchise_property_label?: string
          franchise_property_source_id?: string
          imported_at?: string
          last_seen_at?: string
          raw?: Json
          source_hash?: string
          source_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      wb_asset_style_guide: {
        Row: {
          asset_source_id: string
          captured_date: string
          file_name: string
          first_seen_at: string
          imported_at: string
          last_seen_at: string
          raw: Json
          source_hash: string
          source_url: string
          style_guide_natural_key: string
          style_guide_source_id: string
          updated_at: string
        }
        Insert: {
          asset_source_id: string
          captured_date: string
          file_name: string
          first_seen_at?: string
          imported_at?: string
          last_seen_at?: string
          raw: Json
          source_hash: string
          source_url: string
          style_guide_natural_key: string
          style_guide_source_id?: string
          updated_at?: string
        }
        Update: {
          asset_source_id?: string
          captured_date?: string
          file_name?: string
          first_seen_at?: string
          imported_at?: string
          last_seen_at?: string
          raw?: Json
          source_hash?: string
          source_url?: string
          style_guide_natural_key?: string
          style_guide_source_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      wb_capture: {
        Row: {
          capture_id: string
          captured_at: string | null
          captured_by: string | null
          chunk_number: number
          chunk_sha256: string | null
          completed_at: string | null
          created_at: string
          expected_row_count: number | null
          failure_message: string | null
          loader_report: Json | null
          notes: string | null
          payload: Json | null
          payload_cleared_at: string | null
          payload_row_count: number | null
          private_source_commit: string | null
          snapshot_sha256: string | null
          source_url: string | null
          started_at: string | null
          status: string | null
          target: string | null
        }
        Insert: {
          capture_id?: string
          captured_at?: string | null
          captured_by?: string | null
          chunk_number: number
          chunk_sha256?: string | null
          completed_at?: string | null
          created_at?: string
          expected_row_count?: number | null
          failure_message?: string | null
          loader_report?: Json | null
          notes?: string | null
          payload?: Json | null
          payload_cleared_at?: string | null
          payload_row_count?: number | null
          private_source_commit?: string | null
          snapshot_sha256?: string | null
          source_url?: string | null
          started_at?: string | null
          status?: string | null
          target?: string | null
        }
        Update: {
          capture_id?: string
          captured_at?: string | null
          captured_by?: string | null
          chunk_number?: number
          chunk_sha256?: string | null
          completed_at?: string | null
          created_at?: string
          expected_row_count?: number | null
          failure_message?: string | null
          loader_report?: Json | null
          notes?: string | null
          payload?: Json | null
          payload_cleared_at?: string | null
          payload_row_count?: number | null
          private_source_commit?: string | null
          snapshot_sha256?: string | null
          source_url?: string | null
          started_at?: string | null
          status?: string | null
          target?: string | null
        }
        Relationships: []
      }
      wb_character: {
        Row: {
          captured_date: string
          first_seen_at: string
          imported_at: string
          label: string
          last_seen_at: string
          raw: Json
          source_hash: string
          source_id: string
          source_term: string
          source_url: string
          updated_at: string
          visible_asset_count: number | null
        }
        Insert: {
          captured_date: string
          first_seen_at?: string
          imported_at?: string
          label: string
          last_seen_at?: string
          raw: Json
          source_hash: string
          source_id?: string
          source_term: string
          source_url: string
          updated_at?: string
          visible_asset_count?: number | null
        }
        Update: {
          captured_date?: string
          first_seen_at?: string
          imported_at?: string
          label?: string
          last_seen_at?: string
          raw?: Json
          source_hash?: string
          source_id?: string
          source_term?: string
          source_url?: string
          updated_at?: string
          visible_asset_count?: number | null
        }
        Relationships: []
      }
      wb_franchise_property: {
        Row: {
          captured_date: string
          first_seen_at: string
          imported_at: string
          label: string
          last_seen_at: string
          raw: Json
          source_hash: string
          source_id: string
          source_term: string
          source_url: string
          updated_at: string
          visible_asset_count: number | null
        }
        Insert: {
          captured_date: string
          first_seen_at?: string
          imported_at?: string
          label: string
          last_seen_at?: string
          raw: Json
          source_hash: string
          source_id?: string
          source_term: string
          source_url: string
          updated_at?: string
          visible_asset_count?: number | null
        }
        Update: {
          captured_date?: string
          first_seen_at?: string
          imported_at?: string
          label?: string
          last_seen_at?: string
          raw?: Json
          source_hash?: string
          source_id?: string
          source_term?: string
          source_url?: string
          updated_at?: string
          visible_asset_count?: number | null
        }
        Relationships: []
      }
      wb_property_character: {
        Row: {
          captured_at: string
          character_label: string
          character_source_id: string
          first_seen_at: string
          id_fallback: boolean
          imported_at: string
          last_seen_at: string
          property_id: string | null
          property_label: string
          property_source_id: string
          raw: Json
          resolution_reason: string | null
          resolution_status: string
          resolved_at: string | null
          resolved_by: string | null
          source_hash: string
          source_url: string
          updated_at: string
        }
        Insert: {
          captured_at: string
          character_label: string
          character_source_id: string
          first_seen_at?: string
          id_fallback: boolean
          imported_at?: string
          last_seen_at?: string
          property_id?: string | null
          property_label: string
          property_source_id: string
          raw: Json
          resolution_reason?: string | null
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          source_hash: string
          source_url: string
          updated_at?: string
        }
        Update: {
          captured_at?: string
          character_label?: string
          character_source_id?: string
          first_seen_at?: string
          id_fallback?: boolean
          imported_at?: string
          last_seen_at?: string
          property_id?: string | null
          property_label?: string
          property_source_id?: string
          raw?: Json
          resolution_reason?: string | null
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          source_hash?: string
          source_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      wb_style_guide: {
        Row: {
          captured_date: string
          first_seen_at: string
          imported_at: string
          last_seen_at: string
          raw: Json
          source_hash: string
          source_id: string
          source_term: string
          source_url: string
          style_guide_natural_key: string
          updated_at: string
          visible_asset_count: number | null
        }
        Insert: {
          captured_date: string
          first_seen_at?: string
          imported_at?: string
          last_seen_at?: string
          raw: Json
          source_hash: string
          source_id?: string
          source_term: string
          source_url: string
          style_guide_natural_key: string
          updated_at?: string
          visible_asset_count?: number | null
        }
        Update: {
          captured_date?: string
          first_seen_at?: string
          imported_at?: string
          last_seen_at?: string
          raw?: Json
          source_hash?: string
          source_id?: string
          source_term?: string
          source_url?: string
          style_guide_natural_key?: string
          updated_at?: string
          visible_asset_count?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acknowledge_taxonomy_sync_alert: {
        Args: { p_acknowledgement: Json; p_alert_id: string }
        Returns: Json
      }
      activate_taxonomy_baseline: {
        Args: {
          p_activated_by: string
          p_activated_reason: string
          p_baseline_key: string
          p_intended_environment: string
        }
        Returns: Json
      }
      active_taxonomy_baseline_key: { Args: never; Returns: string }
      apply_style_tracker_designer_resolutions: { Args: never; Returns: number }
      assert_dam_order_keys: {
        Args: { p_allowed: string[]; p_payload: Json; p_what: string }
        Returns: undefined
      }
      assert_taxonomy_alert_ack_authority: { Args: never; Returns: string }
      begin_nbcu_capture: {
        Args: {
          p_capture_key: string
          p_created_by: string
          p_expected_counts: Json
          p_portal_base_url: string
          p_raw_summary: Json
          p_read_commit_sha?: string
          p_source_captured_at: string
          p_source_commit_sha: string
          p_source_manifest_sha256: string
          p_source_repository: string
        }
        Returns: string
      }
      begin_pmt_capture: {
        Args: {
          p_capture_kind: string
          p_captured_by: string
          p_expectations?: Json
          p_library_name: string
          p_licensed_property_selection_count: number
          p_licensed_title_count: number
          p_manifest_sha256: string
          p_metadata_batch_count: number
          p_notes?: string
          p_portal_global_asset_count: number
          p_private_source_commit: string
          p_property_result_row_count: number
          p_source_url: string
          p_started_at: string
          p_unique_asset_count: number
        }
        Returns: string
      }
      begin_wb_capture: {
        Args: {
          p_captured_at: string
          p_captured_by: string
          p_expected_row_count: number
          p_notes?: string
          p_private_source_commit: string
          p_snapshot_sha256: string
          p_source_url: string
          p_target: string
        }
        Returns: string
      }
      check_taxonomy_sync_health: {
        Args: { p_max_success_age?: string; p_options?: Json }
        Returns: Json
      }
      coldlion_normalize_name: { Args: { p_value: string }; Returns: string }
      compute_taxonomy_immutability_snapshot: { Args: never; Returns: Json }
      dam_order_allowed_header_keys: { Args: never; Returns: string[] }
      dam_order_allowed_line_keys: { Args: never; Returns: string[] }
      deployment_environment_is_configured: { Args: never; Returns: boolean }
      fail_pmt_capture: {
        Args: { p_capture_id: string; p_reason: string }
        Returns: undefined
      }
      fail_wb_capture: {
        Args: { p_capture_id: string; p_reason: string }
        Returns: undefined
      }
      finalize_nbcu_capture: { Args: { p_capture_id: string }; Returns: Json }
      finalize_pmt_capture: {
        Args: { p_capture_id: string; p_manifest_sha256: string }
        Returns: {
          actual: number
          check_name: string
          detail: string
          expected: number
          ok: boolean
        }[]
      }
      finalize_wb_capture: {
        Args: {
          p_capture_id: string
          p_max_shrink_fraction?: number
          p_snapshot_sha256: string
        }
        Returns: {
          mode: string
          rows_collapsed: number
          rows_inserted: number
          rows_landed: number
          rows_missing: number
          rows_orphan_identity: number
          rows_seen: number
          rows_unchanged: number
          rows_updated: number
          snapshot_captured_at: string
          snapshot_hash: string
        }[]
      }
      import_coldlion_customers: {
        Args: { customers_payload: Json }
        Returns: {
          canonical_created: number
          canonical_matched: number
          customers_active: number
          customers_seen: number
          sync_run_id: string
        }[]
      }
      import_item_master_data: {
        Args: { import_payload: Json }
        Returns: {
          rows_ambiguous: number
          rows_inserted: number
          rows_partially_resolved: number
          rows_resolved: number
          rows_seen: number
          rows_unresolved: number
          rows_updated: number
          sync_run_id: string
        }[]
      }
      import_master_data: {
        Args: { customers_payload: Json; licensors_payload: Json }
        Returns: {
          customers_seen: number
          licensors_seen: number
          properties_seen: number
          raw_records_upserted: number
          sync_run_id: string
        }[]
      }
      import_merch_group_headers: {
        Args: { headers_payload: Json }
        Returns: {
          rows_inserted: number
          rows_seen: number
          rows_updated: number
          sync_run_id: string
        }[]
      }
      link_coldlion_licensors_properties_approved: {
        Args: { p_expected: Json; p_input: Json }
        Returns: {
          cross_entity_collisions: number
          division_count: number
          licensor_rows: number
          mode: string
          property_rows: number
          rows_inserted: number
          rows_seen: number
          rows_unchanged: number
          rows_updated: number
          snapshot_hash: string
          sync_run_id: string
        }[]
      }
      link_coldlion_licensors_properties_core: {
        Args: { p_expected: Json; p_input: Json }
        Returns: {
          cross_entity_collisions: number
          division_count: number
          licensor_rows: number
          mode: string
          property_rows: number
          rows_inserted: number
          rows_seen: number
          rows_unchanged: number
          rows_updated: number
          snapshot_hash: string
          sync_run_id: string
        }[]
      }
      load_pmt_capture_chunk: {
        Args: { p_capture_id: string; p_rows: Json; p_target: string }
        Returns: number
      }
      load_wb_chunk: {
        Args: {
          p_capture_id: string
          p_chunk_number: number
          p_chunk_sha256: string
          p_rows_json: string
        }
        Returns: number
      }
      normalize_style_tracker_value: {
        Args: { p_field_key: string; p_value: string }
        Returns: string
      }
      opa_loader_privilege_ok: {
        Args: { p_role: string; p_session_user: string }
        Returns: boolean
      }
      pmt_loader_privilege_ok: {
        Args: { p_role: string; p_session_user: string }
        Returns: boolean
      }
      pmt_refresh_shrink_check: {
        Args: { p_capture_id: string }
        Returns: {
          detail: string
          new_count: number
          ok: boolean
          old_count: number
          population: string
        }[]
      }
      promote_coldlion_source_owned: {
        Args: { p_client_plan?: Json; p_expected: Json; p_is_drill?: boolean }
        Returns: {
          curated_name_changes: number
          linked_rows: number
          mode: string
          promotions: number
          protected_violations: number
          provenance_refreshes: number
          quarantined_rows: number
          source_rows: number
          sync_run_id: string
          unchanged_rows: number
        }[]
      }
      record_taxonomy_circuit_breaker_blocked_attempt: {
        Args: {
          p_actor?: string
          p_lane?: string
          p_payload?: Json
          p_reason: string
        }
        Returns: string
      }
      record_taxonomy_parallel_observation: {
        Args: { p_observation_date?: string; p_options?: Json }
        Returns: Json
      }
      record_taxonomy_sync_alert: {
        Args: {
          p_is_drill?: boolean
          p_observation_date?: string
          p_observation_id?: string
          p_payload?: Json
          p_reason: string
          p_related_run_id?: string
          p_severity: string
          p_source_name: string
        }
        Returns: string
      }
      refresh_style_tracker_item_bridge: {
        Args: never
        Returns: {
          inserted_count: number
          total_count: number
          updated_count: number
        }[]
      }
      reset_taxonomy_circuit_breaker: {
        Args: { p_authorization: Json; p_lane?: string }
        Returns: Json
      }
      resolve_deployment_environment: { Args: never; Returns: string }
      sync_coldlion_licensors_properties: {
        Args: { p_link_expected?: Json; p_mode?: string; p_snapshot: Json }
        Returns: {
          cross_entity_collisions: number
          division_count: number
          licensor_rows: number
          mode: string
          property_rows: number
          rows_inserted: number
          rows_seen: number
          rows_unchanged: number
          rows_updated: number
          snapshot_hash: string
          sync_run_id: string
        }[]
      }
      sync_coldlion_vendors: {
        Args: { vendors_payload: Json }
        Returns: {
          rows_deleted: number
          rows_failed: number
          rows_inserted: number
          rows_seen: number
          rows_skipped: number
          rows_updated: number
          sync_run_id: string
        }[]
      }
      sync_opa_property_character: {
        Args: {
          p_max_shrink_fraction?: number
          p_mode?: string
          p_snapshot: Json
        }
        Returns: {
          captured_at: string
          distinct_character: number
          distinct_property: number
          mode: string
          rows_inserted: number
          rows_missing: number
          rows_seen: number
          rows_unchanged: number
          rows_updated: number
          snapshot_hash: string
        }[]
      }
      sync_wb_asset: {
        Args: {
          p_max_shrink_fraction?: number
          p_mode?: string
          p_snapshot: Json
        }
        Returns: {
          mode: string
          rows_collapsed: number
          rows_inserted: number
          rows_landed: number
          rows_missing: number
          rows_orphan_identity: number
          rows_seen: number
          rows_unchanged: number
          rows_updated: number
          snapshot_captured_at: string
          snapshot_hash: string
        }[]
      }
      sync_wb_asset_character: {
        Args: {
          p_max_shrink_fraction?: number
          p_mode?: string
          p_snapshot: Json
        }
        Returns: {
          mode: string
          rows_collapsed: number
          rows_inserted: number
          rows_landed: number
          rows_missing: number
          rows_orphan_identity: number
          rows_seen: number
          rows_unchanged: number
          rows_updated: number
          snapshot_captured_at: string
          snapshot_hash: string
        }[]
      }
      sync_wb_asset_franchise_property: {
        Args: {
          p_max_shrink_fraction?: number
          p_mode?: string
          p_snapshot: Json
        }
        Returns: {
          mode: string
          rows_collapsed: number
          rows_inserted: number
          rows_landed: number
          rows_missing: number
          rows_orphan_identity: number
          rows_seen: number
          rows_unchanged: number
          rows_updated: number
          snapshot_captured_at: string
          snapshot_hash: string
        }[]
      }
      sync_wb_asset_style_guide: {
        Args: {
          p_max_shrink_fraction?: number
          p_mode?: string
          p_snapshot: Json
        }
        Returns: {
          mode: string
          rows_collapsed: number
          rows_inserted: number
          rows_landed: number
          rows_missing: number
          rows_orphan_identity: number
          rows_seen: number
          rows_unchanged: number
          rows_updated: number
          snapshot_captured_at: string
          snapshot_hash: string
        }[]
      }
      sync_wb_character: {
        Args: {
          p_max_shrink_fraction?: number
          p_mode?: string
          p_snapshot: Json
        }
        Returns: {
          mode: string
          rows_collapsed: number
          rows_inserted: number
          rows_landed: number
          rows_missing: number
          rows_orphan_identity: number
          rows_seen: number
          rows_unchanged: number
          rows_updated: number
          snapshot_captured_at: string
          snapshot_hash: string
        }[]
      }
      sync_wb_franchise_property: {
        Args: {
          p_max_shrink_fraction?: number
          p_mode?: string
          p_snapshot: Json
        }
        Returns: {
          mode: string
          rows_collapsed: number
          rows_inserted: number
          rows_landed: number
          rows_missing: number
          rows_orphan_identity: number
          rows_seen: number
          rows_unchanged: number
          rows_updated: number
          snapshot_captured_at: string
          snapshot_hash: string
        }[]
      }
      sync_wb_property_character: {
        Args: {
          p_max_shrink_fraction?: number
          p_mode?: string
          p_snapshot: Json
        }
        Returns: {
          mode: string
          rows_collapsed: number
          rows_inserted: number
          rows_landed: number
          rows_missing: number
          rows_orphan_identity: number
          rows_seen: number
          rows_unchanged: number
          rows_updated: number
          snapshot_captured_at: string
          snapshot_hash: string
        }[]
      }
      sync_wb_style_guide: {
        Args: {
          p_max_shrink_fraction?: number
          p_mode?: string
          p_snapshot: Json
        }
        Returns: {
          mode: string
          rows_collapsed: number
          rows_inserted: number
          rows_landed: number
          rows_missing: number
          rows_orphan_identity: number
          rows_seen: number
          rows_unchanged: number
          rows_updated: number
          snapshot_captured_at: string
          snapshot_hash: string
        }[]
      }
      taxonomy_alert_actor_looks_automated: {
        Args: { p_name: string }
        Returns: boolean
      }
      taxonomy_baseline_pin_set: {
        Args: { p_baseline_key?: string }
        Returns: Json
      }
      taxonomy_breaker_enforcement_status: { Args: never; Returns: Json }
      taxonomy_circuit_breaker_is_open: {
        Args: { p_lane?: string }
        Returns: boolean
      }
      taxonomy_circuit_breaker_state: {
        Args: { p_lane?: string }
        Returns: Json
      }
      trip_taxonomy_circuit_breaker: {
        Args: {
          p_actor?: string
          p_environment?: string
          p_failed_invariant: string
          p_is_drill?: boolean
          p_lane?: string
          p_payload?: Json
          p_provenance?: string
          p_reason: string
          p_related_run_id?: string
        }
        Returns: Json
      }
      validate_pmt_capture: {
        Args: { p_capture_id: string }
        Returns: {
          actual: number
          check_name: string
          detail: string
          expected: number
          ok: boolean
        }[]
      }
      verify_coldlion_approved_mapping_identity: {
        Args: { p_expected?: Json; p_input: Json; p_sample_limit?: number }
        Returns: Json
      }
      wb_loader_privilege_ok: {
        Args: { p_role: string; p_session_user: string }
        Returns: boolean
      }
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
      entity_status: ["active", "inactive", "archived", "deleted", "potential"],
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
  dam: {
    Enums: {},
  },
  ingest: {
    Enums: {
      sync_status: ["pending", "running", "succeeded", "failed", "cancelled"],
    },
  },
  pim: {
    Enums: {},
  },
  plm: {
    Enums: {},
  },
} as const
