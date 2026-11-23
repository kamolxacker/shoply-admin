/* ==========================================================================
   admin-shell.js — Barcha admin sahifalarida ishlatiladigan umumiy qism:
   admin huquqini tekshirish, sidebar joylashuvi, chiqish tugmasi.
   ========================================================================== */

// admin paneliga faqat admin huquqiga ega foydalanuvchi kira olishini tekshirish
async function requireAdminOrRedirect(){
  const token = getToken();
  if(!token){ location.href = "login.html"; return null; }
  try{
    const { user } = await Api.me();
    if(user.role !== "admin"){ location.href = "login.html"; return null; }
    return user;
  }catch(e){
    setToken(null);
    location.href = "login.html";
    return null;
  }
}

// sidebar ikonkalari (SVG, stroke)
const ADMIN_ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-3"/><path d="M12 13v8"/>',
  cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
  truck: '<rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  wallet: '<rect x="2" y="6" width="20" height="14" rx="2"/><path d="M16 13h2M2 10h20"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  life: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M4.9 4.9l4.2 4.2M19.1 4.9l-4.2 4.2M4.9 19.1l4.2-4.2M19.1 19.1l-4.2-4.2"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
  chevron: '<path d="M15 18l-6-6 6-6"/>',
};
const adminIcon = (name) => `<svg class="admin-shell__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ADMIN_ICONS[name] || ""}</svg>`;

// sidebar bo'limlari (screenshotdagi tartib)
const ADMIN_NAV = [
  { title: null, items: [
    { href: "index.html", label: "Bosh sahifa", icon: "grid", key: "dashboard" },
    { href: "sellers.html", label: "Sotuvchilar", icon: "users", key: "sellers", badge: "sellers" },
    { href: "products.html", label: "Mahsulotlar", icon: "box", key: "products" },
    { href: "orders.html", label: "Buyurtmalar", icon: "cart", key: "orders" },
  ]},
  { title: "Operatsiyalar", items: [
    { href: "section.html?s=logistika", label: "Logistika", icon: "truck", key: "logistics" },
    { href: "section.html?s=moliya", label: "Moliya", icon: "wallet", key: "finance" },
    { href: "banners.html", label: "Marketing", icon: "spark", key: "banners" },
    { href: "inquiries.html", label: "Mijozlar yordami", icon: "life", key: "inquiries", dot: true },
  ]},
  { title: "Boshqaruv", items: [
    { href: "section.html?s=adminlar", label: "Adminlar va xodimlar", icon: "shield", key: "admins" },
    { href: "catalog.html", label: "Sozlamalar", icon: "gear", key: "catalog" },
  ]},
];

// sidebar + asosiy joylashuv HTML shabloni
function adminShellTemplate(admin, activePage, pageTitle){
  const initials = String(admin.name || "A").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const sections = ADMIN_NAV.map(sec => `
    ${sec.title ? `<div class="admin-shell__section">${sec.title}</div>` : ""}
    ${sec.items.map(l => `
      <a class="admin-shell__nav-link ${l.key === activePage ? "admin-shell__nav-link--active" : ""}" href="${l.href}" title="${l.label}">
        ${adminIcon(l.icon)}
        <span class="admin-shell__label">${l.label}</span>
        ${l.badge ? `<span class="admin-shell__badge" data-badge="${l.badge}"></span>` : ""}
        ${l.dot ? `<span class="admin-shell__dot"></span>` : ""}
      </a>`).join("")}`).join("");
  return `
  <div class="admin-shell" data-admin-shell>
    <aside class="admin-shell__sidebar">
      <div class="admin-shell__brand">
        <img src="images/icons/icon.svg" alt="Shoply" class="admin-shell__brand-img"> <span class="admin-shell__label">Shop<span class="admin-shell__brand-accent">ly</span> <small>Admin</small></span>
      </div>
      <div class="admin-shell__profile">
        <div class="admin-shell__avatar">${escapeHtml(initials)}</div>
        <div class="admin-shell__label admin-shell__profile-text">
          <div class="admin-shell__pname">${escapeHtml(admin.name)}</div>
          <div class="admin-shell__prole">Super Admin</div>
        </div>
      </div>
      <nav class="admin-shell__nav">${sections}</nav>
      <div class="admin-shell__academy admin-shell__label">
        <div class="admin-shell__academy-title">✦ Shoply Academy</div>
        <p>Savdoni oshirish uchun yangi maslahatlar.</p>
        <a href="#" class="admin-shell__academy-link">Ko'proq bilish</a>
      </div>
      <div class="admin-shell__bottom">
        <button type="button" class="admin-shell__bottom-btn" data-admin-collapse>${adminIcon("chevron")}<span class="admin-shell__label">Yig'ish</span></button>
        <button type="button" class="admin-shell__bottom-btn" data-admin-logout>${adminIcon("logout")}<span class="admin-shell__label">Chiqish</span></button>
      </div>
    </aside>
    <main class="admin-shell__main">
      <div class="admin-shell__header">
        <h1 class="admin-shell__title">${pageTitle}</h1>
        <span class="admin-shell__admin-name">👤 ${escapeHtml(admin.name)}</span>
      </div>
      <div id="admin-content"></div>
    </main>
  </div>`;
}

// admin sahifasini ishga tushirish (auth tekshiruvi + shell render)
async function initAdminPage(activePage, pageTitle){
  const admin = await requireAdminOrRedirect();
  if(!admin) return null;

  document.querySelector("#admin-app").innerHTML = adminShellTemplate(admin, activePage, pageTitle);

  document.querySelector("[data-admin-logout]").addEventListener("click", ()=>{
    setToken(null);
    location.href = "login.html";
  });
  document.querySelector("[data-admin-collapse]").addEventListener("click", ()=>{
    document.querySelector("[data-admin-shell]").classList.toggle("admin-shell--collapsed");
  });
  // "Sotuvchilar" yonidagi son
  apiRequest("/api/admin/sellers").then(list => {
    const b = document.querySelector('[data-badge="sellers"]');
    if(b && list.length) b.textContent = list.length;
  }).catch(()=>{});

  return admin;
}
