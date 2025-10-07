import { Server } from 'socket.io';
import db from '../models/index.js';

let io;

export const initSocketService = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:5000',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        'http://localhost:8080',
        'https://kotiz-web.onrender.com',
        'https://kotiz-web.netlify.app'
      ],
      credentials: true
    }
  });

  console.log('🔌 Socket.io service initialized');

  return io;
};

export const sendStats = async () => {
  try {
    if (!io) {
      console.warn('⚠️ Socket.io not initialized, cannot send stats');
      return;
    }

    // Calculate basic stats
    const [userCount] = await db.sequelize.query('SELECT COUNT(*) as count FROM "Users"');
    const [pullCount] = await db.sequelize.query('SELECT COUNT(*) as count FROM "Pulls"');
    const [contributionCount] = await db.sequelize.query('SELECT COUNT(*) as count FROM "Contributions"');

    const stats = {
      users: parseInt(userCount[0].count),
      pulls: parseInt(pullCount[0].count),
      contributions: parseInt(contributionCount[0].count),
      timestamp: new Date()
    };

    // Emit to admin dashboard room
    io.to('admin-dashboard').emit('stats-update', stats);
    console.log('📊 Stats sent via socket:', stats);
  } catch (error) {
    console.error('❌ Error sending stats via socket:', error);
  }
};

export const emitRealtimeUpdate = (event, data) => {
  if (!io) {
    console.warn('⚠️ Socket.io not initialized, cannot emit realtime update');
    return;
  }

  io.to('admin-dashboard').emit(event, data);
  io.to('public-updates').emit(event, data);
  console.log(`🔄 Realtime update emitted: ${event}`, data);
};

export default { initSocketService, sendStats, emitRealtimeUpdate };