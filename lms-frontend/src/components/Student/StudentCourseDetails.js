import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    FaUniversity, FaBookOpen, FaUserCircle, FaSignOutAlt, FaBars, FaTimes,
    FaListAlt, FaStar, FaArrowLeft, FaClock, FaSpinner, FaCalendarAlt, FaChalkboardTeacher,
    FaFileSignature, FaCheckCircle, FaExclamationCircle, FaHourglassHalf, FaClipboardCheck,
    FaComments, FaFolderOpen, FaFileAlt, FaLink, FaDownload // Added File/Link icons
} from 'react-icons/fa';
import { useAuth } from "../../context/AuthContext";
import './StudentDashboard.css';

// --- Configuration ---
const API_BASE_URL = 'https://lms-portal-backend-h5k8.onrender.com/api';

// ---------------------------------------------------------------------
// --- REUSED COMPONENTS (ProfileModal, DashboardNavbar, DashboardSidebar) ---
// (Assume these are available or defined in your environment)
// ... (Your existing ProfileModal, DashboardNavbar, DashboardSidebar components remain here)
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
            <Link to="/student/my-courses" className="nav-link active"><FaBookOpen /> <span className="link-text">My Courses</span></Link>
            <Link to="/student/courses" className="nav-link"><FaUniversity /> <span className="link-text">Enroll Courses</span></Link>
            <Link to="/student/grades" className="nav-link"><FaStar /> <span className="link-text">Grades</span></Link>
            <Link to="/student/disucusion" className="nav-link"><FaStar /> <span className="link-text">Discusion Forum</span></Link>
            <Link to="/student/profile" className="nav-link"><FaUserCircle /> <span className="link-text">Profile</span></Link>
        </nav>
    </aside>
);

// --- Assignment Status Card (Unchanged) ---
const AssignmentCard = ({ assignment }) => {
    const { id, title, dueDate, maxPoints, submission } = assignment;
    const navigate = useNavigate();

    const due = new Date(dueDate);
    const now = new Date();
    const isOverdue = now > due;
    
    let statusIcon = <FaHourglassHalf className="status-pending" />;
    let statusText = 'Pending Submission';
    let statusClass = 'status-pending';

    if (submission) {
        if (submission.grade !== null) {
            statusIcon = <FaClipboardCheck className="status-graded" />;
            statusText = `Graded: ${submission.grade}/${maxPoints}`;
            statusClass = 'status-graded';
        } else {
            statusIcon = <FaCheckCircle className="status-submitted" />;
            statusText = `Submitted (${submission.isLate ? 'Late' : 'On Time'})`;
            statusClass = 'status-submitted';
        }
    } else if (isOverdue) {
        statusIcon = <FaExclamationCircle className="status-overdue" />;
        statusText = 'Overdue - Not Submitted';
        statusClass = 'status-overdue';
    }

    const formattedDate = due.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
        <div 
            className={`widget-card assignment-card-neon ${statusClass}`}
            onClick={() => navigate(`/student/assignments/${id}`)}
        >
            <div className="assignment-header">
                <h3 className="assignment-title"><FaFileSignature /> {title}</h3>
                <span className={`status-label ${statusClass}`}>{statusIcon} {statusText}</span>
            </div>
            <div className="assignment-meta">
                <p><strong>Due:</strong> {formattedDate}</p>
                <p><strong>Points:</strong> {maxPoints}</p>
            </div>
            <div className="assignment-action">
                 <button className="btn-action-neon small" onClick={(e) => { e.stopPropagation(); navigate(`/student/assignments/${id}`); }}>
                    {submission ? 'View/Resubmit' : 'View & Submit'}
                 </button>
            </div>
        </div>
    );
};

// --- Generic Course Link Card (Used for Materials and Forum) ---
const CourseLinkCard = ({ icon, title, subtitle, linkTo, isDimmed = false }) => {
    if (isDimmed) {
        return (
            <div className="widget-card detail-item detail-item-dimmed">
                {icon}
                <h3>{title}</h3>
                <p>{subtitle}</p>
            </div>
        );
    }

    return (
        <Link to={linkTo} className="widget-card detail-item detail-item-link">
            {icon}
            <h3>{title}</h3>
            <p>{subtitle}</p>
            <span className="btn-action-neon small" style={{ marginTop: '5px' }}>{title}</span>
        </Link>
    );
};


// ---------------------------------------------------------------------
// --- MAIN COMPONENT: StudentCourseDetails ---
// ---------------------------------------------------------------------
const StudentCourseDetails = () => {
    const { courseId } = useParams(); 
    const auth = useAuth();
    const navigate = useNavigate();

    const { user, logout, token } = auth;
    const studentName = user?.name || 'Student';

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const [course, setCourse] = useState(null); 
    const [assignments, setAssignments] = useState([]); 
    const [forumId, setForumId] = useState(null); // Keep forumId state to pass to the card
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const toggleProfile = () => setIsProfileOpen(prev => !prev);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Helper to fetch submission status for an assignment (Unchanged)
    const fetchSubmissionStatus = useCallback(async (assignmentId) => {
        // ... (Existing implementation for fetchSubmissionStatus)
        try {
            const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/my-submission`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, 
                },
            });
            if (response.status === 404) return null;
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to fetch submission status for assignment ${assignmentId}.`);
            }
            const data = await response.json();
            return data.data.submission;
        } catch (err) {
            console.warn(`Submission status fetch warning for assignment ${assignmentId}:`, err.message);
            return null; 
        }
    }, [token]);

    // Helper to fetch the Forum ID associated with the Course (Unchanged)
    const fetchForumId = useCallback(async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/forums/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 404) return null; // Forum not found
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to fetch forum for course ${id}.`);
            }
            const forumData = await response.json();
            return forumData.id; 

        } catch (err) {
            console.error("Forum detail fetch error:", err);
            return null;
        }
    }, [token]);


    // Main useEffect to fetch all data
    useEffect(() => {
        const fetchCourseAndAssignments = async () => {
            setIsLoading(true);
            setError(null);

            if (!token || !courseId) {
                setError(token ? "Invalid course ID." : "Authentication required. Please log in.");
                if (!token) navigate('/login');
                setIsLoading(false);
                return;
            }

            try {
                // 1. Fetch Course Details
                const courseResponse = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!courseResponse.ok) throw new Error('Failed to fetch course details.');
                const courseData = await courseResponse.json();
                setCourse(courseData.course);
                
                // 2. Fetch Forum ID
                const fetchedForumId = await fetchForumId(courseId);
                setForumId(fetchedForumId);

                // 3. Fetch Assignments
                const assignmentsResponse = await fetch(`${API_BASE_URL}/assignments/course/${courseId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!assignmentsResponse.ok) throw new Error('Failed to fetch course assignments.');
                const assignmentsData = await assignmentsResponse.json();
                const fetchedAssignments = assignmentsData.data.assignments;

                // 4. Fetch Submission Status for each assignment
                const assignmentsWithStatus = await Promise.all(
                    fetchedAssignments.map(async (assignment) => ({ 
                        ...assignment, 
                        submission: await fetchSubmissionStatus(assignment.id)
                    }))
                );
                setAssignments(assignmentsWithStatus);

            } catch (err) {
                console.error("Course/Assignment detail fetch error:", err);
                setError(err.message || 'An unexpected error occurred while loading course details.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCourseAndAssignments(); 
    }, [courseId, token, navigate, fetchSubmissionStatus, fetchForumId]);

    const mainContentClass = `main-content-area ${!isSidebarOpen ? 'sidebar-closed-content' : ''}`;
    const teacherName = course?.Teacher?.name || 'N/A';

    if (isLoading) return (/* Loading State UI */ <div className="app-container"><DashboardNavbar studentName={studentName} onLogout={handleLogout} onProfileToggle={toggleProfile} onSidebarToggle={toggleSidebar} isSidebarOpen={isSidebarOpen}/><DashboardSidebar isOpen={isSidebarOpen} /><main className={mainContentClass}><div className="loading-state"><FaSpinner className="spinner" /> <p>Loading course details and assignments...</p></div></main></div>);
    if (error || !course) return (/* Error State UI */ <div className="app-container"><DashboardNavbar studentName={studentName} onLogout={handleLogout} onProfileToggle={toggleProfile} onSidebarToggle={toggleSidebar} isSidebarOpen={isSidebarOpen}/><DashboardSidebar isOpen={isSidebarOpen} /><main className={mainContentClass}><div className="error-state"><p>Error: {error || `Course ID ${courseId} not found.`}</p><Link to="/student/my-courses" className="btn-action-neon" style={{ marginTop: '10px' }}><FaArrowLeft /> Back to My Courses</Link></div></main></div>);
    
    return (
        <>
            {isProfileOpen && (<ProfileModal authData={{ name: studentName, email: user?.email, userId: user?.id, role: user?.role, logout: handleLogout }} onClose={toggleProfile} />)}
            <div className="app-container">
                <DashboardNavbar studentName={studentName} onLogout={handleLogout} onProfileToggle={toggleProfile} onSidebarToggle={toggleSidebar} isSidebarOpen={isSidebarOpen}/>
                <DashboardSidebar isOpen={isSidebarOpen} />
                <main className={mainContentClass}>
                    <Link to="/student/my-courses" className="btn-action-neon" style={{ marginBottom: '20px' }}>
                        <FaArrowLeft /> Back to All My Courses
                    </Link>

                    <div className="welcome-banner dashboard-section">
                        <h1 className="section-title-neon">
                            <FaBookOpen /> {course.title}
                        </h1>
                        <p className="section-subtitle-neon">{course.description}</p>
                    </div>

                    <hr/>

                    <section className="dashboard-section core-section course-details-view">
                        <h2 className="section-title-neon">Course Overview</h2>
                        <div className="details-grid">
                            {/* Teacher Detail */}
                            <div className="widget-card detail-item">
                                <FaChalkboardTeacher size={24} /><h3>Instructor</h3><p>{teacherName}</p>
                            </div>
                            {/* Duration Detail */}
                            <div className="widget-card detail-item">
                                <FaClock size={24} /><h3>Duration</h3><p>{course.duration || 'N/A'}</p>
                            </div>
                            {/* Start Date Detail */}
                            <div className="widget-card detail-item">
                                <FaCalendarAlt size={24} /><h3>Start Date</h3><p>{course.startDate ? new Date(course.startDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            
                            {/* NEW: MATERIALS LINK CARD */}
                            <CourseLinkCard 
                                icon={<FaFolderOpen size={24} />}
                                title="Course Materials"
                                subtitle="View files and links"
                                linkTo={`/student/materials/${courseId}`} // New route for materials
                            />

                            {/* FORUM LINK CARD */}
                            <CourseLinkCard 
                                icon={<FaComments size={24} />}
                                title="Discussion Forum"
                                subtitle={forumId ? "Go to Discussion Board" : "Forum not yet created"}
                                linkTo={forumId ? `/student/forums/${forumId}` : '#'}
                                isDimmed={!forumId}
                            />
                            
                            {/* Course ID Detail */}
                            <div className="widget-card detail-item">
                                <FaListAlt size={24} /><h3>Course ID</h3><p>{courseId}</p> 
                            </div>
                        </div>

                        <hr/>

                        <h2 className="section-title-neon" style={{ marginTop: '30px', marginBottom: '15px' }}>Assignments & Progress ({assignments.length} total)</h2>
                        
                        <div className="assignments-list-grid">
                            {assignments.length > 0 ? (
                                assignments.map(assignment => (
                                    <AssignmentCard key={assignment.id} assignment={assignment} />
                                ))
                            ) : (
                                <p className="no-data-message">No assignments have been posted for this course yet.</p>
                            )}
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
};

export default StudentCourseDetails;