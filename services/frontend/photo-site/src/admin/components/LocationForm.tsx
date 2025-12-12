import {
  Modal,
  TextInput,
  Textarea,
  Select,
  Switch,
  Button,
  Stack,
  Group,
  NumberInput,
  Title,
  useMantineTheme,
  FileInput,
  Text,
  ActionIcon,
  Card,
  Image,
  SimpleGrid,
  Alert,
} from "@mantine/core";
import { useState, useEffect } from "react";
import { LocationPin, LocationPhoto } from "../../types/LocationPin";
import {
  IconTrash,
  IconUpload,
  IconInfoCircle,
  IconSparkles,
} from "@tabler/icons-react";
import { S3Service } from "../../services/awsService";
import { notifications } from "@mantine/notifications";

interface LocationFormProps {
  opened: boolean;
  onClose: () => void;
  onSave: (pin: LocationPin) => void;
  editingPin?: LocationPin | null;
  initialCoordinates?: { latitude: number; longitude: number };
}

const LocationForm = ({
  opened,
  onClose,
  onSave,
  editingPin,
  initialCoordinates,
}: LocationFormProps) => {
  const theme = useMantineTheme();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    coordinates: { latitude: 0, longitude: 0 },
    category: "desert" as
      | "desert"
      | "mountains"
      | "coastal"
      | "forest"
      | "urban"
      | "other"
      | "home",
    featured: false,
    visitDate: new Date().toISOString().split("T")[0],
    tags: [] as string[],
    photos: [] as LocationPhoto[],
  });

  const [isAIGenerating, setIsAIGenerating] = useState(false);

  const generateAIDescription = async () => {
    if (!formData.title || !formData.coordinates.latitude) {
      notifications.show({
        title: "Missing Information",
        message: "Please enter a location name and coordinates first",
        color: "yellow",
      });
      return;
    }

    setIsAIGenerating(true);
    try {
      const userNotes =
        formData.description ||
        "Write a brief, factual description of this location";

      const response = await fetch(
        "https://5cjnp8rcga.execute-api.us-west-2.amazonaws.com/staging_api/photography/ai-assist",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            locationName: formData.title,
            latitude: formData.coordinates.latitude,
            longitude: formData.coordinates.longitude,
            category: formData.category,
            userNotes: userNotes,
            type: "location",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.description) {
        setFormData((prev) => ({ ...prev, description: data.description }));
        notifications.show({
          title: "AI Description Generated",
          message: "Factual description successfully created!",
          color: "green",
        });
      } else {
        throw new Error("No description in response");
      }
    } catch (error) {
      console.error("AI generation error:", error);
      notifications.show({
        title: "AI Generation Failed",
        message:
          "Could not generate content. Please try again or write manually.",
        color: "red",
      });
    } finally {
      setIsAIGenerating(false);
    }
  };

  useEffect(() => {
    console.log("LocationForm: useEffect triggered with:", {
      editingPin: !!editingPin,
      opened,
      initialCoordinates,
    });

    if (editingPin) {
      console.log(
        "LocationForm: Loading existing pin coordinates:",
        editingPin.coordinates
      );

      // Get photos from the first trip if it exists, otherwise use legacy photos field
      const existingPhotos =
        editingPin.trips && editingPin.trips.length > 0
          ? editingPin.trips[0].photos || []
          : editingPin.photos || [];

      // Get other data from first trip or use legacy fields
      const firstTrip = editingPin.trips?.[0];

      setFormData({
        title: editingPin.title,
        description: editingPin.description,
        coordinates: editingPin.coordinates,
        category: editingPin.category,
        featured: editingPin.featured,
        visitDate:
          firstTrip?.visitDate ||
          editingPin.visitDate ||
          new Date().toISOString().split("T")[0],
        tags: firstTrip?.tags || editingPin.tags || [],
        photos: existingPhotos,
      });
    } else {
      console.log(
        "LocationForm: Setting initial coordinates:",
        initialCoordinates
      );
      // Reset form for new pin
      setFormData({
        title: "",
        description: "",
        coordinates: initialCoordinates || { latitude: 0, longitude: 0 },
        category: "desert",
        featured: false,
        visitDate: new Date().toISOString().split("T")[0],
        tags: [],
        photos: [],
      });
    }
  }, [editingPin, opened, initialCoordinates]);

  const handleSave = () => {
    console.log(
      "LocationForm: Saving pin with coordinates:",
      formData.coordinates
    );

    const pin: LocationPin = {
      id: editingPin?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description,
      coordinates: formData.coordinates,
      category: formData.category,
      featured: formData.featured,
      // Always use trips array format (Lambda expects this)
      trips:
        editingPin?.trips && editingPin.trips.length > 0
          ? editingPin.trips.map((trip, index) =>
              // Update first trip with current form data
              index === 0
                ? {
                    ...trip,
                    title: formData.title,
                    story: formData.description,
                    visitDate: formData.visitDate,
                    tags: formData.tags,
                    photos: formData.photos, // Use updated photos from form
                  }
                : trip
            )
          : [
              {
                id: `trip_${Date.now()}`,
                title: formData.title,
                story: formData.description,
                visitDate: formData.visitDate,
                tags: formData.tags,
                photos: formData.photos,
              },
            ],
    };

    onSave(pin);
    onClose();
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleAddPhotos = async (files: File[] | null) => {
    if (files) {
      setIsUploading(true);

      try {
        // Upload files to S3 and create LocationPhoto objects
        const uploadPromises = files.map(async (file, index) => {
          // Create a unique key for the file in photos folder (permanent storage)
          const timestamp = Date.now();
          const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
          const s3Key = `photos/${timestamp}_${index}_${cleanFileName}`;

          const uploadResult = await S3Service.uploadImage(file, s3Key);

          if (uploadResult.success && uploadResult.url) {
            return {
              id: `s3-${timestamp}-${index}`,
              src: uploadResult.url,
              alt: file.name,
              title: file.name.split(".")[0],
              description: `Photo from ${formData.title}`,
              category: formData.category,
            } as LocationPhoto;
          } else {
            throw new Error(uploadResult.error || "Upload failed");
          }
        });

        const newPhotos = await Promise.all(uploadPromises);

        setFormData((prev) => ({
          ...prev,
          photos: [...prev.photos, ...newPhotos],
        }));

        notifications.show({
          title: "Upload Successful",
          message: `${newPhotos.length} photo(s) uploaded successfully!`,
          color: "green",
        });
      } catch (error) {
        console.error("Photo upload error:", error);
        notifications.show({
          title: "Upload Failed",
          message: "Failed to upload photos. Please try again.",
          color: "red",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((photo) => photo.id !== photoId),
    }));
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Title order={3} c={theme.colors.white[0]}>
          {editingPin ? "Edit Location Pin" : "Add New Location Pin"}
        </Title>
      }
      size="lg"
      styles={{
        content: { backgroundColor: theme.colors.brown[9] },
        header: { backgroundColor: theme.colors.brown[9] },
        body: { backgroundColor: theme.colors.brown[9] },
      }}
    >
      <Stack gap="md">
        {/* Basic Info */}
        <TextInput
          label="Location Title"
          placeholder="e.g., Death Valley Sand Dunes"
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          styles={{
            label: { color: theme.colors.sage[2] },
            input: {
              backgroundColor: theme.colors.darkGreen[8],
              borderColor: theme.colors.sage[6],
              color: theme.colors.white[0],
            },
          }}
          required
        />

        {/* Multi-trip indicator */}
        {editingPin?.trips && editingPin.trips.length > 0 && (
          <Alert
            icon={<IconInfoCircle size={16} />}
            title="Multi-Trip Location"
            color="blue"
            variant="light"
            styles={{
              root: {
                backgroundColor: theme.colors.darkGreen[8],
                border: `1px solid ${theme.colors.blue[6]}`,
              },
              title: { color: theme.colors.blue[3] },
              message: { color: theme.colors.sage[2] },
            }}
          >
            This location has {editingPin.trips.length} trips. Editing here will
            update the basic location info only. Use the full multi-trip editor
            for comprehensive trip management.
          </Alert>
        )}

        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm" fw={500} style={{ color: theme.colors.sage[2] }}>
              Short Description
            </Text>
            <Button
              size="xs"
              variant="light"
              onClick={() => generateAIDescription()}
              loading={isAIGenerating}
              disabled={!formData.title || !formData.coordinates.latitude}
              style={{
                backgroundColor: theme.colors.sage[7],
                color: theme.colors.white[0],
              }}
            >
              <IconSparkles size={16} style={{ marginRight: 4 }} />
              AI Assist
            </Button>
          </Group>
          <Textarea
            placeholder="A brief description of this location (or type a few notes and click AI Assist)"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            minRows={3}
            styles={{
              input: {
                backgroundColor: theme.colors.darkGreen[8],
                borderColor: theme.colors.sage[6],
                color: theme.colors.white[0],
              },
            }}
            required
          />
        </Stack>

        {/* Coordinates */}
        <Group grow>
          <NumberInput
            label="Latitude"
            placeholder="36.2377"
            value={formData.coordinates.latitude}
            onChange={(val) =>
              setFormData((prev) => ({
                ...prev,
                coordinates: {
                  ...prev.coordinates,
                  latitude: typeof val === "number" ? val : 0,
                },
              }))
            }
            decimalScale={6}
            step={0.000001}
            styles={{
              label: { color: theme.colors.sage[2] },
              input: {
                backgroundColor: theme.colors.darkGreen[8],
                borderColor: theme.colors.sage[6],
                color: theme.colors.white[0],
              },
            }}
            required
          />
          <NumberInput
            label="Longitude"
            placeholder="-116.8830"
            value={formData.coordinates.longitude}
            onChange={(val) =>
              setFormData((prev) => ({
                ...prev,
                coordinates: {
                  ...prev.coordinates,
                  longitude: typeof val === "number" ? val : 0,
                },
              }))
            }
            decimalScale={6}
            step={0.000001}
            styles={{
              label: { color: theme.colors.sage[2] },
              input: {
                backgroundColor: theme.colors.darkGreen[8],
                borderColor: theme.colors.sage[6],
                color: theme.colors.white[0],
              },
            }}
            required
          />
        </Group>

        {/* Category and Featured */}
        <Group grow>
          <Select
            label="Category"
            value={formData.category}
            onChange={(val) =>
              setFormData((prev) => ({
                ...prev,
                category: val as
                  | "desert"
                  | "mountains"
                  | "coastal"
                  | "forest"
                  | "urban"
                  | "other"
                  | "home",
              }))
            }
            data={[
              { value: "home", label: "🏠 Home" },
              { value: "desert", label: "Desert" },
              { value: "mountains", label: "Mountains" },
              { value: "coastal", label: "Coastal" },
              { value: "forest", label: "Forest" },
              { value: "urban", label: "Urban" },
              { value: "other", label: "Other" },
            ]}
            styles={{
              label: { color: theme.colors.sage[2] },
              input: {
                backgroundColor: theme.colors.darkGreen[8],
                borderColor: theme.colors.sage[6],
                color: theme.colors.white[0],
              },
            }}
            required
          />
          <div style={{ paddingTop: "25px" }}>
            <Switch
              label="Featured Location"
              checked={formData.featured}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, featured: e.target.checked }))
              }
              color={theme.colors.brown[5]}
              styles={{
                label: { color: theme.colors.sage[2] },
              }}
            />
          </div>
        </Group>

        {/* Photos Section */}
        <div>
          <Text size="sm" fw={500} c={theme.colors.sage[2]} mb="xs">
            Photos
          </Text>

          <FileInput
            placeholder={
              isUploading ? "Uploading photos..." : "Select photos to upload"
            }
            multiple
            accept="image/*"
            leftSection={<IconUpload size={16} />}
            onChange={handleAddPhotos}
            disabled={isUploading}
            styles={{
              input: {
                backgroundColor: theme.colors.darkGreen[8],
                borderColor: theme.colors.sage[6],
                color: theme.colors.white[0],
              },
            }}
            mb="md"
          />

          {formData.photos.length > 0 && (
            <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
              {formData.photos.map((photo) => (
                <Card
                  key={photo.id}
                  bg={theme.colors.darkGreen[8]}
                  radius="md"
                  p="xs"
                >
                  <Card.Section>
                    <Image
                      src={photo.src}
                      height={80}
                      alt={photo.alt}
                      fit="cover"
                    />
                  </Card.Section>
                  <Group justify="space-between" mt="xs">
                    <Text size="xs" c={theme.colors.white[0]} truncate>
                      {photo.title}
                    </Text>
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      size="sm"
                      onClick={() => handleRemovePhoto(photo.id)}
                    >
                      <IconTrash size={12} />
                    </ActionIcon>
                  </Group>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </div>

        {/* Actions */}
        <Group justify="flex-end" mt="md">
          <Button
            variant="subtle"
            color={theme.colors.sage[4]}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            bg={theme.colors.brown[6]}
            c={theme.colors.white[0]}
            onClick={handleSave}
            disabled={!formData.title}
          >
            {editingPin ? "Update" : "Create"} Location Pin
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default LocationForm;
