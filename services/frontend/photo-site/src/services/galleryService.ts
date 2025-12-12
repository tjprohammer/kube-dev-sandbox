// Service to convert LocationPin data to Gallery ImageType format
import { LocationPin } from "../types/LocationPin";
import { ImageType } from "../types/ImageTypes";
import { PinDataService } from "./pinDataService";

export class GalleryService {
  // Convert LocationPin photos to ImageType format for gallery display
  static convertPinPhotosToImages(pins: LocationPin[]): ImageType[] {
    const images: ImageType[] = [];

    pins.forEach((pin) => {
      pin.photos?.forEach((photo) => {
        images.push({
          id: photo.id,
          url: photo.src,
          alt: photo.alt,
          title: photo.title,
          description: photo.description || pin.description,
          category: this.mapPinCategoryToGalleryCategory(pin.category),
          materials: [], // Photography pins don't have materials/pricing
        });
      });
    });

    return images;
  }

  // Map LocationPin categories to Gallery categories
  private static mapPinCategoryToGalleryCategory(pinCategory: string): string {
    const categoryMap: Record<string, string> = {
      desert: "Dry Deserts",
      mountains: "The High Alpine",
      coastal: "Coastal Shoreline",
      forest: "Luscious Rainforests",
      urban: "Star Gazing", // Map urban to star gazing for now
      other: "All",
    };

    return categoryMap[pinCategory] || "All";
  }

  // Get all gallery images from pins
  static async getAllGalleryImages(): Promise<ImageType[]> {
    try {
      const pins = await PinDataService.getAllPins();
      return this.convertPinPhotosToImages(pins);
    } catch (error) {
      console.error("Error fetching gallery images from pins:", error);
      return [];
    }
  }

  // Get gallery images filtered by category
  static async getGalleryImagesByCategory(
    category: string
  ): Promise<ImageType[]> {
    try {
      const allImages = await this.getAllGalleryImages();

      if (category === "All") {
        return allImages;
      }

      return allImages.filter((image) => image.category === category);
    } catch (error) {
      console.error("Error fetching gallery images by category:", error);
      return [];
    }
  }

  // Subscribe to pin changes and get updated gallery images
  static subscribeToGalleryUpdates(
    callback: (images: ImageType[]) => void
  ): () => void {
    return PinDataService.subscribe(async (pins) => {
      const images = this.convertPinPhotosToImages(pins);
      callback(images);
    });
  }
}
