/* ==========================================================================
   admin-banners.js — Bosh sahifadagi hero slaydlar va promo bannerlarni
   boshqarish (qo'shish, tahrirlash, o'chirish, faol/nofaol qilish).
   ========================================================================== */

let editingBannerId = null;
let allBannersCache = [];

const VARIANTS_BY_TYPE = {
  hero: [{ value: "primary", label: "Asosiy (yashil)" }],
  promo: [{ value: "gold", label: "Oltin" }, { value: "coral", label: "Marjon" }],
};

// bannerlar ro'yxatini yuklab, ikkala bo'limga taqsimlab render qilish
async function loadAndRenderBanners(){
  try{
    allBannersCache = await Api.getAllBanners();
  }catch(e){
    showToast(e.message);
    return;
  }
  renderBannerList("hero-banners-mount", allBannersCache.filter(b => b.type === "hero"));
  renderBannerList("promo-banners-mount", allBannersCache.filter(b => b.type === "promo"));
}

// bitta ro'yxatni (hero yoki promo) jadval sifatida chizish
function renderBannerList(mountId, banners){
  const mount = document.querySelector(`#${mountId}`);
  if(!banners.length){
    mount.innerHTML = `<p style="color:var(--color-text-faint);font-size:13.5px;">Hozircha banner yo'q.</p>`;
    return;
  }
  mount.innerHTML = `
    <table class="admin-table">
      <thead><tr><th>Sarlavha</th><th>Holati</th><th></th></tr></thead>
      <tbody>
        ${banners.map(b => `
          <tr>
            <td>${escapeHtml(b.title)}</td>
            <td>${b.active ? "✅ Faol" : "⛔ Nofaol"}</td>
            <td>
              <div class="admin-table__actions">
                <button type="button" class="admin-table__action-btn" data-edit-banner="${b.id}" title="Tahrirlash">✏️</button>
                <button type="button" class="admin-table__action-btn admin-table__action-btn--danger" data-delete-banner="${b.id}" title="O'chirish">🗑️</button>
              </div>
            </td>
          </tr>`).join("")}
      </tbody>
    </table>`;

  mount.querySelectorAll("[data-edit-banner]").forEach(btn=>{
    btn.addEventListener("click", ()=> openBannerModal(banners.find(b => b.id === Number(btn.dataset.editBanner))));
  });
  mount.querySelectorAll("[data-delete-banner]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      if(!confirm("Bu bannerni o'chirishga ishonchingiz komilmi?")) return;
      try{ await Api.deleteBanner(btn.dataset.deleteBanner); showToast("Banner o'chirildi"); loadAndRenderBanners(); }
      catch(e){ showToast(e.message); }
    });
  });
}

// variant select'ini banner turiga qarab to'ldirish
function fillVariantSelect(type){
  const sel = document.querySelector("[data-f-variant]");
  sel.innerHTML = VARIANTS_BY_TYPE[type].map(v => `<option value="${v.value}">${v.label}</option>`).join("");
}

// narx belgisi maydonini faqat hero uchun ko'rsatish
function togglePriceTagField(type){
  document.querySelector("[data-price-tag-field]").style.display = type === "hero" ? "block" : "none";
}

// modalni "qo'shish" yoki "tahrirlash" rejimida ochish
// banner fon rasmi (media/<id> yoki null)
let bannerBgPath = null;
function bgPreviewUrl(p){
  if(!p) return "";
  if(/^https?:\/\//.test(p)) return p;
  if(/^media\//.test(p)) return (window.SOTUV_API_BASE || "") + "/api/" + p;
  return p;
}
function setBannerBg(p){
  bannerBgPath = p || null;
  const img = document.querySelector("[data-f-bg-preview]");
  img.src = bgPreviewUrl(bannerBgPath);
  img.hidden = !bannerBgPath;
  document.querySelector("[data-f-bg-hint]").textContent = bannerBgPath ? "Fon rasmi tanlangan" : "Fon rasmi yo'q (standart rang)";
}
function readBgFile(file){
  return new Promise((resolve, reject)=>{
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("Faylni o'qib bo'lmadi"));
    r.readAsDataURL(file);
  });
}
function bindBannerBg(){
  const input = document.querySelector("[data-f-bg-file]");
  input.addEventListener("change", async ()=>{
    const file = input.files[0];
    input.value = "";
    if(!file) return;
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)){ showToast("Faqat JPG, PNG yoki WEBP"); return; }
    if(file.size > 5 * 1024 * 1024){ showToast("Rasm 5 MB dan katta"); return; }
    document.querySelector("[data-f-bg-hint]").textContent = "Yuklanmoqda...";
    try{
      const res = await Api.uploadProductImage(file.name, await readBgFile(file));
      setBannerBg(res.path);
      showToast("Fon rasmi yuklandi");
    }catch(e){ showToast(e.message); }
  });
  document.querySelector("[data-f-bg-clear]").addEventListener("click", ()=> setBannerBg(null));
}

