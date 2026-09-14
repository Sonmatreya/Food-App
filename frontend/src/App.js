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
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* =================================================
          STARTUP BUFFER
          Short branded opening overlay
      ================================================= */}

      {showLoader && <AppLoader />}

      <AuthProvider>
        <CartProvider>

          <div className="App">

            <BrowserRouter>

              {/* =================================================
                  NAVBAR
              ================================================= */}

              <Navbar />

              <Routes>

                {/* =================================================
                    PUBLIC ROUTES
                ================================================= */}

                <Route
                  path="/"
                  element={<Home />}
                />

                <Route
                  path="/menu"
                  element={<Menu />}
                />

                <Route
                  path="/food/:id"
                  element={<FoodDetails />}
                />

                <Route
                  path="/about"
                  element={<About />}
                />

                <Route
                  path="/services"
                  element={<Services />}
                />

                <Route
                  path="/contact"
                  element={<Contact />}
                />

                {/* =================================================
                    AUTHENTICATION ROUTES
                ================================================= */}

                <Route
                  path="/login"
                  element={<Login />}
                />

                <Route
                  path="/register"
                  element={<Register />}
                />

                {/* =================================================
                    USER PROFILE
                ================================================= */}

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                {/* =================================================
                    ADMIN ROUTES
                    More specific route first
                ================================================= */}

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

                {/* =================================================
                    PROTECTED ROUTES
                ================================================= */}

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

                {/* =================================================
                    FALLBACK ROUTE
                ================================================= */}

                <Route
                  path="*"
                  element={<Home />}
                />

              </Routes>

              {/* =================================================
                  FOOTER
              ================================================= */}

              <Footer />

            </BrowserRouter>

          </div>

        </CartProvider>
      </AuthProvider>
    </>
  );
}

export default App;
