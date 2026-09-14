import React from "react";
import "../Styles/AppLoader.css";

function AppLoader() {
  return (
    <div className="app-loader" aria-hidden="true">
      <div className="app-loader-logo">
        <img src="/pizza-logo-png.png" alt="" />
      </div>
    </div>
  );
}

export default AppLoader;
