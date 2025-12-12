import {
  ActionIcon,
  Center,
  Container,
  Grid,
  Image,
  Stack,
  Title,
  useMantineTheme,
} from "@mantine/core";
import profileImage from "../assets/TJRedDesert.jpg";
import camp from "../assets/REddesertCamp.jpg";
import jefferson from "../assets/MtJeffPort.jpg";
import deathvalley from "../assets/AndyMArs.jpg";
import { useRef, useState } from "react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import logo from "../assets/logo-svg.svg";

interface ImageData {
  src: string;
  alt: string;
  description: string;
}

const imageData = [
  {
    src: profileImage,
    alt: "Profile Image",
    description:
      "TJ Prohammer's photography is a symphony of America's natural wonders, a journey spanning a decade across diverse landscapes. He treads silently through whispering forests, and across sun-drenched deserts, capturing the raw beauty of each terrain. From the majestic peaks of rugged mountains to the serene rhythms of coastal shores, his lens masterfully encapsulates the spirit of these untouched realms. His portfolio is a vibrant tapestry, reflecting his deep respect for nature's splendor.",
  },
  {
    src: jefferson,
    alt: "Jefferson Image",
    description:
      "In his pursuit of the undiscovered, TJ's photography vividly brings to life the hidden treasures of nature. Each expedition is a quest for purity, capturing the essence of the wild in its most unspoiled form. His images are more than visual treats; they are stories of nature untamed and free. With a keen eye for the untouched, his work showcases a journey through nature's secret havens, each picture a tribute to the enduring allure of pristine landscapes.",
  },
  {
    src: deathvalley,
    alt: "Death Valley Image",
    description:
      "Through TJ's photographs, the pristine wilderness of America unfolds in a series of compelling narratives. Each image is a window into a world of natural wonder, untouched by time and human influence. His collection is not just a series of pictures, but an ongoing story of discovery and appreciation. Each location, from the expansive, silent deserts to hidden valleys, is portrayed as a precious, unblemished gem, inviting viewers to cherish and protect these immaculate environments.",
  },
  {
    src: camp,
    alt: "Camp Image",
    description:
      "This image encapsulates TJ's essence as an explorer and nature enthusiast. Set in a tranquil campsite, it speaks of nights under star-studded skies and days spent in the heart of the wilderness. The photograph is a serene testament to the simple, yet profound joys of outdoor life. It’s a snapshot of moments where nature's quiet beauty prevails, symbolizing the peace and fulfillment found in the embrace of the natural world. A celebration of adventure, serenity, and the endless allure of the wild.",
  },
];
const About = () => {
  const theme = useMantineTheme();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [selectedText, setSelectedText] = useState<string>(
    imageData[0].description
  );

  const onImageSelect = (image: ImageData) => {
    setSelectedImage(image.src);
    setSelectedText(image.description);
  };

  const scrollCarousel = (direction: number) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: direction * 300,
        behavior: "smooth",
      });
    }
  };

  const [selectedImage, setSelectedImage] = useState<string>(imageData[0].src);

  return (
    <div id="about"
      style={{
        paddingTop: "15rem",
        paddingBottom: "15rem",
        height: "100%",
        backgroundColor: theme.colors.gray[0],
      }}
    >
      <Container
        size="lg"
        style={{
          padding: "0 40px",
          maxWidth: "1800px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <Grid justify="center" style={{width: '100%'}}>
          <Grid.Col span={{ base: 12, lg: 4 }} style={{width: '100%'}}>
            <Stack>
              <Title
                order={1}
                style={{ fontSize: "2.5rem", color: theme.colors.sage[0] }}
              >
                TJ Prohammer
              </Title>

              <p
                style={{
                  color: theme.colors.tan[0],
                }}
              >
                {selectedText}
              </p>
            </Stack>
          </Grid.Col>
          <Grid.Col
            span={{ base: 12, xs: 12, sm: 6, md: 6, lg: 4 }}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Image
              src={selectedImage}
              alt="Selected"
              radius="md"
              style={{ maxWidth: "600px" }}
            />
          </Grid.Col>
        </Grid>
        <Container>
          <Center style={{ position: "relative", marginTop: theme.spacing.md }}>
            <ActionIcon
              onClick={() => scrollCarousel(-1)}
              style={{ position: "absolute", left: 0, zIndex: 1 }}
            >
              <IconChevronLeft size={24} />
            </ActionIcon>

            <div
              ref={carouselRef}
              className="carousel-container"
              style={{
                overflowX: "auto",
                scrollbarWidth: "none", // For Firefox
                msOverflowStyle: "none", // For Internet Explorer 10+
                whiteSpace: "nowrap",
              }}
            >
              {imageData.map((image, index) => (
                <Image
                  key={index}
                  src={image.src}
                  alt={image.alt}
                  radius="md"
                  style={{
                    cursor: "pointer",
                    display: "inline-block",
                    width: "150px",
                    height: "100px",
                    marginRight: theme.spacing.xs,
                  }}
                  onClick={() => onImageSelect(image)}
                />
              ))}
            </div>

            <ActionIcon
              onClick={() => scrollCarousel(1)}
              style={{ position: "absolute", right: 0, zIndex: 1 }}
            >
              <IconChevronRight size={24} />
            </ActionIcon>
          </Center>
          <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Image
            src={logo}
            alt="logo"
            style={{
              height: "100px",
              width: "100px",
            }}
          />
        </div>
        </Container>
      </Container>
    </div>
  );
};

export default About;
