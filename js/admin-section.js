// Admin: hali tayyor bo'lmagan bo'limlar (Logistika, Moliya, Adminlar va xodimlar)
const SECTION_TITLES = { logistika: "Logistika", moliya: "Moliya", adminlar: "Adminlar va xodimlar" };
const fmtSomS = (n) => (Number(n) || 0).toLocaleString("uz-UZ").replace(/,/g, " ") + " so'm";

document.addEventListener("DOMContentLoaded", async ()=>{
  const key = new URLSearchParams(location.search).get("s") || "";
  const title = SECTION_TITLES[key] || "Bo'lim";
  const active = key === "moliya" ? "finance" : key === "logistika" ? "logistics" : "admins";
  const admin = await initAdminPage(active, title);
  if(!admin) return;
  document.querySelector("#admin-content").appendChild(document.querySelector("#content-template").content.cloneNode(true));
  let extra = "";
  if(key === "moliya"){
    try{
      const s = await apiRequest("/api/admin/stats");
      extra = `<div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-card__label">Umumiy aylanma</div><div class="kpi-card__value">${fmtSomS(s.revenue)}</div></div>
        <div class="kpi-card"><div class="kpi-card__label">Taxminiy komissiya (10%)</div><div class="kpi-card__value">${fmtSomS(Math.round((Number(s.revenue) || 0) * 0.1))}</div></div>
      </div>`;
    }catch(e){ /* ko'rsatkichlar bo'lmasa ham sahifa ochiladi */ }
  }
  document.querySelector("#section-mount").innerHTML = extra +
    `<div class="section-soon"><h2>${title}</h2><p>Bu bo'lim keyingi bosqichda qo'shiladi.</p></div>`;
});
