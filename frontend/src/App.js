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

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";

function App() {
  return (
    <CartProvider>
      <div className="App">

        <BrowserRouter>

          <Navbar />

          <Routes>

            {/* Home */}
            <Route
              path="/"
              element={<Home />}
            />

            {/* Menu */}
            <Route
              path="/menu"
              element={<Menu />}
            />

            {/* Food Details */}
            <Route
              path="/food/:id"
              element={<FoodDetails />}
            />

            {/* Cart */}
            <Route
              path="/cart"
              element={<Cart />}
            />

            {/* Delivery Address */}
            <Route
              path="/delivery-address"
              element={<DeliveryAddress />}
            />

            {/* Payment */}
            <Route
              path="/payment"
              element={<Payment />}
            />

            {/* Order Success */}
            <Route
              path="/order-success"
              element={<OrderSuccess />}
            />

            {/* About */}
            <Route
              path="/about"
              element={<About />}
            />

            {/* Services */}
            <Route
              path="/services"
              element={<Services />}
            />

            {/* Contact */}
            <Route
              path="/contact"
              element={<Contact />}
            />

          </Routes>

          <Footer />

        </BrowserRouter>

      </div>
    </CartProvider>
  );
}

export default App;