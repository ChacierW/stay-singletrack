// Utility functions for managing email in localStorage

const EMAIL_STORAGE_KEY = 'stay_singletrack_user_email';

/**
 * Save user email to localStorage
 */
export function saveEmail(email: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EMAIL_STORAGE_KEY, email);
  } catch (error) {
    console.error('Failed to save email to localStorage:', error);
  }
}

/**
 * Get saved email from localStorage
 */
export function getEmail(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(EMAIL_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to get email from localStorage:', error);
    return null;
  }
}

/**
 * Remove email from localStorage
 */
export function clearEmail(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(EMAIL_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear email from localStorage:', error);
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
