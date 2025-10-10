import React, { useState, useEffect } from 'react';
import { 
    FaUserCircle, FaSignOutAlt, FaBookOpen, FaClipboardList, 
    FaCheckCircle, FaStar, FaListAlt, FaCalendarAlt, FaUniversity, 
    FaArrowRight, FaClock, FaBars, FaTimes, FaEnvelope, FaToolbox, 
    FaIdCard, FaFileAlt, FaCommentDots, FaBell
} from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import './StudentDashboard.css'; // Assuming you have a CSS file for styling
import { useAuth } from "../../context/AuthContext"; 
import axios from 'axios'; // Import Axios for API calls

// --- API Configuration ---
// Assuming your API is running on localhost:3000 or the environment variable
const API_URL = process.env.REACT_APP_API_URL || 'https://lms-portal-backend-h5k8.onrender.com/api'; 

// ----------------------------------------------------------------------
// --- Utility Components (No changes needed) ---
// ----------------------------------------------------------------------

// Profile Modal Component
const ProfileModal = ({ authData, onClose }) => {
    const { name, email, userId, role, logout } = authData;
    const modalRef = React.useRef();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscapeKey);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [onClose]);

    return (
        <div className="profile-modal-backdrop" onClick={onClose}>
            <div className="profile-card-neon" ref={modalRef} onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}><FaTimes /></button>
                <FaUserCircle className="profile-icon-neon" />
                <h2 className="title-neon">Welcome, {name.split(' ')[0]}!</h2>
                <p className="subtitle-neon">Your LMS Access Panel</p>
                <div className="info-group-neon">
                    <p className="info-line-neon"><FaIdCard className="info-icon-neon" /><strong>ID:</strong> {userId}</p>
                    <p className="info-line-neon"><FaEnvelope className="info-icon-neon" /><strong>Email:</strong> {email}</p>
                    <p className="info-line-neon"><FaToolbox className="info-icon-neon" /><strong>Role:</strong> {role}</p>
                </div>
                <div className="neon-divider-dashboard"></div>
                <button onClick={logout} className="btn-logout-neon full-width-btn">
                    <FaSignOutAlt className="logout-icon-neon" /> Secure Logout
                </button>
            </div>
        </div>
    );
};

// Navbar Component
const DashboardNavbar = ({ studentName, onLogout, onProfileToggle, onSidebarToggle, isSidebarOpen }) => (
    
    <nav className="dashboard-navbar-neon">
        <button className="sidebar-toggle-btn" onClick={onSidebarToggle}>
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
        <div className="logo"><FaUniversity className="logo-icon" /> The Matrix Academy</div>
        <div className="nav-profile-group">
            <span className="student-name" onClick={onProfileToggle}><FaUserCircle /> {studentName}({useAuth().role})</span>
            <button className="btn-logout-neon" onClick={onLogout}><FaSignOutAlt /> Logout</button>
        </div>
    </nav>
);

// Sidebar Component
const DashboardSidebar = ({ isOpen }) => (
    <aside className={`dashboard-sidebar-neon ${!isOpen ? 'sidebar-closed' : ''}`}>
        <div className="sidebar-header">MENU</div>
        <nav className="sidebar-nav">
            <Link to="/student" className="nav-link"><FaListAlt /> <span className="link-text">Dashboard</span></Link>
            <Link to="/student/my-courses" className="nav-link"><FaBookOpen /> <span className="link-text">My Courses</span></Link>
            <Link to="/student/courses" className="nav-link"><FaUniversity /> <span className="link-text">Enroll Courses</span></Link>
            <Link to="/student/grades" className="nav-link"><FaStar /> <span className="link-text">Grades</span></Link>
            <Link to="/student/disucusion" className="nav-link"><FaCommentDots /> <span className="link-text">Discusion Forum</span></Link>
            <Link to="/student/profile" className="nav-link"><FaUserCircle /> <span className="link-text">Profile</span></Link>
        </nav>
    </aside>
);

