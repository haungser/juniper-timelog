import { useState, useEffect, useRef } from "react";

/* ── Brand ── */
const B = {
  green:"#2d4a3e", greenDark:"#1f3529", greenMid:"#3a5c4e",
  gold:"#c9b882", goldDim:"#a89660", goldPale:"#e8dfc0",
  cream:"#f5f0e8", red:"#c97a7a",
};

/* ── Fonts ── */
const serif   = {fontFamily:"'Cormorant Garamond',Georgia,serif"};
const serifSC = {fontFamily:"'Cormorant SC',Georgia,serif"};
const script  = {fontFamily:"'Great Vibes',cursive"};
const sans    = {fontFamily:"'Jost',sans-serif"};

/* ── Default data ── */
const DEFAULT_CLIENTS = [
  { id:1, name:"Blackstone",   rate:750, color:"#8fa888" },
  { id:2, name:"Apollo",       rate:750, color:"#a8967a" },
  { id:3, name:"Ares Capital", rate:750, color:"#7a8ea8" },
  { id:4, name:"KKR Credit",   rate:750, color:"#a87a8e" },
  { id:5, name:"Juniper Studio", rate:200, color:"#c9b882" },
  { id:6, name:"Personal",     rate:0,   color:"#636366" },
];
const DEFAULT_MATTERS = [
  "ASC 820 Valuation","Credit Monitoring","Deal Screening",
  "Waterfall Model","CIM Review","Covenant Analysis","General Consulting",
];
const SEED_ENTRIES = [
  {id:1,clientId:1,matter:"ASC 820 Valuation", hours:3.5,rate:750,date:new Date(Date.now()-86400000).toISOString(),   status:"unbilled",note:"Q1 Level 3 fair value memo"},
  {id:2,clientId:2,matter:"Waterfall Model",   hours:2.0,rate:750,date:new Date(Date.now()-2*86400000).toISOString(), status:"billed",  note:"Senior/mezz tranche waterfall"},
  {id:3,clientId:3,matter:"Covenant Analysis", hours:1.5,rate:750,date:new Date(Date.now()-3*86400000).toISOString(), status:"paid",    note:"EBITDA maintenance covenants"},
  {id:4,clientId:1,matter:"Credit Monitoring", hours:1.0,rate:750,date:new Date(Date.now()-8*86400000).toISOString(), status:"paid",    note:"Monthly portfolio review"},
  {id:5,clientId:4,matter:"Deal Screening",    hours:2.5,rate:750,date:new Date(Date.now()-10*86400000).toISOString(),status:"billed",  note:"New direct lending opportunity"},
];

/* ── Helpers ── */
const fmt  = d => { const h=Math.floor(d),m=Math.round((d-h)*60); return h&&m?`${h}h ${m}m`:h?`${h}h`:`${m}m`; };
const fmtD = iso => { const d=new Date(iso),diff=Math.floor((Date.now()-d)/86400000); return diff===0?"Today":diff===1?"Yesterday":d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:diff>300?"numeric":undefined}); };
const fmtMoney = n => "$"+n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const sum  = arr => arr.reduce((s,e)=>s+e.hours,0);
const SC   = {unbilled:"#c9a84c",billed:"#6aaa8a",paid:"#7a9e8a"};
const SL   = {unbilled:"Unbilled",billed:"Billed",paid:"Paid"};
const STATUS_ORDER = ["unbilled","billed","paid"];

const weekOf = iso => { const d=new Date(iso); d.setHours(0,0,0,0); d.setDate(d.getDate()-d.getDay()); return d.toISOString().split("T")[0]; };
const monthOf = iso => iso.slice(0,7);

/* ── SVG decorations ── */
const Sprig = ({style}) => (
  <svg viewBox="0 0 120 80" fill="none" style={style}>
    <path d="M10 70 Q40 20 80 10" stroke={B.gold} strokeWidth="1.5" strokeOpacity=".3" fill="none"/>
    <path d="M30 55 Q20 35 35 25" stroke={B.gold} strokeWidth="1" strokeOpacity=".25" fill="none"/>
    <path d="M50 42 Q38 28 50 18" stroke={B.gold} strokeWidth="1" strokeOpacity=".25" fill="none"/>
    <path d="M65 32 Q55 20 65 12" stroke={B.gold} strokeWidth="1" strokeOpacity=".2" fill="none"/>
    <ellipse cx="35" cy="24" rx="8" ry="4" fill={B.gold} fillOpacity=".1" transform="rotate(-30 35 24)"/>
    <ellipse cx="51" cy="17" rx="7" ry="3.5" fill={B.gold} fillOpacity=".1" transform="rotate(-20 51 17)"/>
    <ellipse cx="66" cy="11" rx="6" ry="3" fill={B.gold} fillOpacity=".08" transform="rotate(-15 66 11)"/>
  </svg>
);
const GoldLine = ({my=10}) => (
  <div style={{display:"flex",alignItems:"center",gap:8,margin:`${my}px 0`}}>
    <div style={{flex:1,height:1,background:`linear-gradient(to right,transparent,${B.gold}50)`}}/>
    <div style={{width:4,height:4,borderRadius:"50%",background:B.gold,opacity:.5}}/>
    <div style={{flex:1,height:1,background:`linear-gradient(to left,transparent,${B.gold}50)`}}/>
  </div>
);

