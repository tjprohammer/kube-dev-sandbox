// Temporary authentication service for testing
import { CognitoAuthService } from "./awsService";

export class TempAuthService {
  static async signIn(username: string, password: string) {
    // If temp credentials match, try to sign in with real Cognito in background
    if (username === "admin" && password === "AdminPass123!") {
      // Try to get real Cognito credentials for S3 access
      try {
        const cognitoResult = await CognitoAuthService.signIn(
          "admin",
          "AdminPass123!"
        );
        if (cognitoResult.success && cognitoResult.tokens) {
          // Use real Cognito tokens so S3 credentials work
          return cognitoResult;
        }
      } catch (error) {
        console.warn(
          "Failed to get real Cognito tokens, using temp auth without S3:",
          error
        );
      }

      // Fallback to fake tokens (S3 won't work)
      const fakeTokens = {
        accessToken: "temp-access-token",
        idToken: "temp-id-token",
        refreshToken: "temp-refresh-token",
      };

      localStorage.setItem("authTokens", JSON.stringify(fakeTokens));
      return { success: true, tokens: fakeTokens };
    }

    return { success: false, error: "Invalid credentials" };
  }

  static async signOut() {
    localStorage.removeItem("authTokens");
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
}
