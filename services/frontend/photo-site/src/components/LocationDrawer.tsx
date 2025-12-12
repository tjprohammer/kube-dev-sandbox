import {
  Drawer,
  Text,
  Title,
  Group,
  Badge,
  Stack,
  Button,
  ScrollArea,
  useMantineTheme,
  Box,
  Image,
  SimpleGrid,
  Accordion,
  Divider,
  Card,
} from "@mantine/core";
import {
  IconCalendar,
  IconMapPin,
  IconMail,
  IconPhoto,
  IconX,
} from "@tabler/icons-react";
import { LocationPin, LocationPhoto } from "../types/LocationPin";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "@mantine/hooks";

interface LocationDrawerProps {
  location: LocationPin | null;
  opened: boolean;
  onClose: () => void;
}

export default function LocationDrawer({
  location,
  opened,
  onClose,
}: LocationDrawerProps) {
  const theme = useMantineTheme();
  const [selectedPhoto, setSelectedPhoto] = useState<LocationPhoto | null>(
    null
  );
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (!location) return null;

  const handleContactForPhoto = (photo: LocationPhoto) => {
    const subject = encodeURIComponent(`Photo Request: ${photo.title}`);
    const message = encodeURIComponent(
      `Hi! I'm interested in purchasing "${photo.title}" from your ${location.title} collection. Could you please let me know about:\n\n• Available print sizes and materials\n• Pricing options\n• Shipping details\n\nThanks!`
    );
    navigate(`/contact?subject=${subject}&message=${message}`);
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "desert":
        return theme.colors.brown[6];
      case "mountains":
        return theme.colors.darkGreen[6];
      case "coastal":
        return "#4682B4";
      case "forest":
        return theme.colors.sage[6];
      case "other":
        return "#9B59B6";
      default:
        return theme.colors.tan[6];
    }
  };

  return (
    <>
      {/* Main Drawer */}
      <Drawer
        opened={opened}
        onClose={onClose}
        position={isMobile ? "bottom" : "right"}
        size={isMobile ? "85%" : "480px"}
        withCloseButton={false}
        title={
          <Group justify="space-between" w="100%" align="center">
            <Title order={3} c={theme.colors.white[0]} size="lg">
              {location.title}
            </Title>
            <Button
              variant="subtle"
              size="sm"
              onClick={onClose}
              p="xs"
              style={{
                color: theme.colors.sage[4],
                minWidth: "auto",
                "&:hover": {
                  backgroundColor: theme.colors.sage[8],
                  color: theme.colors.white[0],
                },
              }}
            >
              <IconX size={18} />
            </Button>
          </Group>
        }
        styles={{
          content: { backgroundColor: theme.colors.brown[9] },
          header: {
            backgroundColor: theme.colors.brown[9],
            borderBottom: `1px solid ${theme.colors.sage[7]}`,
          },
          body: { backgroundColor: theme.colors.brown[9], padding: 0 },
        }}
        overlayProps={{
          backgroundOpacity: 0.5,
          blur: 2,
        }}
      >
        <ScrollArea
          h={isMobile ? "70vh" : "calc(100vh - 80px)"}
          p="md"
          pt={isMobile ? "xl" : "md"}
        >
          <Stack gap="lg">
            {/* Header Info */}
            <Box mt={isMobile ? "xl" : "lg"}>
              <Group justify="space-between" mb="sm">
                <Badge
                  color={getCategoryColor(location.category)}
                  size="lg"
                  radius="md"
                >
                  {location.category.charAt(0).toUpperCase() +
                    location.category.slice(1)}
                </Badge>
                {location.featured && (
                  <Badge color="yellow" size="sm" leftSection="⭐">
                    Featured
                  </Badge>
                )}
              </Group>

              <Text size="sm" c={theme.colors.sage[2]} mb="xs">
                {location.description}
              </Text>

              <Group gap="xs" mb="md">
                <IconCalendar size={16} color={theme.colors.sage[4]} />
                <Text size="sm" c={theme.colors.sage[3]}>
                  Visited{" "}
                  {location.visitDate
                    ? formatDate(location.visitDate)
                    : "Date unknown"}
                </Text>
              </Group>

              <Group gap="xs" mb="md">
                <IconMapPin size={16} color={theme.colors.sage[4]} />
                <Text size="sm" c={theme.colors.sage[3]}>
                  {location.coordinates.latitude.toFixed(4)},{" "}
                  {location.coordinates.longitude.toFixed(4)}
                </Text>
              </Group>
            </Box>

            {/* Photo Gallery */}
            {location.photos && location.photos.length > 0 && (
              <Box>
                <Group justify="space-between" mb="md">
                  <Title order={4} c={theme.colors.white[0]}>
                    <IconPhoto
                      size={20}
                      style={{ marginRight: 8, verticalAlign: "middle" }}
                    />
                    Photos ({location.photos.length})
                  </Title>
                </Group>

                <SimpleGrid cols={isMobile ? 2 : 3} spacing="xs" mb="lg">
                  {location.photos.map((photo) => (
                    <Card
                      key={photo.id}
                      radius="md"
                      p={0}
                      bg={theme.colors.darkGreen[8]}
                      style={{
                        cursor: "pointer",
                        overflow: "hidden",
                      }}
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        height={isMobile ? 120 : 100}
                        fit="cover"
                      />
                      <Box p="xs">
                        <Text
                          size="xs"
                          c={theme.colors.white[0]}
                          fw={500}
                          truncate
                        >
                          {photo.title}
                        </Text>
                        {photo.description && (
                          <Text
                            size="xs"
                            c={theme.colors.sage[3]}
                            lineClamp={1}
                          >
                            {photo.description}
                          </Text>
                        )}
                      </Box>
                    </Card>
                  ))}
                </SimpleGrid>
              </Box>
            )}

            {/* Story Section */}
            <Accordion
              variant="separated"
              radius="md"
              styles={{
                root: { backgroundColor: "transparent" },
                item: { backgroundColor: theme.colors.darkGreen[8] },
                control: { color: theme.colors.white[0] },
                content: { color: theme.colors.sage[1] },
              }}
            >
              <Accordion.Item value="story">
                <Accordion.Control>
                  <Text fw={500}>The Story Behind This Location</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Text size="sm" style={{ lineHeight: 1.6 }}>
                    {location.story}
                  </Text>
                </Accordion.Panel>
              </Accordion.Item>

              {location.tags && location.tags.length > 0 && (
                <Accordion.Item value="tags">
                  <Accordion.Control>
                    <Text fw={500}>Tags & Keywords</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Group gap="xs">
                      {location.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="light"
                          color={theme.colors.sage[6]}
                          size="sm"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </Group>
                  </Accordion.Panel>
                </Accordion.Item>
              )}
            </Accordion>

            {/* Contact CTA */}
            {/* Contact section - only show if location has photos */}
            {location.photos && location.photos.length > 0 && (
              <Card bg={theme.colors.brown[8]} radius="md" p="md">
                <Text size="sm" c={theme.colors.sage[1]} mb="sm" ta="center">
                  Interested in prints from this location?
                </Text>
                <Button
                  fullWidth
                  bg={theme.colors.brown[6]}
                  c={theme.colors.white[0]}
                  leftSection={<IconMail size={16} />}
                  onClick={() => handleContactForPhoto(location.photos![0])}
                >
                  Contact for Pricing
                </Button>
              </Card>
            )}
          </Stack>
        </ScrollArea>
      </Drawer>

      {/* Photo Detail Modal - Only opens when photo is selected */}
      {selectedPhoto && (
        <Drawer
          opened={!!selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          position={isMobile ? "bottom" : "right"}
          size={isMobile ? "95%" : "600px"}
          title={selectedPhoto.title}
          styles={{
            content: { backgroundColor: theme.colors.brown[9] },
            header: { backgroundColor: theme.colors.brown[9] },
            body: { backgroundColor: theme.colors.brown[9] },
          }}
        >
          <Stack gap="md">
            <Image
              src={selectedPhoto.src}
              alt={selectedPhoto.alt}
              fit="contain"
              mah={isMobile ? "50vh" : "60vh"}
              radius="md"
            />

            <Stack gap="sm">
              <Title order={4} c={theme.colors.white[0]}>
                {selectedPhoto.title}
              </Title>

              {selectedPhoto.description && (
                <Text size="sm" c={theme.colors.sage[1]}>
                  {selectedPhoto.description}
                </Text>
              )}

              <Divider color={theme.colors.sage[7]} />

              <Group justify="space-between">
                <Button
                  variant="light"
                  color={theme.colors.sage[5]}
                  onClick={() => setSelectedPhoto(null)}
                >
                  Back to Gallery
                </Button>
                <Button
                  bg={theme.colors.brown[6]}
                  c={theme.colors.white[0]}
                  leftSection={<IconMail size={16} />}
                  onClick={() => handleContactForPhoto(selectedPhoto)}
                >
                  Request Print
                </Button>
              </Group>
            </Stack>
          </Stack>
        </Drawer>
      )}
    </>
  );
}
