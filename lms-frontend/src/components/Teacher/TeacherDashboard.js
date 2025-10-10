import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaSignOutAlt, FaChalkboardTeacher, FaUserPlus, FaTasks, FaGraduationCap, FaListAlt, FaCalendarAlt, FaUniversity, FaArrowRight, FaClock, FaBars, FaTimes, FaPlusCircle, FaUsers, FaIdCard, FaEnvelope, FaToolbox, FaRegCommentDots, FaThumbsUp } from 'react-icons/fa';
import './TeacherDashboard.css';
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from 'react-router-dom';

// ----------------------------------------------------------------------
// 1. GLOBAL/IN-MEMORY CACHE SIMULATION
// This object will persist data across unmounts/mounts within the session.
// In a production app, replace this with a proper global state manager (e.g., Redux, Zustand, or a dedicated Data Context).
let dashboardCache = {
    data: null,
    isLoaded: false,
};
// ----------------------------------------------------------------------


// --- REUSABLE COMPONENTS (OMITTED FOR BREVITY, NO CHANGES) ---
const QuickActionButton = ({ icon, label, onClick, className = '' }) => (
    <button className={`btn-action-neon btn-quick-action ${className}`} onClick={onClick}>
        {icon} {label}
    </button>
);

const DashboardCard = ({ title, icon, value, description, to, onClick, className = '' }) => {
    const CardElement = to ? Link : 'div';
    const props = to ? { to, className: `widget-card action-card ${className}` } : { onClick, className: `widget-card action-card ${className}` };

    return (
        <CardElement {...props}>
            <div className="card-header-icon">{icon}</div>
            <div className="card-content">
                <p className="card-value">{value}</p>
                <h3 className="card-title">{title}</h3>
                <p className="card-description-sm">{description}</p>
            </div>
            {(onClick || to) && <FaArrowRight className="card-action-arrow" />}
        </CardElement>
    );
};

const PendingSubmissionsCard = ({ totalPending, uniqueCourses }) => {
    return (
        <DashboardCard 
            title="Pending Grading"
            icon={<FaTasks />}
            value={totalPending}
            description={`Across ${uniqueCourses} course${uniqueCourses !== 1 ? 's' : ''}`}
            to="/teacher/grading" 
            className="pending-grading-card"
        />
    );
};

