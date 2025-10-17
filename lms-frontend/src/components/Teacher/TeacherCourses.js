import React, { useState, useEffect } from 'react';
import { FaChalkboardTeacher, FaPlusCircle, FaEdit, FaTrash, FaClock, FaCalendarAlt, FaTimes, FaBars, FaUniversity, FaUserCircle, FaSignOutAlt, FaListAlt, FaGraduationCap, FaSpinner, FaInfoCircle, FaSearch } from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import axios from 'axios';
import './TeacherCourses.css';

// ----------------------------------------------------------------------
// 1. GLOBAL/IN-MEMORY CACHE SIMULATION
let courseCache = {
    data: null,
    isLoaded: false,
};
// ----------------------------------------------------------------------

// --- INLINE STYLES FOR NEW/ENHANCED COMPONENTS ---
const neonStyles = {
    filterBar: {
        display: 'flex',
        gap: '15px',
        marginBottom: '30px',
        marginTop: '20px',
        padding: '15px',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: '10px',
        border: '1px solid #ff073a',
        boxShadow: '0 0 10px rgba(255, 7, 58, 0.5)',
        alignItems: 'center',
    },
    searchInput: {
        flexGrow: 1,
        padding: '10px 15px',
        borderRadius: '5px',
        border: '1px solid #ff073a',
        backgroundColor: '#1a000a',
        color: '#fff',
        fontSize: '16px',
        boxShadow: '0 0 5px rgba(255, 7, 58, 0.3)',
        outline: 'none',
        transition: 'border-color 0.3s, box-shadow 0.3s',
        minWidth: '250px',
    },
    sortDropdown: {
        padding: '10px 15px',
        borderRadius: '5px',
        border: '1px solid #39ff14',
        backgroundColor: '#1a000a',
        color: '#39ff14',
        fontSize: '16px',
        boxShadow: '0 0 5px rgba(57, 255, 20, 0.5)',
        cursor: 'pointer',
        appearance: 'none',
    },
    searchIcon: {
        color: '#ff073a',
        fontSize: '18px',
    },
};
// ----------------------------------------------------------------------

// --- API FUNCTIONS (Unchanged) ---
const API_URL = process.env.REACT_APP_API_URL || 'https://lms-backend-foaq.onrender.com/api';

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

