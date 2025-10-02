import React, { useEffect, useState } from 'react';
import { Box, H1, Text, Table, TableHead, TableBody, TableRow, TableCell, Button, Input, Label, Section } from '@adminjs/design-system';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [days]);

  const fetchLogs = async () => {
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/v1/admin/activity-logs?limit=100`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.activities || []);
      }
    } catch (error) {
      console.error('Erreur chargement logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/v1/admin/activity-stats?days=${days}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const getActivityDescription = (action, details) => {
    switch (action) {
      case 'USER_CREATED':
        return 'Nouvel utilisateur inscrit';
      case 'PULL_CREATED':
        return 'Nouvelle cagnotte créée';
      case 'CONTRIBUTION_MADE':
        return 'Nouvelle contribution reçue';
      case 'ADMIN_LOGIN':
        return 'Connexion administrateur';
      case 'USER_BLOCKED':
        return 'Utilisateur bloqué';
      case 'USER_UNBLOCKED':
        return 'Utilisateur débloqué';
      case 'PASSWORD_RESET':
        return 'Mot de passe réinitialisé';
      case 'PULL_VALIDATED':
        return 'Cagnotte validée';
      case 'PULL_DELETED':
        return 'Cagnotte supprimée';
      case 'REPORT_HANDLED':
        return 'Signalement traité';
      case 'WITHDRAWAL_PROCESSED':
        return 'Retrait traité';
      case 'DATA_EXPORTED':
        return 'Export de données';
      default:
        return action.replace(/_/g, ' ').toLowerCase();
    }
  };

  if (loading) {
    return (
      <Box p="xl" textAlign="center">
        <Text>⏳ Chargement des logs d'activité...</Text>
      </Box>
    );
  }

  return (
    <Box p="xl">
      <H1>📋 Logs d'Activité Admin</H1>
      <Text mt="lg" mb="xl">
        Historique complet des actions sur la plateforme Kotiz.
      </Text>

      {/* Statistiques */}
      {stats && (
        <Section mb="xl">
          <H1 variant="h2">📊 Statistiques d'Activité ({days} jours)</H1>
          <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap="lg" mt="lg">
            <Box p="lg" bg="white" borderRadius="md" boxShadow="card">
              <Text fontWeight="bold" color="primary">Connexions Admin</Text>
              <Text fontSize="h1" color="grey100">{stats.adminLogins || 0}</Text>
            </Box>
            <Box p="lg" bg="white" borderRadius="md" boxShadow="card">
              <Text fontWeight="bold" color="success">Utilisateurs créés</Text>
              <Text fontSize="h1" color="grey100">{stats.usersCreated || 0}</Text>
            </Box>
            <Box p="lg" bg="white" borderRadius="md" boxShadow="card">
              <Text fontWeight="bold" color="info">Cagnottes créées</Text>
              <Text fontSize="h1" color="grey100">{stats.pullsCreated || 0}</Text>
            </Box>
            <Box p="lg" bg="white" borderRadius="md" boxShadow="card">
              <Text fontWeight="bold" color="warning">Contributions</Text>
              <Text fontSize="h1" color="grey100">{stats.contributionsMade || 0}</Text>
            </Box>
          </Box>

          <Box mt="lg">
            <Label htmlFor="days">Période (jours)</Label>
            <Input
              id="days"
              type="number"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value) || 30)}
              width="100px"
              mr="lg"
            />
            <Button variant="outlined" onClick={fetchStats}>
              Actualiser
            </Button>
          </Box>
        </Section>
      )}

      {/* Logs détaillés */}
      <Section>
        <H1 variant="h2">📝 Historique des Actions</H1>
        <Text mt="sm" mb="lg" color="grey60">
          Dernières 100 actions enregistrées sur la plateforme.
        </Text>

        {logs.length > 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell fontWeight="bold">Utilisateur</TableCell>
                <TableCell fontWeight="bold">Action</TableCell>
                <TableCell fontWeight="bold">Description</TableCell>
                <TableCell fontWeight="bold">Date & Heure</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {log.user ? `${log.user.name} (${log.user.email})` : 'Système'}
                  </TableCell>
                  <TableCell>
                    <Text fontWeight="bold" color={
                      log.action.includes('BLOCKED') ? 'error' :
                      log.action.includes('CREATED') ? 'success' :
                      log.action.includes('LOGIN') ? 'info' : 'grey100'
                    }>
                      {log.action}
                    </Text>
                  </TableCell>
                  <TableCell>{getActivityDescription(log.action, log.details)}</TableCell>
                  <TableCell>{new Date(log.createdAt).toLocaleString('fr-FR')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Text color="grey60" textAlign="center" py="xl">
            Aucun log d'activité disponible
          </Text>
        )}
      </Section>
    </Box>
  );
};

export default AdminLogs;