import { RouterProvider, createBrowserRouter, createRoutesFromElements, Navigate, Route } from "react-router-dom";
import { AuthProvider } from "./lib/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicLayout } from "./components/layout/PublicLayout";
import { AppLayout } from "./components/layout/AppLayout";
import { HomePage } from "./pages/public/HomePage";
import { TeamPage } from "./pages/public/TeamPage";
import { ContactPage } from "./pages/public/ContactPage";
import { BlogPage } from "./pages/public/BlogPage";
import { BlogPostPage } from "./pages/public/BlogPostPage";
import { EventsPage } from "./pages/app/EventsPage";
import { EventDetailPage } from "./pages/app/EventDetailPage";
import { DronesPage } from "./pages/app/DronesPage";
import { PilotsPage } from "./pages/app/PilotsPage";
import { HuntingGroundsPage } from "./pages/app/HuntingGroundsPage";
import { EquipmentPage } from "./pages/app/EquipmentPage";
import { BlogAdminPage } from "./pages/app/BlogAdminPage";
import { BlogPostEditPage } from "./pages/app/BlogPostEditPage";
import { FieldMapPage } from "./pages/app/FieldMapPage";
import { EventPrintPage } from "./pages/app/EventPrintPage";

// Datový router (ne jen <BrowserRouter>/<Routes>) — potřebuje ho useBlocker
// v EventForm, který zachytí i SPA navigaci (klik na "Piloti"/"Drony" v menu
// apod.), když je rozpracovaná neuložená akce. Prosté <Routes> tohle neumí
// zachytit vůbec (beforeunload hlídá jen skutečné opuštění stránky).
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="tym" element={<TeamPage />} />
        <Route path="blog" element={<BlogPage />} />
        <Route path="blog/:slug" element={<BlogPostPage />} />
        <Route path="kontakt" element={<ContactPage />} />
      </Route>

      <Route
        path="app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="akce" replace />} />
        <Route path="akce" element={<EventsPage />} />
        <Route path="akce/:id" element={<EventDetailPage />} />
        <Route path="piloti" element={<PilotsPage />} />
        <Route path="drony" element={<DronesPage />} />
        <Route path="vybaveni" element={<EquipmentPage />} />
        <Route path="honitby" element={<HuntingGroundsPage />} />
        <Route path="blog" element={<BlogAdminPage />} />
        <Route path="blog/:id" element={<BlogPostEditPage />} />
      </Route>

      <Route
        path="mapa"
        element={
          <ProtectedRoute>
            <FieldMapPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="app/akce/:id/tisk"
        element={
          <ProtectedRoute>
            <EventPrintPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </>,
  ),
);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
