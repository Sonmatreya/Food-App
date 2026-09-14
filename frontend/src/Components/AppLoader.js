import React from "react";
import { MenuList } from "../helpers/MenuList";
import "../Styles/AppLoader.css";

function AppLoader() {
  const foods = MenuList.filter((food) => food?.image).slice(0, 8);
  const topRow = [...foods, ...foods];
  const middleRow = [...foods.slice().reverse(), ...foods.slice().reverse()];
  const bottomRow = [...foods.slice(2), ...foods, ...foods.slice(2)];

  return (
    <div className="app-loader" aria-hidden="true">
      <div className="app-loader-glow" />

      <div className="app-loader-row app-loader-row-top">
        {topRow.map((food, index) => (
          <div className="app-loader-food" key={`top-${food.id}-${index}`}>
            <img src={food.image} alt="" />
          </div>
        ))}
      </div>

      <div className="app-loader-row app-loader-row-middle">
        {middleRow.map((food, index) => (
          <div className="app-loader-food app-loader-food-large" key={`middle-${food.id}-${index}`}>
            <img src={food.image} alt="" />
          </div>
        ))}
      </div>

      <div className="app-loader-row app-loader-row-bottom">
        {bottomRow.map((food, index) => (
          <div className="app-loader-food" key={`bottom-${food.id}-${index}`}>
            <img src={food.image} alt="" />
          </div>
        ))}
      </div>

      <div className="app-loader-vignette" />

      <div className="app-loader-center">
        <div className="app-loader-logo-wrap">
          <div className="app-loader-ring app-loader-ring-one" />
          <div className="app-loader-ring app-loader-ring-two" />
          <div className="app-loader-logo">
            <img src="/pizza-logo-png.png" alt="" />
          </div>
        </div>

        <div className="app-loader-brand">FOOD APP</div>
        <div className="app-loader-tagline">Fresh food. Fast delivery.</div>

        <div className="app-loader-progress">
          <span />
        </div>
      </div>
    </div>
  );
}

export default AppLoader;
