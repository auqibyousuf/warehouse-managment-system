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
