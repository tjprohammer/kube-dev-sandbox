import {
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from "react-router-dom";
import "./App.css";
import "@mantine/core/styles.css";
import MapLandingPage from "./pages/MapLandingPage";
import LandingPage from "./pages/LandingPage";
import Gallery from "./pages/Gallery";
import { MantineProvider } from "@mantine/core";
import { theme } from "./theme";
import AppBar from "./components/appbar/AppBar";
import Footer from "./components/Footer";
import Contact from "./pages/Contact";
import About from "./pages/About";
import AdminApp from "./admin/pages/AdminApp";
import { Notifications } from "@mantine/notifications";
import "@mantine/notifications/styles.css";

// Load your Stripe public key
// const stripePromise = loadStripe("pk_live_51JMxsxFK0upQJWYv8MWebMxCJdFiP3rQOyVEk3LoYxBpMvzyctjH6mUg1F0qFEp3sfCaszZwiYmofwJl1lXT5aV3007yYorYHs");

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isMapRoute = location.pathname === "/";

  return (
    <>
      {!isAdminRoute && !isMapRoute && <AppBar />}
      <Routes>
        <Route path="/" element={<MapLandingPage />} />
        <Route path="/photos" element={<LandingPage />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/admin" element={<AdminApp />} />
      </Routes>
      {!isAdminRoute && !isMapRoute && <Footer />}
    </>
  );
}

function App() {
  return (
    <MantineProvider theme={theme}>
      <Notifications />
      <Router>
        <AppContent />
      </Router>
    </MantineProvider>
  );
}

export default App;
