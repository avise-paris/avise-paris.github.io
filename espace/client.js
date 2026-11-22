// Avisé : espace client (le patron voit ses rapports publiés)
import { api, $, esc, fr1, monthLabel, stars, mountLogin, mountNewPassword, SHOWCASE } from "./core.js";

const app = $("#app");
let state = { ests: [], est: null, reports: [], idx: 0 };

api.onRecovery(() => mountNewPassword(app, start));
start();

async function start() {
  const user = await api.session();
  if (!user) return showLogin();
  $("#who").textContent = user.email;
  ["#out", "#print"].forEach((s) => ($(s).hidden = false));
  $("#out").onclick = async () => { await api.signOut(); location.reload(); };
  if (SHOWCASE) { $("#out").hidden = true; $("#who").innerHTML = '<span class="demo" style="margin:0;white-space:nowrap">Démonstration</span>'; }
  $("#print").onclick = () => print();
  try {
    state.ests = await api.establishments();
    if (!state.ests.length) return empty("Aucun établissement n'est encore relié à votre compte. Écrivez-nous et nous le relions tout de suite.");
    await pick(state.ests[0].id);
  } catch (e) { empty("Impossible de charger vos données pour le moment. Réessayez dans quelques minutes."); }
}

function showLogin() {
  ["#out", "#print"].forEach((s) => ($(s).hidden = true)); $("#who").textContent = "";
  mountLogin(app, () => start(), { title: "Votre espace client", hint: "Retrouvez chaque mois votre note, vos avis et nos réponses." });
}

function empty(msg) { app.innerHTML = `<div class="panel empty"><h2>Bienvenue</h2><p class="muted">${esc(msg)}</p></div>`; }

async function pick(estId) {
  state.est = state.ests.find((e) => e.id === estId);
  state.reports = (await api.reports(estId)).filter((r) => r.published !== false);
  state.idx = 0;
  if (!state.reports.length) return empty("Votre premier rapport arrive à la fin de votre premier mois avec nous.");
  render();
}

function delta(cur, prev, key, unit = "", dec = false) {
  if (!prev || prev[key] == null || cur[key] == null) return "";
  const d = cur[key] - prev[key]; if (!d) return `<em>stable vs mois précédent</em>`;
  const v = dec ? fr1(Math.abs(d)) : Math.abs(d);
  return `<em class="${d > 0 ? "up" : "down"}">${d > 0 ? "+" : "−"}${v}${unit} vs mois précédent</em>`;
}

