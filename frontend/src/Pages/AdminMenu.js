import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MenuList } from "../helpers/MenuList";
import "../Styles/AdminMenu.css";

const STORAGE_KEY = "food-app-admin-menu";

const loadMenu = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch (error) {
    console.warn("Could not load saved admin menu", error);
  }
  return MenuList.map((item) => ({ ...item, ingredients: [...(item.ingredients || [])] }));
};

const emptyForm = { name: "", category: "Pizza", price: "", rating: "4.5", description: "", ingredients: "", image: "", isAvailable: true };

const AdminMenu = () => {
  const navigate = useNavigate();
  const [foods, setFoods] = useState(loadMenu);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [availability, setAvailability] = useState("All");
  const [editingFood, setEditingFood] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);

  const categories = useMemo(() => ["All", ...new Set(foods.map((food) => food.category).filter(Boolean))], [foods]);

  const filteredFoods = useMemo(() => {
    const query = search.trim().toLowerCase();
    return foods.filter((food) => {
      const matchesSearch = !query || `${food.name} ${food.description}`.toLowerCase().includes(query);
      const matchesCategory = category === "All" || food.category === category;
      const matchesAvailability = availability === "All" || (availability === "Available" ? food.isAvailable : !food.isAvailable);
      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [foods, search, category, availability]);

  const persist = (nextFoods) => {
    setFoods(nextFoods);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextFoods));
  };

  const openCreate = () => {
    setEditingFood(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (food) => {
    setEditingFood(food);
    setForm({ name: food.name || "", category: food.category || "Pizza", price: food.price ?? "", rating: food.rating ?? "4.5", description: food.description || "", ingredients: Array.isArray(food.ingredients) ? food.ingredients.join(", ") : "", image: food.image || "", isAvailable: food.isAvailable !== false });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingFood(null);
    setForm({ ...emptyForm });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const price = Number(form.price);
    const rating = Number(form.rating);
    if (!name || !Number.isFinite(price) || price < 0) return;

    const payload = {
      id: editingFood?.id || Date.now(),
      name,
      category: form.category.trim() || "Pizza",
      price: Number(price.toFixed(2)),
      rating: Math.min(5, Math.max(0, Number.isFinite(rating) ? Number(rating.toFixed(1)) : 4.5)),
      description: form.description.trim(),
      ingredients: form.ingredients.split(",").map((item) => item.trim()).filter(Boolean),
      image: form.image.trim() || editingFood?.image || "",
      isAvailable: Boolean(form.isAvailable),
    };

    persist(editingFood ? foods.map((food) => food.id === editingFood.id ? payload : food) : [payload, ...foods]);
    closeModal();
  };

  const toggleAvailability = (food) => persist(foods.map((item) => item.id === food.id ? { ...item, isAvailable: !item.isAvailable } : item));

  const deleteFood = (food) => {
    if (!window.confirm(`Remove ${food.name} from the admin menu?`)) return;
    persist(foods.filter((item) => item.id !== food.id));
  };

  return (
    <section className="admin-menu-page">
      <div className="admin-menu-header"><div><span className="admin-menu-eyebrow">Restaurant catalogue</span><h2>Food & Menu</h2><p>Manage dishes, pricing and availability from one place.</p></div><button type="button" className="admin-menu-add" onClick={openCreate}>+ Add Food</button></div>
      <div className="admin-menu-summary"><div><strong>{foods.length}</strong><span>Total dishes</span></div><div className="green"><strong>{foods.filter((food) => food.isAvailable).length}</strong><span>Available</span></div><div className="red"><strong>{foods.filter((food) => !food.isAvailable).length}</strong><span>Unavailable</span></div><div><strong>{categories.length - 1}</strong><span>Categories</span></div></div>
      <div className="admin-menu-toolbar"><div className="admin-menu-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search food..." /></div><div className="admin-menu-filters"><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select><select value={availability} onChange={(event) => setAvailability(event.target.value)}><option>All</option><option>Available</option><option>Unavailable</option></select></div></div>
      <div className="admin-menu-table-card"><div className="admin-menu-table-heading"><div><span>Menu inventory</span><h3>{filteredFoods.length} item{filteredFoods.length !== 1 ? "s" : ""}</h3></div><button type="button" onClick={() => navigate("/menu")}>View Customer Menu →</button></div><div className="admin-menu-table-wrap"><table className="admin-menu-table"><thead><tr><th>Food</th><th>Category</th><th>Price</th><th>Rating</th><th>Availability</th><th>Actions</th></tr></thead><tbody>{filteredFoods.map((food) => <tr key={food.id}><td><div className="admin-menu-food"><div className="admin-menu-thumb">{food.image ? <img src={food.image} alt="" /> : <span>🍽️</span>}</div><div><strong>{food.name}</strong><small>{food.description || "No description"}</small></div></div></td><td><span className="admin-menu-category">{food.category}</span></td><td><strong className="admin-menu-price">${Number(food.price).toFixed(2)}</strong></td><td><span className="admin-menu-rating">★ {Number(food.rating || 0).toFixed(1)}</span></td><td><button type="button" className={`admin-menu-availability ${food.isAvailable ? "available" : "unavailable"}`} onClick={() => toggleAvailability(food)}>{food.isAvailable ? "Available" : "Unavailable"}</button></td><td><div className="admin-menu-actions"><button type="button" onClick={() => openEdit(food)}>Edit</button><button type="button" className="danger" onClick={() => deleteFood(food)}>Delete</button></div></td></tr>)}</tbody></table>{!filteredFoods.length && <div className="admin-menu-empty"><span>🍽️</span><strong>No food found</strong><p>Try another search or filter.</p></div>}</div></div>
      {modalOpen && <div className="admin-menu-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}><form className="admin-menu-modal" onSubmit={handleSubmit}><div className="admin-menu-modal-header"><div><span>{editingFood ? "Update dish" : "New dish"}</span><h3>{editingFood ? "Edit Food" : "Add Food"}</h3></div><button type="button" onClick={closeModal}>×</button></div><div className="admin-menu-form-grid"><label>Food name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Category<input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label><label>Price<input required type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label><label>Rating<input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(event) => setForm({ ...form, rating: event.target.value })} /></label><label className="wide">Image URL<input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="Optional image URL" /></label><label className="wide">Description<textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><label className="wide">Ingredients<input value={form.ingredients} onChange={(event) => setForm({ ...form, ingredients: event.target.value })} placeholder="Tomato sauce, cheese, vegetables" /></label><label className="admin-menu-check"><input type="checkbox" checked={form.isAvailable} onChange={(event) => setForm({ ...form, isAvailable: event.target.checked })} /> Available for customers</label></div><div className="admin-menu-modal-actions"><button type="button" className="cancel" onClick={closeModal}>Cancel</button><button type="submit">{editingFood ? "Save Changes" : "Add Food"}</button></div></form></div>}
    </section>
  );
};

export default AdminMenu;
