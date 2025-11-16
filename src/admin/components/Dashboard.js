/**
 * Composant Dashboard personnalis pour AdminJS
 * Utilise les nouvelles APIs AdminJS v7 avec @adminjs/design-system
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Header,
  Text,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Icon,
  H1,
  H2,
  H3,
  H4,
  Badge,
  Loader,
} from '@adminjs/design-system';

const Dashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    pools: 0,
    collected: 0,
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/admin/api/dashboard-stats');
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Erreur chargement stats:', err);
        setStats({
          users: 0,
          pools: 0,
          collected: 0,
          recentTransactions: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Actualisation toutes les 30 secondes
    return () => clearInterval(interval);
  }, []);

  const exportData = (type, format) => {
    window.open(`/admin/api/exports/${type}?format=${format}`, '_blank');
  };

  if (loading) {
    return React.createElement(Box, { p: "xl", textAlign: "center" }, [
      React.createElement(Loader, { size: "lg", key: "loader" }),
      React.createElement(Box, { mt: "lg", key: "text" }, [
        React.createElement(Text, { variant: "lg", key: "title" }, "Chargement des statistiques..."),
        React.createElement(Text, { variant: "sm", color: "grey60", key: "subtitle" }, "Veuillez patienter pendant que nous recuperons les donnees.")
      ])
    ]);
  }

  return React.createElement(Box, {
    p: "xl",
    bg: "grey5",
    width: "100vw",
    ml: "-32px",
    mr: "-32px",
    pb: "xxl"
  }, [
    // Header avec branding KOTIZ
    React.createElement(Box, { mb: "xl", key: "header" }, [
      React.createElement(Header, { key: "header-content" }, [
        React.createElement(H2, { key: "title" }, "Dashboard KOTIZ"),
        React.createElement(Text, { variant: "sm", color: "grey60", key: "subtitle" }, "Interface d'administration - Données en temps réel")
      ])
    ]),

    // Cartes de statistiques - pleine largeur
    React.createElement(Box, {
      mb: "xl",
      width: "calc(100vw - 64px)",
      ml: "-32px",
      mr: "-32px",
      key: "stats-section"
    }, [
      React.createElement(Box, {
        p: "lg",
        bg: "white",
        shadow: "sm",
        width: "100%",
        key: "stats"
      }, [
        React.createElement(Box, { display: "flex", gap: "lg", flexWrap: "wrap", key: "stats-grid" }, [
          React.createElement(Box, { flex: "1", minWidth: "250px", key: "users" }, [
            React.createElement(Box, { p: "lg", bg: "white", shadow: "sm", key: "users-card" }, [
              React.createElement(Box, { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "md", key: "users-content" }, [
                React.createElement(Box, { key: "users-text" }, [
                  React.createElement(Text, { variant: "sm", color: "grey60", mb: "sm", key: "users-label" }, "UTILISATEURS INSCRITS"),
                  React.createElement(H2, { color: "text", key: "users-value" }, (stats.users ?? 0).toLocaleString())
                ]),
                React.createElement(Icon, { icon: "User", size: 32, color: "grey40", key: "users-icon" })
              ])
            ])
          ]),

          React.createElement(Box, { flex: "1", minWidth: "250px", key: "pools" }, [
            React.createElement(Box, { p: "lg", bg: "white", shadow: "sm", key: "pools-card" }, [
              React.createElement(Box, { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "md", key: "pools-content" }, [
                React.createElement(Box, { key: "pools-text" }, [
                  React.createElement(Text, { variant: "sm", color: "grey60", mb: "sm", key: "pools-label" }, "CAGNOTTES ACTIVES"),
                  React.createElement(H2, { color: "text", key: "pools-value" }, (stats.pools ?? 0).toLocaleString())
                ]),
                React.createElement(Icon, { icon: "Target", size: 32, color: "grey40", key: "pools-icon" })
              ])
            ])
          ]),

          React.createElement(Box, { flex: "1", minWidth: "250px", key: "collected" }, [
            React.createElement(Box, { p: "lg", bg: "white", shadow: "sm", key: "collected-card" }, [
              React.createElement(Box, { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "md", key: "collected-content" }, [
                React.createElement(Box, { key: "collected-text" }, [
                  React.createElement(Text, { variant: "sm", color: "grey60", mb: "sm", key: "collected-label" }, "MONTANT COLLECTES"),
                  React.createElement(H2, { color: "text", key: "collected-value" }, `${(stats.collected || 0).toLocaleString()} F CFA`)
                ]),
                React.createElement(Icon, { icon: "DollarSign", size: 32, color: "grey40", key: "collected-icon" })
              ])
            ])
          ])
        ])
      ])
    ]),

    // Section exports - pleine largeur
    React.createElement(Box, {
      mb: "xl",
      width: "calc(100vw - 64px)", // prend toute la largeur de la fenêtre
      ml: "-32px", // supprime la marge de gauche du layout AdminJS
      mr: "-32px", // supprime la marge de droite
      key: "exports-section"
    }, [
      React.createElement(Box, {
        p: "lg",
        bg: "white",
        shadow: "sm",
        width: "100%",
        key: "exports"
      }, [
        React.createElement(H3, { mb: "lg", key: "exports-title" }, "Exports de données"),
        React.createElement(Box, { display: "flex", gap: "lg", flexWrap: "wrap", key: "exports-content" }, [
          // Export Utilisateurs
          React.createElement(Box, { flex: "1", minWidth: "250px", key: "export-users" }, [
            React.createElement(Box, { p: "md", bg: "grey10", borderRadius: "default", key: "export-users-card" }, [
              React.createElement(H4, { variant: "sm", mb: "sm", key: "export-users-title" }, "Utilisateurs"),
              React.createElement(Text, { variant: "sm", color: "grey60", mb: "md", key: "export-users-desc" }, "Exporter la liste des utilisateurs inscrits"),
              React.createElement(Box, { display: "flex", gap: "sm", flexWrap: "wrap", key: "export-users-buttons" }, [
                React.createElement(Button, {
                  variant: "outlined",
                  size: "sm",
                  onClick: () => exportData('users', 'csv'),
                  key: "export-users-csv"
                }, "CSV"),
                React.createElement(Button, {
                  variant: "outlined",
                  size: "sm",
                  onClick: () => exportData('users', 'excel'),
                  key: "export-users-excel"
                }, "Excel")
              ])
            ])
          ]),

          // Export Cagnottes
          React.createElement(Box, { flex: "1", minWidth: "250px", key: "export-pulls" }, [
            React.createElement(Box, { p: "md", bg: "grey10", borderRadius: "default", key: "export-pulls-card" }, [
              React.createElement(H4, { variant: "sm", mb: "sm", key: "export-pulls-title" }, "Cagnottes"),
              React.createElement(Text, { variant: "sm", color: "grey60", mb: "md", key: "export-pulls-desc" }, "Exporter les données des cagnottes"),
              React.createElement(Box, { display: "flex", gap: "sm", flexWrap: "wrap", key: "export-pulls-buttons" }, [
                React.createElement(Button, {
                  variant: "outlined",
                  size: "sm",
                  onClick: () => exportData('pulls', 'csv'),
                  key: "export-pulls-csv"
                }, "CSV"),
                React.createElement(Button, {
                  variant: "outlined",
                  size: "sm",
                  onClick: () => exportData('pulls', 'excel'),
                  key: "export-pulls-excel"
                }, "Excel")
              ])
            ])
          ]),

          // Export Transactions
          React.createElement(Box, { flex: "1", minWidth: "250px", key: "export-transactions" }, [
            React.createElement(Box, { p: "md", bg: "grey10", borderRadius: "default", key: "export-transactions-card" }, [
              React.createElement(H4, { variant: "sm", mb: "sm", key: "export-transactions-title" }, "Transactions"),
              React.createElement(Text, { variant: "sm", color: "grey60", mb: "md", key: "export-transactions-desc" }, "Exporter l'historique des transactions"),
              React.createElement(Box, { display: "flex", gap: "sm", flexWrap: "wrap", key: "export-transactions-buttons" }, [
                React.createElement(Button, {
                  variant: "outlined",
                  size: "sm",
                  onClick: () => exportData('transactions', 'csv'),
                  key: "export-transactions-csv"
                }, "CSV"),
                React.createElement(Button, {
                  variant: "outlined",
                  size: "sm",
                  onClick: () => exportData('transactions', 'excel'),
                  key: "export-transactions-excel"
                }, "Excel")
              ])
            ])
          ])
        ])
      ])
    ]),

    // Dernières transactions - pleine largeur réelle (bord à bord)
    stats.recentTransactions.length > 0 && React.createElement(Box, {
      mb: "xl",
      width: "calc(100vw - 64px)", // prend toute la largeur de la fenêtre
      ml: "-32px", // supprime la marge de gauche du layout AdminJS
      mr: "-32px", // supprime la marge de droite
      key: "recent-transactions-section"
    }, [
      React.createElement(Box, {
        p: "lg",
        bg: "white",
        shadow: "sm",
        width: "100%",
        style: { overflowX: "auto" }, // gère le scroll si table large
        key: "recent-transactions"
      }, [
        React.createElement(H3, { mb: "lg", key: "recent-title" }, "Dernières transactions"),
        React.createElement(Table, { key: "recent-table" }, [
          React.createElement(TableHead, { key: "table-head" }, [
            React.createElement(TableRow, { key: "table-header-row" }, [
              React.createElement(TableCell, { key: "id-header" }, "ID"),
              React.createElement(TableCell, { key: "amount-header" }, "Montant"),
              React.createElement(TableCell, { key: "status-header" }, "Statut"),
              React.createElement(TableCell, { key: "date-header" }, "Date")
            ])
          ]),
          React.createElement(TableBody, { key: "table-body" }, stats.recentTransactions.slice(0, 5).map((transaction) =>
            React.createElement(TableRow, { key: transaction.id }, [
              React.createElement(TableCell, { key: "id" }, transaction.id),
              React.createElement(TableCell, { key: "amount" }, `${(transaction.amount || 0).toLocaleString()} F CFA`),
              React.createElement(TableCell, { key: "status" }, [
                React.createElement(Badge, {
                  variant: transaction.status === 'success' ? 'success' : 'warning',
                  size: "sm",
                  key: "status-badge"
                }, transaction.status || 'pending')
              ]),
              React.createElement(TableCell, { key: "date" }, new Date(transaction.createdAt).toLocaleDateString('fr-FR'))
            ])
          ))
        ])
      ])
    ]),

    // Footer
    React.createElement(Box, { mt: "xl", textAlign: "center", key: "footer" }, [
      React.createElement(Text, { variant: "sm", color: "grey60", key: "footer-text" }, "2025 KOTIZ - Plateforme de cagnottes collaboratives")
    ])
  ]);
};

export default Dashboard;
