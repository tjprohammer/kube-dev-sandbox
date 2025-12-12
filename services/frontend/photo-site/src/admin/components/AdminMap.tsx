import { useEffect, useRef, useState, useCallback } from "react";
import {
  useMantineTheme,
  Box,
  Button,
  Group,
  Tooltip,
  Drawer,
  ScrollArea,
  Stack,
  Text,
  Badge,
  Divider,
  SimpleGrid,
  Card,
  Image,
} from "@mantine/core";
import { IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";
import mapboxgl from "mapbox-gl";
import { LocationPin } from "../../types/LocationPin";
import "mapbox-gl/dist/mapbox-gl.css";
import { getMapboxToken } from "../../config/runtime";

interface AdminMapProps {
  pins: LocationPin[];
  onEditPin: (pin: LocationPin) => void;
  onCreatePin: (coordinates?: { latitude: number; longitude: number }) => void;
  onDeletePin: (pinId: string) => void;
}

export default function AdminMap({
  pins,
  onEditPin,
  onCreatePin,
  onDeletePin,
}: AdminMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const theme = useMantineTheme();
  const [selectedPin, setSelectedPin] = useState<LocationPin | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [isAddingPin, setIsAddingPin] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const closeDetailPanel = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedPin(null);
  }, []);

  // Debug logging for state changes
  useEffect(() => {
    console.log("AdminMap: isAddingPin changed to:", isAddingPin);
  }, [isAddingPin]);

  useEffect(() => {
    console.log(
      "AdminMap: selectedPin changed to:",
      selectedPin?.title || "null"
    );
  }, [selectedPin]);

  // Category colors for pins (matching MapboxNative)
  const getPinColor = useCallback(
    (category: string) => {
      switch (category) {
        case "desert":
          return theme.colors.brown[6]; // Brown for desert
        case "mountains":
          return theme.colors.darkGreen[6]; // Dark green for mountains
        case "coastal":
          return "#4682B4"; // Steel blue for coastal
        case "forest":
          return theme.colors.sage[6]; // Sage green for forest
        case "other":
          return "#9B59B6"; // Purple for other/skies
        default:
          return "#FF6347"; // Tomato red for unknown
      }
    },
    [theme]
  );

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const resolvedToken = getMapboxToken(
      import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
    );

    if (!resolvedToken) {
      console.warn("AdminMap: Missing Mapbox token; map may not render.");
    } else {
      console.log("AdminMap: Initializing map with token:", resolvedToken);
    }

    mapboxgl.accessToken = resolvedToken || "";

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12", // Satellite WITH labels
        center: [-106.3468, 45.7772], // Center of North America
        zoom: 3.5,
        pitch: 0,
        bearing: 0,
      });

      console.log("AdminMap: Map created", map.current);

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Map load handler
      map.current.on("load", () => {
        console.log("AdminMap: Map loaded successfully");

        // Add US state borders using free GeoJSON data
        map.current!.addSource("us-states", {
          type: "geojson",
          data: "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json",
        });

        map.current!.addLayer({
          id: "state-borders-line",
          type: "line",
          source: "us-states",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#ffffff",
            "line-width": [
              "interpolate",
              ["linear"],
              ["zoom"],
              3,
              1.5,
              6,
              2.5,
              10,
              4,
            ],
            "line-opacity": 0.8,
          },
        });

        // Add state borders fill for better visibility
        map.current!.addLayer(
          {
            id: "state-borders-fill",
            type: "fill",
            source: "us-states",
            paint: {
              "fill-color": "transparent",
              "fill-outline-color": "#ffffff",
            },
          },
          "state-borders-line"
        );

        // Add roads using composite source
        map.current!.addLayer({
          id: "highways",
          type: "line",
          source: "composite",
          "source-layer": "road",
          filter: ["all", ["==", ["get", "class"], "motorway"]],
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#ff6600",
            "line-width": [
              "interpolate",
              ["linear"],
              ["zoom"],
              4,
              0.8,
              8,
              2.5,
              12,
              4,
            ],
            "line-opacity": 0.8,
          },
        });

        // Add primary roads
        map.current!.addLayer({
          id: "primary-roads",
          type: "line",
          source: "composite",
          "source-layer": "road",
          filter: [
            "all",
            [
              "in",
              ["get", "class"],
              ["literal", ["primary", "secondary", "trunk"]],
            ],
          ],
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#ffcc00",
            "line-width": [
              "interpolate",
              ["linear"],
              ["zoom"],
              6,
              0.5,
              10,
              2,
              14,
              3,
            ],
            "line-opacity": 0.7,
          },
        });

        // Add place labels (cities, towns, villages)
        map.current!.addLayer({
          id: "place-labels",
          type: "symbol",
          source: "composite",
          "source-layer": "place_label",
          filter: [
            "in",
            ["get", "class"],
            ["literal", ["city", "town", "village"]],
          ],
          layout: {
            "text-field": ["get", "name"],
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              4,
              10,
              8,
              14,
              12,
              18,
            ],
            "text-anchor": "center",
            "text-offset": [0, 0.5],
          },
          paint: {
            "text-color": "#ffffff",
            "text-halo-color": "#000000",
            "text-halo-width": 2,
            "text-halo-blur": 1,
          },
        });

        // Add natural feature labels (mountains, peaks, etc.)
        map.current!.addLayer({
          id: "natural-labels",
          type: "symbol",
          source: "composite",
          "source-layer": "natural_label",
          layout: {
            "text-field": ["get", "name"],
            "text-font": [
              "Open Sans Semibold Italic",
              "Arial Unicode MS Regular",
            ],
            "text-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              4,
              9,
              8,
              12,
              12,
              16,
            ],
            "text-anchor": "center",
          },
          paint: {
            "text-color": "#e8f4f8",
            "text-halo-color": "#000000",
            "text-halo-width": 1.5,
          },
        });

        // Add POI labels (parks, points of interest)
        map.current!.addLayer({
          id: "poi-labels",
          type: "symbol",
          source: "composite",
          "source-layer": "poi_label",
          filter: ["in", ["get", "class"], ["literal", ["park", "park_like"]]],
          layout: {
            "text-field": ["get", "name"],
            "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
            "text-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              6,
              8,
              10,
              11,
              14,
              14,
            ],
          },
          paint: {
            "text-color": "#90ee90",
            "text-halo-color": "#004d00",
            "text-halo-width": 2,
          },
        });
      });

      map.current.on("error", (e) => {
        console.error("AdminMap: Map error:", e);
      });
    } catch (error) {
      console.error("AdminMap: Failed to create map:", error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Remove dependencies to prevent recreation

  // Handle map clicks for adding pins (separate effect)
  useEffect(() => {
    if (!map.current) return;

    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      console.log("=== MAP CLICKED ===");
      console.log("Current isAddingPin state:", isAddingPin);
      console.log("Click coordinates:", {
        lng: e.lngLat.lng,
        lat: e.lngLat.lat,
      });

      if (isAddingPin) {
        const { lng, lat } = e.lngLat;
        console.log("Creating pin at:", { latitude: lat, longitude: lng });
        onCreatePin({ latitude: lat, longitude: lng });
        setIsAddingPin(false);
        console.log("Pin creation triggered, setting isAddingPin to false");
      } else {
        console.log("NOT creating pin because isAddingPin is false");
        closeDetailPanel();
      }
    };

    console.log("Adding map click listener, current isAddingPin:", isAddingPin);
    map.current.on("click", handleMapClick);

    return () => {
      if (map.current) {
        console.log("Removing map click listener");
        map.current.off("click", handleMapClick);
      }
    };
  }, [isAddingPin, onCreatePin, closeDetailPanel]);

  // Update cursor style based on mode
  useEffect(() => {
    if (map.current) {
      const canvas = map.current.getCanvas();
      canvas.style.cursor = isAddingPin ? "crosshair" : "grab";
    }
  }, [isAddingPin]);

  // Add/update markers for all pins
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    // Add markers for each pin
    pins.forEach((pin) => {
      // Create container for marker (this stays at exact coordinates)
      const markerContainer = document.createElement("div");
      markerContainer.style.width = pin.featured ? "24px" : "18px";
      markerContainer.style.height = pin.featured ? "24px" : "18px";
      markerContainer.style.display = "flex";
      markerContainer.style.alignItems = "center";
      markerContainer.style.justifyContent = "center";
      markerContainer.style.cursor = "pointer";

      // Create inner element for visual styling (this can change size)
      const markerElement = document.createElement("div");
      markerElement.style.width = "100%";
      markerElement.style.height = "100%";
      markerElement.style.backgroundColor = getPinColor(pin.category);
      markerElement.style.borderRadius = "50%";
      markerElement.style.border = "2px solid white";
      markerElement.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
      markerElement.style.transition = "all 0.2s ease";
      markerElement.style.display = "flex";
      markerElement.style.alignItems = "center";
      markerElement.style.justifyContent = "center";

      // Add star for featured locations
      if (pin.featured) {
        const star = document.createElement("span");
        star.innerHTML = "★";
        star.style.fontSize = "10px";
        star.style.color = "white";
        star.style.fontWeight = "bold";
        star.style.textShadow = "0 1px 2px rgba(0,0,0,0.5)";
        markerElement.appendChild(star);
      }

      // Append inner element to container
      markerContainer.appendChild(markerElement);

      // Add selected state styling
      if (selectedPin?.id === pin.id) {
        markerElement.style.borderColor = theme.colors.yellow[4];
        markerElement.style.borderWidth = "3px";
        markerElement.style.boxShadow = "0 4px 12px rgba(255, 255, 0, 0.4)";
      }

      // Add hover effects - only affect inner element, not container position
      markerContainer.addEventListener("mouseenter", () => {
        if (selectedPin?.id !== pin.id) {
          markerElement.style.transform = "scale(1.2)";
          markerElement.style.boxShadow = "0 4px 12px rgba(0,0,0,0.5)";
          markerElement.style.zIndex = "1000";
        }
      });

      markerContainer.addEventListener("mouseleave", () => {
        if (selectedPin?.id !== pin.id) {
          markerElement.style.transform = "scale(1)";
          markerElement.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
          markerElement.style.zIndex = "auto";
        }
      });

      // Add click handler
      markerContainer.addEventListener("click", (e) => {
        e.stopPropagation();
        setSelectedPin(pin);
        setIsDetailOpen(true);
      });

      // Create and add marker with proper anchor (using container, not inner element)
      const marker = new mapboxgl.Marker({
        element: markerContainer,
        anchor: "center", // Ensure pin is centered on coordinates
      })
        .setLngLat([pin.coordinates.longitude, pin.coordinates.latitude])
        .addTo(map.current!);

      console.log(
        `AdminMap: Added pin "${pin.title}" at [${pin.coordinates.longitude}, ${pin.coordinates.latitude}]`
      );

      markersRef.current[pin.id] = marker;
    });
  }, [getPinColor, selectedPin, theme, pins]);

  // Handle pin actions
  const handleEditPin = () => {
    if (selectedPin) {
      setIsDetailOpen(false);
      onEditPin(selectedPin);
      setSelectedPin(null);
    }
  };

  const handleDeletePin = () => {
    if (selectedPin) {
      onDeletePin(selectedPin.id);
      closeDetailPanel();
    }
  };

  const handleAddPin = () => {
    console.log("Add Pin button clicked");
    setIsAddingPin(true);
    setSelectedPin(null);
  };

  const handleCancelAdd = () => {
    console.log("Cancel Add button clicked");
    setIsAddingPin(false);
  };

  return (
    <Box style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Map Container */}
      <div
        ref={mapContainer}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: theme.radius.sm,
          position: "relative",
          zIndex: 1,
        }}
      />

      {/* Control Panel */}
      <Box
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          padding: theme.spacing.md,
          borderRadius: theme.radius.md,
          boxShadow: theme.shadows.md,
          backdropFilter: "blur(10px)",
          zIndex: 1000, // Ensure it's on top
        }}
      >
        <Group gap="xs">
          {!isAddingPin ? (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(
                  "Add Pin button CLICKED - before state change, isAddingPin:",
                  isAddingPin
                );
                handleAddPin();
              }}
              size="sm"
              variant="filled"
              color="brown"
              style={{ cursor: "pointer" }}
            >
              Add Pin
            </Button>
          ) : (
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Cancel button CLICKED");
                handleCancelAdd();
              }}
              size="sm"
              variant="outline"
              color="red"
              style={{ cursor: "pointer" }}
            >
              Cancel
            </Button>
          )}
        </Group>

        {isAddingPin && (
          <Box
            mt="xs"
            style={{
              fontSize: theme.fontSizes.sm,
              color: theme.colors.gray[7],
            }}
          >
            Click on the map to place a new pin
          </Box>
        )}

        {/* Debug info */}
        <Box mt="xs" style={{ fontSize: "12px", color: theme.colors.gray[5] }}>
          Debug: isAddingPin = {isAddingPin.toString()}
        </Box>
      </Box>

      {/* Selected Pin Detail Drawer */}
      <Drawer
        opened={!!selectedPin && isDetailOpen && !isAddingPin}
        onClose={closeDetailPanel}
        position="right"
        size="lg"
        withCloseButton={false}
        overlayProps={{ opacity: 0.2, blur: 4 }}
        styles={{
          content: {
            backgroundColor: theme.colors.brown[9],
            borderLeft: `1px solid ${theme.colors.sage[8]}`,
          },
          body: {
            padding: theme.spacing.lg,
            color: theme.colors.sage[1],
          },
        }}
      >
        {selectedPin && (
          <Stack gap="lg" style={{ height: "100%" }}>
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                <Text size="lg" fw={600} c={theme.colors.white[0]} truncate>
                  {selectedPin.title}
                </Text>
                <Group gap="xs">
                  <Badge
                    color={theme.colors.brown[5]}
                    variant="light"
                    tt="uppercase"
                  >
                    {selectedPin.category}
                  </Badge>
                  {selectedPin.featured && (
                    <Badge color="yellow" variant="filled">
                      Featured
                    </Badge>
                  )}
                </Group>
              </Stack>

              <Group gap="xs" wrap="nowrap">
                <Tooltip label="Edit this location">
                  <Button
                    size="xs"
                    variant="light"
                    color={theme.colors.sage[5]}
                    onClick={handleEditPin}
                    leftSection={<IconEdit size={14} />}
                  >
                    Edit
                  </Button>
                </Tooltip>
                <Tooltip label="Delete this location">
                  <Button
                    size="xs"
                    color="red"
                    variant="light"
                    onClick={handleDeletePin}
                    leftSection={<IconTrash size={14} />}
                  >
                    Delete
                  </Button>
                </Tooltip>
              </Group>
            </Group>

            <Divider color={theme.colors.sage[7]} />

            <ScrollArea style={{ flex: 1 }} type="hover">
              <Stack gap="lg" pr="sm">
                <Box>
                  <Text
                    size="xs"
                    c={theme.colors.sage[4]}
                    fw={600}
                    tt="uppercase"
                    mb={4}
                  >
                    Description
                  </Text>
                  <Text size="sm" c={theme.colors.sage[1]}>
                    {selectedPin.description || "No description provided."}
                  </Text>
                </Box>

                <Group gap="lg" align="flex-start" wrap="wrap">
                  <Box>
                    <Text
                      size="xs"
                      c={theme.colors.sage[4]}
                      fw={600}
                      tt="uppercase"
                      mb={4}
                    >
                      Coordinates
                    </Text>
                    <Text size="sm" c={theme.colors.sage[2]}>
                      {selectedPin.coordinates.latitude.toFixed(4)},{" "}
                      {selectedPin.coordinates.longitude.toFixed(4)}
                    </Text>
                  </Box>

                  {selectedPin.visitDate && (
                    <Box>
                      <Text
                        size="xs"
                        c={theme.colors.sage[4]}
                        fw={600}
                        tt="uppercase"
                        mb={4}
                      >
                        Visit Date
                      </Text>
                      <Text size="sm" c={theme.colors.sage[2]}>
                        {new Date(selectedPin.visitDate).toLocaleDateString()}
                      </Text>
                    </Box>
                  )}
                </Group>

                {selectedPin.tags && selectedPin.tags.length > 0 && (
                  <Box>
                    <Text
                      size="xs"
                      c={theme.colors.sage[4]}
                      fw={600}
                      tt="uppercase"
                      mb={4}
                    >
                      Tags
                    </Text>
                    <Group gap="xs">
                      {selectedPin.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          color={theme.colors.sage[5]}
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </Group>
                  </Box>
                )}

                {/* Trip-aware rendering */}
                {selectedPin.trips && selectedPin.trips.length > 0 ? (
                  <Stack gap="md">
                    {selectedPin.trips.map((trip) => (
                      <Card
                        key={trip.id}
                        bg={theme.colors.darkGreen[8]}
                        radius="md"
                        p="md"
                        withBorder
                        style={{ borderColor: theme.colors.sage[7] }}
                      >
                        <Stack gap="sm">
                          <Group justify="space-between" align="flex-start">
                            <Stack gap={4} style={{ flex: 1 }}>
                              <Text
                                size="sm"
                                fw={600}
                                c={theme.colors.white[0]}
                              >
                                {trip.title}
                              </Text>
                              <Text size="xs" c={theme.colors.sage[3]}>
                                {new Date(trip.visitDate).toLocaleDateString()}
                              </Text>
                            </Stack>
                            <Badge color={theme.colors.sage[5]} variant="light">
                              {trip.photos.length} Photos
                            </Badge>
                          </Group>

                          <Text size="sm" c={theme.colors.sage[2]}>
                            {trip.story}
                          </Text>

                          {trip.tags && trip.tags.length > 0 && (
                            <Group gap="xs" wrap="wrap">
                              {trip.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  color={theme.colors.sage[6]}
                                >
                                  #{tag}
                                </Badge>
                              ))}
                            </Group>
                          )}

                          {trip.photos.length > 0 && (
                            <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="xs">
                              {trip.photos.map((photo) => (
                                <Card
                                  key={photo.id}
                                  p={0}
                                  radius="sm"
                                  withBorder
                                  style={{ borderColor: theme.colors.sage[8] }}
                                >
                                  <Image
                                    src={photo.src}
                                    alt={photo.alt}
                                    height={100}
                                    fit="cover"
                                  />
                                  <Box p="xs">
                                    <Text
                                      size="xs"
                                      c={theme.colors.white[0]}
                                      truncate
                                    >
                                      {photo.title}
                                    </Text>
                                  </Box>
                                </Card>
                              ))}
                            </SimpleGrid>
                          )}
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Stack gap="md">
                    {selectedPin.story && (
                      <Box>
                        <Text
                          size="xs"
                          c={theme.colors.sage[4]}
                          fw={600}
                          tt="uppercase"
                          mb={4}
                        >
                          Story
                        </Text>
                        <Text size="sm" c={theme.colors.sage[1]}>
                          {selectedPin.story}
                        </Text>
                      </Box>
                    )}

                    {selectedPin.photos && selectedPin.photos.length > 0 && (
                      <Box>
                        <Group justify="space-between" mb="xs">
                          <Text
                            size="xs"
                            c={theme.colors.sage[4]}
                            fw={600}
                            tt="uppercase"
                          >
                            Photos ({selectedPin.photos.length})
                          </Text>
                          <Text size="xs" c={theme.colors.sage[3]}>
                            Use "Edit" to add or remove photos
                          </Text>
                        </Group>
                        <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="xs">
                          {selectedPin.photos.map((photo) => (
                            <Card
                              key={photo.id}
                              p={0}
                              radius="sm"
                              withBorder
                              style={{ borderColor: theme.colors.sage[8] }}
                            >
                              <Image
                                src={photo.src}
                                alt={photo.alt}
                                height={100}
                                fit="cover"
                              />
                              <Box p="xs">
                                <Text
                                  size="xs"
                                  c={theme.colors.white[0]}
                                  truncate
                                >
                                  {photo.title}
                                </Text>
                              </Box>
                            </Card>
                          ))}
                        </SimpleGrid>
                      </Box>
                    )}
                  </Stack>
                )}
              </Stack>
            </ScrollArea>

            <Divider color={theme.colors.sage[7]} />

            <Group justify="space-between">
              <Button
                variant="subtle"
                color={theme.colors.sage[4]}
                onClick={closeDetailPanel}
                size="xs"
              >
                Close
              </Button>
              <Group gap="xs">
                <Button
                  size="xs"
                  variant="light"
                  color={theme.colors.sage[5]}
                  onClick={handleEditPin}
                  leftSection={<IconEdit size={14} />}
                >
                  Edit Location
                </Button>
                <Button
                  size="xs"
                  color="red"
                  variant="filled"
                  onClick={handleDeletePin}
                  leftSection={<IconTrash size={14} />}
                >
                  Delete Location
                </Button>
              </Group>
            </Group>
          </Stack>
        )}
      </Drawer>
    </Box>
  );
}
