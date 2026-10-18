
(() => {
"use strict";

/*
  VITALSOURCE 101 CRM
  Front-end GitHub Pages demo with role-based UI permissions.
  IMPORTANT: client-side authentication is suitable for a school/demo project only.
  Do not use these demo credentials for a real production system.
*/

const KEY = "vitalsource101_crm_v1";
const sessionKey = "vitalsource101_session";

const seed = {
  users: [
    {id:"U001",name:"System Administrator",email:"admin@vitalsource.local",password:"Admin@123",role:"Admin",status:"Active"},
    {id:"U002",name:"Maria Santos",email:"staff@vitalsource.local",password:"Staff@123",role:"Staff",status:"Active"},
    {id:"U003",name:"Juan Dela Cruz",email:"customer@vitalsource.local",password:"Customer@123",role:"Customer",status:"Active"}
  ],
  customers: [
    {id:"C001",name:"Juan Dela Cruz",email:"juan@example.com",phone:"0917-555-0101",company:"Dela Cruz Trading",status:"Active",owner:"Maria Santos"},
    {id:"C002",name:"Ana Reyes",email:"ana@example.com",phone:"0918-555-0102",company:"Reyes Supplies",status:"Active",owner:"Maria Santos"},
    {id:"C003",name:"Mark Garcia",email:"mark@example.com",phone:"0919-555-0103",company:"Garcia Solutions",status:"Prospect",owner:"Maria Santos"}
  ],
  interactions: [
    {id:"I001",customer:"Juan Dela Cruz",type:"Call",subject:"Product inquiry",date:"2026-10-16",owner:"Maria Santos",status:"Completed"},
    {id:"I002",customer:"Ana Reyes",type:"Email",subject:"Quotation follow-up",date:"2026-10-17",owner:"Maria Santos",status:"Pending"},
    {id:"I003",customer:"Mark Garcia",type:"Meeting",subject:"Initial consultation",date:"2026-10-18",owner:"Maria Santos",status:"Scheduled"}
  ],
  notifications: [
    {id:"N001",title:"Welcome to VitalSource 101 CRM",message:"Your account is ready.",date:"2026-10-18",read:false,forRole:"All"},
    {id:"N002",title:"Follow-up required",message:"Ana Reyes has a pending quotation follow-up.",date:"2026-10-17",read:false,forRole:"Staff"}
  ],
  settings: {company:"VitalSource 101",timezone:"Asia/Manila",dateFormat:"YYYY-MM-DD"}
};

let db = loadDB();
let session = loadSession();
let currentPage = "dashboard";

const perms = {
  Admin: ["dashboard","customers","interactions","reports","notifications","users","settings","profile"],
  Staff: ["dashboard","customers","interactions","reports","notifications","profile"],
  Customer: ["dashboard","my-profile","my-interactions","notifications","profile"]
};

function loadDB(){
  try { return JSON.parse(localStorage.getItem(KEY)) || structuredClone(seed); }
  catch { return structuredClone(seed); }
}
function saveDB(){ localStorage.setItem(KEY, JSON.stringify(db)); }
function loadSession(){
  try { return JSON.parse(localStorage.getItem(sessionKey)); } catch { return null; }
}
function saveSession(){ session ? localStorage.setItem(sessionKey, JSON.stringify(session)) : localStorage.removeItem(sessionKey); }
function uid(prefix){ return prefix + Math.random().toString(36).slice(2,8).toUpperCase(); }
function esc(v=""){ return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])); }
function currentUser(){ return session ? db.users.find(u=>u.id===session.userId) : null; }
function can(page){ return !!session && perms[currentUser()?.role]?.includes(page); }
function initials(name){ return name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase(); }
function toast(msg){ const el=document.querySelector("#toast"); if(!el)return; el.textContent=msg; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),2500); }
function badge(status){
  const map={Active:"green",Completed:"green",Scheduled:"blue",Pending:"orange",Prospect:"orange",Inactive:"gray",Suspended:"red"};
  return `<span class="badge badge-${map[status]||"gray"}">${esc(status)}</span>`;
}
function dateToday(){ return new Date().toISOString().slice(0,10); }

