  // ===== dashboard.js =====

// Auth guard
var session = getSession();
if (!session) { window.location.href = 'login.html'; }

document.getElementById('navLogout').style.display = 'inline-block';
document.getElementById('navLogin').style.display  = 'none';

function logout() { apiLogout(); }

async function buildDashboard() {
  var inventory = [];
  try {
    inventory = await apiGetInventory();
  } catch(e) {
    if (e.message === 'Not logged in.') { window.location.href = 'login.html'; return; }
  }

  var total    = inventory.length;
  var totalVal = inventory.reduce(function(s, i) { return s + i.price * i.quantity; }, 0);
  var lowCount = inventory.filter(function(i) { return i.quantity < 5; }).length;
  var avgPrice = total ? (inventory.reduce(function(s, i) { return s + i.price; }, 0) / total) : 0;

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statValue').textContent = '₹' + totalVal.toFixed(0);
  document.getElementById('statLow').textContent   = lowCount;
  document.getElementById('statAvg').textContent   = '₹' + avgPrice.toFixed(0);

  var barsDiv = document.getElementById('stockBars');
  if (inventory.length === 0) {
    barsDiv.innerHTML = '<p style="color:#888; font-size:14px;">No items yet.</p>';
  } else {
    var sorted = inventory.slice().sort(function(a, b) { return b.quantity - a.quantity; });
    var top8   = sorted.slice(0, 8);
    var maxQty = top8[0].quantity || 1;

    barsDiv.innerHTML = top8.map(function(item) {
      var pct   = Math.round((item.quantity / maxQty) * 100);
      var isLow = item.quantity < 5;
      return (
        '<div class="bar-item">' +
          '<div class="bar-label-row">' +
            '<span>' + item.name + '</span>' +
            '<span style="color:#888">' + item.quantity + ' units</span>' +
          '</div>' +
          '<div class="bar-track">' +
            '<div class="bar-fill ' + (isLow ? 'bar-red' : 'bar-green') + '" style="width:' + pct + '%"></div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  var lowItems = inventory.filter(function(i) { return i.quantity < 5; });
  var lowDiv   = document.getElementById('lowList');

  if (lowItems.length === 0) {
    lowDiv.innerHTML = '<p style="color:#1a5c35; font-size:14px;">✅ All items well stocked!</p>';
  } else {
    lowDiv.innerHTML = lowItems.map(function(item) {
      return (
        '<div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #eee; font-size:14px;">' +
          '<span> <b>' + item.name + '</b></span>' +
          '<span style="color:#c0392b; font-weight:bold;">' + item.quantity + ' left</span>' +
        '</div>'
      );
    }).join('');
  }

  var tbody = document.getElementById('summaryBody');
  var empty = document.getElementById('summaryEmpty');
  tbody.innerHTML = '';

  if (inventory.length === 0) {
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    inventory.forEach(function(item, idx) {
      var low     = item.quantity < 5;
      var itemVal = item.price * item.quantity;
      var row = document.createElement('tr');
      row.innerHTML =
        '<td style="color:#888">' + (idx + 1) + '</td>' +
        '<td><b>' + item.name + '</b></td>' +
        '<td style="color:' + (low ? '#c0392b' : '#1a5c35') + '; font-weight:bold;">' + item.quantity + '</td>' +
        '<td>₹' + Number(item.price).toFixed(2) + '</td>' +
        '<td>₹' + itemVal.toFixed(2) + '</td>' +
        '<td>' + (low
          ? '<span class="badge badge-red">⚠️ Low</span>'
          : '<span class="badge badge-green">✅ OK</span>') + '</td>';
      tbody.appendChild(row);
    });
  }
}

buildDashboard();
