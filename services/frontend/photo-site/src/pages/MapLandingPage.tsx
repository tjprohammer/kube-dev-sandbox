import { useState } from "react";
import { LocationPin } from "../types/LocationPin";
import MapboxNative from "../components/MapboxNative";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

const MapLandingPage = () => {
  const [selectedLocation, setSelectedLocation] = useState<LocationPin | null>(
    null
  );

  useEffect(() => {
    // Animate the landing page entrance
    gsap.fromTo(
      ".map-container",
      { opacity: 0, y: 50 },
      {
        duration: 1.2,
        opacity: 1,
        y: 0,
        ease: "power2.out",
      }
    );
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <div className="map-container" style={{ width: "100%", height: "100%" }}>
        <MapboxNative
          selectedLocation={selectedLocation}
          onLocationSelect={setSelectedLocation}
        />
      </div>
    </div>
  );
};

export default MapLandingPage;
