import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CreatorProfile from "./pages/CreatorProfile";
import ListingDetail from "./pages/ListingDetail";
import Create from "./pages/Create";
import Dashboard from "./pages/Dashboard";
import CreatorSetup from "./pages/CreatorSetup";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<Create />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/creators/setup" element={<CreatorSetup />} />
        <Route path="/:handle/:slug" element={<ListingDetail />} />
        <Route path="/:handle" element={<CreatorProfile />} />
      </Routes>
    </BrowserRouter>
  );
}
