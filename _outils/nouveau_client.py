"""Arrivée d'un nouveau client, en une commande.
Usage : python3 nouveau_client.py "Nom du commerce" <place_id ou lien d'avis Google> <Essentiel|Pro|Premium> [--publier]
Crée : identifiant + mot de passe + espace chiffré, page de lien NFC /r/<slug>/, chevalet personnalisé (PDF),
dossier de signature pré-rempli (PDF). Avec --publier : met le site en ligne (git push)."""
import sys, os, json, re, html, subprocess, unicodedata, qrcode, qrcode.image.svg
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = "/home/claude/avise._"; PRINT = "/home/claude/print"
sys.path.insert(0, HERE); import chiffrer
nom, src, formule = sys.argv[1], sys.argv[2], sys.argv[3]
slug = chiffrer.norm(nom)
url = src if src.startswith("http") else f"https://search.google.com/local/writereview?placeid={src}"
# 1. fichier client privé
p = os.path.join(HERE, "clients", slug + ".json")
c = json.load(open(p)) if os.path.exists(p) else {"password": "", "data": {"name": nom, "plan": formule, "reports": []}}
c.setdefault("contrat", {}).update({"slug": slug, "raison_sociale": c.get("contrat", {}).get("raison_sociale") or nom, "formule": formule})
c["avis_url"] = url
os.makedirs(os.path.dirname(p), exist_ok=True); json.dump(c, open(p, "w"), ensure_ascii=False, indent=1)
# 2. espace chiffré
chiffrer.chiffrer(slug)
c = json.load(open(p))
# 3. page de lien NFC
tpl = open(os.path.join(SITE, "r/exemple/index.html")).read()
tpl = re.sub(r"<!--.*?-->\n", "", tpl, flags=re.S).replace("https://g.page/r/REMPLACER/review", url)
os.makedirs(os.path.join(SITE, "r", slug), exist_ok=True); open(os.path.join(SITE, "r", slug, "index.html"), "w").write(tpl)
lien = f"https://avise-paris.github.io/r/{slug}/"
# 4. chevalet personnalisé (2 exemplaires sur une feuille A4)
qrcode.make(lien, image_factory=qrcode.image.svg.SvgPathImage, border=1).save(os.path.join(PRINT, f"qr-{slug}.svg"))
base = open(os.path.join(PRINT, "chevalets-demo.html")).read()
head = base.split("</style>")[0] + "</style></head><body>"
face = re.search(r'(<div class="face back">.*?</div></div>\s*)(?=<div class="face">)', base, re.S)
src_tent = re.search(r'<div class="tent">.*?</div></div></div>', base, re.S).group(0)
first_name = re.search(r'<div class="nm">(.*?)</div>', src_tent).group(1); first_slug = re.search(r'qr-(.*?)\.svg', src_tent).group(1)
tent = src_tent.replace(first_name, html.escape(nom)).replace(f"qr-{first_slug}.svg", f"qr-{slug}.svg")
open(os.path.join(PRINT, f"chevalet-{slug}.html"), "w").write(head + f'<div class="sheet">{tent}{tent}<div class="fold"><span>pliez ici · fold here</span></div></div></body></html>')
subprocess.run(["google-chrome","--headless","--no-sandbox","--disable-gpu","--no-pdf-header-footer",f"--print-to-pdf={PRINT}/avise-chevalet-{slug}.pdf","file://"+os.path.join(PRINT,f"chevalet-{slug}.html")],check=True,capture_output=True)
# 5. dossier de signature pré-rempli
subprocess.run([sys.executable, os.path.join(HERE, "dossier.py"), p], check=True, capture_output=True)
if "--publier" in sys.argv:
    subprocess.run(f'cd {SITE} && git add -A && git commit -qm "Nouveau client : {slug}" && git push -q origin main && git push -q origin main:gh-pages', shell=True)
print(f"""
Client : {nom}
Identifiant : {slug}
Mot de passe : {c['password']}
Lien NFC à programmer : {lien}
Chevalet : {PRINT}/avise-chevalet-{slug}.pdf
Dossier de signature : {PRINT}/avise-dossier-signature-{slug}.pdf""")
