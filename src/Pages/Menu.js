import React from "react";
import { MenuList } from "../helpers/MenuList";
import MenuItem from "../Components/MenuItem";
import "../Styles/Menu.css";

function Menu() {
  return (
    <div className="menu">
      <h1 className="menuTitle">Our Pizza Menu</h1>
      <div className="menuGrid">
        {MenuList.map((menuItem, key) => (
          <MenuItem key={key} image={menuItem.image} name={menuItem.name} price={menuItem.price} />
        ))}
      </div>
    </div>
  );
}

export default Menu;
