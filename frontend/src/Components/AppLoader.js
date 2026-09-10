import React from "react";
import "../Styles/AppLoader.css";

function AppLoader() {
  return (
    <div className="app-loader">
      <div className="loader-content">

        <div className="loader-logo">
          🍕
        </div>

        <div className="loader-spinner"></div>

        <p>Loading...</p>

      </div>
    </div>
  );
}

export default AppLoader;