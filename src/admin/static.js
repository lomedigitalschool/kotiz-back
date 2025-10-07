import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const setupStaticFiles = (app) => {
  // Servir les fichiers statiques depuis le dossier public
  app.use('/admin/public', express.static(path.join(__dirname, 'public')));
};