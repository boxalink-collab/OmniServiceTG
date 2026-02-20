# OmniService TG — Guide de déploiement

## Structure des fichiers

```
omniservice/
├── index.html        ← Application client responsive (mobile + desktop)
├── style.css         ← Tous les styles responsive
├── app.js            ← Logique + Firestore (client)
├── assets/
│   └── logo.png      ← Logo OmniService TG
└── admin/
    └── index.html    ← Interface d'administration (responsive)
```

---

## 1. Configurer Firebase

### 1.1 Créer le projet
1. Allez sur [console.firebase.google.com](https://console.firebase.google.com)
2. Cliquez **"Ajouter un projet"** → nom (ex: `omniservice-tg`)

### 1.2 Activer Firestore
1. **Build → Firestore Database → Créer une base de données**
2. Mode **production** → Région `eur3`

### 1.3 Règles Firestore
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /commandes/{docId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
  }
}
```

### 1.4 Activer Firebase Authentication
1. **Build → Authentication → Sign-in method → Email/Password → Activer**
2. **Users → Ajouter un utilisateur** :
   - Email : `admin@omniservicetg.com`
   - Mot de passe : `OmniAdmin2026!`

### 1.5 Coller la config Firebase
Dans **app.js** ET **admin/index.html**, remplacez :
```js
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJECT.firebaseapp.com",
  projectId: "VOTRE_PROJECT_ID",
  ...
};
```

---

## 2. Accès à l'interface Admin

URL : `https://VOTRE_USER.github.io/omniservice-tg/admin/`

**Identifiants par défaut :**
| Champ | Valeur |
|-------|--------|
| Email | `admin@omniservicetg.com` |
| Mot de passe | `OmniAdmin2026!` |

> ⚠️ **Changez le mot de passe** dès la première connexion via **Admin → Changer le mot de passe**

---

## 3. Déployer sur GitHub Pages

```bash
git init
git add .
git commit -m "OmniService TG v1.0"
git remote add origin https://github.com/VOTRE_USER/omniservice-tg.git
git push -u origin main
```
Puis : **Settings → Pages → Source : main → / (root)**

App client : `https://VOTRE_USER.github.io/omniservice-tg/`
Admin : `https://VOTRE_USER.github.io/omniservice-tg/admin/`
