require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');

const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: '*' } });

app.set('io', io);

app.use(cors());
app.use(express.json());

// Swagger minimal
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: { title: 'Task API', version: '1.0.0' },
    servers: [{ url: process.env.BASE_URL || 'http://localhost:4000' }]
  },
  apis: []
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

io.on('connection', socket => {
  console.log('a user connected', socket.id);
  socket.on('disconnect', () => console.log('disconnected', socket.id));
});

(async () => {
  await connectDB();
  const port = process.env.PORT || 4000;
  server.listen(port, () => console.log('🚀 Server running on port', port));
})();