// --- MAIN COMPONENT ---
const TeacherCourses = () => {
    const { isAuthenticated, name, role, logout, token } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const forceReload = location.state?.courseCreated === true; 
    
    // 2. STATE INITIALIZATION: Check cache first, but override if forced
    const initialLoadingState = forceReload ? true : !courseCache.isLoaded;
    const initialCoursesState = forceReload ? [] : courseCache.data;

    const [allCourses, setAllCourses] = useState(initialCoursesState || []); // Renamed for clarity
    const [isLoading, setIsLoading] = useState(initialLoadingState);
    const [error, setError] = useState(null);
    
    // 💡 NEW STATE for search/sort
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('date_dsc'); // 'date_dsc', 'date_asc', 'title_asc', 'title_dsc'

    // UI State for Modals/Forms (Unchanged)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingCourseId, setDeletingCourseId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [modalMessage, setModalMessage] = useState({ text: '', isError: false });
    const [activeViewId, setActiveViewId] = useState(null);

    // --- FETCH DATA LOGIC (Modified to use caching and forceReload) ---
    const fetchCourses = async () => { 
        if (!token) {
            setIsLoading(false);
            return;
        }

        // 3. Conditional Cache Use: Only use cache if it's loaded AND we aren't forcing a reload.
        if (courseCache.isLoaded && !forceReload) { 
            setIsLoading(false);
            setAllCourses(courseCache.data);
            return;
        }

        // If we reach here, we are fetching data
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiGetTeacherCourses(token);
            
            // Update component state AND the cache
            setAllCourses(data);
            courseCache.data = data;
            courseCache.isLoaded = true;

        } catch (err) {
            setError(err.message);
            courseCache.isLoaded = false;
        } finally {
            setIsLoading(false);
            
            // Cleanup: Clear the navigation state after reload to prevent future reloads
            if (forceReload) {
                 navigate(location.pathname, { replace: true, state: {} });
            }
        }
    };

    // Initial data fetch
    useEffect(() => {
        fetchCourses();
    }, [token, forceReload]); 

    // --- HANDLERS (Adjusted cache clear for mutation/logout) ---
    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    
    const handleLogout = () => {
        // Clear cache on logout
        courseCache = { data: null, isLoaded: false };
        logout(); 
    };

    // --- EDIT COURSE HANDLERS (Cache update added) ---
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
        setActiveViewId(null);
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
            
            setAllCourses(prevCourses => {
                const newCourses = prevCourses.map(c => 
                    c.id === updatedCourse.id ? updatedCourse : c
                );
                // Update the cache immediately after successful mutation
                courseCache.data = newCourses; 
                return newCourses;
            });

            setModalMessage({ text: 'Course updated successfully! Redirecting...', isError: false });
            
            setTimeout(closeEditModal, 1500);

        } catch (err) {
            setModalMessage({ text: err.message, isError: true });
        }
    };

    // --- DELETE COURSE HANDLERS (Cache update added) ---
    const openDeleteModal = (courseId) => { 
        setDeletingCourseId(courseId);
        setModalMessage({ text: '', isError: false });
        setShowDeleteModal(true);
        setShowEditModal(false); 
        setEditingCourse(null);
        setActiveViewId(null);
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
            
            setAllCourses(prevCourses => {
                const newCourses = prevCourses.filter(c => c.id !== deletingCourseId);
                // Update the cache immediately after successful mutation
                courseCache.data = newCourses; 
                return newCourses;
            });
            
            setModalMessage({ text: 'Course deleted successfully!', isError: false });
            
            setTimeout(closeDeleteModal, 1000);

        } catch (err) {
            setModalMessage({ text: err.message, isError: true });
        }
    };

    // --- HANDLER: Navigate to View Course Details (Unchanged) ---
    const handleViewCourseDetails = (courseId) => {
        closeEditModal();
        closeDeleteModal();
        setActiveViewId(courseId); 
        navigate(`/teacher/course/${courseId}/details`);
    };
    // ------------------------------------

    // 💡 NEW: Filtering and Sorting Logic
    const displayedCourses = allCourses
        .filter(course => {
            // Search Filter: Title or Description
            const matchesSearch = 
                course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.description.toLowerCase().includes(searchTerm.toLowerCase());
            
            return matchesSearch;
        })
        .sort((a, b) => {
            const titleA = a.title.toLowerCase();
            const titleB = b.title.toLowerCase();
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();

            if (sortOption === 'title_asc') {
                return titleA < titleB ? -1 : titleA > titleB ? 1 : 0;
            } else if (sortOption === 'title_dsc') {
                return titleA > titleB ? -1 : titleA < titleB ? 1 : 0;
            } else if (sortOption === 'date_asc') {
                return dateA - dateB; // Oldest first
            } else if (sortOption === 'date_dsc') {
                return dateB - dateA; // Newest first (Default)
            }
            return 0;
        });

    // --- SUB-COMPONENTS (Unchanged) ---
    const CourseNavbar = () => ( 
        <nav className="dashboard-navbar-neon">
            <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
                {isSidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <div className="logo"><FaUniversity className="logo-icon"/>INFINITY  LMS</div>
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

    // --- UI RENDERINGS ---
    const mainContentClass = `main-content-area ${!isSidebarOpen ? 'sidebar-closed-content' : ''}`;

    if (!isAuthenticated || role !== 'Teacher') {
        return <div className="app-container">Unauthorized Access. Please log in as a Teacher.</div>;
    }

    const activeEditId = editingCourse ? editingCourse.id : null;
    const activeDeleteId = deletingCourseId;
    const activeNavId = activeViewId; 

    const isAnyModalOpen = showEditModal || showDeleteModal; 

    return (
        <div className="app-container">
            <CourseNavbar />
            <CourseSidebar />

            <main className={mainContentClass}>
                <div className="dashboard-section">
                    <h1 className="form-title-neon section-title-neon"><FaChalkboardTeacher /> My Courses</h1>
                    <p className="form-subtitle section-subtitle-neon">Manage your created courses, update details, or view course specifics.</p>
                    
                    <Link to="/teacher/courses/new" className="btn-primary-neon new-course-link">
                        <FaPlusCircle /> Create New Course
                    </Link>

                    {/* 💡 NEW: Filter/Search & Sort Bar */}
                    <div style={neonStyles.filterBar}>
                        <FaSearch style={neonStyles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search courses by title or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={neonStyles.searchInput}
                            disabled={isLoading}
                        />

                        {/* Sort Dropdown */}
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            style={neonStyles.sortDropdown}
                            title="Sort Courses"
                            disabled={isLoading}
                        >
                            <option value="date_dsc">Date Created (Newest)</option>
                            <option value="date_asc">Date Created (Oldest)</option>
                            <option value="title_asc">Title (A-Z)</option>
                            <option value="title_dsc">Title (Z-A)</option>
                        </select>
                    </div>
                    {/* -------------------------------------- */}

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
                            {displayedCourses.length === 0 ? (
                                <div className="message-box secondary-neon" style={{gridColumn: '1 / -1'}}>
                                    {searchTerm ? 
                                        'No courses found matching your search criteria.' :
                                        "You haven't created any courses yet. Start with a new one!"
                                    }
                                </div>
                            ) : (
                                displayedCourses.map(course => (
                                    <CourseCard 
                                        key={course.id} 
                                        course={course} 
                                        openEditModal={openEditModal} 
                                        openDeleteModal={openDeleteModal} 
                                        handleViewCourseDetails={handleViewCourseDetails} 
                                        isEditing={activeEditId === course.id}
                                        isDeleting={activeDeleteId === course.id}
                                        isNavigating={activeNavId === course.id}
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
        </div>
    );
};

// ----------------------------------------------------------------------------------
// --- HELPER COMPONENTS (Unchanged - included for completeness) ---
// ----------------------------------------------------------------------------------

const CourseCard = ({ course, openEditModal, openDeleteModal, handleViewCourseDetails, isEditing, isDeleting, isNavigating, isAnyModalOpen }) => {
    const showViewButton = !isAnyModalOpen || isNavigating;
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