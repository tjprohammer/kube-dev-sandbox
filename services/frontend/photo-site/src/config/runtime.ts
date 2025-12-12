type RuntimeAppConfig = {
  mapboxToken?: string;
  apiBaseUrl?: string;
};

const hasWindow = typeof window !== "undefined";

const normalizeValue = (value?: string | null): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const extractRuntimeConfig = (): RuntimeAppConfig => {
  if (!hasWindow) {
    return {};
  }
  return window.__APP_CONFIG__ ?? {};
};

export const runtimeConfig: RuntimeAppConfig = extractRuntimeConfig();

export const getMapboxToken = (fallback?: string): string => {
  const runtimeToken = normalizeValue(runtimeConfig.mapboxToken);
  if (runtimeToken) {
    return runtimeToken;
  }
  const envToken = normalizeValue(fallback);
  return envToken;
};

export const getApiBaseUrl = (fallback?: string): string => {
  const runtimeUrl = normalizeValue(runtimeConfig.apiBaseUrl);
  if (runtimeUrl) {
    return runtimeUrl;
  }
  const envUrl = normalizeValue(fallback);
  return envUrl;
};
