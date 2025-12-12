import { LocationPin } from "../types/LocationPin";

// Using your actual images as placeholders until we implement admin interface
export const locationPins: LocationPin[] = [
  {
    id: "death-valley-1",
    title: "Death Valley National Park",
    description: "The hottest, driest, and lowest place in North America",
    story:
      "My journey to Death Valley was one of extremes - temperatures soaring over 120°F, yet the landscape was breathtakingly beautiful. The vastness of the desert, the play of light and shadow across the dunes, and the incredible silence made this one of my most memorable photography adventures. I spent three days here, camping under the stars and waking before dawn to capture the ethereal light.",
    coordinates: {
      latitude: 36.5323,
      longitude: -117.0794,
    },
    photos: [
      {
        id: "dv-1",
        src: "/src/assets/REddesertCamp.jpg",
        alt: "Death Valley red desert landscape",
        title: "Desert Dawn",
        category: "desert",
      },
      {
        id: "dv-2",
        src: "/src/assets/TJRedDesert.jpg",
        alt: "Red desert formations",
        title: "Ancient Formations",
        category: "desert",
      },
      {
        id: "dv-3",
        src: "/src/assets/TheRoyalDunes.jpg",
        alt: "Sand dunes landscape",
        title: "Royal Dunes",
        category: "desert",
      },
    ],
    visitDate: "2023-07-15",
    tags: ["desert", "landscape", "extreme", "camping"],
    featured: true,
    category: "desert",
  },
  {
    id: "eagle-cap-wilderness",
    title: "Eagle Cap Wilderness, Oregon",
    description: "Dark sky sanctuary perfect for astrophotography",
    story:
      "The Eagle Cap Wilderness offered some of the darkest skies I've ever photographed under. Away from all light pollution, the Milky Way stretched across the heavens like a cosmic river. I hiked 12 miles into the backcountry, carrying all my camera gear, to reach this perfect vantage point.",
    coordinates: {
      latitude: 45.25,
      longitude: -117.29,
    },
    photos: [
      {
        id: "ec-1",
        src: "/src/assets/GalacticSpace.jpg",
        alt: "Night sky with galactic space view",
        title: "Cosmic River",
        category: "mountains",
      },
      {
        id: "ec-2",
        src: "/src/assets/CreationOfTheUniverse.avif",
        alt: "Dramatic sky creation scene",
        title: "Creation of the Universe",
        category: "mountains",
      },
    ],
    visitDate: "2023-08-22",
    tags: ["astrophotography", "wilderness", "milkyway", "backcountry"],
    featured: true,
    category: "mountains",
  },
  {
    id: "cape-lookout",
    title: "Cape Lookout, Oregon",
    description: "Dramatic coastal headland on the Oregon Coast",
    story:
      "Cape Lookout provided the perfect combination of dramatic cliffs, crashing waves, and golden hour lighting. I arrived before sunrise and stayed until well after sunset, capturing the ever-changing moods of the Pacific Ocean.",
    coordinates: {
      latitude: 45.3439,
      longitude: -123.9706,
    },
    photos: [
      {
        id: "cl-1",
        src: "/src/assets/RisingSun.avif",
        alt: "Rising sun over coastal landscape",
        title: "Pacific Dawn",
        category: "coastal",
      },
      {
        id: "cl-2",
        src: "/src/assets/MtJeffPort.jpg",
        alt: "Mountain Jefferson coastal view",
        title: "Coastal Mountains",
        category: "coastal",
      },
    ],
    visitDate: "2023-09-10",
    tags: ["coastal", "sunrise", "pacific", "cliffs"],
    featured: false,
    category: "coastal",
  },
  {
    id: "mount-rainier",
    title: "Mount Rainier National Park, Washington",
    description: "Iconic volcanic peak and wildflower meadows",
    coordinates: {
      latitude: 46.8523,
      longitude: -121.7603,
    },
    featured: true,
    category: "mountains",
    trips: [
      {
        id: "trip-1",
        title: "Summer Wildflowers",
        story:
          "Mount Rainier stands as a testament to the raw power of nature. The alpine meadows burst with wildflowers in summer, creating a stunning foreground for the massive glaciated peak. I spent a week here capturing the mountain from every angle, hiking through Paradise and Sunrise areas when the wildflower bloom was at its peak.",
        visitDate: "2023-07-28",
        photos: [
          {
            id: "mr-1-s",
            src: "/src/assets/topoRainier.png",
            alt: "Mount Rainier topographic view in summer",
            title: "Summer Paradise",
            category: "mountains",
          },
          {
            id: "mr-2-s",
            src: "/src/assets/MtSpine.avif",
            alt: "Wildflower meadows with mountain backdrop",
            title: "Wildflower Ridge",
            category: "mountains",
          },
        ],
        tags: ["wildflowers", "summer", "paradise", "alpine"],
      },
      {
        id: "trip-2",
        title: "Autumn Colors",
        story:
          "Returning to Rainier in autumn revealed a completely different character. The alpine larches turned brilliant gold, creating stunning contrasts against the snow-covered peak. The crisp air and clear skies provided exceptional visibility, allowing me to capture the mountain's full majesty from distant vantage points.",
        visitDate: "2023-10-12",
        photos: [
          {
            id: "mr-1-f",
            src: "/src/assets/RisingSun.avif",
            alt: "Autumn sunrise over Mount Rainier",
            title: "Autumn Dawn",
            category: "mountains",
          },
          {
            id: "mr-2-f",
            src: "/src/assets/GalacticSpace.jpg",
            alt: "Clear autumn night sky over Rainier",
            title: "Autumn Stars",
            category: "mountains",
          },
        ],
        tags: ["autumn", "larches", "gold", "clear-skies"],
      },
      {
        id: "trip-3",
        title: "Winter Solitude",
        story:
          "Winter transformed Mount Rainier into a monochrome masterpiece. The snow-laden forests and icy waterfalls created an otherworldly landscape. With fewer visitors, I found solitude among the ancient giants, capturing the mountain's serene winter beauty in the soft light of short December days.",
        visitDate: "2023-12-21",
        photos: [
          {
            id: "mr-1-w",
            src: "/src/assets/CreationOfTheUniverse.avif",
            alt: "Winter storm clouds over snow-covered Rainier",
            title: "Winter Storm",
            category: "mountains",
          },
          {
            id: "mr-2-w",
            src: "/src/assets/MtJeffPort.jpg",
            alt: "Snow-covered forest with mountain view",
            title: "Winter Forest",
            category: "mountains",
          },
        ],
        tags: ["winter", "snow", "solitude", "storms"],
      },
    ],
  },
  {
    id: "valley-of-gods",
    title: "Valley of the Gods, Utah",
    description: "Iconic red rock formations and desert landscapes",
    story:
      "The Valley of the Gods is a photographer's dream - towering sandstone buttes rise from the desert floor like ancient monuments. The interplay of light and shadow throughout the day creates an ever-changing canvas of red rock beauty.",
    coordinates: {
      latitude: 37.2431,
      longitude: -109.8776,
    },
    photos: [
      {
        id: "vg-1",
        src: "/src/assets/ValleyOfTheGods.jpg",
        alt: "Valley of the Gods red rock landscape",
        title: "Valley of the Gods",
        category: "desert",
      },
      {
        id: "vg-2",
        src: "/src/assets/Abrasion.avif",
        alt: "Rock abrasion patterns",
        title: "Desert Abrasion",
        category: "desert",
      },
    ],
    visitDate: "2023-10-15",
    tags: ["desert", "redrock", "utah", "formations"],
    featured: true,
    category: "desert",
  },
  {
    id: "cotton-candy-skies",
    title: "Great Plains, Nebraska",
    description: "Endless skies and dramatic weather patterns",
    story:
      "The Great Plains offer some of the most spectacular sky photography opportunities. With nothing to obstruct the view for hundreds of miles, storm systems create incredible displays of light and color. This particular evening produced cotton candy clouds that stretched from horizon to horizon.",
    coordinates: {
      latitude: 41.4925,
      longitude: -99.9018,
    },
    photos: [
      {
        id: "cc-1",
        src: "/src/assets/CottonCandy.avif",
        alt: "Cotton candy colored clouds",
        title: "Cotton Candy Skies",
        category: "other",
      },
      {
        id: "cc-2",
        src: "/src/assets/Skittles.avif",
        alt: "Colorful sky like skittles",
        title: "Skittles Sky",
        category: "other",
      },
    ],
    visitDate: "2023-06-20",
    tags: ["plains", "sky", "weather", "storms"],
    featured: false,
    category: "other",
  },
];
