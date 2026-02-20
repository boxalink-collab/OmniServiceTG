import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Votre configuration Firestore
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

// Fonction simple pour charger les pages
import { renderAccueil } from './pages/Accueil.js';

window.loadPage = function(page) {
    const content = document.getElementById('app-content');
    
    if(page === 'accueil') {
        content.innerHTML = renderAccueil();
    } else {
        content.innerHTML = `<div style="padding:20px;">Page ${page} en cours de construction...</div>`;
    }
};

// Charger l'accueil au démarrage
window.onload = () => loadPage('accueil');
    
    // Mise à jour de l'état actif de la navigation
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');

    // Simulation de chargement (en attendant les fichiers séparés)
    content.innerHTML = `<div style="padding:20px;">Chargement de la page ${page}...</div>`;
    
    console.log(`Navigation vers : ${page}`);
};

// Charger l'accueil par défaut
document.addEventListener('DOMContentLoaded', () => {
    console.log("OmniService TG prêt !");
});
