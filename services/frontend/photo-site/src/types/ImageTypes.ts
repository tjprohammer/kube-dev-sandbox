export interface ImageType {
    id: string;
    url: string;
    alt: string;
    title: string;
    description: string;
    category?: string;
    materials?: MaterialOption[];
  }
  
  export interface SizeOption {
    size: string;
    price: number;
  }
  
  export interface MaterialOption {
    material_type: string;
    sizes: SizeOption[];
  }
  

  