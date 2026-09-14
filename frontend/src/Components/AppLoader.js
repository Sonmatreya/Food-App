import React from "react";
import { MenuList } from "../helpers/MenuList";
import "../Styles/AppLoader.css";

function AppLoader() {
  const foods = MenuList.filter((food) => food?.image).slice(0, 6);
  const firstRow = [...foods, ...foods];
  const secondRow = [...foods.slice().reverse(), ...foods.slice().reverse()];

  return (
    <div className="app-loader" aria-hidden="true">
      <div className="app-loader-marquee app-loader-marquee-top">
        {firstRow.map((food, index) => (
          <div className="app-loader-food" key={`top-${food.id}-${index}`}>
            <img src={food.image} alt="" />
          </div>
        ))}
      </div>

      <div className="app-loader-center">
        <div className="app-loader-logo">
          <img src="/pizza-logo-png.png" alt="" />
        </div>
        <div className="app-loader-line" />
      </div>

      <div className="app-loader-marquee app-loader-marquee-bottom">
        {secondRow.map((food, index) => (
          <div className="app-loader-food" key={`bottom-${food.id}-${index}`}>
            <img src={food.image} alt="" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default AppLoader;
