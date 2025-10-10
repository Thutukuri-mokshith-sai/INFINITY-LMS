// routes/materialRoutes.js
const express = require('express');
const {
    createMaterial,
    getAllCourseMaterials,
    getMaterialById,
    updateMaterial,
    deleteMaterial,
} = require('../controllers/materialController');
const { protect, restrictTo } = require('../middleware/authMiddleware'); // Assumed middleware
const router = express.Router();

// Apply protection middleware to all routes in this router
router.use(protect);

// ----------------------------------------------------
// Teacher/Admin Actions (CRUD)
// ----------------------------------------------------

// C: Create/Upload Material
// POST /api/v1/materials
router.post(
    '/',
    restrictTo('Teacher', 'Super Admin'), 
    createMaterial
);

// U: Update Material by ID
// PATCH /api/v1/materials/:id
router.patch(
    '/:id',
    restrictTo('Teacher', 'Super Admin'),
    updateMaterial
);

// D: Delete Material by ID
// DELETE /api/v1/materials/:id
router.delete(
    '/:id',
    restrictTo('Teacher', 'Super Admin'),
    deleteMaterial
);

// ----------------------------------------------------
// Student/Teacher/Admin Actions (Read)
// ----------------------------------------------------

// R: Get All Materials for a Specific Course
// GET /api/v1/materials/course/:courseId
// Authorization check is handled internally by the controller (Teacher or Enrolled Student)
router.get(
    '/course/:courseId',
    getAllCourseMaterials
);

// R: Get Single Material by ID
// GET /api/v1/materials/:id
// Authorization check is handled internally by the controller (Teacher or Enrolled Student)
router.get(
    '/:id',
    getMaterialById
);

module.exports = router;