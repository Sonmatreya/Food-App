import React,{useEffect,useState} from "react";
import "../Styles/CustomerTools.css";
export default function Notifications(){
 const [enabled,setEnabled]=useState(()=>localStorage.getItem("orderNotifications")!=="off");
 useEffect(()=>{localStorage.setItem("orderNotifications",enabled?"on":"off")},[enabled]);
 return <main className="customer-tool-page"><section className="customer-tool-hero"><span>ACCOUNT PREFERENCES</span><h1>Notifications</h1><p>Choose how you want to receive important order updates.</p></section><section className="customer-tool-content"><div className="settings-card"><div><span className="settings-icon">🔔</span><div><h2>Order updates</h2><p>Receive status updates while your order is being prepared, picked up, or delivered.</p></div></div><button className={enabled?"toggle active":"toggle"} onClick={()=>setEnabled(v=>!v)} aria-pressed={enabled}><span/></button></div><div className="settings-note">Food App keeps essential order information available in your order history even when optional notifications are turned off.</div></section></main>
}