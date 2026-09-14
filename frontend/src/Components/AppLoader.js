import React from "react";
import "../Styles/AppLoader.css";

function AppLoader() {
  return (
    <div className="app-loader">
      <div className="app-loader-logo">
        <img src="/logo.svg" alt="Food App" />
      </div>
    </div>
  );
}

export default AppLoader;