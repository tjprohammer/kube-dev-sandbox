import {
  Box,
  Text,
  Group,
  Badge,
  Stack,
  Button,
  ScrollArea,
  useMantineTheme,
  ActionIcon,
  Image,
  SimpleGrid,
  Card,
  Container,
  Transition,
  Modal,
} from "@mantine/core";
import {
  IconCalendar,
  IconMapPin,
  IconMail,
  IconPhoto,
  IconArrowLeft,
  IconX,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { LocationPin, LocationPhoto } from "../types/LocationPin";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSwipeable } from "react-swipeable";
import { useMediaQuery } from "@mantine/hooks";

interface LocationViewerProps {
  location: LocationPin | null;
  opened: boolean;
  onClose: () => void;
}

export default function LocationViewer({
  location,
  opened,
  onClose,
}: LocationViewerProps) {
  const theme = useMantineTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedTripIndex, setSelectedTripIndex] = useState(0);
  const scrollAreaViewportRef = useRef<HTMLDivElement | null>(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const resetScrollPosition = useCallback(() => {
    const viewport = scrollAreaViewportRef.current;
    if (viewport) {
      viewport.scrollTop = 0;
      if (typeof viewport.scrollTo === "function") {
        viewport.scrollTo({ top: 0, behavior: "auto" });
      }
    }

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }

    if (typeof document !== "undefined") {
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }

      if (document.body) {
        document.body.scrollTop = 0;
      }
    }
  }, []);

  // Reset state when location changes
  useEffect(() => {
    if (!location) {
      return undefined;
    }

    setSelectedImageIndex(null);
    setSwipeOffset(0);
    setIsClosing(false);
    setSelectedTripIndex(0);

    let timeoutId: number | null = null;
    const rafId = requestAnimationFrame(() => {
      resetScrollPosition();

      timeoutId = window.setTimeout(() => {
        resetScrollPosition();
      }, 160);
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [location, resetScrollPosition]);

  useEffect(() => {
    if (!opened) {
      return;
    }

    const rafId = requestAnimationFrame(() => {
      resetScrollPosition();
    });

    const timeoutId = window.setTimeout(() => {
      resetScrollPosition();
    }, 150);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [opened, resetScrollPosition, location?.id]);

  useEffect(() => {
    if (!opened) {
      return;
    }

    resetScrollPosition();
  }, [selectedTripIndex, opened, resetScrollPosition]);

  // Handle both new trips structure and legacy single trip for backward compatibility
  const trips = location
    ? location.trips && location.trips.length > 0
      ? location.trips
      : // Backward compatibility: create trip from legacy fields
        [
          {
            id: "legacy-trip-1",
            title: location.title,
            visitDate: location.visitDate || new Date().toISOString(),
            story: location.story || location.description,
            photos: location.photos || [],
            tags: location.tags || [],
          },
        ]
    : [];

  const currentTrip = trips[selectedTripIndex];

  // Main viewer swipe handlers - only for horizontal right swipes to close
  const swipeHandlers = useSwipeable({
    onSwiping: (eventData) => {
      if (
        eventData.dir === "Right" &&
        Math.abs(eventData.deltaX) > Math.abs(eventData.deltaY)
      ) {
        const offset = Math.min(Math.max(eventData.deltaX, 0), 250);
        setSwipeOffset(offset);
      }
    },
    onSwipedRight: (eventData) => {
      if (
        Math.abs(eventData.deltaX) > 150 &&
        Math.abs(eventData.deltaX) > Math.abs(eventData.deltaY)
      ) {
        setIsClosing(true);
        setSwipeOffset(window.innerWidth);
        setTimeout(() => {
          onClose();
          setIsClosing(false);
          setSwipeOffset(0);
        }, 300);
      } else {
        setSwipeOffset(0);
      }
    },
    onSwipedLeft: () => {
      setSwipeOffset(0);
    },
    onTouchEndOrOnMouseUp: () => {
      setSwipeOffset(0);
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: false,
    delta: 10,
  });

  // Modal-specific swipe handlers - more permissive for closing the image modal
  const photos = currentTrip?.photos ?? [];
  const photoCount = photos.length;

  const showNextPhoto = useCallback(() => {
    if (photoCount === 0) {
      return;
    }

    setSelectedImageIndex((prev) => {
      const nextIndex = prev === null ? 0 : (prev + 1) % photoCount;
      return nextIndex;
    });
  }, [photoCount]);

  const showPrevPhoto = useCallback(() => {
    if (photoCount === 0) {
      return;
    }

    setSelectedImageIndex((prev) => {
      const previousIndex =
        prev === null ? photoCount - 1 : (prev - 1 + photoCount) % photoCount;
      return previousIndex;
    });
  }, [photoCount]);

  useEffect(() => {
    if (selectedImageIndex === null || photoCount === 0) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNextPhoto();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrevPhoto();
      } else if (event.key === "Escape") {
        event.preventDefault();
        setSelectedImageIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageIndex, photoCount, showNextPhoto, showPrevPhoto]);

  const selectedPhoto =
    selectedImageIndex !== null && photoCount > 0
      ? photos[selectedImageIndex]
      : null;

  const modalSwipeHandlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      if (
        Math.abs(eventData.deltaX) > 50 &&
        Math.abs(eventData.deltaX) > Math.abs(eventData.deltaY)
      ) {
        showNextPhoto();
      }
    },
    onSwipedRight: (eventData) => {
      if (
        Math.abs(eventData.deltaX) > 50 &&
        Math.abs(eventData.deltaX) > Math.abs(eventData.deltaY)
      ) {
        showPrevPhoto();
      }
    },
    onSwipedDown: (eventData) => {
      // Only close on strong downward swipes that are clearly intentional
      if (
        Math.abs(eventData.deltaY) > 150 &&
        Math.abs(eventData.deltaY) > Math.abs(eventData.deltaX) * 2
      ) {
        setSelectedImageIndex(null);
      }
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: false,
    delta: 15,
  });

  if (!location) return null;

  const handleContactForPhoto = (photo: LocationPhoto) => {
    const subject = encodeURIComponent(`Print Request: ${photo.title}`);
    const message = encodeURIComponent(
      `Hi! I'm interested in purchasing "${photo.title}" from your ${location.title} collection. Could you please provide information about:\n\n• Available print sizes and materials\n• Pricing options\n• Shipping details\n\nThank you!`
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
      case "home":
        return theme.colors.sage[5];
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
      {/* Main Location Viewer */}
      <Transition
        mounted={opened && !isClosing}
        transition="slide-up"
        duration={400}
      >
        {(styles) => (
          <Box
            style={{
              ...styles,
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1000,
              background: isMobile
                ? `linear-gradient(to bottom, ${theme.colors.brown[9]} 0%, ${theme.colors.darkGreen[9]} 50%, ${theme.colors.brown[9]} 100%)`
                : `linear-gradient(135deg, ${theme.colors.brown[9]} 0%, ${theme.colors.darkGreen[9]} 100%)`,
              transform: `translateX(${swipeOffset}px)`,
              opacity: isClosing ? 0 : 1,
              transition: isClosing
                ? "all 0.3s ease-out"
                : swipeOffset > 0
                ? "none"
                : "transform 0.2s ease-out",
              overflowY: "auto",
              overflowX: "hidden",
            }}
            {...swipeHandlers}
          >
            {/* Header - Non-sticky on mobile for better scrolling */}
            <Box
              style={{
                position: isMobile ? "relative" : "sticky",
                top: 0,
                zIndex: 10,
                background: isMobile
                  ? "transparent"
                  : `${theme.colors.brown[9]}ee`,
                backdropFilter: isMobile ? "none" : "blur(10px)",
                borderBottom: isMobile
                  ? "none"
                  : `1px solid ${theme.colors.sage[7]}40`,
              }}
              p={isMobile ? "md" : 0}
              pt={isMobile ? "lg" : 0}
              pb={isMobile ? "sm" : 0}
            >
              <Container
                size={isMobile ? "100%" : "lg"}
                p={isMobile ? 0 : "lg"}
                style={{ maxWidth: isMobile ? "100%" : "1140px" }}
              >
                <Stack gap={isMobile ? "sm" : "md"}>
                  {/* Top Row: Back Button and Badge */}
                  <Group justify="space-between" align="center">
                    <ActionIcon
                      size={isMobile ? "xl" : "xl"}
                      variant="subtle"
                      onClick={onClose}
                      style={{
                        color: theme.colors.sage[4],
                        backgroundColor: isMobile
                          ? `${theme.colors.brown[8]}80`
                          : `${theme.colors.brown[8]}60`,
                        backdropFilter: "blur(10px)",
                        "&:hover": {
                          backgroundColor: theme.colors.sage[8],
                          color: theme.colors.white[0],
                        },
                      }}
                    >
                      <IconArrowLeft size={24} />
                    </ActionIcon>

                    <Badge
                      color={getCategoryColor(location.category)}
                      size={isMobile ? "lg" : "xl"}
                      radius="md"
                      variant="light"
                      style={{
                        backdropFilter: "blur(10px)",
                        backgroundColor: `${getCategoryColor(
                          location.category
                        )}40`,
                        padding: isMobile ? "8px 16px" : "10px 20px",
                        fontSize: isMobile ? "14px" : "16px",
                      }}
                    >
                      {location.category.charAt(0).toUpperCase() +
                        location.category.slice(1)}
                    </Badge>
                  </Group>

                  {/* Title */}
                  <Text
                    size={isMobile ? "26px" : "32px"}
                    fw={700}
                    c={theme.colors.white[0]}
                    lh={1.2}
                    style={{
                      textShadow: isMobile
                        ? "0 2px 12px rgba(0,0,0,0.9), 0 4px 24px rgba(0,0,0,0.6)"
                        : "0 2px 8px rgba(0,0,0,0.3)",
                    }}
                  >
                    {location.title}
                  </Text>

                  {/* Collapsible Description */}
                  <Box>
                    <Text
                      size={isMobile ? "14px" : "15px"}
                      c={theme.colors.sage[2]}
                      lh={1.5}
                      style={{
                        textShadow: isMobile
                          ? "0 1px 8px rgba(0,0,0,0.8), 0 2px 16px rgba(0,0,0,0.6)"
                          : "0 1px 4px rgba(0,0,0,0.2)",
                        display: descriptionExpanded ? "block" : "-webkit-box",
                        WebkitLineClamp: descriptionExpanded ? "unset" : 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {location.description}
                    </Text>
                    {location.description.length > 120 && (
                      <Button
                        variant="subtle"
                        size="xs"
                        onClick={() =>
                          setDescriptionExpanded(!descriptionExpanded)
                        }
                        style={{
                          color: theme.colors.sage[4],
                          padding: "4px 8px",
                          height: "24px",
                          fontSize: "12px",
                          marginTop: "4px",
                          minHeight: "24px",
                        }}
                      >
                        {descriptionExpanded ? "Show less" : "Read more"}
                      </Button>
                    )}
                  </Box>

                  {/* Swipe hint - desktop only */}
                  {!isMobile && (
                    <Text
                      size="xs"
                      c={theme.colors.gray[6]}
                      style={{ opacity: 0.5, marginTop: "-4px" }}
                    >
                      Swipe right → to close
                    </Text>
                  )}
                </Stack>
              </Container>
            </Box>

            {/* Trip Tabs */}
            {trips.length > 1 && (
              <Box
                style={{
                  position: "sticky",
                  top: isMobile ? "68px" : "72px", // Position below header
                  zIndex: 9,
                  background: `${theme.colors.brown[8]}dd`,
                  backdropFilter: "blur(10px)",
                  borderBottom: `1px solid ${theme.colors.sage[7]}20`,
                }}
                p={isMobile ? "xs" : "sm"}
              >
                <ScrollArea scrollbarSize={4} type="never">
                  <Group gap={isMobile ? "xs" : "sm"} wrap="nowrap">
                    {trips.map((trip, index) => (
                      <Button
                        key={trip.id}
                        size={isMobile ? "xs" : "sm"}
                        variant={
                          selectedTripIndex === index ? "filled" : "subtle"
                        }
                        color={
                          selectedTripIndex === index
                            ? theme.colors.sage[5]
                            : theme.colors.sage[7]
                        }
                        radius="xl"
                        onClick={() => setSelectedTripIndex(index)}
                        style={{
                          minWidth: isMobile ? "120px" : "140px",
                          backgroundColor:
                            selectedTripIndex === index
                              ? theme.colors.sage[6]
                              : `${theme.colors.sage[8]}40`,
                          color:
                            selectedTripIndex === index
                              ? theme.colors.white[0]
                              : theme.colors.sage[3],
                          borderColor:
                            selectedTripIndex === index
                              ? theme.colors.sage[5]
                              : theme.colors.sage[7],
                          transition: "all 0.2s ease",
                          "&:hover": {
                            backgroundColor:
                              selectedTripIndex === index
                                ? theme.colors.sage[5]
                                : `${theme.colors.sage[7]}60`,
                          },
                        }}
                      >
                        <Stack gap={2} align="center">
                          <Text size={isMobile ? "xs" : "sm"} fw={600}>
                            Trip {index + 1}
                          </Text>
                          <Text
                            size="xs"
                            c={
                              selectedTripIndex === index
                                ? theme.colors.sage[1]
                                : theme.colors.sage[5]
                            }
                          >
                            {new Date(trip.visitDate).getFullYear()}
                          </Text>
                        </Stack>
                      </Button>
                    ))}
                  </Group>
                </ScrollArea>
              </Box>
            )}

            {/* Main Content */}
            <Box
              style={{
                minHeight: isMobile ? "100vh" : "auto",
                paddingBottom: isMobile ? "40px" : "0px",
              }}
            >
              <Container
                size={isMobile ? "100%" : "lg"}
                p={isMobile ? "0" : "md"}
                style={{ maxWidth: isMobile ? "100%" : "1140px" }}
              >
                <Stack gap={isMobile ? "0" : "xl"}>
                  {/* Trip Story Section */}
                  <Card
                    radius={isMobile ? "0" : "xl"}
                    p={isMobile ? "lg" : "xl"}
                    style={{
                      background: isMobile
                        ? "transparent"
                        : `linear-gradient(45deg, ${theme.colors.darkGreen[8]}dd 0%, ${theme.colors.brown[8]}dd 100%)`,
                      backdropFilter: isMobile ? "none" : "blur(10px)",
                      border: isMobile
                        ? "none"
                        : `1px solid ${theme.colors.sage[7]}40`,
                    }}
                  >
                    <Stack gap={isMobile ? "md" : "lg"}>
                      {/* Trip Details */}
                      <Group gap={isMobile ? "md" : "xl"} wrap="wrap">
                        <Group gap="xs">
                          <IconCalendar
                            size={isMobile ? 16 : 18}
                            color={theme.colors.sage[4]}
                          />
                          <Text
                            size={isMobile ? "xs" : "sm"}
                            c={theme.colors.sage[4]}
                            fw={500}
                          >
                            {formatDate(currentTrip.visitDate)}
                          </Text>
                        </Group>
                        <Group gap="xs">
                          <IconMapPin
                            size={isMobile ? 16 : 18}
                            color={theme.colors.sage[4]}
                          />
                          <Text
                            size={isMobile ? "xs" : "sm"}
                            c={theme.colors.sage[4]}
                            fw={500}
                          >
                            {location.coordinates.latitude.toFixed(
                              isMobile ? 3 : 4
                            )}
                            °,{" "}
                            {location.coordinates.longitude.toFixed(
                              isMobile ? 3 : 4
                            )}
                            °
                          </Text>
                        </Group>
                        <Group gap="xs">
                          <IconPhoto
                            size={isMobile ? 16 : 18}
                            color={theme.colors.sage[4]}
                          />
                          <Text
                            size={isMobile ? "xs" : "sm"}
                            c={theme.colors.sage[4]}
                            fw={500}
                          >
                            {currentTrip.photos.length} Photo
                            {currentTrip.photos.length !== 1 ? "s" : ""}
                          </Text>
                        </Group>
                      </Group>

                      {/* Tags */}
                      {currentTrip.tags.length > 0 && (
                        <Group gap="xs" mt={isMobile ? "xs" : "md"}>
                          {currentTrip.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              size={isMobile ? "xs" : "sm"}
                              variant="outline"
                              color={theme.colors.sage[4]}
                              style={{
                                borderColor: theme.colors.sage[7],
                                color: theme.colors.sage[3],
                              }}
                            >
                              #{tag}
                            </Badge>
                          ))}
                        </Group>
                      )}
                    </Stack>
                  </Card>

                  {/* Photo Gallery */}
                  <Card
                    radius={isMobile ? "0" : "xl"}
                    p={isMobile ? "lg" : "xl"}
                    style={{
                      background: isMobile
                        ? "transparent"
                        : `${theme.colors.dark[8]}dd`,
                      backdropFilter: isMobile ? "none" : "blur(10px)",
                      border: isMobile
                        ? "none"
                        : `1px solid ${theme.colors.sage[7]}40`,
                    }}
                  >
                    <Stack gap={isMobile ? "md" : "lg"}>
                      <Group justify="space-between" align="center" wrap="wrap">
                        <Text
                          size={isMobile ? "xl" : "xl"}
                          fw={700}
                          c={theme.colors.white[0]}
                          style={{
                            textShadow: isMobile
                              ? "0 2px 8px rgba(0,0,0,0.8)"
                              : "none",
                          }}
                        >
                          Photography Collection
                        </Text>
                        {!isMobile && (
                          <Text size="sm" c={theme.colors.sage[4]}>
                            Click any image to view full size
                          </Text>
                        )}
                      </Group>

                      <SimpleGrid
                        cols={{ base: 1, xs: 2, sm: 2, md: 3, lg: 4 }}
                        spacing={isMobile ? "sm" : "lg"}
                      >
                        {currentTrip.photos.map(
                          (photo: LocationPhoto, index: number) => (
                            <Card
                              key={index}
                              radius={isMobile ? "lg" : "lg"}
                              p={0}
                              style={{
                                overflow: "hidden",
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                                border: `1px solid ${theme.colors.sage[8]}`,
                                backgroundColor: isMobile
                                  ? `${theme.colors.brown[9]}90`
                                  : "transparent",
                                backdropFilter: isMobile
                                  ? "blur(10px)"
                                  : "none",
                              }}
                              onMouseEnter={(e) => {
                                if (!isMobile) {
                                  e.currentTarget.style.transform =
                                    "translateY(-8px) scale(1.02)";
                                  e.currentTarget.style.boxShadow = `0 12px 30px ${theme.colors.dark[7]}88`;
                                  e.currentTarget.style.borderColor =
                                    theme.colors.sage[6];
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isMobile) {
                                  e.currentTarget.style.transform =
                                    "translateY(0) scale(1)";
                                  e.currentTarget.style.boxShadow = "none";
                                  e.currentTarget.style.borderColor =
                                    theme.colors.sage[8];
                                }
                              }}
                              onClick={() => setSelectedImageIndex(index)}
                            >
                              <Box style={{ position: "relative" }}>
                                <Image
                                  src={photo.src}
                                  alt={photo.alt}
                                  height={isMobile ? 220 : 200}
                                  fit="cover"
                                  style={{
                                    display: "block",
                                    width: "100%",
                                  }}
                                />

                                {/* Image overlay with title */}
                                <Box
                                  style={{
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    background: `linear-gradient(180deg, transparent 0%, ${theme.colors.dark[9]}f0 70%, ${theme.colors.dark[9]} 100%)`,
                                    padding: isMobile
                                      ? "12px 8px 8px 8px"
                                      : "16px 12px 12px 12px",
                                  }}
                                >
                                  <Text
                                    size={isMobile ? "xs" : "sm"}
                                    fw={600}
                                    c={theme.colors.white[0]}
                                    lineClamp={1}
                                    style={{
                                      textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                                    }}
                                  >
                                    {photo.title}
                                  </Text>
                                  {photo.description && !isMobile && (
                                    <Text
                                      size="xs"
                                      c={theme.colors.sage[2]}
                                      lineClamp={1}
                                      mt={2}
                                      style={{
                                        textShadow: "0 1px 2px rgba(0,0,0,0.6)",
                                      }}
                                    >
                                      {photo.description}
                                    </Text>
                                  )}
                                </Box>
                              </Box>

                              {/* Action button */}
                              <Box p={isMobile ? "sm" : "md"}>
                                <Button
                                  size={isMobile ? "xs" : "sm"}
                                  variant="light"
                                  color={theme.colors.sage[5]}
                                  radius="xl"
                                  fullWidth
                                  leftSection={
                                    <IconMail size={isMobile ? 12 : 14} />
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleContactForPhoto(photo);
                                  }}
                                  style={{
                                    backgroundColor: `${theme.colors.sage[8]}40`,
                                    borderColor: theme.colors.sage[6],
                                    minHeight: isMobile ? "32px" : "36px", // Better touch target
                                    "&:hover": {
                                      backgroundColor: theme.colors.sage[7],
                                    },
                                  }}
                                >
                                  {isMobile ? "Request" : "Request Print"}
                                </Button>
                              </Box>
                            </Card>
                          )
                        )}
                      </SimpleGrid>
                    </Stack>
                  </Card>
                </Stack>
              </Container>
            </Box>
          </Box>
        )}
      </Transition>

      {/* Image Modal */}
      <Modal
        opened={selectedImageIndex !== null}
        onClose={() => setSelectedImageIndex(null)}
        size="auto"
        centered
        withCloseButton={false}
        padding={0}
        styles={{
          content: {
            backgroundColor: "transparent",
            boxShadow: "none",
          },
          overlay: {
            backgroundColor: `${theme.colors.dark[9]}ee`,
            backdropFilter: "blur(10px)",
          },
        }}
      >
        {selectedPhoto && (
          <Box
            style={{
              position: "relative",
              maxWidth: isMobile ? "95vw" : "90vw",
              maxHeight: isMobile ? "95vh" : "90vh",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: isMobile ? 12 : 16,
            }}
            {...modalSwipeHandlers}
          >
            {/* Close button */}
            <ActionIcon
              size={isMobile ? "md" : "lg"}
              variant="filled"
              color="dark"
              style={{
                position: "absolute",
                top: isMobile ? 8 : 10,
                right: isMobile ? 8 : 10,
                zIndex: 1001,
                backgroundColor: `${theme.colors.dark[8]}dd`,
                backdropFilter: "blur(10px)",
              }}
              onClick={() => setSelectedImageIndex(null)}
            >
              <IconX size={isMobile ? 16 : 20} />
            </ActionIcon>

            <Box style={{ position: "relative", width: "100%" }}>
              {photoCount > 1 && selectedImageIndex !== null && (
                <>
                  <ActionIcon
                    size={isMobile ? "lg" : "xl"}
                    variant="filled"
                    color="dark"
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: isMobile ? 8 : 12,
                      transform: "translateY(-50%)",
                      zIndex: 1000,
                      backgroundColor: `${theme.colors.dark[8]}dd`,
                      backdropFilter: "blur(10px)",
                    }}
                    onClick={showPrevPhoto}
                  >
                    <IconChevronLeft size={isMobile ? 16 : 20} />
                  </ActionIcon>

                  <ActionIcon
                    size={isMobile ? "lg" : "xl"}
                    variant="filled"
                    color="dark"
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: isMobile ? 8 : 12,
                      transform: "translateY(-50%)",
                      zIndex: 1000,
                      backgroundColor: `${theme.colors.dark[8]}dd`,
                      backdropFilter: "blur(10px)",
                    }}
                    onClick={showNextPhoto}
                  >
                    <IconChevronRight size={isMobile ? 16 : 20} />
                  </ActionIcon>
                </>
              )}

              <Image
                src={selectedPhoto.src}
                alt={selectedPhoto.alt}
                fit="contain"
                style={{
                  width: "100%",
                  maxHeight: isMobile ? "70vh" : "75vh",
                  borderRadius: theme.radius.lg,
                }}
              />
            </Box>

            <Stack
              align="center"
              gap={isMobile ? "xs" : "sm"}
              maw={isMobile ? 320 : 420}
              px={isMobile ? "sm" : "md"}
            >
              {photoCount > 1 && selectedImageIndex !== null && (
                <Text
                  size="xs"
                  c={theme.colors.sage[4]}
                  ta="center"
                  tt="uppercase"
                  fw={600}
                >
                  Image {selectedImageIndex + 1} of {photoCount}
                </Text>
              )}
              <Text
                size={isMobile ? "md" : "lg"}
                fw={600}
                c={theme.colors.white[0]}
                ta="center"
              >
                {selectedPhoto.title}
              </Text>
              {selectedPhoto.description && (
                <Text
                  size={isMobile ? "xs" : "sm"}
                  c={theme.colors.sage[2]}
                  ta="center"
                  style={{ lineHeight: 1.6 }}
                >
                  {selectedPhoto.description}
                </Text>
              )}
              <Button
                bg={theme.colors.brown[6]}
                c={theme.colors.white[0]}
                leftSection={<IconMail size={isMobile ? 14 : 16} />}
                radius="xl"
                size={isMobile ? "sm" : "md"}
                onClick={() => handleContactForPhoto(selectedPhoto)}
                style={{
                  minHeight: isMobile ? "36px" : "40px",
                }}
              >
                {isMobile ? "Request" : "Request Print"}
              </Button>
            </Stack>
          </Box>
        )}
      </Modal>
    </>
  );
}