const RecentEnrollments = ({ enrollments }) => {
    return (
        <div className="widget-card recent-enrollments-widget">
            <h3 className="widget-title"><FaUserPlus /> Recent Enrollments</h3>
            <div className="widget-content">
                {enrollments.length > 0 ? (
                    enrollments.slice(0, 4).map((enrollment, index) => (
                        <div key={index} className="enrollment-item">
                            <span className="student-name-small">{enrollment.studentName}</span>
                            <span className="enrollment-meta">
                                <span className="course-tag-small">{enrollment.courseTitle}</span>
                                <span className="date-tag">
                                    <FaCalendarAlt /> {new Date(enrollment.enrollmentDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}
                                </span>
                            </span>
                        </div>
                    ))
                ) : (
                    <p className="widget-empty">No new enrollments to report.</p>
                )}
            </div>
        </div>
    );
};

const RecentPostsWidget = ({ posts }) => {
    return (
        <div className="widget-card recent-posts-widget">
            <h3 className="widget-title"><FaRegCommentDots /> Recent Forum Activity</h3>
            <div className="widget-content">
                {posts.length > 0 ? (
                    posts.slice(0, 4).map((post, index) => (
                        <div key={index} className="post-item">
                            <span className="post-content-snippet" title={post.contentSnippet}>
                                <strong>{post.posterName}:</strong> {post.contentSnippet}
                            </span>
                            <span className="post-meta">
                                <span className="course-tag-small">{post.courseTitle}</span>
                                <span className="like-count"><FaThumbsUp /> {post.likesCount}</span>
                            </span>
                        </div>
                    ))
                ) : (
                    <p className="widget-empty">No recent posts in your course forums.</p>
                )}
            </div>
        </div>
    );
};

const CourseSummaryList = ({ courses }) => {
    return (
        <section className="dashboard-section core-section course-summary-section">
            <h2 className="section-title-neon">📚 My Courses Taught</h2>
            <div className="course-list-table">
                <div className="table-header">
                    <span className="col-title">Course Title</span>
                    <span className="col-duration">Duration</span>
                    <span className="col-students">Students</span>
                    <span className="col-actions">Actions</span>
                </div>
                {courses.length > 0 ? (
                    courses.map(course => (
                        <div key={course.id} className="table-row">
                            <span className="col-title">{course.title}</span>
                            <span className="col-duration"><FaClock /> {course.duration}</span>
                            <span className="col-students"><FaUsers /> {course.students}</span>
                            <span className="col-actions">
                                <Link className="btn-view-course" to={`/teacher/course/${course.id}/details`}>
                                    <FaChalkboardTeacher /> Manage
                                </Link>
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">You are not currently teaching any courses.</div>
                )}
            </div>
        </section>
    );
};
// --- END REUSABLE COMPONENTS ---


// --- TEACHER DASHBOARD MAIN COMPONENT ---
const TeacherDashboard = () => {
    const { name, email, userId, role, token, logout } = useAuth();
    const navigate = useNavigate();

    // 2. STATE INITIALIZATION: Check cache first
    const [dashboardData, setDashboardData] = useState(
        dashboardCache.data || {
            totalCourses: 0,
            pendingGrading: 0,
            totalStudents: 0,
            myCourses: [],
            recentEnrollments: [],
            recentPosts: [],
        }
    );
    
    // 3. LOADING STATE: Set to true ONLY if the cache is NOT loaded
    const [loading, setLoading] = useState(!dashboardCache.isLoaded);
    const [error, setError] = useState(null);

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const API_URL = 'http://localhost:3000/api/teacherdashboard/dashboard'; 

    // 4. MODIFIED FETCH DATA EFFECT
    useEffect(() => {
        // If data is already loaded in the cache, skip the API call.
        if (dashboardCache.isLoaded) {
            // State is already initialized from cache, just ensure loading is false
            setLoading(false); 
            return;
        }

        const fetchDashboardData = async () => {
            if (!token) {
                setLoading(false);
                setError('Authentication token missing.');
                return;
            }
            
            // Set loading *before* the fetch, as we know the cache is empty
            setLoading(true); 

            try {
                const response = await fetch(API_URL, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch dashboard data.');
                }

                const data = await response.json();
                
                // 5. SUCCESS: Update component state AND the cache
                const fetchedData = data.dashboard;
                setDashboardData(fetchedData); 
                
                dashboardCache.data = fetchedData;
                dashboardCache.isLoaded = true; // Mark cache as loaded
                
                setError(null);

            } catch (err) {
                console.error('API Fetch Error:', err);
                setError(err.message || 'An error occurred while loading data.');
                dashboardCache.isLoaded = false; // Keep it false on error
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
        
        // Dependency array: only re-fetch if token changes (i.e., user logs in/out)
    }, [token]);


    const { 
        totalCourses, 
        pendingGrading: totalPendingSubmissions, 
        totalStudents, 
        myCourses: teacherCourses = [], 
        recentEnrollments = [], 
        recentPosts = [], 
    } = dashboardData;
    
    const pendingGradingCourseCount = totalPendingSubmissions > 0 
        ? (teacherCourses.length > 0 ? teacherCourses.length : 1) 
        : 0;

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const handleLogout = () => {
        // IMPORTANT: Clear the cache on logout
        dashboardCache = { data: null, isLoaded: false };
        logout(); 
    };
    
    const handleCreateCourse = () => navigate('/teacher/courses/new');
    const handleGradeSubmissions = () => navigate('/teacher/grading');

    const handleProfileClick = () => setIsProfileModalOpen(true);
    const handleCloseProfileModal = () => setIsProfileModalOpen(false);
    
    const mainContentClass = `main-content-area ${!isSidebarOpen ? 'sidebar-closed-content' : ''}`;

    // --- Sub Components (ProfileModal, Navbar, Sidebar - No changes needed) ---
    const ProfileModal = ({ onClose }) => (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content profile-card-neon" onClick={e => e.stopPropagation()}>
                <h2 className="modal-title-neon"><FaUserCircle /> Teacher Profile</h2>
                <p className="subtitle-neon">Your LMS Access Panel</p>
                
                <div className="profile-detail-grid info-group-neon">
                    <p className="info-line-neon"><strong>Name:</strong> <span>{name}</span></p>
                    <p className="info-line-neon"><FaToolbox className="info-icon-neon" /> <strong>Role:</strong> <span>{role}</span></p>
                    <p className="info-line-neon"><FaEnvelope className="info-icon-neon" /> <strong>Email:</strong> <span>{email}</span></p>
                    <p className="info-line-neon"><FaIdCard className="info-icon-neon" /> <strong>User ID:</strong> <span>{userId}</span></p>
                    <p className="info-line-neon"><strong>Courses Teaching:</strong> <span>{totalCourses}</span></p>
                </div>
                
                <div className="neon-divider-dashboard"></div>

                <button className="btn-logout-neon modal-close-btn" onClick={handleLogout}>
                    <FaSignOutAlt className="logout-icon-neon" /> Secure Logout
                </button>
            </div>
        </div>
    );

    const TeacherDashboardNavbar = () => (
        <nav className="dashboard-navbar-neon">
            <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
                {isSidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <Link to="/teacher/" className="logo">
                <FaUniversity className="logo-icon"/> The Matrix Academy
            </Link>
            <div className="nav-profile-group">
                <span className="student-name" onClick={handleProfileClick}>
                    <FaUserCircle /> <strong>{name}</strong> ({role})
                </span>
                <button className="btn-logout-neon" onClick={handleLogout}>
                    <FaSignOutAlt /> Logout
                </button>
            </div>
        </nav>
    );

    const TeacherDashboardSidebar = () => (
        <aside className={`dashboard-sidebar-neon ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
            <div className="sidebar-header">TEACHER MENU</div>
            <nav className="sidebar-nav">
                <Link to="/teacher" className="nav-link active">
                    <FaListAlt /> <span className="link-text">Dashboard</span>
                </Link>
                <Link to="/teacher/courses" className="nav-link">
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
    // --- End Sub Components ---

    // --- Loading and Error State Rendering ---
    if (loading) {
        return (
            <div className="loading-state-neon">
                <FaClock className="loading-icon-spin" />
                <p>Loading Teacher Dashboard Data...</p>
                <div className="loading-bar-neon"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-state-neon">
                <FaTimes className="error-icon" />
                <h1>Data Fetch Error</h1>
                <p>Could not load dashboard data: {error}</p>
                <p>Please ensure you are logged in and the backend API is running at **`/api/teacherdashboard/dashboard`**.</p>
            </div>
        );
    }
    // --- End Loading and Error State Rendering ---


    return (
        <div className="app-container">
            <TeacherDashboardNavbar />
            <TeacherDashboardSidebar />

            <main className={mainContentClass}>
                
                <div className="welcome-banner dashboard-section">
                    <h1 className="section-title-neon">Welcome, {name}!</h1>
                    <p className="section-subtitle-neon">Your Command Center for all courses and student tasks.</p>
                </div>

                <div className="quick-actions-bar">
                    <QuickActionButton 
                        icon={<FaPlusCircle />} 
                        label="Create New Course" 
                        onClick={handleCreateCourse} 
                        className="create-course"
                    />
                    <QuickActionButton 
                        icon={<FaGraduationCap />} 
                        label={`Grade ${totalPendingSubmissions} Submissions`} 
                        onClick={handleGradeSubmissions} 
                    />
                </div>

                <div className="high-level-summary-grid">
                    <DashboardCard
                        title="Total Courses"
                        icon={<FaChalkboardTeacher />}
                        value={totalCourses}
                        description="Active courses this semester"
                        to="/teacher/courses"
                    />

                    <PendingSubmissionsCard 
                        totalPending={totalPendingSubmissions}
                        uniqueCourses={pendingGradingCourseCount}
                    />
                    
                    <DashboardCard
                        title="Total Students"
                        icon={<FaUsers />}
                        value={totalStudents}
                        description="Students enrolled across all courses"
                        to="/teacher/students"
                    />
                </div>

                <div className="secondary-widgets-container">
                    <CourseSummaryList 
                        courses={teacherCourses} 
                    />
                    <div className="side-by-side-widgets">
                        <RecentEnrollments 
                            enrollments={recentEnrollments}
                        />
                        <RecentPostsWidget 
                            posts={recentPosts}
                        />
                    </div>
                </div>

            </main>
            {isProfileModalOpen && <ProfileModal onClose={handleCloseProfileModal} />}
        </div>
    );
};

export default TeacherDashboard;