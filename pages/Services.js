export const renderServices = () => {
    return `
        <div class="services-page">
            <h2 class="main-title">Une solution intégrée pour tous vos besoins [cite: 21]</h2>

            <div class="service-category">
                <div class="cat-header orange-bg">
                    <i class="fas fa-tools"></i>
                    <h3>Maintenance Technique [cite: 35]</h3>
                </div>
                <div class="cat-info">Opérationnel le 16 Mars [cite: 44]</div>
                <ul class="service-ul">
                    <li>Électricité & Plomberie [cite: 36, 37]</li>
                    <li>Dépannage voiture [cite: 38]</li>
                    <li>Réparation Électroménager & Informatique [cite: 39, 41]</li>
                    <li>Pose TV et Antenne [cite: 42]</li>
                </ul>
            </div>

            <div class="service-category">
                <div class="cat-header blue-bg">
                    <i class="fas fa-utensils"></i>
                    <h3>Alimentation & Restauration [cite: 22, 27]</h3>
                </div>
                <ul class="service-ul">
                    <li>Kit de denrées alimentaires [cite: 23]</li>
                    <li>Produits frais & Vin de palme [cite: 24, 26]</li>
                    <li>Service Traiteur [cite: 29]</li>
                </ul>
            </div>

            <div class="service-category">
                <div class="cat-header blue-bg">
                    <i class="fas fa-clean-hands"></i>
                    <h3>Entretien & Sécurité [cite: 50, 55]</h3>
                </div>
                <div class="cat-info">Sécurité : Opérationnel le 7 Avril [cite: 59]</div>
                <ul class="service-ul">
                    <li>Nettoyage Résidentiel & Industriel [cite: 51, 54]</li>
                    <li>Gardiennage Boutique & Bureau [cite: 56]</li>
                    <li>Surveillance Temporaire [cite: 58]</li>
                </ul>
            </div>

            <div class="service-category">
                <div class="cat-header orange-bg">
                    <i class="fas fa-plus-circle"></i>
                    <h3>Autres Services</h3>
                </div>
                <ul class="service-ul">
                    <li>Prêt à porter & Cosmétique [cite: 45, 49]</li>
                    <li>Livraison & Courses personnalisées [cite: 30, 32]</li>
                </ul>
            </div>
            
            <p class="footer-note">Un seul contact. Plusieurs solutions. [cite: 60]</p>
        </div>
    `;
};
