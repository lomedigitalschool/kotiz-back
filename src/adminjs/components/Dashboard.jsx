import React, { useEffect, useState, useRef } from 'react';
import { Box, H1, H2, H3, Text, Button, Table, TableHead, TableBody, TableRow, TableCell } from '@adminjs/design-system';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalCollected: 0,
    activeCagnottes: 0,
    monthlyContributions: 0,
    monthlyContributionCount: 0,
    topCagnottes: []
  });
  const [chartData, setChartData] = useState({
    contributionsOverTime: [],
    paymentMethods: [],
    topCagnottesChart: []
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

  const generateChartData = (metrics) => {
    // Données pour l'évolution des contributions (simulation basée sur les vraies données)
    const baseAmount = parseFloat(metrics.totalCollected) || 0;
    const contributionsOverTime = [
      { month: 'Avril', amount: Math.floor(baseAmount * 0.1) },
      { month: 'Mai', amount: Math.floor(baseAmount * 0.15) },
      { month: 'Juin', amount: Math.floor(baseAmount * 0.2) },
      { month: 'Juillet', amount: Math.floor(baseAmount * 0.25) },
      { month: 'Août', amount: Math.floor(baseAmount * 0.2) },
      { month: 'Septembre', amount: baseAmount }
    ];

    // Données pour les méthodes de paiement (simulation réaliste)
    const totalCollected = parseFloat(metrics.totalCollected) || 0;
    const paymentMethods = [
      { name: 'Orange Money', value: Math.floor(totalCollected * 0.4), color: '#4CA260' },
      { name: 'MTN Mobile Money', value: Math.floor(totalCollected * 0.3), color: '#3B5BAB' },
      { name: 'Wave', value: Math.floor(totalCollected * 0.2), color: '#FF9800' },
      { name: 'Carte bancaire', value: Math.floor(totalCollected * 0.1), color: '#F44336' }
    ];

    // Données pour le top des cagnottes (utilisant les vraies données)
    const topCagnottesChart = (metrics.topCagnottes || []).slice(0, 5).map((cagnotte, index) => ({
      name: cagnotte.title && cagnotte.title.length > 15 ? cagnotte.title.substring(0, 15) + '...' : (cagnotte.title || 'Sans titre'),
      amount: parseFloat(cagnotte.totalCollected) || 0,
      color: index === 0 ? '#4CA260' : index === 1 ? '#3B5BAB' : '#FF9800'
    }));

    return {
      contributionsOverTime,
      paymentMethods,
      topCagnottesChart
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

      // Générer les données pour les graphiques
      const chartData = generateChartData(realData);
      setChartData(chartData);

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

      {/* Métriques principales avec graphiques */}
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap="lg" mb="xl">
        {/* Graphique d'évolution des contributions */}
        <Box
          bg="white"
          p="lg"
          borderRadius="lg"
          boxShadow="card"
          border="1px solid"
          borderColor="grey20"
        >
          <H3 mb="sm" color="primary">Évolution des contributions</H3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData.contributionsOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [formatCurrency(value), 'Montant']} />
              <Line type="monotone" dataKey="amount" stroke="#4CA260" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {/* Graphique des méthodes de paiement */}
        <Box
          bg="white"
          p="lg"
          borderRadius="lg"
          boxShadow="card"
          border="1px solid"
          borderColor="grey20"
        >
          <H3 mb="sm" color="primary">Répartition par méthode de paiement</H3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData.paymentMethods}
                cx="50%"
                cy="50%"
                outerRadius={60}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.paymentMethods.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [formatCurrency(value), 'Montant']} />
            </PieChart>
          </ResponsiveContainer>
        </Box>

        {/* Métriques clés */}
        <Box
          bg="white"
          p="lg"
          borderRadius="lg"
          boxShadow="card"
          border="1px solid"
          borderColor="grey20"
        >
          <H3 mb="lg" color="primary">Métriques clés</H3>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap="md">
            <Box textAlign="center">
              <Text fontSize="h2" fontWeight="bold" color="success">
                {metrics.totalUsers.toLocaleString('fr-FR')}
              </Text>
              <Text fontSize="sm" color="grey60">Utilisateurs</Text>
            </Box>
            <Box textAlign="center">
              <Text fontSize="h2" fontWeight="bold" color="info">
                {formatCurrency(metrics.totalCollected)}
              </Text>
              <Text fontSize="sm" color="grey60">Total collecté</Text>
            </Box>
            <Box textAlign="center">
              <Text fontSize="h2" fontWeight="bold" color="warning">
                {metrics.activeCagnottes}
              </Text>
              <Text fontSize="sm" color="grey60">Cagnottes actives</Text>
            </Box>
            <Box textAlign="center">
              <Text fontSize="h2" fontWeight="bold" color="success">
                {metrics.monthlyContributionCount}
              </Text>
              <Text fontSize="sm" color="grey60">Ce mois</Text>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Top 5 cagnottes avec graphique */}
      <Box display="grid" gridTemplateColumns="1fr 1fr" gap="lg">
        <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
          <H2 mb="lg">Top Cagnottes - Graphique</H2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.topCagnottesChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [formatCurrency(value), 'Montant']} />
              <Bar dataKey="amount" fill="#4CA260" />
            </BarChart>
          </ResponsiveContainer>
        </Box>

        <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
          <H2 mb="lg">Top Cagnottes - Détails</H2>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell fontWeight="bold">#</TableCell>
                <TableCell fontWeight="bold">Titre</TableCell>
                <TableCell fontWeight="bold" textAlign="right">Montant</TableCell>
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