function render(){
  if(!session || !currentUser()){ renderLogin(); return; }
  if(!can(currentPage)) currentPage = "dashboard";
  const user=currentUser();
  document.querySelector("#app").innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand"><div class="brand-mark">V</div><span>VitalSource 101</span></div>
        <div class="nav-title">Workspace</div>
        ${nav("dashboard","▦","Dashboard")}
        ${nav(user.role==="Customer"?"my-profile":"customers","◉",user.role==="Customer"?"My Profile":"Customers")}
        ${nav(user.role==="Customer"?"my-interactions":"interactions","↔",user.role==="Customer"?"My Interactions":"Interactions")}
        ${nav("reports","▤","Reports")}
        ${nav("notifications","●","Notifications")}
        ${user.role==="Admin"?nav("users","♙","User Management"):""}
        <div class="nav-title">Account</div>
        ${nav("profile","⚙","Profile")}
        ${user.role==="Admin"?nav("settings","☷","System Settings"):""}
        <div class="sidebar-bottom">
          <div class="role-text"><strong>${esc(user.role)}</strong><br><small>${esc(user.email)}</small></div>
          <button class="nav-item" onclick="logout()">↪ <span>Sign out</span></button>
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div><strong>CRM Workspace</strong></div>
          <div class="top-user"><span class="user-name">${esc(user.name)} · ${esc(user.role)}</span><div class="avatar">${initials(user.name)}</div></div>
        </header>
        <section class="page">
          ${pageContent()}
        </section>
      </main>
    </div>
    <div id="modal-root"></div><div id="toast" class="toast"></div>`;
}
function nav(id,icon,label){
  if(!can(id)) return "";
  return `<button class="nav-item ${currentPage===id?"active":""}" onclick="go('${id}')"><span class="nav-icon">${icon}</span><span>${label}</span></button>`;
}
function go(page){ if(can(page)){currentPage=page;render();} }

function renderLogin(){
  document.querySelector("#app").innerHTML = `
  <div class="login-wrap"><div class="login-card">
    <div class="brand"><div class="brand-mark">V</div><span>VitalSource 101 CRM</span></div>
    <h1>Sign in</h1><p>Formal role-based CRM interface for administrators, staff, and customers.</p>
    <div id="login-alert"></div>
    <form onsubmit="login(event)">
      <div class="field"><label>Email</label><input id="login-email" type="email" required autocomplete="username" placeholder="Enter your email"></div>
      <div class="field"><label>Password</label><input id="login-password" type="password" required autocomplete="current-password" placeholder="Enter your password"></div>
      <div class="login-actions"><button class="btn btn-primary" style="width:100%">Sign in securely</button></div>
    </form>
    <div class="demo-box"><strong>Demo accounts</strong><br>Admin: admin@vitalsource.local / Admin@123<br>Staff: staff@vitalsource.local / Staff@123<br>Customer: customer@vitalsource.local / Customer@123</div>
  </div></div>`;
}
function login(e){
  e.preventDefault();
  const email=document.querySelector("#login-email").value.trim().toLowerCase();
  const password=document.querySelector("#login-password").value;
  const user=db.users.find(u=>u.email.toLowerCase()===email && u.password===password);
  const alert=document.querySelector("#login-alert");
  if(!user){alert.innerHTML='<div class="alert" style="background:#fef2f2;color:#991b1b;border-color:#fecaca">Invalid email or password.</div>';return;}
  if(user.status!=="Active"){alert.innerHTML='<div class="alert" style="background:#fef2f2;color:#991b1b;border-color:#fecaca">This account is not active. Contact an administrator.</div>';return;}
  session={userId:user.id,loggedAt:Date.now()}; saveSession(); currentPage="dashboard"; render();
}
function logout(){session=null;saveSession();renderLogin();}

function pageContent(){
  const titles={
    dashboard:["Dashboard","Overview of CRM activity and account access."],
    customers:["Customers","Manage customer records and relationship ownership."],
    interactions:["Interactions","Track calls, emails, meetings, and follow-ups."],
    reports:["Reports","Review CRM performance and operational summaries."],
    notifications:["Notifications","Review alerts and account messages."],
    users:["User Management","Admin-only account provisioning and access control."],
    settings:["System Settings","Admin-only configuration for the CRM workspace."],
    profile:["My Profile","View your account information and preferences."],
    "my-profile":["My Profile","Customer account information."],
    "my-interactions":["My Interactions","Interactions associated with your customer account."]
  };
  const [title,sub]=titles[currentPage]||titles.dashboard;
  return `<div class="crumb">Home / ${esc(title)}</div><h1 class="page-title">${esc(title)}</h1><p class="page-subtitle">${esc(sub)}</p>${pages[currentPage]()}`
}

const pages={
 dashboard:()=>dashboardPage(),
 customers:()=>customersPage(),
 interactions:()=>interactionsPage(),
 reports:()=>reportsPage(),
 notifications:()=>notificationsPage(),
 users:()=>usersPage(),
 settings:()=>settingsPage(),
 profile:()=>profilePage(),
 "my-profile":()=>customerProfilePage(),
 "my-interactions":()=>customerInteractionsPage()
};

function dashboardPage(){
 const u=currentUser(), customerCount=db.customers.length, intCount=db.interactions.length;
 const pending=db.interactions.filter(x=>x.status==="Pending").length;
 const unread=db.notifications.filter(n=>(n.forRole==="All"||n.forRole===u.role)&&!n.read).length;
 return `<div class="grid stats">
  <div class="card"><div class="stat-label">Customers</div><div class="stat-value">${customerCount}</div><div class="stat-note">CRM records</div></div>
  <div class="card"><div class="stat-label">Interactions</div><div class="stat-value">${intCount}</div><div class="stat-note">Tracked activities</div></div>
  <div class="card"><div class="stat-label">Pending</div><div class="stat-value">${pending}</div><div class="stat-note">Needs attention</div></div>
  <div class="card"><div class="stat-label">Unread</div><div class="stat-value">${unread}</div><div class="stat-note">Notifications</div></div>
 </div>
 <div class="grid two">
  <div class="card"><div class="card-head"><h3>Recent Interactions</h3><button class="btn btn-secondary" onclick="go('${u.role==="Customer"?"my-interactions":"interactions"}')">View all</button></div>
   ${interactionTable(db.interactions.slice().reverse().slice(0,5))}
  </div>
  <div class="card"><div class="card-head"><h3>Access Level</h3></div>
   <div class="kpi-list"><div class="kpi"><span>Role</span><strong>${esc(u.role)}</strong></div>
   <div class="kpi"><span>Customer records</span><strong>${u.role==="Admin"||u.role==="Staff"?"Full":"Own only"}</strong></div>
   <div class="kpi"><span>User management</span><strong>${u.role==="Admin"?"Allowed":"Restricted"}</strong></div>
   <div class="kpi"><span>System settings</span><strong>${u.role==="Admin"?"Allowed":"Restricted"}</strong></div></div>
  </div>
 </div>`;
}

function customersPage(){
 const u=currentUser();
 let rows=db.customers;
 if(u.role==="Customer") rows=rows.filter(c=>c.email.toLowerCase()===u.email.toLowerCase());
 return `<div class="card" style="margin-top:22px"><div class="card-head"><h3>Customer Directory</h3>${u.role!=="Customer"?'<button class="btn btn-primary" onclick="customerModal()">+ Add customer</button>':""}</div>
 <div class="toolbar"><input class="search" id="customer-search" oninput="filterTable('customer-table',this.value)" placeholder="Search customers..."></div>
 <div class="table-wrap"><table id="customer-table"><thead><tr><th>ID</th><th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Status</th><th>Owner</th>${u.role!=="Customer"?"<th>Actions</th>":""}</tr></thead><tbody>
 ${rows.map(c=>`<tr><td>${esc(c.id)}</td><td><strong>${esc(c.name)}</strong></td><td>${esc(c.company)}</td><td>${esc(c.email)}</td><td>${esc(c.phone)}</td><td>${badge(c.status)}</td><td>${esc(c.owner)}</td>${u.role!=="Customer"?`<td><div class="actions"><button class="btn btn-secondary" onclick="customerModal('${c.id}')">Edit</button><button class="btn btn-danger" onclick="deleteCustomer('${c.id}')">Delete</button></div></td>`:""}</tr>`).join("")}
 </tbody></table></div></div>`;
}

function interactionTable(rows){
 return `<div class="table-wrap"><table><thead><tr><th>Customer</th><th>Type</th><th>Subject</th><th>Date</th><th>Status</th></tr></thead><tbody>
 ${rows.length?rows.map(i=>`<tr><td>${esc(i.customer)}</td><td>${esc(i.type)}</td><td>${esc(i.subject)}</td><td>${esc(i.date)}</td><td>${badge(i.status)}</td></tr>`).join(""):`<tr><td colspan="5" class="empty">No interactions found.</td></tr>`}</tbody></table></div>`;
}
function interactionsPage(){
 const u=currentUser();
 let rows=db.interactions;
 if(u.role==="Customer"){const c=db.customers.find(c=>c.email.toLowerCase()===u.email.toLowerCase());rows=rows.filter(i=>i.customer===c?.name)}
 return `<div class="card" style="margin-top:22px"><div class="card-head"><h3>Interaction Log</h3>${u.role!=="Customer"?'<button class="btn btn-primary" onclick="interactionModal()">+ Log interaction</button>':""}</div>
 <div class="toolbar"><input class="search" oninput="filterTable('interaction-full-table',this.value)" placeholder="Search interactions..."></div>
 <div class="table-wrap"><table id="interaction-full-table"><thead><tr><th>ID</th><th>Customer</th><th>Type</th><th>Subject</th><th>Date</th><th>Owner</th><th>Status</th>${u.role!=="Customer"?"<th>Actions</th>":""}</tr></thead><tbody>
 ${rows.map(i=>`<tr><td>${esc(i.id)}</td><td>${esc(i.customer)}</td><td>${esc(i.type)}</td><td>${esc(i.subject)}</td><td>${esc(i.date)}</td><td>${esc(i.owner)}</td><td>${badge(i.status)}</td>${u.role!=="Customer"?`<td><button class="btn btn-secondary" onclick="interactionModal('${i.id}')">Edit</button></td>`:""}</tr>`).join("")}</tbody></table></div></div>`;
}

function reportsPage(){
 const total=db.interactions.length, completed=db.interactions.filter(i=>i.status==="Completed").length;
 const pending=db.interactions.filter(i=>i.status==="Pending").length, scheduled=db.interactions.filter(i=>i.status==="Scheduled").length;
 const pct=n=>total?Math.round(n/total*100):0;
 return `<div class="grid three" style="margin-top:22px">
  ${reportCard("Completion Rate",pct(completed),completed+" completed")}
  ${reportCard("Pending Rate",pct(pending),pending+" pending")}
  ${reportCard("Scheduled Rate",pct(scheduled),scheduled+" scheduled")}
 </div>
 <div class="grid two" style="margin-top:18px">
 <div class="card"><div class="card-head"><h3>Interaction Summary</h3></div><div class="kpi-list">
 <div><div class="kpi"><span>Total interactions</span><strong>${total}</strong></div><div class="bar"><i style="width:100%"></i></div></div>
 <div><div class="kpi"><span>Completed</span><strong>${completed}</strong></div><div class="bar"><i style="width:${pct(completed)}%"></i></div></div>
 <div><div class="kpi"><span>Pending</span><strong>${pending}</strong></div><div class="bar"><i style="width:${pct(pending)}%"></i></div></div>
 <div><div class="kpi"><span>Scheduled</span><strong>${scheduled}</strong></div><div class="bar"><i style="width:${pct(scheduled)}%"></i></div></div>
 </div></div>
 <div class="card"><div class="card-head"><h3>Customer Status</h3></div><div class="kpi-list">
 ${["Active","Prospect","Inactive"].map(s=>{let n=db.customers.filter(c=>c.status===s).length;return `<div class="kpi"><span>${s}</span><strong>${n}</strong></div>`}).join("")}
 </div></div></div>`;
}
function reportCard(title,pct,text){return `<div class="card"><div class="stat-label">${title}</div><div class="stat-value">${pct}%</div><div class="bar"><i style="width:${pct}%"></i></div><div style="margin-top:8px;color:var(--muted);font-size:12px">${text}</div></div>`}

function notificationsPage(){
 const u=currentUser(); const rows=db.notifications.filter(n=>n.forRole==="All"||n.forRole===u.role).sort((a,b)=>b.date.localeCompare(a.date));
 return `<div class="card" style="margin-top:22px"><div class="card-head"><h3>Notifications</h3><button class="btn btn-secondary" onclick="markAllRead()">Mark all as read</button></div>
 ${rows.length?rows.map(n=>`<div class="kpi" style="margin-bottom:10px;display:block;border-left:4px solid ${n.read?"#cbd5e1":"#2563eb"}">
 <div style="display:flex;justify-content:space-between;gap:10px"><strong>${esc(n.title)}</strong>${n.read?badge("Completed"):'<span class="badge badge-blue">Unread</span>'}</div>
 <div style="color:var(--muted);font-size:13px;margin:6px 0">${esc(n.message)}</div><small style="color:var(--muted)">${esc(n.date)}</small></div>`).join(""):`<div class="empty">No notifications.</div>`}</div>`;
}

function usersPage(){
 return `<div class="card" style="margin-top:22px"><div class="card-head"><h3>System Users</h3><button class="btn btn-primary" onclick="userModal()">+ Add user</button></div>
 <div class="alert">Only administrators can create, edit, suspend, or remove accounts. Customers and staff cannot access this module.</div>
 <div class="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>
 ${db.users.map(u=>`<tr><td>${esc(u.id)}</td><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${badge(u.role==="Admin"?"Active":u.role)}</td><td>${badge(u.status)}</td><td><div class="actions"><button class="btn btn-secondary" onclick="userModal('${u.id}')">Edit</button>${u.id!==currentUser().id?`<button class="btn btn-danger" onclick="deleteUser('${u.id}')">Delete</button>`:""}</div></td></tr>`).join("")}
 </tbody></table></div></div>`;
}

function settingsPage(){
 const s=db.settings;
 return `<div class="card" style="margin-top:22px"><div class="card-head"><h3>System Configuration</h3></div>
 <form onsubmit="saveSettings(event)"><div class="form-grid">
 <div class="field"><label>Organization name</label><input id="set-company" value="${esc(s.company)}" required></div>
 <div class="field"><label>Timezone</label><select id="set-timezone"><option>Asia/Manila</option><option>UTC</option><option>Asia/Singapore</option></select></div>
 <div class="field"><label>Date format</label><select id="set-date"><option>YYYY-MM-DD</option><option>MM/DD/YYYY</option><option>DD/MM/YYYY</option></select></div>
 </div><div class="modal-footer"><button class="btn btn-primary">Save settings</button></div></form></div>`;
}

function profilePage(){
 const u=currentUser();
 return `<div class="profile-grid" style="margin-top:22px"><div class="card profile-box"><div class="big-avatar">${initials(u.name)}</div><h2>${esc(u.name)}</h2><div>${badge(u.role)}</div><p style="color:var(--muted)">${esc(u.email)}</p></div>
 <div class="card"><div class="card-head"><h3>Account Details</h3></div><form onsubmit="saveProfile(event)"><div class="form-grid">
 <div class="field"><label>Full name</label><input id="profile-name" value="${esc(u.name)}" required></div>
 <div class="field"><label>Email</label><input value="${esc(u.email)}" disabled></div>
 <div class="field"><label>New password</label><input id="profile-password" type="password" placeholder="Leave blank to keep current"></div>
 <div class="field"><label>Role</label><input value="${esc(u.role)}" disabled></div>
 </div><div class="modal-footer"><button class="btn btn-primary">Update profile</button></div></form></div></div>`;
}
function customerProfilePage(){return profilePage()}

function customerInteractionsPage(){return interactionsPage()}

function customerModal(id){
 const u=currentUser(); if(u.role==="Customer")return;
 const c=id?db.customers.find(x=>x.id===id):{id:"",name:"",email:"",phone:"",company:"",status:"Active",owner:u.name};
 openModal(`${id?"Edit":"Add"} Customer`,`
 <form onsubmit="saveCustomer(event,'${id||""}')"><div class="form-grid">
 <div class="field"><label>Full name</label><input id="c-name" value="${esc(c.name)}" required></div>
 <div class="field"><label>Email</label><input id="c-email" type="email" value="${esc(c.email)}" required></div>
 <div class="field"><label>Phone</label><input id="c-phone" value="${esc(c.phone)}" required></div>
 <div class="field"><label>Company</label><input id="c-company" value="${esc(c.company)}" required></div>
 <div class="field"><label>Status</label><select id="c-status">${["Active","Prospect","Inactive"].map(x=>`<option ${x===c.status?"selected":""}>${x}</option>`).join("")}</select></div>
 <div class="field"><label>Owner</label><input id="c-owner" value="${esc(c.owner||u.name)}" required></div>
 </div><div class="modal-footer"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary">Save</button></div></form>`);
}
function saveCustomer(e,id){e.preventDefault();const obj={id:id||uid("C"),name:v("c-name"),email:v("c-email"),phone:v("c-phone"),company:v("c-company"),status:v("c-status"),owner:v("c-owner")};if(id)Object.assign(db.customers.find(c=>c.id===id),obj);else db.customers.push(obj);saveDB();closeModal();render();toast("Customer saved.");}
function deleteCustomer(id){if(confirm("Delete this customer record?")){db.customers=db.customers.filter(c=>c.id!==id);saveDB();render();toast("Customer deleted.");}}

