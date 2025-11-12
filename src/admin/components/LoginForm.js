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

  return (
    <Box
      p="xl"
      bg="white"
      borderRadius="lg"
      boxShadow="lg"
      maxWidth="400px"
      mx="auto"
      mt="xl"
      style={{ borderTop: '4px solid #1e40af' }}
    >
      {/* ✅ Zone de bienvenue personnalisée */}
      <Box textAlign="center" mb="xl">
        <H1 color="primary100">Welcome to KOTIZ Admin Panel</H1>
        <Text color="grey60" mt="sm">
          Manage all your platform data easily and securely in one place.
        </Text>
      </Box>

      {/* ✅ Logo et titre */}
      <Box textAlign="center" mb="xl">
        <Box display="flex" alignItems="center" justifyContent="center" gap="md">
          <img
            src="/assets/admin/logo_horizontale.png"
            alt="KOTIZ Logo"
            style={{ maxWidth: '100px', height: 'auto' }}
          />
          <H1 color="primary100" style={{ margin: 0 }}>
            ADMIN
          </H1>
        </Box>
      </Box>

      {/* Formulaire */}
      <Form onSubmit={handleSubmit}>
        {error && (
          <Box
            mb="lg"
            p="md"
            bg="error20"
            borderRadius="default"
            border="1px solid"
            borderColor="error100"
          >
            <Text color="error100">{error}</Text>
          </Box>
        )}

        <FormGroup mb="lg">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@kotiz.com"
            required
            disabled={loading}
          />
        </FormGroup>

        <FormGroup mb="xl">
          <Label htmlFor="password">Password</Label>
          <Box position="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              disabled={loading}
            />
            <Button
              type="button"
              variant="text"
              size="sm"
              onClick={() => setShowPassword(!showPassword)}
              position="absolute"
              right="8px"
              top="50%"
              transform="translateY(-50%)"
              p="sm"
              color="grey60"
              hoverColor="grey80"
            >
              <Icon icon={showPassword ? 'EyeOff' : 'Eye'} size={16} />
            </Button>
          </Box>
        </FormGroup>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="lg"
          fullWidth
          disabled={loading || !email || !password}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </Form>
    </Box>
  );
};

export default LoginForm;
