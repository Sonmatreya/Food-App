import React from "react";
import { FaPizzaSlice, FaTruck, FaUsers, FaLaptop } from "react-icons/fa";
import "../Styles/Service.css";

function Service() {
  return (
    <div className="service">
      <h1 className="serviceTitle">Our Pizza Services 🍕</h1>

      <div className="serviceGrid">
        <div className="serviceCard">
          <FaPizzaSlice className="serviceIcon" />
          <h2>Custom Pizzas</h2>
          <p>Craft your pizza with a wide variety of toppings and fresh ingredients.</p>
          <button className="bookBtn">Book Now</button>
        </div>

        <div className="serviceCard">
          <FaTruck className="serviceIcon" />
          <h2>Fast Delivery</h2>
          <p>Enjoy hot pizza delivered fast to your doorstep with real-time tracking.</p>
          <button className="bookBtn">Book Now</button>
        </div>

        <div className="serviceCard">
          <FaUsers className="serviceIcon" />
          <h2>Party Catering</h2>
          <p>Perfect catering for birthdays, weddings, and corporate events.</p>
          <button className="bookBtn">Book Now</button>
        </div>

        <div className="serviceCard">
          <FaLaptop className="serviceIcon" />
          <h2>Online Orders</h2>
          <p>Order your favorite pizzas anytime through our online store.</p>
          <button className="bookBtn">Book Now</button>
        </div>
      </div>
    </div>
  );
}

export default Service;
