// Admin: sotuvchilar ro'yxati va ilova xabarnomalari
const fmtSom = (n) => (Number(n) || 0).toLocaleString("uz-UZ").replace(/,/g, " ") + " so'm";
const fmtDay = (iso) => String(iso || "").slice(0, 10);

function renderSellers(sellers){
  const mount = document.querySelector("#sellers-mount");
  if(!sellers.length){ mount.innerHTML = `<p class="admin-lead">Hozircha sotuvchilar yo'q.</p>`; return; }
  mount.innerHTML = `
    <div class="admin-table-wrap"><table class="admin-table">
      <thead><tr>
        <th>Do'kon</th><th>Sotuvchi</th><th>Telefon</th><th>Mahsulot</th><th>Buyurtma</th>
        <th>Sotuv</th><th>Komissiya</th><th>Sof daromad</th><th>Reyting</th><th>Ro'yxatdan</th>
      </tr></thead>
      <tbody>
        ${sellers.map(s => `
          <tr>
            <td><strong>${escapeHtml(s.shopName)}</strong></td>
            <td>${escapeHtml(s.name)}</td>
            <td>${escapeHtml(s.phone)}</td>
            <td>${s.stats.productCount}</td>
            <td>${s.stats.ordersCount} <span class="admin-lead">(yangi: ${s.stats.newOrders})</span></td>
            <td>${fmtSom(s.stats.revenue)}</td>
            <td>${fmtSom(s.stats.commission)}</td>
            <td><strong>${fmtSom(s.stats.income)}</strong></td>
            <td>${s.stats.rating ? `${s.stats.rating} ★ (${s.stats.reviewCount})` : "—"}</td>
            <td>${fmtDay(s.createdAt)}</td>
          </tr>`).join("")}
      </tbody>
    </table></div>`;
}

function renderNotify(items){
  const mount = document.querySelector("#notify-mount");
  if(!items.length){ mount.innerHTML = `<p class="admin-lead">So'rovlar yo'q.</p>`; return; }
  mount.innerHTML = `
    <div class="admin-table-wrap"><table class="admin-table">
      <thead><tr><th>Telefon / email</th><th>Sana</th></tr></thead>
      <tbody>
        ${items.map(n => `<tr><td>${escapeHtml(n.contact)}</td><td>${fmtDay(n.createdAt)}</td></tr>`).join("")}
      </tbody>
    </table></div>`;
}

document.addEventListener("DOMContentLoaded", async ()=>{
  const admin = await initAdminPage("sellers", "Sotuvchilar");
  if(!admin) return;
  document.querySelector("#admin-content").appendChild(document.querySelector("#content-template").content.cloneNode(true));
  try{
    const [sellers, notes] = await Promise.all([apiRequest("/api/admin/sellers"), apiRequest("/api/admin/app-notify")]);
    renderSellers(sellers);
    renderNotify(notes);
  }catch(e){
    showToast(e.message);
  }
});
