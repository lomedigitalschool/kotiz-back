import React from 'react';
import { Box, H1, Text, Button } from '@adminjs/design-system';

const HomeDashboard = (props) => {
  return React.createElement(Box, { p: "xl" },
    React.createElement(H1, { style: { color: '#4CA260' } }, "🏠 Tableau de Bord Administrateur - KOTIZ"),
    React.createElement(Text, { mb: "lg" }, "Bienvenue dans le panneau d'administration KOTIZ. Cette page affiche les statistiques clés de votre plateforme."),
    React.createElement(Box, { display: "flex", gap: "lg", flexWrap: "wrap" },
      React.createElement(Button, { variant: "primary", size: "lg", as: "a", href: "/admin/resources/User" }, "👥 Gérer les Utilisateurs"),
      React.createElement(Button, { variant: "secondary", size: "lg", as: "a", href: "/admin/resources/Pull" }, "🎯 Gérer les Cagnottes"),
      React.createElement(Button, { variant: "success", size: "lg", as: "a", href: "/admin/resources/Report" }, "🚨 Voir les Signalements"),
      React.createElement(Button, { variant: "warning", size: "lg", as: "a", href: "/admin/resources/Log" }, "📋 Consulter les Logs"),
      React.createElement(Button, { variant: "info", size: "lg", as: "a", href: "/admin/pages/Statistiques%20D%C3%A9taill%C3%A9es" }, "📊 Statistiques Détaillées"),
      React.createElement(Button, { variant: "info", size: "lg", as: "a", href: "/admin/pages/Export%20Donn%C3%A9es" }, "📥 Exporter les Données"),
      React.createElement(Button, { variant: "info", size: "lg", as: "a", href: "/admin/pages/Mod%C3%A9ration" }, "🛡️ Modération")
    )
  );
};

export default HomeDashboard;