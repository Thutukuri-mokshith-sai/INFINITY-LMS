import React, { useState, useEffect } from 'react';
import {
    FaUniversity, FaBookOpen, FaUserCircle, FaSignOutAlt, FaBars, FaTimes,
    FaListAlt, FaStar, FaArrowRight, FaClock, FaSpinner, FaSearch
} from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import './StudentDashboard.css'; // Assuming shared styles
import { useAuth } from "../../context/AuthContext";

// --- Configuration ---
const API_BASE_URL = 'https://lms-backend-foaq.onrender.com/api';

// --- INLINE STYLES FOR NEW/ENHANCED COMPONENTS ---
const neonStyles = {
    filterBar: {
        display: 'flex',
        gap: '15px',
        marginBottom: '30px',
        padding: '15px',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: '10px',
        border: '1px solid #0ff',
        boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
        alignItems: 'center',
    },
    searchInput: {
        flexGrow: 1,
        padding: '10px 15px',
        borderRadius: '5px',
        border: '1px solid #0ff',
        backgroundColor: '#001a1a',
        color: '#fff',
        fontSize: '16px',
        boxShadow: '0 0 5px rgba(0, 255, 255, 0.3)',
        outline: 'none',
        transition: 'border-color 0.3s, box-shadow 0.3s',
        minWidth: '250px',
    },
    sortDropdown: { // New Style
        padding: '10px 15px',
        borderRadius: '5px',
        border: '1px solid #39ff14',
        backgroundColor: '#001a1a',
        color: '#39ff14',
        fontSize: '16px',
        boxShadow: '0 0 5px rgba(57, 255, 20, 0.5)',
        cursor: 'pointer',
        appearance: 'none', 
        // Note: Using a background image for a custom arrow in a production environment 
        // is recommended, but for simplicity here we'll rely on basic dropdown look.
        // background-image property removed as it relies on specific SVG data URI which can be complex.
        // If external CSS is available, this should be handled there.
    },
    searchIcon: {
        color: '#0ff',
        fontSize: '18px',
    },
    feedbackAlert: (type) => ({
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontWeight: 'bold',
        textAlign: 'center',
        border: `1px solid ${type === 'success' ? '#39ff14' : '#ff073a'}`,
        backgroundColor: `rgba(${type === 'success' ? '57, 255, 20' : '255, 7, 58'}, 0.1)`,
        color: type === 'success' ? '#39ff14' : '#ff073a',
        boxShadow: `0 0 10px ${type === 'success' ? '#39ff14' : '#ff073a'}`,
    }),
};

// --- REUSED COMPONENTS (kept the same) ---

const ProfileModal = ({ authData, onClose }) => {
    // A simplified placeholder for the modal structure
    const { name, logout } = authData;
    return (
        <div className="profile-modal-backdrop" onClick={onClose}>
            <div className="profile-card-neon" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}><FaTimes /></button>
                <h2 className="title-neon">Welcome, {name.split(' ')[0]}!</h2>
                <button onClick={logout} className="btn-logout-neon full-width-btn">
                    <FaSignOutAlt /> Secure Logout
                </button>
            </div>
        </div>
    );
};

const DashboardNavbar = ({ studentName, onLogout, onProfileToggle, onSidebarToggle, isSidebarOpen }) => (
    <nav className="dashboard-navbar-neon">
        <button className="sidebar-toggle-btn" onClick={onSidebarToggle}>
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
        <div className="logo"><FaUniversity className="logo-icon" />INFINITY LMS</div>
        <div className="nav-profile-group">
            <span className="student-name" onClick={onProfileToggle}><FaUserCircle /> {studentName}</span>
            <button className="btn-logout-neon" onClick={onLogout}><FaSignOutAlt /> Logout</button>
        </div>
    </nav>
);

