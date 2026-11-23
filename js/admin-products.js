/* ==========================================================================
   admin-products.js — Mahsulotlarni boshqarish: ro'yxat, qidiruv, sahifalash,
   qo'shish, tahrirlash, o'chirish.
   ========================================================================== */

const PAGE_SIZE = 10;
let currentPage = 1;
let currentSearch = "";
let categoriesCache = [];
let editingProductId = null; // null = yangi mahsulot qo'shish rejimi

// statistika kartalarini yuklab render qilish
async function renderStats(){
  const mount = document.querySelector("#admin-stats-mount");
  try{
    const stats = await Api.getAdminStats();
    mount.innerHTML = `
      <div class="admin-stat-card"><div class="admin-stat-card__label">Mahsulotlar</div><div class="admin-stat-card__value">${stats.products}</div></div>
      <div class="admin-stat-card"><div class="admin-stat-card__label">Kategoriyalar</div><div class="admin-stat-card__value">${stats.categories}</div></div>
      <div class="admin-stat-card"><div class="admin-stat-card__label">Mijozlar</div><div class="admin-stat-card__value">${stats.users}</div></div>
      <div class="admin-stat-card"><div class="admin-stat-card__label">Buyurtmalar</div><div class="admin-stat-card__value">${stats.orders}</div></div>
    `;
  }catch(e){ mount.innerHTML = `<p>${escapeHtml(e.message)}</p>`; }
}

// mahsulotlar jadvalini yuklab render qilish
async function renderProductsTable(){
  const tbody = document.querySelector("#admin-products-tbody");
  tbody.innerHTML = `<tr><td colspan="5">Yuklanmoqda...</td></tr>`;

  let data;
  try{
    data = await Api.getProducts({ page: currentPage, pageSize: PAGE_SIZE, q: currentSearch, sort: "new" });
  }catch(e){
    tbody.innerHTML = `<tr><td colspan="5">${escapeHtml(e.message)}</td></tr>`;
    return;
  }

  if(!data.items.length){
    tbody.innerHTML = `<tr><td colspan="5">Mahsulot topilmadi.</td></tr>`;
  } else {
    tbody.innerHTML = data.items.map(p => `
      <tr>
        <td>
          <div class="admin-table__name-cell">
            <div class="admin-table__thumb"><img src="${imgSrc(p.img)}" alt="" onerror="this.style.display='none'"></div>
            <span class="admin-table__name">${escapeHtml(p.name)}</span>
          </div>
        </td>
        <td>${escapeHtml(tCat(p.catId))}</td>
        <td>${formatPrice(p.price)}</td>
        <td>${p.rating} ★ (${p.reviewCount})</td>
        <td>
          <div class="admin-table__actions">
            <button type="button" class="admin-table__action-btn" data-edit="${p.id}" title="Tahrirlash">✏️</button>
            <button type="button" class="admin-table__action-btn admin-table__action-btn--danger" data-delete="${p.id}" title="O'chirish">🗑️</button>
          </div>
        </td>
      </tr>`).join("");
  }

  renderPagination(data.total);
  bindTableActions();
}

// sahifalash (oddiy, admin jadvali uchun)
function renderPagination(total){
  const mount = document.querySelector("#admin-pagination");
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if(totalPages <= 1){ mount.innerHTML = ""; return; }
  let html = "";
  for(let p = 1; p <= totalPages; p++){
    html += `<button type="button" class="pagination__page ${p===currentPage?'pagination__page--active':''}" data-goto-page="${p}">${p}</button>`;
  }
  mount.innerHTML = html;
  mount.querySelectorAll("[data-goto-page]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      currentPage = Number(btn.dataset.gotoPage);
      renderProductsTable();
    });
  });
}

// jadval ichidagi tahrirlash/o'chirish tugmalari
function bindTableActions(){
  document.querySelectorAll("[data-edit]").forEach(btn=>{
    btn.addEventListener("click", ()=> openProductModal(btn.dataset.edit));
  });
  document.querySelectorAll("[data-delete]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      if(!confirm("Bu mahsulotni o'chirishga ishonchingiz komilmi?")) return;
      try{
        await Api.deleteProduct(btn.dataset.delete);
        showToast("Mahsulot o'chirildi");
        renderProductsTable();
        renderStats();
      }catch(e){ showToast(e.message); }
    });
  });
}

/* ---------- Mahsulot qo'shish/tahrirlash oynasi ---------- */

// kategoriya select'ini to'ldirish
function fillCategorySelect(){
  const sel = document.querySelector("[data-f-cat]");
  sel.innerHTML = categoriesCache.map(c => `<option value="${c.id}">${escapeHtml(tCat(c.id))} ${c.emoji}</option>`).join("");
}

