"""Dossier de signature Avisé : contrat + détail des formules + formulaire de rétractation.
Usage : python3 dossier.py                -> dossier vierge à remplir à la main
        python3 dossier.py clients/x.json -> dossier pré-rempli (champs "contrat" du fichier client)"""
import json, sys, html, subprocess, os
F = "/home/claude/video/fonts/package/files"
c = {}
if len(sys.argv) > 1:
    c = json.load(open(sys.argv[1])).get("contrat", {})
def v(k, w=40):
    x = c.get(k)
    return f"<b>{html.escape(str(x))}</b>" if x else f'<span class="line" style="min-width:{w}mm"></span>'
def box(k, val):
    return "☒" if c.get(k) == val else "☐"
PRIX = {"Essentiel": (29, 19), "Pro": (49, 29), "Premium": (79, 49)}
css = f"""@font-face{{font-family:F;src:url({F}/fraunces-latin-600-normal.woff2);font-weight:600}}
@page{{size:A4;margin:16mm 17mm 16mm}}*{{box-sizing:border-box}}
body{{font-family:Inter,Arial,sans-serif;font-size:9.6pt;line-height:1.45;color:#1b1411;margin:0}}
h1{{font:600 17pt/1.15 F;margin:0 0 1mm}}h2{{font:600 11pt F;margin:4.5mm 0 1mm;break-after:avoid;page-break-after:avoid}}p{{orphans:3;widows:3}}
.sub{{color:#6a5d53;font-size:8.6pt;margin-bottom:4mm}}
.line{{display:inline-block;border-bottom:.3mm solid #1b1411;height:4mm;vertical-align:-1mm}}
p{{margin:0 0 1.6mm}}ol{{margin:0;padding-left:5mm}}li{{margin-bottom:1.4mm}}
table{{width:100%;border-collapse:collapse;font-size:8.8pt;margin-top:2mm}}td,th{{border:.25mm solid #cfc4b6;padding:1.6mm 2mm;text-align:left;vertical-align:top}}th{{background:#f4ede2}}
.sign{{display:grid;grid-template-columns:1fr 1fr;gap:10mm;margin-top:5mm}}.sign div{{border:.3mm solid #cfc4b6;border-radius:2mm;height:30mm;padding:2mm 3mm;font-size:8.6pt;color:#6a5d53}}
.brk{{page-break-before:always}}.small{{font-size:8pt;color:#6a5d53}}.cut{{border-top:.3mm dashed #8a7d72;margin:6mm 0 4mm;text-align:center;font-size:7.5pt;color:#8a7d72}}
"""
f = c.get("formule")
prix = PRIX.get(f)
doc = f"""<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><style>{css}</style></head><body>
<h1>Contrat de prestation<br>Gestion des avis et de la présence en ligne</h1>
<div class="sub">Avisé · avise-paris.github.io · 07 83 36 89 70 · avise.paris.12@gmail.com</div>
<p><b>Entre</b> Jules Pariset, entrepreneur individuel, nom commercial Avisé, SIREN 987 984 887, 8 rue Durget, 94160 Saint-Mandé (« le Prestataire »),</p>
<p><b>et</b> {v('raison_sociale',70)}, SIRET {v('siret',40)},<br>adresse {v('adresse',110)},<br>représenté par {v('representant',55)}, en qualité de {v('qualite',35)}, nombre de salariés {v('salaries',15)} (« le Client »).</p>
<h2>1. Objet</h2><p>Le Prestataire gère les avis et la fiche d'établissement Google du Client et, selon la formule, ses fiches sur d'autres plateformes. Le détail des formules figure en annexe.</p>
<h2>2. Formule et prix</h2>
<p>{box('formule','Essentiel')} Essentiel : 29 € par mois (premier mois 19 €) &nbsp; {box('formule','Pro')} Pro : 49 € par mois (premier mois 29 €) &nbsp; {box('formule','Premium')} Premium : 79 € par mois (premier mois 49 €)</p>
<p>Options : {box('nettoyage',True)} Grand nettoyage des avis existants, 49 € une fois &nbsp; {box('presentoir',True)} Présentoir sans contact, 25 € pièce, quantité {v('presentoirs',12)}</p>
<p>TVA non applicable, article 293 B du CGI. Facturation chaque mois à terme échu. Paiement par prélèvement SEPA, sur mandat signé par le Client : la facture vaut pré-notification et le prélèvement intervient au plus tôt 2 jours après son envoi. À défaut de mandat, paiement par virement à 15 jours. Tout retard entraîne des pénalités égales à trois fois le taux d'intérêt légal et une indemnité forfaitaire de 40 € pour frais de recouvrement (article L441-10 du Code de commerce).</p>
<h2>3. Fiche Google gratuite</h2><p>La fiche d'établissement Google est un service gratuit de Google. Le Prestataire facture uniquement son travail de gestion. Il n'est ni Google ni partenaire de Google.</p>
<h2>4. Accès et propriété</h2><p>Le Client reste propriétaire de sa fiche. Il y ajoute le Prestataire comme gestionnaire ; aucun mot de passe n'est transmis. Il peut retirer cet accès à tout moment. À la fin du contrat, le Prestataire retire ses accès sous 7 jours ouvrés et remet ses rapports.</p>
<h2>5. Autorisation écrite</h2><p>Par sa signature, le Client autorise le Prestataire à : répondre aux avis en son nom selon le ton convenu ; modifier les informations de la fiche (horaires, photos, description, publications) ; signaler à Google les avis qui enfreignent ses règles. Pendant les 14 premiers jours, chaque réponse est soumise au Client avant publication. Les sujets sensibles lui sont toujours soumis.</p>
<h2>6. Engagements du Prestataire</h2><p>Le Prestataire ne publie ni ne commande aucun faux avis, ne sollicite pas d'avis de façon sélective, n'offre aucune contrepartie contre un avis et respecte les règles de Google. Il est tenu d'une obligation de moyens : aucun résultat (note, classement, suppression d'avis) n'est garanti, la décision de retrait appartenant à Google ou au juge. Pour un avis diffamatoire, il rassemble les preuves et oriente le Client vers un avocat ; il ne donne pas de conseil juridique.</p>
<h2>7. Durée</h2><p>Contrat sans durée minimale, à compter du {v('debut',30)}. Chaque partie peut y mettre fin par e-mail avec un préavis d'un mois.</p>
<h2>8. Données personnelles</h2><p>Le Prestataire ne conserve que les données nécessaires à la prestation et les supprime dans les 3 mois suivant la fin du contrat. Détails : avise-paris.github.io/confidentialite.html.</p>
<h2>9. Droit de rétractation</h2><p>Si le Client emploie 5 salariés ou moins, que le contrat est signé hors des locaux du Prestataire et que son objet n'entre pas dans le champ de son activité principale, il peut se rétracter sans motif dans les 14 jours suivant la signature, avec le formulaire joint ou par toute déclaration claire. Aucune somme n'est facturée avant la fin de ce délai.</p>
<p>{box('debut_anticipe',True)} Je demande que la prestation commence avant la fin du délai de rétractation. Si je me rétracte, je paierai seulement la part déjà réalisée.</p>
<p>Les conditions générales de vente (avise-paris.github.io/cgv.html) complètent ce contrat ; ce contrat prévaut en cas de différence.</p>
<p>Fait à {v('lieu',35)}, le {v('date',30)}, en deux exemplaires.</p>
<div class="sign"><div>Le Prestataire<br>Jules Pariset, Avisé</div><div>Le Client<br>Nom, qualité, signature et cachet<br>précédés de « Lu et approuvé »</div></div>

<div class="brk"></div>
<h1>Annexe : détail des formules</h1><div class="sub">Partie intégrante du contrat.</div>
<table><tr><th style="width:34%">Prestation</th><th>Essentiel<br>29 € / mois</th><th>Pro<br>49 € / mois</th><th>Premium<br>79 € / mois</th></tr>
<tr><td>Réponse à tous les avis Google, dans la langue du client, sous 24 h pour un avis négatif</td><td>✓</td><td>✓</td><td>✓</td></tr>
<tr><td>Signalement et suivi des avis abusifs (faux avis, hors sujet, insultes, attaques coordonnées)</td><td>✓</td><td>✓</td><td>✓</td></tr>
<tr><td>Rapport mensuel et espace client en ligne</td><td>✓</td><td>✓</td><td>✓</td></tr>
<tr><td>Cartes de table sans contact pour récolter de vrais avis</td><td></td><td>✓</td><td>✓</td></tr>
<tr><td>Fiche refaite (horaires, jours fériés, menu, catégories, description) et 1 publication Google par semaine</td><td></td><td>✓</td><td>✓</td></tr>
<tr><td>Photos prises sur place</td><td></td><td></td><td>✓</td></tr>
<tr><td>Gestion des fiches Apple Plans, TripAdvisor, Bing, Waze et TheFork (abonnement TheFork éventuel payé par le Client à TheFork)</td><td></td><td></td><td>✓</td></tr>
</table>
<p class="small" style="margin-top:3mm">Premier mois au tarif réduit indiqué au contrat. Les cartes de table restent la propriété du Prestataire et sont reprises à la fin du contrat ; les présentoirs achetés appartiennent au Client.</p>
<h2>Ton des réponses convenu</h2>
<p>{box('ton','vous')} Vouvoiement &nbsp; {box('ton','tu')} Tutoiement &nbsp; Signature des réponses : {v('signature_reponses',60)}</p>
<p>Sujets à toujours soumettre au Client : {v('sujets_sensibles',100)}</p>
<p>Téléphone pour valider les réponses (SMS) : {v('tel_validation',45)}</p>

<div class="brk"></div>
<h1>Formulaire de rétractation</h1>
<div class="sub">À compléter et renvoyer uniquement si vous souhaitez vous rétracter, dans les 14 jours suivant la signature.</div>
<p>À l'attention de Jules Pariset, Avisé, 8 rue Durget, 94160 Saint-Mandé, avise.paris.12@gmail.com :</p>
<p>Je vous notifie par la présente ma rétractation du contrat portant sur la prestation de services ci-dessous :</p>
<p>Contrat signé le : <span class="line" style="min-width:40mm"></span></p>
<p>Nom du client : <span class="line" style="min-width:110mm"></span></p>
<p>Adresse du client : <span class="line" style="min-width:110mm"></span></p>
<p style="margin-top:6mm">Date : <span class="line" style="min-width:40mm"></span> &nbsp;&nbsp; Signature : <span class="line" style="min-width:60mm"></span></p>
<div class="cut">Exemplaire conservé par le Client</div>
<p class="small">Ce formulaire peut aussi être envoyé par e-mail à avise.paris.12@gmail.com. Une simple déclaration claire (e-mail, lettre) suffit également.</p>
</body></html>"""
name = c.get("slug", "vierge")
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), f"dossier-{name}.html")
open(out, "w").write(doc)
pdf = f"/home/claude/print/avise-dossier-signature-{name}.pdf"
subprocess.run(["google-chrome", "--headless", "--no-sandbox", "--disable-gpu", "--no-pdf-header-footer", f"--print-to-pdf={pdf}", "file://" + out], check=True, capture_output=True)
print(pdf)
