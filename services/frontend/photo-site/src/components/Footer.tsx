import { Anchor, Group, useMantineTheme } from "@mantine/core";
import {
  IconBrandInstagram,
  IconBrandFacebook,
  IconBrandGithub,
} from "@tabler/icons-react";

const Footer = () => {
  const theme = useMantineTheme();
  // Style object for icons
  const iconStyle = {
    color: theme.white, // Assuming you want white icons
    width: "25px", // Icon size
    height: "25px", // Icon size
  };

  return (
    <div
      style={{
        height: "100px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: theme.colors.darkGreen[9],
      }}
    >
      <Group >
        <Anchor
          href="https://instagram.com/tjprohammer"
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconBrandInstagram style={iconStyle} />
        </Anchor>
        <Anchor
          href="https://facebook.com/tjprohammer"
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconBrandFacebook style={iconStyle} />
        </Anchor>
        <Anchor
          href="https://github.com/tjprohammer"
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconBrandGithub style={iconStyle} />
        </Anchor>
      </Group>
    </div>
  );
};

export default Footer;
