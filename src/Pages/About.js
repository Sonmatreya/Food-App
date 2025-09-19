import React from 'react';
import Chef1 from "../assets/chef 1.jpeg";
import Chef2 from"../assets/chef 2.png";
import Chef3 from"../assets/chef 3.png";
import Pizzas1 from"../assets/Pizzas1.png"
import Pizzas2 from"../assets/Pizzas2.png"
import Pizzas3 from"../assets/Pizzas3.png"
import Pizzas4 from"../assets/Pizzas4.jpg"
import '../Styles/About.css';


function About() {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-background">
          <h1>About Pedro's Pizzeria</h1>
          <p>Serving love & freshness since 2010</p>
        </div>
      </div>

      {/* Mission */}
      <div className="mission-section">
        <h2>Our Mission</h2>
        <p>
          To serve the freshest, most delicious pizza while making every customer feel like family. We believe in quality ingredients, traditional recipes, and modern vibes.
        </p>
      </div>

      {/* Story */}
      <div className="story-section">
        <h2>Our Story</h2>
        <p>
          Founded in a small kitchen in Kolkata, Pedro's Pizzeria started with a simple vision – to bring authentic taste to every plate. Over the years, our passion for pizza has turned into a beloved community space.
        </p>
      </div>

      {/* Team Section */}
      <div className="team-section">
        <h2>Meet Our Team</h2>
        <div className="team-grid">
          <div className="team-member">
            <img src={Chef1}alt="Chef Pedro" />
            <h3>Chef Pedro</h3>
            <p>Founder & Pizza Artist</p>
          </div>
          <div className="team-member">
            <img src={Chef2} alt="Chef Anjali" />
            <h3>Chef Anjali</h3>
            <p>Head of Kitchen</p>
          </div>
          <div className="team-member">
            <img src={Chef3} alt="Chef Arjun" />
            <h3>Chef Arjun</h3>
            <p>Sous Chef</p>
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="why-choose-section">
        <h2>Why Choose Us</h2>
        <ul>
          <li>🍕 Fresh ingredients sourced locally</li>
          <li>🔥 Stone-baked pizzas with love</li>
          <li>👨‍🍳 Experienced and passionate chefs</li>
          <li>🏆 Award-winning recipes</li>
        </ul>
      </div>

      {/* Gallery */}
      <div className="gallery-section">
        <h2>Gallery</h2>
        <div className="gallery-grid">
          <img src={Pizzas1} alt="Pizza 1" />
          <img src={Pizzas2} alt="Pizza 2" />
          <img src={Pizzas3} alt="Pizza 3" />
          <img src={Pizzas4} alt="Pizza 4" />
        </div>
      </div>

      {/* Testimonials */}
      <div className="testimonials-section">
        <h2>What Our Customers Say</h2>
        <blockquote>
          "The best pizza I've ever had! Highly recommend Pedro's Pizzeria!" – Rahul D.
        </blockquote>
        <blockquote>
          "A slice of heaven every single time. Keep it up!" – Sneha K.
        </blockquote>
        <blockquote>
          "Fantastic service and flavor! Never disappoints." – Arnav M.
        </blockquote>
      </div>

      {/* Opening Hours */}
      <div className="hours-section">
        <h2>Opening Hours</h2>
        <p>Mon–Fri: 09:00 AM – 09:00 PM</p>
        <p>Sat–Sun: 12:00 AM – 11:00 PM</p>
        <p>(Except on third and fourth Saturdays, Sundays, and all public holidays )</p>
      </div>

      {/* Location Map */}
      <div className="location-section">
        <h2>Visit Us</h2>
        <iframe
          title="Google Map"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3683.221151331337!2d88.36389531496022!3d22.572646185172197!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a0277b0186e6fd5%3A0x8b7cfec2639245e0!2sKolkata%2C%20West%20Bengal!5e0!3m2!1sen!2sin!4v1655666689620!5m2!1sen!2sin"
          width="100%"
          height="300"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
        ></iframe>
      </div>
    </div>
  );
}

export default About;
