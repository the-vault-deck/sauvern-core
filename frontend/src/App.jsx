import { BrowserRouter, Routes, Route } from "react-router-dom";
import Nav from "./components/Nav";
import Home from "./pages/Home";
import CreatorProfile from "./pages/CreatorProfile";
import ListingDetail from "./pages/ListingDetail";
import Create from "./pages/Create";
import Dashboard from "./pages/Dashboard";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CreatorSetup from "./pages/CreatorSetup";
import Login from "./pages/Login";

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/create" element={<Create />} />
        <Route path="/creators/setup" element={<CreatorSetup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/:handle/:slug" element={<ListingDetail />} />
        <Route path="/:handle" element={<CreatorProfile />} />
      </Routes>
    </BrowserRouter>
  );
}