function interactionModal(id){
 const u=currentUser(); if(u.role==="Customer")return;
 const i=id?db.interactions.find(x=>x.id===id):{id:"",customer:db.customers[0]?.name||"",type:"Call",subject:"",date:dateToday(),owner:u.name,status:"Pending"};
 openModal(`${id?"Edit":"Log"} Interaction`,`
 <form onsubmit="saveInteraction(event,'${id||""}')"><div class="form-grid">
 <div class="field"><label>Customer</label><select id="i-customer">${db.customers.map(c=>`<option ${c.name===i.customer?"selected":""}>${esc(c.name)}</option>`).join("")}</select></div>
 <div class="field"><label>Type</label><select id="i-type">${["Call","Email","Meeting","Chat"].map(x=>`<option ${x===i.type?"selected":""}>${x}</option>`).join("")}</select></div>
 <div class="field full"><label>Subject</label><input id="i-subject" value="${esc(i.subject)}" required></div>
 <div class="field"><label>Date</label><input id="i-date" type="date" value="${esc(i.date)}" required></div>
 <div class="field"><label>Status</label><select id="i-status">${["Pending","Completed","Scheduled"].map(x=>`<option ${x===i.status?"selected":""}>${x}</option>`).join("")}</select></div>
 </div><div class="modal-footer"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary">Save</button></div></form>`);
}
function saveInteraction(e,id){e.preventDefault();const obj={id:id||uid("I"),customer:v("i-customer"),type:v("i-type"),subject:v("i-subject"),date:v("i-date"),owner:currentUser().name,status:v("i-status")};if(id)Object.assign(db.interactions.find(i=>i.id===id),obj);else db.interactions.push(obj);saveDB();closeModal();render();toast("Interaction saved.");}

