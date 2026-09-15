import React, { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import ProtectedRoute from "./Components/ProtectedRoute";
import AdminRoute from "./Components/AdminRoute";
import AdminLayout from "./Components/AdminLayout";
import AppLoader from "./Components/AppLoader";
import Home from "./Pages/Home";
import Menu from "./Pages/Menu";
import FoodDetails from "./Pages/FoodDetails";
import Services from "./Pages/Services";
import About from "./Pages/About";
import Contact from "./Pages/Contact";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Cart from "./Pages/Cart";
import DeliveryAddress from "./Pages/DeliveryAddress";
import Payment from "./Pages/Payment";
import OrderSuccess from "./Pages/OrderSuccess";
import Profile from "./Pages/Profile";
import AdminDashboard from "./Pages/AdminDashboard";
import AdminCustomers from "./Pages/AdminCustomers";
import AdminCustomerDetails from "./Pages/AdminCustomerDetails";
import AdminOrders from "./Pages/AdminOrders";
import AdminOrderDetails from "./Pages/AdminOrderDetails";
import AdminMenu from "./Pages/AdminMenu";
import AdminCoupons from "./Pages/AdminCoupons";
import AdminStaff from "./Pages/AdminStaff";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

function AppRoutes() {
  const location = useLocation();
  const isAdminRoute = location.pathname === "/admin" || location.pathname.startsWith("/admin/");
  return <div className="App">
    {!isAdminRoute && <Navbar />}
    <Routes>
      <Route path="/" element={<Home />} /><Route path="/menu" element={<Menu />} /><Route path="/food/:id" element={<FoodDetails />} />
      <Route path="/about" element={<About />} /><Route path="/services" element={<Services />} /><Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} /><Route path="orders" element={<AdminOrders />} /><Route path="orders/:id" element={<AdminOrderDetails />} />
        <Route path="customers" element={<AdminCustomers />} /><Route path="customers/:id" element={<AdminCustomerDetails />} /><Route path="menu" element={<AdminMenu />} /><Route path="coupons" element={<AdminCoupons />} /><Route path="staff" element={<AdminStaff />} />
      </Route>
      <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} /><Route path="/delivery-address" element={<ProtectedRoute><DeliveryAddress /></ProtectedRoute>} />
      <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} /><Route path="/order-success/:orderId" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} /><Route path="*" element={<Home />} />
    </Routes>
    {!isAdminRoute && <Footer />}
  </div>;
}
function App() { const [showLoader, setShowLoader] = useState(true); useEffect(() => { const timer = setTimeout(() => setShowLoader(false), 3600); return () => clearTimeout(timer); }, []); return <><>{showLoader && <AppLoader />}</><AuthProvider><CartProvider><BrowserRouter><AppRoutes /></BrowserRouter></CartProvider></AuthProvider></>; }
export default App;
