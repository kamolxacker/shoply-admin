/* ==========================================================================
   admin-login.js — Admin panelga kirish sahifasi mantiqi
   ========================================================================== */

// admin allaqachon login qilgan bo'lsa, to'g'ridan-to'g'ri panelga yuboramiz
async function redirectIfAlreadyAdmin(){
  const token = getToken();
  if(!token) return;
  try{
    const { user } = await Api.me();
    if(user.role === "admin") location.href = "products.html";
  }catch(e){ /* token yaroqsiz bo'lsa, login formasi qoladi */ }
}

// login formasini yuborish
function bindLoginForm(){
  const form = document.querySelector("[data-admin-login-form]");
  const errorEl = document.querySelector("[data-error]");

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    errorEl.classList.remove("form-field__error--show");
    const phone = document.querySelector("[data-phone]").value.trim();
    const password = document.querySelector("[data-pass]").value;

    try{
      const { token, user } = await Api.login({ phone, password });
      if(user.role !== "admin"){
        errorEl.textContent = "Bu hisobda admin huquqi yo'q.";
        errorEl.classList.add("form-field__error--show");
        return;
      }
      setToken(token);
      location.href = "products.html";
    }catch(err){
      errorEl.textContent = err.message;
      errorEl.classList.add("form-field__error--show");
    }
  });
}

document.addEventListener("DOMContentLoaded", async ()=>{
  await redirectIfAlreadyAdmin();
  bindLoginForm();
});
