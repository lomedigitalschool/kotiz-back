import React from "react";

const SimpleExport = () => {
  const handleExport = (type, format = 'csv') => {
    window.open(`/api/v1/admin/export/${type}?format=${format}`, "_blank");
  };

  return React.createElement('div', {
    style: {
      padding: '2rem',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }
  },
    React.createElement('h1', {
      style: { color: '#4CA260', marginBottom: '1rem' }
    }, '📊 Export des Données'),

    React.createElement('p', {
      style: { marginBottom: '2rem', color: '#666' }
    }, 'Exportez vos données KOTIZ dans différents formats pour analyse ou archivage.'),

    React.createElement('div', null,
      // Utilisateurs
      React.createElement('h2', {
        style: { color: '#4CA260', marginBottom: '1rem' }
      }, '👥 Utilisateurs'),
      React.createElement('div', {
        style: { marginBottom: '2rem' }
      },
        React.createElement('button', {
          onClick: () => handleExport("users", "csv"),
          style: {
            backgroundColor: '#4CA260',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: 'pointer',
            marginRight: '1rem'
          }
        }, '📄 CSV'),
        React.createElement('button', {
          onClick: () => handleExport("users", "xlsx"),
          style: {
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: 'pointer'
          }
        }, '📊 Excel')
      ),

      // Cagnottes
      React.createElement('h2', {
        style: { color: '#4CA260', marginBottom: '1rem' }
      }, '🎯 Cagnottes'),
      React.createElement('div', {
        style: { marginBottom: '2rem' }
      },
        React.createElement('button', {
          onClick: () => handleExport("pulls", "csv"),
          style: {
            backgroundColor: '#4CA260',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: 'pointer',
            marginRight: '1rem'
          }
        }, '📄 CSV'),
        React.createElement('button', {
          onClick: () => handleExport("pulls", "xlsx"),
          style: {
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: 'pointer'
          }
        }, '📊 Excel')
      ),

      // Contributions
      React.createElement('h2', {
        style: { color: '#4CA260', marginBottom: '1rem' }
      }, '💰 Contributions'),
      React.createElement('div', {
        style: { marginBottom: '2rem' }
      },
        React.createElement('button', {
          onClick: () => handleExport("contributions", "csv"),
          style: {
            backgroundColor: '#4CA260',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: 'pointer',
            marginRight: '1rem'
          }
        }, '📄 CSV'),
        React.createElement('button', {
          onClick: () => handleExport("contributions", "xlsx"),
          style: {
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: 'pointer'
          }
        }, '📊 Excel')
      ),

      // Transactions
      React.createElement('h2', {
        style: { color: '#4CA260', marginBottom: '1rem' }
      }, '🔄 Transactions'),
      React.createElement('div', {
        style: { marginBottom: '2rem' }
      },
        React.createElement('button', {
          onClick: () => handleExport("transactions", "csv"),
          style: {
            backgroundColor: '#4CA260',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: 'pointer',
            marginRight: '1rem'
          }
        }, '📄 CSV'),
        React.createElement('button', {
          onClick: () => handleExport("transactions", "xlsx"),
          style: {
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: 'pointer'
          }
        }, '📊 Excel')
      ),

      // Logs
      React.createElement('h2', {
        style: { color: '#4CA260', marginBottom: '1rem' }
      }, '📋 Logs d\'activité'),
      React.createElement('div', {
        style: { marginBottom: '2rem' }
      },
        React.createElement('button', {
          onClick: () => handleExport("logs", "csv"),
          style: {
            backgroundColor: '#4CA260',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: 'pointer',
            marginRight: '1rem'
          }
        }, '📄 CSV'),
        React.createElement('button', {
          onClick: () => handleExport("logs", "xlsx"),
          style: {
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: 'pointer'
          }
        }, '📊 Excel')
      )
    ),

    React.createElement('div', {
      style: {
        backgroundColor: '#e3f2fd',
        padding: '1rem',
        borderRadius: '8px',
        border: '1px solid #2196F3',
        marginTop: '2rem'
      }
    },
      React.createElement('p', {
        style: { margin: 0, color: '#1565c0' }
      },
        React.createElement('strong', null, '💡 Conseil :'),
        ' Les exports peuvent prendre quelques instants selon la taille des données. Utilisez les filtres dans les listes pour exporter uniquement les données souhaitées.'
      )
    )
  );
};

export default SimpleExport;