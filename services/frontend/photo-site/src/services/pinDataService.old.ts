// Data service for managing location pins with S3 storage
// This service provides an abstraction layer for pin data management

import { LocationPin } from "../types/LocationPin";

// For now, we'll use localStorage as a temporary solution
// In production, this would connect to your S3 bucket via API Gateway/Lambda

const STORAGE_KEY = "tjprohammer_location_pins";

// Event emitter for real-time updates
type PinChangeListener = (pins: LocationPin[]) => void;
const listeners: PinChangeListener[] = [];

const notifyListeners = (pins: LocationPin[]) => {
  listeners.forEach((listener) => listener(pins));
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

  // Get all pins
  static async getAllPins(): Promise<LocationPin[]> {
    try {
      // For development: load from localStorage or fall back to initial data
      const storedPins = localStorage.getItem(STORAGE_KEY);
      if (storedPins) {
        return JSON.parse(storedPins);
      }

      // Fall back to initial data if no stored data
      const { locationPins } = await import("../data/locationPins");
      await this.savePins(locationPins); // Save initial data
      return locationPins;
    } catch (error) {
      console.error("Error loading pins:", error);
      // Fall back to initial data on error
      const { locationPins } = await import("../data/locationPins");
      return locationPins;
    }
  }

  // Save a new pin
  static async savePin(pin: LocationPin): Promise<void> {
    try {
      const existingPins = await this.getAllPins();
      const updatedPins = [...existingPins, pin];
      await this.savePins(updatedPins);
      notifyListeners(updatedPins);
    } catch (error) {
      console.error("Error saving pin:", error);
      throw error;
    }
  }

  // Update an existing pin
  static async updatePin(pin: LocationPin): Promise<void> {
    try {
      const existingPins = await this.getAllPins();
      const updatedPins = existingPins.map((p) => (p.id === pin.id ? pin : p));
      await this.savePins(updatedPins);
      notifyListeners(updatedPins);
    } catch (error) {
      console.error("Error updating pin:", error);
      throw error;
    }
  }

  // Delete a pin
  static async deletePin(pinId: string): Promise<void> {
    try {
      const existingPins = await this.getAllPins();
      const updatedPins = existingPins.filter((p) => p.id !== pinId);
      await this.savePins(updatedPins);
      notifyListeners(updatedPins);
    } catch (error) {
      console.error("Error deleting pin:", error);
      throw error;
    }
  }

  // Save all pins (internal method)
  private static async savePins(pins: LocationPin[]): Promise<void> {
    try {
      // For development: save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pins));

      // TODO: In production, this would save to S3 via API Gateway/Lambda
      // Example S3 integration:
      /*
      const response = await fetch('/api/pins', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pins)
      });
      if (!response.ok) throw new Error('Failed to save to S3');
      */

      console.log(`Saved ${pins.length} pins to storage`);
    } catch (error) {
      console.error("Error saving pins to storage:", error);
      throw error;
    }
  }

  // Generate a unique ID for new pins
  static generateId(): string {
    return `pin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// TODO: S3 Integration Notes
/*
For production S3 integration, you'll need:

1. AWS S3 Bucket configured for your pin data
2. API Gateway endpoints for CRUD operations:
   - GET /api/pins - retrieve all pins
   - POST /api/pins - create new pin
   - PUT /api/pins/:id - update existing pin
   - DELETE /api/pins/:id - delete pin

3. Lambda functions to handle the S3 operations:
   - Use AWS SDK v3 for S3 operations
   - Store pins as JSON files in S3
   - Handle error cases and validation

4. Update this service to call your API endpoints instead of localStorage

5. Consider caching strategy for performance
*/
