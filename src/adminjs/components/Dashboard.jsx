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
  // Suppression des données de graphiques car recharts n'est pas compatible avec AdminJS
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

  // Fonction simplifiée sans graphiques
  const generateSimpleData = (metrics) => {
    return {
      totalUsers: metrics.totalUsers || 0,
      totalCollected: metrics.totalCollected || 0,
      activeCagnottes: metrics.activeCagnottes || 0,
      monthlyContributions: metrics.monthlyContributions || 0
    };
  };

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

      // Générer les données simplifiées
      const simpleData = generateSimpleData(realData);
      setMetrics(prevMetrics => ({ ...prevMetrics, ...simpleData }));

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
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(numAmount);
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

      {/* Métriques principales simplifiées */}
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap="lg" mb="xl">
        <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
          <H3 mb="sm" color="primary">Utilisateurs</H3>
          <Text fontSize="h1" fontWeight="bold" color="success">
            {metrics.totalUsers.toLocaleString('fr-FR')}
          </Text>
          <Text fontSize="sm" color="grey60">Utilisateurs inscrits</Text>
        </Box>

        <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
          <H3 mb="sm" color="primary">Total collecté</H3>
          <Text fontSize="h1" fontWeight="bold" color="info">
            {formatCurrency(metrics.totalCollected)}
          </Text>
          <Text fontSize="sm" color="grey60">Montant total des contributions</Text>
        </Box>

        <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
          <H3 mb="sm" color="primary">Cagnottes actives</H3>
          <Text fontSize="h1" fontWeight="bold" color="warning">
            {metrics.activeCagnottes}
          </Text>
          <Text fontSize="sm" color="grey60">Cagnottes en cours</Text>
        </Box>

        <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
          <H3 mb="sm" color="primary">Ce mois</H3>
          <Text fontSize="h1" fontWeight="bold" color="success">
            {metrics.monthlyContributionCount}
          </Text>
          <Text fontSize="sm" color="grey60">Contributions ce mois</Text>
        </Box>
      </Box>

      {/* Top Cagnottes - Version simplifiée */}
      <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
        <H2 mb="lg">Top Cagnottes</H2>
        {metrics.topCagnottes && metrics.topCagnottes.length > 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell fontWeight="bold">#</TableCell>
                <TableCell fontWeight="bold">Titre</TableCell>
                <TableCell fontWeight="bold" textAlign="right">Montant collecté</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {metrics.topCagnottes.slice(0, 10).map((cagnotte, index) => (
                <TableRow key={cagnotte.id || index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{cagnotte.title || 'Sans titre'}</TableCell>
                  <TableCell textAlign="right" fontWeight="bold" color="success">
                    {formatCurrency(cagnotte.totalCollected || 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Text color="grey60">Aucune cagnotte trouvée</Text>
        )}
      </Box>

      {/* Accès rapide aux données */}
      <Box mt="xl">
        <H2 mb="lg" style={{ color: '#4CA260' }}>🔗 Accès rapide aux données</H2>
        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap="lg">
          <Button
            variant="primary"
            size="lg"
            onClick={() => window.location.href = '/admin/resources/User'}
            style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
          >
            <span style={{ fontSize: '24px' }}>👥</span>
            <span>Utilisateurs ({metrics.totalUsers || 0})</span>
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => window.location.href = '/admin/resources/Pull'}
            style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
          >
            <span style={{ fontSize: '24px' }}>🎯</span>
            <span>Cagnottes ({metrics.activeCagnottes || 0})</span>
          </Button>
          <Button
            variant="success"
            size="lg"
            onClick={() => window.location.href = '/admin/resources/Contribution'}
            style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
          >
            <span style={{ fontSize: '24px' }}>💰</span>
            <span>Contributions ({metrics.monthlyContributions || 0})</span>
          </Button>
          <Button
            variant="info"
            size="lg"
            onClick={() => window.location.href = '/admin/pages/Statistiques%20D%C3%A9taill%C3%A9es'}
            style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
          >
            <span style={{ fontSize: '24px' }}>📊</span>
            <span>Statistiques détaillées</span>
          </Button>
        </Box>

        {/* Section Admin */}
        <Box mt="lg" p="lg" bg="#f8f9fa" borderRadius="lg" border="1px solid" borderColor="#e9ecef">
          <H3 mb="md" style={{ color: '#495057' }}>🔐 Connexion Admin</H3>
          <Text mb="sm" style={{ color: '#6c757d' }}>
            Pour accéder aux statistiques complètes, utilisez ces credentials :
          </Text>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap="md">
            <Box>
              <Text fontWeight="bold">Email:</Text>
              <Text style={{ fontFamily: 'monospace', backgroundColor: '#e9ecef', padding: '4px 8px', borderRadius: '4px' }}>
                admin@kotiz.com
              </Text>
            </Box>
            <Box>
              <Text fontWeight="bold">Mot de passe:</Text>
              <Text style={{ fontFamily: 'monospace', backgroundColor: '#e9ecef', padding: '4px 8px', borderRadius: '4px' }}>
                admin123
              </Text>
            </Box>
          </Box>
          <Text mt="sm" fontSize="sm" style={{ color: '#6c757d' }}>
            Endpoint: <code>POST /api/v1/users/admin-login</code>
          </Text>
          <Button
            variant="outline"
            size="sm"
            mt="sm"
            onClick={async () => {
              try {
                const response = await fetch('http://localhost:5000/api/v1/users/admin-login', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    email: 'admin@kotiz.com',
                    password: 'admin123'
                  })
                });

                if (response.ok) {
                  const data = await response.json();
                  console.log('Token JWT généré:', data.token);
                  alert(`Token JWT copié dans la console:\n${data.token}`);
                  navigator.clipboard.writeText(data.token);
                } else {
                  alert('Erreur lors de la génération du token');
                }
              } catch (error) {
                console.error('Erreur:', error);
                alert('Erreur de connexion');
              }
            }}
          >
            🔑 Générer Token JWT
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;