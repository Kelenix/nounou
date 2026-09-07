# 🔐 Sécuriser mon VPS — Guide personnel

> Fiche mémo créée le **2026-09-03**.
> Serveur concerné : VPS Hostinger `srv1681209` — Ubuntu 24.04 LTS.
> Elle héberge plusieurs sites (dont `melodie-web` en Docker). Site(s) **publics**.
>
> 👉 Ce fichier me sert à **comprendre** et à **refaire** les étapes si besoin.
> Si un jour je veux resécuriser quelque chose, je relis cette fiche et je pose mes
> questions à partir de là.

---

## 1. Comprendre : c'est quoi ces « ports ouverts » ?

Un serveur, c'est comme une maison avec des portes numérotées. Chaque « porte » (port)
laisse entrer un type de trafic. Un scan (nmap) montre juste **quelles portes existent** —
ce n'est **pas** une preuve que quelqu'un est entré.

Sur mon serveur, 3 portes sont ouvertes, et c'est **normal** :

| Port | Service | Rôle | Doit rester ouvert ? |
|------|---------|------|----------------------|
| **80** | HTTP  | Mon site web (version non chiffrée) | ✅ OUI (sinon le site disparaît) |
| **443** | HTTPS | Mon site web (version sécurisée 🔒) | ✅ OUI (sinon le site disparaît) |
| **22** | SSH   | Me connecter pour administrer le serveur | ⚠️ Oui, mais à **protéger** |

**Idée clé :** avoir une porte ouverte ≠ être piraté. Le problème n'existe que si la
**serrure est faible**. Donc on ne « ferme » pas le port 80/443 (ça casserait le site) :
on **renforce la serrure du SSH**.

> ℹ️ Mon adresse IP / le nom du serveur ne sont **pas** des secrets : toute personne qui
> visite mon site les voit déjà. Ce qui doit rester secret, ce sont les **mots de passe et
> les clés**, jamais l'adresse.

---

## 2. Commandes « pour regarder » (ne changent RIEN)

À utiliser avant toute modif, pour voir l'état du serveur. À coller dans le **terminal
Hostinger** (navigateur), connecté en `root`.

**Version d'Ubuntu + ce qui écoute sur les ports 22/80/443 + conteneurs Docker :**
```bash
cat /etc/os-release | grep PRETTY_NAME; echo "---"; ss -tlnp | grep -E ':22|:80|:443'; echo "---"; command -v docker && docker ps --format '{{.Names}} {{.Ports}}' || echo "pas de docker"
```

**État du pare-feu + de fail2ban :**
```bash
ufw status; echo "---"; command -v fail2ban-client && fail2ban-client status || echo "pas de fail2ban"
```

### Comment lire le résultat
- `0.0.0.0:80 nginx` → le port 80 est ouvert au public, servi par nginx = normal.
- `127.0.0.1:3001->3000` (Docker) → le conteneur écoute **seulement en local** (127.0.0.1),
  donc **il n'est PAS exposé à Internet**. C'est nginx qui fait la vitrine publique et parle
  au conteneur en interne. ✅ Bonne architecture.
- `ufw status: active` → pare-feu allumé. ✅

---

## 3. État de mon serveur (constaté le 2026-09-03)

| Élément | État |
|---|---|
| Pare-feu `ufw` (seuls 22/80/443 ouverts) | ✅ déjà en place |
| Conteneur Docker non exposé (écoute en 127.0.0.1) | ✅ bonne archi |
| Système à jour | ✅ fait |
| Anti-brute-force SSH (**fail2ban**) | ✅ installé (voir §4) |
| Clé SSH + mots de passe désactivés | ⏳ optionnel (voir §6) |

**Conclusion :** le SSH n'est **pas** « ouvert à toute la terre » sans protection — il est
filtré par le pare-feu **et** gardé par fail2ban. Le site reste public, c'est voulu.

---

## 4. Installer fail2ban (la vraie protection SSH)

