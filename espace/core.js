// Avisé : couche de données commune (Supabase en vrai, données d'exemple en démo).
const cfg = window.AVISE_CONFIG || {};
const qs = new URLSearchParams(location.search);
export const SHOWCASE = qs.has("demo");          // ?demo=1 : vitrine avec données d'exemple, même en production
export const DEMO = SHOWCASE || !cfg.SUPABASE_URL || cfg.SUPABASE_URL.includes("XXXX") || !cfg.SUPABASE_ANON_KEY || cfg.SUPABASE_ANON_KEY.includes("XXXX");

/* ---------- utilitaires ---------- */
export const $ = (s, r = document) => r.querySelector(s);
export const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const fr1 = (n) => (n == null || n === "" ? "–" : Number(n).toFixed(1).replace(".", ","));
export const monthLabel = (d, short) => new Date(d + (d.length === 10 ? "T12:00:00" : "")).toLocaleDateString("fr-FR", short ? { month: "short" } : { month: "long", year: "numeric" });
export const stars = (n) => "★".repeat(n || 0) + '<span class="off">' + "★".repeat(5 - (n || 0)) + "</span>";
export function toast(msg, bad) {
  let t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.className = bad ? "on bad" : "on"; clearTimeout(t._h); t._h = setTimeout(() => (t.className = ""), 3200);
}

/* ---------- mode démo ---------- */
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));
const demo = (() => {
  const est = { id: "e1", name: "Le Petit Comptoir", city: "Saint-Mandé", owner_email: "patron@exemple.fr", plan: "Pro" };
  const series = [["2026-05-01", 4.1, 87, 4, 35, 60], ["2026-06-01", 4.2, 93, 6, 100, 14], ["2026-07-01", 4.3, 101, 8, 100, 11],
                  ["2026-08-01", 4.4, 110, 9, 100, 10], ["2026-09-01", 4.4, 115, 5, 100, 12], ["2026-10-01", 4.6, 129, 14, 100, 9]];
  const comp = [{ name: "Bistrot du coin", rating: 4.4, reviews: 312 }, { name: "Chez Marcel", rating: 4.2, reviews: 140 }, { name: "La Table d'Anna", rating: 4.0, reviews: 66 }];
  const reports = series.map(([m, r, tot, nw, pct, h], i) => ({ id: "r" + i, establishment_id: "e1", month: m, rating: r, reviews_total: tot, new_reviews: nw,
    replied_pct: pct, avg_reply_hours: h, flagged: i === 5 ? 2 : i % 2, removed: i === 5 ? 1 : 0, posts: i ? 4 : 0, photos: i === 1 ? 12 : 2,
    summary: i === 5 ? "Très bon mois : 14 nouveaux avis grâce aux cartes de table, tous ont reçu une réponse. Le seul avis négatif portait sur l'attente au dessert ; la réponse a été validée par vous le jour même. Pour novembre : photos du nouveau menu d'hiver." : "",
    competitors: comp, published: true }));
  const highlights = [
    { id: "h1", report_id: "r5", stars: 5, lang: "FR", author: "Sophie L.", review_excerpt: "Accueil adorable et plats généreux.", reply: "Merci Sophie ! Toute l'équipe est ravie que vous vous soyez régalés. À très vite au Comptoir." },
    { id: "h2", report_id: "r5", stars: 4, lang: "EN", author: "James P.", review_excerpt: "Great food, a bit slow on Saturday night.", reply: "Thank you James! Saturdays get busy, so we have added a server for weekend evenings." },
    { id: "h3", report_id: "r5", stars: 2, lang: "FR", author: "Karim B.", review_excerpt: "Attente trop longue pour le dessert.", reply: "Bonjour Karim, désolés pour cette attente. Nous avons revu l'organisation du service en salle. Revenez nous voir." }];
  return { ests: [est], reports, highlights, user: SHOWCASE ? { email: "Démonstration" } : null };
})();

