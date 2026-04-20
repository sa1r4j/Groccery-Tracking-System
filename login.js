function showTab(tab) {
  var isLogin = tab === 'login';
  document.getElementById('loginSection').style.display = isLogin ? 'block' : 'none';
  document.getElementById('registerSection').style.display = isLogin ? 'none' : 'block';
  document.getElementById('loginTab').className = isLogin ? 'active' : '';
  document.getElementById('registerTab').className = isLogin ? '' : 'active';
}
function showAlert(id, type, msg) {
  var el = document.getElementById(id);
  el.className = 'alert show alert-' + type;
  el.textContent = msg;
}
async function handleRegister() {
  var name = document.getElementById('regName').value.trim();
  var email = document.getElementById('regEmail').value.trim().toLowerCase();
  var password = document.getElementById('regPassword').value;
  var confirm = document.getElementById('regConfirm').value;
  if (!name || !email || !password)
    return showAlert('registerAlert','error','Please fill in all fields.');
  if (password.length < 6)
    return showAlert('registerAlert','error','Password must be at least 6 characters.');
  if (password !== confirm)
    return showAlert('registerAlert','error','Passwords do not match.');
  try {
    await apiRegister(name,email,password);
    showAlert('registerAlert','success',
      'Account created! Switching to login...');
    setTimeout(function(){
      showTab('login');
      document.getElementById('loginEmail').value = email;
    },1500);
  } catch(err) {
    showAlert('registerAlert','error',err.message);
  }
}
async function handleLogin() {
  var email = document.getElementById('loginEmail').value.trim().toLowerCase();
  var password = document.getElementById('loginPassword').value;
  try {
    await apiLogin(email,password);
    showAlert('loginAlert','success',
      'Login successful! Redirecting...');
    setTimeout(function(){
      window.location.href='inventory.html';
    },1200);
  } catch(err) {
    showAlert('loginAlert','error',err.message);
  }
}