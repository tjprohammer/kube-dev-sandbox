import { useEffect, useRef, useState, useCallback } from "react";
import { useMantineTheme, Box, Text, Group, Paper } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconMapPin, IconCamera } from "@tabler/icons-react";
import mapboxgl from "mapbox-gl";
import { PinDataService } from "../services/pinDataService";
import { LocationPin } from "../types/LocationPin";
import LocationViewer from "./LocationViewer";
import MapLoadingAnimation from "./MapLoadingAnimation";
import "mapbox-gl/dist/mapbox-gl.css";
import { getMapboxToken } from "../config/runtime";

interface MapComponentProps {
  selectedLocation?: LocationPin | null;
  onLocationSelect?: (location: LocationPin | null) => void;
}

// Set the Mapbox access token at runtime
const resolvedMapboxToken = getMapboxToken(
  import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
);

if (!resolvedMapboxToken) {
  console.warn("Mapbox token is not configured; map rendering will fail.");
}

mapboxgl.accessToken = resolvedMapboxToken || "";

export default function MapboxNative({ onLocationSelect }: MapComponentProps) {
  const theme = useMantineTheme();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [modalLocation, setModalLocation] = useState<LocationPin | null>(null);
  const [pins, setPins] = useState<LocationPin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredPin, setHoveredPin] = useState<LocationPin | null>(null);
  const [showAnimation, setShowAnimation] = useState(true);

  // Load pins from data service
  useEffect(() => {
    const loadPins = async () => {
      try {
        const loadedPins = await PinDataService.getAllPins();
        setPins(loadedPins);
      } catch (error) {
        console.error("Failed to load pins:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPins();

    // Subscribe to pin changes for real-time updates
    const unsubscribe = PinDataService.subscribe((updatedPins) => {
      console.log(
        "MapboxNative: Received pin update, new count:",
        updatedPins.length
      );
      setPins(updatedPins);
    });

    return unsubscribe;
  }, []);

  const handleLocationClick = useCallback(
    (location: LocationPin) => {
      setHoveredPin(null); // Clear tooltip when clicking
      setModalLocation(location);
      onLocationSelect?.(location);
    },
    [onLocationSelect]
  );

  const getPinColor = useCallback(
    (category: string) => {
      switch (category) {
        case "home":
          return theme.colors.sage[5]; // Sage green for home
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

  useEffect(() => {
    if (map.current) return; // Initialize map only once

    if (!mapContainer.current) return;

    // Initialize the map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12", // Satellite imagery WITH built-in labels
      center: [-106.3468, 40.7772], // Center of North America (roughly Montana/Saskatchewan border)
      zoom: 3.9, // Zoom level to show most of North America
      projection: "mercator", // Good for regional maps
    });

    // Add navigation control
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Wait for map to load before adding markers
    map.current.on("load", () => {
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

      // Add natural feature labels (mountains, peaks, valleys, etc.)
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

      // Add water body labels (lakes, rivers, oceans)
      map.current!.addLayer({
        id: "water-labels",
        type: "symbol",
        source: "composite",
        "source-layer": "natural_label",
        filter: [
          "in",
          ["get", "class"],
          ["literal", ["water", "bay", "ocean"]],
        ],
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Italic", "Arial Unicode MS Regular"],
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4,
            8,
            8,
            11,
            12,
            14,
          ],
        },
        paint: {
          "text-color": "#66ccff",
          "text-halo-color": "#001a33",
          "text-halo-width": 1.5,
        },
      });

      // Add POI labels (parks, national parks, points of interest)
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

      // Add markers for each location
      pins.forEach((location: LocationPin) => {
        // Create container for marker (this stays at exact coordinates)
        const markerContainer = document.createElement("div");
        markerContainer.style.width = location.featured ? "24px" : "18px";
        markerContainer.style.height = location.featured ? "24px" : "18px";
        markerContainer.style.display = "flex";
        markerContainer.style.alignItems = "center";
        markerContainer.style.justifyContent = "center";
        markerContainer.style.cursor = "pointer";

        // Create inner element for visual styling (this can change size)
        const markerElement = document.createElement("div");
        markerElement.style.width = "100%";
        markerElement.style.height = "100%";
        markerElement.style.backgroundColor = getPinColor(location.category);
        markerElement.style.borderRadius = "50%";
        markerElement.style.border = "2px solid white";
        markerElement.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
        markerElement.style.transition = "all 0.2s ease";
        markerElement.style.display = "flex";
        markerElement.style.alignItems = "center";
        markerElement.style.justifyContent = "center";

        // Add home icon for home category
        if (location.category === "home") {
          const homeIcon = document.createElement("span");
          homeIcon.innerHTML = "🏠";
          homeIcon.style.fontSize = location.featured ? "14px" : "12px";
          homeIcon.style.filter = "drop-shadow(0 1px 2px rgba(0,0,0,0.5))";
          markerElement.appendChild(homeIcon);
        }
        // Add star for featured locations (non-home)
        else if (location.featured) {
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

        // Add hover effects - only affect inner element, not container position
        markerContainer.addEventListener("mouseenter", () => {
          markerElement.style.transform = "scale(1.2)";
          markerElement.style.boxShadow = "0 4px 12px rgba(0,0,0,0.5)";
          markerElement.style.zIndex = "1000";
          setHoveredPin(location);
        });

        markerContainer.addEventListener("mouseleave", () => {
          markerElement.style.transform = "scale(1)";
          markerElement.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
          markerElement.style.zIndex = "auto";
          setHoveredPin(null);
        });

        // Add click handler
        markerContainer.addEventListener("click", () => {
          handleLocationClick(location);
        });

        // Create and add marker to map with proper anchor (using container, not inner element)
        const marker = new mapboxgl.Marker({
          element: markerContainer,
          anchor: "center", // Ensure pin is centered on coordinates
        })
          .setLngLat([
            location.coordinates.longitude,
            location.coordinates.latitude,
          ])
          .addTo(map.current!);

        console.log(
          `MapboxNative: Added pin "${location.title}" at [${location.coordinates.longitude}, ${location.coordinates.latitude}]`
        );

        markers.current.push(marker);
      });
    });

    // Clean up on unmount
    return () => {
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [handleLocationClick, getPinColor, pins]);

  return (
    <Box style={{ height: "100vh", backgroundColor: theme.colors.brown[9] }}>
      {/* 3D Loading Animation */}
      {showAnimation && (
        <MapLoadingAnimation onComplete={() => setShowAnimation(false)} />
      )}

      {/* Map Container - Full Screen */}
      <Box
        style={{
          height: "100vh",
          position: "relative",
        }}
      >
        {isLoading ? (
          <Box
            style={{
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: theme.colors.brown[9],
            }}
          />
        ) : (
          <div
            ref={mapContainer}
            style={{
              width: "100%",
              height: "100%",
            }}
          />
        )}

        {/* Floating Legend - Bottom Left */}
        <Paper
          p="md"
          radius="md"
          style={{
            position: "absolute",
            bottom: 80,
            left: 16,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(10px)",
            border: `1px solid ${theme.colors.sage[6]}`,
            zIndex: 1000,
          }}
        >
          <Text
            size="xs"
            c={theme.colors.sage[0]}
            fw={700}
            mb="xs"
            style={{ letterSpacing: "0.5px" }}
          >
            LOCATION TYPES
          </Text>
          <Group
            gap="md"
            style={{ flexDirection: "column", alignItems: "flex-start" }}
          >
            <Group gap="xs">
              <Box
                style={{
                  width: 14,
                  height: 14,
                  backgroundColor: theme.colors.brown[6],
                  borderRadius: "50%",
                  border: "2px solid white",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                }}
              />
              <Text size="xs" c={theme.colors.sage[2]} fw={500}>
                Desert
              </Text>
            </Group>
            <Group gap="xs">
              <Box
                style={{
                  width: 14,
                  height: 14,
                  backgroundColor: theme.colors.darkGreen[6],
                  borderRadius: "50%",
                  border: "2px solid white",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                }}
              />
              <Text size="xs" c={theme.colors.sage[2]} fw={500}>
                Mountains
              </Text>
            </Group>
            <Group gap="xs">
              <Box
                style={{
                  width: 14,
                  height: 14,
                  backgroundColor: "#4682B4",
                  borderRadius: "50%",
                  border: "2px solid white",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                }}
              />
              <Text size="xs" c={theme.colors.sage[2]} fw={500}>
                Coastal
              </Text>
            </Group>
            <Group gap="xs">
              <Box
                style={{
                  width: 14,
                  height: 14,
                  backgroundColor: theme.colors.sage[6],
                  borderRadius: "50%",
                  border: "2px solid white",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                }}
              />
              <Text size="xs" c={theme.colors.sage[2]} fw={500}>
                Forest
              </Text>
            </Group>
          </Group>
        </Paper>

        {/* Hover Tooltip */}
        {hoveredPin && !isMobile && (
          <Paper
            p="xs"
            radius="md"
            style={{
              position: "absolute",
              top: 16,
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "rgba(0, 0, 0, 0.9)",
              backdropFilter: "blur(10px)",
              border: `2px solid ${theme.colors.sage[5]}`,
              zIndex: 1001,
              maxWidth: "300px",
              pointerEvents: "none",
            }}
          >
            <Text size="sm" c={theme.colors.white[0]} fw={600} ta="center">
              {hoveredPin.title}
            </Text>
          </Paper>
        )}

        {/* Stats Overlay */}
        <Paper
          p="md"
          radius="md"
          style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(10px)",
            border: `1px solid ${theme.colors.sage[6]}`,
            zIndex: 1000,
          }}
        >
          <Group gap="xl">
            <Group gap="xs">
              <IconMapPin size={16} color={theme.colors.sage[4]} />
              <Text size="sm" c={theme.colors.white[0]} fw={600}>
                {pins.length}
              </Text>
              <Text size="xs" c={theme.colors.sage[2]}>
                Locations
              </Text>
            </Group>
            <Group gap="xs">
              <IconCamera size={16} color={theme.colors.sage[4]} />
              <Text size="sm" c={theme.colors.white[0]} fw={600}>
                {pins.reduce((total, pin) => {
                  if (pin.trips) {
                    return (
                      total +
                      pin.trips.reduce(
                        (tripTotal, trip) => tripTotal + trip.photos.length,
                        0
                      )
                    );
                  }
                  return total + (pin.photos?.length || 0);
                }, 0)}
              </Text>
              <Text size="xs" c={theme.colors.sage[2]}>
                Photos
              </Text>
            </Group>
          </Group>
        </Paper>

        {/* Location Detail Viewer */}
        <LocationViewer
          location={modalLocation}
          opened={!!modalLocation}
          onClose={() => setModalLocation(null)}
        />
      </Box>
    </Box>
  );
}
