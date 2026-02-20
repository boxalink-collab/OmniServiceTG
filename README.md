# OmniService TG — Guide de déploiement

## Structure des fichiers

```
omniservice/
├── index.html        ← Application client (mobile-first)
├── style.css         ← Tous les styles
├── app.js            ← Logique + intégration Firestore (client)
├── assets/
│   └── logo.png      ← Logo OmniService TG
└── admin/
    └── index.html    ← Interface d'administration (Firestore + Auth)
```

---

## 1. Configurer Firebase

### 1.1 Créer le projet
1. Allez sur [console.firebase.google.com](https://console.firebase.google.com)
2. Cliquez **"Ajouter un projet"** → donnez un nom (ex: `omniservice-tg`)
3. Désactivez Google Analytics si vous n'en avez pas besoin

### 1.2 Activer Firestore
1. Dans le menu gauche : **Build → Firestore Database**
2. Cliquez **"Créer une base de données"**
3. Choisissez **Mode production** (ou test pour commencer)
4. Région : `eur3` (Europe) ou `us-central1`

### 1.3 Configurer les règles Firestore
Dans **Firestore → Rules**, collez ces règles :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Commandes : tout le monde peut créer, seuls les admins peuvent lire/modifier/supprimer
    match /commandes/{docId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
      // Lecture par le client (via son téléphone)
      allow read: if resource.data.phone == request.resource.data.phone;
    }
  }
}
```

> **Règle simplifiée pour démarrer (test) :**
> ```
> allow read, write: if true;
> ```
> ⚠️ Ne laissez PAS cette règle en production.

### 1.4 Activer Firebase Auth (pour l'admin)
1. **Build → Authentication → Sign-in method**
2. Activez **Email/Password**
3. Dans **Users**, ajoutez un compte administrateur manuellement

### 1.5 Récupérer la config
1. **Project Settings → General → Your apps**
2. Cliquez **"</>  Web"**, enregistrez l'app
3. Copiez l'objet `firebaseConfig`

### 1.6 Coller la config dans les fichiers
Ouvrez `app.js` ET `admin/index.html`, remplacez :

```js
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",          // ← remplacer
  authDomain: "VOTRE_PROJECT.firebaseapp.com",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_PROJECT.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId: "VOTRE_APP_ID"
};
```

---

## 2. Ajouter le logo

Copiez votre fichier logo dans :
```
assets/logo.png
```
Il s'affiche automatiquement dans la barre de navigation.

---

## 3. Déployer sur GitHub Pages

```bash
# 1. Créer un repo GitHub (ex: omniservice-tg)
# 2. Pousser les fichiers
git init
git add .
git commit -m "OmniService TG v1.0"
git remote add origin https://github.com/VOTRE_USER/omniservice-tg.git
git push -u origin main

# 3. Activer GitHub Pages
# Settings → Pages → Source : "Deploy from branch" → main → / (root)
```

Votre app sera accessible sur : `https://VOTRE_USER.github.io/omniservice-tg/`
L'admin sera sur : `https://VOTRE_USER.github.io/omniservice-tg/admin/`

---

## 4. Structure Firestore

Collection : **`commandes`**

| Champ        | Type      | Description                          |
|--------------|-----------|--------------------------------------|
| `service`    | string    | ID du service (food, delivery, etc.) |
| `serviceName`| string    | Nom complet du service               |
| `statut`     | string    | En attente / Confirmée / En cours / Terminée / Annulée |
| `phone`      | string    | Numéro du client (clé de recherche)  |
| `adresse`    | string    | Adresse de livraison                 |
| `createdAt`  | timestamp | Date de création (auto)              |
| `updatedAt`  | timestamp | Dernière modification                |
| + champs variables selon le service |

---

## 5. Fonctionnalités

### Application cliente (`index.html`)
- ✅ Navigation 4 onglets (Accueil, Services, Commandes, À propos)
- ✅ Slider automatique
- ✅ 7 formulaires de service (Firestore)
- ✅ Suivi de commandes par téléphone (Firestore)
- ✅ Profil sauvegardé en localStorage
- ✅ Recherche de services

### Interface admin (`admin/index.html`)
- ✅ Authentification Firebase (email/mot de passe)
- ✅ Tableau de toutes les commandes en temps réel
- ✅ Filtres par statut
- ✅ Recherche par téléphone / service
- ✅ Mise à jour du statut en 1 clic
- ✅ Suppression de commandes
- ✅ Détail complet d'une commande (modal)
- ✅ Statistiques (aujourd'hui, semaine, service le plus demandé)
- ✅ Graphique de répartition par service

---

## 6. Personnalisation

**Changer les numéros de téléphone :**  
Dans `index.html`, cherchez `+228 XX XX XX XX`

**Modifier les dates "bientôt disponible" :**  
Dans `app.js`, cherchez les champs `soon:` dans l'objet `SVCS`

**Ajouter un nouveau service :**  
Dans `app.js`, ajoutez une entrée dans l'objet `SVCS` en suivant le même modèle
