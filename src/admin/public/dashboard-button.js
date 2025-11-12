// Script pour ajouter un bouton Dashboard dans AdminJS
(function() {
  function addDashboardButton() {
    // Attendre que l'interface AdminJS soit chargée
    if (document.querySelector('.adminjs-sidebar')) {
      // Vérifier si le bouton n'existe pas déjà
      if (!document.getElementById('kotiz-dashboard-btn')) {
        // Créer le bouton
        const button = document.createElement('a');
        button.id = 'kotiz-dashboard-btn';
        button.href = '/admin/stats';
        button.target = '_blank';
        button.innerHTML = '📊 Dashboard KOTIZ';
        button.style.cssText = `
          display: block;
          padding: 10px 15px;
          margin: 10px;
          background: linear-gradient(135deg, #4CAF50, #45a049);
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: transform 0.2s;
        `;
        
        // Effet hover
        button.onmouseover = () => button.style.transform = 'scale(1.05)';
        button.onmouseout = () => button.style.transform = 'scale(1)';
        
        // Ajouter le bouton en haut de la sidebar
        const sidebar = document.querySelector('.adminjs-sidebar');
        if (sidebar) {
          sidebar.insertBefore(button, sidebar.firstChild);
        }
      }
    } else {
      // Réessayer après 500ms si AdminJS n'est pas encore chargé
      setTimeout(addDashboardButton, 500);
    }
  }
  
  // Démarrer quand le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addDashboardButton);
  } else {
    addDashboardButton();
  }
})();