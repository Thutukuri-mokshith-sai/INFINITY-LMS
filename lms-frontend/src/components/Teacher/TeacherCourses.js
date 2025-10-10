import React, { useState, useEffect } from 'react';
import { FaChalkboardTeacher, FaPlusCircle, FaEdit, FaTrash, FaClock, FaCalendarAlt, FaTimes, FaBars, FaUniversity, FaUserCircle, FaSignOutAlt, FaListAlt, FaGraduationCap, FaSpinner, FaInfoCircle } from 'react-icons/fa'; // ✅ Replaced FaUsers with FaInfoCircle
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import axios from 'axios';
import './TeacherCourses.css'; // Reusing the same styles for dashboard layout

// --- API FUNCTIONS (Students API removed) ---
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

/**
 * Fetches all courses created by the authenticated teacher.
 * Route: GET /api/courses/my-courses
 */
const apiGetTeacherCourses = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/courses/my-courses`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        return response.data.courses;
    } catch (error) {
        console.error("API Fetch Teacher Courses Error:", error.response || error);
        throw new Error(error.response?.data?.message || 'Server error while fetching your courses.');
    }
};

/**
 * Updates a specific course.
 * Route: PUT /api/courses/:id
 */
const apiUpdateCourse = async (courseId, updateData, token) => { 
    try {
        const response = await axios.put(`${API_URL}/courses/${courseId}`, updateData, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        return response.data.course;
    } catch (error) {
        console.error("API Update Course Error:", error.response || error);
        throw new Error(error.response?.data?.message || 'Server error while updating course.');
    }
};

/**
 * Deletes a specific course.
 * Route: DELETE /api/courses/:id
 */
const apiDeleteCourse = async (courseId, token) => { 
    try {
        await axios.delete(`${API_URL}/courses/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        return true; 
    } catch (error) {
        console.error("API Delete Course Error:", error.response || error);
        throw new Error(error.response?.data?.message || 'Server error while deleting course.');
    }
};

// ❌ Removed apiGetStudentsByCourse

