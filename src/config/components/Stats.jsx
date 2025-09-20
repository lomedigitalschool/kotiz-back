import React, { useEffect, useState } from 'react';
import { Box, H1, H2, H3, Text, Table, TableHead, TableBody, TableRow, TableCell, Button } from '@adminjs/design-system';

const Stats = () => {
  const [stats, setStats] = useState({
    users: { total: 0, active: 0, newThisMonth: 0, verified: 0 },
    contributions: { totalCollected: 0, monthlyAmount: 0, monthlyCount: 0 },
    pulls: { activeCount: 0, totalCount: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const baseUrl = window.location.origin;

      const [usersRes, contributionsRes, pullsRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/users/stats`, { credentials: 'include' }),
        fetch(`${baseUrl}/api/v1/contributions/stats`, { credentials: 'include' }),
        fetch(`${baseUrl}/api/v1/pulls/stats`, { credentials: 'include' })
      ]);

      const users = usersRes.ok ? await usersRes.json() : {};
      const contributions = contributionsRes.ok ? await contributionsRes.json() : {};
      const pulls = pullsRes.ok ? await pullsRes.json() : {};

      setStats({ users, contributions, pulls });
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      setLoading(false);
    }
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

      {/* Statistiques Utilisateurs */}
      <Box mb="xl">
        <H2 mb="lg" style={{ color: '#4CA260' }}>👥 Statistiques Utilisateurs</H2>
        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap="lg">
          <Box bg="#4CA260" p="lg" borderRadius="lg" color="white">
            <H3 mb="sm">Total Utilisateurs</H3>
            <Text fontSize="h1" fontWeight="bold">{stats.users.total}</Text>
          </Box>
          <Box bg="#3B5BAB" p="lg" borderRadius="lg" color="white">
            <H3 mb="sm">Utilisateurs Actifs</H3>
            <Text fontSize="h1" fontWeight="bold">{stats.users.active}</Text>
          </Box>
          <Box bg="#5CAF6E" p="lg" borderRadius="lg" color="white">
            <H3 mb="sm">Nouveaux ce mois</H3>
            <Text fontSize="h1" fontWeight="bold">{stats.users.newThisMonth}</Text>
          </Box>
          <Box bg="#7EC78A" p="lg" borderRadius="lg" color="white">
            <H3 mb="sm">Utilisateurs Vérifiés</H3>
            <Text fontSize="h1" fontWeight="bold">{stats.users.verified}</Text>
          </Box>
        </Box>
      </Box>

      {/* Statistiques Contributions */}
      <Box mb="xl">
        <H2 mb="lg" style={{ color: '#4CA260' }}>💰 Statistiques Contributions</H2>
        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap="lg">
          <Box bg="#4CA260" p="lg" borderRadius="lg" color="white">
            <H3 mb="sm">Total Collecté</H3>
            <Text fontSize="h1" fontWeight="bold">{formatCurrency(stats.contributions.totalCollected)}</Text>
          </Box>
          <Box bg="#3B5BAB" p="lg" borderRadius="lg" color="white">
            <H3 mb="sm">Ce Mois</H3>
            <Text fontSize="h1" fontWeight="bold">{formatCurrency(stats.contributions.monthlyAmount)}</Text>
          </Box>
          <Box bg="#5CAF6E" p="lg" borderRadius="lg" color="white">
            <H3 mb="sm">Nombre Contributions</H3>
            <Text fontSize="h1" fontWeight="bold">{stats.contributions.monthlyCount}</Text>
          </Box>
        </Box>
      </Box>

      {/* Statistiques Cagnottes */}
      <Box mb="xl">
        <H2 mb="lg" style={{ color: '#4CA260' }}>🎯 Statistiques Cagnottes</H2>
        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap="lg">
          <Box bg="#4CA260" p="lg" borderRadius="lg" color="white">
            <H3 mb="sm">Cagnottes Actives</H3>
            <Text fontSize="h1" fontWeight="bold">{stats.pulls.activeCount}</Text>
          </Box>
          <Box bg="#3B5BAB" p="lg" borderRadius="lg" color="white">
            <H3 mb="sm">Total Cagnottes</H3>
            <Text fontSize="h1" fontWeight="bold">{stats.pulls.totalCount}</Text>
          </Box>
        </Box>
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