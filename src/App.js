import "./App.css";
import Navbar from"./Components/Navbar";
import Footer from"./Components/Footer";
import Home from "./Pages/Home";
import Menu from "./Pages/Menu";
import Services from "./Pages/Services";
import About from "./Pages/About";
import Contact from "./Pages/Contact";

import{BrowserRouter,Routes,Route} from "react-router-dom";


function App(){
  return(
    <div className="App">
      <BrowserRouter>
      <Navbar />
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/about" element={<About/>}/>
      <Route path="/services" element={<Services />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact/>}/>

      </Routes>
      <Footer />
      </BrowserRouter>
    </div>
  );
}
export default App;
