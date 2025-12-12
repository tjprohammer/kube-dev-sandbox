// AWS Services Configuration and Client Setup
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  AuthFlowType,
  GlobalSignOutCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  CognitoIdentityClient,
  GetIdCommand,
  GetCredentialsForIdentityCommand,
} from "@aws-sdk/client-cognito-identity";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { AWS_CONFIG, ENV_CONFIG } from "../config/aws-config";

// Configure AWS Clients
export const cognitoClient = new CognitoIdentityProviderClient({
  region: AWS_CONFIG.region,
  credentials: undefined, // Use anonymous access for Cognito authentication
});

const cognitoIdentityClient = new CognitoIdentityClient({
  region: AWS_CONFIG.region,
});

// S3 client will be configured with credentials after authentication
export let s3Client = new S3Client({
  region: AWS_CONFIG.s3.region,
});

// Cognito Authentication Service
export class CognitoAuthService {
  static async signIn(username: string, password: string) {
    try {
      // Sanitize inputs: remove leading/trailing & internal disallowed whitespace characters that Cognito rejects.
      // Cognito regex from error: /[\p{L}\p{M}\p{S}\p{N}\p{P}]+/ which excludes whitespace categories.
      // Manually strip common whitespace & zero-width characters without using complex regex that linter flags
      const zeroWidthChars = ["\u200B", "\u200C", "\u200D", "\u2060", "\uFEFF"];
      let cleanedRaw = username;
      zeroWidthChars.forEach((ch) => {
        cleanedRaw = cleanedRaw.split(ch).join("");
      });
      // Remove standard whitespace characters
      cleanedRaw = cleanedRaw.replace(/\s+/g, "");
      const cleanUsername = cleanedRaw.trim();
      const cleanPassword = password.trim();

      if (!cleanUsername || !cleanPassword) {
        return { success: false, error: "Username and password are required." };
      }

      // Validate username against allowed pattern (approximation using Unicode classes not directly in JS regex)
      // We'll conservatively disallow spaces and control chars only.
      // Disallow control characters (charCode < 32) just via iteration
      const hasControl = Array.from(cleanUsername).some(
        (c) => c.charCodeAt(0) < 32
      );
      const invalidChar = hasControl; // spaces already removed
      if (invalidChar) {
        return {
          success: false,
          error:
            "Username contains whitespace or control characters. Remove spaces and try again.",
        };
      }

      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: AWS_CONFIG.cognito.userPoolClientId,
        AuthParameters: {
          USERNAME: cleanUsername,
          PASSWORD: cleanPassword,
        },
      });

      const response = await cognitoClient.send(command);

      // Handle different challenge types
      if (response.ChallengeName === "NEW_PASSWORD_REQUIRED") {
        return {
          success: false,
          error: "Password change required. Please contact administrator.",
        };
      }

      if (response.AuthenticationResult) {
        const tokens = {
          accessToken: response.AuthenticationResult.AccessToken!,
          idToken: response.AuthenticationResult.IdToken!,
          refreshToken: response.AuthenticationResult.RefreshToken!,
        };

        // Store tokens in localStorage
        localStorage.setItem("authTokens", JSON.stringify(tokens));

        // Get AWS credentials from Cognito Identity Pool
        await this.getAwsCredentials(tokens.idToken);

        return { success: true, tokens };
      }

