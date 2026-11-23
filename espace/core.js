// Avisé : espace client sans serveur.
// Chaque client a un fichier chiffré (AES-256-GCM, clé dérivée du mot de passe par PBKDF2-SHA256).
// Le fichier est illisible sans le bon mot de passe ; le déchiffrement se fait dans le navigateur du client.
const qs = new URLSearchParams(location.search);
export const SHOWCASE = qs.has("demo");          // ?demo=1 : vitrine avec données d'exemple, sans connexion

/* ---------- utilitaires ---------- */
export const $ = (s, r = document) => r.querySelector(s);
export const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const fr1 = (n) => (n == null || n === "" ? "–" : Number(n).toFixed(1).replace(".", ","));
export const monthLabel = (d, short) => new Date(d + (d.length === 10 ? "T12:00:00" : "")).toLocaleDateString("fr-FR", short ? { month: "short" } : { month: "long", year: "numeric" });
export const stars = (n) => "★".repeat(n || 0) + '<span class="off">' + "★".repeat(5 - (n || 0)) + "</span>";

/* ---------- données de la vitrine (?demo=1) ---------- */
export function showcaseData() {
  const series = [["2026-05-01", 4.1, 87, 4, 35, 60], ["2026-06-01", 4.2, 93, 6, 100, 14], ["2026-07-01", 4.3, 101, 8, 100, 11],
                  ["2026-08-01", 4.4, 110, 9, 100, 10], ["2026-09-01", 4.4, 115, 5, 100, 12], ["2026-10-01", 4.6, 129, 14, 100, 9]];
  const comp = [{ name: "Bistrot du coin", rating: 4.4, reviews: 312 }, { name: "Chez Marcel", rating: 4.2, reviews: 140 }, { name: "La Table d'Anna", rating: 4.0, reviews: 66 }];
  const hl = [
    { stars: 5, lang: "FR", author: "Sophie L.", review_excerpt: "Accueil adorable et plats généreux.", reply: "Merci Sophie ! Toute l'équipe est ravie que vous vous soyez régalés. À très vite au Comptoir." },
    { stars: 4, lang: "EN", author: "James P.", review_excerpt: "Great food, a bit slow on Saturday night.", reply: "Thank you James! Saturdays get busy, so we have added a server for weekend evenings." },
    { stars: 2, lang: "FR", author: "Karim B.", review_excerpt: "Attente trop longue pour le dessert.", reply: "Bonjour Karim, désolés pour cette attente. Nous avons revu l'organisation du service en salle. Revenez nous voir." }];
  return {
    name: "Le Petit Comptoir", city: "Saint-Mandé", plan: "Pro",
    reports: series.map(([m, r, tot, nw, pct, h], i) => ({ month: m, rating: r, reviews_total: tot, new_reviews: nw, replied_pct: pct, avg_reply_hours: h,
      flagged: i === 5 ? 2 : i % 2, removed: i === 5 ? 1 : 0, posts: i ? 4 : 0, photos: i === 1 ? 12 : 2,
      summary: i === 5 ? "Très bon mois : 14 nouveaux avis grâce aux cartes de table, tous ont reçu une réponse. Le seul avis négatif portait sur l'attente au dessert ; la réponse a été validée par vous le jour même. Pour novembre : photos du nouveau menu d'hiver." : "",
      competitors: comp, highlights: i === 5 ? hl : [] })).reverse(),
  };
}

/* ---------- chiffrement ---------- */
const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
export const normId = (id) => String(id || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
async function fileName(id) { return hex(await crypto.subtle.digest("SHA-256", enc.encode("avise:" + normId(id)))).slice(0, 24); }

async function deriveKey(password, salt, iter) {
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, true, ["decrypt"]);
}
async function openBox(box, key) {
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(box.i) }, key, b64(box.c));
  return JSON.parse(dec.decode(pt));
}
async function fetchBox(id) {
  const r = await fetch(`d/${await fileName(id)}.json`, { cache: "no-store" });
  if (!r.ok) throw new Error("absent");
  return r.json();
}

/* ---------- session (onglet en cours uniquement) ---------- */
const SK = "avise-session";
export async function signIn(id, password) {
  const box = await fetchBox(id);                                  // identifiant inconnu → erreur
  const key = await deriveKey(password, b64(box.s), box.n);
  const data = await openBox(box, key);                            // mauvais mot de passe → erreur
  try { sessionStorage.setItem(SK, JSON.stringify({ id: normId(id), k: await crypto.subtle.exportKey("jwk", key) })); } catch {}
  return data;
}
export async function resume() {
  try {
    const s = JSON.parse(sessionStorage.getItem(SK) || "null"); if (!s) return null;
    const key = await crypto.subtle.importKey("jwk", s.k, { name: "AES-GCM" }, false, ["decrypt"]);
    return await openBox(await fetchBox(s.id), key);
  } catch { signOut(); return null; }
}
export function signOut() { try { sessionStorage.removeItem(SK); } catch {} }