function userModal(id){
 if(currentUser().role!=="Admin")return;
 const u=id?db.users.find(x=>x.id===id):{id:"",name:"",email:"",password:"",role:"Staff",status:"Active"};
 openModal(`${id?"Edit":"Add"} User`,`
 <form onsubmit="saveUser(event,'${id||""}')"><div class="form-grid">
 <div class="field"><label>Full name</label><input id="u-name" value="${esc(u.name)}" required></div>
 <div class="field"><label>Email</label><input id="u-email" type="email" value="${esc(u.email)}" required></div>
 <div class="field"><label>${id?"New password (optional)":"Password"}</label><input id="u-password" type="password" ${id?"":"required"}></div>
 <div class="field"><label>Role</label><select id="u-role">${["Admin","Staff","Customer"].map(x=>`<option ${x===u.role?"selected":""}>${x}</option>`).join("")}</select></div>
 <div class="field"><label>Status</label><select id="u-status">${["Active","Suspended"].map(x=>`<option ${x===u.status?"selected":""}>${x}</option>`).join("")}</select></div>
 </div><div class="modal-footer"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary">Save</button></div></form>`);
}
function saveUser(e,id){e.preventDefault();const name=v("u-name"),email=v("u-email").toLowerCase(),pw=v("u-password"),role=v("u-role"),status=v("u-status");if(db.users.some(x=>x.email.toLowerCase()===email&&x.id!==id)){alert("That email is already registered.");return;}if(id){const u=db.users.find(x=>x.id===id);u.name=name;u.email=email;u.role=role;u.status=status;if(pw)u.password=pw;}else db.users.push({id:uid("U"),name,email,password:pw,role,status});saveDB();closeModal();render();toast("User account saved.");}
function deleteUser(id){if(confirm("Delete this user account?")){db.users=db.users.filter(u=>u.id!==id);saveDB();render();toast("User deleted.");}}

