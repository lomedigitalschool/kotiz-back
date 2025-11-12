import React, { useState, useEffect } from 'react';
import { Box, H1, H2, Text, Table, TableRow, TableCell, TableHead, Button } from '@adminjs/design-system';

const SimpleDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activePulls: 0,
    totalAmount: 0,
    recentPulls: [],
    recentTransactions: [],
    pendingKyc: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/v1/adminjs/dashboard-stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
      }
    };
    fetchStats();
    // Rafraîchir toutes les 30 secondes pour mise à jour en temps réel
    const interval = setInterval(fetchStats, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box variant="grey">
      <Box variant="white" style={{ padding: '20px' }}>
        <H1>KOTIZ DASHBOARD ADMIN</H1>

        {/* Statistiques globales */}
        <Box style={{ marginTop: '20px' }}>
          <H2>Statistiques Globales</H2>
          <Box style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
            <Box style={{ flex: 1, padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <Text>Utilisateurs Total</Text>
              <H2>{stats.totalUsers}</H2>
            </Box>
            <Box style={{ flex: 1, padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <Text>Cagnottes Actives</Text>
              <H2>{stats.activePulls}</H2>
            </Box>
            <Box style={{ flex: 1, padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <Text>Montant Total</Text>
              <H2>{stats.totalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</H2>
            </Box>
          </Box>
        </Box>

        {/* Boutons d'exportation */}
        <Box style={{ marginTop: '30px' }}>
          <H2>Exportations des Statistiques</H2>
          <Box style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
            <Button
              variant="primary"
              onClick={() => window.open('/api/v1/export/transactions/csv', '_blank')}
            >
              Exporter Transactions (CSV)
            </Button>
            <Button
              variant="primary"
              onClick={() => window.open('/api/v1/export/transactions/excel', '_blank')}
            >
              Exporter Transactions (Excel)
            </Button>
            <Button
              variant="primary"
              onClick={() => window.open('/api/v1/export/users/csv', '_blank')}
            >
              Exporter Utilisateurs (CSV)
            </Button>
            <Button
              variant="primary"
              onClick={() => window.open('/api/v1/export/users/excel', '_blank')}
            >
              Exporter Utilisateurs (Excel)
            </Button>
            <Button
              variant="primary"
              onClick={() => window.open('/api/v1/export/contributions/csv', '_blank')}
            >
              Exporter Contributions (CSV)
            </Button>
            <Button
              variant="primary"
              onClick={() => window.open('/api/v1/export/contributions/excel', '_blank')}
            >
              Exporter Contributions (Excel)
            </Button>
            <Button
              variant="primary"
              onClick={() => window.open('/api/v1/export/retraits/csv', '_blank')}
            >
              Exporter Retraits (CSV)
            </Button>
            <Button
              variant="primary"
              onClick={() => window.open('/api/v1/export/retraits/excel', '_blank')}
            >
              Exporter Retraits (Excel)
            </Button>
          </Box>
        </Box>

        {/* Dernières cagnottes */}
        <Box style={{ marginTop: '40px' }}>
          <H2>Dernières Cagnottes</H2>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Titre</TableCell>
                <TableCell>Créateur</TableCell>
                <TableCell>Montant</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <tbody>
              {stats.recentPulls?.map((pull) => (
                <TableRow key={pull.id}>
                  <TableCell>{pull.title}</TableCell>
                  <TableCell>{pull.userName}</TableCell>
                  <TableCell>{pull.currentAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</TableCell>
                  <TableCell>{pull.status}</TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </Box>

        {/* Dernières transactions */}
        <Box style={{ marginTop: '40px' }}>
          <H2>Dernières Transactions</H2>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Utilisateur</TableCell>
                <TableCell>Montant</TableCell>
                <TableCell>Type</TableCell>
              </TableRow>
            </TableHead>
            <tbody>
              {stats.recentTransactions?.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{tx.userName}</TableCell>
                  <TableCell>{tx.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</TableCell>
                  <TableCell>{tx.type}</TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </Box>

        {/* KYC en attente */}
        <Box style={{ marginTop: '40px', marginBottom: '20px' }}>
          <H2>KYC en Attente</H2>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Utilisateur</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Date de Soumission</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <tbody>
              {stats.pendingKyc?.map((kyc) => (
                <TableRow key={kyc.id}>
                  <TableCell>{kyc.userName}</TableCell>
                  <TableCell>{kyc.type}</TableCell>
                  <TableCell>{new Date(kyc.submissionDate).toLocaleDateString()}</TableCell>
                  <TableCell>{kyc.status}</TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </Box>
      </Box>
    </Box>
  );
};

export default SimpleDashboard;