/**
 * BatchIQ - API Client
 * Simulates asynchronous network communication, database transactions,
 * and server-side authoritative business rules with latency.
 */

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

const SIMULATED_LATENCY_MS = 150;

export const simulateNetwork = async <T>(resolver: () => T | Promise<T>): Promise<T> => {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
  return resolver();
};

export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
};

/**
 * Next sequential document number for the current year (e.g. INV-2026-004).
 * Based on the highest existing number so deleting a record never causes duplicates.
 */
export const nextDocumentNumber = (prefix: string, existing: string[]): string => {
  const year = new Date().getFullYear();
  const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`);
  const highest = existing.reduce((max, num) => {
    const match = pattern.exec(num);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
  return `${prefix}-${year}-${String(highest + 1).padStart(3, '0')}`;
};
