import { Modal, Select, Button, useMantineTheme } from "@mantine/core";
import { ImageType, MaterialOption, SizeOption } from "../types/ImageTypes";
import { MantineTheme, SelectStylesNames, CSSProperties } from "@mantine/core";

interface ImageModalProps {
  selectedImage: ImageType | null;
  isOpen: boolean;
  onClose: () => void;
  selectedMaterial: string;
  selectedSize: string;
  onMaterialChange: (material: string | null) => void;
  onSizeChange: (size: string | null) => void;
  onExpressInterest: () => void;
}

const ImageModal = ({
  selectedImage,
  isOpen,
  onClose,
  selectedMaterial,
  selectedSize,
  onMaterialChange,
  onSizeChange,
  onExpressInterest,
}: ImageModalProps) => {
  const materialSizes =
    selectedImage?.materials
      ?.find((m: MaterialOption) => m.material_type === selectedMaterial)
      ?.sizes.map((s: SizeOption) => `${s.size} - $${s.price}`) || [];

  const theme = useMantineTheme();

  const selectStyles = (
    theme: MantineTheme
  ): Partial<Record<SelectStylesNames, CSSProperties>> => ({
    input: {
      color: theme.colors.gray[0],
      backgroundColor: theme.colors.sage[0],
    },
    dropdown: {
      backgroundColor: theme.colors.gray[0],
      borderColor: theme.colors.gray[2],
      color: theme.colors.tan[0],
      border: "1px solid white",
    },
    label: {
      color: theme.colors.tan[0],
    },
  });

  const modalStyles = (theme: MantineTheme): Record<string, CSSProperties> => ({
    header: {
      backgroundColor: theme.colors.dark[7], // Custom header background color
      color: theme.colors.gray[0], // Custom header text color
      // Add other styles as needed
    },
    overlay: {
      backgroundColor: "rgba(0, 0, 0, 0.6)", // Custom overlay color
      // Add other styles as needed
    },
    close: {
      // Styles for the 'X' close button
      top: theme.spacing.sm,
      right: theme.spacing.sm,
      color: theme.colors.sage[0],
    },
  });

  const imageStyle: CSSProperties = {
    maxWidth: "100%",
    maxHeight: "80vh", // Center the image
    objectFit: "contain",
  };

  const buttonStyle: CSSProperties = {
    backgroundColor: theme.colors.green[0],
    color: theme.colors.sage[0],
    padding: "0.75rem 1.5rem",
    margin: "2rem auto",
    display: "block",
    // Add other button styles as needed
  };

  const imageContainerStyle: CSSProperties = {
    display: "flex", // Use flexbox for centering
    justifyContent: "center", // Horizontally center the child
    alignItems: "center", // Vertically center the child
    height: "100%", // Take up all available height
    padding: "2rem", // Add some padding
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      size="100%"
      padding={0}
      centered
      styles={{
        header: {
          ...modalStyles(theme).header,
        },
        overlay: {
          ...modalStyles(theme).overlay,
        },
        close: {
          ...modalStyles(theme).close,
        },
      }}
    >
      {selectedImage && (
        <div style={{ backgroundColor: theme.colors.gray[0] }}>
          <div style={imageContainerStyle}>
            <img
              src={selectedImage.url}
              alt={selectedImage.alt}
              style={imageStyle}
            />
          </div>
          <div style={{ padding: "0 2rem 2rem 2rem" }}>
            <h2
              style={{
                color: theme.colors.tan[0],
                margin: "1rem 0",
                fontWeight: 500,
              }}
            >
              {selectedImage.title}
            </h2>
            <h4 style={{ color: theme.colors.tan[0], marginBottom: "2rem" }}>
              {selectedImage.description}
            </h4>

            <Select
              label="Material"
              placeholder="Select Material"
              styles={selectStyles(theme)}
              data={
                selectedImage.materials?.map(
                  (m: MaterialOption) => m.material_type
                ) || []
              }
              value={selectedMaterial}
              onChange={(material) => onMaterialChange(material || "")}
            />

            <Select
              label="Size"
              placeholder="Select Size"
              styles={selectStyles(theme)}
              data={materialSizes}
              value={selectedSize}
              onChange={(size) => onSizeChange(size || "")}
              disabled={!selectedMaterial}
            />

            <Button onClick={onExpressInterest} style={buttonStyle}>
              Contact About This Photo
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ImageModal;