function saveProfile(e){e.preventDefault();const u=currentUser();u.name=v("profile-name");const pw=v("profile-password");if(pw)u.password=pw;db.users[db.users.findIndex(x=>x.id===u.id)]=u;saveDB();render();toast("Profile updated.");}
function saveSettings(e){e.preventDefault();db.settings.company=v("set-company");db.settings.timezone=v("set-timezone");db.settings.dateFormat=v("set-date");saveDB();render();toast("System settings saved.");}
function markAllRead(){const role=currentUser().role;db.notifications.forEach(n=>{if(n.forRole==="All"||n.forRole===role)n.read=true});saveDB();render();toast("Notifications marked as read.");}

function filterTable(id,q){q=q.toLowerCase();const t=document.getElementById(id);if(!t)return;[...t.tBodies[0].rows].forEach(r=>r.style.display=r.textContent.toLowerCase().includes(q)?"":"none");}
function v(id){return document.getElementById(id)?.value.trim()||""}
function openModal(title,body){document.querySelector("#modal-root").innerHTML=`<div class="modal-backdrop" onclick="if(event.target===this)closeModal()"><div class="modal"><h2>${esc(title)}</h2>${body}</div></div>`}
function closeModal(){document.querySelector("#modal-root").innerHTML=""}

window.login=login;window.logout=logout;window.go=go;window.customerModal=customerModal;window.saveCustomer=saveCustomer;window.deleteCustomer=deleteCustomer;
window.interactionModal=interactionModal;window.saveInteraction=saveInteraction;window.userModal=userModal;window.saveUser=saveUser;window.deleteUser=deleteUser;
window.saveProfile=saveProfile;window.saveSettings=saveSettings;window.markAllRead=markAllRead;window.filterTable=filterTable;window.closeModal=closeModal;

render();
})();
