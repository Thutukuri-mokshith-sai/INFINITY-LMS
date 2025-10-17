import React, { useState, useEffect } from 'react';
import {
    FaUniversity, FaBookOpen, FaUserCircle, FaSignOutAlt, FaBars, FaTimes,
    FaListAlt, FaStar, FaArrowRight, FaClock, FaSpinner, FaCalendarAlt, FaSearch
} from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import './StudentDashboard.css'; // Assuming shared styles
import { useAuth } from "../../context/AuthContext";

// --- Configuration ---
const API_BASE_URL = 'https://lms-backend-foaq.onrender.com/api';

// --- INLINE STYLES FOR NEW/ENHANCED COMPONENTS (Copy from previous file) ---
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
    sortDropdown: {
        padding: '10px 15px',
        borderRadius: '5px',
        border: '1px solid #39ff14',
        backgroundColor: '#001a1a',
        color: '#39ff14',
        fontSize: '16px',
        boxShadow: '0 0 5px rgba(57, 255, 20, 0.5)',
        cursor: 'pointer',
        appearance: 'none',
    },
    searchIcon: {
        color: '#0ff',
        fontSize: '18px',
    },
};

// ---------------------------------------------------------------------
// --- REUSED COMPONENTS ---
// ---------------------------------------------------------------------

const ProfileModal = ({ authData, onClose }) => {
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
        <div className="logo"><FaUniversity className="logo-icon" /> INFINITY  LMS</div>
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
            {/* Set active class for My Courses link */}
            <Link to="/student/my-courses" className="nav-link active"><FaBookOpen /> <span className="link-text">My Courses</span></Link>
            <Link to="/student/courses" className="nav-link"><FaUniversity /> <span className="link-text">Enroll Courses</span></Link>
            <Link to="/student/grades" className="nav-link"><FaStar /> <span className="link-text">Grades</span></Link>
            <Link to="/student/disucusion" className="nav-link"><FaStar /> <span className="link-text">Discusion Forum</span></Link>
            <Link to="/student/profile" className="nav-link"><FaUserCircle /> <span className="link-text">Profile</span></Link>
        </nav>
    </aside>
);

// New CourseCard for Enrolled Courses - includes enrollment date and teacher info
const EnrolledCourseCard = ({ course }) => {
    // Assuming the enrollment date is available through the 'Enrollment' object in the course data
    const enrollmentDate = course.Enrollment?.enrollmentDate
        ? new Date(course.Enrollment.enrollmentDate).toLocaleDateString()
        : 'N/A';
    
    const teacherName = course.Teacher?.name || 'Instructor N/A';

    return (
        <div className="course-card-neon enrolled">
            <h4 className="card-title">{course.title}</h4>
            <p className="card-description">{course.description.substring(0, 100)}...</p>
            <div className="card-meta">
                <span><FaClock /> Duration: {course.duration || 'N/A'}</span>
                <span><FaUserCircle /> Teacher: {teacherName}</span>
            </div>
            <div className="card-meta-bottom">
                   <span className="enrollment-date"><FaCalendarAlt /> Enrolled: {enrollmentDate}</span>
            </div>
            {/* 💡 CHANGE: Use Link to navigate to the course details page */}
            <Link to={`/student/my-courses/${course.id}`} className="btn-action-neon btn-view">
                <FaArrowRight /> Go to Course
            </Link>
        </div>
    );
};
// ---------------------------------------------------------------------

/**
 * MyCourses Component
 * Fetches and displays a list of courses the student is currently enrolled in.
 * NOW INCLUDES SEARCH AND SORT.
 */
