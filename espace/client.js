// Avisé : espace client (le patron se connecte avec son identifiant et son mot de passe)
import { $, esc, fr1, monthLabel, stars, SHOWCASE, showcaseData, signIn, resume, signOut } from "./core.js";

const app = $("#app");
let state = { est: null, reports: [], idx: 0 };

start();

async function start() {
  if (SHOWCASE) return open(showcaseData(), true);
  app.innerHTML = '<div class="panel empty"><p class="muted">Chargement…</p></div>';
  const data = await resume();
  data ? open(data) : showLogin();
}

function open(data, showcase) {
  state.est = data; state.idx = 0;
  state.reports = (data.reports || []).slice().sort((a, b) => (a.month < b.month ? 1 : -1));
  $("#who").innerHTML = showcase ? '<span class="demo" style="margin:0;white-space:nowrap">Démonstration</span>' : esc(data.name);
  $("#print").hidden = false; $("#print").onclick = () => print();
  $("#out").hidden = !!showcase; $("#out").onclick = () => { signOut(); location.href = location.pathname; };
  if (!state.reports.length) return empty("Votre premier rapport arrive à la fin de votre premier mois avec nous.");
  render();
}

function showLogin() {
  ["#out", "#print"].forEach((s) => ($(s).hidden = true)); $("#who").textContent = "";
  app.innerHTML = `
  <form class="panel auth" id="f-login" autocomplete="on">
    <h1>Votre espace client</h1>
    <p class="muted">Retrouvez chaque mois votre note, vos avis et nos réponses.</p>
    <label for="l-id">Identifiant</label><input id="l-id" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required>
    <label for="l-pw">Mot de passe</label><input id="l-pw" name="password" type="password" autocomplete="current-password" required>
    <button class="btn wide" type="submit" id="l-go">Se connecter</button>
    <p class="err" id="l-err" role="alert"></p>
    <p class="muted" style="font-size:13px;margin-top:14px">Identifiant ou mot de passe oublié ? Appelez Jules au 07 83 36 89 70 ou écrivez à avise.paris.12@gmail.com : on vous le renvoie dans la journée.</p>
    <p class="demo" style="margin-top:12px">Pas encore client ? Essayez avec l'identifiant <b>demo</b> et le mot de passe <b>avise2026</b>.</p>
  </form>`;
  $("#f-login").addEventListener("submit", async (e) => {
    e.preventDefault(); $("#l-err").textContent = ""; $("#l-go").disabled = true; $("#l-go").textContent = "Connexion…";
    try { open(await signIn($("#l-id").value, $("#l-pw").value)); }
    catch { $("#l-err").textContent = "Identifiant ou mot de passe incorrect."; $("#l-go").disabled = false; $("#l-go").textContent = "Se connecter"; }
  });
}

function empty(msg) { app.innerHTML = `<div class="panel empty"><h2>Bienvenue</h2><p class="muted">${esc(msg)}</p></div>`; }

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

function render() {
  const r = state.reports[state.idx], p = state.reports[state.idx + 1];
  const hl = r.highlights || [];
  const estSel = "";
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
}
