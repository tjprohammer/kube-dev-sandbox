import { CSSProperties, useEffect, useState } from "react";
import {
  Container,
  useMantineTheme,
  Divider,
  MantineTheme,
  SelectStylesNames,
  Select,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";

// import pano from "../assets/TheRoyalDunes.jpg";
// import vertical from "../assets/GalacticSpace.jpg";
// import horizontal from "../assets/ValleyOfTheGods.jpg";
import { useSearchParams, useNavigate } from "react-router-dom";
import { GalleryService } from "src/services/galleryService";
import ImageGrid from "src/components/ImageGrid";
import ImageModal from "src/components/ImageModal";
import { ImageType } from "src/types/ImageTypes";
import { useDisclosure } from "@mantine/hooks";

const Gallery = () => {
  const theme = useMantineTheme();
  const [isModalOpen, { open, close }] = useDisclosure(false); // Correct destructuring

  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null);
  const [images, setImages] = useState<ImageType[]>([]);
  const [categories] = useState([
    "All",
    "Coastal Shoreline",
    "Dry Deserts",
    "The High Alpine",
    "Star Gazing",
    "Luscious Rainforests",
  ]);
  const [observedImages, setObservedImages] = useState<string[]>([]); // tracks which images are being observed
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";

  const [category, setCategory] = useState(initialCategory);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  // Function to handle material change
  const handleMaterialChange = (selectedMaterialType: string | null) => {
    setSelectedMaterial(selectedMaterialType || "");
    setSelectedSize("");
  };
  //Functino to handle size change
  const handleSizeChange = (size: string | null) => {
    setSelectedSize(size || "");
  };

  const navigate = useNavigate();

  // Function to handle expressing interest - navigate to contact form with pre-filled info
  const handleExpressInterest = () => {
    if (selectedImage && selectedSize) {
      const params = new URLSearchParams();
      params.append("photo", selectedImage.title);
      if (selectedMaterial) params.append("material", selectedMaterial);
      if (selectedSize) params.append("size", selectedSize);

      // Navigate to contact page with pre-filled information
      navigate(`/contact?${params.toString()}`);

      // Close the modal
      close();
    } else {
      // Show notification if size not selected
      notifications.show({
        title: "Please Select Options",
        message:
          "Please select both material and size before expressing interest.",
        color: theme.colors.red?.[5] || "red",
        style: { backgroundColor: theme.colors.tan[0] },
      });
    }
  };

  //Fetch from local server
  useEffect(() => {
    const fetchCategoryImages = async () => {
      try {
        // Use GalleryService to fetch images from photography pins
        const fetchedImages = await GalleryService.getGalleryImagesByCategory(
          category
        );

        // Transform fetched images to match ImageType interface (already compatible)
        const imagesWithType = fetchedImages.map((img, index) => ({
          ...img,
          id: img.id || `img-${index}`, // Use existing id or create temporary one
        }));

        // Initialize loading state
        const loadingState = fetchedImages.reduce(
          (state: Record<string, boolean>, image) => {
            state[image.url] = false; // Start with false, indicating loading is complete
            return state;
          },
          {}
        );

        setLoading(loadingState);

        const filteredImages =
          category === "All"
            ? imagesWithType
            : imagesWithType.filter((image) => image.category === category);

        setImages(filteredImages);
      } catch (error) {
        console.error("Error fetching images:", error);
        // Optionally handle errors, like setting an error state
      }
    };

    fetchCategoryImages();
  }, [category]); // Dependency on category state

  //Fetch from AWS
  // const fetchImages = async () => {
  //   try {
  //     const response = await fetch(
  //       "https://2bg8je7er4.execute-api.us-west-2.amazonaws.com/staging_api/products"
  //     );
  //     if (!response.ok) {
  //       throw new Error("Network response was not ok");
  //     }
  //     const result = await response.json();
  //     const data = JSON.parse(result.body);

  //     if (Array.isArray(data)) {
  //       const mappedImages = data.map((item) => ({
  //         url: item.image,
  //         alt: item.title, // or item.description, depending on what you prefer
  //         title: item.title,
  //         description: item.description,
  //         category: item.category,
  //       }));
  //       setImages(mappedImages);
  //     } else {
  //       console.error("Parsed data is not an array:", data);
  //       setImages([]);
  //     }
  //   } catch (error) {
  //     console.error("Fetch error:", error);
  //     setImages([]);
  //   }
  // };

  // useEffect(() => {
  //   fetchImages();
  // }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setObservedImages((prevImages) => [
              ...prevImages,
              entry.target.getAttribute("data-src")!,
            ]);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "0px",
        threshold: 0.1,
      }
    );

    // Observe each image ref that is not yet loaded
    document.querySelectorAll("img[data-src]").forEach((img) => {
      if (!observedImages.includes(img.getAttribute("data-src")!)) {
        observer.observe(img);
      }
    });

    return () => observer.disconnect();
  }, [images, observedImages]);

  // Subscribe to live updates from pin changes in admin
  useEffect(() => {
    const unsubscribe = GalleryService.subscribeToGalleryUpdates(
      (updatedImages) => {
        console.log(
          "Gallery: Received image updates, new count:",
          updatedImages.length
        );

        // Filter by current category before setting
        const filteredUpdatedImages =
          category === "All"
            ? updatedImages
            : updatedImages.filter((img) => img.category === category);

        setImages(filteredUpdatedImages);

        // Update loading state for new images
        const newLoadingState = filteredUpdatedImages.reduce(
          (state: Record<string, boolean>, image) => {
            state[image.url] = false;
            return state;
          },
          {}
        );
        setLoading(newLoadingState);
      }
    );

    return unsubscribe;
  }, [category]);

  // Update the handleImageLoad function
  const handleImageLoad = (url: string) => {
    setLoading((prevLoading) => ({
      ...prevLoading,
      [url]: false, // Set loading state to false for this image URL
    }));
  };

  // Filtering logic
  const filteredImages =
    category === "All"
      ? images
      : images.filter((image) => image.category === category);

  const selectStyles = (
    theme: MantineTheme
  ): Partial<Record<SelectStylesNames, CSSProperties>> => ({
    // Correct style properties based on Mantine's documentation
    // Example:
    input: {
      color: theme.colors.gray[0],
      backgroundColor: theme.colors.sage[0],
    },
    dropdown: {
      backgroundColor: theme.colors.gray[0],
      borderColor: theme.colors.gray[2],
      color: theme.colors.tan[0],
    },
    label: {
      color: theme.colors.sage[0],
    },
  });

  return (
    <div
      id="gallery"
      style={{
        paddingTop: "10rem",
        paddingBottom: "5rem",
        backgroundColor: theme.colors.gray[0],
      }}
    >
      <Container
        style={{
          borderBottomColor: "white",
          borderBottom: "1px solid white",
          padding: "0 40px",
          maxWidth: "1200px",
          marginLeft: "auto",
          marginRight: "auto",
          backgroundColor: theme.colors.gray[0],
        }}
      >
        <Select
          label="Select category"
          placeholder="Choose a category"
          data={categories}
          value={category}
          onChange={(value: string | null) => setCategory(value ?? "")}
          styles={selectStyles(theme)}
        />
        <Divider
          size="sm"
          color={theme.colors.green[0]}
          labelPosition="center"
          style={{
            marginTop: "1rem",
            marginBottom: "2rem",
            alignItems: "center",
          }}
        />
        <ImageGrid
          images={filteredImages}
          observedImages={observedImages}
          loading={loading}
          onImageClick={(image) => {
            setSelectedImage(image);
            open(); // Using the open method
          }}
          handleImageLoad={handleImageLoad}
        />

        {/* Modal for displaying the clicked image */}
        <ImageModal
          selectedImage={selectedImage}
          isOpen={isModalOpen} // Using the boolean state
          onClose={close} // Using the close method
          selectedMaterial={selectedMaterial}
          selectedSize={selectedSize}
          onMaterialChange={handleMaterialChange}
          onSizeChange={handleSizeChange}
          onExpressInterest={handleExpressInterest}
        />
      </Container>
    </div>
  );
};

export default Gallery;
