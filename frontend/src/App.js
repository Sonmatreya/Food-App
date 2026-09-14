import React, { useEffect, useState } from "react";
import "./App.css";

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

// =========================================================
// COMPONENTS
// =========================================================

import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import ProtectedRoute from "./Components/ProtectedRoute";
import AdminRoute from "./Components/AdminRoute";
import AppLoader from "./Components/AppLoader";

// =========================================================
// PAGES
// =========================================================

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

// =========================================================
// ADMIN PAGES
// =========================================================

import AdminCustomers from "./Pages/AdminCustomers";
import AdminCustomerDetails from "./Pages/AdminCustomerDetails";

// =========================================================
// CONTEXT
// =========================================================

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

// =========================================================
// APP
// =========================================================

function App() {
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    // Keep the premium moving-food intro visible long enough
    // to complete its entrance and smooth exit transition.
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 3600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showLoader && <AppLoader />}

      <AuthProvider>
        <CartProvider>
          <div className="App">
            <BrowserRouter>
              <Navbar />

              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/food/:id" element={<FoodDetails />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
                <Route path="/contact" element={<Contact />} />

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/customers/:id"
                  element={
                    <AdminRoute>
                      <AdminCustomerDetails />
                    </AdminRoute>
                  }
                />

                <Route
                  path="/admin/customers"
                  element={
                    <AdminRoute>
                      <AdminCustomers />
                    </AdminRoute>
                  }
                />

                <Route
                  path="/cart"
                  element={
                    <ProtectedRoute>
                      <Cart />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/delivery-address"
                  element={
                    <ProtectedRoute>
                      <DeliveryAddress />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/payment"
                  element={
                    <ProtectedRoute>
                      <Payment />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/order-success/:orderId"
                  element={
                    <ProtectedRoute>
                      <OrderSuccess />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<Home />} />
              </Routes>

              <Footer />
            </BrowserRouter>
          </div>
        </CartProvider>
      </AuthProvider>
    </>
  );
}

export default App;
