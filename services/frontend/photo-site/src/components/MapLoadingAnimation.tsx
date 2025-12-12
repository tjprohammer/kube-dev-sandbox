import { useEffect, useState } from "react";
import { Box, Text } from "@mantine/core";
import { useMantineTheme } from "@mantine/core";
import logo from "../assets/finalcirclelogo.png";

interface MapLoadingAnimationProps {
  onComplete: () => void;
}

export default function MapLoadingAnimation({
  onComplete,
}: MapLoadingAnimationProps) {
  const theme = useMantineTheme();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after 1.2s
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 1200);

    // Complete animation after 1.6s total
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1600);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <Box
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background:
          "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.4s ease-out",
      }}
    >
      <Box
        style={{
          textAlign: "center",
          animation: "gentleFloat 1.2s ease-out",
        }}
      >
        <img
          src={logo}
          alt="TJ ProHammer Photography"
          style={{
            width: "180px",
            height: "180px",
            filter: "drop-shadow(0 4px 20px rgba(139, 190, 178, 0.4))",
            marginBottom: "16px",
          }}
        />
        <Text
          size="lg"
          fw={600}
          c={theme.colors.sage[1]}
          style={{
            letterSpacing: "3px",
            textTransform: "uppercase",
            fontSize: "14px",
            opacity: 0.9,
          }}
        >
          Loading Map
        </Text>
      </Box>

      {/* CSS Keyframe Animation */}
      <style>{`
        @keyframes gentleFloat {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          50% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Box>
  );
}