// Course Card Component
const CourseCard = ({ course, actionType, onActionClick }) => {
    const isEnrolled = actionType === 'view';
    const progressText = isEnrolled ? `${course.progress}% Complete` : null;
    const progressValue = isEnrolled ? course.progress : 0;
    
    return (
        <div className={`course-card-neon ${isEnrolled ? 'enrolled' : 'available'}`}>
            <h4 className="card-title">{course.title}</h4>
            <p className="card-description">{course.description}</p>
            <div className="card-meta">
                <span><FaClock /> {course.duration}</span>
                {progressText && <span><FaCheckCircle /> {progressText}</span>}
            </div>
            {isEnrolled && (
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${progressValue}%` }}></div>
                </div>
            )}
            <button 
                className={`btn-action-neon ${isEnrolled ? 'btn-view' : 'btn-enroll'}`} 
                onClick={() => onActionClick(course)}
            >
                {isEnrolled ? (<><FaArrowRight /> View Course</>) : (<><FaBookOpen /> Enroll Now</>)}
            </button>
        </div>
    );
};

// ----------------------------------------------------------------------
// --- Widget Components (No changes needed) ---
// ----------------------------------------------------------------------

const PendingAssignmentsWidget = ({ pendingAssignments }) => (
    <div className="widget-card pending-assignments-widget">
        <h3 className="widget-title"><FaClipboardList /> Pending Assignments</h3>
        <div className="widget-content">
            {pendingAssignments.length > 0 ? (
                pendingAssignments.slice(0, 4).map(assignment => (
                    <div key={assignment.assignmentId} className="assignment-item">
                        <span className="assignment-name">{assignment.title}</span>
                        <span className="assignment-meta">
                            <span className="course-tag">{assignment.courseTitle}</span>
                            <span className="due-date"><FaCalendarAlt /> Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                        </span>
                    </div>
                ))
            ) : (
                <p className="widget-empty">All caught up! No pending assignments.</p>
            )}
        </div>
    </div>
);

const RecentGradesWidget = ({ recentGrades }) => (
    <div className="widget-card recent-grades-widget">
        <h3 className="widget-title"><FaStar /> Recent Grades</h3>
        <div className="widget-content">
            {recentGrades.length > 0 ? (
                recentGrades.slice(0, 4).map((grade, index) => (
                    <div key={index} className="grade-item">
                        <span className="grade-score">{grade.grade}/{grade.maxPoints}</span>
                        <div className="grade-details">
                            <span className="grade-name">{grade.assignmentTitle}</span>
                            <span className="grade-course">{grade.courseTitle} - {new Date(grade.gradedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))
            ) : (
                <p className="widget-empty">No recent grades to display.</p>
            )}
        </div>
    </div>
);

const RecentMaterialsWidget = ({ materials }) => (
    <div className="widget-card materials-widget">
        <h3 className="widget-title"><FaFileAlt /> Recent Materials</h3>
        <div className="widget-content">
            {materials.length > 0 ? (
                materials.map((m) => (
                    <div key={m.id} className="material-item">
                        <span className="material-name" title={m.title}>{m.title}</span>
                        <span className="material-meta">
                            <span className="course-tag">{m.courseTitle}</span>
                            <span className="file-type">({m.fileType || 'Link'})</span>
                            <span className="timestamp">{new Date(m.createdAt).toLocaleDateString()}</span>
                        </span>
                    </div>
                ))
            ) : (
                <p className="widget-empty">No new materials uploaded recently.</p>
            )}
        </div>
    </div>
);

const RecentThreadsWidget = ({ threads }) => (
    <div className="widget-card threads-widget">
        <h3 className="widget-title"><FaCommentDots /> Recent Discussions</h3>
        <div className="widget-content">
            {threads.length > 0 ? (
                threads.map((t) => (
                    <div key={t.id} className="thread-item">
                        <span className="thread-title" title={t.title}>{t.title}</span>
                        <span className="thread-meta">
                            <span className="course-tag">{t.courseTitle}</span>
                            <span className="author">by {t.createdBy}</span>
                            <span className="timestamp">{new Date(t.createdAt).toLocaleDateString()}</span>
                        </span>
                    </div>
                ))
            ) : (
                <p className="widget-empty">No recent discussion activity.</p>
            )}
        </div>
    </div>
);

const RecentNotificationsWidget = ({ notifications }) => (
    <div className="widget-card notifications-widget">
        <h3 className="widget-title"><FaBell /> Recent Notifications</h3>
        <div className="widget-content">
            {notifications.length > 0 ? (
                notifications.map((n) => (
                    <div key={n.id} className={`notification-item ${n.isRead ? 'read' : 'unread'}`}>
                        <span className="notification-message">{n.message}</span>
                        <span className="notification-meta">
                            <span className={`status-dot ${n.isRead ? 'read-dot' : 'unread-dot'}`}></span>
                            <span className="timestamp">{new Date(n.createdAt).toLocaleTimeString()}</span>
                        </span>
                    </div>
                ))
            ) : (
                <p className="widget-empty">No new notifications.</p>
            )}
        </div>
    </div>
);


// ----------------------------------------------------------------------
// --- Main StudentDashboard Component (UPDATED useEffect) ---
// ----------------------------------------------------------------------
const StudentDashboard = () => {
    const auth = useAuth();
    const navigate = useNavigate();
    
    const { name, email, userId, role, logout, token } = auth;
    
    // 1. New State for API data
    const [dashboardData, setDashboardData] = useState({
        enrolledCourses: [],
        availableCourses: [],
        pendingAssignments: [],
        recentMaterials: [],
        recentThreads: [],
        recentGrades: [],
        recentNotifications: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 2. API Call Effect - UPDATED for automatic redirection on 401/403 errors
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!token) {
                setLoading(false);
                // Redirect if token is missing (though useAuth might handle this upstream)
                if (!auth.isAuthenticated) navigate('/login');
                return;
            }
            try {
                const response = await axios.get(`${API_URL}/studentdashboard`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                // Set the entire dashboard object from the API response
                setDashboardData(response.data.dashboard); 
                setError(null);
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                
                // --- NEW REDIRECTION LOGIC ---
                const statusCode = err.response ? err.response.status : null;
                
                // If the error is 401 Unauthorized or 403 Forbidden, 
                // we assume the token is invalid/expired and redirect to login.
                if (statusCode === 401 || statusCode === 403) {
                    console.log("Unauthorized API access. Logging out and redirecting to login.");
                    
                    // Clear authentication state
                    logout(); 
                    
                    // Redirect the user
                    navigate('/login'); 
                    
                    // Prevent setting the on-screen error
                    return; 
                }
                // --- END NEW REDIRECTION LOGIC ---

                // Set a generic error for other failures (e.g., 500, network issues)
                setError("Failed to load dashboard data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    // Added 'logout' and 'navigate' to dependency array for correctness
    }, [token, logout, navigate, auth.isAuthenticated]);

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const toggleProfile = () => setIsProfileOpen(prev => !prev);

    // --- Navigation Handlers ---
    const handleEnroll = (course) => {
        navigate(`/enroll/${course.id}`); // Navigate to a dedicated enrollment page
    };

    const handleViewCourse = (course) => {
        navigate(`/student/my-courses/${course.id}`);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return <div className="loading-screen"><p>Loading Dashboard...</p></div>;
    }

    if (error) {
        // This will only be reached for errors other than 401/403 
        // (which trigger an immediate redirect inside useEffect)
        return <div className="error-screen"><p>Error: {error}</p></div>;
    }

    const mainContentClass = `main-content-area ${!isSidebarOpen ? 'sidebar-closed-content' : ''}`;

    // Destructure real data for use in JSX
    const { 
        enrolledCourses, 
        availableCourses, 
        pendingAssignments,
        recentMaterials,
        recentThreads,
        recentGrades,
        recentNotifications
    } = dashboardData;

    return (
        <>
            {/* Profile Modal */}
            {isProfileOpen && (
                <ProfileModal 
                    authData={{ name, email, userId, role, logout: handleLogout }} 
                    onClose={toggleProfile} 
                />
            )}

            <div className="app-container">
                {/* Navbar */}
                <DashboardNavbar 
                    studentName={name} 
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
                        <h1 className="section-title-neon">Welcome Back, {name.split(' ')[0]}!</h1>
                        <p className="section-subtitle-neon">Here is an immediate overview of your academic life.</p>
                    </div>

                    {/* Enrolled Courses */}
                    <section className="dashboard-section core-section">
                        <h2 className="section-title-neon">📚 My Enrolled Courses</h2>
                        <div className="courses-grid">
                            {enrolledCourses.length > 0 ? (
                                enrolledCourses.map(course => (
                                    <CourseCard 
                                        key={course.id}
                                        course={course}
                                        actionType="view"
                                        onActionClick={handleViewCourse}
                                    />
                                ))
                            ) : (
                                <p className="widget-empty full-width-message">You are not currently enrolled in any courses. Explore below!</p>
                            )}
                        </div>
                    </section>
                    
                    {/* Action Items & Progress */}
                    <section className="dashboard-section">
                        <h2 className="section-title-neon">🗂️ Action Items & Progress</h2>
                        <div className="secondary-widgets-container">
                            <PendingAssignmentsWidget pendingAssignments={pendingAssignments} />
                            <RecentGradesWidget recentGrades={recentGrades} />
                        </div>
                    </section>

                    {/* Recent Activity Widgets */}
                    <section className="dashboard-section recent-activity-section">
                        <h2 className="section-title-neon">⏱️ Recent Activity</h2>
                        <div className="tertiary-widgets-container">
                            <RecentMaterialsWidget materials={recentMaterials} />
                            <RecentThreadsWidget threads={recentThreads} />
                            <RecentNotificationsWidget notifications={recentNotifications} />
                        </div>
                    </section>

                    {/* Available Courses */}
                    <section className="dashboard-section featured-section">
                        <h2 className="section-title-neon">🚀 Available Courses</h2>
                        <p className="section-subtitle-neon">Expand your mind with new opportunities.</p>
                        <div className="courses-grid">
                            {availableCourses.length > 0 ? (
                                availableCourses.map(course => (
                                    <CourseCard 
                                        key={course.id}
                                        course={course}
                                        actionType="enroll"
                                        onActionClick={handleEnroll}
                                    />
                                ))
                            ) : (
                                <p className="widget-empty full-width-message">No additional courses are currently available for enrollment.</p>
                            )}
                        </div>
                    </section>

                </main>
            </div>
        </>
    );
};

export default StudentDashboard;