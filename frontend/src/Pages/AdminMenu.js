import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import "../Styles/AdminMenu.css";

const emptyForm = {
  name: "",
  category: "Pizza",
  price: "",
  rating: "4.5",
  description: "",
  ingredients: "",
  image: "",
  isAvailable: true,
  isFeatured: false,
};

const AdminMenu = () => {
  const navigate = useNavigate();
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [availability, setAvailability] = useState("All");
  const [editingFood, setEditingFood] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const request = async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) throw new Error(data.message || "Request failed.");
    return data;
  };

  const loadFoods = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await request("/api/foods");
      setFoods(Array.isArray(data.foods) ? data.foods : []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load food catalogue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFoods();
  }, []);

  const categories = useMemo(
    () => ["All", ...new Set(foods.map((food) => food.category).filter(Boolean))],
    [foods]
  );

  const filteredFoods = useMemo(() => {
    const query = search.trim().toLowerCase();
    return foods.filter((food) => {
      const matchesSearch = !query || `${food.name || ""} ${food.description || ""} ${food.category || ""}`.toLowerCase().includes(query);
      const matchesCategory = category === "All" || food.category === category;
      const matchesAvailability = availability === "All" || (availability === "Available" ? food.isAvailable : !food.isAvailable);
      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [foods, search, category, availability]);

  const openCreate = () => {
    setEditingFood(null);
    setForm({ ...emptyForm });
    setError("");
    setNotice("");
    setModalOpen(true);
  };

  const openEdit = (food) => {
    setEditingFood(food);
    setForm({
      name: food.name || "",
      category: food.category || "Pizza",
      price: food.price ?? "",
      rating: food.rating ?? "4.5",
      description: food.description || "",
      ingredients: Array.isArray(food.ingredients) ? food.ingredients.join(", ") : "",
      image: food.image || "",
      isAvailable: food.isAvailable !== false,
      isFeatured: food.isFeatured === true,
    });
    setError("");
    setNotice("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingFood(null);
    setForm({ ...emptyForm });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const price = Number(form.price);
    const rating = Number(form.rating);

    if (!name || name.length < 2) {
      setError("Food name must contain at least 2 characters.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError("Enter a valid non-negative price.");
      return;
    }
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
      setError("Rating must be between 0 and 5.");
      return;
    }

    const payload = {
      name,
      category: form.category.trim() || "Pizza",
      price: Number(price.toFixed(2)),
      rating: Number(rating.toFixed(1)),
      ratingCount: Number(editingFood?.ratingCount || 0),
      description: form.description.trim(),
      ingredients: form.ingredients.split(",").map((item) => item.trim()).filter(Boolean),
      image: form.image.trim(),
      isAvailable: Boolean(form.isAvailable),
      isFeatured: Boolean(form.isFeatured),
    };

    try {
      setSaving(true);
      setError("");
      const data = editingFood
        ? await request(`/api/foods/${editingFood._id}`, { method: "PUT", body: JSON.stringify(payload) })
        : await request("/api/foods", { method: "POST", body: JSON.stringify(payload) });

      if (editingFood) {
        setFoods((current) => current.map((food) => (food._id === editingFood._id ? data.food : food)));
        setNotice("Food item updated successfully.");
      } else {
        setFoods((current) => [data.food, ...current]);
        setNotice("Food item added successfully.");
      }
      closeModal();
    } catch (requestError) {
      setError(requestError.message || "Unable to save food item.");
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (food) => {
    try {
      setError("");
      const data = await request(`/api/foods/${food._id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: food.name,
          category: food.category,
          price: food.price,
          rating: food.rating || 0,
          ratingCount: food.ratingCount || 0,
          description: food.description || "",
          ingredients: food.ingredients || [],
          image: food.image || "",
          isAvailable: !food.isAvailable,
          isFeatured: food.isFeatured === true,
        }),
      });
      setFoods((current) => current.map((item) => (item._id === food._id ? data.food : item)));
    } catch (requestError) {
      setError(requestError.message || "Unable to update availability.");
    }
  };

  const deleteFood = async (food) => {
    if (!window.confirm(`Remove ${food.name} from the restaurant catalogue?`)) return;
    try {
      setError("");
      await request(`/api/foods/${food._id}`, { method: "DELETE" });
      setFoods((current) => current.filter((item) => item._id !== food._id));
      setNotice(`${food.name} was removed.`);
    } catch (requestError) {
      setError(requestError.message || "Unable to delete food item.");
    }
  };

  const loadStarterCatalogue = async () => {
    if (!window.confirm("Add the professional starter food catalogue to MongoDB? Existing food items will not be duplicated.")) return;
    try {
      setSeeding(true);
      setError("");
      const data = await request("/api/foods/seed", { method: "POST", body: JSON.stringify({}) });
      await loadFoods();
      setNotice(`${data.insertedCount || 0} starter food items added. ${data.skippedCount || 0} existing items skipped.`);
    } catch (requestError) {
      setError(requestError.message || "Unable to load starter catalogue.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <section className="admin-menu-page">
      <div className="admin-menu-header">
        <div>
          <span className="admin-menu-eyebrow">Restaurant catalogue</span>
          <h2>Food & Menu</h2>
          <p>Manage dishes, pricing, availability and featured items from MongoDB.</p>
        </div>
        <div className="admin-menu-header-actions">
          <button type="button" className="admin-menu-seed" onClick={loadStarterCatalogue} disabled={seeding}>
            {seeding ? "Loading..." : "Load Starter Menu"}
          </button>
          <button type="button" className="admin-menu-add" onClick={openCreate}>+ Add Food</button>
        </div>
      </div>

      {notice && <div className="admin-menu-notice" role="status">{notice}</div>}
      {error && <div className="admin-menu-error" role="alert">{error}</div>}

      <div className="admin-menu-summary">
        <div><strong>{foods.length}</strong><span>Total dishes</span></div>
        <div className="green"><strong>{foods.filter((food) => food.isAvailable).length}</strong><span>Available</span></div>
        <div className="red"><strong>{foods.filter((food) => !food.isAvailable).length}</strong><span>Unavailable</span></div>
        <div><strong>{categories.length - 1}</strong><span>Categories</span></div>
      </div>

      <div className="admin-menu-toolbar">
        <div className="admin-menu-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search food..." /></div>
        <div className="admin-menu-filters">
          <select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={availability} onChange={(event) => setAvailability(event.target.value)}><option>All</option><option>Available</option><option>Unavailable</option></select>
        </div>
      </div>

      <div className="admin-menu-table-card">
        <div className="admin-menu-table-heading">
          <div><span>Menu inventory</span><h3>{filteredFoods.length} item{filteredFoods.length !== 1 ? "s" : ""}</h3></div>
          <button type="button" onClick={() => navigate("/menu")}>View Customer Menu →</button>
        </div>
        <div className="admin-menu-table-wrap">
          {loading ? <div className="admin-menu-empty"><span>🍽️</span><strong>Loading catalogue...</strong><p>Fetching food items from MongoDB.</p></div> : (
            <table className="admin-menu-table">
              <thead><tr><th>Food</th><th>Category</th><th>Price</th><th>Rating</th><th>Availability</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredFoods.map((food) => (
                  <tr key={food._id}>
                    <td><div className="admin-menu-food"><div className="admin-menu-thumb">{food.image ? <img src={food.image} alt="" /> : <span>🍽️</span>}</div><div><strong>{food.name}</strong><small>{food.description || "No description"}</small></div></div></td>
                    <td><span className="admin-menu-category">{food.category}</span></td>
                    <td><strong className="admin-menu-price">${Number(food.price || 0).toFixed(2)}</strong></td>
                    <td><span className="admin-menu-rating">★ {Number(food.rating || 0).toFixed(1)}</span></td>
                    <td><button type="button" className={`admin-menu-availability ${food.isAvailable ? "available" : "unavailable"}`} onClick={() => toggleAvailability(food)}>{food.isAvailable ? "Available" : "Unavailable"}</button></td>
                    <td><div className="admin-menu-actions"><button type="button" onClick={() => openEdit(food)}>Edit</button><button type="button" className="danger" onClick={() => deleteFood(food)}>Delete</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && !filteredFoods.length && <div className="admin-menu-empty"><span>🍽️</span><strong>No food found</strong><p>Add a food item or load the starter catalogue.</p></div>}
        </div>
      </div>

      {modalOpen && (
        <div className="admin-menu-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
          <form className="admin-menu-modal" onSubmit={handleSubmit}>
            <div className="admin-menu-modal-header"><div><span>{editingFood ? "Update dish" : "New dish"}</span><h3>{editingFood ? "Edit Food" : "Add Food"}</h3></div><button type="button" onClick={closeModal}>×</button></div>
            <div className="admin-menu-form-grid">
              <label>Food name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
              <label>Category<input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label>
              <label>Price<input required type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
              <label>Rating<input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(event) => setForm({ ...form, rating: event.target.value })} /></label>
              <label className="wide">Image URL<input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="https://..." /></label>
              <label className="wide">Description<textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe the dish for customers" /></label>
              <label className="wide">Ingredients<input value={form.ingredients} onChange={(event) => setForm({ ...form, ingredients: event.target.value })} placeholder="Tomato sauce, mozzarella, basil" /></label>
              <label className="admin-menu-check"><input type="checkbox" checked={form.isAvailable} onChange={(event) => setForm({ ...form, isAvailable: event.target.checked })} /> Available for customers</label>
              <label className="admin-menu-check"><input type="checkbox" checked={form.isFeatured} onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })} /> Featured item</label>
            </div>
            <div className="admin-menu-modal-actions"><button type="button" className="cancel" onClick={closeModal}>Cancel</button><button type="submit" disabled={saving}>{saving ? "Saving..." : editingFood ? "Save Changes" : "Add Food"}</button></div>
          </form>
        </div>
      )}
    </section>
  );
};

export default AdminMenu;