// spec (xususiyat) qatorini formaga qo'shish
function addSpecRow(key = "", value = ""){
  const wrap = document.querySelector("#specs-rows");
  const row = document.createElement("div");
  row.className = "admin-form__specs-row";
  row.innerHTML = `
    <input type="text" placeholder="Nomi (masalan: Rang)" value="${escapeHtml(key)}" data-spec-key>
    <input type="text" placeholder="Qiymati (masalan: Qora)" value="${escapeHtml(value)}" data-spec-value>
    <button type="button" class="admin-form__specs-remove" aria-label="O'chirish">✕</button>
  `;
  row.querySelector(".admin-form__specs-remove").addEventListener("click", ()=> row.remove());
  wrap.appendChild(row);
}

// forma maydonlarini tozalash (yangi mahsulot uchun)
function resetProductForm(){
  document.querySelector("[data-product-form]").reset();
  productGallery = [];
  renderGallery();
  document.querySelector("[data-f-img-hint]").textContent = "Bir yoki bir nechta rasm tanlang — ular avtomatik saqlanadi";
  document.querySelector("#specs-rows").innerHTML = "";
  document.querySelector("[data-form-error]").classList.remove("form-field__error--show");
  addSpecRow();
}

// modalni "qo'shish" yoki "tahrirlash" rejimida ochish
async function openProductModal(productId = null){
  editingProductId = productId;
  const modal = document.querySelector("[data-product-modal]");
  const title = document.querySelector("[data-modal-title]");
  resetProductForm();

  if(productId){
    title.textContent = "Mahsulotni tahrirlash";
    try{
      const p = await Api.getProduct(productId);
      document.querySelector("[data-f-name]").value = p.name;
      document.querySelector("[data-f-brand]").value = p.brand;
      document.querySelector("[data-f-cat]").value = p.catId;
      productGallery = (p.gallery && p.gallery.length ? p.gallery : [p.img]).filter(Boolean)
        .map(u => ({ path: toStoredPath(u), url: u }));
      renderGallery();
      document.querySelector("[data-f-price]").value = p.price;
      document.querySelector("[data-f-old-price]").value = p.oldPrice || "";
      document.querySelector("[data-f-rating]").value = p.rating;
      document.querySelector("[data-f-review-count]").value = p.reviewCount;
      document.querySelector("[data-f-is-new]").checked = p.isNew;
      document.querySelector("[data-f-free-ship]").checked = p.freeShip;
      document.querySelector("[data-f-description]").value = p.description;
      document.querySelector("#specs-rows").innerHTML = "";
      (p.specs.length ? p.specs : [["",""]]).forEach(([k,v]) => addSpecRow(k, v));
    }catch(e){
      showToast(e.message);
      modal.classList.remove("modal--open");
      return;
    }
  } else {
    title.textContent = "Mahsulot qo'shish";
  }

  modal.classList.add("modal--open");
}

function closeProductModal(){
  document.querySelector("[data-product-modal]").classList.remove("modal--open");
}

// forma ma'lumotlaridan so'rov uchun payload tuzish
function collectFormPayload(){
  const specs = [...document.querySelectorAll(".admin-form__specs-row")]
    .map(row => [row.querySelector("[data-spec-key]").value.trim(), row.querySelector("[data-spec-value]").value.trim()])
    .filter(([k]) => k);

  return {
    name: document.querySelector("[data-f-name]").value.trim(),
    brand: document.querySelector("[data-f-brand]").value.trim(),
    catId: document.querySelector("[data-f-cat]").value,
    img: productGallery[0] ? productGallery[0].path : "",
    gallery: productGallery.map(g => g.path),
    price: document.querySelector("[data-f-price]").value,
    oldPrice: document.querySelector("[data-f-old-price]").value,
    rating: document.querySelector("[data-f-rating]").value,
    reviewCount: document.querySelector("[data-f-review-count]").value,
    isNew: document.querySelector("[data-f-is-new]").checked,
    freeShip: document.querySelector("[data-f-free-ship]").checked,
    description: document.querySelector("[data-f-description]").value.trim(),
    specs,
  };
}


// galereya holati: [{ path: "media/<id>" yoki lokal yo'l, url: ko'rsatish uchun to'liq manzil }]
let productGallery = [];

// fayl o'qish (base64 data URL)
function readFileAsDataURL(file){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Faylni o'qib bo'lmadi"));
    reader.readAsDataURL(file);
  });
}

