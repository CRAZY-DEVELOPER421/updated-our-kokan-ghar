# Konkan Bazaar — Tunnel Chalaane Ka Pura Guide

> Ye guide batata hai ki **kal / kabhi bhi** tunnel kaise chalaana hai,
> naya URL kahan se milega, aur link dusre ko kaise dena hai.

---

## Sabse Pehle — Ye Sab Yaad Rakho

| Cheez | Value |
|---|---|
| Login **Username** | `kokan` (ya `.env` me `GATEWAY_USER`) |
| Login **Password** | `.env` me `GATEWAY_PASS` ki value (abhi jo set ki hai) |
| Ngrok token | `.env` me `NGROK_AUTHTOKEN` (mat delete karna!) + ngrok ki private config me register (`ngrok config add-authtoken <token>`) |

---

## Step 1 — Kal Run Karne Ka Sahi Tarika

**1. PC on karo** (MySQL service khud start ho jaati hai — kuch nahi karna).

**2. Project folder me jao:**
```
D:\our-konkan-bazar-main
```

**3. `start-tunnel.bat` pe DOUBLE-CLICK karo** (ya terminal se chalao).

> **PowerShell me ho to** script ke aage `./` lagao (dot slash):
> ```
> ./start-tunnel.bat
> ./run-tunnel.bat
> ./stop-tunnel.bat
> ```
> Bina `./` ke error aayega: "not recognized as the name of a cmdlet".
> (`cd /d` cmd ka syntax hai — PowerShell me sirf `cd` likho.)

Ye 5 windows kholega (20-30 second me sab ready):
- `Konkan Backend` — :5000
- `Konkan Storefront` — :3000
- `Konkan Admin` — :3001
- `Konkan Gateway` — :8080
- `Ngrok Tunnel` — ye window sabse important hai (URL yahin dikhta hai)

**4. Check karo:** har window me koi red error nahi hona chahiye.

> Agar koi window error de `EADDRINUSE` ya "port already in use"
> → matlab purana instance abhi bhi chal raha hai. Pehle `stop-tunnel.bat`
> chalao, phir `start-tunnel.bat`.

---

## Step 2 — Naya URL Kaise Milega

Har baar restart pe URL **badal sakta hai** (free plan). Naya URL 3 tarike se milega:

**Tareeka 1 (sabse aasan):** `Ngrok Tunnel` window me ye line dekho —
```
url=https://xyz-abc.ngrok-free.dev
```
Yahi tumhara naya public URL hai. Copy kar lo.

**Tareeka 2:** Browser me `http://127.0.0.1:4040` kholo (ngrok ka inspector) — top pe URL dikhta hai.

**Tareeka 3 (command prompt):**
```
curl http://127.0.0.1:4040/api/tunnels
```

---

## Step 3 — Dusre Ko Link Kaise Dena Hai

Jab tak **tumhara PC on hai** aur 5 windows chal rahi hain, tab tak link live hai.

**Storefront dikhana ho to** (WhatsApp / message me likho):
```
Site: https://xyz-abc.ngrok-free.dev
Login: kokan / <GATEWAY_PASS from .env>
```

**Admin panel dikhana ho to:**
```
Admin: https://xyz-abc.ngrok-free.dev/admin
Login: kokan / <GATEWAY_PASS from .env>
```

**Kisi bhi phone/PC ke browser se** kholega → username/password prompt aayega
→ `kokan` / `.env` ka `GATEWAY_PASS` → site khul jayegi.

> PC band kiya / windows band kiye = link band. Wapas chalane ke liye Step 1 dobara.

---

## Step 4 — Band Karna

- **`stop-tunnel.bat`** double-click karo (5 windows band ho jayengi).
- Ya har window me `Ctrl+C` dabao.

---

## Token Rotate / Naya Token Kaise Lagayein

1. Naya token `.env` me `NGROK_AUTHTOKEN=` me daalo (space mat lagana)
2. Command prompt me:
   ```
   ngrok config add-authtoken <naya-token>
   ```
3. Bas — ab `run-tunnel.bat` chalao. (Token ab ngrok apni private config se khud leta hai, isliye scripts me koyi parsing nahi)

---

## Extra — Agar Code Change Kiya Ho

Code badla hai to rebuild karna zaroori hai (API base ab runtime me khud resolve hota hai — koyi env override nahi chahiye):
```
cd D:\our-konkan-bazar-main\frontend
npm run build

cd D:\our-konkan-bazar-main\admin
npm run build
```
Phir `start-tunnel.bat` chalao.

> **Git Bash se `NEXT_PUBLIC_API_URL=/api` ke saath build mat karna** — Git Bash
> `/api` ko `C:/Program Files/Git/api` me badal deta hai (MSYS path mangling) aur
> phir browser me products nahi aate. Ab ye env override **chahiye bhi nahi**.

---

## Problem Aayi To?

| Problem | Fix |
|---|---|
| Login nahi chal raha | Username `kokan`, password `.env` ke `GATEWAY_PASS` se match karo — spelling check karo |
| URL pe 502 / blank | Backend/Gateway window me error dekho; `stop-tunnel.bat` → `start-tunnel.bat` |
| Port in use | Purane windows band karo (stop-tunnel.bat) |
| Ngrok token nahi mil raha | `.env` me `NGROK_AUTHTOKEN=` line hai? Phir `ngrok config add-authtoken <token>` chalao |
| Sab fail | Admin panel ka andar wala login `ADMIN_PANEL_PASSWORD` (.env) se hota hai — alag hai |
