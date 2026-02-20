/**
 * Composant Accueil - OmniService TG
 * Affiche le slider, le slogan et les services prioritaires
 */

export const renderAccueil = () => {
    return `
        <section class="promo-slider">
            <div class="slider-container">
                <div class="slide active" style="background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('assets/banner1.jpg') center/cover;">
                    [cite_start]<h2>Simplifiez votre quotidien [cite: 4]</h2>
                    [cite_start]<p>Appelez, on s’en charge [cite: 5]</p>
                </div>
            </div>
            <div class="slider-dots">
                <span class="dot active"></span>
                <span class="dot"></span>
                <span class="dot"></span>
            </div>
        </section>

        <section class="info-band">
            [cite_start]<p>OmniService TG est une entreprise togolaise de services multisectoriels dédiée aux ménages, aux entreprises et aux institutions[cite: 6].</p>
            <button class="btn-action">Plus qu’un service. [cite_start]Une vision d’excellence [cite: 8]</button>
        </section>

        <section class="priority-services">
            <h3 class="section-title">Nos Services Prioritaires</h3>
            <div class="services-grid">
                
                <div class="service-card priority" onclick="openForm('maintenance')">
                    <div class="icon-box">
                        <i class="fas fa-wrench"></i>
                    </div>
                    [cite_start]<span>Maintenance Technique [cite: 35]</span>
                    [cite_start]<small>Dépannage Élec, Plomberie... [cite: 36, 37]</small>
                </div>

                <div class="service-card priority" onclick="openForm('securite')">
                    <div class="icon-box">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    [cite_start]<span>Gardiennage & Sécurité [cite: 55]</span>
                    [cite_start]<small>Opérationnel le 7 Avril [cite: 59]</small>
                </div>

                <div class="service-card" onclick="openForm('livraison')">
                    <div class="icon-box">
                        <i class="fas fa-motorcycle"></i>
                    </div>
                    [cite_start]<span>Livraison Express [cite: 31]</span>
                </div>

                <div class="service-card" onclick="openForm('alimentation')">
                    <div class="icon-box">
                        <i class="fas fa-shopping-basket"></i>
                    </div>
                    [cite_start]<span>Alimentation & Produits locaux [cite: 22]</span>
                </div>

            </div>
        </section>
    `;
};