**À quoi ça sert :** fail2ban surveille les tentatives de connexion. Si un robot essaie
plein de mauvais mots de passe, il est **banni automatiquement**. C'est LE videur à l'entrée.
👉 Sans aucun risque : ça ne peut pas me bloquer et ça ne touche pas les sites.

**1) Mettre à jour le serveur**
```bash
apt update && apt upgrade -y
```

**2) Installer fail2ban**
```bash
apt install -y fail2ban
```

**3) Le configurer pour surveiller le SSH**
```bash
cat > /etc/fail2ban/jail.local <<'EOF'
[sshd]
enabled = true
backend = systemd
maxretry = 5
findtime = 10m
bantime = 1h
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban
```

Ce que ça veut dire :
- `maxretry = 5` → 5 essais ratés autorisés,
- `findtime = 10m` → comptés sur une fenêtre de 10 minutes,
- `bantime = 1h` → au-delà, l'IP est bannie 1 heure.

**4) Vérifier**
```bash
fail2ban-client status sshd
```
Doit afficher `Status for the jail: sshd` avec les compteurs `failed` / `banned`.

---

## 5. Gérer fail2ban au quotidien (commandes utiles)

**Voir l'état général :**
```bash
fail2ban-client status
```

**Voir le détail du SSH (IP bannies) :**
```bash
fail2ban-client status sshd
```

**Débannir une IP (ex. si je me suis banni moi-même par erreur) :**
```bash
fail2ban-client set sshd unbanip X.X.X.X
```
(remplacer `X.X.X.X` par l'adresse à libérer)

> 💡 Filet de secours ultime : même banni du SSH, je peux **toujours** me connecter via le
> **terminal Hostinger dans le navigateur** (il ne passe pas par le port 22). Donc je ne peux
> pas rester bloqué dehors.

---

## 6. (Optionnel, plus tard) Clé SSH = le niveau au-dessus

**Principe :** au lieu d'un mot de passe, on utilise une **clé** (un « badge » sur mon PC).
Ensuite on **interdit les mots de passe** → plus aucun robot ne peut tenter quoi que ce soit.

- ✅ Avantage : protection quasi-totale du SSH.
- ⚠️ Précaution : il faut **tester la clé AVANT** de couper les mots de passe, sinon risque
  de blocage. Le terminal Hostinger reste le filet de secours.

**À ne faire que si je me connecte avec une vraie appli SSH (Terminal Windows / PuTTY),
pas seulement le terminal Hostinger.** Étapes à faire **ensemble, pas à pas**, le jour venu :

1. Générer une clé sur mon PC (`ssh-keygen`).
2. Copier la clé publique sur le serveur (`~/.ssh/authorized_keys`).
3. **Tester** que la connexion par clé marche (sans fermer l'ancienne session !).
4. Seulement après, désactiver le mot de passe dans `/etc/ssh/sshd_config`
   (`PasswordAuthentication no`, `PermitRootLogin prohibit-password`) puis
   `systemctl restart ssh`.

> Ne pas faire l'étape 4 tant que l'étape 3 n'est pas confirmée.

---

## 7. Réflexe en cas de doute / de message alarmant

Si quelqu'un me dit « ton serveur est ouvert, ferme tout ! » :

1. **Ne pas paniquer, ne rien couper dans l'urgence** (couper 80/443 = casser le site).
2. Regarder l'état réel avec les commandes du **§2**.
3. Distinguer : *port ouvert normal* (80/443) vs *serrure à renforcer* (22 → fail2ban / clé).
4. Vérifier **qui** me parle (mon hébergeur officiel ? une vraie boîte de sécu ? un inconnu
   qui me fait peur ?). Un inconnu qui presse et fait peur = prudence.
5. En cas de doute, reprendre cette fiche et poser mes questions à partir de là.

---

## 8. Mémo express

```text
Ports 80/443  = mon site   → DOIVENT rester ouverts
Port 22       = SSH        → à protéger, pas à fermer
Protection    = ufw (pare-feu) + fail2ban (anti-brute-force)
Filet de secours = terminal Hostinger dans le navigateur
Ne jamais partager = mots de passe / clés (l'IP, ce n'est pas grave)
```
