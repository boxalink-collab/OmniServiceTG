// Importation des modules Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Importation des composants de pages
import { renderAccueil } from './pages/accueil.js';
import { renderServices } from './pages/services.js';

// Configuration Firestore fournie
const firebaseConfig = {
  apiKey: "AIzaSyDtDK7-iDRy1E-kjZubjyjkPW7Th33BMyU",
  authDomain: "omniservicetg-59df3.firebaseapp.com",
  projectId: "omniservicetg-59df3",
  storageBucket: "omniservicetg-59df3.firebasestorage.app",
  messagingSenderId: "196278567761",
  appId: "1:196278567761:web:4f6416acaab58b67bf4970"
};

// Initialisation
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

/**
 * Fonction de navigation principale
 * @param {string} pageId - L'ID de la page à charger
 */
window.loadPage = function(pageId) {
    const content = document.getElementById('app-content');
    
    // 1. Mise à jour visuelle de la barre de navigation basse
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[onclick*="${pageId}"]`);
    if(activeNav) activeNav.classList.add('active');

    // 2. Chargement du contenu selon la page
    switch(pageId) {
        case 'accueil':
            content.innerHTML = renderAccueil();
            break;
        case 'services':
            content.innerHTML = renderServices();
            break;
        case 'commandes':
            content.innerHTML = `<div class="p-20"><h3>Mes Commandes</h3><p>Historique en cours de synchronisation...</p></div>`;
            break;
        case 'apropos':
            content.innerHTML = `<div class="p-20"><h3>À Propos</h3><p>OmniService TG : Excellence et Fiabilité.</p></div>`;
            break;
        default:
            content.innerHTML = renderAccueil();
    }

    // 3. Retour en haut de page automatique
    window.scrollTo(0, 0);
};

// Lancement au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log("OmniService TG : Initialisation...");
    loadPage('accueil'); 
});
