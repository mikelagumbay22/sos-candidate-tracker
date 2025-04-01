import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from "date-fns"
import { zonedTimeToUtc, utcToZonedTime } from "date-fns-tz"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateToEST(date: string | Date, formatString: string = "MM/dd/yyyy hh:mm a"): string {
  if (!date) return "N/A"
  
  const estDate = utcToZonedTime(new Date(date), "America/New_York")
  return format(estDate, formatString)
}

export function formatDistanceToNowEST(date: string | Date): string {
  if (!date) return "Unknown date"
  
  const estDate = utcToZonedTime(new Date(date), "America/New_York")
  return formatDistanceToNow(estDate, { addSuffix: true })
}
