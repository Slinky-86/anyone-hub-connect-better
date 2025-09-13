import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get initials from a name string (e.g. "John Doe" -> "JD")
 */
export function getInitials(name: string): string {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Format a date object for message timestamps
 */
export function formatMessageDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // If the message is from today, show time
  if (date >= today) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // If the message is from yesterday, show "Yesterday"
  if (date >= yesterday && date < today) {
    return 'Yesterday';
  }
  
  // If the message is from this week, show day name
  const dayOfWeek = date.toLocaleDateString([], { weekday: 'short' });
  
  // If the message is from this year but not this week, show month and day
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  
  // If the message is from a different year, show month, day and year
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}