/* ── Micro components ── */
function Field({label,children,last}){
  return(
    <div style={{padding:"13px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:last?"none":`1px solid ${B.gold}18`}}>
      <span style={{...sans,fontSize:12,color:B.goldDim,letterSpacing:.5}}>{label}</span>
      <div style={{color:B.goldPale}}>{children}</div>
    </div>
  );
}
function TabBtn({label,icon,active,onClick}){
  return(
    <button onClick={onClick} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 8px"}}>
      {icon}
      <span style={{...sans,fontSize:9,fontWeight:500,color:active?B.gold:B.goldDim,letterSpacing:1,textTransform:"uppercase",transition:"color .2s"}}>{label}</span>
    </button>
  );
}
function MicIcon({c}){return(<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="9" y1="23" x2="15" y2="23"/></svg>);}
function LogIcon({a}){return(<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={a?B.gold:B.goldDim} strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>);}
function PlusIcon({a}){return(<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={a?B.gold:B.goldDim} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>);}
function ChartIcon({a}){return(<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={a?B.gold:B.goldDim} strokeWidth="1.8" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>);}
function SettingsIcon({a}){return(<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={a?B.gold:B.goldDim} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>);}

/* ══════════════════════════════════════════ */
export default function App() {
  const [clients,  setClients]  = useState(() => { try{const s=localStorage.getItem("js_clients"); return s?JSON.parse(s):DEFAULT_CLIENTS;}catch{return DEFAULT_CLIENTS;}});
  const [matters,  setMatters]  = useState(() => { try{const s=localStorage.getItem("js_matters"); return s?JSON.parse(s):DEFAULT_MATTERS;}catch{return DEFAULT_MATTERS;}});
  const [entries,  setEntries]  = useState(() => { try{const s=localStorage.getItem("js_entries"); return s?JSON.parse(s):SEED_ENTRIES;}catch{return SEED_ENTRIES;}});
  const [view,     setView]     = useState("log");
  const [selected, setSelected] = useState(null);
  const [listening,setListening]= useState(false);
  const [voiceText,setVoiceText]= useState("");
  const [toast,    setToast]    = useState(null);
  const [filter,   setFilter]   = useState("all");
  const [summaryMode,setSummaryMode] = useState("week");
  const [form, setForm] = useState({clientId:1,matter:DEFAULT_MATTERS[0],hours:"",rate:"750",note:"",date:new Date().toISOString().split("T")[0]});
  const [invoiceModal, setInvoiceModal] = useState(null);
  const [invoiceNum,   setInvoiceNum]   = useState(() => { try{return parseInt(localStorage.getItem("js_invnum")||"1001");}catch{return 1001;}});
  const [editingClient, setEditingClient] = useState(null);
  const [newMatterText, setNewMatterText] = useState("");

  const recRef = useRef(null);
  const nid    = useRef(entries.length ? Math.max(...entries.map(e=>e.id))+1 : 1);

  useEffect(()=>{localStorage.setItem("js_clients",JSON.stringify(clients));},[clients]);
  useEffect(()=>{localStorage.setItem("js_matters",JSON.stringify(matters));},[matters]);
  useEffect(()=>{localStorage.setItem("js_entries",JSON.stringify(entries));},[entries]);

  const toast_ = (msg,type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };
  const clientById = id => clients.find(c=>c.id===id) || {name:"Unknown",rate:0,color:"#888"};
  const clientRate = id => clientById(id).rate;

  const parseVoice = t => {
    const l=t.toLowerCase();
    let hours=null,clientId=null,matter=null;
    const hm=l.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/); if(hm)hours=parseFloat(hm[1]);
    if(/half\s*(?:an?\s*)?hour/.test(l))hours=0.5;
    clients.forEach(c=>{ if(l.includes(c.name.toLowerCase()))clientId=c.id; });
    matters.forEach(m=>{ if(l.includes(m.toLowerCase().split(" ")[0]))matter=m; });
    return{hours,clientId,matter};
  };

  const startVoice = () => {
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){toast_("Voice not supported","err");return;}
    const rec=new SR(); rec.lang="en-US"; rec.interimResults=false;
    rec.onstart=()=>setListening(true);
    rec.onresult=e=>{
      const t=e.results[0][0].transcript; setVoiceText(t);
      const p=parseVoice(t);
      const cid=p.clientId||form.clientId;
      setForm(f=>({...f,hours:p.hours?String(p.hours):f.hours,clientId:cid,matter:p.matter||f.matter,rate:String(clientRate(cid)),note:t}));
      setView("add"); setListening(false);
    };
    rec.onerror=()=>{setListening(false);toast_("Voice capture failed","err");};
    rec.onend=()=>setListening(false);
    recRef.current=rec; rec.start();
  };

  const save = () => {
    if(!form.hours||isNaN(parseFloat(form.hours))){toast_("Enter valid hours","err");return;}
    const e={id:nid.current++,clientId:form.clientId,matter:form.matter,hours:parseFloat(form.hours),rate:parseFloat(form.rate)||0,date:new Date(form.date).toISOString(),status:"unbilled",note:form.note};
    setEntries(p=>[e,...p]);
    setForm({clientId:clients[0].id,matter:matters[0],hours:"",rate:String(clients[0].rate),note:"",date:new Date().toISOString().split("T")[0]});
    setVoiceText(""); setView("log");
    toast_(`${fmt(e.hours)} logged for ${clientById(e.clientId).name}`);
  };

  const cycleStatus = id => { setEntries(p=>p.map(e=>e.id===id?{...e,status:STATUS_ORDER[(STATUS_ORDER.indexOf(e.status)+1)%3]}:e)); };
  const del = id => { setEntries(p=>p.filter(e=>e.id!==id)); setView("log"); toast_("Entry removed"); };

  const exportCSV = () => {
    const rows=[["Date","Client","Matter","Hours","Rate","Amount","Status","Notes"]];
    entries.forEach(e=>{
      rows.push([new Date(e.date).toLocaleDateString("en-US"),clientById(e.clientId).name,e.matter,e.hours,e.rate,(e.hours*e.rate).toFixed(2),e.status,`"${(e.note||"").replace(/"/g,'""')}"`]);
    });
    const csv=rows.map(r=>r.join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
    a.download=`juniper-timelog-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    toast_("CSV exported");
  };

  const openInvoice = clientId => {
    const inv=entries.filter(e=>e.clientId===clientId&&e.status==="unbilled");
    if(!inv.length){toast_("No unbilled entries for this client","err");return;}
    setInvoiceModal({clientId,entries:inv});
  };

  const printInvoice = () => {
    window.print();
    const ids=invoiceModal.entries.map(e=>e.id);
    setTimeout(()=>{
      setEntries(p=>p.map(e=>ids.includes(e.id)?{...e,status:"billed"}:e));
      const n=invoiceNum+1; setInvoiceNum(n); localStorage.setItem("js_invnum",String(n));
      setInvoiceModal(null); toast_("Entries marked as Billed");
    },500);
  };

  const filtered    = filter==="all" ? entries : entries.filter(e=>e.status===filter);
  const unbilledAmt = entries.filter(e=>e.status==="unbilled").reduce((s,e)=>s+e.hours*e.rate,0);
  const thisWeek    = entries.filter(e=>(Date.now()-new Date(e.date))<7*86400000);

  const buildSummaries = mode => {
    const groups={};
    entries.forEach(e=>{
      const key=mode==="week"?weekOf(e.date):monthOf(e.date);
      if(!groups[key])groups[key]={key,entries:[],hours:0,amount:0};
      groups[key].entries.push(e); groups[key].hours+=e.hours; groups[key].amount+=e.hours*e.rate;
    });
    return Object.values(groups).sort((a,b)=>b.key.localeCompare(a.key));
  };
  const summaries = buildSummaries(summaryMode);

  const formatPeriodLabel = (key,mode) => {
    if(mode==="month"){const [y,m]=key.split("-");return new Date(parseInt(y),parseInt(m)-1,1).toLocaleDateString("en-US",{month:"long",year:"numeric"});}
    const d=new Date(key),end=new Date(d); end.setDate(end.getDate()+6);
    return `${d.toLocaleDateString("en-US",{month:"short",day:"numeric"})} – ${end.toLocaleDateString("en-US",{month:"short",day:"numeric"})}`;
  };

  return(
    <div style={{...sans,background:"#111",minHeight:"100vh",display:"flex",justifyContent:"center",alignItems:"center"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Cormorant+SC:wght@300;400;500&family=Great+Vibes&family=Jost:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;}
        select option{background:${B.greenDark};color:${B.goldPale};}
        input[type=date]::-webkit-calendar-picker-indicator{filter:invert(.6) sepia(1) saturate(.4);}
        input[type=color]{-webkit-appearance:none;border:none;padding:0;background:none;cursor:pointer;}
        input[type=color]::-webkit-color-swatch-wrapper{padding:0;}
        input[type=color]::-webkit-color-swatch{border:1px solid ${B.gold}44;border-radius:4px;}
        ::-webkit-scrollbar{display:none;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes ring{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.14)}}
        @keyframes shimmer{0%,100%{opacity:.6}50%{opacity:1}}
        .card{transition:transform .15s,box-shadow .15s;}
        .card:hover{transform:translateY(-1px);box-shadow:0 6px 24px rgba(0,0,0,.35);}
        textarea::placeholder,input::placeholder{color:${B.goldDim}66;}
        @media print{body>*:not(#invoice-print){display:none!important;}#invoice-print{display:block!important;position:fixed;inset:0;background:#fff;z-index:9999;padding:48px;color:#1f3529;}}
        #invoice-print{display:none;}
      `}</style>

      <div style={{width:390,height:844,background:B.greenDark,borderRadius:54,overflow:"hidden",position:"relative",boxShadow:`0 50px 130px rgba(0,0,0,.95),0 0 0 1px ${B.greenMid},inset 0 0 0 1px ${B.gold}22`}}>
        <div style={{position:"absolute",top:12,left:"50%",transform:"translateX(-50%)",width:120,height:34,background:"#000",borderRadius:20,zIndex:100}}/>
        <div style={{position:"absolute",top:17,left:28,right:28,display:"flex",justifyContent:"space-between",alignItems:"center",zIndex:99}}>
          <span style={{...sans,fontSize:15,fontWeight:500,color:B.goldPale}}>9:41</span>
          <div style={{display:"flex",gap:5,alignItems:"center"}}>
            <svg width="17" height="11" viewBox="0 0 17 12" fill={B.goldPale}><rect x="0" y="4" width="3" height="8" rx="1"/><rect x="4.5" y="2.5" width="3" height="9.5" rx="1"/><rect x="9" y="1" width="3" height="11" rx="1"/><rect x="13.5" y="0" width="3" height="12" rx="1"/></svg>
            <svg width="16" height="11" viewBox="0 0 16 12" fill={B.goldPale}><path d="M8 2.4C5.6 2.4 3.4 3.4 1.8 5L0 3.2C2.1 1.2 4.9 0 8 0s5.9 1.2 8 3.2L14.2 5C12.6 3.4 10.4 2.4 8 2.4z"/><path d="M8 6.4c-1.5 0-2.8.6-3.8 1.5L2.4 6.1C3.8 4.8 5.8 4 8 4s4.2.8 5.6 2.1l-1.8 1.8C10.8 7 9.5 6.4 8 6.4z"/><circle cx="8" cy="10" r="2"/></svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill={B.goldPale}><rect x="0" y="1" width="21" height="10" rx="3.5" stroke={B.goldPale} strokeWidth="1" fill="none"/><rect x="1.5" y="2.5" width="15" height="7" rx="2" fill={B.goldPale}/><path d="M22.5 4.5v3c.8-.4 1.5-1 1.5-1.5s-.7-1.1-1.5-1.5z"/></svg>
          </div>
        </div>

        <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:B.green,overflowY:"auto",overflowX:"hidden"}}>
          {toast&&(<div style={{...sans,position:"fixed",top:58,left:"50%",transform:"translateX(-50%)",background:`${B.greenDark}f2`,color:toast.type==="err"?B.red:B.gold,padding:"9px 22px",borderRadius:24,fontSize:12,fontWeight:500,zIndex:999,whiteSpace:"nowrap",border:`1px solid ${toast.type==="err"?B.red+"55":B.gold+"44"}`,animation:"fadeIn .2s ease",letterSpacing:.8,textTransform:"uppercase"}}>{toast.msg}</div>)}

          {/* LOG */}
          {view==="log"&&(<div style={{paddingTop:54,paddingBottom:100}}>
            <div style={{padding:"18px 24px 0",position:"relative",overflow:"hidden"}}>
              <Sprig style={{position:"absolute",top:-8,right:-6,width:140,opacity:.55}}/>
              <div style={{...sans,fontSize:10,letterSpacing:2.5,color:B.goldDim,textTransform:"uppercase"}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
              <div style={{...serifSC,fontSize:28,color:B.goldPale,lineHeight:1.1,marginTop:4}}>Time Log</div>
              <div style={{...script,fontSize:22,color:B.gold,marginTop:-2,opacity:.85,lineHeight:1}}>design co.</div>
              <GoldLine/>
            </div>
            <div style={{padding:"8px 20px",display:"flex",gap:10}}>
              <div style={{flex:1,background:`${B.greenDark}cc`,border:`1px solid ${B.gold}25`,borderRadius:14,padding:"14px 16px"}}>
                <div style={{...sans,fontSize:9,color:B.goldDim,letterSpacing:2,textTransform:"uppercase"}}>This Week</div>
                <div style={{...serif,fontSize:30,fontWeight:300,color:B.goldPale,lineHeight:1,marginTop:5}}>{fmt(sum(thisWeek))}</div>
                <div style={{...sans,fontSize:10,color:B.goldDim,marginTop:3}}>{thisWeek.length} entries</div>
              </div>
              <div style={{flex:1,background:`${B.greenDark}cc`,border:`1px solid ${B.gold}25`,borderRadius:14,padding:"14px 16px"}}>
                <div style={{...sans,fontSize:9,color:B.gold,letterSpacing:2,textTransform:"uppercase"}}>Unbilled</div>
                <div style={{...serif,fontSize:30,fontWeight:300,color:B.goldPale,lineHeight:1,marginTop:5}}>{fmtMoney(unbilledAmt)}</div>
                <div style={{...sans,fontSize:10,color:B.goldDim,marginTop:3}}>{fmt(entries.filter(e=>e.status==="unbilled").reduce((s,e)=>s+e.hours,0))}</div>
              </div>
            </div>
            <div style={{padding:"6px 20px",display:"flex",gap:7,alignItems:"center"}}>
              {["all","unbilled","billed","paid"].map(s=>(<button key={s} onClick={()=>setFilter(s)} style={{...sans,padding:"5px 11px",borderRadius:20,border:`1px solid ${filter===s?B.gold:B.gold+"30"}`,background:filter===s?`${B.gold}20`:"transparent",color:filter===s?B.gold:B.goldDim,fontSize:10,letterSpacing:1,textTransform:"uppercase",cursor:"pointer",fontWeight:500}}>{s}</button>))}
              <button onClick={exportCSV} style={{marginLeft:"auto",background:"none",border:`1px solid ${B.gold}30`,borderRadius:20,padding:"5px 10px",cursor:"pointer",color:B.goldDim,display:"flex",alignItems:"center",gap:4}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={B.goldDim} strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span style={{...sans,fontSize:10,letterSpacing:.8}}>CSV</span>
              </button>
            </div>
            <div style={{padding:"4px 20px 0"}}>
              {filtered.length===0&&(<div style={{...serif,textAlign:"center",color:B.goldDim,marginTop:52,fontSize:18,fontStyle:"italic"}}>No entries yet.<br/>Tap + to add one.</div>)}
              {filtered.map((entry,i)=>{const cl=clientById(entry.clientId);return(<div key={entry.id} className="card" onClick={()=>{setSelected(entry);setView("detail");}} style={{background:`${B.greenDark}bb`,border:`1px solid ${B.gold}20`,borderRadius:14,padding:"13px 16px",marginBottom:9,cursor:"pointer",animation:`fadeUp .3s ease ${i*.04}s both`,borderLeft:`3px solid ${cl.color}55`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:7,height:7,borderRadius:"50%",background:cl.color,flexShrink:0}}/><div style={{...serifSC,fontSize:15,color:B.goldPale,letterSpacing:.5}}>{cl.name}</div></div>
                    <div style={{...sans,fontSize:11,color:B.goldDim,marginTop:2}}>{entry.matter}</div>
                    {entry.note&&<div style={{...serif,fontSize:12,color:B.goldDim+"88",marginTop:4,fontStyle:"italic"}}>{entry.note.length>46?entry.note.slice(0,46)+"…":entry.note}</div>}
                  </div>
                  <div style={{textAlign:"right",marginLeft:12,flexShrink:0}}>
                    <div style={{...serif,fontSize:22,fontWeight:300,color:B.goldPale,lineHeight:1}}>{fmt(entry.hours)}</div>
                    <div style={{...sans,fontSize:10,color:B.goldDim,marginTop:2}}>{fmtD(entry.date)}</div>
                    <div onClick={ev=>{ev.stopPropagation();cycleStatus(entry.id);}} style={{...sans,marginTop:5,padding:"3px 9px",borderRadius:20,background:SC[entry.status]+"22",color:SC[entry.status],fontSize:9,fontWeight:600,letterSpacing:1,textTransform:"uppercase",cursor:"pointer",border:`1px solid ${SC[entry.status]}44`}}>{SL[entry.status]}</div>
                  </div>
                </div>
              </div>);})}
            </div>
          </div>)}

          {/* ADD */}
          {view==="add"&&(<div style={{paddingTop:54,paddingBottom:40}}>
            <div style={{padding:"14px 24px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${B.gold}18`}}>
              <button onClick={()=>setView("log")} style={{...sans,background:"none",border:"none",color:B.goldDim,fontSize:14,cursor:"pointer"}}>Cancel</button>
              <div style={{...serifSC,fontSize:16,color:B.goldPale,letterSpacing:1}}>New Entry</div>
              <button onClick={save} style={{...sans,background:"none",border:"none",color:B.gold,fontSize:14,fontWeight:600,cursor:"pointer"}}>Save</button>
            </div>
            {voiceText&&(<div style={{margin:"14px 22px 0",padding:"12px 16px",background:`${B.gold}12`,borderRadius:12,border:`1px solid ${B.gold}30`}}><div style={{...sans,fontSize:9,color:B.gold,letterSpacing:1.5,textTransform:"uppercase",marginBottom:5}}>Voice Captured</div><div style={{...serif,fontSize:14,color:B.goldPale,fontStyle:"italic",lineHeight:1.5}}>"{voiceText}"</div></div>)}
            <div style={{margin:"14px 22px 0",background:`${B.greenDark}cc`,border:`1px solid ${B.gold}22`,borderRadius:16,overflow:"hidden"}}>
              <Field label="Client"><select value={form.clientId} onChange={e=>{const id=parseInt(e.target.value);setForm(f=>({...f,clientId:id,rate:String(clientRate(id))}));}} style={{...serif,background:"transparent",border:"none",color:B.goldPale,fontSize:15,textAlign:"right",width:"100%",outline:"none",cursor:"pointer"}}>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
              <Field label="Matter"><select value={form.matter} onChange={e=>setForm(f=>({...f,matter:e.target.value}))} style={{...serif,background:"transparent",border:"none",color:B.goldPale,fontSize:15,textAlign:"right",width:"100%",outline:"none",cursor:"pointer"}}>{matters.map(m=><option key={m}>{m}</option>)}</select></Field>
              <Field label="Hours"><input type="number" step="0.25" min="0.25" placeholder="0.0" value={form.hours} onChange={e=>setForm(f=>({...f,hours:e.target.value}))} style={{...serif,background:"transparent",border:"none",color:B.goldPale,fontSize:15,textAlign:"right",width:80,outline:"none"}}/></Field>
              <Field label="Rate / hr"><div style={{display:"flex",alignItems:"center",gap:3}}><span style={{...serif,color:B.goldDim}}>$</span><input type="number" placeholder="750" value={form.rate} onChange={e=>setForm(f=>({...f,rate:e.target.value}))} style={{...serif,background:"transparent",border:"none",color:B.goldPale,fontSize:15,textAlign:"right",width:80,outline:"none"}}/></div></Field>
              <Field label="Date" last><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={{...sans,background:"transparent",border:"none",color:B.goldPale,fontSize:13,textAlign:"right",outline:"none",colorScheme:"dark"}}/></Field>
            </div>
            {form.hours&&form.rate&&(<div style={{margin:"10px 22px 0",padding:"11px 18px",background:`${B.gold}14`,borderRadius:12,border:`1px solid ${B.gold}30`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{...serif,fontSize:14,color:B.gold,fontStyle:"italic"}}>Invoice amount</span><span style={{...serifSC,fontSize:18,color:B.gold}}>{fmtMoney(parseFloat(form.hours||0)*parseFloat(form.rate||0))}</span></div>)}
            <div style={{margin:"10px 22px 0",background:`${B.greenDark}cc`,border:`1px solid ${B.gold}22`,borderRadius:14,padding:"14px 16px"}}>
              <div style={{...sans,fontSize:9,color:B.goldDim,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Notes</div>
              <textarea value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="Add a note…" style={{...serif,background:"transparent",border:"none",color:B.goldPale,fontSize:15,width:"100%",outline:"none",resize:"none",height:72,lineHeight:1.5}}/>
            </div>
          </div>)}

          {/* DETAIL */}
          {view==="detail"&&selected&&(()=>{const entry=entries.find(e=>e.id===selected.id)||selected;const cl=clientById(entry.clientId);return(<div style={{paddingTop:54,paddingBottom:40}}>
            <div style={{padding:"14px 24px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${B.gold}18`}}>
              <button onClick={()=>setView("log")} style={{...sans,background:"none",border:"none",color:B.goldDim,fontSize:14,cursor:"pointer"}}>‹ Back</button>
              <div style={{...serifSC,fontSize:16,color:B.goldPale,letterSpacing:1}}>Entry</div>
              <button onClick={()=>del(entry.id)} style={{...sans,background:"none",border:"none",color:B.red,fontSize:13,cursor:"pointer"}}>Delete</button>
            </div>
            <div style={{padding:"14px 22px 0"}}>
              <div style={{background:`${B.greenDark}cc`,border:`1px solid ${B.gold}28`,borderRadius:18,padding:"22px",marginBottom:14,position:"relative",overflow:"hidden",borderLeft:`4px solid ${cl.color}99`}}>
                <Sprig style={{position:"absolute",top:-15,right:-8,width:130,opacity:.2,transform:"scaleX(-1)"}}/>
                <div style={{...serif,fontSize:44,fontWeight:300,color:B.goldPale,lineHeight:1}}>{fmt(entry.hours)}</div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6}}><div style={{width:8,height:8,borderRadius:"50%",background:cl.color}}/><div style={{...serifSC,fontSize:20,color:B.gold,letterSpacing:.5}}>{cl.name}</div></div>
                <div style={{...sans,fontSize:12,color:B.goldDim,marginTop:2}}>{entry.matter}</div>
                <GoldLine my={14}/>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <div><div style={{...sans,fontSize:9,color:B.goldDim,letterSpacing:1.5,textTransform:"uppercase"}}>Date</div><div style={{...serif,fontSize:16,color:B.goldPale,marginTop:3}}>{fmtD(entry.date)}</div></div>
                  <div style={{textAlign:"right"}}><div style={{...sans,fontSize:9,color:B.goldDim,letterSpacing:1.5,textTransform:"uppercase"}}>Amount</div><div style={{...serif,fontSize:16,color:B.goldPale,marginTop:3}}>{fmtMoney(entry.hours*entry.rate)}</div></div>
                </div>
                {entry.note&&<><GoldLine my={12}/><div style={{...sans,fontSize:9,color:B.goldDim,letterSpacing:1.5,textTransform:"uppercase",marginBottom:5}}>Notes</div><div style={{...serif,fontSize:15,color:B.goldPale,fontStyle:"italic",lineHeight:1.6}}>{entry.note}</div></>}
              </div>
              <div style={{background:`${B.greenDark}cc`,border:`1px solid ${B.gold}22`,borderRadius:14,overflow:"hidden",marginBottom:12}}>
                {STATUS_ORDER.map((s,i)=>(<div key={s} onClick={()=>{setEntries(p=>p.map(e=>e.id===entry.id?{...e,status:s}:e));setSelected({...entry,status:s});}} style={{...sans,padding:"13px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:i<2?`1px solid ${B.gold}15`:"none",cursor:"pointer"}}><span style={{fontSize:14,color:SC[s],letterSpacing:.5}}>{SL[s]}</span>{entry.status===s&&<span style={{color:SC[s]}}>✓</span>}</div>))}
              </div>
              <button onClick={()=>openInvoice(entry.clientId)} style={{width:"100%",padding:"14px",background:`${B.gold}18`,border:`1px solid ${B.gold}44`,borderRadius:14,color:B.gold,cursor:"pointer",...serifSC,fontSize:15,letterSpacing:.5}}>Generate Invoice for {cl.name}</button>
            </div>
          </div>);})()}

          {/* STATS */}
          {view==="stats"&&(<div style={{paddingTop:54,paddingBottom:100}}>
            <div style={{padding:"18px 24px 0",position:"relative",overflow:"hidden"}}>
              <Sprig style={{position:"absolute",top:-8,right:-6,width:140,opacity:.5}}/>
              <div style={{...serifSC,fontSize:28,color:B.goldPale,lineHeight:1.1,marginTop:20}}>Analytics</div>
              <div style={{...script,fontSize:20,color:B.gold,marginTop:-2,opacity:.8,lineHeight:1}}>at a glance</div>
              <GoldLine/>
            </div>
            <div style={{padding:"8px 22px"}}>
              <div style={{...sans,fontSize:9,color:B.goldDim,letterSpacing:1.5,textTransform:"uppercase",marginBottom:12}}>Hours by Client</div>
              {clients.map(cl=>{const h=entries.filter(e=>e.clientId===cl.id).reduce((s,e)=>s+e.hours,0);const rev=entries.filter(e=>e.clientId===cl.id).reduce((s,e)=>s+e.hours*e.rate,0);if(!h)return null;const pct=(h/sum(entries))*100;return(<div key={cl.id} style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5,alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:7,height:7,borderRadius:"50%",background:cl.color}}/><span style={{...serifSC,fontSize:13,color:B.goldPale}}>{cl.name}</span></div><div style={{textAlign:"right"}}><span style={{...serif,fontSize:13,color:B.goldDim}}>{fmt(h)}</span><span style={{...sans,fontSize:10,color:B.goldDim+"88",marginLeft:6}}>{fmtMoney(rev)}</span></div></div><div style={{height:4,background:`${B.greenDark}`,borderRadius:2,overflow:"hidden",border:`1px solid ${B.gold}15`}}><div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(to right,${cl.color}88,${cl.color})`,borderRadius:2,transition:"width .5s ease"}}/></div></div>);})}
              <GoldLine/>
              <div style={{...sans,fontSize:9,color:B.goldDim,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Generate Invoices</div>
              {clients.map(cl=>{const ub=entries.filter(e=>e.clientId===cl.id&&e.status==="unbilled");if(!ub.length)return null;const amt=ub.reduce((s,e)=>s+e.hours*e.rate,0);return(<div key={cl.id} onClick={()=>openInvoice(cl.id)} style={{...sans,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 14px",marginBottom:8,background:`${B.greenDark}bb`,border:`1px solid ${B.gold}25`,borderRadius:12,cursor:"pointer",borderLeft:`3px solid ${cl.color}88`}}><div><div style={{...serifSC,fontSize:13,color:B.goldPale}}>{cl.name}</div><div style={{fontSize:11,color:B.goldDim,marginTop:1}}>{ub.length} unbilled {ub.length===1?"entry":"entries"}</div></div><div style={{textAlign:"right"}}><div style={{...serif,fontSize:16,color:B.gold}}>{fmtMoney(amt)}</div><div style={{fontSize:10,color:B.goldDim,marginTop:1}}>Invoice →</div></div></div>);})}
              <GoldLine/>
              <div style={{...sans,fontSize:9,color:B.goldDim,letterSpacing:1.5,textTransform:"uppercase",margin:"14px 0 10px"}}>Revenue Summary</div>
              {[["Total Logged",fmt(sum(entries))],["Unbilled",fmtMoney(entries.filter(e=>e.status==="unbilled").reduce((s,e)=>s+e.hours*e.rate,0))],["Billed",fmtMoney(entries.filter(e=>e.status==="billed").reduce((s,e)=>s+e.hours*e.rate,0))],["Collected",fmtMoney(entries.filter(e=>e.status==="paid").reduce((s,e)=>s+e.hours*e.rate,0))]].map(([l,v])=>(<div key={l} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${B.gold}14`}}><span style={{...sans,fontSize:13,color:B.goldDim}}>{l}</span><span style={{...serif,fontSize:17,color:B.goldPale}}>{v}</span></div>))}
              <GoldLine/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{...sans,fontSize:9,color:B.goldDim,letterSpacing:1.5,textTransform:"uppercase"}}>Summaries</div>
                <div style={{display:"flex",gap:6}}>{["week","month"].map(m=>(<button key={m} onClick={()=>setSummaryMode(m)} style={{...sans,padding:"4px 12px",borderRadius:20,border:`1px solid ${summaryMode===m?B.gold:B.gold+"30"}`,background:summaryMode===m?`${B.gold}20`:"transparent",color:summaryMode===m?B.gold:B.goldDim,fontSize:10,letterSpacing:1,textTransform:"uppercase",cursor:"pointer"}}>{m}</button>))}</div>
              </div>
              {summaries.map((s,i)=>(<div key={s.key} style={{background:`${B.greenDark}bb`,border:`1px solid ${B.gold}20`,borderRadius:12,padding:"12px 14px",marginBottom:8,animation:`fadeUp .25s ease ${i*.04}s both`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{...serifSC,fontSize:13,color:B.goldPale}}>{formatPeriodLabel(s.key,summaryMode)}</div><div style={{...sans,fontSize:11,color:B.goldDim,marginTop:2}}>{s.entries.length} {s.entries.length===1?"entry":"entries"} · {fmt(s.hours)}</div></div><div style={{...serif,fontSize:18,color:B.gold}}>{fmtMoney(s.amount)}</div></div><div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${B.gold}15`,display:"flex",flexWrap:"wrap",gap:6}}>{Object.entries(s.entries.reduce((acc,e)=>{const k=e.clientId;acc[k]=(acc[k]||0)+e.hours;return acc;},{})).map(([cid,h])=>{const cl=clientById(parseInt(cid));return(<span key={cid} style={{...sans,fontSize:10,color:cl.color,background:cl.color+"18",padding:"2px 8px",borderRadius:20,border:`1px solid ${cl.color}33`}}>{cl.name} {fmt(h)}</span>);})}</div></div>))}
            </div>
          </div>)}

          {/* SETTINGS */}
          {view==="settings"&&(<div style={{paddingTop:54,paddingBottom:100}}>
            <div style={{padding:"18px 24px 0",position:"relative",overflow:"hidden"}}>
              <Sprig style={{position:"absolute",top:-8,right:-6,width:140,opacity:.5}}/>
              <div style={{...serifSC,fontSize:28,color:B.goldPale,lineHeight:1.1,marginTop:20}}>Settings</div>
              <div style={{...script,fontSize:20,color:B.gold,marginTop:-2,opacity:.8,lineHeight:1}}>manage your studio</div>
              <GoldLine/>
            </div>
            <div style={{padding:"8px 22px"}}>
              <div style={{...sans,fontSize:9,color:B.goldDim,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Clients & Rates</div>
              {clients.map(cl=>(<div key={cl.id} onClick={()=>setEditingClient({...cl})} style={{background:`${B.greenDark}bb`,border:`1px solid ${B.gold}20`,borderRadius:12,padding:"12px 14px",marginBottom:8,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",borderLeft:`3px solid ${cl.color}88`}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:10,height:10,borderRadius:"50%",background:cl.color,border:`1px solid ${B.gold}44`}}/><div><div style={{...serifSC,fontSize:14,color:B.goldPale}}>{cl.name}</div><div style={{...sans,fontSize:11,color:B.goldDim,marginTop:1}}>${cl.rate}/hr</div></div></div><span style={{color:B.goldDim,fontSize:16}}>›</span></div>))}
              <button onClick={()=>setEditingClient({id:"new",name:"",rate:750,color:"#8fa888"})} style={{width:"100%",padding:"11px",background:"transparent",border:`1px dashed ${B.gold}40`,borderRadius:12,color:B.goldDim,...sans,fontSize:12,letterSpacing:1,textTransform:"uppercase",cursor:"pointer",marginBottom:4}}>+ Add Client</button>
              <GoldLine/>
              <div style={{...sans,fontSize:9,color:B.goldDim,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Matter Types</div>
              {matters.map((m,i)=>(<div key={i} style={{background:`${B.greenDark}bb`,border:`1px solid ${B.gold}20`,borderRadius:12,padding:"11px 14px",marginBottom:7,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{...serifSC,fontSize:13,color:B.goldPale,letterSpacing:.3}}>{m}</span><button onClick={()=>setMatters(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:B.red+"88",fontSize:16,cursor:"pointer",padding:"0 4px"}}>×</button></div>))}
              <div style={{display:"flex",gap:8,marginTop:4}}>
                <input value={newMatterText} onChange={e=>setNewMatterText(e.target.value)} placeholder="New matter type…" style={{flex:1,background:`${B.greenDark}cc`,border:`1px solid ${B.gold}22`,borderRadius:10,padding:"10px 12px",color:B.goldPale,...serif,fontSize:14,outline:"none"}} onKeyDown={e=>{if(e.key==="Enter"&&newMatterText.trim()){setMatters(p=>[...p,newMatterText.trim()]);setNewMatterText("");}}}/>
                <button onClick={()=>{if(newMatterText.trim()){setMatters(p=>[...p,newMatterText.trim()]);setNewMatterText("");}}} style={{padding:"10px 16px",background:`${B.gold}20`,border:`1px solid ${B.gold}44`,borderRadius:10,color:B.gold,...sans,fontSize:12,cursor:"pointer",letterSpacing:.5}}>Add</button>
              </div>
              <GoldLine/>
              <div style={{...sans,fontSize:9,color:B.goldDim,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Export</div>
              <button onClick={exportCSV} style={{width:"100%",padding:"13px",background:`${B.gold}14`,border:`1px solid ${B.gold}40`,borderRadius:12,color:B.gold,cursor:"pointer",...serifSC,fontSize:15,letterSpacing:.5,marginBottom:8}}>Export All Entries — CSV</button>
              <div style={{...sans,fontSize:11,color:B.goldDim,textAlign:"center",lineHeight:1.5}}>CSV includes date, client, matter, hours, rate, amount, status, and notes.</div>
            </div>
          </div>)}
        </div>

        {/* TAB BAR */}
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:88,background:`${B.greenDark}f5`,borderTop:`1px solid ${B.gold}28`,backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"space-around",paddingBottom:22,zIndex:50}}>
          <TabBtn label="Log"      icon={<LogIcon a={view==="log"}/>}           active={view==="log"}      onClick={()=>setView("log")}/>
          <TabBtn label="Stats"    icon={<ChartIcon a={view==="stats"}/>}        active={view==="stats"}    onClick={()=>setView("stats")}/>
          <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {listening&&<div style={{position:"absolute",inset:-6,borderRadius:"50%",border:`1.5px solid ${B.gold}88`,animation:"ring 1.2s infinite"}}/>}
            <button onClick={listening?()=>{recRef.current?.stop();setListening(false);}:startVoice} style={{width:54,height:54,borderRadius:27,background:listening?B.goldDim:B.greenDark,border:`1.5px solid ${B.gold}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:listening?`0 0 22px ${B.gold}55`:`0 4px 20px rgba(0,0,0,.5)`,transition:"all .2s ease"}}>
              {listening?<span style={{animation:"shimmer 1s infinite",fontSize:18}}>⏹</span>:<MicIcon c={B.goldPale}/>}
            </button>
          </div>
          <TabBtn label="Add"      icon={<PlusIcon a={view==="add"}/>}           active={view==="add"}      onClick={()=>setView("add")}/>
          <TabBtn label="Settings" icon={<SettingsIcon a={view==="settings"}/>}  active={view==="settings"} onClick={()=>setView("settings")}/>
        </div>

        {/* CLIENT EDIT MODAL */}
        {editingClient&&(<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.7)",zIndex:200,display:"flex",alignItems:"flex-end",animation:"fadeIn .2s ease"}}>
          <div style={{width:"100%",background:B.greenDark,borderRadius:"24px 24px 0 0",padding:"24px 24px 40px",border:`1px solid ${B.gold}28`}}>
            <div style={{...serifSC,fontSize:18,color:B.goldPale,marginBottom:16,letterSpacing:.5}}>{editingClient.id==="new"?"New Client":"Edit Client"}</div>
            <div style={{background:`${B.green}cc`,border:`1px solid ${B.gold}20`,borderRadius:14,overflow:"hidden",marginBottom:12}}>
              <Field label="Name"><input value={editingClient.name} onChange={e=>setEditingClient(p=>({...p,name:e.target.value}))} placeholder="Client name" style={{...serif,background:"transparent",border:"none",color:B.goldPale,fontSize:15,textAlign:"right",outline:"none",width:160}}/></Field>
              <Field label="Rate / hr"><div style={{display:"flex",alignItems:"center",gap:3}}><span style={{color:B.goldDim}}>$</span><input type="number" value={editingClient.rate} onChange={e=>setEditingClient(p=>({...p,rate:parseInt(e.target.value)||0}))} style={{...serif,background:"transparent",border:"none",color:B.goldPale,fontSize:15,textAlign:"right",outline:"none",width:80}}/></div></Field>
              <Field label="Color" last><input type="color" value={editingClient.color} onChange={e=>setEditingClient(p=>({...p,color:e.target.value}))} style={{width:32,height:24,borderRadius:6,cursor:"pointer"}}/></Field>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setEditingClient(null)} style={{flex:1,padding:"12px",background:"transparent",border:`1px solid ${B.gold}30`,borderRadius:12,color:B.goldDim,...sans,fontSize:13,cursor:"pointer"}}>Cancel</button>
              {editingClient.id!=="new"&&(<button onClick={()=>{setClients(p=>p.filter(c=>c.id!==editingClient.id));setEditingClient(null);toast_("Client removed");}} style={{padding:"12px 16px",background:`${B.red}22`,border:`1px solid ${B.red}44`,borderRadius:12,color:B.red,...sans,fontSize:13,cursor:"pointer"}}>Delete</button>)}
              <button onClick={()=>{if(!editingClient.name.trim()){toast_("Enter a name","err");return;}if(editingClient.id==="new"){setClients(p=>[...p,{...editingClient,id:Date.now()}]);}else{setClients(p=>p.map(c=>c.id===editingClient.id?editingClient:c));}setEditingClient(null);toast_("Client saved");}} style={{flex:1,padding:"12px",background:`${B.gold}20`,border:`1px solid ${B.gold}44`,borderRadius:12,color:B.gold,...serifSC,fontSize:14,cursor:"pointer",letterSpacing:.5}}>Save</button>
            </div>
          </div>
        </div>)}

        {/* INVOICE MODAL */}
        {invoiceModal&&(()=>{
          const cl=clientById(invoiceModal.clientId);
          const invEntries=invoiceModal.entries;
          const subtotal=invEntries.reduce((s,e)=>s+e.hours*e.rate,0);
          const today=new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
          const due=new Date(Date.now()+30*86400000).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
          return(<>
            <div id="invoice-print">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:32}}>
                <div><div style={{fontFamily:"Georgia,serif",fontSize:28,fontWeight:400,color:"#1f3529"}}>Juniper Studio</div><div style={{fontFamily:"Georgia,serif",fontSize:16,fontStyle:"italic",color:"#a89660"}}>Design Co.</div><div style={{fontFamily:"sans-serif",fontSize:11,color:"#666",marginTop:8}}>christina@juniperstudiodc.com<br/>617-599-7661 · juniperstudiodc.com</div></div>
                <div style={{textAlign:"right"}}><div style={{fontFamily:"Georgia,serif",fontSize:22,color:"#1f3529"}}>Invoice #{invoiceNum}</div><div style={{fontFamily:"sans-serif",fontSize:11,color:"#666",marginTop:4}}>Date: {today}<br/>Due: {due}</div></div>
              </div>
              <div style={{background:"#f5f0e8",padding:"12px 16px",borderRadius:8,marginBottom:24}}><div style={{fontFamily:"sans-serif",fontSize:10,color:"#a89660",textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>Bill To</div><div style={{fontFamily:"Georgia,serif",fontSize:18,color:"#1f3529"}}>{cl.name}</div></div>
              <table style={{width:"100%",borderCollapse:"collapse",marginBottom:24}}>
                <thead><tr style={{borderBottom:"2px solid #c9b882"}}>{["Date","Matter","Hours","Rate","Amount"].map(h=>(<th key={h} style={{fontFamily:"sans-serif",fontSize:10,color:"#a89660",textTransform:"uppercase",letterSpacing:1,padding:"6px 8px",textAlign:h==="Hours"||h==="Rate"||h==="Amount"?"right":"left"}}>{h}</th>))}</tr></thead>
                <tbody>{invEntries.map((e,i)=>(<tr key={e.id} style={{borderBottom:"1px solid #e8dfc0",background:i%2?"#fafaf7":"#fff"}}><td style={{fontFamily:"sans-serif",fontSize:11,padding:"8px",color:"#333"}}>{new Date(e.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</td><td style={{fontFamily:"Georgia,serif",fontSize:12,padding:"8px",color:"#1f3529"}}>{e.matter}{e.note?<div style={{fontStyle:"italic",color:"#888",fontSize:10}}>{e.note}</div>:null}</td><td style={{fontFamily:"sans-serif",fontSize:11,padding:"8px",textAlign:"right",color:"#333"}}>{e.hours}</td><td style={{fontFamily:"sans-serif",fontSize:11,padding:"8px",textAlign:"right",color:"#333"}}>${e.rate}</td><td style={{fontFamily:"Georgia,serif",fontSize:12,padding:"8px",textAlign:"right",color:"#1f3529",fontWeight:"bold"}}>{fmtMoney(e.hours*e.rate)}</td></tr>))}</tbody>
              </table>
              <div style={{display:"flex",justifyContent:"flex-end"}}><div style={{background:"#1f3529",color:"#e8dfc0",padding:"14px 24px",borderRadius:8,minWidth:200}}><div style={{display:"flex",justifyContent:"space-between",gap:32}}><span style={{fontFamily:"sans-serif",fontSize:12,opacity:.7}}>Total Due</span><span style={{fontFamily:"Georgia,serif",fontSize:20}}>{fmtMoney(subtotal)}</span></div><div style={{fontFamily:"sans-serif",fontSize:10,opacity:.5,marginTop:4,textAlign:"right"}}>Net 30</div></div></div>
              <div style={{marginTop:40,paddingTop:16,borderTop:"1px solid #e8dfc0",fontFamily:"Georgia,serif",fontSize:12,color:"#a89660",fontStyle:"italic",textAlign:"center"}}>Where Vision Meets Execution—Precisely, Creatively, Seamlessly</div>
            </div>
            <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.75)",zIndex:200,display:"flex",alignItems:"flex-end",animation:"fadeIn .2s ease"}}>
              <div style={{width:"100%",background:B.greenDark,borderRadius:"24px 24px 0 0",padding:"22px 22px 40px",border:`1px solid ${B.gold}28`,maxHeight:"80%",overflowY:"auto"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><div style={{...serifSC,fontSize:17,color:B.goldPale}}>Invoice Preview</div><button onClick={()=>setInvoiceModal(null)} style={{background:"none",border:"none",color:B.goldDim,fontSize:22,cursor:"pointer",lineHeight:1}}>×</button></div>
                <div style={{...sans,fontSize:10,color:B.goldDim,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Invoice #{invoiceNum}</div>
                <div style={{...serifSC,fontSize:18,color:B.gold,marginBottom:2}}>{cl.name}</div>
                <div style={{...sans,fontSize:11,color:B.goldDim,marginBottom:14}}>Due {due} · Net 30</div>
                {invEntries.map(e=>(<div key={e.id} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${B.gold}15`}}><div><div style={{...serifSC,fontSize:12,color:B.goldPale}}>{e.matter}</div><div style={{...sans,fontSize:10,color:B.goldDim}}>{fmt(e.hours)} @ ${e.rate}/hr</div></div><div style={{...serif,fontSize:15,color:B.goldPale}}>{fmtMoney(e.hours*e.rate)}</div></div>))}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14,padding:"14px",background:`${B.gold}18`,borderRadius:12,border:`1px solid ${B.gold}33`}}><span style={{...sans,fontSize:12,color:B.goldDim,letterSpacing:.5}}>Total Due</span><span style={{...serifSC,fontSize:22,color:B.gold}}>{fmtMoney(subtotal)}</span></div>
                <button onClick={printInvoice} style={{width:"100%",marginTop:14,padding:"14px",background:`${B.gold}20`,border:`1px solid ${B.gold}50`,borderRadius:14,color:B.gold,cursor:"pointer",...serifSC,fontSize:15,letterSpacing:.5}}>Print / Save as PDF</button>
                <div style={{...sans,fontSize:10,color:B.goldDim,textAlign:"center",marginTop:8}}>Entries will be marked Billed after printing</div>
              </div>
            </div>
          </>);
        })()}
      </div>
    </div>
  );
}
