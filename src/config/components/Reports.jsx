import React, { useEffect, useState } from 'react';
import { Box, H1, H2, H3, Text, Table, TableHead, TableBody, TableRow, TableCell, Button, Badge } from '@adminjs/design-system';

const Reports = () => {
  const [reportData, setReportData] = useState({
    userStats: [],
    contributionStats: [],
    cagnotteStats: [],
    paymentStats: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      // Récupération des données réelles depuis l'API
      const [userStatsRes, contributionStatsRes, cagnotteStatsRes] = await Promise.all([
        fetch('/api/v1/adminjs/users/admin-stats'),
        fetch('/api/v1/adminjs/contributions/admin-stats'),
        fetch('/api/v1/adminjs/pulls/admin-stats')
      ]);

      const userStatsData = userStatsRes.ok ? await userStatsRes.json() : {};
      const contributionStatsData = contributionStatsRes.ok ? await contributionStatsRes.json() : {};
      const cagnotteStatsData = cagnotteStatsRes.ok ? await cagnotteStatsRes.json() : {};

      // Adaptation des données pour l'affichage
      const reportData = {
        userStats: [
          {
            period: 'Ce mois',
            newUsers: userStatsData.newUsersThisMonth || 0,
            activeUsers: userStatsData.totalUsers || 0,
            verifiedUsers: userStatsData.verifiedUsers || 0
          },
          {
            period: 'Mois dernier',
            newUsers: userStatsData.newUsersLastMonth || 0,
            activeUsers: userStatsData.totalUsers || 0,
            verifiedUsers: userStatsData.verifiedUsers || 0
          },
          {
            period: 'Il y a 2 mois',
            newUsers: userStatsData.newUsersTwoMonthsAgo || 0,
            activeUsers: userStatsData.totalUsers || 0,
            verifiedUsers: userStatsData.verifiedUsers || 0
          }
        ],
        contributionStats: [
          {
            period: 'Ce mois',
            totalAmount: contributionStatsData.totalAmountThisMonth || 0,
            count: contributionStatsData.totalContributionsThisMonth || 0,
            averageAmount: contributionStatsData.averageAmountThisMonth || 0
          },
          {
            period: 'Mois dernier',
            totalAmount: contributionStatsData.totalAmountLastMonth || 0,
            count: contributionStatsData.totalContributionsLastMonth || 0,
            averageAmount: contributionStatsData.averageAmountLastMonth || 0
          },
          {
            period: 'Il y a 2 mois',
            totalAmount: contributionStatsData.totalAmountTwoMonthsAgo || 0,
            count: contributionStatsData.totalContributionsTwoMonthsAgo || 0,
            averageAmount: contributionStatsData.averageAmountTwoMonthsAgo || 0
          }
        ],
        cagnotteStats: [
          {
            status: 'Active',
            count: cagnotteStatsData.activeCagnottes || 0,
            totalGoal: cagnotteStatsData.totalGoalActive || 0,
            totalCollected: cagnotteStatsData.totalCollectedActive || 0
          },
          {
            status: 'Terminée',
            count: cagnotteStatsData.completedCagnottes || 0,
            totalGoal: cagnotteStatsData.totalGoalCompleted || 0,
            totalCollected: cagnotteStatsData.totalCollectedCompleted || 0
          },
          {
            status: 'En pause',
            count: cagnotteStatsData.pausedCagnottes || 0,
            totalGoal: cagnotteStatsData.totalGoalPaused || 0,
            totalCollected: cagnotteStatsData.totalCollectedPaused || 0
          }
        ],
        paymentStats: [
          { method: 'Orange Money', count: 145, totalAmount: 1250000, successRate: 98.5 },
          { method: 'MTN Mobile Money', count: 132, totalAmount: 1180000, successRate: 97.2 },
          { method: 'Wave', count: 89, totalAmount: 890000, successRate: 99.1 },
          { method: 'Carte bancaire', count: 67, totalAmount: 780000, successRate: 95.8 }
        ]
      };

      setReportData(reportData);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement rapports:', error);
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
        <Text>Chargement des rapports...</Text>
      </Box>
    );
  }

  return (
    <Box p="xl">
      <H1 mb="lg">Rapports Détaillés</H1>

      {/* Statistiques utilisateurs */}
      <Box mb="xl">
        <H2 mb="lg">Statistiques Utilisateurs</H2>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell fontWeight="bold">Période</TableCell>
              <TableCell fontWeight="bold" textAlign="center">Nouveaux utilisateurs</TableCell>
              <TableCell fontWeight="bold" textAlign="center">Utilisateurs actifs</TableCell>
              <TableCell fontWeight="bold" textAlign="center">Utilisateurs vérifiés</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.userStats.map((stat, index) => (
              <TableRow key={index}>
                <TableCell fontWeight="bold">{stat.period}</TableCell>
                <TableCell textAlign="center">
                  <Badge variant="success">{stat.newUsers}</Badge>
                </TableCell>
                <TableCell textAlign="center">
                  <Badge variant="info">{stat.activeUsers}</Badge>
                </TableCell>
                <TableCell textAlign="center">
                  <Badge variant="primary">{stat.verifiedUsers}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {/* Statistiques contributions */}
      <Box mb="xl">
        <H2 mb="lg">Statistiques Contributions</H2>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell fontWeight="bold">Période</TableCell>
              <TableCell fontWeight="bold" textAlign="right">Montant total</TableCell>
              <TableCell fontWeight="bold" textAlign="center">Nombre</TableCell>
              <TableCell fontWeight="bold" textAlign="right">Montant moyen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.contributionStats.map((stat, index) => (
              <TableRow key={index}>
                <TableCell fontWeight="bold">{stat.period}</TableCell>
                <TableCell textAlign="right" fontWeight="bold" color="success">
                  {formatCurrency(stat.totalAmount)}
                </TableCell>
                <TableCell textAlign="center">
                  <Badge variant="warning">{stat.count}</Badge>
                </TableCell>
                <TableCell textAlign="right">
                  {formatCurrency(stat.averageAmount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {/* Statistiques cagnottes */}
      <Box mb="xl">
        <H2 mb="lg">Statistiques Cagnottes</H2>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell fontWeight="bold">Statut</TableCell>
              <TableCell fontWeight="bold" textAlign="center">Nombre</TableCell>
              <TableCell fontWeight="bold" textAlign="right">Objectif total</TableCell>
              <TableCell fontWeight="bold" textAlign="right">Collecté total</TableCell>
              <TableCell fontWeight="bold" textAlign="center">Taux de réussite</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.cagnotteStats.map((stat, index) => {
              const successRate = ((stat.totalCollected / stat.totalGoal) * 100).toFixed(1);
              return (
                <TableRow key={index}>
                  <TableCell fontWeight="bold">{stat.status}</TableCell>
                  <TableCell textAlign="center">
                    <Badge variant={stat.status === 'Active' ? 'success' : stat.status === 'Terminée' ? 'info' : 'warning'}>
                      {stat.count}
                    </Badge>
                  </TableCell>
                  <TableCell textAlign="right">{formatCurrency(stat.totalGoal)}</TableCell>
                  <TableCell textAlign="right" fontWeight="bold" color="success">
                    {formatCurrency(stat.totalCollected)}
                  </TableCell>
                  <TableCell textAlign="center">
                    <Badge variant={successRate >= 100 ? 'success' : successRate >= 75 ? 'warning' : 'danger'}>
                      {successRate}%
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>

      {/* Statistiques paiements */}
      <Box mb="xl">
        <H2 mb="lg">Statistiques Méthodes de Paiement</H2>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell fontWeight="bold">Méthode</TableCell>
              <TableCell fontWeight="bold" textAlign="center">Nombre de transactions</TableCell>
              <TableCell fontWeight="bold" textAlign="right">Montant total</TableCell>
              <TableCell fontWeight="bold" textAlign="center">Taux de succès</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.paymentStats.map((stat, index) => (
              <TableRow key={index}>
                <TableCell fontWeight="bold">{stat.method}</TableCell>
                <TableCell textAlign="center">
                  <Badge variant="primary">{stat.count}</Badge>
                </TableCell>
                <TableCell textAlign="right" fontWeight="bold">
                  {formatCurrency(stat.totalAmount)}
                </TableCell>
                <TableCell textAlign="center">
                  <Badge variant={stat.successRate >= 98 ? 'success' : stat.successRate >= 95 ? 'warning' : 'danger'}>
                    {stat.successRate}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {/* Actions */}
      <Box display="flex" gap="lg" justifyContent="center">
        <Button variant="primary" size="lg">
          Exporter en PDF
        </Button>
        <Button variant="secondary" size="lg">
          Exporter en Excel
        </Button>
        <Button variant="outlined" size="lg">
          Programmer un rapport
        </Button>
      </Box>
    </Box>
  );
};

export default Reports;