function openBannerModal(banner = null){
  editingBannerId = banner ? banner.id : null;
  const type = banner ? banner.type : document.querySelector("[data-f-type]").value || "hero";
  document.querySelector("[data-f-type]").value = type;
  fillVariantSelect(type);
  togglePriceTagField(type);

  document.querySelector("[data-modal-title]").textContent = banner ? "Bannerni tahrirlash" : (type === "hero" ? "Hero slayd qo'shish" : "Promo banner qo'shish");
  document.querySelector("[data-form-error]").classList.remove("form-field__error--show");

  document.querySelector("[data-f-eyebrow]").value = banner?.eyebrow || "";
  document.querySelector("[data-f-title]").value = banner?.title || "";
  document.querySelector("[data-f-text]").value = banner?.text || "";
  document.querySelector("[data-f-cta-text]").value = banner?.ctaText || "Xarid qilish";
  document.querySelector("[data-f-link]").value = banner?.link || "catalog.html";
  document.querySelector("[data-f-variant]").value = banner?.variant || VARIANTS_BY_TYPE[type][0].value;
  document.querySelector("[data-f-price-tag]").value = banner?.priceTag || "";
  document.querySelector("[data-f-active]").checked = banner ? banner.active : true;
  setBannerBg(banner?.bgImg || null);

  document.querySelector("[data-banner-modal]").classList.add("modal--open");
}

function closeBannerModal(){
  document.querySelector("[data-banner-modal]").classList.remove("modal--open");
}

// forma yuborilganda: yangi banner qo'shish yoki mavjudini yangilash
function bindBannerForm(){
  document.querySelector("[data-banner-form]").addEventListener("submit", async (e)=>{
    e.preventDefault();
    const errorEl = document.querySelector("[data-form-error]");
    errorEl.classList.remove("form-field__error--show");

    const payload = {
      type: document.querySelector("[data-f-type]").value,
      eyebrow: document.querySelector("[data-f-eyebrow]").value.trim(),
      title: document.querySelector("[data-f-title]").value.trim(),
      text: document.querySelector("[data-f-text]").value.trim(),
      ctaText: document.querySelector("[data-f-cta-text]").value.trim() || "Xarid qilish",
      link: document.querySelector("[data-f-link]").value.trim() || "catalog.html",
      variant: document.querySelector("[data-f-variant]").value,
      priceTag: document.querySelector("[data-f-price-tag]").value.trim(),
      active: document.querySelector("[data-f-active]").checked,
      bgImg: bannerBgPath,
    };

    try{
      if(editingBannerId){
        await Api.updateBanner(editingBannerId, payload);
        showToast("Banner yangilandi");
      } else {
        await Api.createBanner(payload);
        showToast("Banner qo'shildi");
      }
      closeBannerModal();
      loadAndRenderBanners();
    }catch(err){
      errorEl.textContent = err.message;
      errorEl.classList.add("form-field__error--show");
    }
  });
}

document.addEventListener("DOMContentLoaded", async ()=>{
  const admin = await initAdminPage("banners", "Reklama bannerlari");
  if(!admin) return;

  const template = document.querySelector("#content-template");
  document.querySelector("#admin-content").appendChild(template.content.cloneNode(true));

  loadAndRenderBanners();
  bindBannerForm();
  bindBannerBg();

  document.querySelectorAll("[data-add]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelector("[data-f-type]").value = btn.dataset.add;
      openBannerModal(null);
    });
  });
  document.querySelector("[data-modal-close]").addEventListener("click", closeBannerModal);
  document.querySelector("[data-banner-modal]").addEventListener("click", (e)=>{
    if(e.target === document.querySelector("[data-banner-modal]")) closeBannerModal();
  });
  document.addEventListener("keydown", (e)=>{ if(e.key === "Escape") closeBannerModal(); });
});
