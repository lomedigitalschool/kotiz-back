import React, { useEffect, useState } from 'react';
import { Box, H1, H2, Text, Table, TableHead, TableBody, TableRow, TableCell, Button, Input, Select, Badge } from '@adminjs/design-system';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 50
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 50
  });
  const [stats, setStats] = useState({
    totalLogs: 0,
    todayLogs: 0,
    actionsByType: {},
    recentActivity: []
  });

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`/api/v1/admin/activity-logs?${queryParams}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.data || []);
        setPagination(data.pagination || pagination);
      }
    } catch (error) {
      console.error('Erreur chargement logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v1/admin/activity-stats?days=30', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data || stats);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'USER_CREATED': return '👤';
      case 'USER_BLOCKED': return '🚫';
      case 'USER_UNBLOCKED': return '✅';
      case 'PULL_CREATED': return '🎯';
      case 'PULL_VALIDATED': return '✅';
      case 'CONTRIBUTION_MADE': return '💰';
      case 'KYC_SUBMITTED': return '🆔';
      case 'KYC_VALIDATED': return '✅';
      case 'KYC_REJECTED': return '❌';
      case 'ADMIN_LOGIN': return '🔐';
      case 'DATA_EXPORTED': return '📤';
      case 'REPORT_CREATED': return '🚨';
      case 'WITHDRAWAL_PROCESSED': return '💸';
      default: return '📝';
    }
  };

  const getActionColor = (action) => {
    if (action.includes('CREATED') || action.includes('VALIDATED') || action.includes('SUCCESS')) return 'success';
    if (action.includes('BLOCKED') || action.includes('REJECTED') || action.includes('FAILED')) return 'danger';
    if (action.includes('LOGIN') || action.includes('EXPORTED')) return 'info';
    return 'secondary';
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const exportLogs = async (format) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`/api/v1/admin/export/logs/${format}?${queryParams}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs_admin_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erreur export logs:', error);
    }
  };

  if (loading) {
    return (
      <Box p="xl">
        <Text>Chargement des logs d'activité...</Text>
      </Box>
    );
  }

  return (
    <Box p="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="lg">
        <H1>📋 Logs d'Activité Admin</H1>
        <Box display="flex" gap="md">
          <Button variant="secondary" onClick={() => exportLogs('csv')}>
            📊 Export CSV
          </Button>
          <Button variant="secondary" onClick={() => exportLogs('excel')}>
            📈 Export Excel
          </Button>
          <Button variant="secondary" onClick={fetchLogs}>
            🔄 Actualiser
          </Button>
        </Box>
      </Box>

      {/* Statistiques générales */}
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap="lg" mb="lg">
        <Box bg="#4CA260" p="md" borderRadius="lg" color="white">
          <Text fontSize="sm">Total Logs (30j)</Text>
          <Text fontSize="h2" fontWeight="bold">{stats.totalLogs}</Text>
        </Box>
        <Box bg="#3B5BAB" p="md" borderRadius="lg" color="white">
          <Text fontSize="sm">Aujourd'hui</Text>
          <Text fontSize="h2" fontWeight="bold">{stats.todayLogs}</Text>
        </Box>
        <Box bg="#FF9800" p="md" borderRadius="lg" color="white">
          <Text fontSize="sm">Actions différentes</Text>
          <Text fontSize="h2" fontWeight="bold">{Object.keys(stats.actionsByType).length}</Text>
        </Box>
        <Box bg="#F44336" p="md" borderRadius="lg" color="white">
          <Text fontSize="sm">Actions sensibles</Text>
          <Text fontSize="h2" fontWeight="bold">
            {(stats.actionsByType.USER_BLOCKED || 0) + (stats.actionsByType.KYC_REJECTED || 0)}
          </Text>
        </Box>
      </Box>

      {/* Répartition des actions */}
      <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20" mb="lg">
        <H2 mb="md" style={{ color: '#4CA260' }}>📊 Répartition des actions (30 derniers jours)</H2>
        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap="md">
          {Object.entries(stats.actionsByType).map(([action, count]) => (
            <Box key={action} textAlign="center" p="md" bg="grey0" borderRadius="md">
              <Text fontSize="sm" color="grey60">{action.replace(/_/g, ' ')}</Text>
              <Text fontSize="h4" fontWeight="bold" color={getActionColor(action)} mt="sm">
                {count}
              </Text>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Filtres */}
      <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20" mb="lg">
        <H2 mb="md" style={{ color: '#4CA260' }}>🔍 Filtres</H2>
        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap="md">
          <Box>
            <Text fontWeight="bold" mb="sm">Action</Text>
            <Select
              value={filters.action}
              onChange={(value) => handleFilterChange('action', value)}
              options={[
                { value: '', label: 'Toutes les actions' },
                { value: 'USER_CREATED', label: 'Utilisateur créé' },
                { value: 'USER_BLOCKED', label: 'Utilisateur bloqué' },
                { value: 'PULL_CREATED', label: 'Cagnotte créée' },
                { value: 'CONTRIBUTION_MADE', label: 'Contribution faite' },
                { value: 'KYC_SUBMITTED', label: 'KYC soumis' },
                { value: 'ADMIN_LOGIN', label: 'Connexion admin' }
              ]}
            />
          </Box>
          <Box>
            <Text fontWeight="bold" mb="sm">ID Utilisateur</Text>
            <Input
              type="text"
              placeholder="ID utilisateur..."
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
            />
          </Box>
          <Box>
            <Text fontWeight="bold" mb="sm">Date début</Text>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </Box>
          <Box>
            <Text fontWeight="bold" mb="sm">Date fin</Text>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </Box>
          <Box>
            <Text fontWeight="bold" mb="sm">Éléments par page</Text>
            <Select
              value={filters.limit.toString()}
              onChange={(value) => handleFilterChange('limit', parseInt(value))}
              options={[
                { value: '25', label: '25' },
                { value: '50', label: '50' },
                { value: '100', label: '100' }
              ]}
            />
          </Box>
        </Box>
      </Box>

      {/* Table des logs */}
      <Box bg="white" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell fontWeight="bold">Action</TableCell>
              <TableCell fontWeight="bold">Détails</TableCell>
              <TableCell fontWeight="bold">Utilisateur</TableCell>
              <TableCell fontWeight="bold">IP</TableCell>
              <TableCell fontWeight="bold">Date/Heure</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap="sm">
                    <Text fontSize="lg">{getActionIcon(log.action)}</Text>
                    <Box>
                      <Text fontWeight="bold">{log.action.replace(/_/g, ' ')}</Text>
                      <Badge variant={getActionColor(log.action)} size="sm" ml="sm">
                        {log.action}
                      </Badge>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Text style={{ maxWidth: '300px', wordWrap: 'break-word' }}>
                    {log.details || 'Aucun détail'}
                  </Text>
                </TableCell>
                <TableCell>
                  {log.userId ? (
                    <Box>
                      <Text fontWeight="bold">ID: {log.userId}</Text>
                      {log.user && (
                        <Text fontSize="sm" color="grey60">{log.user.name || log.user.email}</Text>
                      )}
                    </Box>
                  ) : (
                    <Text color="grey60">Système</Text>
                  )}
                </TableCell>
                <TableCell>
                  <code style={{ fontSize: '0.9em' }}>{log.ipAddress || 'N/A'}</code>
                </TableCell>
                <TableCell>
                  <Text fontSize="sm">
                    {formatDateTime(log.createdAt)}
                  </Text>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {/* Pagination */}
      <Box display="flex" justifyContent="center" alignItems="center" gap="md" mt="lg">
        <Button
          variant="outlined"
          disabled={pagination.currentPage === 1}
          onClick={() => handlePageChange(pagination.currentPage - 1)}
        >
          Précédent
        </Button>
        <Text>
          Page {pagination.currentPage} sur {pagination.totalPages}
          ({pagination.totalItems} éléments)
        </Text>
        <Button
          variant="outlined"
          disabled={pagination.currentPage === pagination.totalPages}
          onClick={() => handlePageChange(pagination.currentPage + 1)}
        >
          Suivant
        </Button>
      </Box>

      {/* Informations sur les logs */}
      <Box mt="xl" p="lg" bg="#f8f9fa" borderRadius="lg" border="1px solid" borderColor="#e9ecef">
        <H2 mb="md" style={{ color: '#495057' }}>ℹ️ À propos des logs d'activité</H2>
        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap="md">
          <Box>
            <Text fontWeight="bold" mb="sm">Types d'actions tracées:</Text>
            <Text fontSize="sm">
              • Créations/modifications d'utilisateurs<br/>
              • Actions sur les cagnottes<br/>
              • Contributions et transactions<br/>
              • Vérifications KYC<br/>
              • Connexions administrateur<br/>
              • Exports de données<br/>
              • Signalements et modérations
            </Text>
          </Box>
          <Box>
            <Text fontWeight="bold" mb="sm">Rétention des données:</Text>
            <Text fontSize="sm">
              • Logs conservés 2 ans<br/>
              • Archivage automatique<br/>
              • Export possible pour audit<br/>
              • Conformité RGPD
            </Text>
          </Box>
          <Box>
            <Text fontWeight="bold" mb="sm">Sécurité et audit:</Text>
            <Text fontSize="sm">
              • Traçabilité complète des actions<br/>
              • Adresses IP enregistrées<br/>
              • Horodatage précis<br/>
              • Accès restreint aux admins
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLogs;