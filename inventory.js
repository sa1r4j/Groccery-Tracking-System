
var session = getSession();
if (!session) { window.location.href = 'login.html'; }

document.getElementById('navLogout').style.display = 'inline-block';
document.getElementById('navLogin').style.display  = 'none';

function logout() { apiLogout(); }

var _inventory = [];

async function loadAndRender() {
  try {
    _inventory = await apiGetInventory();
  } catch(e) {
    _inventory = [];
    if (e.message === 'Not logged in.') { window.location.href = 'login.html'; return; }
  }
  render();
}

async function addItem() {
  var name  = document.getElementById('itemName').value.trim();
  var qty   = document.getElementById('itemQty').value;
  var price = document.getElementById('itemPrice').value;
  var err   = document.getElementById('addError');

  if (!name)        { err.textContent = 'Please enter item name.';     return; }
  if (qty === '')   { err.textContent = 'Please enter quantity.';       return; }
  if (price === '') { err.textContent = 'Please enter price.';          return; }
  if (qty < 0)      { err.textContent = 'Quantity cannot be negative.'; return; }
  if (price < 0)    { err.textContent = 'Price cannot be negative.';    return; }

  try {
    await apiAddItem(name, Number(qty), Number(price));
    err.textContent = '';
    document.getElementById('itemName').value  = '';
    document.getElementById('itemQty').value   = '';
    document.getElementById('itemPrice').value = '';
    loadAndRender();
  } catch(e) {
    err.textContent = e.message;
  }
}

function render() {
  var filter = document.getElementById('searchInput').value.toLowerCase();
  var list   = filter
    ? _inventory.filter(function(i) { return i.name.toLowerCase().includes(filter); })
    : _inventory.slice();

  var tbody = document.getElementById('tableBody');
  var empty = document.getElementById('emptyMsg');
  tbody.innerHTML = '';

  if (list.length === 0) {
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    list.forEach(function(item, idx) {
      var low = item.quantity < 5;
      var row = document.createElement('tr');
      row.innerHTML =
        '<td style="color:#888">' + (idx + 1) + '</td>' +
        '<td><b>' + item.name + '</b></td>' +
        '<td style="color:' + (low ? '#c0392b' : '#1a5c35') + '; font-weight:bold;">' + item.quantity + '</td>' +
        '<td>₹' + Number(item.price).toFixed(2) + '</td>' +
        '<td>' + (low
          ? '<span class="badge badge-red">⚠️ Low</span>'
          : '<span class="badge badge-green">✅ OK</span>') + '</td>' +
        '<td>' +
          '<button class="btn btn-yellow" onclick="openEdit(' + item.id + ')" style="margin-right:6px;">✏️ Edit</button>' +
          '<button class="btn btn-red"    onclick="deleteItem(' + item.id + ')">🗑️ Delete</button>' +
        '</td>';
      tbody.appendChild(row);
    });
  }

  updateBadges();
}

function updateBadges() {
  var lowCount = _inventory.filter(function(i) { return i.quantity < 5; }).length;
  var totalVal = _inventory.reduce(function(s, i) { return s + i.price * i.quantity; }, 0);

  var lb = document.getElementById('lowBadge');
  if (lowCount > 0) {
    lb.textContent   = '⚠️ ' + lowCount + ' Low Stock';
    lb.style.display = 'inline-block';
  } else {
    lb.style.display = 'none';
  }
  document.getElementById('valueBadge').textContent = 'Total: ₹' + totalVal.toFixed(2);
}

async function deleteItem(id) {
  if (!confirm('Delete this item?')) return;
  try {
    await apiDeleteItem(id);
    loadAndRender();
  } catch(e) {
    alert(e.message);
  }
}

function openEdit(id) {
  var item = _inventory.find(function(i) { return i.id === id; });
  if (!item) return;
  document.getElementById('editId').value    = item.id;
  document.getElementById('editName').value  = item.name;
  document.getElementById('editQty').value   = item.quantity;
  document.getElementById('editPrice').value = item.price;
  document.getElementById('editError').textContent = '';
  document.getElementById('editModal').classList.add('open');
}

function closeModal() {
  document.getElementById('editModal').classList.remove('open');
}

async function saveEdit() {
  var id    = Number(document.getElementById('editId').value);
  var name  = document.getElementById('editName').value.trim();
  var qty   = document.getElementById('editQty').value;
  var price = document.getElementById('editPrice').value;
  var err   = document.getElementById('editError');

  if (!name)    { err.textContent = 'Name cannot be empty.';         return; }
  if (qty < 0)  { err.textContent = 'Quantity cannot be negative.';  return; }
  if (price < 0){ err.textContent = 'Price cannot be negative.';     return; }

  try {
    await apiEditItem(id, name, Number(qty), Number(price));
    closeModal();
    loadAndRender();
  } catch(e) {
    err.textContent = e.message;
  }
}
document.getElementById('editModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
document.addEventListener('keydown', function(e) {
  if (document.getElementById('editModal').classList.contains('open')) {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Enter')  saveEdit();
    return;
  }
  if (e.key === 'Enter') addItem();
});

loadAndRender();
