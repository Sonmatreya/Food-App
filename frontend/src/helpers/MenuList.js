import Pepperoni from "../assets/pepperoni.jpg";
import Margherita from "../assets/margherita.jpg";
import PedroTechSpecial from "../assets/pedrotechspecial.jpg";
import Vegan from "../assets/vegan.jpg";
import Pineapple from "../assets/pineapple.jpg";
import Expensive from "../assets/expensive.jpg";

export const MenuList = [
  {
    id: 1,
    name: "Pepperoni Pizza",
    image: Pepperoni,
    price: 15.99,
    category: "Pizza",
    description: "A delicious pizza topped with spicy pepperoni and melted cheese.",
    ingredients: ["Tomato Sauce", "Mozzarella Cheese", "Pepperoni"],
    isAvailable: true,
    rating: 4.5,
  },

  {
    id: 2,
    name: "Margherita Pizza",
    image: Margherita,
    price: 11.99,
    category: "Pizza",
    description: "A classic Italian pizza with tomato sauce, mozzarella and fresh basil.",
    ingredients: ["Tomato Sauce", "Mozzarella Cheese", "Fresh Basil"],
    isAvailable: true,
    rating: 4.7,
  },

  {
    id: 3,
    name: "PedroTech Special Pizza",
    image: PedroTechSpecial,
    price: 25.99,
    category: "Pizza",
    description: "Our special signature pizza prepared with premium toppings and cheese.",
    ingredients: ["Tomato Sauce", "Mozzarella Cheese", "Premium Toppings"],
    isAvailable: true,
    rating: 4.8,
  },

  {
    id: 4,
    name: "Vegan Pizza",
    image: Vegan,
    price: 17.99,
    category: "Pizza",
    description: "A tasty plant-based pizza made with fresh vegetables and vegan-friendly ingredients.",
    ingredients: ["Tomato Sauce", "Vegan Cheese", "Fresh Vegetables"],
    isAvailable: true,
    rating: 4.4,
  },

  {
    id: 5,
    name: "Pineapple Pizza",
    image: Pineapple,
    price: 14.99,
    category: "Pizza",
    description: "A sweet and savoury pizza combining juicy pineapple with delicious cheese.",
    ingredients: ["Tomato Sauce", "Mozzarella Cheese", "Pineapple"],
    isAvailable: true,
    rating: 4.2,
  },

  {
    id: 6,
    name: "Very Expensive Pizza",
    image: Expensive,
    price: 49.99,
    category: "Pizza",
    description: "A premium pizza made with carefully selected ingredients.",
    ingredients: ["Tomato Sauce", "Mozzarella Cheese", "Premium Ingredients"],
    isAvailable: true,
    rating: 4.6,
  },
];