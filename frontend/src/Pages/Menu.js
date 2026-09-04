import React from "react";
import { MenuList } from "../helpers/MenuList";
import MenuItem from "../Components/MenuItem";
import "../Styles/Menu.css";

function Menu() {
  return (
    <div className="menu">
      <h1 className="menuTitle">Our Pizza Menu</h1>

      <div className="menuGrid">
        {MenuList.map((menuItem) => (
          <MenuItem
            key={menuItem.id}
            id={menuItem.id}
            image={menuItem.image}
            name={menuItem.name}
            price={menuItem.price}
            category={menuItem.category}
            rating={menuItem.rating}
            isAvailable={menuItem.isAvailable}
          />
        ))}
      </div>
    </div>
  );
}

export default Menu;