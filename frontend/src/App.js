import "./App.css";

import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import Checkout from "./Pages/Checkout";
import Home from "./Pages/Home";
import Menu from "./Pages/Menu";
import FoodDetails from "./Pages/FoodDetails";
import Services from "./Pages/Services";
import About from "./Pages/About";
import Contact from "./Pages/Contact";

import Cart from "./Pages/Cart";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";

function App() {
  return (
    <CartProvider>
      <div className="App">
        <BrowserRouter>
          <Navbar />

          <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/menu" element={<Menu />} />

            <Route path="/food/:id" element={<FoodDetails />} />

            <Route path="/cart" element={<Cart />} />

            <Route path="/about" element={<About />} />

            <Route path="/services" element={<Services />} />

            <Route path="/contact" element={<Contact />} />

            <Route path="/checkout" element={<Checkout />} />
          </Routes>

          <Footer />
        </BrowserRouter>
      </div>
    </CartProvider>
  );
}

export default App;
