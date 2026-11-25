"""Pages d'audit en ligne (non référencées).
Données : /home/claude/targets.json (fiches), analyse.json (voisins, lecture), reviews.json (avis relevés sur Google Maps).
Usage : python3 audit.py  -> /audit/<slug>/index.html"""
import json, html, os, math
from urllib.parse import quote
SITE="/home/claude/avise._"; H="/home/claude"; e=html.escape
T=json.load(open(f"{H}/targets.json")); A=json.load(open(f"{H}/analyse.json")); RV=json.load(open(f"{H}/reviews.json"))
L={x["name"]:x["slug"] for x in json.load(open(f"{H}/demo-links.json"))}
P=json.load(open(f"{H}/pool.json"))
fr=lambda x:f"{x:.1f}".replace(".",",")
num=lambda n:f"{n:,}".replace(","," ")
def stars(s):return f'<span class="st" aria-label="{s} étoile{"s" if s>1 else ""}">'+"★"*s+f'<i>{"★"*(5-s)}</i></span>'
def rev(r,neg=False):
    s,d,a,t=r[:4]
    return f'<div class="rv{" neg" if s<=2 else ""}"><div class="rh">{stars(s)}<b>{e(a)}</b><span>il y a {e(d)}</span></div>{f"<p>{e(t)}</p>" if t else "<p class=nt>Note sans commentaire</p>"}{"" if not neg else "<em>Sans réponse</em>"}</div>'
CSS=open(f"{H}/avise-outils/audit.css").read()
for x in T:
    n=x["name"]; slug=L[n]; a=A[n]; R=RV[n]; me=P.get(x["place_id"],{})
    rating=me.get("rating",x["rating"]); count=me.get("rating_count",x["count"])
    rows=[(n,rating,count,0,True)]+[(c[0],c[1],c[2],c[3],False) for c in a["comp"]]
    rk=sorted(rows,key=lambda r:(-r[1],-r[2])); rank=[r[4] for r in rk].index(True)+1
    avg=sum(r[1] for r in rows)/len(rows); avgc=sum(r[2] for r in rows)/len(rows)
    t=a["target"]; need=max(0,math.ceil((t-rating)*count/(5-t))) if rating<t else 0
    weeks=max(1,round(need/(a["rate"]*7))) if need else 0
    dist=R["dist"]; tot=sum(dist) or 1
    dbars="".join(f'<div class="db"><span>{5-i}</span><div><i style="width:{dist[i]/tot*100:.1f}%"></i></div><b>{num(dist[i])}</b></div>' for i in range(5))
    cmp="".join(f'<div class="cmp{" me" if m else ""}"><div class="cn">{e(nm)}<small>{"vous" if m else f"à {dd} m"}</small></div><div class="cb"><i style="width:{max(4,(r-3.5)/1.5*100):.0f}%"></i></div><div class="cr"><b>{fr(r)}</b><small>{num(c)} avis</small></div></div>' for nm,r,c,dd,m in rk)
    month=sorted(R["month"],key=lambda r:-r[0])
    monthblock=("".join(rev(r) for r in month)) if month else '<p class="empty">Aucun avis publié ce dernier mois.</p>'
    worst="".join(rev(r,neg=True) for r in R["worst"][:3])
    rep=R["rep"]; nrev=R["n"]
    kpi_rep=f'{rep} / {nrev}'
    off=f'<div class="flag"><b>À signaler</b>{e(R["offtopic"])}</div>' if R.get("offtopic") else ""
    wa="https://wa.me/33783368970?text="+quote(f"Bonjour Jules, suite à votre audit pour {n} :")
    page=f"""<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Audit Google · {e(n)} · Avisé</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>{CSS}</style></head><body><div class="wrap">
<div class="top"><a class="logo" href="https://avise-paris.github.io/">Avisé</a><span>Audit offert · relevé le 25 novembre 2026</span></div>
<p class="who">{e(n)} · {e(x['address'].replace(', France',''))}</p>
<h1>{e(a['titre'])}</h1>
<div class="score"><div class="big">{fr(rating)}<small>{num(count)} avis</small></div><div class="dist">{dbars}</div></div>
<div class="kpis">
<div class="k"><b>{rank}<sup>{'er' if rank==1 else 'e'}</sup>/{len(rows)}</b><span>dans votre quartier, sur votre métier</span></div>
<div class="k"><b>{kpi_rep}</b><span>de vos {nrev} derniers avis ont reçu une réponse</span></div>
<div class="k"><b>{len(R['month'])}</b><span>nouvel{'s' if len(R['month'])>1 else ''} avis ce dernier mois</span></div>
<div class="k"><b>{num(round(avgc))}</b><span>avis en moyenne chez vos voisins, contre {num(count)} chez vous</span></div></div>
<div class="read"><b>Notre lecture</b>{e(R['pattern'])}</div>
<h2>Vous face à vos voisins</h2><p class="sub">Même métier, à moins de 800 m. Classés par note Google.</p>{cmp}
<h2>Vos avis du mois</h2><p class="sub">Du meilleur au moins bon.</p>{monthblock}
<h2>Les 3 avis qui vous coûtent le plus</h2><p class="sub">C'est ce que lisent en premier les clients qui hésitent.</p>{worst}{off}
<h2>Ce que vos clients aiment</h2><ul>{''.join(f'<li>{e(p)}</li>' for p in a['plus'])}</ul>
<div class="goal"><div><b>{fr(t)}</b><span>votre objectif</span></div><div><b>≈ {num(need)}</b><span>nouveaux avis excellents nécessaires (estimation)</span></div><div><b>≈ {weeks} sem.</b><span>avec une carte sans contact au comptoir</span></div></div>
<div class="offer"><h2>Formule Pro · 49 € par mois</h2><p>Premier mois à 29 €. Sans engagement de durée, un mois de préavis. Aucun mot de passe Google demandé : vous restez propriétaire de votre fiche.</p>
<div class="btns"><a class="btn r" href="tel:+33783368970">Appeler Jules</a><a class="btn" href="{e(wa)}" target="_blank" rel="noopener">WhatsApp</a></div></div>
<p class="note">Données publiques de Google Maps relevées le 25 novembre 2026 : note, nombre d'avis, extraits d'avis abrégés, réponses visibles du propriétaire. Avisé ne publie jamais de faux avis et ne demande jamais d'avis positifs uniquement.</p>
</div></body></html>"""
    os.makedirs(f"{SITE}/audit/{slug}",exist_ok=True); open(f"{SITE}/audit/{slug}/index.html","w").write(page); print(slug,rank,need,weeks)
