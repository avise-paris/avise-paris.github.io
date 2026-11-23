"""Rapport mensuel d'un client.
Usage : python3 rapport.py <identifiant> mois.json [--publier]
mois.json : {"month":"2026-12-01","rating":4.4,"reviews_total":120,"new_reviews":9,"replied_pct":100,"avg_reply_hours":8,
             "flagged":1,"removed":0,"posts":4,"photos":3,"summary":"...","competitors":[{"name":"...","rating":4.5,"reviews":300}],
             "highlights":[{"stars":5,"lang":"FR","author":"Prénom N.","review_excerpt":"...","reply":"..."}]}"""
import sys, os, json, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE); import chiffrer
ident = chiffrer.norm(sys.argv[1]); p = os.path.join(HERE, "clients", ident + ".json")
c = json.load(open(p)); m = json.load(open(sys.argv[2]))
reps = [r for r in c["data"].get("reports", []) if r["month"] != m["month"]] + [m]
c["data"]["reports"] = sorted(reps, key=lambda r: r["month"], reverse=True)
json.dump(c, open(p, "w"), ensure_ascii=False, indent=1)
chiffrer.chiffrer(ident)
if "--publier" in sys.argv:
    subprocess.run(f'cd /home/claude/avise._ && git add -A && git commit -qm "Rapport {m["month"][:7]} : {ident}" && git push -q origin main && git push -q origin main:gh-pages', shell=True)
print("Rapport", m["month"][:7], "mis à jour pour", ident)
