import { getApiBaseUrl, getMapboxToken } from "./runtime";

// AWS Configuration for TJProHammer Photography App
export const AWS_CONFIG = {
  // AWS Region
  region: "us-west-2",

  // Cognito Configuration
  cognito: {
    userPoolId: "us-west-2_kmvZNhjYz",
    userPoolClientId: "1l6njios7u3b91nsfkvt5g9d48",
    identityPoolId: "us-west-2:26ed07e8-5279-4640-ab6d-893f30bd99ef",
    domain: "https://photography-admin-pool.auth.us-west-2.amazoncognito.com", // This may need to be configured
  },

  // API Gateway Configuration
  apiGateway: {
    baseUrl:
      "https://5cjnp8rcga.execute-api.us-west-2.amazonaws.com/staging_api",
    endpoints: {
      // Photography pins CRUD endpoints
      pins: "/locations",
      pinById: (id: string) => `/locations/${id}`,

      // Admin authentication endpoints
      adminAuth: {
        login: "/admin/auth/login",
        validate: "/admin/auth/validate",
        refresh: "/admin/auth/refresh",
      },

      // Image management endpoints
      images: {
        list: "/admin/images/list",
        upload: "/admin/images/upload",
        delete: "/admin/images/delete",
      },

      // Contact form endpoint
      contact: "/email",
    },
  },

  // S3 Configuration
  s3: {
    photographyBucket: "tjprohammer-photography-data-v3",
    region: "us-west-2",
  },

  // CloudFront Configuration
  cloudfront: {
    photographyDistributionId: "E17G4DHRSL3ZXY",
    photographyDomain: "https://d2pwhdqiz6vt1n.cloudfront.net",
  },
};

// Environment-specific overrides
const isDevelopment = import.meta.env.MODE === "development";
const isProduction = import.meta.env.MODE === "production";

const defaultApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_GATEWAY_URL ||
  AWS_CONFIG.apiGateway.baseUrl;

const defaultMapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "";

export const ENV_CONFIG = {
  isDevelopment,
  isProduction,
  apiBaseUrl:
    getApiBaseUrl(defaultApiBaseUrl) || AWS_CONFIG.apiGateway.baseUrl,
  mapboxToken: getMapboxToken(defaultMapboxToken),
};