      return { success: false, error: "Authentication failed" };
    } catch (error: unknown) {
      // Provide richer diagnostics in development mode
      if (import.meta.env.DEV) {
        console.error("Sign in error (detailed):", error);
        try {
          const dbg = {
            providedUsername: username,
            length: username.length,
            charCodes: Array.from(username).map((c) => c.charCodeAt(0)),
          };
          console.debug("Username diagnostics:", dbg);
        } catch {
          /* ignore */
        }
      } else {
        console.error("Sign in error:", error);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : "Authentication failed",
      };
    }
  }

  static async signOut() {
    try {
      const tokens = this.getStoredTokens();
      if (tokens?.accessToken) {
        const command = new GlobalSignOutCommand({
          AccessToken: tokens.accessToken,
        });
        await cognitoClient.send(command);
      }
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      // Always clear local storage
      localStorage.removeItem("authTokens");
    }
  }

  static getStoredTokens() {
    try {
      const stored = localStorage.getItem("authTokens");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  static isAuthenticated(): boolean {
    const tokens = this.getStoredTokens();
    return !!tokens?.accessToken;
  }

  static getAuthHeaders() {
    const tokens = this.getStoredTokens();
    if (tokens?.accessToken) {
      return {
        Authorization: `Bearer ${tokens.accessToken}`,
        "Content-Type": "application/json",
      };
    }
    return { "Content-Type": "application/json" };
  }

  static async getAwsCredentials(idToken: string) {
    try {
      console.log("Getting AWS credentials from Cognito Identity Pool...");

      // Get Identity ID from Cognito Identity Pool
      const getIdCommand = new GetIdCommand({
        IdentityPoolId: AWS_CONFIG.cognito.identityPoolId,
        Logins: {
          [`cognito-idp.${AWS_CONFIG.region}.amazonaws.com/${AWS_CONFIG.cognito.userPoolId}`]:
            idToken,
        },
      });

      const { IdentityId } = await cognitoIdentityClient.send(getIdCommand);

      if (!IdentityId) {
        throw new Error("Failed to get Identity ID");
      }

      console.log("Got Identity ID:", IdentityId);

      // Get temporary AWS credentials
      const getCredentialsCommand = new GetCredentialsForIdentityCommand({
        IdentityId,
        Logins: {
          [`cognito-idp.${AWS_CONFIG.region}.amazonaws.com/${AWS_CONFIG.cognito.userPoolId}`]:
            idToken,
        },
      });

      const { Credentials } = await cognitoIdentityClient.send(
        getCredentialsCommand
      );

      if (
        !Credentials?.AccessKeyId ||
        !Credentials?.SecretKey ||
        !Credentials?.SessionToken
      ) {
        throw new Error("Failed to get AWS credentials");
      }

      console.log("Got AWS credentials, updating S3 client");

      // Update S3 client with credentials
      s3Client = new S3Client({
        region: AWS_CONFIG.s3.region,
        credentials: {
          accessKeyId: Credentials.AccessKeyId,
          secretAccessKey: Credentials.SecretKey,
          sessionToken: Credentials.SessionToken,
          expiration: Credentials.Expiration,
        },
      });

      console.log("S3 client updated with credentials");

      return { success: true };
    } catch (error) {
      console.error("Error getting AWS credentials:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get credentials",
      };
    }
  }
}

// S3 Service for image operations
export class S3Service {
  static async uploadImage(
    file: File,
    key: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Check if credentials are configured, if not try to initialize them
      if (!s3Client.config.credentials) {
        console.warn(
          "S3 client has no credentials, attempting to initialize..."
        );

        // Try to get stored tokens and initialize credentials
        const tokens = CognitoAuthService.getStoredTokens();
        if (tokens?.idToken && tokens.idToken !== "temp-id-token") {
          console.log(
            "Found stored Cognito tokens, initializing credentials..."
          );
          const result = await CognitoAuthService.getAwsCredentials(
            tokens.idToken
          );
          if (!result.success) {
            console.error("Failed to initialize S3 credentials:", result.error);
            return {
              success: false,
              error:
                "S3 credentials not configured. Please log out and log back in with Cognito.",
            };
          }
        } else {
          console.error("No valid Cognito tokens found for S3 credentials");
          return {
            success: false,
            error:
              "S3 credentials not configured. Please log out and log back in with Cognito (not temp auth).",
          };
        }
      }

      // Convert File to ArrayBuffer for AWS SDK compatibility
      const fileBuffer = await file.arrayBuffer();

      const command = new PutObjectCommand({
        Bucket: AWS_CONFIG.s3.photographyBucket,
        Key: key,
        Body: new Uint8Array(fileBuffer),
        ContentType: file.type,
        Metadata: {
          originalName: file.name,
          uploadDate: new Date().toISOString(),
        },
      });

      console.log("Attempting S3 upload to:", key);
      await s3Client.send(command);

      // Use CloudFront URL instead of direct S3 URL for better performance and CORS
      const url = `${AWS_CONFIG.cloudfront.photographyDomain}/${key}`;

      console.log("Upload successful, URL:", url);

      return { success: true, url };
    } catch (error: unknown) {
      console.error("S3 upload error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  static async listImages(): Promise<{
    success: boolean;
    images?: string[];
    error?: string;
  }> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: AWS_CONFIG.s3.photographyBucket,
      });

      const response = await s3Client.send(command);
      const images = response.Contents?.map((obj) => obj.Key!) || [];

      return { success: true, images };
    } catch (error: unknown) {
      console.error("S3 list error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list images",
      };
    }
  }

  static async deleteImage(
    key: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: AWS_CONFIG.s3.photographyBucket,
        Key: key,
      });

      await s3Client.send(command);

      return { success: true };
    } catch (error: unknown) {
      console.error("S3 delete error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Delete failed",
      };
    }
  }
}

// API Gateway Service
export class ApiService {
  static async makeRequest(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: Record<string, unknown> | unknown,
    requireAuth: boolean = false
  ) {
    try {
      const url = `${ENV_CONFIG.apiBaseUrl}${endpoint}`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (requireAuth) {
        const authHeaders = CognitoAuthService.getAuthHeaders();
        Object.assign(headers, authHeaders);
      }

      const config: RequestInit = {
        method,
        headers,
        mode: "cors",
      };

      if (body && method !== "GET") {
        config.body = JSON.stringify(body);
      }

      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let data: unknown = undefined;
      if (response.status !== 204) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          data = await response.json();
        } else {
          data = await response.text();
        }
      }

      return { success: true, data };
    } catch (error: unknown) {
      console.error("API request error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Request failed",
      };
    }
  }
}