// --- MAIN COMPONENT ---
const TeacherCourses = () => {
    const { isAuthenticated, name, role, logout, token } = useAuth();
    const navigate = useNavigate();

    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // UI State for Modals/Forms
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingCourseId, setDeletingCourseId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [modalMessage, setModalMessage] = useState({ text: '', isError: false });

    // ❌ Removed NEW STATE for View Students Modal (showStudentsModal, viewingCourse, etc.)
    // Note: Since 'activeViewId' is used later, we'll keep a placeholder if needed,
    // but the handler will now navigate, making complex 'active' state for the card less necessary.
    // For simplicity and direct navigation, we will use a dedicated function instead of a modal state.
    
    const [activeViewId, setActiveViewId] = useState(null); // Keep this to manage card styling during action

    // Redirect unauthenticated users or non-teachers (optional, assuming protected routes)
    useEffect(() => { 
        if (!isAuthenticated || role !== 'Teacher') {
            // navigate('/login'); 
        }
    }, [isAuthenticated, role, navigate]);

    // --- FETCH DATA LOGIC (Unchanged) ---
    const fetchCourses = async () => { 
        if (!token) return;

        setIsLoading(true);
        setError(null);
        try {
            const data = await apiGetTeacherCourses(token);
            setCourses(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial data fetch (Unchanged)
    useEffect(() => {
        fetchCourses();
    }, [token]);

    // --- HANDLERS (Unchanged) ---
    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const handleLogout = logout;

    // --- EDIT COURSE HANDLERS (Updated to close other modals) ---
    const openEditModal = (course) => { 
        const startDate = course.startDate.split('T')[0];
        const endDate = course.endDate.split('T')[0];
        
        setEditingCourse(course);
        setEditForm({
            title: course.title,
            description: course.description || '',
            duration: course.duration,
            startDate: startDate,
            endDate: endDate,
        });
        setModalMessage({ text: '', isError: false });
        setShowEditModal(true);
        setShowDeleteModal(false); 
        setDeletingCourseId(null);
        setActiveViewId(null); // Clear active view state
    };

    const closeEditModal = () => { 
        setShowEditModal(false);
        setEditingCourse(null);
        setEditForm({});
        setModalMessage({ text: '', isError: false });
    };

    const handleEditChange = (e) => { 
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateSubmit = async (e) => { 
        e.preventDefault();
        setModalMessage({ text: 'Updating course...', isError: false });

        try {
            const updatedCourse = await apiUpdateCourse(editingCourse.id, editForm, token);
            
            setCourses(prevCourses => prevCourses.map(c => 
                c.id === updatedCourse.id ? updatedCourse : c
            ));

            setModalMessage({ text: 'Course updated successfully! Redirecting...', isError: false });
            
            setTimeout(closeEditModal, 1500);

        } catch (err) {
            setModalMessage({ text: err.message, isError: true });
        }
    };

    // --- DELETE COURSE HANDLERS (Updated to close other modals) ---
    const openDeleteModal = (courseId) => { 
        setDeletingCourseId(courseId);
        setModalMessage({ text: '', isError: false });
        setShowDeleteModal(true);
        setShowEditModal(false); 
        setEditingCourse(null);
        setActiveViewId(null); // Clear active view state
    };

    const closeDeleteModal = () => { 
        setShowDeleteModal(false);
        setDeletingCourseId(null);
        setModalMessage({ text: '', isError: false });
    };

    const handleDelete = async () => { 
        if (!deletingCourseId) return;

        setModalMessage({ text: 'Deleting course...', isError: false });

        try {
            await apiDeleteCourse(deletingCourseId, token);
            
            setCourses(prevCourses => prevCourses.filter(c => c.id !== deletingCourseId));
            
            setModalMessage({ text: 'Course deleted successfully!', isError: false });
            
            setTimeout(closeDeleteModal, 1000);

        } catch (err) {
            setModalMessage({ text: err.message, isError: true });
        }
    };

    // --- ✅ NEW HANDLER: Navigate to View Course Details ---
    const handleViewCourseDetails = (courseId) => {
        // Close other modals before navigating
        closeEditModal();
        closeDeleteModal();
        // Set the active view ID for card styling feedback
        setActiveViewId(courseId); 
        
        // Perform the navigation
        navigate(`/teacher/course/${courseId}/details`);
    };
    // ------------------------------------

    // --- SUB-COMPONENTS (Unchanged) ---
    const CourseNavbar = () => ( 
        <nav className="dashboard-navbar-neon">
            <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
                {isSidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <div className="logo"><FaUniversity className="logo-icon"/> The Matrix Academy</div>
            <div className="nav-profile-group">
                <span className="student-name">
                    <FaUserCircle /> <strong>{name}</strong>({role})
                </span>
                <button className="btn-logout-neon" onClick={handleLogout}>
                    <FaSignOutAlt /> Logout
                </button>
            </div>
        </nav>
    );

    const CourseSidebar = () => ( 
        <aside className={`dashboard-sidebar-neon ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
            <div className="sidebar-header">TEACHER MENU</div>
            <nav className="sidebar-nav">
                <Link to="/teacher" className="nav-link">
                    <FaListAlt /> <span className="link-text">Dashboard</span>
                </Link>
                <Link to="/teacher/courses" className="nav-link active">
                    <FaChalkboardTeacher /> <span className="link-text">My Courses</span>
                </Link>
                <Link to="/teacher/grading" className="nav-link">
                    <FaGraduationCap /> <span className="link-text">Grading Center</span>
                </Link>
                <Link to="/teacher/courses/new" className="nav-link">
                    <FaPlusCircle /> <span className="link-text">Create Course</span>
                </Link>
                <Link to="/teacher/profile" className="nav-link"> 
                    <FaUserCircle /> 
                    <span className="link-text">Profile</span>
                    </Link>

            </nav>
        </aside>
    );
    // ...

    // --- UI RENDERINGS ---
    const mainContentClass = `main-content-area ${!isSidebarOpen ? 'sidebar-closed-content' : ''}`;

    if (!isAuthenticated || role !== 'Teacher') {
        return <div className="app-container">Unauthorized Access. Please log in as a Teacher.</div>;
    }

    const activeEditId = editingCourse ? editingCourse.id : null;
    const activeDeleteId = deletingCourseId;
    // ✅ Re-using activeViewId to indicate the course whose details are about to be viewed/navigated to
    const activeNavId = activeViewId; 

    // Determine if ANY modal is currently open (Students Modal removed)
    const isAnyModalOpen = showEditModal || showDeleteModal; 

    return (
        <div className="app-container">
            <CourseNavbar />
            <CourseSidebar />

            <main className={mainContentClass}>
                <div className="dashboard-section">
                    <h1 className="form-title-neon section-title-neon"><FaChalkboardTeacher /> My Courses</h1>
                    <p className="form-subtitle section-subtitle-neon">Manage your created courses, update details, or view course specifics.</p> {/* Updated subtitle */}
                    
                    <Link to="/teacher/courses/new" className="btn-primary-neon new-course-link">
                        <FaPlusCircle /> Create New Course
                    </Link>

                    {/* Loading/Error States */}
                    {isLoading && (
                        <div className="message-box success-neon">
                            <FaSpinner className="spinner" /> Loading your courses...
                        </div>
                    )}
                    {error && (
                        <div className="message-box error-neon">
                            Error: {error}
                        </div>
                    )}

                    {/* Course List */}
                    {!isLoading && !error && (
                        <div className="course-list-grid">
                            {courses.length === 0 ? (
                                <div className="message-box secondary-neon" style={{gridColumn: '1 / -1'}}>
                                    You haven't created any courses yet. Start with a new one!
                                </div>
                            ) : (
                                courses.map(course => (
                                    <CourseCard 
                                        key={course.id} 
                                        course={course} 
                                        openEditModal={openEditModal} 
                                        openDeleteModal={openDeleteModal} 
                                        // ✅ Updated prop name and passed the new handler
                                        handleViewCourseDetails={handleViewCourseDetails} 
                                        // Pass state down to control button visibility
                                        isEditing={activeEditId === course.id}
                                        isDeleting={activeDeleteId === course.id}
                                        isNavigating={activeNavId === course.id} // ✅ Updated prop name
                                        isAnyModalOpen={isAnyModalOpen} 
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Modals (Unchanged) */}
            {showEditModal && <EditCourseModal 
                course={editingCourse}
                form={editForm}
                handleChange={handleEditChange}
                handleSubmit={handleUpdateSubmit}
                handleClose={closeEditModal}
                message={modalMessage}
                isLoading={modalMessage.text.includes('Updating')}
            />}

            {showDeleteModal && <DeleteConfirmationModal
                courseId={deletingCourseId}
                handleDelete={handleDelete}
                handleClose={closeDeleteModal}
                message={modalMessage}
                isLoading={modalMessage.text.includes('Deleting')}
            />}

            {/* ❌ Removed ViewStudentsModal */}

        </div>
    );
};

// ----------------------------------------------------------------------------------
// --- HELPER COMPONENTS (MODIFIED) ---
// ----------------------------------------------------------------------------------

// MODIFIED CourseCard component
// ✅ Updated props: Replaced openStudentsModal/isViewing with handleViewCourseDetails/isNavigating
const CourseCard = ({ course, openEditModal, openDeleteModal, handleViewCourseDetails, isEditing, isDeleting, isNavigating, isAnyModalOpen }) => {
    // Logic: 
    // Show a button if NO modal is open OR if the modal for that specific action is open for THIS course.

    const showViewButton = !isAnyModalOpen || isNavigating; // Controls visibility/loading state for the view button
    const showEditButton = !isAnyModalOpen || isEditing;
    const showDeleteButton = !isAnyModalOpen || isDeleting;

    return (
        <div className="widget-card course-card-neon">
            <h3 className="course-title-card"><FaChalkboardTeacher /> {course.title}</h3>
            <p className="course-description-card">{course.description || 'No description provided.'}</p>
            <div className="course-meta">
                <span><FaClock /> {course.duration}</span>
                <span><FaCalendarAlt /> Start: {new Date(course.startDate).toLocaleDateString()}</span>
                <span><FaCalendarAlt /> End: {new Date(course.endDate).toLocaleDateString()}</span>
            </div>
            <div className="card-actions">
                {/* ✅ Updated View Course Details Button */}
                {showViewButton && (
                    <button onClick={() => handleViewCourseDetails(course.id)} className="btn-icon-neon btn-secondary">
                        {isNavigating ? <FaSpinner className="spinner" /> : <FaInfoCircle />} View Details
                    </button>
                )}

                {showEditButton && (
                    <button onClick={() => openEditModal(course)} className="btn-icon-neon btn-edit">
                        <FaEdit /> Edit
                    </button>
                )}
                
                {showDeleteButton && (
                    <button onClick={() => openDeleteModal(course.id)} className="btn-icon-neon btn-delete">
                        <FaTrash /> Delete
                    </button>
                )}
            </div>
        </div>
    );
};


// ❌ Removed ViewStudentsModal 

// The rest of the modals remain unchanged: EditCourseModal and DeleteConfirmationModal

const EditCourseModal = ({ course, form, handleChange, handleSubmit, handleClose, message, isLoading }) => { 
    return (
        <div className="modal-backdrop">
            <div className="modal-content widget-card">
                <div className="modal-header">
                    <h2><FaEdit /> Edit Course: {course.title}</h2>
                    <button className="close-btn" onClick={handleClose}><FaTimes /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="title">Course Title *</label>
                        <input type="text" name="title" value={form.title} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea name="description" value={form.description} onChange={handleChange} rows="3"></textarea>
                    </div>
                    <div className="form-grid" style={{gridTemplateColumns: 'repeat(3, 1fr)'}}>
                        <div className="form-group">
                            <label htmlFor="duration"><FaClock /> Duration *</label>
                            <select name="duration" value={form.duration} onChange={handleChange} required>
                                <option value="4 Weeks">4 Weeks</option>
                                <option value="8 Weeks">8 Weeks</option>
                                <option value="12 Weeks">12 Weeks</option>
                                <option value="Self-Paced">Self-Paced</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="startDate"><FaCalendarAlt /> Start Date *</label>
                            <input type="date" name="startDate" value={form.startDate} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="endDate"><FaCalendarAlt /> End Date *</label>
                            <input type="date" name="endDate" value={form.endDate} onChange={handleChange} required />
                        </div>
                    </div>
                    
                    {message.text && (
                        <div className={`message-box ${message.isError ? 'error-neon' : 'success-neon'}`}>
                            {message.text}
                        </div>
                    )}
                    
                    <div className="form-actions" style={{justifyContent: 'flex-end'}}>
                        <button type="submit" className="btn-primary-neon" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button type="button" className="btn-secondary-neon" onClick={handleClose} disabled={isLoading}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const DeleteConfirmationModal = ({ courseId, handleDelete, handleClose, message, isLoading }) => { 
    return (
        <div className="modal-backdrop">
            <div className="modal-content widget-card" style={{maxWidth: '400px'}}>
                <div className="modal-header">
                    <h2><FaTrash /> Confirm Deletion</h2>
                    <button className="close-btn" onClick={handleClose}><FaTimes /></button>
                </div>
                <p>Are you sure you want to permanently delete Course ID:<strong>{courseId}</strong>?</p>
                <p className="warning-text">This action cannot be undone.</p>

                {message.text && (
                    <div className={`message-box ${message.isError ? 'error-neon' : 'success-neon'}`}>
                        {message.text}
                    </div>
                )}

                <div className="form-actions" style={{justifyContent: 'space-between'}}>
                    <button 
                        type="button" 
                        className="btn-delete-neon" 
                        onClick={handleDelete}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Deleting...' : 'Delete Permanently'}
                    </button>
                    <button 
                        type="button" 
                        className="btn-secondary-neon" 
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TeacherCourses;