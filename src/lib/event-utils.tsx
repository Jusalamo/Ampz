import { Event } from '@/lib/types';

/**
 * Check if event is currently live
 * Event is live from 30 minutes before start time until end time
 */
export function isEventLive(event: Event): boolean {
  const now = new Date();
  const eventDate = new Date(event.date);
  const [startHours, startMinutes] = event.time.split(':').map(Number);
  
  const eventStart = new Date(eventDate);
  eventStart.setHours(startHours, startMinutes, 0, 0);
  
  const checkInStart = new Date(eventStart.getTime() - 30 * 60 * 1000);
  
  // If event has endTime, use it, otherwise default to 4 hours after start
  let eventEnd: Date;
  if (event.endTime) {
    const [endHours, endMinutes] = event.endTime.split(':').map(Number);
    eventEnd = new Date(eventDate);
    eventEnd.setHours(endHours, endMinutes, 0, 0);
  } else {
    // Default to 4 hours after start if no end time specified
    eventEnd = new Date(eventStart.getTime() + 4 * 60 * 60 * 1000);
  }
  
  return now >= checkInStart && now <= eventEnd;
}

/**
 * Check if check-in is currently allowed for an event
 * Allows check-in from 30 minutes before start until event ends
 */
export function isCheckInAllowed(event: Event): boolean {
  const now = new Date();
  const eventDate = new Date(event.date);
  const [startHours, startMinutes] = event.time.split(':').map(Number);
  
  const eventStart = new Date(eventDate);
  eventStart.setHours(startHours, startMinutes, 0, 0);
  
  const checkInStart = new Date(eventStart.getTime() - 30 * 60 * 1000);
  
  // If event has endTime, use it, otherwise default to 4 hours after start
  let eventEnd: Date;
  if (event.endTime) {
    const [endHours, endMinutes] = event.endTime.split(':').map(Number);
    eventEnd = new Date(eventDate);
    eventEnd.setHours(endHours, endMinutes, 0, 0);
  } else {
    // Default to 4 hours after start if no end time specified
    eventEnd = new Date(eventStart.getTime() + 4 * 60 * 60 * 1000);
  }
  
  return now >= checkInStart && now <= eventEnd;
}

/**
 * Get event status with detailed information
 */
export function getEventStatus(event: Event): {
  isLive: boolean;
  canCheckIn: boolean;
  statusText: string;
  statusColor: string;
  timeRemaining?: string;
} {
  const now = new Date();
  const eventDate = new Date(event.date);
  const [startHours, startMinutes] = event.time.split(':').map(Number);
  
  const eventStart = new Date(eventDate);
  eventStart.setHours(startHours, startMinutes, 0, 0);
  
  const checkInStart = new Date(eventStart.getTime() - 30 * 60 * 1000);
  
  // Determine end time
  let eventEnd: Date;
  if (event.endTime) {
    const [endHours, endMinutes] = event.endTime.split(':').map(Number);
    eventEnd = new Date(eventDate);
    eventEnd.setHours(endHours, endMinutes, 0, 0);
  } else {
    eventEnd = new Date(eventStart.getTime() + 4 * 60 * 60 * 1000);
  }
  
  const isLive = now >= checkInStart && now <= eventEnd;
  const canCheckIn = isLive && event.isActive;
  
  // Determine status text
  let statusText = '';
  let statusColor = '';
  
  if (now < checkInStart) {
    const hoursUntil = Math.floor((checkInStart.getTime() - now.getTime()) / (1000 * 60 * 60));
    if (hoursUntil > 24) {
      const days = Math.floor(hoursUntil / 24);
      statusText = `Starts in ${days} day${days > 1 ? 's' : ''}`;
    } else if (hoursUntil > 0) {
      statusText = `Starts in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}`;
    } else {
      const minutesUntil = Math.floor((checkInStart.getTime() - now.getTime()) / (1000 * 60));
      statusText = `Starts in ${minutesUntil} minute${minutesUntil > 1 ? 's' : ''}`;
    }
    statusColor = 'text-blue-500';
  } else if (now >= checkInStart && now < eventStart) {
    statusText = 'Check-in Open';
    statusColor = 'text-green-500';
  } else if (now >= eventStart && now <= eventEnd) {
    statusText = 'Live Now';
    statusColor = 'text-red-500';
    
    // Calculate time remaining
    const minutesRemaining = Math.floor((eventEnd.getTime() - now.getTime()) / (1000 * 60));
    if (minutesRemaining < 60) {
      statusText += ` • ${minutesRemaining}m left`;
    } else {
      const hoursRemaining = Math.floor(minutesRemaining / 60);
      statusText += ` • ${hoursRemaining}h left`;
    }
  } else {
    statusText = 'Event Ended';
    statusColor = 'text-gray-500';
  }
  
  return {
    isLive,
    canCheckIn,
    statusText,
    statusColor
  };
}

/**
 * Format event time display
 */
export function formatEventTime(event: Event): string {
  const startTime = event.time;
  if (event.endTime) {
    return `${startTime} - ${event.endTime}`;
  }
  return startTime;
}

/**
 * Get time until event starts (for countdown)
 */
export function getTimeUntilEvent(event: Event): string {
  const now = new Date();
  const eventDate = new Date(event.date);
  const [hours, minutes] = event.time.split(':').map(Number);
  
  const eventStart = new Date(eventDate);
  eventStart.setHours(hours, minutes, 0, 0);
  
  const diffMs = eventStart.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Event Started';
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}d ${hoursRemaining}h`;
  } else if (hoursRemaining > 0) {
    return `${hoursRemaining}h ${minutesRemaining}m`;
  } else {
    return `${minutesRemaining}m`;
  }
}
