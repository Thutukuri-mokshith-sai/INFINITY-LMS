require('dotenv').config();
const express = require('express');
const cors = require('cors'); 
const db = require('./models/index');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const enrollmentRouter = require('./routes/enrollmentRoutes');
const profileRouter = require('./routes/profileRouter');
const assignmentSubmissionRouter = require('./routes/assignmentSubmissionRouter');
const gradeRouter = require('./routes/gradeRoutes'); 
const studentGradeRouter = require('./routes/studentGradeRouter');
const forumRoutes = require('./routes/forumRoutes');
const discussionRouter = require('./routes/discussionRoutes'); 
const materialRoutes = require('./routes/materialRoutes');
const studentDashboardRouter = require('./routes/studentDashboardRoutes');
const teacherDashboardRoutes = require('./routes/teacherDashboardRoutes');
const gradeCenterRoutes = require('./routes/gradeCenterRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRouter);
app.use('/api/profiles', profileRouter);
app.use('/api/student-grades', studentGradeRouter);
app.use('/api/', forumRoutes);
app.use('/api/assignments', assignmentSubmissionRouter);
app.use('/api/grades', gradeRouter); 
app.use('/api/discussions', discussionRouter);
app.use('/api/material', materialRoutes);
app.use('/api/studentdashboard', studentDashboardRouter);
app.use('/api/teacherdashboard', teacherDashboardRoutes);
app.use('/api/gradecenter', gradeCenterRoutes); 

// ✅ Database connection and server start
const connectDB = async () => {
  try {
    // Ensure models sync correctly with PostgreSQL (Neon)
    await db.sequelize.authenticate();
    console.log('✅ PostgreSQL Database connection established successfully.');

    await db.sequelize.sync({ alter: true });
    console.log('✅ Models synchronized with PostgreSQL.');

    app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`)
    );
  } catch (error) {
    console.error('❌ Unable to connect to the PostgreSQL database:', error);
    process.exit(1);
  }
};

connectDB();
