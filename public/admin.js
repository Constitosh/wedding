const keyInput = document.getElementById("adminkey");
const saveKeyBtn = document.getElementById("saveKey");
const refreshBtn = document.getElementById("refresh");
const statsBox = document.getElementById("stats");
const tbody = document.getElementById("tbody");
const csvLink = document.getElementById("csv");

function getKey() { return localStorage.getItem("admin_key") || ""; }
function setKey(k) { localStorage.setItem("admin_key", k); }

function attLabel(a) {
  return a === "yes" ? "Wir kommen" : a === "no" ? "Wir kommen nicht" : "Wir kommen am Freitag";
}
function fmt(dt) {
  try { return new Date(dt).toLocaleString(); } catch { return dt; }
}

async function loadStats() {
  const key = getKey();
  if (!key) { statsBox.textContent = "Bitte Admin-Schlüssel eingeben."; return; }
  const res = await fetch(`/api/admin/stats?key=${encodeURIComponent(key)}`);
  if (!res.ok) { statsBox.textContent = "Unauthorized oder Fehler."; return; }
  const { total, yes, no, friday, kids } = await res.json();
  statsBox.textContent = `Gesamt: ${total} • Zusagen: ${yes} • Freitag: ${friday} • Absagen: ${no} • Kinder gesamt: ${kids}`;
}

async function loadRows() {
  const key = getKey();
  if (!key) return;
  const res = await fetch(`/api/admin/rsvps?key=${encodeURIComponent(key)}`);
  if (!res.ok) {
    tbody.innerHTML = `<tr><td colspan="6" style="padding:8px;">Unauthorized oder Fehler.</td></tr>`;
    return;
  }
  const { rows } = await res.json();
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td style="padding:8px; border-bottom:1px solid #f2f2f2;">${fmt(r.created_at)}</td>
      <td style="padding:8px; border-bottom:1px solid #f2f2f2;">${r.name ?? ""}</td>
      <td style="padding:8px; border-bottom:1px solid #f2f2f2;">${r.guests ?? ""}</td>
      <td style="padding:8px; border-bottom:1px solid #f2f2f2;">${r.kids_count ?? 0}</td>
      <td style="padding:8px; border-bottom:1px solid #f2f2f2;">${attLabel(r.attendance)}</td>
      <td style="padding:8px; border-bottom:1px solid #f2f2f2;">${r.notes ?? ""}</td>
    </tr>
  `).join("");
}

saveKeyBtn.addEventListener("click", () => {
  setKey(keyInput.value.trim());
  csvLink.href = `/api/admin/export.csv?key=${encodeURIComponent(getKey())}`;
  loadStats(); loadRows();
});
refreshBtn.addEventListener("click", () => { loadStats(); loadRows(); });

window.addEventListener("DOMContentLoaded", () => {
  keyInput.value = getKey();
  csvLink.href = `/api/admin/export.csv?key=${encodeURIComponent(getKey())}`;
  loadStats(); loadRows();
});
