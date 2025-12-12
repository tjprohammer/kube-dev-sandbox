import { useState, useEffect } from "react";
import AdminDashboard from "./AdminDashboard";
import LocationForm from "../components/LocationForm";
import AdminAuth from "../components/AdminAuth";
import { LocationPin } from "../../types/LocationPin";
import { PinDataService } from "../../services/pinDataService";
import { CognitoAuthService } from "../../services/awsService";
import { TempAuthService } from "../../services/tempAuthService";
import { notifications } from "@mantine/notifications";

const AdminApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPin, setEditingPin] = useState<LocationPin | null>(null);
  const [newPinCoordinates, setNewPinCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [pins, setPins] = useState<LocationPin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Try both auth services
      const isCognitoAuth = CognitoAuthService.isAuthenticated();
      const isTempAuth = TempAuthService.isAuthenticated();

      console.log("=== AUTH STATUS CHECK ===");
      console.log("Cognito authenticated:", isCognitoAuth);
      console.log("Temp authenticated:", isTempAuth);

      // If authenticated via Cognito, ensure AWS credentials are loaded
      if (isCognitoAuth) {
        const tokens = CognitoAuthService.getStoredTokens();
        console.log("Stored tokens:", tokens);

        if (tokens?.idToken && tokens.idToken !== "temp-id-token") {
          console.log("Restoring AWS credentials from stored tokens...");
          const result = await CognitoAuthService.getAwsCredentials(
            tokens.idToken
          );
          if (!result.success) {
            console.error("Failed to restore AWS credentials:", result.error);
            notifications.show({
              title: "Warning",
              message: "S3 upload may not work. Try logging out and back in.",
              color: "yellow",
            });
          }
        } else {
          console.warn("Using temp auth - S3 uploads will not work");
          notifications.show({
            title: "Using Temporary Auth",
            message:
              "S3 uploads disabled. Please log out and use real Cognito credentials.",
            color: "yellow",
            autoClose: false,
          });
        }
      }

      setIsAuthenticated(isCognitoAuth || isTempAuth);
    };

    checkAuth();
  }, []);

  // Load initial pins on mount
  useEffect(() => {
    const loadPins = async () => {
      try {
        setIsLoading(true);
        const loadedPins = await PinDataService.getAllPins();
        setPins(loadedPins);
      } catch (error) {
        console.error("Failed to load pins:", error);
        notifications.show({
          title: "Error",
          message: "Failed to load location pins",
          color: "red",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPins();

    // Subscribe to pin changes for real-time updates
    const unsubscribe = PinDataService.subscribe((updatedPins) => {
      console.log(
        "AdminApp: Received pin update, new count:",
        updatedPins.length
      );
      setPins(updatedPins);
    });

    return unsubscribe;
  }, []);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      // Try logout from both services
      await CognitoAuthService.signOut();
      await TempAuthService.signOut();
      setIsAuthenticated(false);
      notifications.show({
        title: "Logged Out",
        message: "You have been successfully logged out",
        color: "blue",
      });
    } catch (error) {
      console.error("Logout error:", error);
      notifications.show({
        title: "Logout Error",
        message: "There was an error logging out",
        color: "red",
      });
    }
  };
  const handleOpenForm = (pin?: LocationPin) => {
    setEditingPin(pin || null);
    setNewPinCoordinates(null);
    setIsFormOpen(true);
  };

  const handleCreatePinAtCoordinates = (coordinates?: {
    latitude: number;
    longitude: number;
  }) => {
    setEditingPin(null);
    setNewPinCoordinates(coordinates || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingPin(null);
    setNewPinCoordinates(null);
  };

  const handleSavePin = async (pin: LocationPin) => {
    try {
      if (editingPin) {
        // Update existing pin
        await PinDataService.updatePin(pin);
        setPins((prevPins) => prevPins.map((p) => (p.id === pin.id ? pin : p)));
        notifications.show({
          title: "Location Updated",
          message: `${pin.title} has been updated successfully!`,
          color: "green",
        });
      } else {
        // Create new pin - server will generate UUID
        const tempPin = { ...pin, id: PinDataService.generateId() };
        const createdPin = await PinDataService.savePin(tempPin);
        // Use the server-returned pin with its UUID
        setPins((prevPins) => [...prevPins, createdPin]);
        notifications.show({
          title: "Location Created",
          message: `${pin.title} has been created successfully!`,
          color: "green",
        });
      }

      handleCloseForm();
    } catch (error) {
      console.error("Failed to save pin:", error);
      notifications.show({
        title: "Error",
        message: "Failed to save location pin",
        color: "red",
      });
    }
  };

  const handleDeletePin = async (pinId: string) => {
    try {
      const pinToDelete = pins.find((p) => p.id === pinId);
      await PinDataService.deletePin(pinId);
      setPins((prevPins) => prevPins.filter((p) => p.id !== pinId));

      notifications.show({
        title: "Location Deleted",
        message: `${
          pinToDelete?.title || "Location"
        } has been deleted successfully!`,
        color: "red",
      });
    } catch (error) {
      console.error("Failed to delete pin:", error);
      notifications.show({
        title: "Error",
        message: "Failed to delete location pin",
        color: "red",
      });
    }
  };

  // Show authentication screen if not authenticated
  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={handleAuthenticated} />;
  }

  // Show loading state while pins are loading
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
        }}
      >
        Loading location pins...
      </div>
    );
  }

  return (
    <>
      <AdminDashboard
        pins={pins}
        onEditPin={handleOpenForm}
        onCreatePin={handleCreatePinAtCoordinates}
        onDeletePin={handleDeletePin}
        onLogout={handleLogout}
      />
      <LocationForm
        opened={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSavePin}
        editingPin={editingPin}
        initialCoordinates={newPinCoordinates || undefined}
      />
    </>
  );
};

export default AdminApp;