const MyCourses = () => {
    const auth = useAuth();
    const navigate = useNavigate();
    
    const { user, logout, token } = auth;
    const studentName = user?.name || 'Student';

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    
    const [allEnrolledCourses, setAllEnrolledCourses] = useState([]); // Renamed for clarity
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // NEW STATE for search/filter and sorting
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('enroll_date_dsc'); // Default: Newest enrollment first


    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const toggleProfile = () => setIsProfileOpen(prev => !prev);
    
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // --- API Fetch Logic: Get My Enrolled Courses ---
    useEffect(() => {
        const fetchEnrolledCourses = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                if (!token) {
                    setError("Authentication required. Please log in.");
                    setIsLoading(false);
                    navigate('/login');
                    return;
                }

                // TARGET ENDPOINT: /api/enrollments/my-courses
                const response = await fetch(`${API_BASE_URL}/enrollments/my-courses`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`, // Include JWT token
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch enrolled courses.');
                }

                const data = await response.json();
                
                // The backend response structure: { data: { courses: [...] } }
                setAllEnrolledCourses(data.data.courses || []);

            } catch (err) {
                console.error("Enrolled course fetch error:", err);
                setError(err.message || 'An unexpected error occurred while loading your courses.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchEnrolledCourses();
    }, [token, navigate]);


    // Filter and Sort Courses Logic
    const displayedCourses = allEnrolledCourses
        .filter(course => {
            // Search Filter: Title or Description
            const matchesSearch = 
                course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.description.toLowerCase().includes(searchTerm.toLowerCase());
            
            return matchesSearch;
        })
        .sort((a, b) => {
            // Helper function to safely get enrollment date for sorting
            const getDate = (course) => course.Enrollment?.enrollmentDate ? new Date(course.Enrollment.enrollmentDate).getTime() : 0;

            const titleA = a.title.toLowerCase();
            const titleB = b.title.toLowerCase();
            const dateA = getDate(a);
            const dateB = getDate(b);


            if (sortOption === 'title_asc') {
                return titleA < titleB ? -1 : titleA > titleB ? 1 : 0;
            } else if (sortOption === 'title_dsc') {
                return titleA > titleB ? -1 : titleA < titleB ? 1 : 0;
            } else if (sortOption === 'enroll_date_asc') {
                return dateA - dateB; // Oldest first
            } else if (sortOption === 'enroll_date_dsc') {
                return dateB - dateA; // Newest first (Default)
            }
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
                        <h1 className="section-title-neon">🎓 My Enrolled Courses</h1>
                        <p className="section-subtitle-neon">Continue your learning journey where you left off!</p>
                    </div>

                    <section className="dashboard-section core-section">
                        <h2 className="section-title-neon">Your Active Enrollments</h2>

                        {/* Filter/Search & Sort Bar (Using inline styles) */}
                        <div style={neonStyles.filterBar}>
                            <FaSearch style={neonStyles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search courses by title or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={neonStyles.searchInput}
                            />

                            {/* Sort Dropdown */}
                            <select
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                                style={neonStyles.sortDropdown}
                                title="Sort Courses"
                            >
                                <option value="enroll_date_dsc">Enroll Date (Newest)</option>
                                <option value="enroll_date_asc">Enroll Date (Oldest)</option>
                                <option value="title_asc">Title (A-Z)</option>
                                <option value="title_dsc">Title (Z-A)</option>
                            </select>
                        </div>
                        {/* --- */}
                        
                        {isLoading && (
                            <div className="loading-state">
                                <FaSpinner className="spinner" /> 
                                <p>Loading your courses...</p>
                            </div>
                        )}

                        {error && (
                            <div className="error-state">
                                <p>Error: {error}</p>
                                <p>Please try again or check your network connection.</p>
                            </div>
                        )}

                        {!isLoading && !error && displayedCourses.length > 0 ? (
                            <div className="courses-grid">
                                {displayedCourses.map(course => (
                                    <EnrolledCourseCard 
                                        key={course.id}
                                        course={course}
                                    />
                                ))}
                            </div>
                        ) : (!isLoading && !error && (
                            <div className="widget-card widget-empty-state">
                                <p>No courses found matching your criteria. You might not be enrolled in any yet!</p>
                                <Link to="/student/courses" className="btn-action-neon">
                                    <FaUniversity /> Enroll in a New Course
                                </Link>
                            </div>
                        ))}
                    </section>
                </main>
            </div>
        </>
    );
};

export default MyCourses;