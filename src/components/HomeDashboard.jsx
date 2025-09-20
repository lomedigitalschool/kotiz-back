import React, { useEffect, useState } from 'react';
import { Box, H1, H2, H3, Text, Button, Table, TableHead, TableBody, TableRow, TableCell, Card } from '@adminjs/design-system';

const HomeDashboard = () => {
  const [stats, setStats] = useState({
    users: { total: 0, active: 0, verified: 0, newThisMonth: 0 },
    contributions: { totalCollected: 0, monthlyAmount: 0, monthlyCount: 0 },
    pulls: { activeCount: 0, totalCount: 0, topCagnottes: [] }
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
        <Text>Chargement du tableau de bord...</Text>
      </Box>
    );
  }

  return (
    <Box p="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="lg">
        <H1 style={{ color: '#4CA260' }}>🏠 Tableau de Bord Administrateur - KOTIZ</H1>
        <Button variant="primary" onClick={fetchStats}>
          Actualiser
        </Button>
      </Box>

      {/* Métriques principales */}
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap="lg" mb="xl">
        <Card bg="#4CA260" color="white" p="lg" borderRadius="lg">
          <H3 mb="sm">💰 Total Collecté</H3>
          <Text fontSize="h1" fontWeight="bold">
            {formatCurrency(stats.contributions.totalCollected)}
          </Text>
          <Text fontSize="sm">Ce mois: {formatCurrency(stats.contributions.monthlyAmount)}</Text>
        </Card>

        <Card bg="#3B5BAB" color="white" p="lg" borderRadius="lg">
          <H3 mb="sm">👥 Utilisateurs</H3>
          <Text fontSize="h1" fontWeight="bold">{stats.users.total}</Text>
          <Text fontSize="sm">Actifs: {stats.users.active} | Nouveaux ce mois: {stats.users.newThisMonth}</Text>
        </Card>

        <Card bg="#5CAF6E" color="white" p="lg" borderRadius="lg">
          <H3 mb="sm">🎯 Cagnottes</H3>
          <Text fontSize="h1" fontWeight="bold">{stats.pulls.activeCount}</Text>
          <Text fontSize="sm">Actives sur {stats.pulls.totalCount} total</Text>
        </Card>

        <Card bg="#FF9800" color="white" p="lg" borderRadius="lg">
          <H3 mb="sm">📊 Contributions</H3>
          <Text fontSize="h1" fontWeight="bold">{stats.contributions.monthlyCount}</Text>
          <Text fontSize="sm">Ce mois</Text>
        </Card>
      </Box>

      {/* Top Cagnottes */}
      <Box mb="xl">
        <H2 mb="lg" style={{ color: '#4CA260' }}>🏆 Top Cagnottes</H2>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell fontWeight="bold">#</TableCell>
              <TableCell fontWeight="bold">Titre</TableCell>
              <TableCell fontWeight="bold" textAlign="right">Montant Collecté</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stats.pulls.topCagnottes && stats.pulls.topCagnottes.slice(0, 5).map((cagnotte, index) => (
              <TableRow key={cagnotte.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{cagnotte.title}</TableCell>
                <TableCell textAlign="right" fontWeight="bold" style={{ color: '#4CA260' }}>
                  {formatCurrency(cagnotte.totalCollected)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {/* Actions rapides */}
      <Box>
        <H2 mb="lg" style={{ color: '#4CA260' }}>⚡ Actions Rapides</H2>
        <Box display="flex" gap="lg" flexWrap="wrap">
          <Button variant="primary" size="lg" as="a" href="/admin/resources/User">
            👥 Gérer les Utilisateurs
          </Button>
          <Button variant="secondary" size="lg" as="a" href="/admin/resources/Pull">
            🎯 Gérer les Cagnottes
          </Button>
          <Button variant="success" size="lg" as="a" href="/admin/resources/Report">
            🚨 Voir les Signalements
          </Button>
          <Button variant="warning" size="lg" as="a" href="/admin/resources/Log">
            📋 Consulter les Logs
          </Button>
          <Button variant="info" size="lg" as="a" href="/admin/pages/Export%20Donn%C3%A9es">
            📊 Exporter les Données
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default HomeDashboard;