const DashboardSidebar = ({ isOpen }) => (
    <aside className={`dashboard-sidebar-neon ${!isOpen ? 'sidebar-closed' : ''}`}>
        <div className="sidebar-header">MENU</div>
        <nav className="sidebar-nav">
            <Link to="/student" className="nav-link"><FaListAlt /> <span className="link-text">Dashboard</span></Link>
            <Link to="/student/my-courses" className="nav-link"><FaBookOpen /> <span className="link-text">My Courses</span></Link>
            <Link to="/student/courses" className="nav-link active"><FaUniversity /> <span className="link-text">Enroll Courses</span></Link>
            <Link to="/student/grades" className="nav-link"><FaStar /> <span className="link-text">Grades</span></Link>
            <Link to="/student/disucusion" className="nav-link"><FaStar /> <span className="link-text">Discusion Forum</span></Link>
            <Link to="/student/profile" className="nav-link"><FaUserCircle /> <span className="link-text">Profile</span></Link>
        </nav>
    </aside>
);

const CourseCard = ({ course, onActionClick, isEnrolling }) => {
    return (
        <div className="course-card-neon available">
            <h4 className="card-title">{course.title}</h4>
            <p className="card-description">{course.description}</p>
            {course.teacherName && (
                <p className="card-teacher">Taught by: {course.teacherName}</p>
            )}
            <div className="card-meta">
                <span><FaClock /> {course.duration || 'N/A'}</span>
            </div>
            <button
                className="btn-action-neon btn-enroll"
                onClick={() => onActionClick(course)}
                disabled={isEnrolling}
            >
                {isEnrolling ? <FaSpinner className="spinner" /> : <FaBookOpen />}
                {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
            </button>
        </div>
    );
};


/**
 * EnrollCourses Component
 * Fetches all courses and allows students to enroll in non-enrolled courses.
 * Includes new search/filter and sorting functionality.
 */
const EnrollCourses = () => {
    const auth = useAuth();
    const navigate = useNavigate();

    const { user, logout, token } = auth;
    const studentName = user?.name || 'Student';

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const [allCourses, setAllCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [enrollingCourseId, setEnrollingCourseId] = useState(null);
    const [enrollmentFeedback, setEnrollmentFeedback] = useState(null);
    
    // NEW STATE for search/filter and sorting
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('title_asc'); // 'title_asc', 'title_dsc'


    // IMPORTANT: Assuming user object has an enrolledCourseIds array for filtering
    const enrolledCourseIds = user?.enrolledCourseIds || [];

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const toggleProfile = () => setIsProfileOpen(prev => !prev);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // --- API Fetch Logic: Get ALL Courses (same as before) ---
    useEffect(() => {
        const fetchAllCourses = async () => {
            setIsLoading(true);
            setError(null);

            try {
                if (!token) {
                    setError("Authentication required. Please log in.");
                    setIsLoading(false);
                    navigate('/login');
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/courses`, { 
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch courses.');
                }

                const data = await response.json();
                setAllCourses(data.courses || data.data.courses || data); 

            } catch (err) {
                console.error("Course fetch error:", err);
                setError(err.message || 'An unexpected error occurred while loading courses.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllCourses();
    }, [token, navigate]);


    // --- Enrollment Handler (same as before) ---
    const handleEnroll = async (course) => {
        setEnrollingCourseId(course.id);
        setEnrollmentFeedback(null);

        try {
            const response = await fetch(`${API_BASE_URL}/enrollments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ courseId: course.id }),
            });

            const data = await response.json();

            if (!response.ok) {
                const message = data.message || `Failed to enroll in ${course.title}.`;
                setEnrollmentFeedback({ type: 'error', message });
                throw new Error(message);
            }

            // SUCCESS
            setEnrollmentFeedback({ type: 'success', message: `Successfully enrolled in ${course.title}! Redirecting to My Courses...` });

            // Remove the newly enrolled course from the list
            setAllCourses(prevCourses => prevCourses.filter(c => c.id !== course.id));
            
            // Navigate to My Courses after a short delay for feedback
            setTimeout(() => {
                navigate('/student/my-courses'); 
            }, 1500);


        } catch (err) {
            console.error('Enrollment Failed:', err.message);
            if (!enrollmentFeedback) {
                setEnrollmentFeedback({ type: 'error', message: err.message || 'An unexpected error occurred during enrollment.' });
            }
        } finally {
            setEnrollingCourseId(null);
        }
    };


    // Filter and Sort Courses Logic
    const availableAndFilteredCourses = allCourses
        .filter(course => {
            const isEnrolled = enrolledCourseIds.includes(course.id);
            
            const matchesSearch = 
                course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.description.toLowerCase().includes(searchTerm.toLowerCase());
            
            return !isEnrolled && matchesSearch;
        })
        .sort((a, b) => {
            const titleA = a.title.toLowerCase();
            const titleB = b.title.toLowerCase();

            if (sortOption === 'title_asc') {
                return titleA < titleB ? -1 : titleA > titleB ? 1 : 0;
            } else if (sortOption === 'title_dsc') {
                return titleA > titleB ? -1 : titleA < titleB ? 1 : 0;
            }
            // Default to no sorting or custom ID sorting
            return 0;
        });

    const mainContentClass = `main-content-area ${!isSidebarOpen ? 'sidebar-closed-content' : ''}`;

    return (
        <>
            {/* Profile Modal */}
            {isProfileOpen && (
                <ProfileModal
                    authData={{ name: studentName, email: user?.email, userId: user?.id, role: user?.role, logout: handleLogout }}
                    onClose={toggleProfile}
                />
            )}

            <div className="app-container">
                {/* Navbar */}
                <DashboardNavbar
                    studentName={studentName}
                    onLogout={handleLogout}
                    onProfileToggle={toggleProfile}
                    onSidebarToggle={toggleSidebar}
                    isSidebarOpen={isSidebarOpen}
                />

                {/* Sidebar */}
                <DashboardSidebar isOpen={isSidebarOpen} />

                {/* Main Content */}
                <main className={mainContentClass}>
                    <div className="welcome-banner dashboard-section">
                        <h1 className="section-title-neon">📚 Enroll in New Courses</h1>
                        <p className="section-subtitle-neon">Discover and start learning new skills!</p>
                    </div>
                    
                    {/* Enrollment Feedback Section */}
                    {enrollmentFeedback && (
                        <div style={neonStyles.feedbackAlert(enrollmentFeedback.type)}>
                            {enrollmentFeedback.message}
                        </div>
                    )}
                    
                    <section className="dashboard-section core-section">
                        <h2 className="section-title-neon">Available Courses for You</h2>

                        {/* Filter/Search & Sort Bar */}
                        <div style={neonStyles.filterBar}>
                            <FaSearch style={neonStyles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search by title or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={neonStyles.searchInput}
                            />

                            {/* NEW: Sort Dropdown */}
                            <select
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                                style={neonStyles.sortDropdown}
                                title="Sort Courses"
                            >
                                <option value="title_asc">Sort (A-Z)</option>
                                <option value="title_dsc">Sort (Z-A)</option>
                                {/* Add more sorting options here (e.g., duration, popularity) */}
                            </select>
                            {/* --- */}

                        </div>


                        {isLoading && (
                            <div className="loading-state">
                                <FaSpinner className="spinner" />
                                <p>Loading courses from The Matrix...</p>
                            </div>
                        )}

                        {error && (
                            <div className="error-state">
                                <p>Error: {error}</p>
                                <p>Please try again or check your network connection.</p>
                            </div>
                        )}

                        {!isLoading && !error && availableAndFilteredCourses.length > 0 ? (
                            <div className="courses-grid">
                                {availableAndFilteredCourses.map(course => (
                                    <CourseCard
                                        key={course.id}
                                        course={course}
                                        onActionClick={handleEnroll}
                                        isEnrolling={enrollingCourseId === course.id} 
                                    />
                                ))}
                            </div>
                        ) : (!isLoading && !error && (
                            <div className="widget-card widget-empty-state">
                                <p>No courses found matching your criteria. You might be enrolled in all of them!</p>
                            </div>
                        ))}
                    </section>
                </main>
            </div>
        </>
    );
};

export default EnrollCourses;