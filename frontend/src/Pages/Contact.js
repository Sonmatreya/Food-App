import React from "react";
import BannerImage from "../assets/pizzaleft.webp";
import "../Styles/Contact.css";

function Contact() {
  return (
    <div className="contact">
      {/* Left Banner Image */}
      <div className="leftSide" style={{ backgroundImage: `url(${BannerImage})` }}></div>

      {/* Right Contact Form */}
      <div className="rightSide">
        <h1>Contact Us</h1>
        <p>Have questions, feedback, or pizza cravings? Fill out the form below 🍕</p>

        <form id="contact-form" method="POST">
          {/* First & Last Name */}
          <div className="name-fields">
            <div className="field-group">
              <label htmlFor="firstName">First Name<span>*</span></label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Enter your first name"
                required
              />
            </div>
            <div className="field-group">
              <label htmlFor="lastName">Last Name<span>*</span></label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Enter your last name"
                required
              />
            </div>
          </div>

          {/* Email */}
          <label htmlFor="email">Email Address<span>*</span></label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            required
          />

          {/* Phone Number */}
          <label htmlFor="phone">Phone Number<span>*</span></label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="e.g. +91 98765 43210"
            required
          />

          {/* Order Number */}
          <label htmlFor="order">Order Number (if applicable)</label>
          <input
            id="order"
            name="order"
            type="text"
            placeholder="Enter your order number"
          />

          {/* Subject */}
          <label htmlFor="subject">Subject<span>*</span></label>
          <select id="subject" name="subject" required>
            <option value="">-- Select an option --</option>
            <option value="order">Order Related</option>
            <option value="feedback">Feedback</option>
            <option value="careers">Job Inquiry</option>
            <option value="custom">Custom Pizza Request</option>
            <option value="general">General Inquiry</option>
          </select>

          {/* Preferred Contact Time */}
          <label htmlFor="time">Preferred Contact Time</label>
          <select id="time" name="time">
            <option value="any">Any Time</option>
            <option value="morning">Morning (9 AM – 12 PM)</option>
            <option value="afternoon">Afternoon (12 PM – 5 PM)</option>
            <option value="evening">Evening (5 PM – 9 PM)</option>
          </select>

          {/* Message */}
          <label htmlFor="message">Your Message<span>*</span></label>
          <textarea
            id="message"
            name="message"
            rows="6"
            placeholder="Type your message here..."
            required
          ></textarea>

          {/* Newsletter */}
          <label className="checkbox-container">
          <input type="checkbox" name="subscribe" />
          Subscribe me to pizza deals & offers!
          </label>

          {/* Submit Button */}
          <button type="submit">Send Message</button>
        </form>
      </div>
    </div>
  );
}

export default Contact;
