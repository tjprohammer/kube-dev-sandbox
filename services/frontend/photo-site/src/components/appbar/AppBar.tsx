import {
  // Group,
  // ActionIcon,
  useMantineTheme,
  AppShell,
  CSSProperties,
} from "@mantine/core";
import { IconHome, IconCamera, IconMail, IconUser } from "@tabler/icons-react";

import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { NavLink } from "react-router-dom";
import topoRainier from "../../assets/topoRainier.png";
import { useState } from "react";
import signature from "../../assets/signatureWhite.png";

function AppBar() {
  const theme = useMantineTheme();
  const [opened, { toggle }] = useDisclosure();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [hoverStatus, setHoverStatus] = useState<HoverStates>({
    home: false,
    about: false,
    gallery: false,
    contact: false,
  });

  const menuItemStyle = (isActive: boolean): React.CSSProperties => ({
    color: theme.colors.tan[0], // Use your theme's text color
    textDecoration: "none", // Remove underline from links if any

    fontSize: "1.2rem", // Larger font size for better readability
    backgroundColor: "transparent",
    paddingBottom: isActive ? "0.5rem" : "0", // Adjust the space between text and underline
    borderBottom: isActive ? `2px solid ${theme.colors.sage[0]}` : "none",
  });

  const getActiveStyle = (isActive: boolean): React.CSSProperties => ({
    ...menuItemStyle,
    fontWeight: isActive ? "bold" : "normal",
    color: isActive ? theme.colors.sage[0] : theme.colors.tan[0],
    textDecoration: isActive ? "underline" : "none",
    padding: "1rem 0",
    fontSize: ".9em",
    cursor: "pointer",
    transition: "color 0.3s ease-in-out",
    letterSpacing: ".15rem",
  });

  return (
    <AppShell>
      <AppShell.Header
        style={{ backgroundColor: theme.colors.gray[0], borderBottom: "none" }}
      >
        <div
          style={{
            borderBottomColor: "white",
            borderBottom: "1px solid white",
            display: "flex",
            padding: "0 40px",
            maxWidth: "1200px",
            marginLeft: "auto",
            marginRight: "auto",
            backgroundColor: theme.colors.gray[0],
          }}
        >
          {/* Left Section */}
          <img
            src={signature}
            width={125}
            height={100}
            style={{ objectFit: "contain" }}
          />

          {/* Custom Burger Menu for Mobile */}
          {isMobile ? (
            <div
              style={{
                marginLeft: "auto",
                gap: 100,
                flexShrink: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <CustomBurger opened={opened} onClick={toggle} />
            </div>
          ) : (
            // Desktop Navigation Links
            <div
              style={{
                marginLeft: "auto",
                gap: "20px",
                flexShrink: 1,
                display: "flex",
                padding: "30px 20px 0 ",
              }}
            >
              <NavLink
                to="/"
                style={({ isActive }) => ({
                  ...getActiveStyle(isActive),
                  backgroundColor: hoverStatus.home
                    ? "transparent"
                    : "transparent",
                })}
                onMouseEnter={() =>
                  setHoverStatus((prev) => ({ ...prev, home: true }))
                }
                onMouseLeave={() =>
                  setHoverStatus((prev) => ({ ...prev, home: false }))
                }
              >
                <IconHome
                  style={{ marginRight: "5px", paddingTop: "2px" }}
                  size={20}
                />
                Home
              </NavLink>

              <NavLink
                to="/about"
                style={({ isActive }) => ({
                  ...getActiveStyle(isActive),
                  backgroundColor: hoverStatus.home
                    ? "transparent"
                    : "transparent",
                })}
                onMouseEnter={() =>
                  setHoverStatus((prev) => ({ ...prev, home: true }))
                }
                onMouseLeave={() =>
                  setHoverStatus((prev) => ({ ...prev, home: false }))
                }
              >
                <IconUser
                  size={20}
                  style={{ marginRight: "5px", paddingTop: "2px" }}
                />
                About
              </NavLink>
              <NavLink
                to="/gallery"
                style={({ isActive }) => ({
                  ...getActiveStyle(isActive),
                  backgroundColor: hoverStatus.gallery
                    ? "transparent"
                    : "transparent",
                })}
                onMouseEnter={() =>
                  setHoverStatus((prev) => ({ ...prev, gallery: true }))
                }
                onMouseLeave={() =>
                  setHoverStatus((prev) => ({ ...prev, gallery: false }))
                }
              >
                <IconCamera
                  size={20}
                  style={{ marginRight: "5px", paddingTop: "2px" }}
                />
                Gallery
              </NavLink>
              <NavLink
                to="/contact"
                style={({ isActive }) => ({
                  ...getActiveStyle(isActive),
                  backgroundColor: hoverStatus.contact
                    ? "transparent"
                    : "transparent",
                })}
                onMouseEnter={() =>
                  setHoverStatus((prev) => ({ ...prev, contact: true }))
                }
                onMouseLeave={() =>
                  setHoverStatus((prev) => ({ ...prev, contact: false }))
                }
              >
                <IconMail
                  size={20}
                  style={{ marginRight: "5px", paddingTop: "2px" }}
                />
                Contact
              </NavLink>
            </div>
          )}
        </div>
      </AppShell.Header>
      <MobileMenu isOpen={opened} toggle={toggle} />
    </AppShell>
  );
}

export default AppBar;

interface CustomBurgerProps {
  opened: boolean;
  onClick: () => void;
}

// Custom burger icon component
const CustomBurger: React.FC<CustomBurgerProps> = ({ opened, onClick }) => {
  const theme = useMantineTheme();

  const containerStyle: CSSProperties = {
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-around",
    width: "30px",
    height: "30px",
    background: "transparent",
    border: "none",
    padding: "0",
    transition: "all 0.3s linear",
  };

  const lineStyle: CSSProperties = {
    borderRadius: "50px",
    width: "30px",
    height: "3px",
    background: theme.colors.tan[0],
    transition: "all 0.3s linear",
  };

  const lineTopStyle: CSSProperties = {
    ...lineStyle,
    transform: opened ? "rotate(45deg)" : "rotate(0)",
    transformOrigin: "1px",
  };

  const lineMiddleStyle: CSSProperties = {
    ...lineStyle,
    opacity: opened ? "0" : "1",
    transform: opened ? "translateX(20px)" : "translateX(0)",
  };

  const lineBottomStyle: CSSProperties = {
    ...lineStyle,
    transform: opened ? "rotate(-45deg)" : "rotate(0)",
    transformOrigin: "1px",
  };

  return (
    <div style={containerStyle} onClick={onClick}>
      <div style={lineTopStyle}></div>
      <div style={lineMiddleStyle}></div>
      <div style={lineBottomStyle}></div>
    </div>
  );
};

interface MobileMenuProps {
  isOpen: boolean;
  toggle: () => void;
}

type HoverStates = {
  home: boolean;
  about: boolean;
  gallery: boolean;
  contact: boolean;
};

// MobileMenu component
export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, toggle }) => {
  const theme = useMantineTheme();
  const [hoverStatus, setHoverStatus] = useState<HoverStates>({
    home: false,
    about: false,
    gallery: false,
    contact: false,
  });

  // Styles for the menu container
  const menuStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    right: isOpen ? 0 : "-100%",
    width: "100%",
    height: "100vh",
    boxShadow: "-5px 0 15px rgba(0,0,0,0.4)",
    transition: "right 0.3s ease-in-out",
    zIndex: 100,
    display: "flex",
    flexDirection: "column",
    padding: "1rem",
    backgroundColor: theme.colors.gray[0],
    backgroundImage: `url(${topoRainier})`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "bottom center",
    backgroundSize: "auto 50%",
  };

  // Styles for the menu items
  const getMenuItemStyle = (isHovered: boolean): React.CSSProperties => ({
    padding: "1rem 0",
    borderBottom: `1px solid ${theme.colors.sage[0] || "#ccc"}`,
    textDecoration: "none",
    fontSize: "0.9rem",
    cursor: "pointer",
    transition: "color 0.3s ease-in-out",
    color: isHovered ? theme.colors.sage[0] : theme.colors.tan[0],
    backgroundColor: isHovered ? "rgba(255, 255, 255, 0.1)" : "transparent", // Only change the background of the hovered item
    textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
    letterSpacing: "1px",
  });
  const overlayStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Adjust opacity as needed
    zIndex: 1, // Ensures it's behind the text
  };

  // Function to prevent the menu from closing when clicking inside it
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      {isOpen && (
        <div style={overlayStyle} onClick={toggle} /> // Overlay closes the menu
      )}
      <div style={menuStyle} onClick={stopPropagation}>
        {/* Burger icon to close the menu */}
        <div
          style={{ alignSelf: "flex-end", cursor: "pointer" }}
          onClick={toggle}
        >
          <CustomBurger opened={isOpen} onClick={toggle} />
        </div>
        {/* Menu items */}
        <NavLink
          to="/"
          style={getMenuItemStyle(hoverStatus.home)} // Use the specific hover status for 'home'
          onClick={toggle}
          onMouseEnter={() =>
            setHoverStatus((prev) => ({ ...prev, home: true }))
          }
          onMouseLeave={() =>
            setHoverStatus((prev) => ({ ...prev, home: false }))
          }
        >
          <IconHome
            style={{ marginRight: "5px", paddingTop: "2px" }}
            size={20}
          />
          Home
        </NavLink>
        <NavLink
          to="/about"
          style={getMenuItemStyle(hoverStatus.about)} // Use the specific hover status for 'about'
          onClick={toggle}
          onMouseEnter={() =>
            setHoverStatus((prev) => ({ ...prev, about: true }))
          }
          onMouseLeave={() =>
            setHoverStatus((prev) => ({ ...prev, about: false }))
          }
        >
          <IconUser
            style={{ marginRight: "5px", paddingTop: "2px" }}
            size={20}
          />
          About
        </NavLink>
        <NavLink
          to="/gallery"
          style={getMenuItemStyle(hoverStatus.gallery)}
          onClick={toggle}
          onMouseEnter={() =>
            setHoverStatus((prev) => ({ ...prev, gallery: true }))
          }
          onMouseLeave={() =>
            setHoverStatus((prev) => ({ ...prev, gallery: false }))
          }
        >
          <IconCamera
            size={20}
            style={{ marginRight: "5px", paddingTop: "2px" }}
          />
          Gallery
        </NavLink>
        <NavLink
          to="/contact"
          style={getMenuItemStyle(hoverStatus.contact)}
          onClick={toggle}
          onMouseEnter={() =>
            setHoverStatus((prev) => ({ ...prev, contact: true }))
          }
          onMouseLeave={() =>
            setHoverStatus((prev) => ({ ...prev, contact: false }))
          }
        >
          <IconMail
            size={20}
            style={{ marginRight: "5px", paddingTop: "2px" }}
          />
          Contact
        </NavLink>
      </div>
    </>
  );
};