/* ---------- API ---------- */
const sb = DEMO ? null : (await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm")).createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
const ok = ({ data, error }) => { if (error) throw new Error(error.message); return data; };
const sortReports = (a) => a.sort((x, y) => (x.month < y.month ? 1 : -1));

export const api = {
  async session() { if (DEMO) return demo.user; const { data } = await sb.auth.getSession(); return data.session?.user || null; },
  async signIn(email, password) {
    if (DEMO) { demo.user = { email }; return demo.user; }
    return ok(await sb.auth.signInWithPassword({ email, password })).user;
  },
  async signOut() { if (DEMO) { demo.user = null; return; } await sb.auth.signOut(); },
  async resetPassword(email) {
    if (DEMO) return;
    ok(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }));
  },
  async updatePassword(password) { if (DEMO) return; ok(await sb.auth.updateUser({ password })); },
  onRecovery(cb) { if (!DEMO) sb.auth.onAuthStateChange((ev) => { if (ev === "PASSWORD_RECOVERY") cb(); }); },
  async isAdmin() {
    if (DEMO) return true;
    const rows = ok(await sb.from("admins").select("email").limit(1)); return rows.length > 0;
  },
  async establishments() {
    if (DEMO) return [...demo.ests];
    return ok(await sb.from("establishments").select("*").order("name"));
  },
  async createEstablishment(e) {
    e.owner_email = e.owner_email.trim().toLowerCase();
    if (DEMO) { const n = { ...e, id: uid() }; demo.ests.push(n); return n; }
    return ok(await sb.from("establishments").insert(e).select().single());
  },
  async deleteEstablishment(id) {
    if (DEMO) { demo.ests = demo.ests.filter((x) => x.id !== id); demo.reports = demo.reports.filter((r) => r.establishment_id !== id); return; }
    ok(await sb.from("establishments").delete().eq("id", id));
  },
  async reports(estId) {
    if (DEMO) return sortReports(demo.reports.filter((r) => r.establishment_id === estId).map((r) => ({ ...r })));
    return ok(await sb.from("reports").select("*").eq("establishment_id", estId).order("month", { ascending: false }));
  },
  async saveReport(r) {
    r.updated_at = new Date().toISOString();
    if (DEMO) {
      const i = demo.reports.findIndex((x) => x.establishment_id === r.establishment_id && x.month === r.month);
      if (i >= 0) { demo.reports[i] = { ...demo.reports[i], ...r }; return demo.reports[i]; }
      const n = { ...r, id: uid() }; demo.reports.push(n); return n;
    }
    delete r.id;
    return ok(await sb.from("reports").upsert(r, { onConflict: "establishment_id,month" }).select().single());
  },
  async deleteReport(id) {
    if (DEMO) { demo.reports = demo.reports.filter((x) => x.id !== id); return; }
    ok(await sb.from("reports").delete().eq("id", id));
  },
  async highlights(reportId) {
    if (DEMO) return demo.highlights.filter((h) => h.report_id === reportId);
    return ok(await sb.from("highlights").select("*").eq("report_id", reportId).order("created_at"));
  },
  async addHighlight(h) {
    if (DEMO) { const n = { ...h, id: uid() }; demo.highlights.push(n); return n; }
    return ok(await sb.from("highlights").insert(h).select().single());
  },
  async deleteHighlight(id) {
    if (DEMO) { demo.highlights = demo.highlights.filter((h) => h.id !== id); return; }
    ok(await sb.from("highlights").delete().eq("id", id));
  },
};

/* ---------- connexion commune aux deux pages ---------- */
export function mountLogin(root, onIn, { title = "Connexion", hint = "" } = {}) {
  root.innerHTML = `
  <form class="panel auth" id="f-login">
    <h1>${esc(title)}</h1>${hint ? `<p class="muted">${hint}</p>` : ""}
    ${DEMO ? '<p class="demo">Mode démo : entrez n\'importe quel e-mail et mot de passe.</p>' : ""}
    <label for="l-email">E-mail</label><input id="l-email" type="email" autocomplete="username" required>
    <label for="l-pw">Mot de passe</label><input id="l-pw" type="password" autocomplete="current-password" required>
    <button class="btn wide" type="submit">Se connecter</button>
    <button class="link" type="button" id="l-forgot">Mot de passe oublié ?</button>
    <p class="err" id="l-err" role="alert"></p>
  </form>`;
  $("#f-login").addEventListener("submit", async (e) => {
    e.preventDefault(); $("#l-err").textContent = "";
    try { const u = await api.signIn($("#l-email").value.trim(), $("#l-pw").value); onIn(u); }
    catch (err) { $("#l-err").textContent = "Connexion impossible : vérifiez votre e-mail et votre mot de passe."; }
  });
  $("#l-forgot").addEventListener("click", async () => {
    const email = $("#l-email").value.trim();
    if (!email) { $("#l-err").textContent = "Entrez d'abord votre e-mail ci-dessus."; return; }
    try { await api.resetPassword(email); toast("Si un compte existe, un e-mail de réinitialisation vient de partir."); }
    catch { $("#l-err").textContent = "Envoi impossible pour le moment. Réessayez dans quelques minutes."; }
  });
}

export function mountNewPassword(root, done) {
  root.innerHTML = `<form class="panel auth" id="f-np"><h1>Nouveau mot de passe</h1>
    <label for="np">Choisissez un mot de passe (8 caractères minimum)</label><input id="np" type="password" minlength="8" autocomplete="new-password" required>
    <button class="btn wide">Enregistrer</button><p class="err" id="np-err" role="alert"></p></form>`;
  $("#f-np").addEventListener("submit", async (e) => {
    e.preventDefault();
    try { await api.updatePassword($("#np").value); toast("Mot de passe enregistré."); done(); }
    catch (err) { $("#np-err").textContent = "Enregistrement impossible : " + err.message; }
  });
}
