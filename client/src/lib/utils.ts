export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
}

export function formatDate(date: string | Date, format: 'short' | 'long' | 'time' = 'short'): string {
  const d = new Date(date);
  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    case 'long':
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    case 'time':
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
}

export function formatDateDDMMYYYY(date: string): string {
  const d = date.split('T')[0];
  if (!d) return date;
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export function formatTimeHHMM(time: string): string {
  return time ? time.slice(0, 5) : time;
}

export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function generateId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PT-${timestamp}${random}`;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const statusColors: Record<string, 'green' | 'red' | 'yellow' | 'blue' | 'orange' | 'purple' | 'cyan'> = {
  Active: 'green',
  Inactive: 'red',
  Paid: 'green',
  Unpaid: 'red',
  Partial: 'yellow',
  Overdue: 'orange',
  Scheduled: 'blue',
  Confirmed: 'cyan',
  Completed: 'green',
  Cancelled: 'red',
  'No Show': 'orange',
  'In Progress': 'purple',
};
