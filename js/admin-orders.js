// Admin: barcha buyurtmalar
const fmtSomO = (n) => (Number(n) || 0).toLocaleString("uz-UZ").replace(/,/g, " ") + " so'm";
const ITEM_STATUS_LABEL = { new: "Yangi", accepted: "Qabul qilingan", shipping: "Yo'lda", delivered: "Yetkazildi", rejected: "Rad etilgan" };

document.addEventListener("DOMContentLoaded", async ()=>{
  const admin = await initAdminPage("orders", "Buyurtmalar");
  if(!admin) return;
  document.querySelector("#admin-content").appendChild(document.querySelector("#content-template").content.cloneNode(true));
  try{
    const orders = await apiRequest("/api/admin/orders");
    document.querySelector("#orders-mount").innerHTML = orders.length ? `
      <div class="admin-table-wrap"><table class="admin-table">
        <thead><tr><th>№</th><th>Sana</th><th>Xaridor</th><th>Mahsulotlar</th><th>Sotuvchi</th><th>Summa</th><th>Holat</th></tr></thead>
        <tbody>${orders.map(o => `
          <tr>
            <td>#${o.id}</td>
            <td>${String(o.createdAt).slice(0,16)}</td>
            <td>${escapeHtml(o.buyer)}</td>
            <td>${o.items.map(i => `${escapeHtml(i.name)} × ${i.qty} <span class="admin-lead">(${ITEM_STATUS_LABEL[i.status] || i.status})</span>`).join("<br>")}</td>
            <td>${o.shops.map(escapeHtml).join(", ") || "Shoply"}</td>
            <td><strong>${fmtSomO(o.total)}</strong></td>
            <td>${o.status === "delivered" ? "Yetkazildi" : o.status === "cancelled" ? "Bekor qilingan" : "Faol"}</td>
          </tr>`).join("")}</tbody>
      </table></div>` : `<p class="admin-lead">Hozircha buyurtmalar yo'q.</p>`;
  }catch(e){ showToast(e.message); }
});
