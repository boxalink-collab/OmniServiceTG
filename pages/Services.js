/**
 * Composant Services - OmniService TG
 * Liste complète des prestations organisées par catégories
 */

export const renderServices = () => {
    return `
        <div class="services-container">
            <h2 class="page-title">Nos Solutions Intégrées</h2>
            <p class="subtitle">Une solution pour tous vos besoins [cite: 21]</p>

            <div class="category-section">
                <h3 class="category-title"><i class="fas fa-utensils"></i> Alimentation & Produits locaux [cite: 22]</h3>
                <div class="service-list">
                    <div class="service-item" onclick="openForm('kit-alim')">Kit de denrées alimentaire </div>
                    <div class="service-item" onclick="openForm('frais')">Produits frais (Tilapia, Volailles, Légumes) [cite: 24]</div>
                    <div class="service-item" onclick="openForm('néré')">Néré (Soumbala) [cite: 25]</div>
                    <div class="service-item" onclick="openForm('vin-palme')">Vin de palme embouteillé [cite: 26]</div>
                </div>
            </div>

            <div class="category-section priority-border">
                <h3 class="category-title"><i class="fas fa-tools"></i> Maintenance technique [cite: 35]</h3>
                <p class="status-note">Opérationnel le 16 Mars [cite: 44]</p>
                <div class="service-list">
                    <div class="service-item" onclick="openForm('elec')">Dépannage en Électricité </div>
                    <div class="service-item" onclick="openForm('plomb')">Dépannage en Plomberie et sanitaires [cite: 37]</div>
                    <div class="service-item" onclick="openForm('auto')">Dépannage voiture [cite: 38]</div>
                    <div class="service-item" onclick="openForm('repar-electro')">Réparation Électroménager & Informatique [cite: 39, 41]</div>
                </div>
            </div>

            <div class="category-section">
                <h3 class="category-title"><i class="fas fa-broom"></i> Entretien & Nettoyage [cite: 50]</h3>
                <div class="service-list">
                    <div class="service-item" onclick="openForm('nettoyage-res')">Nettoyage résidentiel & bureaux [cite: 51, 52]</div>
                    <div class="service-item" onclick="privateForm('nettoyage-indus')">Entretien industriel [cite: 54]</div>
                </div>
            </div>

            <div class="category-section">
                <h3 class="category-title"><i class="fas fa-user-shield"></i> Gardiennage & Sécurité [cite: 55]</h3>
                <p class="status-note">Opérationnel le 7 Avril [cite: 59]</p>
                <div class="service-list">
                    <div class="service-item" onclick="openForm('gardiennage')">Résidentiel, Boutique & Bureau [cite: 56]</div>
                    <div class="service-item" onclick="openForm('event-sec')">Sécurité événementielle [cite: 57]</div>
                </div>
            </div>
        </div>
    `;
};
