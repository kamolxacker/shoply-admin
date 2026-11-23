// Admin: bosh sahifa — umumiy ko'rsatkichlar va so'nggi buyurtmalar
const fmtSomA = (n) => (Number(n) || 0).toLocaleString("uz-UZ").replace(/,/g, " ") + " so'm";
const ORDER_STATUS_LABEL = { active: "Faol", delivered: "Yetkazildi", cancelled: "Bekor qilingan", unpaid: "To'lov kutilmoqda" };

function kpiCard(label, value, hint){
  return `<div class="kpi-card"><div class="kpi-card__label">${label}</div><div class="kpi-card__value">${value}</div>${hint ? `<div class="kpi-card__hint">${hint}</div>` : ""}</div>`;
}

document.addEventListener("DOMContentLoaded", async ()=>{
  const admin = await initAdminPage("dashboard", "Bosh sahifa");
  if(!admin) return;
  document.querySelector("#admin-content").appendChild(document.querySelector("#content-template").content.cloneNode(true));
  try{
    const [stats, orders] = await Promise.all([apiRequest("/api/admin/stats"), apiRequest("/api/admin/orders")]);
    document.querySelector("#kpi-mount").innerHTML = [
      kpiCard("Mahsulotlar", stats.products, `${stats.categories} ta kategoriya`),
      kpiCard("Buyurtmalar", stats.orders, "jami"),
      kpiCard("Xaridorlar", stats.users, "ro'yxatdan o'tgan"),
      kpiCard("Umumiy aylanma", fmtSomA(stats.revenue), "buyurtmalar bo'yicha"),
      kpiCard("Yangi savol-javoblar", stats.newInquiries, "javob kutilmoqda"),
    ].join("");
    const recent = orders.slice(0, 5);
    document.querySelector("#recent-orders").innerHTML = recent.length ? `
      <div class="admin-table-wrap"><table class="admin-table">
        <thead><tr><th>№</th><th>Sana</th><th>Xaridor</th><th>Summa</th><th>Holat</th></tr></thead>
        <tbody>${recent.map(o => `<tr><td>#${o.id}</td><td>${String(o.createdAt).slice(0,10)}</td><td>${escapeHtml(o.buyer)}</td><td>${fmtSomA(o.total)}</td><td>${ORDER_STATUS_LABEL[o.status] || o.status}</td></tr>`).join("")}</tbody>
      </table></div>` : `<p class="admin-lead">Hozircha buyurtmalar yo'q.</p>`;
  }catch(e){ showToast(e.message); }
});
