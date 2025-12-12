// Updated Pin Data Service that connects to AWS Lambda functions via API Gateway
import { LocationPin } from "../types/LocationPin";
import { ApiService } from "./awsService";
import { AWS_CONFIG } from "../config/aws-config";

// Event emitter for real-time updates
type PinChangeListener = (pins: LocationPin[]) => void;
const listeners: PinChangeListener[] = [];

type PinResponseShape = {
  pins?: unknown;
};

const notifyListeners = (pins: LocationPin[]) => {
  listeners.forEach((listener) => listener(pins));
};

const extractPins = (payload: unknown): LocationPin[] => {
  if (Array.isArray(payload)) {
    return payload as LocationPin[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as PinResponseShape).pins)
  ) {
    return (payload as PinResponseShape).pins as LocationPin[];
  }

  return [];
};

export class PinDataService {
  // Subscribe to pin changes
  static subscribe(listener: PinChangeListener): () => void {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  // Generate a unique ID for new pins
  static generateId(): string {
    return `pin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get all pins from API
  static async getAllPins(): Promise<LocationPin[]> {
    try {
      const response = await ApiService.makeRequest(
        AWS_CONFIG.apiGateway.endpoints.pins,
        "GET",
        undefined,
        false // Public endpoint, no auth required for reading
      );

      if (response.success) {
        return extractPins(response.data);
      }

      // If API fails, fall back to localStorage as backup
      console.warn("API failed, falling back to localStorage");
      return this.getLocalStoragePins();
    } catch (error) {
      console.error("Error loading pins from API:", error);
      // Fall back to localStorage on error
      return this.getLocalStoragePins();
    }
  }

  // Save a new pin via API
  static async savePin(pin: LocationPin): Promise<LocationPin> {
    try {
      const response = await ApiService.makeRequest(
        AWS_CONFIG.apiGateway.endpoints.pins,
        "POST",
        pin,
        true // Requires authentication
      );

      if (response.success && response.data) {
        // Return the server-created pin with the correct UUID
        const createdPin = response.data as LocationPin;
        // Fetch updated pins and notify listeners
        const updatedPins = await this.getAllPins();
        notifyListeners(updatedPins);
        return createdPin;
      } else {
        throw new Error(response.error || "Failed to save pin");
      }
    } catch (error) {
      console.error("Error saving pin via API:", error);
      // Fall back to localStorage
      await this.saveLocalStoragePin(pin);
      const updatedPins = await this.getLocalStoragePins();
      notifyListeners(updatedPins);
      throw error;
    }
  }

  // Update an existing pin via API
  static async updatePin(pin: LocationPin): Promise<void> {
    try {
      const response = await ApiService.makeRequest(
        AWS_CONFIG.apiGateway.endpoints.pinById(pin.id),
        "PUT",
        pin,
        true // Requires authentication
      );

      if (response.success) {
        // Fetch updated pins and notify listeners
        const updatedPins = await this.getAllPins();
        notifyListeners(updatedPins);
      } else {
        throw new Error(response.error || "Failed to update pin");
      }
    } catch (error) {
      console.error("Error updating pin via API:", error);
      // Fall back to localStorage
      await this.updateLocalStoragePin(pin);
      const updatedPins = await this.getLocalStoragePins();
      notifyListeners(updatedPins);
      throw error;
    }
  }

  // Delete a pin via API
  static async deletePin(pinId: string): Promise<void> {
    try {
      const response = await ApiService.makeRequest(
        AWS_CONFIG.apiGateway.endpoints.pinById(pinId),
        "DELETE",
        undefined,
        true // Requires authentication
      );

      if (response.success) {
        // Fetch updated pins and notify listeners
        const updatedPins = await this.getAllPins();
        notifyListeners(updatedPins);
      } else {
        throw new Error(response.error || "Failed to delete pin");
      }
    } catch (error) {
      console.error("Error deleting pin via API:", error);
      // Fall back to localStorage
      await this.deleteLocalStoragePin(pinId);
      const updatedPins = await this.getLocalStoragePins();
      notifyListeners(updatedPins);
      throw error;
    }
  }

  // --- Fallback localStorage methods ---
  private static async getLocalStoragePins(): Promise<LocationPin[]> {
    try {
      const storedPins = localStorage.getItem("tjprohammer_location_pins");
      if (storedPins) {
        return JSON.parse(storedPins);
      }

      // Fall back to initial data if no stored data
      const { locationPins } = await import("../data/locationPins");
      await this.saveLocalStoragePins(locationPins);
      return locationPins;
    } catch (error) {
      console.error("Error loading pins from localStorage:", error);
      // Ultimate fallback to initial data
      const { locationPins } = await import("../data/locationPins");
      return locationPins;
    }
  }

  private static async saveLocalStoragePin(pin: LocationPin): Promise<void> {
    const existingPins = await this.getLocalStoragePins();
    const updatedPins = [...existingPins, pin];
    await this.saveLocalStoragePins(updatedPins);
  }

  private static async updateLocalStoragePin(pin: LocationPin): Promise<void> {
    const existingPins = await this.getLocalStoragePins();
    const updatedPins = existingPins.map((p) => (p.id === pin.id ? pin : p));
    await this.saveLocalStoragePins(updatedPins);
  }

  private static async deleteLocalStoragePin(pinId: string): Promise<void> {
    const existingPins = await this.getLocalStoragePins();
    const updatedPins = existingPins.filter((p) => p.id !== pinId);
    await this.saveLocalStoragePins(updatedPins);
  }

  private static async saveLocalStoragePins(
    pins: LocationPin[]
  ): Promise<void> {
    localStorage.setItem("tjprohammer_location_pins", JSON.stringify(pins));
  }
}
