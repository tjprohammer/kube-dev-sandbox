import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Stack,
  Group,
  Title,
  useMantineTheme,
  FileInput,
  Text,
  ActionIcon,
  Card,
  Image,
  SimpleGrid,
  Badge,
  Accordion,
  TagsInput,
  Divider,
  Box,
  Alert,
} from "@mantine/core";
import { useState } from "react";
import { LocationPhoto, Trip } from "../../types/LocationPin";
import {
  IconTrash,
  IconUpload,
  IconPlus,
  IconInfoCircle,
} from "@tabler/icons-react";
import { S3Service } from "../../services/awsService";
import { notifications } from "@mantine/notifications";

interface TripEditorProps {
  opened: boolean;
  onClose: () => void;
  onSave: (trips: Trip[]) => void;
  existingTrips?: Trip[];
  locationTitle: string;
}

const TripEditor = ({
  opened,
  onClose,
  onSave,
  existingTrips = [],
  locationTitle,
}: TripEditorProps) => {
  const theme = useMantineTheme();
  const [trips, setTrips] = useState<Trip[]>(existingTrips);
  const [uploadingFiles, setUploadingFiles] = useState<{
    [key: string]: boolean;
  }>({});

  const addNewTrip = () => {
    const newTrip: Trip = {
      id: `trip_${Date.now()}`,
      title: "",
      visitDate: new Date().toISOString().split("T")[0],
      story: "",
      tags: [],
      photos: [],
    };
    setTrips([...trips, newTrip]);
  };

  const updateTrip = (tripId: string, updates: Partial<Trip>) => {
    setTrips(
      trips.map((trip) => (trip.id === tripId ? { ...trip, ...updates } : trip))
    );
  };

  const deleteTrip = (tripId: string) => {
    setTrips(trips.filter((trip) => trip.id !== tripId));
  };

  const handlePhotoUpload = async (tripId: string, files: File[] | null) => {
    if (!files || files.length === 0) return;

    const uploadKey = `${tripId}_upload`;
    setUploadingFiles((prev) => ({ ...prev, [uploadKey]: true }));

    try {
      const uploadedPhotos: LocationPhoto[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const timestamp = Date.now();
        const fileName = file.name.replace(/\s+/g, "_");

        const result = await S3Service.uploadImage(
          file,
          `temp-uploads/${timestamp}_${i}_${fileName}`
        );

        if (result.success && result.url) {
          const photo: LocationPhoto = {
            id: `s3-${timestamp}-${i}`,
            title: file.name.split(".")[0],
            description: `Photo from ${
              trips.find((t) => t.id === tripId)?.title || "trip"
            }`,
            src: result.url,
            alt: file.name,
            category: "landscape",
          };
          uploadedPhotos.push(photo);
        } else {
          notifications.show({
            title: "Upload Failed",
            message: `Failed to upload ${file.name}: ${result.error}`,
            color: "red",
          });
        }
      }

      if (uploadedPhotos.length > 0) {
        updateTrip(tripId, {
          photos: [
            ...(trips.find((t) => t.id === tripId)?.photos || []),
            ...uploadedPhotos,
          ],
        });

        notifications.show({
          title: "Upload Successful",
          message: `${uploadedPhotos.length} photo(s) uploaded successfully`,
          color: "green",
        });
      }
    } catch (error) {
      console.error("Error uploading photos:", error);
      notifications.show({
        title: "Upload Error",
        message: "An error occurred while uploading photos",
        color: "red",
      });
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [uploadKey]: false }));
    }
  };

  const deletePhoto = (tripId: string, photoId: string) => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return;

    updateTrip(tripId, {
      photos: trip.photos.filter((photo) => photo.id !== photoId),
    });
  };

  const handleSave = () => {
    // Validate that all trips have required fields
    const invalidTrips = trips.filter(
      (trip) => !trip.title.trim() || !trip.visitDate
    );

    if (invalidTrips.length > 0) {
      notifications.show({
        title: "Validation Error",
        message: "All trips must have a title and visit date",
        color: "red",
      });
      return;
    }

    onSave(trips);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Title order={3} c={theme.colors.sage[2]}>
          Manage Trips for "{locationTitle}"
        </Title>
      }
      size="xl"
      styles={{
        content: {
          backgroundColor: theme.colors.darkGreen[9],
        },
        header: {
          backgroundColor: theme.colors.darkGreen[8],
          borderBottom: `1px solid ${theme.colors.sage[8]}`,
        },
        body: {
          maxHeight: "70vh",
          overflowY: "auto",
        },
      }}
    >
      <Stack gap="md">
        <Alert
          icon={<IconInfoCircle size={16} />}
          color="blue"
          variant="light"
          styles={{
            root: {
              backgroundColor: theme.colors.darkGreen[8],
              border: `1px solid ${theme.colors.blue[6]}`,
            },
            message: { color: theme.colors.sage[2] },
          }}
        >
          You can add multiple trips to this location. Each trip can have its
          own photos, story, and visit date.
        </Alert>

        {trips.length === 0 ? (
          <Alert
            color="yellow"
            styles={{
              root: {
                backgroundColor: theme.colors.darkGreen[8],
                border: `1px solid ${theme.colors.yellow[6]}`,
              },
              message: { color: theme.colors.sage[2] },
            }}
          >
            No trips yet. Add your first trip to get started!
          </Alert>
        ) : (
          <Accordion
            variant="contained"
            styles={{
              item: {
                backgroundColor: theme.colors.darkGreen[8],
                border: `1px solid ${theme.colors.sage[8]}`,
                marginBottom: "0.5rem",
              },
              control: {
                "&:hover": {
                  backgroundColor: theme.colors.darkGreen[7],
                },
              },
              label: {
                color: theme.colors.sage[2],
              },
              content: {
                color: theme.colors.sage[3],
              },
            }}
          >
            {trips.map((trip, index) => (
              <Accordion.Item key={trip.id} value={trip.id}>
                <Accordion.Control>
                  <Group justify="space-between">
                    <Group>
                      <Badge color="blue" variant="light">
                        Trip {index + 1}
                      </Badge>
                      <Text c={theme.colors.sage[2]} fw={500}>
                        {trip.title || "Untitled Trip"}
                      </Text>
                      {trip.visitDate && (
                        <Text c={theme.colors.sage[4]} size="sm">
                          ({trip.visitDate})
                        </Text>
                      )}
                      <Badge color="teal" variant="light">
                        {trip.photos.length} photo(s)
                      </Badge>
                    </Group>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="md">
                    <TextInput
                      label="Trip Title"
                      placeholder="e.g., Summer 2024 Visit"
                      value={trip.title}
                      onChange={(e) =>
                        updateTrip(trip.id, { title: e.target.value })
                      }
                      required
                      styles={{
                        label: { color: theme.colors.sage[3] },
                        input: {
                          backgroundColor: theme.colors.darkGreen[9],
                          color: theme.colors.sage[1],
                          borderColor: theme.colors.sage[8],
                          "&:focus": {
                            borderColor: theme.colors.sage[6],
                          },
                        },
                      }}
                    />

                    <TextInput
                      label="Visit Date"
                      type="date"
                      value={trip.visitDate}
                      onChange={(e) =>
                        updateTrip(trip.id, { visitDate: e.target.value })
                      }
                      required
                      styles={{
                        label: { color: theme.colors.sage[3] },
                        input: {
                          backgroundColor: theme.colors.darkGreen[9],
                          color: theme.colors.sage[1],
                          borderColor: theme.colors.sage[8],
                          "&:focus": {
                            borderColor: theme.colors.sage[6],
                          },
                        },
                      }}
                    />

                    <Textarea
                      label="Story"
                      placeholder="Tell the story of this visit..."
                      value={trip.story}
                      onChange={(e) =>
                        updateTrip(trip.id, { story: e.target.value })
                      }
                      minRows={3}
                      styles={{
                        label: { color: theme.colors.sage[3] },
                        input: {
                          backgroundColor: theme.colors.darkGreen[9],
                          color: theme.colors.sage[1],
                          borderColor: theme.colors.sage[8],
                          "&:focus": {
                            borderColor: theme.colors.sage[6],
                          },
                        },
                      }}
                    />

                    <TagsInput
                      label="Tags"
                      placeholder="Add tags (press Enter after each)"
                      value={trip.tags}
                      onChange={(tags) => updateTrip(trip.id, { tags })}
                      styles={{
                        label: { color: theme.colors.sage[3] },
                        input: {
                          backgroundColor: theme.colors.darkGreen[9],
                          color: theme.colors.sage[1],
                          borderColor: theme.colors.sage[8],
                        },
                      }}
                    />

                    <Divider
                      label="Photos"
                      labelPosition="left"
                      styles={{
                        label: { color: theme.colors.sage[3] },
                      }}
                    />

                    {trip.photos.length > 0 && (
                      <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="xs">
                        {trip.photos.map((photo) => (
                          <Card
                            key={photo.id}
                            p={0}
                            radius="sm"
                            withBorder
                            style={{
                              position: "relative",
                              borderColor: theme.colors.sage[8],
                            }}
                          >
                            <ActionIcon
                              color="red"
                              variant="filled"
                              size="sm"
                              onClick={() => deletePhoto(trip.id, photo.id)}
                              style={{
                                position: "absolute",
                                top: 5,
                                right: 5,
                                zIndex: 1,
                              }}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                            <Image
                              src={photo.src}
                              alt={photo.alt}
                              height={100}
                              fit="cover"
                            />
                            <Box p="xs">
                              <Text size="xs" c={theme.colors.sage[2]} truncate>
                                {photo.title}
                              </Text>
                            </Box>
                          </Card>
                        ))}
                      </SimpleGrid>
                    )}

                    <FileInput
                      label="Add Photos"
                      placeholder="Choose photos to upload"
                      multiple
                      accept="image/*"
                      leftSection={<IconUpload size={16} />}
                      onChange={(files) => handlePhotoUpload(trip.id, files)}
                      disabled={uploadingFiles[`${trip.id}_upload`]}
                      styles={{
                        label: { color: theme.colors.sage[3] },
                        input: {
                          backgroundColor: theme.colors.darkGreen[9],
                          color: theme.colors.sage[1],
                          borderColor: theme.colors.sage[8],
                          "&:focus": {
                            borderColor: theme.colors.sage[6],
                          },
                        },
                      }}
                    />

                    <Button
                      color="red"
                      variant="light"
                      leftSection={<IconTrash size={16} />}
                      onClick={() => deleteTrip(trip.id)}
                      fullWidth
                    >
                      Delete This Trip
                    </Button>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        )}

        <Button
          leftSection={<IconPlus size={16} />}
          onClick={addNewTrip}
          variant="light"
          color="blue"
          fullWidth
        >
          Add New Trip
        </Button>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={trips.length === 0}>
            Save All Trips
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default TripEditor;
