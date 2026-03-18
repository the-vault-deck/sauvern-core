import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CreatorProfile from "./pages/CreatorProfile";
import ListingDetail from "./pages/ListingDetail";
import Create from "./pages/Create";
import Dashboard from "./pages/Dashboard";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<Create />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/:handle/:slug" element={<ListingDetail />} />
        <Route path="/:handle" element={<CreatorProfile />} />
      </Routes>
    </BrowserRouter>
  );
}
