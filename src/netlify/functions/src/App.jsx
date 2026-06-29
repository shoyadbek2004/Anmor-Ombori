import { useState, useEffect, useRef } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const ADMINS = {
  shoxrux:  { name:"Shoxrux",  password:"shoxrux123",  color:"#6366f1" },
  shoyadbek:{ name:"Shoyadbek",password:"shoyadbek123",color:"#f59e0b" },
};
const CATEGORIES = ["Go'sht","Sabzavot","Meva","Non va un","Sut mahsulotlari","Ichimlik","Ziravorlar","Boshqa"];
const UNITS = ["kg","litr","dona","gram","pakket"];

const DEFAULT_INVENTORY = [
  {id:1,name:"Mol go'shti",  category:"Go'sht",   quantity:45, unit:"kg",  pricePerUnit:85000,minStock:10,addedBy:"Shoxrux",  date:"2025-06-25",totalUsed:120,daysLeft:6},
  {id:2,name:"Tovuq go'shti",category:"Go'sht",   quantity:30, unit:"kg",  pricePerUnit:45000,minStock:8, addedBy:"Shoyadbek",date:"2025-06-26",totalUsed:200,daysLeft:4},
  {id:3,name:"Pomidor",      category:"Sabzavot", quantity:20, unit:"kg",  pricePerUnit:8000, minStock:5, addedBy:"Shoxrux",  date:"2025-06-27",totalUsed:90, daysLeft:3},
  {id:4,name:"Bodring",      category:"Sabzavot", quantity:15, unit:"kg",  pricePerUnit:6000, minStock:4, addedBy:"Shoyadbek",date:"2025-06-27",totalUsed:60, daysLeft:5},
  {id:5,name:"Bug'doy uni",  category:"Non va un",quantity:80, unit:"kg",  pricePerUnit:12000,minStock:20,addedBy:"Shoxrux",  date:"2025-06-24",totalUsed:150,daysLeft:12},
  {id:6,name:"Pepsi Cola",   category:"Ichimlik", quantity:120,unit:"dona",pricePerUnit:7500, minStock:30,addedBy:"Shoyadbek",date:"2025-06-26",totalUsed:300,daysLeft:8},
  {id:7,name:"Tuz",          category:"Ziravorlar",quantity:5, unit:"kg",  pricePerUnit:3000, minStock:2, addedBy:"Shoxrux",  date:"2025-06-20",totalUsed:10, daysLeft:30},
];
const DEFAULT_TRANSACTIONS = [
  {id:1,type:"in", productId:1,productName:"Mol go'shti",  quantity:20,unit:"kg",totalPrice:1700000,date:"2025-06-25",time:"09:30",adminName:"Shoxrux",  note:"Bozordan olindi"},
  {id:2,type:"in", productId:2,productName:"Tovuq go'shti",quantity:30,unit:"kg",totalPrice:1350000,date:"2025-06-26",time:"10:15",adminName:"Shoyadbek",note:""},
  {id:3,type:"out",productId:1,productName:"Mol go'shti",  quantity:5, unit:"kg",totalPrice:425000, date:"2025-06-26",time:"14:00",adminName:"Shoxrux",  note:"Oshxona uchun"},
];

// ─── STORAGE HELPERS ─────────────────────────────────────────────────────────
const STORAGE_KEY_INV  = "fastfood-inventory";
const STORAGE_KEY_TX   = "fastfood-transactions";

async function loadData(key, fallback) {
  try {
    const r = await window.storage.get(key);
    if (r && r.value) return JSON.parse(r.value);
  } catch {}
  return fallback;
}
async function saveData(key, value) {
  try { await window.storage.set(key, JSON.stringify(value)); } catch {}
}

// ─── HOOKS ───────────────────────────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

// ─── CONFIRM DIALOG ──────────────────────────────────────────────────────────
function ConfirmDialog({ title, message, onConfirm, onCancel, danger }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#1e293b",borderRadius:20,padding:24,width:"100%",maxWidth:360,border:"1px solid #334155"}}>
        <div style={{fontSize:36,textAlign:"center",marginBottom:12}}>{danger?"🗑️":"⚠️"}</div>
        <div style={{fontWeight:800,fontSize:17,color:"#f1f5f9",textAlign:"center",marginBottom:8}}>{title}</div>
        <div style={{fontSize:13,color:"#94a3b8",textAlign:"center",marginBottom:22,lineHeight:1.6}}>{message}</div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onCancel} style={{flex:1,padding:"12px",borderRadius:10,border:"1px solid #334155",background:"transparent",color:"#94a3b8",cursor:"pointer",fontWeight:600,fontSize:14}}>Bekor</button>
          <button onClick={onConfirm} style={{flex:1,padding:"12px",borderRadius:10,border:"none",background:danger?"#ef4444":"#22c55e",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:14}}>Ha, o'chirish</button>
        </div>
      </div>
    </div>
  );
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ message, type, onHide }) {
  useEffect(() => { const t = setTimeout(onHide, 2500); return () => clearTimeout(t); }, []);
  const bg = type==="success"?"#22c55e":type==="error"?"#ef4444":"#6366f1";
  return (
    <div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",background:bg,color:"#fff",padding:"12px 20px",borderRadius:12,fontWeight:600,fontSize:13,zIndex:600,whiteSpace:"nowrap",boxShadow:"0 4px 20px rgba(0,0,0,0.4)"}}>
      {type==="success"?"✅":type==="error"?"❌":"ℹ️"} {message}
    </div>
  );
}

