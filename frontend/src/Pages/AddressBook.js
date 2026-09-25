import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import GoogleMapPicker from "../Components/GoogleMapPicker";
import "../Styles/AddressBook.css";

const EMPTY_FORM = {
  label: "Home",
  name: "",
  phone: "",
  addressLine: "",
  city: "",
  pincode: "",
  landmark: "",
  latitude: null,
  longitude: null,
  locationText: "",
  isDefault: false,
};

function AddressBook() {
  const { API_URL } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [mapPosition, setMapPosition] = useState(DEFAULT_LOCATION);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapLocationText, setMapLocationText] = useState("Select your delivery location on the map.");

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL + "/api/addresses", { credentials: "include" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to load addresses.");
      setAddresses(data.addresses || []);
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setMessage("");
    setMapPosition(DEFAULT_LOCATION);
    setMapLocationText("Select your delivery location on the map.");
    setShowForm(true);
  };

  const openEdit = (address) => {
    setEditingId(address._id);
    setForm({
      label: address.label || "Home",
      name: address.name || "",
      phone: address.phone || "",
      addressLine: address.addressLine || "",
      city: address.city || "",
      pincode: address.pincode || "",
      landmark: address.landmark || "",
      latitude: address.latitude ?? null,
      longitude: address.longitude ?? null,
      locationText: address.locationText || "",
      isDefault: Boolean(address.isDefault),
    });
    setMessage("");
    setMapPosition(
      address.latitude !== null && address.latitude !== undefined && address.longitude !== null && address.longitude !== undefined
        ? { lat: Number(address.latitude), lng: Number(address.longitude) }
        : DEFAULT_LOCATION
    );
    setMapLocationText(address.locationText || "Saved location");
    setShowForm(true);
  };

  const fetchAddressFromCoordinates = async (latitude, longitude) => {
    setMapLocationText("Finding address...");
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
      );
      if (!response.ok) throw new Error("Unable to fetch address.");
      const data = await response.json();
      const details = data.address || {};
      const houseNumber = details.house_number || "";
      const road = details.road || details.neighbourhood || "";
      const area = details.suburb || details.village || "";
      const city = details.city || details.town || details.village || details.municipality || "";
      const postcode = details.postcode || "";
      const addressLine = [houseNumber, road, area].filter(Boolean).join(", ");
      setForm((current) => ({
        ...current,
        addressLine: addressLine || current.addressLine,
        city: city || current.city,
        pincode: postcode || current.pincode,
        latitude,
        longitude,
        locationText: data.display_name || "Location selected",
      }));
      setMapLocationText(data.display_name || "Location selected");
    } catch (error) {
      setMapLocationText("Location selected");
      setForm((current) => ({ ...current, latitude, longitude, locationText: "Location selected" }));
    }
  };

  const selectMapLocation = (newPosition) => {
    setMapPosition(newPosition);
    fetchAddressFromCoordinates(newPosition.lat, newPosition.lng);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported by your browser.");
      setMessageType("error");
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (locationData) => {
        selectMapLocation({ lat: locationData.coords.latitude, lng: locationData.coords.longitude });
        setIsGettingLocation(false);
      },
      () => {
        setIsGettingLocation(false);
        setMessage("Unable to get your current location. Please select the location on the map.");
        setMessageType("error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        editingId ? API_URL + "/api/addresses/" + editingId : API_URL + "/api/addresses",
        {
          method: editingId ? "PUT" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to save address.");

      setMessage(data.message || "Address saved successfully.");
      setMessageType("success");
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      setMapPosition(DEFAULT_LOCATION);
      setMapLocationText("Select your delivery location on the map.");
      await loadAddresses();
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this saved address?")) return;

    try {
      const response = await fetch(API_URL + "/api/addresses/" + id, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to delete address.");
      setMessage(data.message || "Address deleted.");
      setMessageType("success");
      await loadAddresses();
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    }
  };

  const makeDefault = async (id) => {
    try {
      const response = await fetch(API_URL + "/api/addresses/" + id + "/default", {
        method: "PATCH",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to update default address.");
      setMessage("Default address updated.");
      setMessageType("success");
      await loadAddresses();
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    }
  };

  return (
    <main className="address-book-page">
      <div className="address-book-header">
        <div>
          <button type="button" className="address-book-back" onClick={() => navigate("/profile")}>← Profile</button>
          <span className="address-book-eyebrow">ACCOUNT SETTINGS</span>
          <h1>Saved Addresses</h1>
          <p>Save your frequently used delivery addresses for faster checkout.</p>
        </div>
        <button type="button" className="address-book-add" onClick={openAdd}>＋ Add New Address</button>
      </div>

      {message && <div className={"address-book-message " + messageType}>{message}</div>}

      {showForm && (
        <section className="address-book-form-card">
          <div className="address-book-form-header">
            <div>
              <h2>{editingId ? "Edit Address" : "Add New Address"}</h2>
              <p>Keep your delivery details ready for your next order.</p>
            </div>
            <button type="button" onClick={() => setShowForm(false)} aria-label="Close">×</button>
          </div>

          <form onSubmit={handleSave}>
            <div className="address-book-map-section">
              <div className="address-book-map-header">
                <div>
                  <h3>Choose Location on Map</h3>
                  <p>Use the default map or switch to Satellite. Click or drag the pin to your delivery point.</p>
                </div>
                <button type="button" className="address-book-current-location" onClick={getCurrentLocation} disabled={isGettingLocation}>
                  {isGettingLocation ? "📍 Locating..." : "📍 Use Current Location"}
                </button>
              </div>
              <div className="address-book-map-wrapper">
                <GoogleMapPicker
                  position={mapPosition}
                  onLocationSelect={selectMapLocation}
                  className="addressBookGoogleMap"
                />
              </div>
              <div className="address-book-map-location">
                <span>📍</span>
                <div><strong>{mapLocationText}</strong><small>Latitude: {mapPosition.lat.toFixed(6)} · Longitude: {mapPosition.lng.toFixed(6)}</small></div>
              </div>
            </div>

            <div className="address-book-labels">
              {["Home", "Work", "Other"].map((label) => (
                <button key={label} type="button" className={form.label === label ? "selected" : ""} onClick={() => setForm((current) => ({ ...current, label }))}>
                  {label === "Home" ? "🏠" : label === "Work" ? "💼" : "📍"} {label}
                </button>
              ))}
            </div>

            <div className="address-book-grid">
              <label>Full Name<input name="name" value={form.name} onChange={handleChange} placeholder="Enter full name" required /></label>
              <label>Phone Number<input name="phone" value={form.phone} onChange={handleChange} placeholder="10-digit phone number" required /></label>
              <label className="wide">Complete Address<textarea name="addressLine" value={form.addressLine} onChange={handleChange} placeholder="House/flat, street, area" rows="3" required /></label>
              <label>City<input name="city" value={form.city} onChange={handleChange} placeholder="City" required /></label>
              <label>PIN Code<input name="pincode" value={form.pincode} onChange={handleChange} placeholder="6-digit PIN" maxLength="6" required /></label>
              <label className="wide">Landmark <span className="optional">(optional)</span><input name="landmark" value={form.landmark} onChange={handleChange} placeholder="Nearby landmark" /></label>
            </div>

            <label className="address-book-default"><input type="checkbox" name="isDefault" checked={form.isDefault} onChange={handleChange} /> Make this my default delivery address</label>

            <div className="address-book-form-actions">
              <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" disabled={saving}>{saving ? "Saving..." : editingId ? "Save Changes" : "Save Address"}</button>
            </div>
          </form>
        </section>
      )}

      {loading ? (
        <div className="address-book-state"><div className="address-book-spinner" /><p>Loading saved addresses...</p></div>
      ) : addresses.length === 0 ? (
        <div className="address-book-empty">
          <div>📍</div>
          <h2>No saved addresses yet</h2>
          <p>Add your home, work, or another frequently used delivery address.</p>
          <button type="button" onClick={openAdd}>＋ Add Your First Address</button>
        </div>
      ) : (
        <section className="address-book-list">
          {addresses.map((address) => (
            <article className="address-book-card" key={address._id}>
              <div className="address-book-card-top">
                <div className="address-book-card-label">{address.label === "Home" ? "🏠" : address.label === "Work" ? "💼" : "📍"} <strong>{address.label}</strong></div>
                {address.isDefault && <span className="address-book-default-badge">Default</span>}
              </div>
              <h3>{address.name}</h3>
              <p>{address.addressLine}</p>
              {address.landmark && <p>Landmark: {address.landmark}</p>}
              <p>{address.city} — {address.pincode}</p>
              <p>📱 {address.phone}</p>
              {address.latitude !== null && address.latitude !== undefined && address.longitude !== null && address.longitude !== undefined && (
                <p className="address-book-coordinates">📍 Map location saved</p>
              )}
              <div className="address-book-card-actions">
                <button type="button" onClick={() => openEdit(address)}>Edit</button>
                {!address.isDefault && <button type="button" onClick={() => makeDefault(address._id)}>Set Default</button>}
                <button type="button" className="danger" onClick={() => handleDelete(address._id)}>Delete</button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default AddressBook;