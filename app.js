import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Importations des pages (Vérifiez bien que les fichiers existent dans /pages/)
import { renderAccueil } from './pages/Accueil.js';
import { renderServices } from './pages/Services.js';

const firebaseConfig = {
  apiKey: "AIzaSyDtDK7-iDRy1E-kjZubjyjkPW7Th33BMyU",
  authDomain: "omniservicetg-59df3.firebaseapp.com",
  projectId: "omniservicetg-59df3",
  storageBucket: "omniservicetg-59df3.firebasestorage.app",
  messagingSenderId: "196278567761",
  appId: "1:196278567761:web:4f6416acaab58b67bf4970"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Gestionnaire de navigation
window.loadPage = function(pageId) {
    const content = document.getElementById('app-content');
    
    // Mise à jour visuelle des boutons de navigation
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    // On cherche l'élément qui a été cliqué ou celui qui correspond au pageId
    const activeNav = document.querySelector(`.nav-item[onclick*="${pageId}"]`);
    if(activeNav) activeNav.classList.add('active');

    if (pageId === 'accueil') {
        content.innerHTML = renderAccueil();
    } else if (pageId === 'services') {
        content.innerHTML = renderServices();
    } else {
        content.innerHTML = `<div style="padding:20px;">La page <b>${pageId}</b> est en cours de développement.</div>`;
    }
    
    // Remonter en haut de page
    window.scrollTo(0, 0);
};

// Chargement initial
document.addEventListener('DOMContentLoaded', () => {
    loadPage('accueil');
});
