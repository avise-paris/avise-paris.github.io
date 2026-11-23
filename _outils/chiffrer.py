"""Avisé : crée ou met à jour l'espace chiffré d'un client.
Usage :
  python3 chiffrer.py <identifiant>                 # chiffre clients/<identifiant>.json avec son mot de passe
  python3 chiffrer.py <identifiant> --nouveau-mdp   # génère un nouveau mot de passe puis chiffre
Le fichier clients/<identifiant>.json contient {"password": "...", "data": {...}} et ne doit JAMAIS aller sur le site.
"""
import json, os, sys, hashlib, base64, secrets, unicodedata, re
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

SITE = "/home/claude/avise._/espace/d"
HERE = os.path.dirname(os.path.abspath(__file__))
ITER = 310000
MOTS = ["tomate","olive","citron","basilic","cannelle","noisette","vanille","figue","poivre","menthe","safran","prune","cerise","amande","sesame","abricot","griotte","fenouil","pistache","mangue","caramel","praline","chocolat","myrtille"]

def norm(i):
    i = unicodedata.normalize("NFD", i.strip().lower())
    i = "".join(c for c in i if not unicodedata.combining(c))
    return re.sub(r"^-|-$", "", re.sub(r"[^a-z0-9]+", "-", i))

def fichier(i): return hashlib.sha256(("avise:" + norm(i)).encode()).hexdigest()[:24]

def mdp():
    return "-".join(secrets.choice(MOTS) for _ in range(3)) + "-" + str(secrets.randbelow(90) + 10)

def chiffrer(ident, nouveau=False):
    p = os.path.join(HERE, "clients", norm(ident) + ".json")
    c = json.load(open(p))
    if nouveau or not c.get("password"): c["password"] = mdp()
    salt, iv = secrets.token_bytes(16), secrets.token_bytes(12)
    key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITER).derive(c["password"].encode())
    ct = AESGCM(key).encrypt(iv, json.dumps(c["data"], ensure_ascii=False).encode(), None)
    os.makedirs(SITE, exist_ok=True)
    out = os.path.join(SITE, fichier(ident) + ".json")
    json.dump({"v": 1, "n": ITER, "s": base64.b64encode(salt).decode(), "i": base64.b64encode(iv).decode(), "c": base64.b64encode(ct).decode()}, open(out, "w"))
    json.dump(c, open(p, "w"), ensure_ascii=False, indent=1)
    print(f"Identifiant : {norm(ident)}\nMot de passe : {c['password']}\nFichier : {out}")

if __name__ == "__main__":
    chiffrer(sys.argv[1], "--nouveau-mdp" in sys.argv)
