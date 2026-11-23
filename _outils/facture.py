"""Factures Avisé (micro-entreprise, TVA non applicable).
Usage : python3 facture.py clients/x.json 2026-12            -> facture du mois (prix de la formule, 1er mois réduit automatiquement)
        python3 facture.py clients/x.json 2026-12 "Grand nettoyage des avis:49" "Présentoir sans contact:25:2"
La numérotation est continue et sans trou (registre.json). Ne jamais supprimer une facture : faire un avoir."""
import json, sys, os, html, subprocess, datetime
HERE = os.path.dirname(os.path.abspath(__file__))
F = "/home/claude/video/fonts/package/files"
PRIX = {"Essentiel": (29, 19), "Pro": (49, 29), "Premium": (79, 49)}
MOIS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"]
cfg_p = os.path.join(HERE, 'config.json'); cfg = json.load(open(cfg_p)) if os.path.exists(cfg_p) else {}
cl = json.load(open(sys.argv[1])); ct = cl.get("contrat", {}); mois = sys.argv[2]
reg_p = os.path.join(HERE, "registre.json")
reg = json.load(open(reg_p)) if os.path.exists(reg_p) else []
today = datetime.date.today()
num = f"F{today.year}-{sum(1 for r in reg if r['numero'].startswith(f'F{today.year}-'))+1:03d}"
y, m = map(int, mois.split("-")); lib_mois = f"{MOIS[m-1]} {y}"
deja = any(r["client"] == ct.get("slug") and r.get("abonnement") for r in reg)
p, f1 = PRIX[ct["formule"]]
lignes = [(f"Abonnement Avisé formule {ct['formule']}, {lib_mois}" + ("" if deja else " (premier mois)"), 1, f1 if not deja else p)]
for a in [x for x in sys.argv[3:] if not x.startswith("--")]:
    parts = a.split(":"); lignes.append((parts[0], int(parts[2]) if len(parts) > 2 else 1, float(parts[1])))
total = sum(q * u for _, q, u in lignes)
ech = today + datetime.timedelta(days=15)
e = lambda s: html.escape(str(s))
eur = lambda x: f"{x:,.2f} €".replace(",", " ").replace(".", ",")
rows = "".join(f"<tr><td>{e(d)}</td><td class=r>{q}</td><td class=r>{eur(u)}</td><td class=r>{eur(q*u)}</td></tr>" for d, q, u in lignes)
doc = f"""<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><style>
@font-face{{font-family:F;src:url({F}/fraunces-latin-600-normal.woff2);font-weight:600}}
@page{{size:A4;margin:18mm}}body{{font-family:Inter,Arial,sans-serif;font-size:9.8pt;color:#1b1411;margin:0}}
.top{{display:flex;justify-content:space-between}}h1{{font:600 22pt F;margin:0}}.lg{{font:600 18pt F}}.lg b{{color:#e2483b}}
.box{{display:grid;grid-template-columns:1fr 1fr;gap:10mm;margin:9mm 0}}.box div{{line-height:1.5}}small{{color:#6a5d53}}
table{{width:100%;border-collapse:collapse;margin-top:4mm}}th,td{{padding:2.4mm 2mm;border-bottom:.25mm solid #d8cdbf;text-align:left}}th{{background:#f4ede2;font-size:8.8pt}}.r{{text-align:right}}
.tot td{{font-weight:700;font-size:11pt;border-bottom:0}}.ment{{margin-top:9mm;font-size:8.3pt;color:#4a4039;line-height:1.55}}
</style></head><body>
<div class="top"><div class="lg">Avis<b>é</b></div><div style="text-align:right"><h1>Facture</h1><div>N° <b>{num}</b></div><div>Date : {today.strftime('%d/%m/%Y')}</div></div></div>
<div class="box"><div><small>Émetteur</small><br><b>Jules Pariset EI</b> (nom commercial Avisé)<br>8 rue Durget, 94160 Saint-Mandé<br>SIREN 987 984 887 · SIRET 987 984 887 00016<br>avise.paris.12@gmail.com · 07 83 36 89 70</div>
<div><small>Client</small><br><b>{e(ct.get('raison_sociale',''))}</b><br>{e(ct.get('adresse',''))}<br>{('SIRET '+e(ct['siret'])) if ct.get('siret') else ''}</div></div>
<table><tr><th>Désignation</th><th class=r>Qté</th><th class=r>Prix unitaire</th><th class=r>Montant</th></tr>{rows}
<tr class="tot"><td colspan=3 class=r>Total à payer</td><td class=r>{eur(total)}</td></tr></table>
<div class="ment">TVA non applicable, article 293 B du CGI.<br>Prestation de services réalisée en {lib_mois}. Échéance de paiement : {ech.strftime('%d/%m/%Y')} (15 jours), par virement.<br>
Coordonnées bancaires : {e(cfg.get('iban') or 'IBAN à ajouter dans config.json')}<br>
Pas d'escompte pour paiement anticipé. En cas de retard : pénalités égales à trois fois le taux d'intérêt légal et indemnité forfaitaire pour frais de recouvrement de 40 € (article L441-10 du Code de commerce).</div>
</body></html>"""
os.makedirs(os.path.join(HERE, "factures"), exist_ok=True)
hp = os.path.join(HERE, "factures", num + ".html"); open(hp, "w").write(doc)
pdf = f"/home/claude/print/facture-{num}-{ct.get('slug','client')}.pdf"
subprocess.run(["google-chrome","--headless","--no-sandbox","--disable-gpu","--no-pdf-header-footer",f"--print-to-pdf={pdf}","file://"+hp],check=True,capture_output=True)
if "--essai" not in sys.argv:
    reg.append({"numero": num, "date": str(today), "client": ct.get("slug"), "total": total, "abonnement": True}); json.dump(reg, open(reg_p, "w"), indent=1)
print(pdf, eur(total))
