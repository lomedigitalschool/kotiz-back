import React, { useEffect, useState } from 'react';
import { Box, H1, Text, Table, TableHead, TableBody, TableRow, TableCell } from '@adminjs/design-system';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/v1/admin/logs`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Erreur chargement logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box p="xl" textAlign="center">
        <Text>⏳ Chargement des logs...</Text>
      </Box>
    );
  }

  return (
    <Box p="xl">
      <H1>📋 Logs d'Activité Admin</H1>
      <Text mt="lg" mb="xl">
        Historique des actions administratives sur la plateforme.
      </Text>

      {logs.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell fontWeight="bold">Action</TableCell>
              <TableCell fontWeight="bold">Détails</TableCell>
              <TableCell fontWeight="bold">Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log, index) => (
              <TableRow key={index}>
                <TableCell>{log.action}</TableCell>
                <TableCell>
                  {log.details
                    ? (typeof log.details === 'object'
                       ? JSON.stringify(log.details)
                       : String(log.details))
                    : 'N/A'}
                </TableCell>
                <TableCell>{new Date(log.createdAt).toLocaleString('fr-FR')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Text color="grey60" textAlign="center" py="xl">
          Aucun log disponible
        </Text>
      )}
    </Box>
  );
};

export default AdminLogs;