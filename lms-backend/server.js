require('dotenv').config();
const express = require('express');
const cors = require('cors'); // ✅ Import CORS middleware
const db = require('./models/index');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Enable CORS
app.use(cors({
  origin: '*', // Allow all origins (you can restrict this in production)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);

// Database connection and server start
const connectDB = async () => {
  try {
    await db.sync({ alter: true });
    console.log('✅ MySQL Database connected and models synchronized.');

    app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode.`)
    );
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

connectDB();
