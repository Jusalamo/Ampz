import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/lib/types';
import { generateEventToken, generateAccessCode, buildCheckInURL, generateQRCodeDataURL } from '@/lib/qr-utils';

export function useEvents(userId?: string, isDemo?: boolean) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }), []);

  // Fetch events from database
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('date', { ascending: true });

      // In production mode, exclude demo events
      if (!isDemo) {
        query = query.eq('is_demo', false);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setEvents((data || []).map(rowToEvent));
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
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newEvent = rowToEvent(payload.new);
            if (!isDemo && newEvent.isDemo) return; // Skip demo events in production
            setEvents(prev => [...prev, newEvent]);
          } else if (payload.eventType === 'UPDATE') {
            setEvents(prev => prev.map(e => 
              e.id === payload.new.id ? rowToEvent(payload.new) : e
            ));
          } else if (payload.eventType === 'DELETE') {
            setEvents(prev => prev.filter(e => e.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEvents, isDemo, rowToEvent]);

  // Create a new event
  const createEvent = useCallback(async (eventData: Partial<Event>): Promise<Event | null> => {
    if (!userId) return null;

    try {
      const accessCode = generateAccessCode();
      const eventToken = generateEventToken(crypto.randomUUID());
      
      const insertData = {
        name: eventData.name || 'Untitled Event',
        description: eventData.description || '',
        category: eventData.category || 'other',
        location: eventData.location || '',
        address: eventData.address || '',
        latitude: eventData.coordinates?.lat || -22.5609,
        longitude: eventData.coordinates?.lng || 17.0658,
        date: eventData.date || new Date().toISOString().split('T')[0],
        time: eventData.time || '18:00',
        price: eventData.price || 0,
        currency: eventData.currency || 'NAD',
        max_attendees: eventData.maxAttendees || 500,
        attendees_count: 0,
        organizer_id: userId,
        qr_code: accessCode,
        access_code: accessCode,
        geofence_radius: eventData.geofenceRadius || 50,
        custom_theme: eventData.customTheme || '#8B5CF6',
        cover_image: eventData.coverImage || '',
        images: eventData.images || [],
        videos: eventData.videos || [],
        tags: eventData.tags || [],
        is_featured: eventData.isFeatured || false,
        is_demo: isDemo || false,
        is_active: true,
        has_video: (eventData.videos?.length || 0) > 0,
        media_type: eventData.mediaType || 'carousel',
        notifications_enabled: eventData.notificationsEnabled ?? true,
      };

      const { data, error } = await supabase
        .from('events')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating event:', error);
        return null;
      }

      return rowToEvent(data);
    } catch (err) {
      console.error('Error creating event:', err);
      return null;
    }
  }, [userId, isDemo, rowToEvent]);

  // Update an event
  const updateEvent = useCallback(async (eventId: string, updates: Partial<Event>): Promise<boolean> => {
    try {
      const dbUpdates: Record<string, any> = {};
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.address !== undefined) dbUpdates.address = updates.address;
      if (updates.coordinates !== undefined) {
        dbUpdates.latitude = updates.coordinates.lat;
        dbUpdates.longitude = updates.coordinates.lng;
      }
      if (updates.date !== undefined) dbUpdates.date = updates.date;
      if (updates.time !== undefined) dbUpdates.time = updates.time;
      if (updates.price !== undefined) dbUpdates.price = updates.price;
      if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
      if (updates.maxAttendees !== undefined) dbUpdates.max_attendees = updates.maxAttendees;
      if (updates.geofenceRadius !== undefined) dbUpdates.geofence_radius = updates.geofenceRadius;
      if (updates.customTheme !== undefined) dbUpdates.custom_theme = updates.customTheme;
      if (updates.coverImage !== undefined) dbUpdates.cover_image = updates.coverImage;
      if (updates.images !== undefined) dbUpdates.images = updates.images;
      if (updates.videos !== undefined) {
        dbUpdates.videos = updates.videos;
        dbUpdates.has_video = updates.videos.length > 0;
      }
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
      if (updates.isFeatured !== undefined) dbUpdates.is_featured = updates.isFeatured;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.mediaType !== undefined) dbUpdates.media_type = updates.mediaType;
      if (updates.notificationsEnabled !== undefined) dbUpdates.notifications_enabled = updates.notificationsEnabled;

      const { error } = await supabase
        .from('events')
        .update(dbUpdates)
        .eq('id', eventId);

      if (error) {
        console.error('Error updating event:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error updating event:', err);
      return false;
    }
  }, []);

  // Delete an event
  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) {
        console.error('Error deleting event:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error deleting event:', err);
      return false;
    }
  }, []);

  // Get event by ID
  const getEventById = useCallback((eventId: string): Event | undefined => {
    return events.find(e => e.id === eventId);
  }, [events]);

  // Get suggested events based on user preferences
  const getSuggestedEvents = useCallback((userInterests: string[] = [], limit: number = 4): Event[] => {
    if (userInterests.length === 0) {
      return events.filter(e => e.isFeatured).slice(0, limit);
    }

    // Score events by matching interests/categories
    const scored = events.map(event => {
      let score = 0;
      if (event.isFeatured) score += 2;
      if (userInterests.some(i => event.category.toLowerCase().includes(i.toLowerCase()))) score += 3;
      if (userInterests.some(i => event.tags.some(t => t.toLowerCase().includes(i.toLowerCase())))) score += 1;
      return { event, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.event);
  }, [events]);

  // Get upcoming events
  const getUpcomingEvents = useCallback((limit: number = 6): Event[] => {
    const today = new Date().toISOString().split('T')[0];
    return events
      .filter(e => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, limit);
  }, [events]);

  // Generate QR code for an event
  const generateEventQR = useCallback(async (eventId: string): Promise<string | null> => {
    const event = events.find(e => e.id === eventId);
    if (!event) return null;

    try {
      const token = generateEventToken(eventId);
      const checkInUrl = buildCheckInURL(eventId, token);
      const qrDataUrl = await generateQRCodeDataURL(checkInUrl);
      return qrDataUrl;
    } catch (err) {
      console.error('Error generating QR code:', err);
      return null;
    }
  }, [events]);

  return {
    events,
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventById,
    getSuggestedEvents,
    getUpcomingEvents,
    generateEventQR,
    refetch: fetchEvents,
  };
}