function lineChart(reps) {
  const pts = [...reps].reverse().slice(-12).filter((r) => r.rating != null);
  if (pts.length < 2) return '<p class="muted">La courbe apparaîtra dès le deuxième mois.</p>';
  const vals = pts.map((r) => +r.rating), lo = Math.max(1, Math.floor((Math.min(...vals) - 0.2) * 10) / 10), hi = Math.min(5, Math.ceil((Math.max(...vals) + 0.1) * 10) / 10);
  const W = 520, H = 190, px = (i) => 46 + (i * (W - 70)) / (pts.length - 1), py = (v) => 20 + ((hi - v) * (H - 50)) / (hi - lo || 1);
  const grid = [hi, (hi + lo) / 2, lo].map((v) => `<line x1="40" x2="${W}" y1="${py(v)}" y2="${py(v)}" stroke="var(--line)"/><text x="0" y="${py(v) + 4}" font-size="12" fill="var(--soft)">${fr1(v)}</text>`).join("");
  const line = pts.map((r, i) => `${px(i)},${py(+r.rating)}`).join(" ");
  const lab = pts.map((r, i) => `<text x="${px(i)}" y="${H - 6}" font-size="12" text-anchor="middle" fill="var(--soft)">${monthLabel(r.month, true)}</text>`).join("");
  const last = pts.length - 1;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Évolution de la note Google">${grid}<polyline fill="none" stroke="var(--red)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" points="${line}"/>
    <circle cx="${px(last)}" cy="${py(vals[last])}" r="5" fill="var(--red)"/><text x="${px(last)}" y="${py(vals[last]) - 12}" font-size="13" font-weight="700" text-anchor="end" fill="var(--ink)">${fr1(vals[last])}</text>${lab}</svg>`;
}

function compBars(r) {
  const rows = [{ name: state.est.name, rating: r.rating, reviews: r.reviews_total, me: 1 }, ...(r.competitors || [])].filter((x) => x.rating != null)
    .sort((a, b) => b.rating - a.rating);
  if (rows.length < 2) return '<p class="muted">Comparaison disponible dès que vos voisins sont ajoutés.</p>';
  const rank = rows.findIndex((x) => x.me) + 1;
  return `<p class="muted" style="margin:0 0 6px">Vous êtes <b style="color:var(--ink)">${rank === 1 ? "1er" : rank + "e"} sur ${rows.length}</b> dans votre rue.</p>` +
    rows.map((x) => `<div class="bar${x.me ? " me" : ""}"><span>${esc(x.name)}<small>${x.reviews ?? "–"} avis</small></span><i><s style="width:${(x.rating / 5) * 100}%"></s></i><span>${fr1(x.rating)}</span></div>`).join("");
}

async function render() {
  const r = state.reports[state.idx], p = state.reports[state.idx + 1];
  const hl = await api.highlights(r.id);
  const estSel = state.ests.length > 1 ? `<select id="est" aria-label="Établissement">${state.ests.map((e) => `<option value="${e.id}"${e.id === state.est.id ? " selected" : ""}>${esc(e.name)}</option>`).join("")}</select>` : "";
  app.innerHTML = `
  <div class="head"><h1>${esc(state.est.name)}</h1>${estSel}
    <select id="m" aria-label="Mois du rapport">${state.reports.map((x, i) => `<option value="${i}"${i === state.idx ? " selected" : ""}>Rapport de ${monthLabel(x.month)}</option>`).join("")}</select></div>
  <div class="kpis">
    <div class="kpi"><b>${fr1(r.rating)} <span class="st" style="font-size:22px">★</span></b><span>Note Google</span>${delta(r, p, "rating", "", true)}</div>
    <div class="kpi"><b>${r.new_reviews ?? "–"}</b><span>Nouveaux avis ce mois</span>${delta(r, p, "new_reviews")}</div>
    <div class="kpi"><b>${r.replied_pct ?? "–"} %</b><span>Avis avec une réponse</span>${r.avg_reply_hours != null ? `<em>délai moyen ${fr1(r.avg_reply_hours)} h</em>` : ""}</div>
    <div class="kpi"><b>${r.reviews_total ?? "–"}</b><span>Avis au total</span>${delta(r, p, "reviews_total")}</div>
  </div>
  ${r.summary ? `<div class="panel" style="margin-top:18px"><h3>Le mot d'Avisé</h3><p class="word">${esc(r.summary)}</p></div>` : ""}
  <div class="grid2">
    <div class="panel chart"><h3>Votre note, mois par mois</h3>${lineChart(state.reports)}</div>
    <div class="panel"><h3>Face à votre rue</h3>${compBars(r)}</div>
  </div>
  <div class="grid2">
    <div class="panel"><h3>Ce qu'on a fait ce mois-ci</h3>
      <div class="stat"><span>Publications Google</span><b>${r.posts}</b></div>
      <div class="stat"><span>Photos ajoutées</span><b>${r.photos}</b></div>
      <div class="stat"><span>Avis abusifs signalés à Google</span><b>${r.flagged}</b></div>
      <div class="stat"><span>Dont retirés par Google</span><b>${r.removed}</b></div>
    </div>
    <div class="panel"><h3>Quelques-unes de nos réponses</h3>${hl.length ? hl.map((h) => `<div class="hl"><span class="st">${stars(h.stars)}</span> <b>${esc(h.author)}</b><span class="tag">${esc(h.lang)}</span><div>${esc(h.review_excerpt)}</div><div class="rep">${esc(h.reply)}</div></div>`).join("") : '<p class="muted">Aucune réponse mise en avant ce mois-ci.</p>'}</div>
  </div>
  <p class="legal">Votre fiche Google vous appartient et reste gratuite. Avisé y est ajouté comme gestionnaire ; vous pouvez retirer cet accès à tout moment depuis votre fiche. Une question sur ce rapport ? Répondez simplement à notre e-mail mensuel.</p>`;
  $("#m").onchange = (e) => { state.idx = +e.target.value; render(); };
  if ($("#est")) $("#est").onchange = (e) => pick(e.target.value);
}
