import React, { useEffect, useRef, useState } from "react";
import "../Styles/GoogleMapPicker.css";

const DEFAULT_LOCATION = { lat: 22.5726, lng: 88.3639 };

let googleMapsPromise = null;

function loadGoogleMaps(apiKey) {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-google-maps="food-app"]');

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google.maps));
      existingScript.addEventListener("error", () => reject(new Error("Google Maps could not be loaded.")));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "food-app";
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error("Google Maps could not be loaded. Check your API key and Google Maps API settings."));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

function GoogleMapPicker({
  position = DEFAULT_LOCATION,
  onLocationSelect,
  className = "",
}) {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onLocationSelectRef = useRef(onLocationSelect);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setLoadError("Google Maps API key is not configured. Add REACT_APP_GOOGLE_MAPS_API_KEY to the frontend environment.");
      return undefined;
    }

    let cancelled = false;

    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (cancelled || !mapElementRef.current) return;

        const initialPosition = {
          lat: Number(position?.lat) || DEFAULT_LOCATION.lat,
          lng: Number(position?.lng) || DEFAULT_LOCATION.lng,
        };

        if (!mapRef.current) {
          mapRef.current = new maps.Map(mapElementRef.current, {
            center: initialPosition,
            zoom: 15,
            mapTypeControl: true,
            mapTypeControlOptions: {
              style: maps.MapTypeControlStyle.HORIZONTAL_BAR,
              position: maps.ControlPosition.TOP_RIGHT,
            },
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
            gestureHandling: "greedy",
          });

          markerRef.current = new maps.Marker({
            map: mapRef.current,
            position: initialPosition,
            draggable: true,
            title: "Delivery Location",
          });

          mapRef.current.addListener("click", (event) => {
            if (!event.latLng) return;
            const nextPosition = {
              lat: event.latLng.lat(),
              lng: event.latLng.lng(),
            };
            markerRef.current.setPosition(nextPosition);
            onLocationSelectRef.current?.(nextPosition);
          });

          markerRef.current.addListener("dragend", (event) => {
            if (!event.latLng) return;
            onLocationSelectRef.current?.({
              lat: event.latLng.lat(),
              lng: event.latLng.lng(),
            });
          });
        }
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message || "Unable to load Google Maps.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !position) return;

    const nextPosition = {
      lat: Number(position.lat) || DEFAULT_LOCATION.lat,
      lng: Number(position.lng) || DEFAULT_LOCATION.lng,
    };

    mapRef.current.panTo(nextPosition);
    mapRef.current.setZoom(16);
    markerRef.current.setPosition(nextPosition);
  }, [position]);

  if (loadError) {
    return (
      <div className={`googleMapError ${className}`}>
        <strong>Google Maps unavailable</strong>
        <span>{loadError}</span>
      </div>
    );
  }

  return <div ref={mapElementRef} className={`googleMapPicker ${className}`} aria-label="Google Maps delivery location" />;
}

export default GoogleMapPicker;
