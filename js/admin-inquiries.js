/* ==========================================================================
   admin-inquiries.js — Mijozlardan kelgan so'rovlarni ko'rish va javob berish.
   ========================================================================== */

let inquiriesCache = [];
let replyingId = null;

// so'rovlar ro'yxatini yuklab render qilish
async function loadAndRenderInquiries(status = ""){
  const mount = document.querySelector("#inquiries-mount");
  mount.innerHTML = `<p>Yuklanmoqda...</p>`;
  try{
    inquiriesCache = await Api.getAllInquiries(status);
  }catch(e){
    mount.innerHTML = `<p>${escapeHtml(e.message)}</p>`;
    return;
  }

  if(!inquiriesCache.length){
    mount.innerHTML = `<div class="empty-state"><div class="empty-state__icon">💬</div><p class="empty-state__text">So'rovlar topilmadi.</p></div>`;
    return;
  }

  mount.innerHTML = inquiriesCache.map(inq => `
    <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:16px 18px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:8px;flex-wrap:wrap;">
        <div>
          <strong>${escapeHtml(inq.name)}</strong> · <span style="color:var(--color-text-soft);">${escapeHtml(inq.phone)}</span>
        </div>
        <span class="badge ${inq.status==='answered' ? 'badge--new' : 'badge--sale'}">${inq.status==='answered' ? "Javob berildi" : "Yangi"}</span>
      </div>
      <p style="font-size:14px;margin-bottom:10px;">${escapeHtml(inq.message)}</p>
      ${inq.adminReply ? `<p style="font-size:13.5px;background:var(--color-primary-light);color:var(--color-primary-dark);padding:10px 12px;border-radius:var(--radius-sm);margin-bottom:10px;"><strong>Javobingiz:</strong> ${escapeHtml(inq.adminReply)}</p>` : ""}
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:12px;color:var(--color-text-faint);">${inq.createdAt}</span>
        <button type="button" class="btn btn--ghost btn--sm" data-reply="${inq.id}">${inq.status==='answered' ? "Javobni tahrirlash" : "Javob berish"}</button>
      </div>
    </div>`).join("");

  mount.querySelectorAll("[data-reply]").forEach(btn=>{
    btn.addEventListener("click", ()=> openReplyModal(inquiriesCache.find(i => i.id === Number(btn.dataset.reply))));
  });
}

// javob yozish oynasini ochish
function openReplyModal(inquiry){
  replyingId = inquiry.id;
  document.querySelector("[data-inquiry-preview]").innerHTML = `<strong>${escapeHtml(inquiry.name)}:</strong> ${escapeHtml(inquiry.message)}`;
  document.querySelector("[data-f-reply]").value = inquiry.adminReply || "";
  document.querySelector("[data-form-error]").classList.remove("form-field__error--show");
  document.querySelector("[data-reply-modal]").classList.add("modal--open");
}

function closeReplyModal(){
  document.querySelector("[data-reply-modal]").classList.remove("modal--open");
}

// javob formasini yuborish
function bindReplyForm(){
  document.querySelector("[data-reply-form]").addEventListener("submit", async (e)=>{
    e.preventDefault();
    const errorEl = document.querySelector("[data-form-error]");
    errorEl.classList.remove("form-field__error--show");
    const reply = document.querySelector("[data-f-reply]").value.trim();

    try{
      await Api.replyInquiry(replyingId, reply);
      showToast("Javob yuborildi");
      closeReplyModal();
      loadAndRenderInquiries(document.querySelector("#status-filter").value);
    }catch(err){
      errorEl.textContent = err.message;
      errorEl.classList.add("form-field__error--show");
    }
  });
}

document.addEventListener("DOMContentLoaded", async ()=>{
  const admin = await initAdminPage("inquiries", "Savol-javoblar");
  if(!admin) return;

  const template = document.querySelector("#content-template");
  document.querySelector("#admin-content").appendChild(template.content.cloneNode(true));

  loadAndRenderInquiries();
  bindReplyForm();

  document.querySelector("#status-filter").addEventListener("change", (e)=>{
    loadAndRenderInquiries(e.target.value);
  });
  document.querySelector("[data-modal-close]").addEventListener("click", closeReplyModal);
  document.querySelector("[data-reply-modal]").addEventListener("click", (e)=>{
    if(e.target === document.querySelector("[data-reply-modal]")) closeReplyModal();
  });
  document.addEventListener("keydown", (e)=>{ if(e.key === "Escape") closeReplyModal(); });
});
