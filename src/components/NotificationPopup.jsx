import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

// Animation d'entrée
const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

// Animation de sortie
const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

// Conteneur principal
const NotificationContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 400px;
  width: 100%;
`;

// Popup de notification
const NotificationPopup = styled.div`
  background: ${props => props.type === 'success' ? '#4CAF50' : '#f44336'};
  color: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  animation: ${props => props.isExiting ? slideOut : slideIn} 0.3s ease-out;
  cursor: pointer;

  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
`;

// Icône
const Icon = styled.div`
  font-size: 20px;
  margin-right: 12px;
  display: flex;
  align-items: center;
`;

// Contenu
const Content = styled.div`
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
`;

// Titre
const Title = styled.div`
  font-weight: 600;
  margin-bottom: 4px;
`;

// Message
const Message = styled.div`
  font-size: 13px;
  opacity: 0.9;
`;

// Bouton de fermeture
const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  margin-left: 12px;
  opacity: 0.7;

  &:hover {
    opacity: 1;
  }
`;

// Hook personnalisé pour gérer les notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (type, title, message, duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      type,
      title,
      message,
      duration
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-suppression après la durée
    setTimeout(() => {
      removeNotification(id);
    }, duration);

    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const showSuccess = (title, message, duration) => {
    return addNotification('success', title, message, duration);
  };

  const showError = (title, message, duration) => {
    return addNotification('error', title, message, duration);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError
  };
};

// Composant NotificationManager
const NotificationManager = ({ notifications, onRemove }) => {
  const [exitingNotifications, setExitingNotifications] = useState(new Set());

  const handleClose = (id) => {
    setExitingNotifications(prev => new Set([...prev, id]));

    // Attendre la fin de l'animation avant de supprimer
    setTimeout(() => {
      onRemove(id);
      setExitingNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 300);
  };

  return (
    <NotificationContainer>
      {notifications.map(notification => (
        <NotificationPopup
          key={notification.id}
          type={notification.type}
          isExiting={exitingNotifications.has(notification.id)}
          onClick={() => handleClose(notification.id)}
        >
          <Icon>
            {notification.type === 'success' ? '✓' : '✕'}
          </Icon>
          <Content>
            <Title>{notification.title}</Title>
            <Message>{notification.message}</Message>
          </Content>
          <CloseButton onClick={(e) => {
            e.stopPropagation();
            handleClose(notification.id);
          }}>
            ×
          </CloseButton>
        </NotificationPopup>
      ))}
    </NotificationContainer>
  );
};

// Contexte pour les notifications globales
export const NotificationContext = React.createContext();

// Provider de notifications
export const NotificationProvider = ({ children }) => {
  const notificationLogic = useNotifications();

  return (
    <NotificationContext.Provider value={notificationLogic}>
      {children}
      <NotificationManager
        notifications={notificationLogic.notifications}
        onRemove={notificationLogic.removeNotification}
      />
    </NotificationContext.Provider>
  );
};

// Hook pour utiliser le contexte
export const useNotificationContext = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext doit être utilisé dans un NotificationProvider');
  }
  return context;
};

export default NotificationManager;