const db = require('../models');
const Assignment = db.Assignment;
const Submission = db.Submission;
const AssignmentResource = db.AssignmentResource;
const SubmissionResource = db.SubmissionResource;
const Course = db.Course;
const Enrollment = db.Enrollment;
const User = db.User; 

// Helper function to check if a user is enrolled in a course
const isStudentEnrolled = async (studentId, courseId) => {
    const enrollment = await Enrollment.findOne({
        where: { userId: studentId, courseId: courseId }
    });
    return !!enrollment;
};

// Helper function for teacher authorization on an assignment
const checkTeacherAssignmentAuth = async (assignmentId, teacherId) => {
    const assignment = await Assignment.findByPk(assignmentId, {
        include: [{ model: Course, as: 'Course', attributes: ['teacherId'] }]
    });

    if (!assignment) {
        return { authorized: false, message: 'Assignment not found.', status: 404 };
    }
    if (assignment.Course.teacherId !== teacherId) {
        return { authorized: false, message: 'You are not the teacher of this assignment and cannot modify it.', status: 403 };
    }
    return { authorized: true, assignment };
};

// ====================================================================
// TEACHER ACTIONS (Creating, Updating, Deleting Assignments)
// ====================================================================

// User Story 4: As a teacher, I want to create assignments for a course.
exports.createAssignment = async (req, res) => {
    const teacherId = req.user.id;
    const { courseId, title, description, dueDate, maxPoints, resources } = req.body;

    // Basic validation
    if (!courseId || !title || !dueDate) {
        return res.status(400).json({ message: 'Course ID, title, and due date are required.' });
    }

    try {
        // 1. Authorization: Check if the logged-in user is the teacher of the course
        const course = await Course.findByPk(courseId);
        if (!course || course.teacherId !== teacherId) {
            return res.status(403).json({ message: 'You do not have permission to create assignments for this course.' });
        }

        // 2. Create the Assignment
        const newAssignment = await Assignment.create({
            courseId,
            teacherId,
            title,
            description,
            dueDate,
            maxPoints: maxPoints || 100,
        });

        // 3. Create associated Resources (e.g., PDF links)
        if (resources && Array.isArray(resources) && resources.length > 0) {
            const assignmentResources = resources.map(r => ({
                assignmentId: newAssignment.id,
                resourceLink: r.resourceLink,
                title: r.title,
                fileType: r.fileType || 'Link'
            }));
            await AssignmentResource.bulkCreate(assignmentResources);
        }

        res.status(201).json({
            status: 'success',
            message: 'Assignment successfully created.',
            data: { assignment: newAssignment }
        });

    } catch (error) {
        console.error('Create Assignment error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to create assignment.', error: error.message });
    }
};

/** * NEW CONTROLLER: Update an existing assignment. 
 * Route: PATCH /api/assignments/:assignmentId
 */
exports.updateAssignment = async (req, res) => {
    const teacherId = req.user.id;
    const { assignmentId } = req.params;
    const { title, description, dueDate, maxPoints, resources } = req.body;

    try {
        // 1. Authorization Check
        const authResult = await checkTeacherAssignmentAuth(assignmentId, teacherId);
        if (!authResult.authorized) {
            return res.status(authResult.status).json({ message: authResult.message });
        }
        const assignmentToUpdate = authResult.assignment;

        // 2. Update Assignment Fields
        const updatedAssignment = await assignmentToUpdate.update({
            title: title || assignmentToUpdate.title,
            description: description || assignmentToUpdate.description,
            dueDate: dueDate || assignmentToUpdate.dueDate,
            maxPoints: maxPoints || assignmentToUpdate.maxPoints,
        });

        // 3. Update Resources (Simple replace for this endpoint)
        if (resources !== undefined) {
            // Delete old resources
            await AssignmentResource.destroy({ where: { assignmentId } });

            // Create new resources
            if (Array.isArray(resources) && resources.length > 0) {
                const assignmentResources = resources.map(r => ({
                    assignmentId: assignmentId,
                    resourceLink: r.resourceLink,
                    title: r.title,
                    fileType: r.fileType || 'Link'
                }));
                await AssignmentResource.bulkCreate(assignmentResources);
            }
        }

        res.status(200).json({
            status: 'success',
            message: 'Assignment successfully updated.',
            data: { assignment: updatedAssignment }
        });

    } catch (error) {
        console.error('Update Assignment error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update assignment.', error: error.message });
    }
};

/** * NEW CONTROLLER: Delete an existing assignment. 
 * Route: DELETE /api/assignments/:assignmentId
 */
exports.deleteAssignment = async (req, res) => {
    const teacherId = req.user.id;
    const { assignmentId } = req.params;

    try {
        // 1. Authorization Check
        const authResult = await checkTeacherAssignmentAuth(assignmentId, teacherId);
        if (!authResult.authorized) {
            return res.status(authResult.status).json({ message: authResult.message });
        }
        
        // 2. Delete the Assignment (Sequelize configuration should handle cascade delete)
        const deleteCount = await Assignment.destroy({ 
            where: { id: assignmentId } 
        });

        if (deleteCount === 0) {
            return res.status(404).json({ message: 'Assignment not found.' });
        }

        res.status(204).json({ // 204 No Content is standard for successful deletion
            status: 'success',
            data: null
        });

    } catch (error) {
        console.error('Delete Assignment error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete assignment.', error: error.message });
    }
};

exports.getAssignmentDetails = async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { assignmentId } = req.params;

    try {
        const assignment = await Assignment.findByPk(assignmentId, {
            include: [
                {
                    model: AssignmentResource,
                    as: 'Resources',
                    attributes: ['title', 'resourceLink', 'fileType']
                },
                {
                    model: Course,
                    as: 'Course',
                    attributes: ['teacherId', 'id'] 
                }
            ]
        });

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found.' });
        }
        
        const courseId = assignment.Course.id;
        const teacherId = assignment.Course.teacherId;

        // 1. Authorization Check: Must be the course teacher or an enrolled student
        if (userRole === 'Student' && !(await isStudentEnrolled(userId, courseId))) {
            return res.status(403).json({ message: 'You are not authorized to view this assignment.' });
        }
        if (userRole === 'Teacher' && teacherId !== userId) {
            return res.status(403).json({ message: 'You are not the teacher of this assignment.' });
        }
        
        const assignmentData = {
            ...assignment.toJSON(),
            courseId: courseId, 
        };

        res.status(200).json({
            status: 'success',
            data: { assignment: assignmentData }
        });

    } catch (error) {
        console.error('Get Assignment Details error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to retrieve assignment details.', error: error.message });
    }
};

exports.getCourseAssignments = async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        // Authorization Check: Must be the course teacher or an enrolled student
        if (userRole === 'Student' && !(await isStudentEnrolled(userId, courseId))) {
            return res.status(403).json({ message: 'You are not enrolled in this course.' });
        }
        if (userRole === 'Teacher' && course.teacherId !== userId) {
            return res.status(403).json({ message: 'You are not the teacher of this course.' });
        }
        
        const assignments = await Assignment.findAll({
            where: { courseId },
            include: [{ 
                model: AssignmentResource, 
                as: 'Resources',
                attributes: ['title', 'resourceLink', 'fileType']
            }],
            order: [['dueDate', 'ASC']]
        });

        res.status(200).json({
            status: 'success',
            results: assignments.length,
            data: { assignments }
        });
    } catch (error) {
        console.error('Get Course Assignments error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to retrieve assignments.', error: error.message });
    }
};

exports.getSubmissionsByAssignment = async (req, res) => {
    const teacherId = req.user.id;
    const { assignmentId } = req.params;

    try {
        // Authorization: Check if the logged-in user is the teacher of the assignment's course
        const authResult = await checkTeacherAssignmentAuth(assignmentId, teacherId);
        if (!authResult.authorized) {
            return res.status(authResult.status).json({ message: authResult.message });
        }

        const submissions = await Submission.findAll({
            where: { assignmentId }, // Filter only by the assignment ID
            include: [
                {
                    model: User,
                    as: 'Student',
                    attributes: ['id', 'name', 'email'] // Get student details
                },
                {
                    model: SubmissionResource,
                    as: 'SubmittedResources',
                    attributes: ['title', 'resourceLink', 'fileType']
                }
            ],
            // Order by submission date
            order: [['submittedAt', 'ASC']]
        });

        res.status(200).json({
            status: 'success',
            results: submissions.length,
            data: { submissions }
        });

    } catch (error) {
        console.error('Get submissions by assignment error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to retrieve assignment submissions.', error: error.message });
    }
};

exports.getAllSubmissionsForCourse = async (req, res) => {
    const teacherId = req.user.id;
    const { courseId } = req.params;

    try {
        // 1. Authorization: Check if the logged-in user is the teacher of the course
        const course = await Course.findByPk(courseId);
        if (!course || course.teacherId !== teacherId) {
            return res.status(403).json({ message: 'You do not have permission to view submissions for this course.' });
        }

        // 2. Fetch all submissions for the course's assignments
        const submissions = await Submission.findAll({
            include: [
                {
                    model: Assignment,
                    as: 'Assignment',
                    where: { courseId: courseId }, // Filter submissions only for this course
                    attributes: ['id', 'title', 'dueDate', 'maxPoints']
                },
                {
                    model: User,
                    as: 'Student',
                    attributes: ['id', 'name', 'email'] // Get student details
                },
                {
                    model: SubmissionResource,
                    as: 'SubmittedResources',
                    attributes: ['title', 'resourceLink', 'fileType']
                }
            ],
            // Order by assignment and submission date for clarity
            order: [[Assignment, 'dueDate', 'DESC'], ['submittedAt', 'ASC']] 
        });

        res.status(200).json({
            status: 'success',
            results: submissions.length,
            data: { submissions }
        });

    } catch (error) {
        console.error('Get all submissions error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to retrieve submissions.', error: error.message });
    }
};

// ====================================================================
// STUDENT ACTIONS (Submitting, Updating, Deleting Assignments)
// ====================================================================

exports.submitAssignment = async (req, res) => {
    const studentId = req.user.id;
    const { assignmentId } = req.params;
    const { studentComment, resources } = req.body; 

    if (!resources || !Array.isArray(resources) || resources.length === 0) {
        return res.status(400).json({ message: 'Submission failed: At least one resource link is required.' });
    }

    try {
        const assignment = await Assignment.findByPk(assignmentId);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found.' });
        }

        // 1. Authorization: Check if the student is enrolled in the course
        if (!(await isStudentEnrolled(studentId, assignment.courseId))) {
            return res.status(403).json({ message: 'You are not enrolled in the course for this assignment.' });
        }

        // 2. Check for lateness
        const isLate = new Date() > new Date(assignment.dueDate);

        // 3. Find or Create Submission (Students should only submit once)
        const [submission, created] = await Submission.findOrCreate({
            where: {
                studentId: studentId,
                assignmentId: assignmentId,
            },
            defaults: {
                studentId: studentId,
                assignmentId: assignmentId,
                studentComment,
                isLate,
                submittedAt: new Date(),
            }
        });
        
        if (!created) {
             // If already submitted, update the existing submission details (resubmission)
             await submission.update({ 
                studentComment, 
                isLate, // Update lateness status
                submittedAt: new Date(),
             });
             
             // Delete old resources to replace them with new ones
             await SubmissionResource.destroy({ where: { submissionId: submission.id } });
        }

        // 4. Create associated Submission Resources (links to student's files)
        const submissionResources = resources.map(r => ({
            submissionId: submission.id,
            resourceLink: r.resourceLink,
            title: r.title,
            fileType: r.fileType || 'Link'
        }));
        const newResources = await SubmissionResource.bulkCreate(submissionResources);

        res.status(created ? 201 : 200).json({
            status: 'success',
            message: created ? 'Assignment submitted successfully.' : 'Assignment resubmitted successfully.',
            data: { 
                submission, 
                resources: newResources,
                isLate: submission.isLate
            }
        });

    } catch (error) {
        // Handle unique constraint error if findOrCreate fails unexpectedly
        if (error.name === 'SequelizeUniqueConstraintError') {
             return res.status(409).json({ message: 'You have already submitted this assignment.' });
        }
        console.error('Submit Assignment error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to submit assignment.', error: error.message });
    }
};

