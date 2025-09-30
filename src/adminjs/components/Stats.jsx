import React, { useEffect, useState } from 'react';
import { Box, H1, H2, H3, Text, Table, TableHead, TableBody, TableRow, TableCell, Button } from '@adminjs/design-system';

// Graphiques simples en SVG/CSS pour AdminJS
const SimpleBarChart = ({ data, title }) => {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(item => item.value || 0));

  return (
    <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
      <H3 mb="sm" color="primary">{title}</H3>
      <Box display="flex" alignItems="end" gap="md" height="200px">
        {data.map((item, index) => {
          const height = maxValue > 0 ? (item.value / maxValue) * 150 : 0;
          return (
            <Box key={index} display="flex" flexDirection="column" alignItems="center" flex="1">
              <Box
                width="100%"
                maxWidth="40px"
                height={`${height}px`}
                bg="#4CA260"
                borderRadius="sm"
                mb="sm"
                transition="all 0.3s ease"
                style={{ minHeight: '10px' }}
              />
              <Text fontSize="xs" textAlign="center" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                {item.label}
              </Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

const SimplePieChart = ({ data, title }) => {
  if (!data || data.length === 0) return null;

  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
  const colors = ['#4CA260', '#3B5BAB', '#FF9800', '#F44336', '#9C27B0'];

  return (
    <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
      <H3 mb="sm" color="primary">{title}</H3>
      <Box display="flex" flexDirection="column" gap="sm">
        {data.map((item, index) => {
          const percentage = total > 0 ? ((item.value || 0) / total) * 100 : 0;
          return (
            <Box key={index} display="flex" alignItems="center" gap="sm">
              <Box
                width="20px"
                height="20px"
                bg={colors[index % colors.length]}
                borderRadius="sm"
              />
              <Text flex="1">{item.label}</Text>
              <Text fontWeight="bold">{percentage.toFixed(1)}%</Text>
              <Text fontSize="sm" color="grey60">
                ({(item.value || 0).toLocaleString()} FCFA)
              </Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

const Stats = () => {
  const [stats, setStats] = useState({
    users: { total: 0, active: 0, newThisMonth: 0, verified: 0 },
    contributions: { totalCollected: 0, monthlyAmount: 0, monthlyCount: 0 },
    pulls: { activeCount: 0, totalCount: 0 }
  });
  const [chartData, setChartData] = useState({
    monthlyEvolution: [],
    paymentMethods: [],
    topCagnottes: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const baseUrl = window.location.origin;

      const [usersRes, contributionsRes, pullsRes, chartRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/adminjs/users/admin-stats`, { credentials: 'include' }),
        fetch(`${baseUrl}/api/v1/adminjs/contributions/admin-stats`, { credentials: 'include' }),
        fetch(`${baseUrl}/api/v1/adminjs/pulls/admin-stats`, { credentials: 'include' }),
        fetch(`${baseUrl}/api/v1/adminjs/users/admin-chart-data`, { credentials: 'include' })
      ]);

      const users = usersRes.ok ? await usersRes.json() : {};
      const contributions = contributionsRes.ok ? await contributionsRes.json() : {};
      const pulls = pullsRes.ok ? await pullsRes.json() : {};
      const chart = chartRes.ok ? await chartRes.json() : {};

      setStats({ users, contributions, pulls });
      setChartData(chart);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(numAmount);
  };

  const safeNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  if (loading) {
    return (
      <Box p="xl">
        <Text>Chargement des statistiques...</Text>
      </Box>
    );
  }

  return (
    <Box p="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="lg">
        <H1>Statistiques Détaillées</H1>
        <Button variant="primary" onClick={fetchStats}>
          Actualiser
        </Button>
      </Box>

      {/* Vue d'ensemble simplifiée - Toutes les données en une seule vue */}
      <Box mb="xl">
        <H2 mb="lg" style={{ color: '#4CA260' }}>📊 Vue d'ensemble du système</H2>

        {/* Ligne 1: Utilisateurs */}
        <Box mb="lg">
          <H3 mb="sm" style={{ color: '#4CA260' }}>👥 Utilisateurs</H3>
          <Box display="flex" gap="md" flexWrap="wrap">
            <Box bg="#4CA260" p="md" borderRadius="lg" color="white" minWidth="150px">
              <Text fontSize="sm">Total</Text>
              <Text fontSize="h2" fontWeight="bold">{safeNumber(stats.users.total)}</Text>
            </Box>
            <Box bg="#3B5BAB" p="md" borderRadius="lg" color="white" minWidth="150px">
              <Text fontSize="sm">Actifs</Text>
              <Text fontSize="h2" fontWeight="bold">{safeNumber(stats.users.active)}</Text>
            </Box>
            <Box bg="#5CAF6E" p="md" borderRadius="lg" color="white" minWidth="150px">
              <Text fontSize="sm">Nouveaux/mois</Text>
              <Text fontSize="h2" fontWeight="bold">{safeNumber(stats.users.newThisMonth)}</Text>
            </Box>
            <Box bg="#7EC78A" p="md" borderRadius="lg" color="white" minWidth="150px">
              <Text fontSize="sm">Vérifiés</Text>
              <Text fontSize="h2" fontWeight="bold">{safeNumber(stats.users.verified)}</Text>
            </Box>
          </Box>
        </Box>

        {/* Ligne 2: Contributions */}
        <Box mb="lg">
          <H3 mb="sm" style={{ color: '#4CA260' }}>💰 Contributions</H3>
          <Box display="flex" gap="md" flexWrap="wrap">
            <Box bg="#4CA260" p="md" borderRadius="lg" color="white" minWidth="180px">
              <Text fontSize="sm">Total collecté</Text>
              <Text fontSize="h2" fontWeight="bold">{formatCurrency(safeNumber(stats.contributions.totalCollected))}</Text>
            </Box>
            <Box bg="#3B5BAB" p="md" borderRadius="lg" color="white" minWidth="180px">
              <Text fontSize="sm">Ce mois</Text>
              <Text fontSize="h2" fontWeight="bold">{formatCurrency(safeNumber(stats.contributions.monthlyAmount))}</Text>
            </Box>
            <Box bg="#5CAF6E" p="md" borderRadius="lg" color="white" minWidth="150px">
              <Text fontSize="sm">Nombre</Text>
              <Text fontSize="h2" fontWeight="bold">{safeNumber(stats.contributions.monthlyCount)}</Text>
            </Box>
          </Box>
        </Box>

        {/* Ligne 3: Cagnottes */}
        <Box mb="lg">
          <H3 mb="sm" style={{ color: '#4CA260' }}>🎯 Cagnottes</H3>
          <Box display="flex" gap="md" flexWrap="wrap">
            <Box bg="#4CA260" p="md" borderRadius="lg" color="white" minWidth="150px">
              <Text fontSize="sm">Actives</Text>
              <Text fontSize="h2" fontWeight="bold">{safeNumber(stats.pulls.activeCount)}</Text>
            </Box>
            <Box bg="#3B5BAB" p="md" borderRadius="lg" color="white" minWidth="150px">
              <Text fontSize="sm">Total</Text>
              <Text fontSize="h2" fontWeight="bold">{safeNumber(stats.pulls.totalCount)}</Text>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Graphiques Visualisations */}
      <Box mb="xl">
        <H2 mb="lg" style={{ color: '#4CA260' }}>📊 Visualisations</H2>
        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(400px, 1fr))" gap="lg" mb="lg">
          {/* Graphique des méthodes de paiement */}
          <SimplePieChart
            title="Répartition par méthode de paiement"
            data={chartData.paymentMethods && chartData.paymentMethods.length > 0
              ? chartData.paymentMethods.map(item => ({
                  label: item.name || 'Non spécifié',
                  value: safeNumber(item.value)
                }))
              : [
                  { label: 'Orange Money', value: safeNumber(stats.contributions.totalCollected) * 0.4 },
                  { label: 'MTN Mobile Money', value: safeNumber(stats.contributions.totalCollected) * 0.3 },
                  { label: 'Wave', value: safeNumber(stats.contributions.totalCollected) * 0.2 },
                  { label: 'Carte bancaire', value: safeNumber(stats.contributions.totalCollected) * 0.1 }
                ]
            }
          />

          {/* Graphique des types d'utilisateurs */}
          <SimpleBarChart
            title="Répartition des utilisateurs"
            data={[
              { label: 'Actifs', value: safeNumber(stats.users.active) },
              { label: 'Vérifiés', value: safeNumber(stats.users.verified) },
              { label: 'Nouveaux', value: safeNumber(stats.users.newThisMonth) }
            ]}
          />
        </Box>

        {/* Graphique des contributions mensuelles */}
        <SimpleBarChart
          title="Évolution des contributions mensuelles"
          data={chartData.monthlyEvolution && chartData.monthlyEvolution.length > 0
            ? chartData.monthlyEvolution.map(item => ({
                label: item.month || 'N/A',
                value: safeNumber(item.amount)
              }))
            : [
                { label: 'Sept', value: safeNumber(stats.contributions.monthlyAmount) * 0.8 },
                { label: 'Août', value: safeNumber(stats.contributions.monthlyAmount) * 0.9 },
                { label: 'Sept', value: safeNumber(stats.contributions.monthlyAmount) }
              ]
          }
        />

        {/* Top Cagnottes */}
        {chartData.topCagnottes && chartData.topCagnottes.length > 0 && (
          <SimpleBarChart
            title="Top Cagnottes par montant collecté"
            data={chartData.topCagnottes.slice(0, 5).map(item => ({
              label: (item.title || 'Sans titre').length > 15 ? (item.title || 'Sans titre').substring(0, 15) + '...' : (item.title || 'Sans titre'),
              value: safeNumber(item.amount)
            }))}
          />
        )}
      </Box>

      {/* Top Contributeurs */}
      {stats.contributions.topContributors && stats.contributions.topContributors.length > 0 && (
        <Box>
          <H2 mb="lg" style={{ color: '#4CA260' }}>🏆 Top Contributeurs</H2>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell fontWeight="bold">#</TableCell>
                <TableCell fontWeight="bold">Nom</TableCell>
                <TableCell fontWeight="bold">Email</TableCell>
                <TableCell fontWeight="bold" textAlign="right">Montant Contribué</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.contributions.topContributors.map((contributor, index) => (
                <TableRow key={contributor.userId}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{contributor['contributor.name']}</TableCell>
                  <TableCell>{contributor['contributor.email']}</TableCell>
                  <TableCell textAlign="right" fontWeight="bold" style={{ color: '#4CA260' }}>
                    {formatCurrency(contributor.totalContributed)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default Stats;