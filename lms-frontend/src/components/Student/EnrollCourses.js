import React, { useState, useEffect } from 'react';
import {
    FaUniversity, FaBookOpen, FaUserCircle, FaSignOutAlt, FaBars, FaTimes,
    FaListAlt, FaStar, FaArrowRight, FaClock, FaSpinner
} from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import './StudentDashboard.css'; // Assuming shared styles
import { useAuth } from "../../context/AuthContext";

// --- Configuration ---
const API_BASE_URL = 'http://localhost:3000/api';

// --- REUSED COMPONENTS (Keep these consistent for layout) ---

// Placeholder for Profile Modal
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
        <div className="logo"><FaUniversity className="logo-icon" /> The Matrix Academy</div>
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

// Reusing CourseCard, now with an added 'isEnrolling' state for loading feedback
const CourseCard = ({ course, onActionClick, isEnrolling }) => {
    return (
        <div className="course-card-neon available">
            <h4 className="card-title">{course.title}</h4>
            <p className="card-description">{course.description}</p>
            <div className="card-meta">
                <span><FaClock /> {course.duration || 'N/A'}</span>
            </div>
            <button
                className="btn-action-neon btn-enroll"
                onClick={() => onActionClick(course)}
                disabled={isEnrolling} // Disable while enrolling
            >
                {isEnrolling ? <FaSpinner className="spinner" /> : <FaBookOpen />}
                {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
            </button>
        </div>
    );
};
// ----------------------------------------------------------------------


/**
 * EnrollCourses Component
 * Fetches all courses and allows students to enroll in non-enrolled courses.
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
    // NEW STATE: To track which course is currently being enrolled
    const [enrollingCourseId, setEnrollingCourseId] = useState(null);
    // NEW STATE: Feedback for successful enrollment
    const [enrollmentFeedback, setEnrollmentFeedback] = useState(null);


    // Assuming user object has an enrolledCourses array for filtering
    // NOTE: This array should be populated when the user logs in, or we need 
    // to fetch the student's enrolled courses separately to correctly filter.
    // For now, we'll assume it's part of the user context.
    const enrolledCourseIds = user?.enrolledCourseIds || [];

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const toggleProfile = () => setIsProfileOpen(prev => !prev);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // --- API Fetch Logic: Get ALL Courses ---
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

                // The courseRoutes endpoint is /api/courses
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
                // Assuming the courses are returned directly in the array or data.courses
                setAllCourses(data.courses || data.data.courses || data); // Adjust based on your actual response structure

            } catch (err) {
                console.error("Course fetch error:", err);
                setError(err.message || 'An unexpected error occurred while loading courses.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllCourses();
    }, [token, navigate]);


    // --- Enrollment Handler (Real API Call) ---
    const handleEnroll = async (course) => {
        setEnrollingCourseId(course.id); // Set loading state for this card
        setEnrollmentFeedback(null); // Clear previous feedback

        try {
            // The enrollmentRouter path is /api/enrollments
            const response = await fetch(`${API_BASE_URL}/enrollments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ courseId: course.id }), // Pass courseId in the body
            });

            const data = await response.json();

            if (!response.ok) {
                // The backend returns 409 for already enrolled (handled in controller)
                const message = data.message || `Failed to enroll in ${course.title}.`;
                setEnrollmentFeedback({ type: 'error', message });
                throw new Error(message);
            }

            // SUCCESS
            setEnrollmentFeedback({ type: 'success', message: `Successfully enrolled in ${course.title}!` });

            // 1. OPTIONAL: Update local user context/state here if available (e.g., using auth.updateUser)
            // 2. Automatically refresh the available courses list by removing the newly enrolled course.
            setAllCourses(prevCourses => prevCourses.filter(c => c.id !== course.id));
            
            // 3. Navigate to My Courses after a short delay for feedback
            setTimeout(() => {
                navigate('/student/my-courses'); 
            }, 1500);


        } catch (err) {
            console.error('Enrollment Failed:', err.message);
            // If the error was already set from the response data, we keep it.
            if (!enrollmentFeedback) {
                setEnrollmentFeedback({ type: 'error', message: err.message || 'An unexpected error occurred during enrollment.' });
            }
        } finally {
            setEnrollingCourseId(null); // Clear loading state
        }
    };


    // Filter courses based on the fetched list and the student's enrollment status
    const availableCourses = allCourses.filter(course =>
        // Only include courses that the student's ID is NOT in the enrolledCourseIds array
        !enrolledCourseIds.includes(course.id)
    );

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
                        <div className={`feedback-alert ${enrollmentFeedback.type}`}>
                            {enrollmentFeedback.message}
                        </div>
                    )}
                    {/* --- */}

                    <section className="dashboard-section core-section">
                        <h2 className="section-title-neon">Available Courses for You</h2>

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

                        {!isLoading && !error && availableCourses.length > 0 ? (
                            <div className="courses-grid">
                                {availableCourses.map(course => (
                                    <CourseCard
                                        key={course.id}
                                        course={course}
                                        // Pass the enrollment handler
                                        onActionClick={handleEnroll}
                                        // Check if this specific course is currently enrolling
                                        isEnrolling={enrollingCourseId === course.id} 
                                    />
                                ))}
                            </div>
                        ) : (!isLoading && !error && (
                            <div className="widget-card widget-empty-state">
                                <p>You are currently enrolled in all available courses. Great job!</p>
                            </div>
                        ))}
                    </section>
                </main>
            </div>
        </>
    );
};

export default EnrollCourses;