exports.getStudentSubmission = async (req, res) => {
    const studentId = req.user.id;
    const { assignmentId } = req.params;

    try {
        const submission = await Submission.findOne({
            where: { studentId, assignmentId },
            include: [
                {
                    model: Assignment,
                    as: 'Assignment',
                    attributes: ['id', 'title', 'dueDate', 'maxPoints']
                },
                {
                    model: SubmissionResource,
                    as: 'SubmittedResources',
                    attributes: ['title', 'resourceLink', 'fileType']
                }
            ]
        });

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found for this assignment.' });
        }

        res.status(200).json({
            status: 'success',
            data: { submission }
        });
    } catch (error) {
        console.error('Get Student Submission error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to retrieve submission.', error: error.message });
    }
};

/** * NEW CONTROLLER: Update an existing submission. 
 * Allows updates (resubmission) before the due date.
 * Route: PATCH /api/assignments/:assignmentId/my-submission
 */
exports.updateStudentSubmission = async (req, res) => {
    const studentId = req.user.id;
    const { assignmentId } = req.params;
    const { studentComment, resources } = req.body; 

    // Check for resources only if they are being updated/provided
    if (resources !== undefined && (!Array.isArray(resources) || resources.length === 0)) {
        return res.status(400).json({ message: 'Update failed: Resources must be an array with at least one item, or left out entirely.' });
    }

    try {
        const assignment = await Assignment.findByPk(assignmentId);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found.' });
        }

        // 1. Authorization: Check enrollment
        if (!(await isStudentEnrolled(studentId, assignment.courseId))) {
            return res.status(403).json({ message: 'You are not enrolled in the course for this assignment.' });
        }

        // 2. Deadline Check: Only allow updates before the due date
        if (new Date() > new Date(assignment.dueDate)) {
            return res.status(403).json({ message: 'Cannot update submission: The assignment due date has passed.' });
        }
        
        const submission = await Submission.findOne({ 
            where: { studentId, assignmentId } 
        });

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found to update. Use POST to submit first.' });
        }

        // 3. Update Submission Fields
        await submission.update({
            studentComment: studentComment !== undefined ? studentComment : submission.studentComment,
            isLate: false, // Will always be false since we checked the due date
            submittedAt: new Date(), // Update submission time
        });

        // 4. Update Resources (Simple replace if resources array is provided)
        if (resources !== undefined) {
            // Delete old resources
            await SubmissionResource.destroy({ where: { submissionId: submission.id } });

            // Create new resources
            if (resources.length > 0) {
                const submissionResources = resources.map(r => ({
                    submissionId: submission.id,
                    resourceLink: r.resourceLink,
                    title: r.title,
                    fileType: r.fileType || 'Link'
                }));
                await SubmissionResource.bulkCreate(submissionResources);
            }
        }

        // Re-fetch with resources for a complete response
        const updatedSubmission = await Submission.findByPk(submission.id, {
            include: [{ model: SubmissionResource, as: 'SubmittedResources' }]
        });

        res.status(200).json({
            status: 'success',
            message: 'Submission successfully updated.',
            data: { submission: updatedSubmission }
        });

    } catch (error) {
        console.error('Update Student Submission error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update submission.', error: error.message });
    }
};

/** * NEW CONTROLLER: Delete an existing submission. 
 * Allows deletion only before the due date.
 * Route: DELETE /api/assignments/:assignmentId/my-submission
 */
exports.deleteStudentSubmission = async (req, res) => {
    const studentId = req.user.id;
    const { assignmentId } = req.params;

    try {
        const assignment = await Assignment.findByPk(assignmentId);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found.' });
        }

        // 1. Authorization: Check enrollment
        if (!(await isStudentEnrolled(studentId, assignment.courseId))) {
            return res.status(403).json({ message: 'You are not enrolled in the course for this assignment.' });
        }

        // 2. Deadline Check: Only allow deletion before the due date
        if (new Date() > new Date(assignment.dueDate)) {
            return res.status(403).json({ message: 'Cannot delete submission: The assignment due date has passed.' });
        }
        
        // 3. Delete the Submission
        const deleteCount = await Submission.destroy({
            where: { studentId, assignmentId }
        });

        if (deleteCount === 0) {
            return res.status(404).json({ message: 'Submission not found.' });
        }

        res.status(204).json({ // 204 No Content is standard for successful deletion
            status: 'success',
            data: null
        });

    } catch (error) {
        console.error('Delete Student Submission error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete submission.', error: error.message });
    }
};