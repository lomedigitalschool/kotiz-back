import React, { useEffect, useState, useRef } from 'react';
import { Box, H1, H2, H3, Text, Button, Table, TableHead, TableBody, TableRow, TableCell } from '@adminjs/design-system';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalCollected: 0,
    activeCagnottes: 0,
    monthlyContributions: 0,
    monthlyContributionCount: 0,
    topCagnottes: []
  });
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Gestion du polling automatique
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchDashboardData();
      }, 60000); // Mise à jour toutes les 60 secondes
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh]);

  const fetchDashboardData = async () => {
    if (isRefreshing) return; // Éviter les appels multiples

    try {
      setIsRefreshing(true);
      // Récupération des données depuis l'API
      const baseUrl = 'http://localhost:5000';

      // Nombre total d'utilisateurs
      const usersResponse = await fetch(`${baseUrl}/api/v1/users/stats`, {
        credentials: 'include'
      });
      const usersData = usersResponse.ok ? await usersResponse.json() : { total: 0 };

      // Statistiques des contributions
      const contributionsResponse = await fetch(`${baseUrl}/api/v1/contributions/stats`, {
        credentials: 'include'
      });
      const contributionsData = contributionsResponse.ok ? await contributionsResponse.json() : {
        totalCollected: 0,
        monthlyAmount: 0,
        monthlyCount: 0
      };

      // Statistiques des cagnottes
      const cagnottesResponse = await fetch(`${baseUrl}/api/v1/pulls/stats`, {
        credentials: 'include'
      });
      const cagnottesData = cagnottesResponse.ok ? await cagnottesResponse.json() : {
        activeCount: 0,
        topCagnottes: []
      };

      const realData = {
        totalUsers: usersData.total || 0,
        totalCollected: contributionsData.totalCollected || 0,
        activeCagnottes: cagnottesData.activeCount || 0,
        monthlyContributions: contributionsData.monthlyAmount || 0,
        monthlyContributionCount: contributionsData.monthlyCount || 0,
        topCagnottes: cagnottesData.topCagnottes || []
      };

      setMetrics(realData);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      // En cas d'erreur, afficher des valeurs vides
      const errorData = {
        totalUsers: 0,
        totalCollected: 0,
        activeCagnottes: 0,
        monthlyContributions: 0,
        monthlyContributionCount: 0,
        topCagnottes: []
      };
      setMetrics(errorData);
      setLastUpdate(new Date());
      setLoading(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const formatLastUpdate = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <Box p="xl">
        <Text>Chargement du dashboard...</Text>
      </Box>
    );
  }

  return (
    <Box p="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="lg">
        <H1>Dashboard Kotiz</H1>
        <Box display="flex" alignItems="center" gap="lg">
          {lastUpdate && (
            <Text fontSize="sm" color="grey60">
              Dernière mise à jour: {formatLastUpdate(lastUpdate)}
            </Text>
          )}
          <Button
            variant={autoRefresh ? "success" : "outlined"}
            size="sm"
            onClick={toggleAutoRefresh}
          >
            {autoRefresh ? "🔄 Auto-rafraîchissement ON" : "⏸️ Auto-rafraîchissement OFF"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchDashboardData}
            disabled={isRefreshing}
          >
            {isRefreshing ? "⏳ Actualisation..." : "🔄 Actualiser maintenant"}
          </Button>
        </Box>
      </Box>

      {/* Métriques principales */}
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap="lg" mb="xl">
        <Box
          bg="white"
          p="lg"
          borderRadius="lg"
          boxShadow="card"
          border="1px solid"
          borderColor="grey20"
        >
          <H3 mb="sm" color="primary">Utilisateurs totaux</H3>
          <Text fontSize="h1" fontWeight="bold" color="success">
            {metrics.totalUsers.toLocaleString('fr-FR')}
          </Text>
          <Text fontSize="sm" color="grey60">
            Comptes actifs
          </Text>
        </Box>

        <Box
          bg="white"
          p="lg"
          borderRadius="lg"
          boxShadow="card"
          border="1px solid"
          borderColor="grey20"
        >
          <H3 mb="sm" color="primary">Montant total collecté</H3>
          <Text fontSize="h1" fontWeight="bold" color="info">
            {formatCurrency(metrics.totalCollected)}
          </Text>
          <Text fontSize="sm" color="grey60">
            Depuis le lancement
          </Text>
        </Box>

        <Box
          bg="white"
          p="lg"
          borderRadius="lg"
          boxShadow="card"
          border="1px solid"
          borderColor="grey20"
        >
          <H3 mb="sm" color="primary">Cagnottes actives</H3>
          <Text fontSize="h1" fontWeight="bold" color="warning">
            {metrics.activeCagnottes}
          </Text>
          <Text fontSize="sm" color="grey60">
            En cours de collecte
          </Text>
        </Box>

        <Box
          bg="white"
          p="lg"
          borderRadius="lg"
          boxShadow="card"
          border="1px solid"
          borderColor="grey20"
        >
          <H3 mb="sm" color="primary">Contributions ce mois</H3>
          <Text fontSize="h1" fontWeight="bold" color="success">
            {formatCurrency(metrics.monthlyContributions)}
          </Text>
          <Text fontSize="sm" color="grey60">
            {metrics.monthlyContributionCount} contributions
          </Text>
        </Box>
      </Box>

      {/* Top 5 cagnottes */}
      <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
        <H2 mb="lg">Top 5 Cagnottes</H2>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell fontWeight="bold">#</TableCell>
              <TableCell fontWeight="bold">Titre</TableCell>
              <TableCell fontWeight="bold" textAlign="right">Montant collecté</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {metrics.topCagnottes.map((cagnotte, index) => (
              <TableRow key={cagnotte.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{cagnotte.title}</TableCell>
                <TableCell textAlign="right" fontWeight="bold" color="success">
                  {formatCurrency(cagnotte.totalCollected)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {/* Actions rapides */}
      <Box mt="xl" display="flex" gap="lg">
        <Button variant="primary" size="lg">
          Créer une nouvelle cagnotte
        </Button>
        <Button variant="secondary" size="lg">
          Voir les rapports détaillés
        </Button>
        <Button variant="outlined" size="lg">
          Gérer les utilisateurs
        </Button>
      </Box>
    </Box>
  );
};

export default Dashboard;