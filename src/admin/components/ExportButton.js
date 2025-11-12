/**
 * Composant bouton d'export personnalis pour AdminJS
 */

import React, { useState } from 'react';
import { Button, Box, Text, MessageBox, Loader } from '@adminjs/design-system';

const ExportButton = ({ record, resource, action }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleExport = async (format) => {
    setLoading(true);
    setError(null);

    try {
      // Map resource names to API endpoints
      const resourceMap = {
        'users': 'export-users',
        'pulls': 'export-pulls',
        'transactions': 'export-transactions',
        'contributions': 'export-contributions'
      };

      const endpoint = resourceMap[resource.id] || `exports/${resource.id}`;
      const url = `/admin/api/exports/${resource.id}?format=${format}`;

      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${resource.id}_${format}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Alternative: use fetch for better error handling
      // const response = await fetch(url);
      // if (!response.ok) {
      //   throw new Error(`Erreur HTTP: ${response.status}`);
      // }
      // const blob = await response.blob();
      // const downloadUrl = window.URL.createObjectURL(blob);
      // const link = document.createElement('a');
      // link.href = downloadUrl;
      // link.download = `${resource.id}_${format}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      // document.body.appendChild(link);
      // link.click();
      // document.body.removeChild(link);
      // window.URL.revokeObjectURL(downloadUrl);

    } catch (err) {
      console.error('Erreur lors de l\'export:', err);
      setError(`Erreur lors de l'export: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return React.createElement(Box, { p: "md" }, [
    React.createElement(Text, { variant: "lg", mb: "md", key: "title" }, "Exporter les donnes"),
    error && React.createElement(MessageBox, {
      message: error,
      variant: "error",
      mb: "md",
      key: "error"
    }),
    React.createElement(Box, { display: "flex", gap: "sm", alignItems: "center", key: "buttons" }, [
      React.createElement(Button, {
        variant: "contained",
        color: "primary",
        onClick: () => handleExport('csv'),
        disabled: loading,
        key: "csv"
      }, loading ? React.createElement(Loader, { size: "sm" }) : 'Exporter en CSV'),
      React.createElement(Button, {
        variant: "contained",
        color: "secondary",
        onClick: () => handleExport('excel'),
        disabled: loading,
        key: "excel"
      }, loading ? React.createElement(Loader, { size: "sm" }) : 'Exporter en Excel')
    ])
  ]);
};

export default ExportButton;
