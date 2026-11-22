// Avisé : interface d'administration (toi seul)
import { api, $, esc, fr1, monthLabel, toast, mountLogin, mountNewPassword, DEMO } from "./core.js";

const app = $("#app");
let S = { ests: [], est: null, reports: [], rep: null };

api.onRecovery(() => mountNewPassword(app, start));
start();

async function start() {
  const user = await api.session();
  if (!user) return mountLogin(app, start, { title: "Admin Avisé" });
  if (!(await api.isAdmin())) {
    app.innerHTML = `<div class="panel empty"><h2>Accès réservé</h2><p class="muted">Ce compte n'est pas administrateur. Ajoute ton e-mail dans la table « admins » de Supabase.</p></div>`;
    return;
  }
  $("#who").textContent = user.email; $("#out").hidden = false;
  $("#out").onclick = async () => { await api.signOut(); location.reload(); };
  await loadEsts();
}

async function loadEsts(selectId) {
  S.ests = await api.establishments();
  const id = selectId || S.est?.id || S.ests[0]?.id;
  layout();
  if (id) await openEst(id); else $("#detail").innerHTML = `<div class="panel empty"><h2>Aucun client</h2><p class="muted">Ajoute ton premier établissement à gauche.</p></div>`;
}

function layout() {
  app.innerHTML = `${DEMO ? '<p class="demo">Mode démo : les modifications ne sont pas enregistrées. Renseigne config.js pour passer en vrai.</p>' : ""}
  <div class="adm">
    <aside>
      <div class="panel list"><h3>Clients (${S.ests.length})</h3><div id="ests">${S.ests.map((e) => `<button data-id="${e.id}"${e.id === S.est?.id ? ' class="on"' : ""}>${esc(e.name)}<small>${esc(e.city || "")} · ${esc(e.plan)} · ${esc(e.owner_email)}</small></button>`).join("") || '<p class="muted">Aucun client.</p>'}</div></div>
      <form class="panel" id="f-est" style="margin-top:14px"><h3>Nouveau client</h3>
        <label for="e-name">Établissement</label><input id="e-name" required>
        <label for="e-city">Ville</label><input id="e-city">
        <label for="e-mail">E-mail de connexion du patron</label><input id="e-mail" type="email" required>
        <label for="e-plan">Formule</label><select id="e-plan"><option>Essentiel</option><option selected>Pro</option><option>Premium</option></select>
        <button class="btn wide">Ajouter</button>
        <p class="muted" style="font-size:13px;margin-top:12px">Ensuite, crée son accès : Supabase › Authentication › Users › « Invite user » avec le même e-mail. Il reçoit un lien pour choisir son mot de passe.</p>
      </form>
    </aside>
    <section id="detail"></section>
  </div>`;
  $("#ests").onclick = (e) => { const b = e.target.closest("button[data-id]"); if (b) openEst(b.dataset.id); };
  $("#f-est").onsubmit = async (e) => {
    e.preventDefault();
    try {
      const n = await api.createEstablishment({ name: $("#e-name").value.trim(), city: $("#e-city").value.trim(), owner_email: $("#e-mail").value, plan: $("#e-plan").value });
      toast("Client ajouté."); await loadEsts(n.id);
    } catch (err) { toast("Erreur : " + err.message, true); }
  };
}

async function openEst(id) {
  S.est = S.ests.find((e) => e.id === id);
  document.querySelectorAll("#ests button").forEach((b) => b.classList.toggle("on", b.dataset.id === id));
  S.reports = await api.reports(id);
  const now = new Date(); const def = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const last = S.reports[0];
  S.rep = last ? { ...last } : blank(def);
  renderDetail();
}

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
function blank(d) {
  const prev = S.reports[0];
  return { establishment_id: S.est.id, month: iso(d), rating: prev?.rating ?? null, reviews_total: prev?.reviews_total ?? null, new_reviews: 0, replied_pct: 100,
    avg_reply_hours: null, flagged: 0, removed: 0, posts: 0, photos: 0, summary: "", competitors: prev?.competitors ? JSON.parse(JSON.stringify(prev.competitors)) : [], published: false };
}