// admin sahifasidan rasm manzili: to'liq URL yoki lokal yo'l (admin ildizidan)
function imgSrc(p){
  if(!p) return "";
  if(/^https?:\/\//.test(p)) return p;
  return String(p).replace(/^\.?\//, "");
}

// to'liq URL dan saqlanadigan yo'lga (media/<id>) o'tkazish
function toStoredPath(p){
  const m = /\/api\/(media\/\d+)$/.exec(p || "");
  return m ? m[1] : String(p || "").replace(/^\.?\//, "");
}

// galereyani chizish (birinchi rasm — asosiy)
function renderGallery(){
  const wrap = document.querySelector("[data-gallery]");
  if(!wrap) return;
  wrap.innerHTML = productGallery.map((g, i) => `
    <div class="admin-gallery__item">
      <img src="${escapeHtml(imgSrc(g.url || g.path))}" alt="">
      ${i === 0 ? '<span class="admin-gallery__badge">Asosiy</span>' : ""}
      <button type="button" class="admin-gallery__remove" data-gallery-remove="${i}" aria-label="O'chirish">✕</button>
    </div>`).join("");
}

// rasm tanlash (bir nechta) va o'chirish
function bindGallery(){
  const input = document.querySelector("[data-f-img-file]");
  const hint = document.querySelector("[data-f-img-hint]");
  const wrap = document.querySelector("[data-gallery]");
  if(!input || !wrap) return;

  wrap.addEventListener("click", (e)=>{
    const btn = e.target.closest("[data-gallery-remove]");
    if(!btn) return;
    productGallery.splice(Number(btn.dataset.galleryRemove), 1);
    renderGallery();
  });

  input.addEventListener("change", async ()=>{
    const files = [...input.files];
    input.value = "";
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    for(const file of files){
      if(!allowed.includes(file.type)){ showToast("Faqat JPG, PNG yoki WEBP: " + file.name); continue; }
      if(file.size > 5 * 1024 * 1024){ showToast("5 MB dan katta: " + file.name); continue; }
      hint.textContent = "Yuklanmoqda... " + file.name;
      try{
        const dataUrl = await readFileAsDataURL(file);
        const res = await Api.uploadProductImage(file.name, dataUrl);
        productGallery.push({ path: res.path, url: res.url });
        renderGallery();
      }catch(e){
        showToast(e.message);
      }
    }
    hint.textContent = productGallery.length ? `${productGallery.length} ta rasm` : "Bir yoki bir nechta rasm tanlang — ular avtomatik saqlanadi";
  });
}

// forma yuborilganda: yangi mahsulot qo'shish yoki mavjudini yangilash
function bindProductForm(){
  document.querySelector("[data-product-form]").addEventListener("submit", async (e)=>{
    e.preventDefault();
    const errorEl = document.querySelector("[data-form-error]");
    errorEl.classList.remove("form-field__error--show");
    const payload = collectFormPayload();

    try{
      if(editingProductId){
        await Api.updateProduct(editingProductId, payload);
        showToast("Mahsulot yangilandi");
      } else {
        await Api.createProduct(payload);
        showToast("Mahsulot qo'shildi");
      }
      closeProductModal();
      renderProductsTable();
      renderStats();
    }catch(err){
      errorEl.textContent = err.message;
      errorEl.classList.add("form-field__error--show");
    }
  });
}

// qidiruv maydoni (debounce bilan)
function bindSearch(){
  const input = document.querySelector("#admin-search");
  let timer = null;
  input.addEventListener("input", ()=>{
    clearTimeout(timer);
    timer = setTimeout(()=>{
      currentSearch = input.value.trim();
      currentPage = 1;
      renderProductsTable();
    }, 300);
  });
}

document.addEventListener("DOMContentLoaded", async ()=>{
  const admin = await initAdminPage("products", "Mahsulotlar");
  if(!admin) return;

  // #admin-content ichiga shablonni ko'chiramiz
  const template = document.querySelector("#content-template");
  document.querySelector("#admin-content").appendChild(template.content.cloneNode(true));

  try{
    categoriesCache = await Api.getCategories();
  }catch(e){ showToast(e.message); }
  fillCategorySelect();

  renderStats();
  renderProductsTable();
  bindSearch();
  bindProductForm();
  bindGallery();

  document.querySelector("#btn-add-product").addEventListener("click", ()=> openProductModal(null));
  document.querySelector("#btn-add-spec").addEventListener("click", ()=> addSpecRow());
  document.querySelector("[data-modal-close]").addEventListener("click", closeProductModal);
  document.querySelector("[data-product-modal]").addEventListener("click", (e)=>{
    if(e.target === document.querySelector("[data-product-modal]")) closeProductModal();
  });
  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape") closeProductModal();
  });
});
