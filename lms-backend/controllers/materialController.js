// controllers/materialController.js
const db = require('../models');
const Material = db.Material;
const Course = db.Course;
const User = db.User;

// Helper function for teacher authorization
const checkTeacherOwnership = async (courseId, teacherId, res) => {
    const course = await Course.findByPk(courseId, { attributes: ['id', 'teacherId'] });
    if (!course) {
        res.status(404).json({ message: 'Course not found.' });
        return null;
    }
    if (course.teacherId !== teacherId) {
        res.status(403).json({ message: 'You do not have permission to manage materials for this course.' });
        return null;
    }
    return course;
};

// Helper function for view authorization (Teacher or Enrolled Student)
const checkViewAuthorization = async (courseId, userId, userRole, res) => {
    const course = await Course.findByPk(courseId, { attributes: ['id', 'teacherId', 'title'] });
    if (!course) {
        res.status(404).json({ message: 'Course not found.' });
        return null;
    }

    const isTeacher = course.teacherId === userId;
    
    // Admins can view anything (handled by restrictTo on the router, but good for internal logic too)
    if (userRole === 'Super Admin') return course; 

    if (isTeacher) return course;

    // Check enrollment for students
    if (userRole === 'Student') {
        const enrollment = await db.Enrollment.findOne({
            where: { userId, courseId }
        });
        if (enrollment) return course;
    }
    
    res.status(403).json({ 
        message: 'You must be the course teacher or an enrolled student to view materials.' 
    });
    return null;
};


// --- C: Create (Upload) ---
// User Story: As a teacher, I want to upload course materials.
// controllers/materialController.js

// ... (existing helper functions and requires)

// --- C: Create (Upload) ---
exports.createMaterial = async (req, res) => {
    const teacherId = req.user.id;
    // Destructure, but immediately trim the materialLink
    const { courseId, title, fileType } = req.body;
    let { materialLink } = req.body; // Use 'let' so we can modify it

    // IMPORTANT FIX: Trim leading/trailing whitespace from the link
    if (materialLink) {
        materialLink = materialLink.trim(); 
    }

    if (!courseId || !title || !materialLink) {
        return res.status(400).json({ message: 'Course ID, title, and material link are required.' });
    }

    try {
        // 1. Authorization: Check if the user is the teacher of the course
        const course = await checkTeacherOwnership(courseId, teacherId, res);
        if (!course) return; // Response handled by helper

        // 2. Create the new material record
        const newMaterial = await Material.create({
            courseId,
            title,
            materialLink, // Use the now-trimmed link
            fileType: fileType || 'Link', 
            uploadedBy: teacherId,
        });

        res.status(201).json({
            status: 'success',
            message: 'Course material uploaded successfully.',
            data: { material: newMaterial }
        });

    } catch (error) {
        console.error('Create material error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to upload course material.', error: error.message });
    }
};// --- R: Read (Get All) ---
// User Story: As a student, I want to access course materials.
exports.getAllCourseMaterials = async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { courseId } = req.params;

    try {
        // 1. Authorization: Check if the user is authorized to view the course materials
        const course = await checkViewAuthorization(courseId, userId, userRole, res);
        if (!course) return; // Response handled by helper

        // 2. Fetch all materials for the course, including the uploader's name
        const materials = await Material.findAll({
            where: { courseId },
            include: [{
                model: User,
                as: 'Uploader',
                attributes: ['id', 'name', 'email']
            }]
        });

        res.status(200).json({
            status: 'success',
            results: materials.length,
            data: {
                courseTitle: course.title,
                materials
            }
        });

    } catch (error) {
        console.error('Get course materials error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to retrieve course materials.', error: error.message });
    }
};

// --- R: Read (Get One) ---
exports.getMaterialById = async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { id } = req.params;

    try {
        const material = await Material.findByPk(id, {
            include: [{
                model: User,
                as: 'Uploader',
                attributes: ['id', 'name', 'email']
            }]
        });

        if (!material) {
            return res.status(404).json({ message: 'Material not found.' });
        }

        // 1. Authorization: Check if the user is authorized to view the associated course
        const course = await checkViewAuthorization(material.courseId, userId, userRole, res);
        if (!course) return; // Response handled by helper

        res.status(200).json({
            status: 'success',
            data: { material }
        });

    } catch (error) {
        console.error('Get material by ID error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to retrieve material.', error: error.message });
    }
};

// --- U: Update ---
exports.updateMaterial = async (req, res) => {
    const teacherId = req.user.id;
    const { id } = req.params;
    const updates = req.body;

    try {
        const material = await Material.findByPk(id);

        if (!material) {
            return res.status(404).json({ message: 'Material not found.' });
        }

        // 1. Authorization: Check if the logged-in user is the one who uploaded it
        if (material.uploadedBy !== teacherId) {
             return res.status(403).json({ message: 'You do not have permission to update this material.' });
        }
        
        // 2. Authorization: Double-check the material belongs to a course owned by the teacher (optional but safer)
        const course = await checkTeacherOwnership(material.courseId, teacherId, res);
        if (!course) return; // Response handled by helper

        // 3. Apply updates
        await material.update(updates);

        res.status(200).json({
            status: 'success',
            message: 'Material updated successfully.',
            data: { material }
        });

    } catch (error) {
        console.error('Update material error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update material.', error: error.message });
    }
};

// --- D: Delete ---
exports.deleteMaterial = async (req, res) => {
    const teacherId = req.user.id;
    const { id } = req.params;

    try {
        const material = await Material.findByPk(id);

        if (!material) {
            return res.status(204).json(); // Already gone, treat as success
        }

        // 1. Authorization: Check if the logged-in user is the one who uploaded it
        if (material.uploadedBy !== teacherId) {
             return res.status(403).json({ message: 'You do not have permission to delete this material.' });
        }
        
        // 2. Authorization: Double-check the material belongs to a course owned by the teacher (optional but safer)
        const course = await checkTeacherOwnership(material.courseId, teacherId, res);
        if (!course) return; // Response handled by helper

        // 3. Delete the material
        await material.destroy();

        res.status(204).json({
            status: 'success',
            data: null
        });

    } catch (error) {
        console.error('Delete material error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete material.', error: error.message });
    }
};