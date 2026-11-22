// Avisé : réglages de l'espace client.
// 1. Dans Supabase > Project Settings > API, copie « Project URL » et la clé « anon public ».
// 2. Colle-les ci-dessous à la place des XXXX.
// Tant que les XXXX sont là, l'espace tourne en MODE DÉMO avec des données d'exemple.
// La clé « anon » peut être publique : ce sont les règles de sécurité de la base qui protègent les données.
// Ne mets JAMAIS ici la clé « service_role ».
window.AVISE_CONFIG = {
  SUPABASE_URL: "https://XXXX.supabase.co",
  SUPABASE_ANON_KEY: "XXXX"
};
