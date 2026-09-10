import "./App.css";

import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";

import Home from "./Pages/Home";
import Menu from "./Pages/Menu";
import FoodDetails from "./Pages/FoodDetails";
import Services from "./Pages/Services";
import About from "./Pages/About";
import Contact from "./Pages/Contact";

import Cart from "./Pages/Cart";
import DeliveryAddress from "./Pages/DeliveryAddress";
import Payment from "./Pages/Payment";
import OrderSuccess from "./Pages/OrderSuccess";

import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Profile from "./Pages/Profile";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";

import ProtectedRoute from "./Components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="App">

          <BrowserRouter>

            <Navbar />

            <Routes>

              {/* =========================
                  PUBLIC - LOGIN
              ========================= */}

              <Route
                path="/login"
                element={<Login />}
              />
              <Route
                path="/register"
                element={<Register />}
             />
             {/* PROTECTED - PROFILE */}
              <Route
               path="/profile"
               element={
               <ProtectedRoute>
               <Profile />
               </ProtectedRoute>
               }
             />  
              {/* =========================
                  PROTECTED - HOME
              ========================= */}

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />

              {/* =========================
                  PROTECTED - MENU
              ========================= */}

              <Route
                path="/menu"
                element={
                  <ProtectedRoute>
                    <Menu />
                  </ProtectedRoute>
                }
              />

              {/* =========================
                  PROTECTED - FOOD DETAILS
              ========================= */}

              <Route
                path="/food/:id"
                element={
                  <ProtectedRoute>
                    <FoodDetails />
                  </ProtectedRoute>
                }
              />

              {/* =========================
                  PROTECTED - CART
              ========================= */}

              <Route
                path="/cart"
                element={
                  <ProtectedRoute>
                    <Cart />
                  </ProtectedRoute>
                }
              />

              {/* =========================
                  PROTECTED - DELIVERY ADDRESS
              ========================= */}

              <Route
                path="/delivery-address"
                element={
                  <ProtectedRoute>
                    <DeliveryAddress />
                  </ProtectedRoute>
                }
              />

              {/* =========================
                  PROTECTED - PAYMENT
              ========================= */}

              <Route
                path="/payment"
                element={
                  <ProtectedRoute>
                    <Payment />
                  </ProtectedRoute>
                }
              />

              {/* =========================
                  PROTECTED - ORDER SUCCESS
              ========================= */}

              <Route
                path="/order-success"
                element={
                  <ProtectedRoute>
                    <OrderSuccess />
                  </ProtectedRoute>
                }
              />

              {/* =========================
                  PUBLIC - ABOUT
              ========================= */}

              <Route
                path="/about"
                element={<About />}
              />

              {/* =========================
                  PUBLIC - SERVICES
              ========================= */}

              <Route
                path="/services"
                element={<Services />}
              />

              {/* =========================
                  PUBLIC - CONTACT
              ========================= */}

              <Route
                path="/contact"
                element={<Contact />}
              />

            </Routes>

            <Footer />

          </BrowserRouter>

        </div>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;