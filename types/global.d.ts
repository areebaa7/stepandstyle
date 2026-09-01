export {};

declare global {
  interface Window {
    fbq?: (action: string, eventName: string, options?: Record<string, unknown>) => void;
    _fbq?: Window['fbq'];
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