function num(id, label, v, step = 1, min = 0, max) {
  return `<div><label for="${id}">${label}</label><input id="${id}" type="number" inputmode="decimal" step="${step}" min="${min}"${max != null ? ` max="${max}"` : ""} value="${v ?? ""}"></div>`;
}

async function renderDetail() {
  const r = S.rep, e = S.est;
  const hl = r.id ? await api.highlights(r.id) : [];
  $("#detail").innerHTML = `
  <div class="panel">
    <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center"><h2 style="margin:0;margin-right:auto">${esc(e.name)}</h2>
      <button class="btn ghost sm" id="new-month">+ Nouveau mois</button><button class="btn ghost sm" id="del-est">Supprimer le client</button></div>
    <div class="months">${S.reports.map((x) => `<button class="chipb${x.month === r.month ? " on" : ""}" data-m="${x.month}"><span class="dot${x.published ? " pub" : ""}"></span>${monthLabel(x.month)}</button>`).join("") || '<span class="muted">Pas encore de rapport.</span>'}</div>
    <form id="f-rep">
      <div class="row4">
        <div><label for="r-month">Mois</label><input id="r-month" type="month" value="${r.month.slice(0, 7)}" required></div>
        ${num("r-rating", "Note Google", r.rating, 0.1, 1, 5)}${num("r-total", "Avis au total", r.reviews_total)}${num("r-new", "Nouveaux avis", r.new_reviews)}
        ${num("r-pct", "% répondus", r.replied_pct, 1, 0, 100)}${num("r-hours", "Délai moyen (h)", r.avg_reply_hours, 0.5)}${num("r-flag", "Avis signalés", r.flagged)}${num("r-rem", "Dont retirés", r.removed)}
        ${num("r-posts", "Publications", r.posts)}${num("r-photos", "Photos ajoutées", r.photos)}
      </div>
      <label for="r-sum">Le mot d'Avisé (ce que le patron lit en premier)</label>
      <textarea id="r-sum" placeholder="Ce qui s'est passé ce mois-ci, en 2 ou 3 phrases simples.">${esc(r.summary || "")}</textarea>
      <hr class="sep"><h3>Concurrents de la rue</h3><p class="muted" style="margin:0">Relevés à la main sur Google Maps : nom, note, nombre d'avis.</p>
      <div id="comps"></div><button type="button" class="btn ghost sm" id="add-comp" style="margin-top:10px">+ Ajouter un concurrent</button>
      <label class="check"><input type="checkbox" id="r-pub"${r.published ? " checked" : ""}> Publié : visible par le client</label>
      <div class="actions"><button class="btn">Enregistrer le rapport</button>${r.id ? '<button type="button" class="btn ghost" id="del-rep">Supprimer ce mois</button>' : ""}</div>
    </form>
  </div>
  <div class="panel" style="margin-top:18px"><h3>Réponses mises en avant</h3>
    ${r.id ? `${hl.map((h) => `<div class="hl"><span class="st">${"★".repeat(h.stars || 0)}</span> <b>${esc(h.author)}</b><span class="tag">${esc(h.lang)}</span> <button class="link" data-del="${h.id}" style="margin:0 0 0 8px">retirer</button><div>${esc(h.review_excerpt)}</div><div class="rep">${esc(h.reply)}</div></div>`).join("") || '<p class="muted">Aucune pour ce mois.</p>'}
    <form id="f-hl"><div class="row3"><div><label for="h-author">Auteur (prénom + initiale)</label><input id="h-author" required></div>
      <div><label for="h-stars">Étoiles</label><select id="h-stars">${[5, 4, 3, 2, 1].map((n) => `<option>${n}</option>`).join("")}</select></div>
      <div><label for="h-lang">Langue</label><input id="h-lang" value="FR" maxlength="3"></div></div>
      <label for="h-ex">Extrait de l'avis (une phrase)</label><input id="h-ex" maxlength="160">
      <label for="h-rep">Notre réponse</label><textarea id="h-rep" required></textarea>
      <button class="btn ghost" style="margin-top:12px">Ajouter</button></form>` : '<p class="muted">Enregistre d\'abord le rapport du mois pour y ajouter des réponses.</p>'}
  </div>`;
  drawComps();
  $("#add-comp").onclick = () => { readComps(); S.rep.competitors.push({ name: "", rating: null, reviews: null }); drawComps(); };
  document.querySelectorAll(".chipb").forEach((b) => (b.onclick = () => { S.rep = { ...S.reports.find((x) => x.month === b.dataset.m) }; renderDetail(); }));
  $("#new-month").onclick = () => {
    const d = S.reports[0] ? new Date(S.reports[0].month + "T12:00:00") : new Date();
    d.setMonth(d.getMonth() + (S.reports[0] ? 1 : -1)); S.rep = blank(new Date(d.getFullYear(), d.getMonth(), 1)); renderDetail();
  };
  $("#del-est").onclick = async () => {
    if (prompt(`Pour supprimer « ${e.name} » et tous ses rapports, tape SUPPRIMER`) !== "SUPPRIMER") return;
    await api.deleteEstablishment(e.id); S.est = null; toast("Client supprimé."); loadEsts();
  };
  if ($("#del-rep")) $("#del-rep").onclick = async () => {
    if (prompt("Pour supprimer ce mois, tape SUPPRIMER") !== "SUPPRIMER") return;
    await api.deleteReport(r.id); toast("Mois supprimé."); openEst(e.id);
  };
  $("#f-rep").onsubmit = saveReport;
  if ($("#f-hl")) {
    $("#f-hl").onsubmit = async (ev) => {
      ev.preventDefault();
      await api.addHighlight({ report_id: r.id, author: $("#h-author").value.trim(), stars: +$("#h-stars").value, lang: $("#h-lang").value.trim().toUpperCase(), review_excerpt: $("#h-ex").value.trim(), reply: $("#h-rep").value.trim() });
      toast("Réponse ajoutée."); renderDetail();
    };
    document.querySelectorAll("[data-del]").forEach((b) => (b.onclick = async () => { await api.deleteHighlight(b.dataset.del); renderDetail(); }));
  }
}

