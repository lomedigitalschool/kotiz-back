import React, { useEffect, useState } from 'react';
import { Box, H1, H2, H3, Text, Table, TableHead, TableBody, TableRow, TableCell, Button, Input, Select } from '@adminjs/design-system';

const AdvancedStats = () => {
  const [stats, setStats] = useState({
    users: { total: 0, active: 0, verified: 0, newThisMonth: 0 },
    contributions: { totalCollected: 0, monthlyAmount: 0, monthlyCount: 0, averageContribution: 0 },
    pulls: { total: 0, active: 0, completed: 0, successRate: 0 },
    transactions: { total: 0, successful: 0, failed: 0, successRate: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [topContributors, setTopContributors] = useState([]);
  const [topPulls, setTopPulls] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);

  useEffect(() => {
    fetchAdvancedStats();
  }, [period]);

  const fetchAdvancedStats = async () => {
    try {
      setLoading(true);
      const baseUrl = window.location.origin;

      // Récupération parallèle des statistiques
      const [usersRes, contributionsRes, pullsRes, transactionsRes, trendsRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/users/stats`).catch(() => ({ ok: false })),
        fetch(`${baseUrl}/api/v1/contributions/stats`).catch(() => ({ ok: false })),
        fetch(`${baseUrl}/api/v1/pulls/stats`).catch(() => ({ ok: false })),
        fetch(`${baseUrl}/api/v1/transactions/stats`).catch(() => ({ ok: false })),
        fetch(`${baseUrl}/api/v1/admin/stats/trends?days=${period}`).catch(() => ({ ok: false }))
      ]);

      const usersData = usersRes.ok ? await usersRes.json() : {};
      const contributionsData = contributionsRes.ok ? await contributionsRes.json() : {};
      const pullsData = pullsRes.ok ? await pullsRes.json() : {};
      const transactionsData = transactionsRes.ok ? await transactionsRes.json() : {};
      const trendsData = trendsRes.ok ? await trendsRes.json() : { trends: [], topContributors: [], topPulls: [] };

      setStats({
        users: {
          total: usersData.total || 0,
          active: usersData.active || 0,
          verified: usersData.verified || 0,
          newThisMonth: usersData.newThisMonth || 0
        },
        contributions: {
          totalCollected: contributionsData.totalCollected || 0,
          monthlyAmount: contributionsData.monthlyAmount || 0,
          monthlyCount: contributionsData.monthlyCount || 0,
          averageContribution: contributionsData.monthlyCount > 0 ? contributionsData.monthlyAmount / contributionsData.monthlyCount : 0
        },
        pulls: {
          total: pullsData.total || 0,
          active: pullsData.active || 0,
          completed: pullsData.completed || 0,
          successRate: pullsData.total > 0 ? (pullsData.completed / pullsData.total) * 100 : 0
        },
        transactions: {
          total: transactionsData.total || 0,
          successful: transactionsData.successful || 0,
          failed: transactionsData.failed || 0,
          successRate: transactionsData.total > 0 ? (transactionsData.successful / transactionsData.total) * 100 : 0
        }
      });

      setTopContributors(trendsData.topContributors || []);
      setTopPulls(trendsData.topPulls || []);
      setMonthlyTrends(trendsData.trends || []);

    } catch (error) {
      console.error('Erreur chargement stats avancées:', error);
    } finally {
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

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Box p="xl">
        <Text>Chargement des statistiques avancées...</Text>
      </Box>
    );
  }

  return (
    <Box p="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="lg">
        <H1>📊 Statistiques Détaillées</H1>
        <Box display="flex" alignItems="center" gap="md">
          <Text fontWeight="bold">Période:</Text>
          <Select
            value={period}
            onChange={setPeriod}
            options={[
              { value: '7', label: '7 jours' },
              { value: '30', label: '30 jours' },
              { value: '90', label: '90 jours' },
              { value: '365', label: '1 an' }
            ]}
          />
          <Button variant="secondary" onClick={fetchAdvancedStats}>
            Actualiser
          </Button>
        </Box>
      </Box>

      {/* Métriques principales */}
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(280px, 1fr))" gap="lg" mb="xl">
        {/* Utilisateurs */}
        <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
          <H3 mb="md" color="primary">👥 Utilisateurs</H3>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap="md">
            <Box>
              <Text fontSize="sm" color="grey60">Total</Text>
              <Text fontSize="h3" fontWeight="bold" color="success">{stats.users.total.toLocaleString('fr-FR')}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="grey60">Actifs</Text>
              <Text fontSize="h3" fontWeight="bold" color="info">{stats.users.active.toLocaleString('fr-FR')}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="grey60">Vérifiés</Text>
              <Text fontSize="h3" fontWeight="bold" color="warning">{stats.users.verified.toLocaleString('fr-FR')}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="grey60">Nouveaux/mois</Text>
              <Text fontSize="h3" fontWeight="bold" color="danger">{stats.users.newThisMonth}</Text>
            </Box>
          </Box>
        </Box>

        {/* Contributions */}
        <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
          <H3 mb="md" color="primary">💰 Contributions</H3>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap="md">
            <Box>
              <Text fontSize="sm" color="grey60">Total collecté</Text>
              <Text fontSize="h3" fontWeight="bold" color="success">{formatCurrency(stats.contributions.totalCollected)}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="grey60">Ce mois</Text>
              <Text fontSize="h3" fontWeight="bold" color="info">{formatCurrency(stats.contributions.monthlyAmount)}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="grey60">Nombre/mois</Text>
              <Text fontSize="h3" fontWeight="bold" color="warning">{stats.contributions.monthlyCount}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="grey60">Moyenne</Text>
              <Text fontSize="h3" fontWeight="bold" color="danger">{formatCurrency(stats.contributions.averageContribution)}</Text>
            </Box>
          </Box>
        </Box>

        {/* Cagnottes */}
        <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
          <H3 mb="md" color="primary">🎯 Cagnottes</H3>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap="md">
            <Box>
              <Text fontSize="sm" color="grey60">Total</Text>
              <Text fontSize="h3" fontWeight="bold" color="success">{stats.pulls.total}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="grey60">Actives</Text>
              <Text fontSize="h3" fontWeight="bold" color="info">{stats.pulls.active}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="grey60">Réussies</Text>
              <Text fontSize="h3" fontWeight="bold" color="warning">{stats.pulls.completed}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="grey60">Taux succès</Text>
              <Text fontSize="h3" fontWeight="bold" color="danger">{formatPercentage(stats.pulls.successRate)}</Text>
            </Box>
          </Box>
        </Box>

        {/* Transactions */}
        <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
          <H3 mb="md" color="primary">🔄 Transactions</H3>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap="md">
            <Box>
              <Text fontSize="sm" color="grey60">Total</Text>
              <Text fontSize="h3" fontWeight="bold" color="success">{stats.transactions.total}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="grey60">Réussies</Text>
              <Text fontSize="h3" fontWeight="bold" color="info">{stats.transactions.successful}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="grey60">Échouées</Text>
              <Text fontSize="h3" fontWeight="bold" color="warning">{stats.transactions.failed}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="grey60">Taux succès</Text>
              <Text fontSize="h3" fontWeight="bold" color="danger">{formatPercentage(stats.transactions.successRate)}</Text>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Contenu détaillé en deux colonnes */}
      <Box display="grid" gridTemplateColumns="1fr 1fr" gap="xl">
        {/* Top contributeurs */}
        <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
          <H2 mb="lg">🥇 Top Contributeurs</H2>
          {topContributors.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell fontWeight="bold">#</TableCell>
                  <TableCell fontWeight="bold">Nom</TableCell>
                  <TableCell fontWeight="bold" textAlign="right">Total</TableCell>
                  <TableCell fontWeight="bold" textAlign="right">Nombre</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topContributors.slice(0, 10).map((contributor, index) => (
                  <TableRow key={contributor.id || index}>
                    <TableCell>
                      <Text fontWeight="bold" color={index < 3 ? 'success' : 'grey60'}>
                        {index + 1}
                      </Text>
                    </TableCell>
                    <TableCell>{contributor.name || 'Anonyme'}</TableCell>
                    <TableCell textAlign="right" fontWeight="bold" color="success">
                      {formatCurrency(contributor.totalAmount)}
                    </TableCell>
                    <TableCell textAlign="right">{contributor.contributionCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Text color="grey60" textAlign="center" py="xl">
              Aucune donnée disponible
            </Text>
          )}
        </Box>

        {/* Top cagnottes */}
        <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
          <H2 mb="lg">🏆 Top Cagnottes</H2>
          {topPulls.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell fontWeight="bold">#</TableCell>
                  <TableCell fontWeight="bold">Titre</TableCell>
                  <TableCell fontWeight="bold" textAlign="right">Collecté</TableCell>
                  <TableCell fontWeight="bold" textAlign="right">Contributeurs</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topPulls.slice(0, 10).map((pull, index) => (
                  <TableRow key={pull.id || index}>
                    <TableCell>
                      <Text fontWeight="bold" color={index < 3 ? 'success' : 'grey60'}>
                        {index + 1}
                      </Text>
                    </TableCell>
                    <TableCell>{pull.title}</TableCell>
                    <TableCell textAlign="right" fontWeight="bold" color="success">
                      {formatCurrency(pull.totalCollected)}
                    </TableCell>
                    <TableCell textAlign="right">{pull.contributorCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Text color="grey60" textAlign="center" py="xl">
              Aucune donnée disponible
            </Text>
          )}
        </Box>
      </Box>

      {/* Tendances mensuelles */}
      <Box mt="xl" bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
        <H2 mb="lg">📈 Tendances sur {period} jours</H2>
        {monthlyTrends.length > 0 ? (
          <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap="lg">
            {monthlyTrends.map((trend, index) => (
              <Box key={index} textAlign="center" p="md" bg="grey0" borderRadius="md">
                <Text fontSize="sm" color="grey60">{trend.date}</Text>
                <Text fontSize="h4" fontWeight="bold" color="primary" mt="sm">
                  {formatCurrency(trend.amount)}
                </Text>
                <Text fontSize="sm" color="success">{trend.count} contributions</Text>
              </Box>
            ))}
          </Box>
        ) : (
          <Text color="grey60" textAlign="center" py="xl">
            Aucune donnée de tendance disponible
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default AdvancedStats;