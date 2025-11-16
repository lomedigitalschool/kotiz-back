/**
 * Composant personnalisé pour le formulaire de login AdminJS avec visibilité du mot de passe
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Form,
  FormGroup,
  Input,
  Label,
  Text,
  Icon,
  H1,
} from '@adminjs/design-system';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        window.location.href = '/admin';
      } else {
        const data = await response.json();
        setError(data.message || 'Erreur de connexion');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return React.createElement(Box, {
    p: "xl",
    bg: "white",
    borderRadius: "lg",
    boxShadow: "lg",
    maxWidth: "400px",
    mx: "auto",
    mt: "xl",
    style: { borderTop: '4px solid #1e40af' },
    key: "login-form"
  }, [
    // Zone de bienvenue personnalisée
    React.createElement(Box, { textAlign: "center", mb: "xl", key: "welcome" }, [
      React.createElement(H1, { color: "primary100", key: "title" }, "Welcome to KOTIZ Admin Panel"),
      React.createElement(Text, { color: "grey60", mt: "sm", key: "subtitle" }, "Manage all your platform data easily and securely in one place.")
    ]),

    // Logo et titre
    React.createElement(Box, { textAlign: "center", mb: "xl", key: "logo-section" }, [
      React.createElement(Box, { display: "flex", alignItems: "center", justifyContent: "center", gap: "md", key: "logo-container" }, [
        React.createElement("img", {
          src: "/assets/admin/logo_horizontale.png",
          alt: "KOTIZ Logo",
          style: { maxWidth: '100px', height: 'auto' },
          key: "logo"
        }),
        React.createElement(H1, { color: "primary100", style: { margin: 0 }, key: "admin-title" }, "ADMIN")
      ])
    ]),

    // Formulaire
    React.createElement(Form, { onSubmit: handleSubmit, key: "form" }, [
      error && React.createElement(Box, {
        mb: "lg",
        p: "md",
        bg: "error20",
        borderRadius: "default",
        border: "1px solid",
        borderColor: "error100",
        key: "error-box"
      }, [
        React.createElement(Text, { color: "error100", key: "error-text" }, error)
      ]),

      React.createElement(FormGroup, { mb: "lg", key: "email-group" }, [
        React.createElement(Label, { htmlFor: "email", key: "email-label" }, "Email"),
        React.createElement(Input, {
          id: "email",
          type: "email",
          value: email,
          onChange: (e) => setEmail(e.target.value),
          placeholder: "admin@kotiz.com",
          required: true,
          disabled: loading,
          key: "email-input"
        })
      ]),

      React.createElement(FormGroup, { mb: "xl", key: "password-group" }, [
        React.createElement(Label, { htmlFor: "password", key: "password-label" }, "Password"),
        React.createElement(Box, { position: "relative", key: "password-container" }, [
          React.createElement(Input, {
            id: "password",
            type: showPassword ? 'text' : 'password',
            value: password,
            onChange: (e) => setPassword(e.target.value),
            placeholder: "Your password",
            required: true,
            disabled: loading,
            key: "password-input"
          }),
          React.createElement(Button, {
            type: "button",
            variant: "text",
            size: "sm",
            onClick: () => setShowPassword(!showPassword),
            position: "absolute",
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            p: "sm",
            color: "grey60",
            hoverColor: "grey80",
            key: "toggle-password"
          }, [
            React.createElement(Icon, { icon: showPassword ? 'EyeOff' : 'Eye', size: 16, key: "icon" })
          ])
        ])
      ]),

      React.createElement(Button, {
        type: "submit",
        variant: "contained",
        color: "primary",
        size: "lg",
        fullWidth: true,
        disabled: loading || !email || !password,
        key: "submit-button"
      }, loading ? 'Signing in...' : 'Sign In')
    ])
  ]);
};

export default LoginForm;
