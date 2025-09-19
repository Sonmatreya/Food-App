import React from 'react';
import "../Styles/Menu.css";

function MenuItem({ image, name, price }) {
  return (
    <div className="menuCard">
      <div className="menuImage" style={{ backgroundImage: `url(${image})` }}></div>
      <div className="menuContent">
        <h2>{name}</h2>
        <p>${price.toFixed(2)}</p>
        <button className="orderButton">Order Now</button>
      </div>
    </div>
  );
}

export default MenuItem;
