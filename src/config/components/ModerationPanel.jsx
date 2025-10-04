import React, { useEffect, useState } from 'react';
import { Box, H1, H2, H3, Text, Table, TableHead, TableBody, TableRow, TableCell, Button, Select, Badge, Input, Textarea } from '@adminjs/design-system';

const ModerationPanel = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'pending',
    type: '',
    page: 1,
    limit: 25
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 25
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const [moderationAction, setModerationAction] = useState({
    action: '',
    reason: '',
    adminNote: ''
  });
  const [stats, setStats] = useState({
    pending: 0,
    resolved: 0,
    dismissed: 0,
    total: 0
  });

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [filters]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`/api/v1/admin/reports?${queryParams}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.data || []);
        setPagination(data.pagination || pagination);
      }
    } catch (error) {
      console.error('Erreur chargement signalements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v1/admin/reports/stats', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Erreur chargement stats modération:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleReportAction = async (reportId, action) => {
    if (!moderationAction.reason.trim()) {
      alert('Veuillez saisir une raison pour cette action');
      return;
    }

    try {
      const response = await fetch(`/api/v1/admin/reports/${reportId}/moderate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          action,
          reason: moderationAction.reason,
          adminNote: moderationAction.adminNote
        })
      });

      if (response.ok) {
        alert(`Signalement ${action === 'resolve' ? 'résolu' : 'rejeté'} avec succès`);
        setSelectedReport(null);
        setModerationAction({ action: '', reason: '', adminNote: '' });
        fetchReports();
        fetchStats();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.message || 'Action échouée'}`);
      }
    } catch (error) {
      console.error('Erreur action modération:', error);
      alert('Erreur lors de l\'action de modération');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'En attente', color: 'warning' },
      resolved: { label: 'Résolu', color: 'success' },
      dismissed: { label: 'Rejeté', color: 'danger' }
    };

    const config = statusConfig[status] || { label: status, color: 'grey' };
    return <Badge variant={config.color}>{config.label}</Badge>;
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      pull: { label: 'Cagnotte', color: 'primary' },
      contribution: { label: 'Contribution', color: 'info' },
      user: { label: 'Utilisateur', color: 'secondary' }
    };

    const config = typeConfig[type] || { label: type, color: 'grey' };
    return <Badge variant={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box p="xl">
        <Text>Chargement du panel de modération...</Text>
      </Box>
    );
  }

  return (
    <Box p="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="lg">
        <H1>🛡️ Panel de Modération</H1>
        <Button variant="secondary" onClick={() => { fetchReports(); fetchStats(); }}>
          🔄 Actualiser
        </Button>
      </Box>

      {/* Statistiques générales */}
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap="lg" mb="xl">
        <Box bg="#FF9800" p="md" borderRadius="lg" color="white">
          <Text fontSize="sm">En attente</Text>
          <Text fontSize="h2" fontWeight="bold">{stats.pending}</Text>
        </Box>
        <Box bg="#4CA260" p="md" borderRadius="lg" color="white">
          <Text fontSize="sm">Résolus</Text>
          <Text fontSize="h2" fontWeight="bold">{stats.resolved}</Text>
        </Box>
        <Box bg="#F44336" p="md" borderRadius="lg" color="white">
          <Text fontSize="sm">Rejetés</Text>
          <Text fontSize="h2" fontWeight="bold">{stats.dismissed}</Text>
        </Box>
        <Box bg="#3B5BAB" p="md" borderRadius="lg" color="white">
          <Text fontSize="sm">Total</Text>
          <Text fontSize="h2" fontWeight="bold">{stats.total}</Text>
        </Box>
      </Box>

      {/* Filtres */}
      <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20" mb="lg">
        <H2 mb="md" style={{ color: '#4CA260' }}>🔍 Filtres</H2>
        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap="md">
          <Box>
            <Text fontWeight="bold" mb="sm">Statut</Text>
            <Select
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              options={[
                { value: '', label: 'Tous les statuts' },
                { value: 'pending', label: 'En attente' },
                { value: 'resolved', label: 'Résolus' },
                { value: 'dismissed', label: 'Rejetés' }
              ]}
            />
          </Box>
          <Box>
            <Text fontWeight="bold" mb="sm">Type</Text>
            <Select
              value={filters.type}
              onChange={(value) => handleFilterChange('type', value)}
              options={[
                { value: '', label: 'Tous les types' },
                { value: 'pull', label: 'Cagnottes' },
                { value: 'contribution', label: 'Contributions' },
                { value: 'user', label: 'Utilisateurs' }
              ]}
            />
          </Box>
          <Box>
            <Text fontWeight="bold" mb="sm">Éléments par page</Text>
            <Select
              value={filters.limit.toString()}
              onChange={(value) => handleFilterChange('limit', parseInt(value))}
              options={[
                { value: '10', label: '10' },
                { value: '25', label: '25' },
                { value: '50', label: '50' },
                { value: '100', label: '100' }
              ]}
            />
          </Box>
        </Box>
      </Box>

      {/* Modal d'action de modération */}
      {selectedReport && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="rgba(0,0,0,0.5)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex="1000"
          onClick={() => setSelectedReport(null)}
        >
          <Box
            bg="white"
            p="xl"
            borderRadius="lg"
            boxShadow="card"
            maxWidth="600px"
            width="90%"
            onClick={(e) => e.stopPropagation()}
          >
            <H2 mb="lg">Modérer le signalement #{selectedReport.id}</H2>

            <Box mb="lg">
              <H3 mb="sm">Détails du signalement</H3>
              <Box bg="grey0" p="md" borderRadius="md">
                <Text><strong>Type:</strong> {getTypeBadge(selectedReport.type)}</Text>
                <Text><strong>Description:</strong> {selectedReport.description}</Text>
                <Text><strong>Raison:</strong> {selectedReport.reason}</Text>
                <Text><strong>Date:</strong> {formatDate(selectedReport.createdAt)}</Text>
              </Box>
            </Box>

            <Box mb="lg">
              <H3 mb="sm">Action de modération</H3>
              <Box display="grid" gap="md">
                <Select
                  value={moderationAction.action}
                  onChange={(value) => setModerationAction(prev => ({ ...prev, action: value }))}
                  options={[
                    { value: '', label: 'Choisir une action' },
                    { value: 'resolve', label: '✅ Résoudre le signalement' },
                    { value: 'dismiss', label: '❌ Rejeter le signalement' }
                  ]}
                />

                <Box>
                  <Text fontWeight="bold" mb="sm">Raison de la décision *</Text>
                  <Textarea
                    value={moderationAction.reason}
                    onChange={(e) => setModerationAction(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Expliquez votre décision..."
                    rows={3}
                  />
                </Box>

                <Box>
                  <Text fontWeight="bold" mb="sm">Note administrative (optionnel)</Text>
                  <Textarea
                    value={moderationAction.adminNote}
                    onChange={(e) => setModerationAction(prev => ({ ...prev, adminNote: e.target.value }))}
                    placeholder="Note interne pour les administrateurs..."
                    rows={2}
                  />
                </Box>
              </Box>
            </Box>

            <Box display="flex" gap="md" justifyContent="flex-end">
              <Button variant="outlined" onClick={() => setSelectedReport(null)}>
                Annuler
              </Button>
              <Button
                variant={moderationAction.action === 'resolve' ? 'success' : 'danger'}
                onClick={() => handleReportAction(selectedReport.id, moderationAction.action)}
                disabled={!moderationAction.action || !moderationAction.reason.trim()}
              >
                {moderationAction.action === 'resolve' ? '✅ Résoudre' : '❌ Rejeter'}
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Table des signalements */}
      <Box bg="white" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell fontWeight="bold">ID</TableCell>
              <TableCell fontWeight="bold">Type</TableCell>
              <TableCell fontWeight="bold">Signalé par</TableCell>
              <TableCell fontWeight="bold">Raison</TableCell>
              <TableCell fontWeight="bold">Statut</TableCell>
              <TableCell fontWeight="bold">Date</TableCell>
              <TableCell fontWeight="bold">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>#{report.id}</TableCell>
                <TableCell>{getTypeBadge(report.type)}</TableCell>
                <TableCell>
                  {report.reporter?.name || 'Anonyme'}
                  {report.reporter?.email && (
                    <Text fontSize="sm" color="grey60">({report.reporter.email})</Text>
                  )}
                </TableCell>
                <TableCell>
                  <Text style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {report.reason}
                  </Text>
                </TableCell>
                <TableCell>{getStatusBadge(report.status)}</TableCell>
                <TableCell>{formatDate(report.createdAt)}</TableCell>
                <TableCell>
                  {report.status === 'pending' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedReport(report)}
                    >
                      Modérer
                    </Button>
                  )}
                  {report.status !== 'pending' && (
                    <Box>
                      <Text fontSize="sm" color="grey60">
                        {report.status === 'resolved' ? 'Résolu' : 'Rejeté'}
                      </Text>
                      {report.resolvedAt && (
                        <Text fontSize="xs" color="grey40">
                          {formatDate(report.resolvedAt)}
                        </Text>
                      )}
                    </Box>
                  )}
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

      {/* Informations sur la modération */}
      <Box mt="xl" p="lg" bg="#f8f9fa" borderRadius="lg" border="1px solid" borderColor="#e9ecef">
        <H2 mb="md" style={{ color: '#495057' }}>ℹ️ Guide de modération</H2>
        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap="md">
          <Box>
            <Text fontWeight="bold" mb="sm">Processus de modération:</Text>
            <Text fontSize="sm">
              1. Examiner le signalement et son contexte<br/>
              2. Vérifier les éléments signalés<br/>
              3. Prendre une décision justifiée<br/>
              4. Documenter l'action et la raison<br/>
              5. Suivre l'évolution si nécessaire
            </Text>
          </Box>
          <Box>
            <Text fontWeight="bold" mb="sm">Types de signalements:</Text>
            <Text fontSize="sm">
              • <strong>Cagnottes:</strong> Contenu inapproprié, fraude<br/>
              • <strong>Contributions:</strong> Soupçons d'arnaque<br/>
              • <strong>Utilisateurs:</strong> Comportement abusif<br/>
              • <strong>Autres:</strong> Violations des CGU
            </Text>
          </Box>
          <Box>
            <Text fontWeight="bold" mb="sm">Actions possibles:</Text>
            <Text fontSize="sm">
              • <strong>Résoudre:</strong> Signalement justifié, action prise<br/>
              • <strong>Rejeter:</strong> Signalement infondé<br/>
              • <strong>Escalader:</strong> Cas complexes nécessitant investigation
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ModerationPanel;