function drawComps() {
  $("#comps").innerHTML = (S.rep.competitors || []).map((c, i) => `<div class="comp" data-i="${i}">
    <input aria-label="Nom du concurrent" placeholder="Nom" value="${esc(c.name)}"><input aria-label="Note" type="number" step="0.1" min="1" max="5" placeholder="Note" value="${c.rating ?? ""}">
    <input aria-label="Nombre d'avis" type="number" min="0" placeholder="Avis" value="${c.reviews ?? ""}"><button type="button" class="x" aria-label="Retirer">×</button></div>`).join("");
  document.querySelectorAll(".comp .x").forEach((b) => (b.onclick = () => { readComps(); S.rep.competitors.splice(+b.parentElement.dataset.i, 1); drawComps(); }));
}
function readComps() {
  S.rep.competitors = [...document.querySelectorAll(".comp")].map((row) => {
    const [n, r, v] = row.querySelectorAll("input");
    return { name: n.value.trim(), rating: r.value === "" ? null : +r.value, reviews: v.value === "" ? null : +v.value };
  });
}

async function saveReport(ev) {
  ev.preventDefault(); readComps();
  const val = (id) => ($("#" + id).value === "" ? null : +$("#" + id).value);
  const rec = {
    establishment_id: S.est.id, month: $("#r-month").value + "-01", rating: val("r-rating"), reviews_total: val("r-total"), new_reviews: val("r-new"),
    replied_pct: val("r-pct"), avg_reply_hours: val("r-hours"), flagged: val("r-flag") ?? 0, removed: val("r-rem") ?? 0, posts: val("r-posts") ?? 0, photos: val("r-photos") ?? 0,
    summary: $("#r-sum").value.trim(), competitors: S.rep.competitors.filter((c) => c.name), published: $("#r-pub").checked,
  };
  if (rec.removed > rec.flagged) return toast("« Dont retirés » ne peut pas dépasser « Avis signalés ».", true);
  try {
    const saved = await api.saveReport(rec);
    toast(rec.published ? "Rapport enregistré et visible par le client." : "Brouillon enregistré (pas encore visible).");
    S.reports = await api.reports(S.est.id); S.rep = { ...S.reports.find((x) => x.month === saved.month) }; renderDetail();
  } catch (err) { toast("Erreur : " + err.message, true); }
}
