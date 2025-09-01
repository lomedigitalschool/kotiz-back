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
      // Données mockées pour la démonstration
      const mockReportData = {
        userStats: [
          { period: 'Ce mois', newUsers: 45, activeUsers: 234, verifiedUsers: 189 },
          { period: 'Mois dernier', newUsers: 52, activeUsers: 198, verifiedUsers: 176 },
          { period: 'Il y a 2 mois', newUsers: 38, activeUsers: 212, verifiedUsers: 165 }
        ],
        contributionStats: [
          { period: 'Ce mois', totalAmount: 450000, count: 89, averageAmount: 5056 },
          { period: 'Mois dernier', totalAmount: 380000, count: 76, averageAmount: 5000 },
          { period: 'Il y a 2 mois', totalAmount: 420000, count: 84, averageAmount: 5000 }
        ],
        cagnotteStats: [
          { status: 'Active', count: 45, totalGoal: 15000000, totalCollected: 8750000 },
          { status: 'Terminée', count: 23, totalGoal: 8500000, totalCollected: 8500000 },
          { status: 'En pause', count: 8, totalGoal: 3200000, totalCollected: 1200000 }
        ],
        paymentStats: [
          { method: 'Orange Money', count: 145, totalAmount: 1250000, successRate: 98.5 },
          { method: 'MTN Mobile Money', count: 132, totalAmount: 1180000, successRate: 97.2 },
          { method: 'Wave', count: 89, totalAmount: 890000, successRate: 99.1 },
          { method: 'Carte bancaire', count: 67, totalAmount: 780000, successRate: 95.8 }
        ]
      };

      setReportData(mockReportData);
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