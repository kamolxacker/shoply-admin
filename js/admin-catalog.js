/* ==========================================================================
   admin-catalog.js — Katalog mega-menyu qism-kategoriya guruhlarini
   boshqarish (qo'shish, tahrirlash, o'chirish).
   ========================================================================== */

let categoriesCache = [];
let groupsCache = [];
let editingGroupId = null;
let activeCatFilter = "";

// kategoriya select'larini to'ldirish (filtr va forma uchun)
function fillCategorySelects(){
  const options = categoriesCache.map(c => `<option value="${c.id}">${c.emoji} ${escapeHtml(tCat(c.id))}</option>`).join("");
  document.querySelector("#cat-filter").innerHTML = `<option value="">Barcha kategoriyalar</option>` + options;
  document.querySelector("[data-f-cat]").innerHTML = options;
}

// guruhlar ro'yxatini yuklab render qilish
async function loadAndRenderGroups(){
  try{
    groupsCache = await Api.getSubcategoryGroups();
  }catch(e){
    showToast(e.message);
    return;
  }
  renderGroups();
}

function renderGroups(){
  const mount = document.querySelector("#groups-mount");
  const filtered = activeCatFilter ? groupsCache.filter(g => g.catId === activeCatFilter) : groupsCache;

  if(!filtered.length){
    mount.innerHTML = `<p style="color:var(--color-text-faint);font-size:13.5px;">Guruh topilmadi.</p>`;
    return;
  }

  // kategoriya bo'yicha guruhlab ko'rsatamiz
  const byCat = {};
  filtered.forEach(g => { (byCat[g.catId] = byCat[g.catId] || []).push(g); });

  mount.innerHTML = Object.entries(byCat).map(([catId, groups]) => `
    <h3 style="font-size:15px;margin:18px 0 10px;">${escapeHtml(tCat(catId))}</h3>
    <table class="admin-table" style="margin-bottom:10px;">
      <thead><tr><th>Guruh nomi</th><th>Havolalar</th><th></th></tr></thead>
      <tbody>
        ${groups.map(g => `
          <tr>
            <td>${escapeHtml(g.title)}</td>
            <td style="max-width:340px;">${g.links.map(escapeHtml).join(", ")}</td>
            <td>
              <div class="admin-table__actions">
                <button type="button" class="admin-table__action-btn" data-edit-group="${g.id}" title="Tahrirlash">✏️</button>
                <button type="button" class="admin-table__action-btn admin-table__action-btn--danger" data-delete-group="${g.id}" title="O'chirish">🗑️</button>
              </div>
            </td>
          </tr>`).join("")}
      </tbody>
    </table>
  `).join("");

  mount.querySelectorAll("[data-edit-group]").forEach(btn=>{
    btn.addEventListener("click", ()=> openGroupModal(groupsCache.find(g => g.id === Number(btn.dataset.editGroup))));
  });
  mount.querySelectorAll("[data-delete-group]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      if(!confirm("Bu guruhni o'chirishga ishonchingiz komilmi?")) return;
      try{ await Api.deleteSubcategoryGroup(btn.dataset.deleteGroup); showToast("Guruh o'chirildi"); loadAndRenderGroups(); }
      catch(e){ showToast(e.message); }
    });
  });
}

// modalni "qo'shish" yoki "tahrirlash" rejimida ochish
function openGroupModal(group = null){
  editingGroupId = group ? group.id : null;
  document.querySelector("[data-modal-title]").textContent = group ? "Guruhni tahrirlash" : "Guruh qo'shish";
  document.querySelector("[data-form-error]").classList.remove("form-field__error--show");
  document.querySelector("[data-f-cat]").value = group ? group.catId : (activeCatFilter || categoriesCache[0]?.id || "");
  document.querySelector("[data-f-title]").value = group?.title || "";
  document.querySelector("[data-f-links]").value = group ? group.links.join(", ") : "";
  document.querySelector("[data-group-modal]").classList.add("modal--open");
}

function closeGroupModal(){
  document.querySelector("[data-group-modal]").classList.remove("modal--open");
}

// forma yuborilganda: yangi guruh qo'shish yoki mavjudini yangilash
function bindGroupForm(){
  document.querySelector("[data-group-form]").addEventListener("submit", async (e)=>{
    e.preventDefault();
    const errorEl = document.querySelector("[data-form-error]");
    errorEl.classList.remove("form-field__error--show");

    const links = document.querySelector("[data-f-links]").value.split(",").map(s => s.trim()).filter(Boolean);
    const payload = {
      catId: document.querySelector("[data-f-cat]").value,
      title: document.querySelector("[data-f-title]").value.trim(),
      links,
    };

    try{
      if(editingGroupId){
        await Api.updateSubcategoryGroup(editingGroupId, payload);
        showToast("Guruh yangilandi");
      } else {
        await Api.createSubcategoryGroup(payload);
        showToast("Guruh qo'shildi");
      }
      closeGroupModal();
      loadAndRenderGroups();
    }catch(err){
      errorEl.textContent = err.message;
      errorEl.classList.add("form-field__error--show");
    }
  });
}

document.addEventListener("DOMContentLoaded", async ()=>{
  const admin = await initAdminPage("catalog", "Katalog tuzilishi");
  if(!admin) return;

  const template = document.querySelector("#content-template");
  document.querySelector("#admin-content").appendChild(template.content.cloneNode(true));

  try{
    categoriesCache = await Api.getCategories();
  }catch(e){ showToast(e.message); }
  fillCategorySelects();

  await loadAndRenderGroups();
  bindGroupForm();

  document.querySelector("#cat-filter").addEventListener("change", (e)=>{
    activeCatFilter = e.target.value;
    renderGroups();
  });
  document.querySelector("#btn-add-group").addEventListener("click", ()=> openGroupModal(null));
  document.querySelector("[data-modal-close]").addEventListener("click", closeGroupModal);
  document.querySelector("[data-group-modal]").addEventListener("click", (e)=>{
    if(e.target === document.querySelector("[data-group-modal]")) closeGroupModal();
  });
  document.addEventListener("keydown", (e)=>{ if(e.key === "Escape") closeGroupModal(); });
});
