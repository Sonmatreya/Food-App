import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { Link, useLocation, useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../Styles/DeliveryAddress.css";

// Fix Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Default location
const DEFAULT_LOCATION = {
  lat: 22.5726,
  lng: 88.3639,
};

// Move map when location changes
function MapController({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(
        [position.lat, position.lng],
        16,
        {
          duration: 1.2,
        }
      );
    }
  }, [position, map]);

  return null;
}

// Allow user to click anywhere on the map
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(event) {
      onLocationSelect({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });

  return null;
}

function DeliveryAddress() {
  const navigate = useNavigate();
  const location = useLocation();

  const checkoutData = location.state;

  const [position, setPosition] = useState(
    DEFAULT_LOCATION
  );

  const [isGettingLocation, setIsGettingLocation] =
    useState(false);

  const [locationError, setLocationError] =
    useState("");

  const [address, setAddress] = useState(
    checkoutData?.address || {
      name: "",
      phone: "",
      addressLine: "",
      city: "",
      pincode: "",
    }
  );

  const [locationText, setLocationText] =
    useState("Select your delivery location");

  // -----------------------------------------
  // If user directly opens /delivery-address
  // -----------------------------------------

  if (!checkoutData) {
    return (
      <div className="deliveryPageEmpty">

        <div className="deliveryEmptyIcon">
          📍
        </div>

        <h1>Delivery Address</h1>

        <p>
          Please add items to your cart before
          selecting a delivery address.
        </p>

        <Link to="/cart">
          <button>
            Go to Cart
          </button>
        </Link>

      </div>
    );
  }

  const {
    cartItems,
    subtotal,
    discount,
    deliveryFee,
    serviceFee,
    tax,
    grandTotal,
    deliveryType,
    coupon,
  } = checkoutData;

  // -----------------------------------------
  // Get current location
  // -----------------------------------------

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(
        "Geolocation is not supported by your browser."
      );
      return;
    }

    setIsGettingLocation(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (locationData) => {
        const newPosition = {
          lat: locationData.coords.latitude,
          lng: locationData.coords.longitude,
        };

        setPosition(newPosition);

        setLocationText(
          "Current location selected"
        );

        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);

        if (error.code === 1) {
          setLocationError(
            "Location permission was denied. Please allow location access in your browser."
          );
        } else if (error.code === 2) {
          setLocationError(
            "Your location could not be determined."
          );
        } else {
          setLocationError(
            "Unable to get your current location."
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // -----------------------------------------
  // Reverse geocoding
  // -----------------------------------------

  const fetchAddressFromCoordinates = async (
    latitude,
    longitude
  ) => {
    try {
      setLocationText(
        "Finding address..."
      );

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
      );

      if (!response.ok) {
        throw new Error(
          "Unable to fetch address"
        );
      }

      const data = await response.json();

      const addressDetails =
        data.address || {};

      const houseNumber =
        addressDetails.house_number || "";

      const road =
        addressDetails.road ||
        addressDetails.neighbourhood ||
        "";

      const area =
        addressDetails.suburb ||
        addressDetails.village ||
        "";

      const city =
        addressDetails.city ||
        addressDetails.town ||
        addressDetails.village ||
        addressDetails.municipality ||
        "";

      const postcode =
        addressDetails.postcode || "";

      const addressLine = [
        houseNumber,
        road,
        area,
      ]
        .filter(Boolean)
        .join(", ");

      setAddress((currentAddress) => ({
        ...currentAddress,
        addressLine:
          addressLine ||
          currentAddress.addressLine,
        city:
          city ||
          currentAddress.city,
        pincode:
          postcode ||
          currentAddress.pincode,
      }));

      setLocationText(
        data.display_name ||
          "Location selected"
      );
    } catch (error) {
      console.error(
        "Reverse geocoding error:",
        error
      );

      setLocationText(
        "Location selected"
      );
    }
  };

  // -----------------------------------------
  // Map location selected
  // -----------------------------------------

  const handleLocationSelect = (
    newPosition
  ) => {
    setPosition(newPosition);

    fetchAddressFromCoordinates(
      newPosition.lat,
      newPosition.lng
    );
  };

  // -----------------------------------------
  // Form change
  // -----------------------------------------

  const handleAddressChange = (event) => {
    const { name, value } = event.target;

    setAddress((currentAddress) => ({
      ...currentAddress,
      [name]: value,
    }));
  };

  // -----------------------------------------
  // Continue to payment
  // -----------------------------------------

  const handleContinueToPayment = () => {
    if (!address.name.trim()) {
      alert("Please enter your full name.");
      return;
    }

    const phoneDigits = address.phone.replace(/\\D/g, "");
    if (!/^\\d{10}$/.test(phoneDigits)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!address.addressLine.trim()) {
      alert("Please select or enter your delivery address.");
      return;
    }

    if (!address.city.trim()) {
      alert("Please enter your city.");
      return;
    }

    if (!/^\\d{6}$/.test(address.pincode.trim())) {
      alert("Please enter a valid 6-digit PIN code.");
      return;
    }

    navigate("/payment", {
      state: {
        cartItems,
        subtotal,
        discount,
        deliveryFee,
        serviceFee,
        tax,
        grandTotal,
        deliveryType,
        address,
        coupon,
        latitude: position.lat,
        longitude: position.lng,
        locationText,
      },
    });
  };

  return (
    <div className="deliveryPage">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="deliveryHeader">

        <div>
          <div className="checkoutSteps">

            <span className="step completed">
              ✓ Cart
            </span>

            <span className="stepLine"></span>

            <span className="step active">
              2. Address
            </span>

            <span className="stepLine"></span>

            <span className="step">
              3. Payment
            </span>

          </div>

          <h1>Delivery Address</h1>

          <p>
            Choose where you want your food delivered.
          </p>
        </div>

        <Link
          to="/cart"
          className="backToCart"
        >
          ← Back to Cart
        </Link>

      </div>

      <div className="deliveryLayout">

        {/* =====================================
            LEFT CONTENT
        ===================================== */}

        <main className="deliveryMain">

          {/* MAP CARD */}

          <section className="deliveryCard">

            <div className="deliveryCardHeader">

              <div>
                <h2>
                  Choose Delivery Location
                </h2>

                <p>
                  Move the pin or select your current
                  location.
                </p>
              </div>

              <button
                type="button"
                className="currentLocationButton"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
              >
                {isGettingLocation
                  ? "📍 Locating..."
                  : "📍 Use Current Location"}
              </button>

            </div>

            {/* MAP */}

            <div className="mapWrapper">

              <MapContainer
                center={[
                  position.lat,
                  position.lng,
                ]}
                zoom={13}
                scrollWheelZoom={true}
                className="deliveryMap"
              >

                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker
                  position={[
                    position.lat,
                    position.lng,
                  ]}
                  draggable={true}
                  eventHandlers={{
                    dragend: (event) => {
                      const marker =
                        event.target;

                      const newPosition =
                        marker.getLatLng();

                      handleLocationSelect({
                        lat:
                          newPosition.lat,
                        lng:
                          newPosition.lng,
                      });
                    },
                  }}
                >

                  <Popup>
                    <strong>
                      Delivery Location
                    </strong>
                    <br />
                    Your food will be delivered
                    here.
                  </Popup>

                </Marker>

                <MapController
                  position={position}
                />

                <MapClickHandler
                  onLocationSelect={
                    handleLocationSelect
                  }
                />

              </MapContainer>

            </div>

            {locationError && (
              <div className="locationError">
                ⚠️ {locationError}
              </div>
            )}

            <div className="selectedLocation">

              <div className="locationPin">
                📍
              </div>

              <div>

                <strong>
                  {locationText}
                </strong>

                <p>
                  Latitude:{" "}
                  {position.lat.toFixed(6)}
                  {" | "}
                  Longitude:{" "}
                  {position.lng.toFixed(6)}
                </p>

              </div>

            </div>

          </section>

          {/* ADDRESS FORM */}

          <section className="deliveryCard">

            <div className="deliveryCardHeader">

              <div>
                <h2>
                  Delivery Details
                </h2>

                <p>
                  Confirm your contact and address
                  information.
                </p>
              </div>

            </div>

            <div className="deliveryForm">

              <div className="formRow">

                <div className="formGroup">
                  <label>
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={address.name}
                    onChange={handleAddressChange}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="formGroup">
                  <label>
                    Phone Number
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    value={address.phone}
                    onChange={handleAddressChange}
                    placeholder="Enter your phone number"
                  />
                </div>

              </div>

              <div className="formGroup">

                <label>
                  Complete Address
                </label>

                <textarea
                  name="addressLine"
                  value={address.addressLine}
                  onChange={handleAddressChange}
                  placeholder="House/flat number, street, area, landmark"
                  rows="3"
                />

              </div>

              <div className="formRow">

                <div className="formGroup">

                  <label>
                    City
                  </label>

                  <input
                    type="text"
                    name="city"
                    value={address.city}
                    onChange={handleAddressChange}
                    placeholder="Enter city"
                  />

                </div>

                <div className="formGroup">

                  <label>
                    PIN Code
                  </label>

                  <input
                    type="text"
                    name="pincode"
                    value={address.pincode}
                    onChange={handleAddressChange}
                    placeholder="Enter PIN code"
                    maxLength="6"
                  />

                </div>

              </div>

              <div className="addressInfo">
                💡 Your selected map location helps
                us identify the exact delivery point.
              </div>

            </div>

          </section>

          {/* CONTINUE */}

          <div className="deliveryActions">

            <button
              type="button"
              className="secondaryButton"
              onClick={() =>
                navigate("/cart")
              }
            >
              ← Back to Cart
            </button>

            <button
              type="button"
              className="continuePaymentButton"
              onClick={
                handleContinueToPayment
              }
            >
              Continue to Payment →
            </button>

          </div>

        </main>

        {/* =====================================
            ORDER SUMMARY
        ===================================== */}

        <aside className="deliverySummary">

          <div className="summaryTitle">
            <h2>
              Order Summary
            </h2>

            <span>
              {cartItems.length} items
            </span>
          </div>

          <div className="deliverySummaryItems">

            {cartItems.map((item) => (

              <div
                className="deliverySummaryItem"
                key={item.id}
              >

                <div
                  className="deliverySummaryImage"
                  style={{
                    backgroundImage: `url(${item.image})`,
                  }}
                ></div>

                <div className="deliverySummaryInfo">

                  <strong>
                    {item.name}
                  </strong>

                  <span>
                    {item.quantity} × ₹
                    {item.price.toFixed(2)}
                  </span>

                </div>

                <strong>
                  ₹
                  {(
                    item.price *
                    item.quantity
                  ).toFixed(2)}
                </strong>

              </div>

            ))}

          </div>

          <div className="summaryDivider"></div>

          <div className="summaryRow">
            <span>Subtotal</span>
            <strong>
              ₹{subtotal.toFixed(2)}
            </strong>
          </div>

          {discount > 0 && (
            <div className="summaryRow discount">

              <span>
                Discount
              </span>

              <strong>
                -₹{discount.toFixed(2)}
              </strong>

            </div>
          )}

          <div className="summaryRow">

            <span>
              Delivery
            </span>

            <strong>
              {deliveryFee === 0
                ? "FREE"
                : `₹${deliveryFee.toFixed(2)}`}
            </strong>

          </div>

          <div className="summaryRow">

            <span>
              Service Fee
            </span>

            <strong>
              ₹{serviceFee.toFixed(2)}
            </strong>

          </div>

          <div className="summaryRow">

            <span>
              Tax
            </span>

            <strong>
              ₹{tax.toFixed(2)}
            </strong>

          </div>

          <div className="summaryDivider"></div>

          <div className="summaryTotal">

            <span>
              Total
            </span>

            <strong>
              ₹{grandTotal.toFixed(2)}
            </strong>

          </div>

          {deliveryType === "delivery" && (
            <div className="deliveryType">
              🛵 Delivery Order
            </div>
          )}

          {coupon && (
            <div className="couponApplied">
              🎟️ {coupon.code} applied
            </div>
          )}

          <div className="secureBox">
            🔒 Your information is protected
          </div>

        </aside>

      </div>

    </div>
  );
}

export default DeliveryAddress;