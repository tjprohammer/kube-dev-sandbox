import { Image, Loader } from "@mantine/core";
import { ImageType } from "src/types/ImageTypes";

interface ImageGridProps {
  images: ImageType[];
  observedImages: string[];
  loading: Record<string, boolean>;
  onImageClick: (image: ImageType) => void;
  handleImageLoad: (url: string) => void;
}

const ImageGrid = ({
  images,
  observedImages,
  loading,
  onImageClick,
  handleImageLoad,
}: ImageGridProps) => {
  // // Log the entire images array
  // console.log("Images:", images);

  // // Log the observedImages array
  // console.log("Observed Images:", observedImages);

  // // Log the loading state
  // console.log("Loading State:", loading);

  const imageStyle = {
    cursor: "pointer",
    width: "100%",
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
    marginBottom: "1em",
  };

  const masonryStyle = {
    columnCount: 3,
    columnGap: "1em",
    width: "100%",
    marginLeft: "auto",
    marginRight: "auto",
    height: "100%",
  };
  
  return (
    <div style={masonryStyle}>
      {images.map((image, index) => (
        <div key={`${image.id}-${index}`}
        >
          {loading[image.url] ? (
            <Loader /> // Show loader while the image is loading
          ) : (
            <Image
              src={observedImages.includes(image.url) ? image.url : 'placeholder.jpg'}
              data-src={image.url}
              alt={image.alt}
              style={imageStyle}
              onClick={() => onImageClick(image)}
              onLoad={() => handleImageLoad(image.url)}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default ImageGrid;
