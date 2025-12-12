export {};

declare global {
  interface Window {
    __APP_CONFIG__?: {
      mapboxToken?: string;
      apiBaseUrl?: string;
    };
  }
}
