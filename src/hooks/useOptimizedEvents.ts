import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/lib/types';

// Optimized events hook with caching and preloading
export function useOptimizedEvents(userId?: string, isDemo?: boolean) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, Event>>(new Map());
  const fetchedRef = useRef(false);

  // Convert database row to Event type
  const rowToEvent = useCallback((row: any): Event => ({
    id: row.id,
    name: row.name,
    description: row.description || '',
    category: row.category,
    location: row.location,
    address: row.address,
    coordinates: { lat: row.latitude, lng: row.longitude },
    date: row.date,
    time: row.time,
    endTime: row.end_time,
    endedAt: row.ended_at,
    price: row.price || 0,
    currency: row.currency || 'NAD',
    maxAttendees: row.max_attendees || 500,
    attendees: row.attendees_count || 0,
    organizerId: row.organizer_id,
    qrCode: row.qr_code,
    geofenceRadius: row.geofence_radius || 50,
    customTheme: row.custom_theme || '#8B5CF6',
    coverImage: row.cover_image || '',
    images: row.images || [],
    videos: row.videos || [],
    tags: row.tags || [],
    isFeatured: row.is_featured || false,
    isDemo: row.is_demo || false,
    isActive: row.is_active ?? true,
    hasVideo: row.has_video || false,
    mediaType: row.media_type || 'carousel',
    notificationsEnabled: row.notifications_enabled ?? true,
    updatedAt: row.updated_at,
    ticketLink: row.ticket_link || '',
    webTicketsLink: row.ticket_link || '',
    accessCode: row.access_code || '',
  }), []);

  // Fast initial fetch with limited fields
  const fetchEvents = useCallback(async () => {
    if (fetchedRef.current) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Fetch only essential fields first for fast load
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .eq('is_demo', isDemo || false)
        .order('date', { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      const mappedEvents = (data || []).map(rowToEvent);
      
      // Update cache
      mappedEvents.forEach(e => cacheRef.current.set(e.id, e));
      
      setEvents(mappedEvents);
      fetchedRef.current = true;
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  }, [isDemo, rowToEvent]);

  // Subscribe to real-time updates
  useEffect(() => {
    fetchEvents();

    const channel = supabase
      .channel('events-optimized')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'events',
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newEvent = rowToEvent(payload.new);
          if (!isDemo && newEvent.isDemo) return;
          cacheRef.current.set(newEvent.id, newEvent);
          setEvents(prev => [...prev, newEvent]);
        } else if (payload.eventType === 'UPDATE') {
          const updatedEvent = rowToEvent(payload.new);
          cacheRef.current.set(updatedEvent.id, updatedEvent);
          setEvents(prev => prev.map(e => e.id === payload.new.id ? updatedEvent : e));
        } else if (payload.eventType === 'DELETE') {
          cacheRef.current.delete(payload.old.id);
          setEvents(prev => prev.filter(e => e.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEvents, isDemo, rowToEvent]);

  // Get event from cache
  const getEventById = useCallback((eventId: string): Event | undefined => {
    return cacheRef.current.get(eventId) || events.find(e => e.id === eventId);
  }, [events]);

  // Force refetch
  const refetch = useCallback(async () => {
    fetchedRef.current = false;
    await fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    isLoading,
    error,
    getEventById,
    refetch,
  };
}