// ─── AI ASSISTANT ────────────────────────────────────────────────────────────
function AIAssistant({ inventory, transactions, onClose, isMobile }) {
  const [messages, setMessages] = useState([
    {role:"assistant",content:"Salom! Men FastFood Ombori AI yordamchisiman 🤖\nMahsulotlar, statistika yoki ombor haqida istalgan savolni bering!"}
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"})},[messages]);

  const buildContext = () => {
    const lowStock   = inventory.filter(i=>i.quantity<=i.minStock).map(i=>i.name);
    const topUsed    = [...inventory].sort((a,b)=>b.totalUsed-a.totalUsed).slice(0,3).map(i=>`${i.name}(${i.totalUsed}${i.unit})`);
    const totalValue = inventory.reduce((s,i)=>s+i.quantity*i.pricePerUnit,0);
    const recentTx   = transactions.slice(-5).map(t=>`${t.type==="in"?"Kirim":"Chiqim"}: ${t.productName} ${t.quantity}${t.unit} - ${t.adminName} (${t.date})`).join("\n");
    return `Sen FastFood ombori boshqaruv AI yordamchisissan. O'zbek tilida qisqa va aniq javob ber.
Ombor: ${inventory.length} tur, kam: ${lowStock.join(",")||"yo'q"}, top: ${topUsed.join(",")}, qiymat: ${totalValue.toLocaleString()} so'm
Operatsiyalar:\n${recentTx||"Yo'q"}
Mahsulotlar:\n${inventory.map(i=>`${i.name}: ${i.quantity}${i.unit}, ${i.pricePerUnit}so'm, ~${i.daysLeft||"?"}kun`).join("\n")}`;
  };

  const send = async () => {
    if (!input.trim()||loading) return;
    const history = [...messages,{role:"user",content:input}];
    setMessages(history); setInput(""); setLoading(true);
    try {
      const res  = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,system:buildContext(),messages:history.map(m=>({role:m.role,content:m.content}))})});
      const data = await res.json();
      setMessages(p=>[...p,{role:"assistant",content:data.content?.[0]?.text||"Kechirasiz, xatolik."}]);
    } catch { setMessages(p=>[...p,{role:"assistant",content:"Xatolik yuz berdi."}]); }
    setLoading(false);
  };

  const wrap = isMobile ? {position:"fixed",inset:0,zIndex:300,display:"flex",flexDirection:"column",background:"#0a0f1e"}
                        : {display:"flex",flexDirection:"column",height:"100%",background:"#0f172a",borderRadius:16,border:"1px solid #1e293b"};
  return (
    <div style={wrap}>
      <div style={{padding:"14px 16px",borderBottom:"1px solid #1e293b",display:"flex",alignItems:"center",gap:10,background:"#111827",flexShrink:0}}>
        <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🤖</div>
        <div style={{flex:1}}>
          <div style={{color:"#f1f5f9",fontWeight:700,fontSize:14}}>AI Yordamchi</div>
          <div style={{color:"#22c55e",fontSize:11}}>● Faol — ombor ma'lumotlariga ulangan</div>
        </div>
        {onClose && <button onClick={onClose} style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:24,padding:"4px 8px"}}>✕</button>}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"14px 12px",display:"flex",flexDirection:"column",gap:10}}>
        {messages.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"82%",padding:"10px 13px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?"linear-gradient(135deg,#6366f1,#8b5cf6)":"#1e293b",color:"#f1f5f9",fontSize:13,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{m.content}</div>
          </div>
        ))}
        {loading && <div style={{display:"flex"}}><div style={{padding:"10px 14px",background:"#1e293b",borderRadius:"16px 16px 16px 4px",color:"#94a3b8",fontSize:13}}>AI yozmoqda ●●●</div></div>}
        <div ref={bottomRef}/>
      </div>
      <div style={{padding:"10px 12px",borderTop:"1px solid #1e293b",display:"flex",gap:8,background:"#111827",flexShrink:0}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Savol yozing..." style={{flex:1,background:"#1e293b",border:"1px solid #334155",borderRadius:10,padding:"11px 14px",color:"#f1f5f9",fontSize:14,outline:"none"}}/>
        <button onClick={send} style={{width:44,height:44,borderRadius:10,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",border:"none",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>➤</button>
      </div>
    </div>
  );
}

// ─── BOTTOM SHEET MODAL ───────────────────────────────────────────────────────
function Modal({ onClose, children, maxWidth=480 }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:"#111827",borderRadius:"20px 20px 0 0",width:"100%",maxWidth,maxHeight:"92vh",overflowY:"auto",padding:20,boxSizing:"border-box"}} onClick={e=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const isMobile = useIsMobile();

  // Auth
  const [currentAdmin,   setCurrentAdmin]   = useState(null);
  const [loginStep,      setLoginStep]      = useState("select");
  const [selectedAdmin,  setSelectedAdmin]  = useState(null);
  const [pwInput,        setPwInput]        = useState("");
  const [loginError,     setLoginError]     = useState("");

  // UI
  const [activeTab,      setActiveTab]      = useState("dashboard");
  const [showAI,         setShowAI]         = useState(false);
  const [toast,          setToast]          = useState(null);
  const [confirmDelete,  setConfirmDelete]  = useState(null); // {id, name, type:"product"|"transaction"}

  // Data — start empty, load from storage
  const [inventory,     setInventory]     = useState([]);
  const [transactions,  setTransactions]  = useState([]);
  const [storageReady,  setStorageReady]  = useState(false);

  // Modals
  const [showAddProduct,  setShowAddProduct]  = useState(false);
  const [showTransaction, setShowTransaction] = useState(false);
  const [newProduct,      setNewProduct]      = useState({name:"",category:CATEGORIES[0],quantity:"",unit:UNITS[0],pricePerUnit:"",minStock:""});
  const [newTx,           setNewTx]           = useState({type:"in",productId:"",quantity:"",note:"",date:new Date().toISOString().split("T")[0],time:new Date().toTimeString().slice(0,5)});
  const [filterCat,       setFilterCat]       = useState("Barchasi");
  const [search,          setSearch]          = useState("");

  // ── Load from storage on mount ──
  useEffect(()=>{
    (async()=>{
      const inv = await loadData(STORAGE_KEY_INV, DEFAULT_INVENTORY);
      const txs = await loadData(STORAGE_KEY_TX,  DEFAULT_TRANSACTIONS);
      setInventory(inv);
      setTransactions(txs);
      setStorageReady(true);
    })();
  },[]);

  // ── Auto-save whenever data changes ──
  useEffect(()=>{ if(storageReady) saveData(STORAGE_KEY_INV, inventory); },[inventory, storageReady]);
  useEffect(()=>{ if(storageReady) saveData(STORAGE_KEY_TX,  transactions); },[transactions, storageReady]);

  const showToast = (message, type="success") => { setToast({message,type}); };

  // ── Auth ──
  const handleLogin  = () => {
    if(pwInput===ADMINS[selectedAdmin].password){ setCurrentAdmin(selectedAdmin); }
    else { setLoginError("Parol noto'g'ri! Qayta urinib ko'ring."); }
  };
  const handleLogout = () => { setCurrentAdmin(null); setLoginStep("select"); setPwInput(""); setLoginError(""); setActiveTab("dashboard"); };

  // ── Add Product ──
  const handleAddProduct = () => {
    if(!newProduct.name||!newProduct.quantity||!newProduct.pricePerUnit) return;
    const p = {id:Date.now(),...newProduct,quantity:parseFloat(newProduct.quantity),pricePerUnit:parseFloat(newProduct.pricePerUnit),minStock:parseFloat(newProduct.minStock)||5,addedBy:ADMINS[currentAdmin].name,date:new Date().toISOString().split("T")[0],totalUsed:0,daysLeft:Math.round(parseFloat(newProduct.quantity)/5)};
    const tx = {id:Date.now()+1,type:"in",productId:p.id,productName:p.name,quantity:p.quantity,unit:p.unit,totalPrice:p.quantity*p.pricePerUnit,date:p.date,time:new Date().toTimeString().slice(0,5),adminName:ADMINS[currentAdmin].name,note:"Yangi mahsulot qo'shildi"};
    setInventory(prev=>[...prev,p]);
    setTransactions(prev=>[...prev,tx]);
    setNewProduct({name:"",category:CATEGORIES[0],quantity:"",unit:UNITS[0],pricePerUnit:"",minStock:""});
    setShowAddProduct(false);
    showToast(`"${p.name}" qo'shildi ✅`);
  };

  // ── Add Transaction ──
  const handleAddTx = () => {
    if(!newTx.productId||!newTx.quantity) return;
    const product = inventory.find(p=>p.id===parseInt(newTx.productId));
    if(!product) return;
    const qty = parseFloat(newTx.quantity);
    const tx  = {...newTx,id:Date.now(),productId:product.id,productName:product.name,quantity:qty,unit:product.unit,totalPrice:qty*product.pricePerUnit,adminName:ADMINS[currentAdmin].name};
    setTransactions(prev=>[...prev,tx]);
    setInventory(prev=>prev.map(p=>{
      if(p.id!==product.id) return p;
      const nq = newTx.type==="in"?p.quantity+qty:Math.max(0,p.quantity-qty);
      const nu = newTx.type==="out"?p.totalUsed+qty:p.totalUsed;
      const outCount = transactions.filter(t=>t.productId===p.id&&t.type==="out").length + (newTx.type==="out"?1:0);
      return {...p,quantity:nq,totalUsed:nu,daysLeft:Math.max(0,Math.round(nq/Math.max(nu/Math.max(outCount,1),0.5)))};
    }));
    setNewTx({type:"in",productId:"",quantity:"",note:"",date:new Date().toISOString().split("T")[0],time:new Date().toTimeString().slice(0,5)});
    setShowTransaction(false);
    showToast(`${newTx.type==="in"?"Kirim":"Chiqim"} saqlandi ✅`);
  };

  // ── DELETE PRODUCT ──
  const askDeleteProduct = (item) => setConfirmDelete({id:item.id, name:item.name, type:"product"});
  const confirmDeleteProduct = () => {
    const {id, name} = confirmDelete;
    setInventory(prev=>prev.filter(p=>p.id!==id));
    setTransactions(prev=>prev.filter(t=>t.productId!==id));
    setConfirmDelete(null);
    showToast(`"${name}" o'chirildi`, "error");
  };

  // ── DELETE TRANSACTION ──
  const askDeleteTx = (tx) => setConfirmDelete({id:tx.id, name:`${tx.productName} (${tx.quantity}${tx.unit})`, type:"transaction"});
  const confirmDeleteTx = () => {
    const {id, name} = confirmDelete;
    // reverse the quantity effect
    const tx = transactions.find(t=>t.id===id);
    if(tx){
      setInventory(prev=>prev.map(p=>{
        if(p.id!==tx.productId) return p;
        const nq = tx.type==="in" ? Math.max(0,p.quantity-tx.quantity) : p.quantity+tx.quantity;
        const nu = tx.type==="out" ? Math.max(0,p.totalUsed-tx.quantity) : p.totalUsed;
        const outCount = transactions.filter(t=>t.productId===p.id&&t.type==="out"&&t.id!==id).length;
        const nd = Math.max(0,Math.round(nq/Math.max(nu/Math.max(outCount,1),0.5)));
        return {...p,quantity:nq,totalUsed:nu,daysLeft:nd};
      }));
    }
    setTransactions(prev=>prev.filter(t=>t.id!==id));
    setConfirmDelete(null);
    showToast(`Operatsiya o'chirildi`, "error");
  };

  const filteredInventory = inventory.filter(item=>{
    const matchCat = filterCat==="Barchasi"||item.category===filterCat;
    const matchQ   = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat&&matchQ;
  });

  const stats = {
    total:    inventory.length,
    lowStock: inventory.filter(i=>i.quantity<=i.minStock).length,
    value:    inventory.reduce((s,i)=>s+i.quantity*i.pricePerUnit,0),
    todayIn:  transactions.filter(t=>t.type==="in"&&t.date===new Date().toISOString().split("T")[0]).reduce((s,t)=>s+t.totalPrice,0),
  };

  // ── Styles ──
  const C = {bg:"#0a0f1e",card:"#111827",border:"#1e293b",muted:"#64748b",text:"#f1f5f9",sub:"#94a3b8"};
  const adminColor  = currentAdmin ? ADMINS[currentAdmin].color : "#6366f1";
  const inputStyle  = {width:"100%",background:"#1e293b",border:"1px solid #334155",borderRadius:10,padding:"12px 14px",color:C.text,fontSize:14,outline:"none",boxSizing:"border-box"};
  const labelStyle  = {fontSize:12,color:C.sub,marginBottom:6,display:"block",fontWeight:500};
  const btnBase     = {padding:"12px 20px",borderRadius:10,border:"none",cursor:"pointer",fontWeight:600,fontSize:14,transition:"all .15s"};
  const badge       = (col)=>({display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:col+"22",color:col});
  const delBtn      = {background:"#ef444418",border:"1px solid #ef444433",borderRadius:8,padding:"5px 10px",cursor:"pointer",color:"#ef4444",fontSize:13,fontWeight:600,flexShrink:0};

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  if(!currentAdmin) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"system-ui,sans-serif"}}>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:56,marginBottom:8}}>🍔</div>
          <h1 style={{fontSize:26,fontWeight:800,color:C.text,margin:"0 0 6px"}}>FastFood Ombori</h1>
          <p style={{color:C.muted,fontSize:13,margin:0}}>Boshqaruv tizimi v3.0 — Ma'lumotlar doimiy saqlanadi</p>
        </div>

        {loginStep==="select" && (
          <div>
            <p style={{color:C.sub,fontSize:13,textAlign:"center",marginBottom:20}}>Qaysi admin sifatida kirasiz?</p>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {Object.entries(ADMINS).map(([key,adm])=>(
                <button key={key} onClick={()=>{setSelectedAdmin(key);setLoginStep("password");setLoginError("");setPwInput("");}}
                  style={{background:C.card,border:`2px solid ${adm.color}33`,borderRadius:16,padding:"18px 20px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,textAlign:"left",transition:"border-color .2s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=adm.color}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=adm.color+"33"}
                >
                  <div style={{width:50,height:50,borderRadius:"50%",background:`linear-gradient(135deg,${adm.color},${adm.color}99)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,color:"#fff",flexShrink:0}}>{adm.name[0]}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:16,color:C.text}}>{adm.name}</div>
                    <div style={{color:C.muted,fontSize:12}}>Administrator</div>
                  </div>
                  <div style={{color:adm.color,fontSize:22}}>›</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {loginStep==="password" && (
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:24}}>
            <button onClick={()=>setLoginStep("select")} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13,marginBottom:20,padding:0}}>← Orqaga</button>
            <div style={{textAlign:"center",marginBottom:24}}>
              <div style={{width:60,height:60,borderRadius:"50%",background:`linear-gradient(135deg,${ADMINS[selectedAdmin].color},${ADMINS[selectedAdmin].color}99)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:800,color:"#fff",margin:"0 auto 10px"}}>{ADMINS[selectedAdmin].name[0]}</div>
              <div style={{fontWeight:700,fontSize:17,color:C.text}}>{ADMINS[selectedAdmin].name}</div>
              <div style={{color:C.muted,fontSize:12}}>Parolni kiriting</div>
            </div>
            <input type="password" value={pwInput} onChange={e=>{setPwInput(e.target.value);setLoginError("");}} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Parol..." style={inputStyle}/>
            {loginError && <div style={{color:"#ef4444",fontSize:12,marginTop:8}}>{loginError}</div>}
            <button onClick={handleLogin} style={{...btnBase,width:"100%",marginTop:16,background:`linear-gradient(135deg,${ADMINS[selectedAdmin].color},${ADMINS[selectedAdmin].color}cc)`,color:"#fff"}}>Kirish</button>
          </div>
        )}
      </div>
    </div>
  );

  // ─── LOADING ──────────────────────────────────────────────────────────────
  if(!storageReady) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui",color:C.sub}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:12}}>⏳</div>
        <div>Ma'lumotlar yuklanmoqda...</div>
      </div>
    </div>
  );

  // ─── TAB CONTENTS ─────────────────────────────────────────────────────────

  const DashboardContent = () => (
    <div style={{paddingBottom:isMobile?90:20}}>
      {!isMobile && <h2 style={{margin:"0 0 20px",fontSize:22,fontWeight:800,color:C.text}}>Bosh sahifa</h2>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:16}}>
        {[
          {icon:"📦",label:"Mahsulotlar",value:stats.total,         color:"#6366f1"},
          {icon:"⚠️",label:"Kam qolgan", value:stats.lowStock,      color:"#f59e0b"},
          {icon:"💰",label:"Qiymat",      value:(stats.value/1000000).toFixed(1)+"M",color:"#22c55e"},
          {icon:"📥",label:"Bugungi kirim",value:(stats.todayIn/1000).toFixed(0)+"K",color:"#3b82f6"},
        ].map((s,i)=>(
          <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderLeft:`3px solid ${s.color}`,borderRadius:14,padding:"14px 16px"}}>
            <div style={{fontSize:24,marginBottom:6}}>{s.icon}</div>
            <div style={{fontSize:22,fontWeight:800,color:s.color}}>{s.value}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      {stats.lowStock>0 && (
        <div style={{background:"#f59e0b11",border:"1px solid #f59e0b44",borderRadius:12,padding:14,marginBottom:16}}>
          <div style={{fontWeight:700,color:"#f59e0b",fontSize:13,marginBottom:8}}>⚠️ Kam qolgan mahsulotlar</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {inventory.filter(i=>i.quantity<=i.minStock).map(item=>(
              <div key={item.id} style={{background:"#f59e0b22",border:"1px solid #f59e0b44",borderRadius:8,padding:"5px 10px",fontSize:12}}>
                {item.name}: <strong>{item.quantity} {item.unit}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        <button onClick={()=>setShowAddProduct(true)} style={{...btnBase,background:`linear-gradient(135deg,${adminColor},${adminColor}cc)`,color:"#fff",fontSize:13,padding:"13px 10px"}}>➕ Yangi mahsulot</button>
        <button onClick={()=>setShowTransaction(true)} style={{...btnBase,background:"#1e293b",color:C.text,border:"1px solid #334155",fontSize:13,padding:"13px 10px"}}>🔄 Kirim/Chiqim</button>
      </div>

      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 12px"}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:12,color:C.text}}>So'nggi operatsiyalar</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {transactions.slice(-5).reverse().map(tx=>(
            <div key={tx.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#1e293b",borderRadius:10}}>
              <div style={{fontSize:18,flexShrink:0}}>{tx.type==="in"?"📥":"📤"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:13,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tx.productName}</div>
                <div style={{fontSize:11,color:C.muted}}>{tx.date} · {tx.time}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{color:tx.type==="in"?"#22c55e":"#ef4444",fontWeight:700,fontSize:13}}>{tx.type==="in"?"+":"-"}{tx.quantity}{tx.unit}</div>
                <div style={{fontSize:11,color:C.muted}}>👤{tx.adminName}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const InventoryContent = () => (
    <div style={{paddingBottom:isMobile?90:20}}>
      {!isMobile && <h2 style={{margin:"0 0 16px",fontSize:22,fontWeight:800,color:C.text}}>Mahsulotlar</h2>}
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Qidirish..." style={{...inputStyle,flex:1,minWidth:120,padding:"10px 12px",fontSize:13}}/>
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{...inputStyle,width:"auto",minWidth:100,padding:"10px 12px",fontSize:13}}>
          <option value="Barchasi">Barchasi</option>
          {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={()=>setShowAddProduct(true)} style={{...btnBase,background:`linear-gradient(135deg,${adminColor},${adminColor}cc)`,color:"#fff",padding:"10px 14px",fontSize:13}}>➕</button>
      </div>

      {inventory.length===0 && (
        <div style={{textAlign:"center",padding:"40px 20px",color:C.muted}}>
          <div style={{fontSize:40,marginBottom:12}}>📦</div>
          <div style={{fontSize:15,fontWeight:600,color:C.sub}}>Ombor bo'sh</div>
          <div style={{fontSize:13,marginTop:6}}>Birinchi mahsulotni qo'shing</div>
        </div>
      )}

      {isMobile ? (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filteredInventory.map(item=>{
            const isLow = item.quantity<=item.minStock;
            const dayColor = item.daysLeft<3?"#ef4444":item.daysLeft<7?"#f59e0b":"#22c55e";
            return (
              <div key={item.id} style={{background:C.card,border:`1px solid ${isLow?"#ef444433":C.border}`,borderRadius:14,padding:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:15,color:C.text}}>{item.name}</div>
                    <div style={{marginTop:4,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                      <span style={badge("#6366f1")}>{item.category}</span>
                      <span style={badge(ADMINS[item.addedBy?.toLowerCase()]?.color||"#64748b")}>👤{item.addedBy}</span>
                    </div>
                  </div>
                  <div style={{textAlign:"right",marginLeft:10}}>
                    <div style={{fontWeight:800,fontSize:17,color:isLow?"#ef4444":"#22c55e"}}>{item.quantity} {item.unit}</div>
                    <div style={{...badge(isLow?"#ef4444":"#22c55e"),marginTop:4}}>{isLow?"⚠ Kam":"✓ OK"}</div>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
                  <div style={{background:"#1e293b",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                    <div style={{fontSize:11,color:C.muted}}>Narx</div>
                    <div style={{fontSize:12,fontWeight:600,color:C.text}}>{(item.pricePerUnit/1000).toFixed(0)}K</div>
                  </div>
                  <div style={{background:"#1e293b",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                    <div style={{fontSize:11,color:C.muted}}>~Kun</div>
                    <div style={{fontSize:12,fontWeight:700,color:dayColor}}>{item.daysLeft}</div>
                  </div>
                  <div style={{background:"#1e293b",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                    <div style={{fontSize:11,color:C.muted}}>Qiymat</div>
                    <div style={{fontSize:11,fontWeight:600,color:C.text}}>{((item.quantity*item.pricePerUnit)/1000).toFixed(0)}K</div>
                  </div>
                </div>
                <button onClick={()=>askDeleteProduct(item)} style={{...delBtn,width:"100%",textAlign:"center",display:"block"}}>🗑️ Mahsulotni o'chirish</button>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${C.border}`}}>
                  {["Mahsulot","Kategoriya","Miqdor","Narx","Umumiy","Holat","~Kun","Admin",""].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"12px 14px",fontSize:12,color:C.muted,fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map(item=>{
                  const isLow=item.quantity<=item.minStock;
                  const dayColor=item.daysLeft<3?"#ef4444":item.daysLeft<7?"#f59e0b":"#22c55e";
                  return (
                    <tr key={item.id} style={{borderBottom:`1px solid ${C.border}44`}}>
                      <td style={{padding:"12px 14px",fontWeight:600,fontSize:14,color:C.text}}>{item.name}</td>
                      <td style={{padding:"12px 14px"}}><span style={badge("#6366f1")}>{item.category}</span></td>
                      <td style={{padding:"12px 14px",fontWeight:700,color:isLow?"#ef4444":"#22c55e"}}>{item.quantity} {item.unit}</td>
                      <td style={{padding:"12px 14px",color:C.sub,fontSize:13}}>{item.pricePerUnit.toLocaleString()}</td>
                      <td style={{padding:"12px 14px",fontWeight:600,color:C.text}}>{(item.quantity*item.pricePerUnit).toLocaleString()}</td>
                      <td style={{padding:"12px 14px"}}><span style={badge(isLow?"#ef4444":"#22c55e")}>{isLow?"⚠ Kam":"✓ OK"}</span></td>
                      <td style={{padding:"12px 14px",color:dayColor,fontWeight:700}}>{item.daysLeft}</td>
                      <td style={{padding:"12px 14px"}}><span style={badge(ADMINS[item.addedBy?.toLowerCase()]?.color||"#64748b")}>👤{item.addedBy}</span></td>
                      <td style={{padding:"12px 14px"}}>
                        <button onClick={()=>askDeleteProduct(item)} style={delBtn}>🗑️ O'chir</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const TransactionsContent = () => (
    <div style={{paddingBottom:isMobile?90:20}}>
      {!isMobile && <h2 style={{margin:"0 0 16px",fontSize:22,fontWeight:800,color:C.text}}>Operatsiyalar</h2>}
      <button onClick={()=>setShowTransaction(true)} style={{...btnBase,background:`linear-gradient(135deg,${adminColor},${adminColor}cc)`,color:"#fff",marginBottom:14,fontSize:13}}>➕ Yangi operatsiya</button>
      {transactions.length===0 && (
        <div style={{textAlign:"center",padding:"40px 20px",color:C.muted}}>
          <div style={{fontSize:40,marginBottom:12}}>🔄</div>
          <div style={{fontSize:14}}>Hali operatsiya yo'q</div>
        </div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {[...transactions].reverse().map(tx=>{
          const adm=Object.values(ADMINS).find(a=>a.name===tx.adminName);
          return (
            <div key={tx.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:14}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:44,height:44,borderRadius:"50%",background:tx.type==="in"?"#22c55e22":"#ef444422",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{tx.type==="in"?"📥":"📤"}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14,color:C.text}}>{tx.productName}</div>
                  <div style={{fontSize:12,color:C.muted,marginTop:2}}>{tx.date} · {tx.time}{tx.note?` · ${tx.note}`:""}</div>
                  <div style={{...badge(adm?.color||"#64748b"),marginTop:4}}>👤{tx.adminName}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                  <div style={{color:tx.type==="in"?"#22c55e":"#ef4444",fontWeight:800,fontSize:15}}>{tx.type==="in"?"+":"-"}{tx.quantity}{tx.unit}</div>
                  <div style={{fontSize:11,color:C.muted}}>{(tx.totalPrice/1000).toFixed(0)}K so'm</div>
                  <button onClick={()=>askDeleteTx(tx)} style={{...delBtn,fontSize:11,padding:"4px 8px"}}>🗑️ O'chir</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const StatisticsContent = () => (
    <div style={{paddingBottom:isMobile?90:20}}>
      {!isMobile && <h2 style={{margin:"0 0 16px",fontSize:22,fontWeight:800,color:C.text}}>Statistika</h2>}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",marginBottom:14}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:14,color:C.text}}>🔥 Ko'p ishlatiladigan mahsulotlar</div>
        {inventory.length===0 ? <div style={{color:C.muted,fontSize:13}}>Ma'lumot yo'q</div> :
          [...inventory].sort((a,b)=>b.totalUsed-a.totalUsed).map((item,i)=>{
            const max=inventory.reduce((m,x)=>Math.max(m,x.totalUsed),1);
            return (
              <div key={item.id} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <div style={{fontSize:13,fontWeight:600,color:C.text}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}.`} {item.name}</div>
                  <div style={{fontSize:12,color:C.sub}}>{item.totalUsed} {item.unit}</div>
                </div>
                <div style={{height:7,background:"#1e293b",borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${(item.totalUsed/max)*100}%`,background:i===0?"#f59e0b":i===1?"#94a3b8":i===2?"#b45309":adminColor,borderRadius:4}}/>
                </div>
              </div>
            );
          })
        }
      </div>

      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",marginBottom:14}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:12,color:C.text}}>👥 Admin faolligi</div>
        {Object.entries(ADMINS).map(([key,adm])=>{
          const count=transactions.filter(t=>t.adminName===adm.name).length;
          const total=transactions.filter(t=>t.adminName===adm.name).reduce((s,t)=>s+t.totalPrice,0);
          return (
            <div key={key} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,${adm.color},${adm.color}99)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#fff",flexShrink:0}}>{adm.name[0]}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,color:C.text}}>{adm.name}</div>
                <div style={{fontSize:12,color:C.muted}}>{count} ta operatsiya</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontWeight:700,color:adm.color,fontSize:15}}>{(total/1000000).toFixed(2)} mln</div>
                <div style={{fontSize:11,color:C.muted}}>jami aylanma</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px"}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:12,color:C.text}}>⏳ Yetishi taxmini</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8}}>
          {[...inventory].sort((a,b)=>a.daysLeft-b.daysLeft).map(item=>{
            const col=item.daysLeft<3?"#ef4444":item.daysLeft<7?"#f59e0b":"#22c55e";
            return (
              <div key={item.id} style={{background:col+"11",border:`1px solid ${col}33`,borderRadius:10,padding:12}}>
                <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                <div style={{fontSize:24,fontWeight:800,color:col}}>{item.daysLeft}</div>
                <div style={{fontSize:11,color:C.muted}}>kun qoldi</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const TABS = [
    {key:"dashboard",   icon:"📊",label:"Bosh"},
    {key:"inventory",   icon:"📦",label:"Mahsulot"},
    {key:"transactions",icon:"🔄",label:"Operatsiya"},
    {key:"statistics",  icon:"📈",label:"Statistika"},
  ];

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"system-ui,sans-serif",color:C.text}}>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onHide={()=>setToast(null)}/>}

      {/* Confirm Dialog */}
      {confirmDelete && (
        <ConfirmDialog
          title={confirmDelete.type==="product"?"Mahsulotni o'chirish?":"Operatsiyani o'chirish?"}
          message={confirmDelete.type==="product"
            ? `"${confirmDelete.name}" va unga bog'liq barcha operatsiyalar o'chiriladi. Bu amalni qaytarib bo'lmaydi!`
            : `"${confirmDelete.name}" operatsiyasi o'chiriladi va ombordagi miqdor qayta hisoblanadi.`}
          danger
          onConfirm={confirmDelete.type==="product" ? confirmDeleteProduct : confirmDeleteTx}
          onCancel={()=>setConfirmDelete(null)}
        />
      )}

      {/* Header */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:isMobile?"12px 14px":"14px 24px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:100}}>
        <div style={{fontSize:isMobile?24:28}}>🍔</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:isMobile?14:16,color:C.text}}>FastFood Ombori</div>
          {!isMobile && <div style={{fontSize:11,color:C.muted}}>Boshqaruv tizimi — Ma'lumotlar doimiy saqlanadi 💾</div>}
        </div>
        <button onClick={()=>setShowAI(true)} style={{...btnBase,background:showAI?"linear-gradient(135deg,#6366f1,#8b5cf6)":"#1e293b",color:C.text,padding:isMobile?"8px 10px":"8px 14px",fontSize:isMobile?11:12}}>🤖{!isMobile&&" AI Yordam"}</button>
        <div style={{display:"flex",alignItems:"center",gap:6,background:"#1e293b",padding:"6px 12px",borderRadius:10,border:`1px solid ${adminColor}44`}}>
          <div style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${adminColor},${adminColor}99)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800}}>{ADMINS[currentAdmin].name[0]}</div>
          {!isMobile && <span style={{fontSize:13,fontWeight:600,color:adminColor}}>{ADMINS[currentAdmin].name}</span>}
        </div>
        <button onClick={handleLogout} style={{...btnBase,background:"#1e293b",color:"#ef4444",padding:isMobile?"8px 10px":"8px 14px",fontSize:isMobile?11:12}}>⏏{!isMobile&&" Chiqish"}</button>
      </div>

      {/* Desktop layout */}
      {!isMobile ? (
        <div style={{display:"flex",maxWidth:1400,margin:"0 auto",padding:20,gap:20}}>
          <div style={{width:210,flexShrink:0}}>
            <nav style={{display:"flex",flexDirection:"column",gap:6,position:"sticky",top:80}}>
              {TABS.map(tab=>(
                <button key={tab.key} onClick={()=>setActiveTab(tab.key)} style={{...btnBase,textAlign:"left",padding:"12px 16px",background:activeTab===tab.key?`linear-gradient(135deg,${adminColor}22,${adminColor}11)`:"transparent",color:activeTab===tab.key?adminColor:C.muted,border:activeTab===tab.key?`1px solid ${adminColor}44`:"1px solid transparent",display:"flex",alignItems:"center",gap:10,fontSize:13}}>
                  <span style={{fontSize:17}}>{tab.icon}</span><span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
          <div style={{flex:1,minWidth:0}}>
            {activeTab==="dashboard"    && <DashboardContent/>}
            {activeTab==="inventory"    && <InventoryContent/>}
            {activeTab==="transactions" && <TransactionsContent/>}
            {activeTab==="statistics"   && <StatisticsContent/>}
          </div>
          {showAI && (
            <div style={{width:340,flexShrink:0,height:"calc(100vh - 100px)",position:"sticky",top:80}}>
              <AIAssistant inventory={inventory} transactions={transactions} onClose={()=>setShowAI(false)} isMobile={false}/>
            </div>
          )}
        </div>
      ) : (
        /* Mobile layout */
        <div style={{padding:"12px 12px 0"}}>
          <div style={{fontWeight:800,fontSize:18,color:C.text,marginBottom:12}}>
            {TABS.find(t=>t.key===activeTab)?.icon} {TABS.find(t=>t.key===activeTab)?.label}
          </div>
          {activeTab==="dashboard"    && <DashboardContent/>}
          {activeTab==="inventory"    && <InventoryContent/>}
          {activeTab==="transactions" && <TransactionsContent/>}
          {activeTab==="statistics"   && <StatisticsContent/>}
        </div>
      )}

      {/* Mobile bottom nav */}
      {isMobile && (
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.card,borderTop:`1px solid ${C.border}`,display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
          {TABS.map(tab=>(
            <button key={tab.key} onClick={()=>setActiveTab(tab.key)} style={{flex:1,background:"none",border:"none",cursor:"pointer",padding:"10px 4px 12px",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <span style={{fontSize:20}}>{tab.icon}</span>
              <span style={{fontSize:10,fontWeight:600,color:activeTab===tab.key?adminColor:C.muted}}>{tab.label}</span>
              {activeTab===tab.key && <div style={{width:4,height:4,borderRadius:"50%",background:adminColor,marginTop:1}}/>}
            </button>
          ))}
        </div>
      )}

      {/* Mobile AI fullscreen */}
      {showAI && isMobile && <AIAssistant inventory={inventory} transactions={transactions} onClose={()=>setShowAI(false)} isMobile={true}/>}

      {/* Modal: Add Product */}
      {showAddProduct && (
        <Modal onClose={()=>setShowAddProduct(false)} maxWidth={500}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
            <div style={{fontWeight:800,fontSize:17,color:C.text}}>➕ Yangi mahsulot</div>
            <button onClick={()=>setShowAddProduct(false)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:22,padding:"2px 6px"}}>✕</button>
          </div>
          <div style={{display:"grid",gap:12}}>
            {[{label:"Mahsulot nomi *",key:"name",type:"text",placeholder:"Masalan: Mol go'shti"},{label:"Miqdori *",key:"quantity",type:"number",placeholder:"0"},{label:"Narx (so'm/birlik) *",key:"pricePerUnit",type:"number",placeholder:"0"},{label:"Minimal zaxira",key:"minStock",type:"number",placeholder:"5"}].map(f=>(
              <div key={f.key}>
                <label style={labelStyle}>{f.label}</label>
                <input type={f.type} value={newProduct[f.key]} onChange={e=>setNewProduct(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder} style={inputStyle}/>
              </div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <label style={labelStyle}>Kategoriya</label>
                <select value={newProduct.category} onChange={e=>setNewProduct(p=>({...p,category:e.target.value}))} style={inputStyle}>
                  {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Birlik</label>
                <select value={newProduct.unit} onChange={e=>setNewProduct(p=>({...p,unit:e.target.value}))} style={inputStyle}>
                  {UNITS.map(u=><option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div style={{marginTop:14,background:`${adminColor}11`,border:`1px solid ${adminColor}33`,borderRadius:10,padding:"10px 12px",fontSize:12,color:C.sub}}>
            👤 <strong style={{color:adminColor}}>{ADMINS[currentAdmin].name}</strong> tomonidan qo'shiladi
          </div>
          <div style={{display:"flex",gap:10,marginTop:16}}>
            <button onClick={()=>setShowAddProduct(false)} style={{...btnBase,flex:1,background:"#1e293b",color:C.text,fontSize:13}}>Bekor</button>
            <button onClick={handleAddProduct} style={{...btnBase,flex:2,background:`linear-gradient(135deg,${adminColor},${adminColor}cc)`,color:"#fff",fontSize:13}}>Saqlash</button>
          </div>
        </Modal>
      )}

      {/* Modal: Transaction */}
      {showTransaction && (
        <Modal onClose={()=>setShowTransaction(false)} maxWidth={460}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
            <div style={{fontWeight:800,fontSize:17,color:C.text}}>🔄 Kirim / Chiqim</div>
            <button onClick={()=>setShowTransaction(false)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:22,padding:"2px 6px"}}>✕</button>
          </div>
          <div style={{display:"flex",background:"#1e293b",borderRadius:10,padding:4,marginBottom:14}}>
            {[["in","📥 Kirim"],["out","📤 Chiqim"]].map(([type,label])=>(
              <button key={type} onClick={()=>setNewTx(t=>({...t,type}))} style={{flex:1,...btnBase,padding:"10px",background:newTx.type===type?(type==="in"?"#22c55e":"#ef4444"):"transparent",color:newTx.type===type?"#fff":C.muted,fontSize:13}}>
                {label}
              </button>
            ))}
          </div>
          <div style={{display:"grid",gap:12}}>
            <div>
              <label style={labelStyle}>Mahsulot *</label>
              <select value={newTx.productId} onChange={e=>setNewTx(t=>({...t,productId:e.target.value}))} style={inputStyle}>
                <option value="">Tanlang...</option>
                {inventory.map(p=><option key={p.id} value={p.id}>{p.name} ({p.quantity} {p.unit})</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Miqdori *</label>
              <input type="number" value={newTx.quantity} onChange={e=>setNewTx(t=>({...t,quantity:e.target.value}))} placeholder="0" style={inputStyle}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={labelStyle}>Sana</label><input type="date" value={newTx.date} onChange={e=>setNewTx(t=>({...t,date:e.target.value}))} style={inputStyle}/></div>
              <div><label style={labelStyle}>Vaqt</label><input type="time" value={newTx.time} onChange={e=>setNewTx(t=>({...t,time:e.target.value}))} style={inputStyle}/></div>
            </div>
            <div>
              <label style={labelStyle}>Izoh</label>
              <input value={newTx.note} onChange={e=>setNewTx(t=>({...t,note:e.target.value}))} placeholder="Ixtiyoriy..." style={inputStyle}/>
            </div>
          </div>
          <div style={{marginTop:14,background:`${adminColor}11`,border:`1px solid ${adminColor}33`,borderRadius:10,padding:"10px 12px",fontSize:12,color:C.sub}}>
            👤 <strong style={{color:adminColor}}>{ADMINS[currentAdmin].name}</strong> bajarmoqda
          </div>
          <div style={{display:"flex",gap:10,marginTop:16}}>
            <button onClick={()=>setShowTransaction(false)} style={{...btnBase,flex:1,background:"#1e293b",color:C.text,fontSize:13}}>Bekor</button>
            <button onClick={handleAddTx} style={{...btnBase,flex:2,background:`linear-gradient(135deg,${adminColor},${adminColor}cc)`,color:"#fff",fontSize:13}}>Saqlash</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
