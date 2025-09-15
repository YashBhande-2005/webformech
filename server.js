const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const fileupload = require('express-fileupload');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const errorHandler = require('./middleware/error');
const http = require('http');
const { Server } = require('socket.io');

// Load env vars
dotenv.config();

// Connect to database
const connectDB = require('./config/db');
connectDB();

// Initialize app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Make io available to routes/controllers via app
app.set('io', io);

// Presence tracking for mechanics
// Map mechanicId -> { socketId, user }
const onlineMechanics = new Map();

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Client may emit 'mechanic:identify' with their user object after connecting
  socket.on('mechanic:identify', async (payload) => {
    // Expect payload { token } or { user, token }
    try {
      const jwt = require('jsonwebtoken');
      const token = payload && payload.token ? payload.token : null;
      if (!token) {
        console.warn('mechanic:identify missing token');
        return;
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // decoded should contain id
      if (!decoded || !decoded.id) return;
      // Fetch minimal user data from payload.user if provided, else use decoded id
      const user = payload.user || { id: decoded.id, name: decoded.name || 'Mechanic' };
      onlineMechanics.set(decoded.id.toString(), { socketId: socket.id, user });
      io.emit('mechanic:online', { id: decoded.id, name: user.name });
      console.log(`Mechanic ${decoded.id} identified on socket ${socket.id}`);
    } catch (err) {
      console.warn('mechanic:identify token verify failed', err.message);
    }
  });

  socket.on('disconnect', () => {
    // Remove any mechanic entries with this socket id
    for (const [mechanicId, info] of onlineMechanics.entries()) {
      if (info.socketId === socket.id) {
        onlineMechanics.delete(mechanicId);
        io.emit('mechanic:offline', { id: mechanicId });
        console.log(`Mechanic ${mechanicId} disconnected and marked offline`);
      }
    }
  });
});

// API to list online mechanics
app.get('/api/v1/online-mechanics', (req, res) => {
  const list = Array.from(onlineMechanics.values()).map((v) => v.user);
  res.json({ success: true, data: list });
});

// Body parser (capture raw body for optional HMAC verification)
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// File uploading
app.use(fileupload());

// Sanitize data
app.use(mongoSanitize());

// Set security headers
app.use(helmet({ contentSecurityPolicy: false }));

// Prevent XSS attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100
});
app.use(limiter);

// Enable CORS and preflight
const corsOptions = { origin: true, credentials: true };
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Set static folder
app.use(express.static(path.join(__dirname, '/')));
// Serve other website at /other
app.use('/other', express.static(path.join(__dirname, 'other-website')));

// Direct route for /other/login to serve login.html
app.get('/other/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'other-website', 'login.html'));
});

// Serve customer website at /customer
app.get('/customer', (req, res) => {
    res.sendFile(path.join(__dirname, 'customer-website.html'));
});

// Define routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/mechanics', require('./routes/mechanics'));
app.use('/api/v1/service-requests', require('./routes/serviceRequests'));
app.use('/api/v1/reviews', require('./routes/reviews'));

// Serve HTML files
// Notification receiver endpoint
app.post('/api/v1/notifications', (req, res) => {
  // You can customize this logic as needed
  console.log('Notification received from A website:', req.body);
  // Emit notification to all connected Socket.IO clients
  io.emit('notification', req.body);
  // Respond to A website
  res.status(200).json({ success: true, message: 'Notification received', data: req.body });
});

// Webhook receiver for external sites (urbanmechanic forwarding)
// Supports optional HMAC verification using environment var NOTIFY_SECRET
app.post('/webhook/urbanmechanic', (req, res) => {
  const secret = process.env.NOTIFY_SECRET;

  // If secret is set, require and verify X-Signature header
  if (secret) {
    const sigHeader = req.get('X-Signature') || req.get('x-signature');
    if (!sigHeader) {
      console.warn('Missing X-Signature header for webhook');
      return res.status(401).json({ success: false, error: 'Missing signature' });
    }

    // rawBody captured by express.json verify above
    const raw = req.rawBody || Buffer.from(JSON.stringify(req.body));
    const hmac = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    const expected = `sha256=${hmac}`;
    if (!crypto.timingSafeEqual(Buffer.from(sigHeader), Buffer.from(expected))) {
      console.warn('Invalid webhook signature', sigHeader, expected);
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }
  }

  const payload = req.body || {};
  console.log('Webhook /webhook/urbanmechanic received:', payload);

  // Emit to Socket.IO clients under a specific event name
  io.emit('urbanmechanic:webhook', payload);

  res.json({ success: true });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/find-mechanic', (req, res) => {
  res.sendFile(path.join(__dirname, 'find-mechanic.html'));
});

app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, 'services.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'contact.html'));
});

app.get('/how-it-works', (req, res) => {
  res.sendFile(path.join(__dirname, 'how-it-works.html'));
});

app.get('/testimonials', (req, res) => {
  res.sendFile(path.join(__dirname, 'testimonials.html'));
});

app.get('/download', (req, res) => {
  res.sendFile(path.join(__dirname, 'download.html'));
});

app.get('/mechanic-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'mechanic-dashboard.html'));
});

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});