import { Card, Container, Grid, Image, useMantineTheme } from "@mantine/core";
import deserts from "../assets/Abrasion.avif";
import milkyway from "../assets/CreationOfTheUniverse.avif";
import coastal from "../assets/RisingSun.avif";
import spine from "../assets/MtSpine.avif";
import skittles from "../assets/Skittles.avif";
import cottonCandy from "../assets/CottonCandy.avif";
import logo from "../assets/logo-svg.svg";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
  const theme = useMantineTheme();
  const navigate = useNavigate();

  const handleImageClick = (category: string) => {
    navigate(`/gallery?category=${encodeURIComponent(category)}`);
  };


  const images = [
    { title: "Dry Deserts", src: deserts, alt: "Death Valley" },
    { title: "Star Gazing", src: milkyway, alt: "Eagle Cap Wilderness" },
    { title: "Coastal Shoreline", src: coastal, alt: "Cape Lookout" },
    { title: "The High Alpine", src: spine, alt: "Mt St Helens" },
    { title: "Luscious Rainforests", src: skittles, alt: "The Steen Mountains" },
    { title: "Featured Images", src: cottonCandy, alt: "Mt Washington Wilderness" },
    // Add more images as needed
  ];

  const imageRefs = useRef<HTMLImageElement[]>([]);

  // Adjust addToRefs to accept HTMLImageElement
  const addToRefs = (el: HTMLImageElement) => {
    if (el && !imageRefs.current.includes(el)) {
      imageRefs.current.push(el);
    }
  };

  const animateFromLeft = (el: HTMLImageElement, index: number) => {
    gsap.fromTo(
      el,
      { x: -200, autoAlpha: 0 },
      {
        duration: 1,
        x: 0,
        autoAlpha: 1,
        ease: "power3.out",
        // Delay based on index
        delay: index * 0.2,
        scrollTrigger: {
          trigger: el,
          start: "top bottom-=150",
          toggleActions: "play none none none",
          once: true,
        },
      }
    );
  };

  useEffect(() => {
    imageRefs.current.forEach(animateFromLeft);
  }, []);

  return (
    <div
      style={{
        paddingTop: "15rem",
        paddingBottom: "5rem",
        height: "100%",
        backgroundColor: theme.colors.gray[0],
      }}
    >
      <Container size="lg" style={{ marginBottom: "3rem" }}>
        <Grid>
          {images.map((image, index) => (
            <Grid.Col
              span={{ base: 12, xs: 12, sm: 6, md: 4, lg: 4 }}
              key={index}
            >
              <Card
                style={{
                  backgroundColor: theme.colors.gray[0],
                  marginBottom: "2rem",
                }}
              >
                <Card.Section>
                
                  <Image
                    ref={addToRefs}
                    src={image.src}
                    alt={image.alt}
                    onClick={() => handleImageClick(image.title)}
                    style={{
                      height: "300px",
                      width: "100%",
                      objectFit: "cover",
                      boxShadow: "-5px 0 15px rgba(0,0,0,0.5)",
                      cursor: 'pointer'
                    }}
                  />
                  <h3 style={{color: theme.colors.sage[0], fontWeight: 300, justifyContent: 'center', display: 'flex'}}> {image.title}</h3>
                </Card.Section>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
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
    </div>
  );
};

export default LandingPage;
