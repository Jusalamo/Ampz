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
      check_ins: {
        Row: {
          check_in_latitude: number
          check_in_longitude: number
          checked_in_at: string | null
          created_at: string | null
          distance_from_venue: number | null
          event_id: string | null
          id: string
          ticket_id: string | null
          user_id: string | null
          verification_method: string | null
          verification_photo: string | null
          visibility_mode: string
          within_geofence: boolean
        }
        Insert: {
          check_in_latitude: number
          check_in_longitude: number
          checked_in_at?: string | null
          created_at?: string | null
          distance_from_venue?: number | null
          event_id?: string | null
          id?: string
          ticket_id?: string | null
          user_id?: string | null
          verification_method?: string | null
          verification_photo?: string | null
          visibility_mode: string
          within_geofence: boolean
        }
        Update: {
          check_in_latitude?: number
          check_in_longitude?: number
          checked_in_at?: string | null
          created_at?: string | null
          distance_from_venue?: number | null
          event_id?: string | null
          id?: string
          ticket_id?: string | null
          user_id?: string | null
          verification_method?: string | null
          verification_photo?: string | null
          visibility_mode?: string
          within_geofence?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comments: {
        Row: {
          content: string
          created_at: string | null
          event_id: string | null
          id: string
          is_demo: boolean | null
          liked_by: string[] | null
          likes_count: number | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_status: string | null
          reply_to: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_demo?: boolean | null
          liked_by?: string[] | null
          likes_count?: number | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_status?: string | null
          reply_to?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_demo?: boolean | null
          liked_by?: string[] | null
          likes_count?: number | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_status?: string | null
          reply_to?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      community_photos: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          image_url: string
          is_demo: boolean | null
          liked_by: string[] | null
          likes_count: number | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          image_url: string
          is_demo?: boolean | null
          liked_by?: string[] | null
          likes_count?: number | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          image_url?: string
          is_demo?: boolean | null
          liked_by?: string[] | null
          likes_count?: number | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_photos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_photos_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_photos_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      content_moderation_actions: {
        Row: {
          action: string
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          moderator_id: string | null
          reason: string | null
        }
        Insert: {
          action: string
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          moderator_id?: string | null
          reason?: string | null
        }
        Update: {
          action?: string
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          moderator_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_moderation_actions_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_moderation_actions_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tokens: {
        Row: {
          created_at: string
          event_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          token_hash: string
        }
        Insert: {
          created_at?: string
          event_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          token_hash: string
        }
        Update: {
          created_at?: string
          event_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_tokens_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          access_code: string | null
          address: string
          attendees_count: number | null
          category: string
          cover_image: string | null
          created_at: string | null
          currency: string | null
          custom_theme: string | null
          date: string
          description: string | null
          end_time: string | null
          ended_at: string | null
          geofence_radius: number | null
          has_video: boolean | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_demo: boolean | null
          is_featured: boolean | null
          latitude: number
          location: string
          longitude: number
          max_attendees: number | null
          media_type: string | null
          name: string
          notifications_enabled: boolean | null
          organizer_id: string | null
          price: number | null
          qr_code: string
          tags: string[] | null
          ticket_link: string | null
          time: string
          timezone: string | null
          updated_at: string | null
          videos: string[] | null
        }
        Insert: {
          access_code?: string | null
          address: string
          attendees_count?: number | null
          category: string
          cover_image?: string | null
          created_at?: string | null
          currency?: string | null
          custom_theme?: string | null
          date: string
          description?: string | null
          end_time?: string | null
          ended_at?: string | null
          geofence_radius?: number | null
          has_video?: boolean | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_demo?: boolean | null
          is_featured?: boolean | null
          latitude: number
          location: string
          longitude: number
          max_attendees?: number | null
          media_type?: string | null
          name: string
          notifications_enabled?: boolean | null
          organizer_id?: string | null
          price?: number | null
          qr_code: string
          tags?: string[] | null
          ticket_link?: string | null
          time: string
          timezone?: string | null
          updated_at?: string | null
          videos?: string[] | null
        }
        Update: {
          access_code?: string | null
          address?: string
          attendees_count?: number | null
          category?: string
          cover_image?: string | null
          created_at?: string | null
          currency?: string | null
          custom_theme?: string | null
          date?: string
          description?: string | null
          end_time?: string | null
          ended_at?: string | null
          geofence_radius?: number | null
          has_video?: boolean | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_demo?: boolean | null
          is_featured?: boolean | null
          latitude?: number
          location?: string
          longitude?: number
          max_attendees?: number | null
          media_type?: string | null
          name?: string
          notifications_enabled?: boolean | null
          organizer_id?: string | null
          price?: number | null
          qr_code?: string
          tags?: string[] | null
          ticket_link?: string | null
          time?: string
          timezone?: string | null
          updated_at?: string | null
          videos?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_requests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          id: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      match_profiles: {
        Row: {
          age: number | null
          bio: string | null
          check_in_id: string | null
          created_at: string | null
          display_name: string
          event_id: string | null
          gender: string | null
          id: string
          interests: string[] | null
          is_active: boolean | null
          is_demo: boolean | null
          is_public: boolean | null
          location: string | null
          occupation: string | null
          profile_photos: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          age?: number | null
          bio?: string | null
          check_in_id?: string | null
          created_at?: string | null
          display_name: string
          event_id?: string | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          is_active?: boolean | null
          is_demo?: boolean | null
          is_public?: boolean | null
          location?: string | null
          occupation?: string | null
          profile_photos?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          age?: number | null
          bio?: string | null
          check_in_id?: string | null
          created_at?: string | null
          display_name?: string
          event_id?: string | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          is_active?: boolean | null
          is_demo?: boolean | null
          is_public?: boolean | null
          location?: string | null
          occupation?: string | null
          profile_photos?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_profiles_check_in_id_fkey"
            columns: ["check_in_id"]
            isOneToOne: false
            referencedRelation: "check_ins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_profiles_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          is_demo: boolean | null
          is_muted: boolean | null
          is_pinned: boolean | null
          last_message: string | null
          last_message_time: string | null
          last_message_unread: boolean | null
          matched_at: string | null
          status: string | null
          unmatched_at: string | null
          unmatched_by: string | null
          user1_id: string | null
          user2_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_demo?: boolean | null
          is_muted?: boolean | null
          is_pinned?: boolean | null
          last_message?: string | null
          last_message_time?: string | null
          last_message_unread?: boolean | null
          matched_at?: string | null
          status?: string | null
          unmatched_at?: string | null
          unmatched_by?: string | null
          user1_id?: string | null
          user2_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_demo?: boolean | null
          is_muted?: boolean | null
          is_pinned?: boolean | null
          last_message?: string | null
          last_message_time?: string | null
          last_message_unread?: boolean | null
          matched_at?: string | null
          status?: string | null
          unmatched_at?: string | null
          unmatched_by?: string | null
          user1_id?: string | null
          user2_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_unmatched_by_fkey"
            columns: ["unmatched_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_unmatched_by_fkey"
            columns: ["unmatched_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          match_id: string | null
          media_url: string | null
          message_type: string | null
          read_at: string | null
          receiver_id: string | null
          sender_id: string | null
          sent_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          match_id?: string | null
          media_url?: string | null
          message_type?: string | null
          read_at?: string | null
          receiver_id?: string | null
          sender_id?: string | null
          sent_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          match_id?: string | null
          media_url?: string | null
          message_type?: string | null
          read_at?: string | null
          receiver_id?: string | null
          sender_id?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_demo: boolean | null
          is_read: boolean | null
          message: string
          related_event_id: string | null
          related_match_id: string | null
          related_user_id: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_demo?: boolean | null
          is_read?: boolean | null
          message: string
          related_event_id?: string | null
          related_match_id?: string | null
          related_user_id?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_demo?: boolean | null
          is_read?: boolean | null
          message?: string
          related_event_id?: string | null
          related_match_id?: string | null
          related_user_id?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_match_id_fkey"
            columns: ["related_match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          bio: string | null
          blocked_users: string[] | null
          bookmarked_events: string[] | null
          company: string | null
          created_at: string | null
          created_events: string[] | null
          email: string | null
          failed_login_attempts: number | null
          gender: string | null
          id: string
          interests: string[] | null
          is_demo_account: boolean | null
          is_verified: boolean | null
          last_like_reset: string | null
          last_login_at: string | null
          likes_remaining: number | null
          location: string | null
          locked_until: string | null
          name: string | null
          occupation: string | null
          phone: string | null
          profile_photo: string | null
          settings: Json | null
          subscription_expires_at: string | null
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          bio?: string | null
          blocked_users?: string[] | null
          bookmarked_events?: string[] | null
          company?: string | null
          created_at?: string | null
          created_events?: string[] | null
          email?: string | null
          failed_login_attempts?: number | null
          gender?: string | null
          id: string
          interests?: string[] | null
          is_demo_account?: boolean | null
          is_verified?: boolean | null
          last_like_reset?: string | null
          last_login_at?: string | null
          likes_remaining?: number | null
          location?: string | null
          locked_until?: string | null
          name?: string | null
          occupation?: string | null
          phone?: string | null
          profile_photo?: string | null
          settings?: Json | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          bio?: string | null
          blocked_users?: string[] | null
          bookmarked_events?: string[] | null
          company?: string | null
          created_at?: string | null
          created_events?: string[] | null
          email?: string | null
          failed_login_attempts?: number | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          is_demo_account?: boolean | null
          is_verified?: boolean | null
          last_like_reset?: string | null
          last_login_at?: string | null
          likes_remaining?: number | null
          location?: string | null
          locked_until?: string | null
          name?: string | null
          occupation?: string | null
          phone?: string | null
          profile_photo?: string | null
          settings?: Json | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      swipes: {
        Row: {
          direction: string
          event_id: string | null
          id: string
          swiped_at: string | null
          swiped_id: string | null
          swiper_id: string | null
        }
        Insert: {
          direction: string
          event_id?: string | null
          id?: string
          swiped_at?: string | null
          swiped_id?: string | null
          swiper_id?: string | null
        }
        Update: {
          direction?: string
          event_id?: string | null
          id?: string
          swiped_at?: string | null
          swiped_id?: string | null
          swiper_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "swipes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swipes_swiped_id_fkey"
            columns: ["swiped_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swipes_swiped_id_fkey"
            columns: ["swiped_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swipes_swiper_id_fkey"
            columns: ["swiper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swipes_swiper_id_fkey"
            columns: ["swiper_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          amount_paid: number
          checked_in_at: string | null
          created_at: string | null
          currency: string
          event_id: string | null
          external_ticket_id: string | null
          id: string
          is_demo: boolean | null
          payment_provider: string | null
          payment_status: string | null
          purchase_reference: string
          purchase_source: string
          purchased_at: string | null
          qr_code: string
          quantity: number | null
          ticket_status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount_paid?: number
          checked_in_at?: string | null
          created_at?: string | null
          currency?: string
          event_id?: string | null
          external_ticket_id?: string | null
          id?: string
          is_demo?: boolean | null
          payment_provider?: string | null
          payment_status?: string | null
          purchase_reference: string
          purchase_source: string
          purchased_at?: string | null
          qr_code: string
          quantity?: number | null
          ticket_status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount_paid?: number
          checked_in_at?: string | null
          created_at?: string | null
          currency?: string
          event_id?: string | null
          external_ticket_id?: string | null
          id?: string
          is_demo?: boolean | null
          payment_provider?: string | null
          payment_status?: string | null
          purchase_reference?: string
          purchase_source?: string
          purchased_at?: string | null
          qr_code?: string
          quantity?: number | null
          ticket_status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          age: number | null
          bio: string | null
          company: string | null
          created_at: string | null
          gender: string | null
          id: string | null
          interests: string[] | null
          is_verified: boolean | null
          location: string | null
          name: string | null
          occupation: string | null
          profile_photo: string | null
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          bio?: string | null
          company?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string | null
          interests?: string[] | null
          is_verified?: boolean | null
          location?: string | null
          name?: string | null
          occupation?: string | null
          profile_photo?: string | null
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          bio?: string | null
          company?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string | null
          interests?: string[] | null
          is_verified?: boolean | null
          location?: string | null
          name?: string | null
          occupation?: string | null
          profile_photo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_friend_request: { Args: { request_id: string }; Returns: boolean }
      calculate_distance: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      create_event_token: {
        Args: {
          p_event_id: string
          p_expires_at?: string
          p_token_hash: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      secure_check_in: {
        Args: {
          p_event_id: string
          p_user_lat: number
          p_user_lng: number
          p_verification_method?: string
          p_visibility_mode?: string
        }
        Returns: string
      }
      validate_event_token: {
        Args: { p_event_id: string; p_token_hash: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
