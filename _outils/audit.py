"""Pages d'audit en ligne (non référencées) : python3 audit.py  -> /audit/<slug>/ pour chaque cible de targets.json"""
import json, html, os, sys
from urllib.parse import quote
SITE="/home/claude/avise._"; e=html.escape
T=json.load(open(sys.argv[1] if len(sys.argv)>1 else "/home/claude/targets.json"))
L={x["name"]:x["slug"] for x in json.load(open("/home/claude/demo-links.json"))}
fr=lambda x:f"{x:.1f}".replace(".",",")
num=lambda n:f"{n:,}".replace(","," ")
def bar(name,r,c,me):
    w=max(4,(r-3.5)/1.5*100)
    return f'<div class="cmp{" me" if me else ""}"><div class="cn">{e(name)}</div><div class="cb"><i style="width:{w:.0f}%"></i></div><div class="cr"><b>{fr(r)}</b> <small>{num(c)} avis</small></div></div>'
for x in T:
    slug=L[x["name"]]
    rows=[(x["name"],x["rating"],x["count"],True)]+[(a,b,c,False) for a,b,c in x["comp"]]
    rows.sort(key=lambda r:-r[1]); rank=[r[3] for r in rows].index(True)+1
    page=f"""<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Audit Google · {e(x['name'])} · Avisé</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{{--ink:#1d1a17;--ink2:#5f584f;--line:#e6dfd2;--paper:#faf6ee;--red:#b0241b;--green:#1e8a4a}}
*{{box-sizing:border-box;margin:0;min-width:0}}body{{font:16px/1.55 Inter,system-ui,sans-serif;color:var(--ink);background:var(--paper)}}
.wrap{{max-width:680px;margin:0 auto;padding:20px 18px 48px}}
.top{{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid var(--line);padding-bottom:12px}}
.logo{{font:400 28px "Instrument Serif",serif;color:var(--ink);text-decoration:none}}.top span{{font-size:13px;color:var(--ink2)}}
h1{{font:400 clamp(36px,9vw,52px)/1.02 "Instrument Serif",serif;margin:26px 0 6px;text-wrap:balance}}
.sub{{color:var(--ink2);font-size:14.5px}}
h2{{font:400 28px/1.1 "Instrument Serif",serif;margin:34px 0 12px}}
.score{{display:grid;grid-template-columns:auto 1fr;gap:18px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:18px;padding:20px;margin-top:22px}}
.big{{font:400 76px/0.9 "Instrument Serif",serif}}.big small{{font:600 15px Inter;color:var(--ink2);display:block;margin-top:6px}}
.score p{{font-size:15px}}.score strong{{color:var(--red)}}
.cmp{{display:grid;grid-template-columns:minmax(0,1.3fr) 1fr auto;gap:12px;align-items:center;padding:11px 0;border-bottom:1px solid var(--line);font-size:14.5px}}
.cmp.me .cn{{font-weight:700}}.cb{{height:10px;border-radius:5px;background:#ece5d8;overflow:hidden}}.cb i{{display:block;height:100%;background:#a89f92;border-radius:5px}}
.cmp.me .cb i{{background:var(--red)}}.cr{{white-space:nowrap;text-align:right}}.cr small{{color:var(--ink2)}}
.kpis{{display:grid;grid-template-columns:1fr 1fr;gap:10px}}.k{{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px}}
.k b{{display:block;font:400 34px/1 "Instrument Serif",serif}}.k span{{font-size:13px;color:var(--ink2)}}
ul{{padding-left:0;list-style:none}}li{{padding:10px 0 10px 30px;border-bottom:1px solid var(--line);position:relative}}
li::before{{content:"";position:absolute;left:4px;top:18px;width:10px;height:10px;border-radius:50%;background:var(--red)}}
.act li::before{{background:var(--green)}}
.offer{{background:var(--ink);color:#fff;border-radius:18px;padding:22px;margin-top:34px}}
.offer h2{{margin:0 0 6px;color:#fff}}.offer p{{color:#e9e2d6;font-size:15px}}
.btns{{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}}
.btn{{display:flex;align-items:center;justify-content:center;min-height:48px;border-radius:12px;font-weight:600;text-decoration:none;background:#fff;color:var(--ink)}}
.btn.r{{background:var(--red);color:#fff}}
.note{{font-size:12.5px;color:var(--ink2);margin-top:22px}}
@media(max-width:420px){{.cmp{{grid-template-columns:1fr auto}}.cb{{grid-column:1/-1;order:3}}.btns{{grid-template-columns:1fr}}}}
</style></head><body><div class="wrap">
<div class="top"><a class="logo" href="https://avise-paris.github.io/">Avisé</a><span>Audit offert · relevé du 23 novembre 2026</span></div>
<h1>{e(x['name'])}</h1><p class="sub">{e(x['type'])} · {e(x['address'])}</p>
<div class="score"><div class="big">{fr(x['rating'])}<small>{num(x['count'])} avis</small></div>
<p>Sur Google, vous êtes <strong>{rank}{'er' if rank==1 else 'e'} sur {len(rows)}</strong> face aux établissements que vos clients comparent avec vous.</p></div>
<h2>Vous et vos voisins</h2>{''.join(bar(*r) for r in rows)}
<h2>Votre objectif : {fr(x['target'])}</h2>
<div class="kpis"><div class="k"><b>≈ {num(x['need'])}</b><span>nouveaux avis excellents pour l'afficher (estimation)</span></div>
<div class="k"><b>≈ {x['weeks']} sem.</b><span>à {x['rate']} nouveaux avis par jour, avec nos cartes sans contact</span></div></div>
<h2>Ce que disent vos clients</h2><ul>{''.join(f'<li>{e(t)}</li>' for t in x['themes'])}</ul>
<h2>Ce qu'on fait chez vous dès cette semaine</h2><ul class="act">{''.join(f'<li>{e(a)}</li>' for a in x['actions'])}</ul>
<div class="offer"><h2>Formule Pro · 49 € par mois</h2><p>Premier mois à 29 €. Sans engagement de durée, un mois de préavis. Vous restez propriétaire de votre fiche : aucun mot de passe demandé.</p>
<div class="btns"><a class="btn r" href="tel:+33783368970">Appeler Jules</a><a class="btn" href="https://wa.me/33783368970?text={quote('Bonjour Jules, suite à votre audit pour '+x['name']+' :')}" target="_blank" rel="noopener">WhatsApp</a></div></div>
<p class="note">Estimation établie à partir des données publiques de Google à la date du relevé. Avisé ne publie jamais de faux avis et ne demande jamais d'avis positifs uniquement : on aide vos vrais clients à donner leur avis.</p>
</div></body></html>"""
    os.makedirs(f"{SITE}/audit/{slug}",exist_ok=True); open(f"{SITE}/audit/{slug}/index.html","w").write(page); print(slug)
