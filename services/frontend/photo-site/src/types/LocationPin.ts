export interface LocationPhoto {
  id: string;
  src: string;
  alt: string;
  title: string;
  description?: string;
  category: string;
}

export interface Trip {
  id: string;
  title: string;
  story: string;
  visitDate: string;
  photos: LocationPhoto[];
  tags: string[];
  weather?: string;
  equipment?: string[];
}

export interface LocationPin {
  id: string;
  title: string;
  description: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  featured: boolean;
  category:
    | "desert"
    | "mountains"
    | "coastal"
    | "forest"
    | "urban"
    | "other"
    | "home";

  // Multiple trips support
  trips?: Trip[];

  // Legacy single trip support (for backward compatibility)
  story?: string;
  visitDate?: string;
  photos?: LocationPhoto[];
  tags?: string[];
}

export interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch?: number;
  bearing?: number;
}
