export const renderAccueil = () => {
    return `
        <div class="promo-slider">
            <div class="slide-content">
                <span class="badge">Nouveau</span>
                <h2>Simplifiez votre quotidien [cite: 4]</h2>
                <p>Appelez, on s’en charge [cite: 5]</p>
            </div>
        </div>

        <section class="intro-text">
            <p><strong>OmniService TG</strong> est une entreprise togolaise de services multisectoriels dédiée aux ménages, entreprises et institutions[cite: 6]. Nous accompagnons la classe moyenne émergente avec des standards internationaux[cite: 7].</p>
        </section>

        <div class="priority-grid">
            <h3 class="grid-title">Services Prioritaires</h3>
            
            <div class="grid-items">
                <div class="card" onclick="loadPage('services')">
                    <div class="card-icon blue"><i class="fas fa-wrench"></i></div>
                    <h4>Maintenance [cite: 35]</h4>
                    <p>Élec, Plomberie...</p>
                </div>

                <div class="card" onclick="loadPage('services')">
                    <div class="card-icon orange"><i class="fas fa-shield-alt"></i></div>
                    <h4>Sécurité [cite: 55]</h4>
                    <p>Gardiennage</p>
                </div>

                <div class="card" onclick="loadPage('services')">
                    <div class="card-icon blue"><i class="fas fa-shopping-basket"></i></div>
                    <h4>Alimentation [cite: 22]</h4>
                    <p>Produits locaux</p>
                </div>

                <div class="card" onclick="loadPage('services')">
                    <div class="card-icon orange"><i class="fas fa-truck"></i></div>
                    <h4>Livraison [cite: 30]</h4>
                    <p>Express</p>
                </div>
            </div>
        </div>

        <div class="vision-banner">
            <p>"Plus qu’un service. Une vision d’excellence." [cite: 8]</p>
        </div>
    `;
};
