import { Theme } from "@emotion/react";
import { createTheme, rem } from "@mantine/core";

export const theme: Theme = createTheme({
  breakpoints: {
    xs: "30em",
    sm: "48em",
    md: "64em",
    lg: "74em",
    xl: "90em",
  },

  colors: {
    darkGreen: [
      "#344E41",
      "#344E41",
      "#344E41",
      "#344E41",
      "#344E41",
      "#344E41",
      "#344E41",
      "#344E41",
      "#344E41",
      "#344E41",
    ],
    //Brunswick Green
    green: [
      "#3A5A40",
      "#3A5A40",
      "#3A5A40",
      "#3A5A40",
      "#3A5A40",
      "#3A5A40",
      "#3A5A40",
      "#3A5A40",
      "#3A5A40",
      "#3A5A40",
    ],
    //Hunter Green
    lightGreen: [
      "#588157",
      "#588157",
      "#588157",
      "#588157",
      "#588157",
      "#588157",
      "#588157",
      "#588157",
      "#588157",
      "#588157",
    ],
    //Fern Green
    sage: [
      "#A3B18A",
      "#A3B18A",
      "#A3B18A",
      "#A3B18A",
      "#A3B18A",
      "#A3B18A",
      "#A3B18A",
      "#A3B18A",
      "#A3B18A",
      "#A3B18A",
    ],
    //Sage
    white: [
      "#DAD7CD",
      "#DAD7CD",
      "#DAD7CD",
      "#DAD7CD",
      "#DAD7CD",
      "#DAD7CD",
      "#DAD7CD",
      "#DAD7CD",
      "#DAD7CD",
      "#DAD7CD",
    ],
    //Timberwolf
    darkBrown: [
      "#6A582B",
      "#6A582B",
      "#6A582B",
      "#6A582B",
      "#6A582B",
      "#6A582B",
      "#6A582B",
      "#6A582B",
      "#6A582B",
      "#6A582B",
    ],
    //Field Drap Brown
    brown: [
      "#896938",
      "#896938",
      "#896938",
      "#896938",
      "#896938",
      "#896938",
      "#896938",
      "#896938",
      "#896938",
      "#896938",
    ],
    //Coyote Brown
    tan: [
      "#B38B5A",
      "#B38B5A",
      "#B38B5A",
      "#B38B5A",
      "#B38B5A",
      "#B38B5A",
      "#B38B5A",
      "#B38B5A",
      "#B38B5A",
      "#B38B5A",
    ],
    //Lion Tan
    yellow: [
      "#DFC972",
      "#DFC972",
      "#DFC972",
      "#DFC972",
      "#DFC972",
      "#DFC972",
      "#DFC972",
      "#DFC972",
      "#DFC972",
      "#DFC972",
    ],
    
    //Citron Yellow
    gray: [
      "#262626",
      "#262626",
      "#262626",
      "#262626",
      "#262626",
      "#262626",
      "#262626",
      "#262626",
      "#262626",
      "#262626",
    ],
  },
  primaryColor: "darkGreen",
  primaryShade: 1,

  shadows: {
    md: "1px 1px 3px rgba(0, 0, 0, .25)",
    xl: "5px 5px 3px rgba(0, 0, 0, .25)",
  },

  headings: {
    fontFamily: "Roboto",
    sizes: {
      h1: { fontSize: `${rem(36)}rem`, lineHeight: "1.2",  },
      h2: { fontSize: `${rem(30)}rem`, lineHeight: "1.2" },
      h3: { fontSize: `${rem(24)}rem`, lineHeight: "1.2" },
      h4: { fontSize: `${rem(20)}rem`, lineHeight: "1.2" },
      h5: { fontSize: `${rem(18)}rem`, lineHeight: "1.2" },
      h6: { fontSize: `${rem(16)}rem`, lineHeight: "1.2" },
    },
  },

});
