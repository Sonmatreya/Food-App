import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { API_URL } from "../config/api";
import BannerImage from "../assets/pizzaleft.webp";
import "../Styles/Contact.css";

const helpTopics = [
  { icon: "📦", title: "Order status", text: "Check preparation, delivery and pickup updates.", subject: "order" },
  { icon: "💳", title: "Payment & refunds", text: "Questions about a charge or payment status.", subject: "payment" },
  { icon: "🍽️", title: "Food or item issue", text: "Tell us about a missing, incorrect or damaged item.", subject: "food" },
  { icon: "💬", title: "Feedback & other help", text: "Share feedback or ask a general question.", subject: "general" },
];

function Contact() {
  const location = useLocation();
  const [subject, setSubject] = useState("order");
  const [orderNumber, setOrderNumber] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState({ type: "", text: "" });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setOrderNumber(params.get("order") || "");
    const requestedTopic = params.get("topic");
    if (["order", "payment", "food", "feedback", "general"].includes(requestedTopic)) {
      setSubject(requestedTopic);
    }
  }, [location.search]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (submitting) return;
    setSubmitting(true);
    setSubmission({ type: "", text: "" });

    const formData = new FormData(event.currentTarget);
    const payload = {
      firstName: String(formData.get("firstName") || "").trim(),
      lastName: String(formData.get("lastName") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      orderNumber: orderNumber.trim(),
      subject,
      message: message.trim(),
    };

    try {
      const response = await fetch(`${API_URL}/api/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.message || "We couldn't send your request. Please try again.");
      }

      setSubmission({
        type: "success",
        text: "Your support request was received. Save both details below to check its status and read the admin reply later.",
        requestId: data.requestId,
        trackingToken: data.trackingToken,
      });
      setMessage("");
      formElement.reset();
      setOrderNumber("");
      setSubject("order");
    } catch (error) {
      setSubmission({
        type: "error",
        text: error.message || "Unable to reach support right now. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="contact contactHelpCenter">
      <section className="contactHelpHero">
        <div className="contactHelpHeroCopy">
          <span className="contactEyebrow">FOODAPP CUSTOMER CARE</span>
          <h1>How can we help?</h1>
          <p>Need help with an order? Choose a topic below or send us the details. We’ll make it easier to explain what happened.</p>
          <div className="contactHelpTrust"><span>✓</span> Order-specific support <span>✓</span> Payment and food issues</div>
        </div>
        <div className="contactHelpHeroImage" style={{ backgroundImage: `url(${BannerImage})` }} role="img" aria-label="Freshly prepared food" />
      </section>

      <section className="contactHelpTopics" aria-labelledby="contactHelpTopicsTitle">
        <div className="contactSectionHeading">
          <span className="contactEyebrow">SUPPORT TOPICS</span>
          <h2 id="contactHelpTopicsTitle">What do you need help with?</h2>
          <p>Select the closest match to get started.</p>
        </div>
        <div className="contactHelpTopicGrid">
          {helpTopics.map((topic) => (
            <button key={topic.subject} type="button" className={subject === topic.subject ? "contactHelpTopic active" : "contactHelpTopic"} onClick={() => setSubject(topic.subject)}>
              <span className="contactHelpTopicIcon">{topic.icon}</span>
              <span className="contactHelpTopicTitle">{topic.title}</span>
              <span className="contactHelpTopicText">{topic.text}</span>
              <span className="contactHelpTopicAction">{subject === topic.subject ? "Selected ✓" : "Choose topic →"}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="contactHelpFormSection">
        <div className="contactHelpFormIntro">
          <span className="contactEyebrow">CONTACT FORM</span>
          <h2>Tell us what happened</h2>
          <p>Include your order number when your question is about a specific order. Please don’t share passwords, OTPs or card details.</p>
          <div className="contactHelpSideNote"><strong>Before you send</strong><span>Keep your order number handy so your request can be identified.</span></div>
          <Link to="/profile" className="contactHelpOrderLink">View your account and orders <span>→</span></Link>
        </div>

        <form id="contact-form" onSubmit={handleSubmit}>
          <div className="contactFormHeading"><span className="contactFormStep">01</span><div><h3>Your details</h3><p>How can we get back to you?</p></div></div>
          <div className="name-fields">
            <div className="field-group"><label htmlFor="firstName">First name <span>*</span></label><input id="firstName" name="firstName" type="text" placeholder="Your first name" autoComplete="given-name" maxLength={80} required /></div>
            <div className="field-group"><label htmlFor="lastName">Last name <span>*</span></label><input id="lastName" name="lastName" type="text" placeholder="Your last name" autoComplete="family-name" maxLength={80} required /></div>
          </div>
          <div className="contactFormTwoColumns">
            <div className="field-group"><label htmlFor="email">Email address <span>*</span></label><input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" maxLength={254} required /></div>
            <div className="field-group"><label htmlFor="phone">Phone number</label><input id="phone" name="phone" type="tel" placeholder="+91 98765 43210" autoComplete="tel" maxLength={30} /></div>
          </div>

          <div className="contactFormHeading contactFormHeadingSpaced"><span className="contactFormStep">02</span><div><h3>About your request</h3><p>A few details help describe the issue.</p></div></div>
          <div className="contactFormTwoColumns">
            <div className="field-group"><label htmlFor="order">Order number</label><input id="order" name="orderNumber" type="text" value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="e.g. your order ID" maxLength={100} /></div>
            <div className="field-group"><label htmlFor="subject">Support topic <span>*</span></label><select id="subject" name="subject" value={subject} onChange={(event) => setSubject(event.target.value)} required><option value="order">Order status or delivery</option><option value="payment">Payment or refund</option><option value="food">Food or item issue</option><option value="feedback">Feedback</option><option value="general">General question</option></select></div>
          </div>
          <div className="field-group"><label htmlFor="message">Describe your issue <span>*</span></label><textarea id="message" name="message" rows="5" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Tell us what happened and what help you need…" minLength={10} maxLength={3000} required /></div>
          {submission.text && <div className={`contactFormFeedback ${submission.type}`} role={submission.type === "error" ? "alert" : "status"}>
            <p>{submission.text}</p>
            {submission.type === "success" && submission.requestId && <div className="contactTrackingCredentials">
              <strong>Support reference number</strong><code>{submission.requestId}</code>
              <strong>Private tracking key</strong><code>{submission.trackingToken}</code>
              <p>Keep these two values somewhere safe. The tracking key is shown only now; if you lose it, a new support request will be needed.</p>
              <Link to="/support/track" className="contactTrackingLink">Track request / view admin reply →</Link>
            </div>}
          </div>}
          <button type="submit" disabled={submitting}>{submitting ? "Sending request…" : "Send support request"}</button>
          <p className="contactFormSetupNote">Never share passwords, OTPs, or full card details in a support request.</p>
        </form>
      </section>
    </main>
  );
}

export default Contact;
