import React,{useEffect,useState} from "react";
import {useNavigate} from "react-router-dom";
import {API_URL} from "../config/api";
import "../Styles/CustomerTools.css";

export default function Coupons(){
 const navigate=useNavigate(); const [coupons,setCoupons]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
 useEffect(()=>{fetch(`${API_URL}/api/coupons`).then(async r=>{const d=await r.json();if(!r.ok||!d.success)throw new Error(d.message||"Unable to load offers");setCoupons(d.coupons||[])}).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[]);
 return <main className="customer-tool-page"><section className="customer-tool-hero"><span>OFFERS & SAVINGS</span><h1>Coupons</h1><p>Save more on your next order with available Food App offers.</p></section><section className="customer-tool-content">{loading?<div className="tool-state">Loading available coupons...</div>:error?<div className="tool-state error">{error}</div>:coupons.length===0?<div className="tool-state"><h2>No coupons available</h2><p>Check back later for new offers.</p><button onClick={()=>navigate("/menu")}>Browse Menu</button></div>:<div className="coupon-grid">{coupons.map(c=><article className="coupon-card" key={c._id||c.code}><div><span className="coupon-code">{c.code}</span><h2>{c.type==="percentage"?`${c.value}% OFF`:`₹${c.value} OFF`}</h2><p>Minimum order: ₹{Number(c.minimum||0).toFixed(2)}</p>{c.maxDiscount&&c.type==="percentage"?<small>Maximum discount ₹{Number(c.maxDiscount).toFixed(2)}</small>:null}</div><button onClick={()=>{navigator.clipboard?.writeText(c.code);navigate("/menu")}}>Use Coupon</button></article>)}</div>}</section></main>
}