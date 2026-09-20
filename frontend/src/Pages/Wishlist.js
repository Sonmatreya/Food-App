import React,{useEffect,useState} from "react";
import {useNavigate} from "react-router-dom";
import {API_URL} from "../config/api";
import "../Styles/CustomerTools.css";

export default function Wishlist(){
 const navigate=useNavigate(); const [items,setItems]=useState([]); const [loading,setLoading]=useState(true);
 const load=async()=>{const ids=JSON.parse(localStorage.getItem("foodWishlist")||"[]");if(!ids.length){setItems([]);setLoading(false);return}try{const r=await fetch(`${API_URL}/api/foods?available=true`,{credentials:"include"});const d=await r.json();const all=d.foods||[];setItems(ids.map(String).map(id=>all.find(f=>String(f._id)===id)).filter(Boolean))}finally{setLoading(false)}};
 useEffect(()=>{load()},[]);
 const remove=id=>{const next=JSON.parse(localStorage.getItem("foodWishlist")||"[]").filter(x=>String(x)!==String(id));localStorage.setItem("foodWishlist",JSON.stringify(next));setItems(v=>v.filter(x=>String(x._id)!==String(id)))};
 return <main className="customer-tool-page"><section className="customer-tool-hero"><span>YOUR FAVORITES</span><h1>Wishlist</h1><p>Keep the dishes you love close to your next order.</p></section><section className="customer-tool-content">{loading?<div className="tool-state">Loading favorites...</div>:!items.length?<div className="tool-state"><h2>Your wishlist is empty</h2><p>Open a food item and add it to your favorites.</p><button onClick={()=>navigate("/menu")}>Explore Menu</button></div>:<div className="wishlist-grid">{items.map(f=><article className="wishlist-card" key={f._id}><img src={f.image} alt={f.name}/><div><span>{f.category}</span><h2>{f.name}</h2><p>⭐ {Number(f.rating||0).toFixed(1)} · ₹{Number(f.price||0).toFixed(2)}</p><div><button onClick={()=>navigate(`/food/${f._id}`)}>View Food</button><button className="danger" onClick={()=>remove(f._id)}>Remove</button></div></div></article>)}</div>}</section></main>
}