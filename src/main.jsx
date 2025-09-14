/**
 * Exemple d'intégration du AuthProvider dans l'application Kotiz
 *
 * Ce fichier montre comment envelopper l'application avec AuthProvider
 * pour bénéficier de l'authentification Firebase globale.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './index.css';

// Exemples de composants (à adapter selon votre structure)
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import PhoneLogin from './components/auth/PhoneLogin';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import Dashboard from './components/Dashboard';
import VerifyEmail from './components/VerifyEmail'; // Composant à créer pour la vérification d'email

// Composant protégé par exemple
const ProtectedRoute = ({ children }) => {
  const { user, loading, canAccessProtectedRoutes } = useAuth();

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!user) {
    return <Login />;
  }

  if (!canAccessProtectedRoutes()) {
    return <VerifyEmail />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Routes publiques */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/phone-login" element={<PhoneLogin />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* Routes protégées */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Route par défaut */}
            <Route path="/" element={<Login />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);