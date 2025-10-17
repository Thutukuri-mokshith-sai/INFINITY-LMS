import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    FaUniversity, FaBookOpen, FaUserCircle, FaSignOutAlt, FaBars, FaTimes,
    FaListAlt, FaStar, FaArrowLeft, FaClock, FaSpinner, FaCalendarAlt, FaChalkboardTeacher,
    FaFileSignature, FaCheckCircle, FaExclamationCircle, FaHourglassHalf, FaClipboardCheck,
    FaComments, FaFolderOpen
} from 'react-icons/fa';
import { useAuth } from "../../context/AuthContext";
import './StudentDashboard.css';

// --- API Base URL ---
const API_BASE_URL = 'https://lms-backend-foaq.onrender.com/api';

// -------------------- REUSED COMPONENTS -------------------- //

const ProfileModal = ({ authData, onClose }) => (
    <div className="profile-modal-backdrop" onClick={onClose}>
        <div className="profile-card-neon" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={onClose}><FaTimes /></button>
            <h2 className="title-neon">Welcome, {authData.name.split(' ')[0]}!</h2>
            <button onClick={authData.logout} className="btn-logout-neon full-width-btn">
                <FaSignOutAlt /> Secure Logout
            </button>
        </div>
    </div>
);

const DashboardNavbar = ({ studentName, onLogout, onProfileToggle, onSidebarToggle, isSidebarOpen }) => (
    <nav className="dashboard-navbar-neon">
        <button className="sidebar-toggle-btn" onClick={onSidebarToggle}>
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
        <div className="logo"><FaUniversity className="logo-icon" /> INFINITY LMS</div>
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
            <Link to="/student/discussion" className="nav-link"><FaComments /> <span className="link-text">Discussion Forum</span></Link>
            <Link to="/student/profile" className="nav-link"><FaUserCircle /> <span className="link-text">Profile</span></Link>
        </nav>
    </aside>
);

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
        <div className={`widget-card assignment-card-neon ${statusClass}`} onClick={() => navigate(`/student/assignments/${id}`)}>
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

const CourseLinkCard = ({ icon, title, subtitle, linkTo, isDimmed = false }) => {
    if (isDimmed) {
        return (
            <div className="widget-card detail-item detail-item-dimmed">
                {icon}<h3>{title}</h3><p>{subtitle}</p>
            </div>
        );
    }

    return (
        <Link to={linkTo} className="widget-card detail-item detail-item-link">
            {icon}<h3>{title}</h3><p>{subtitle}</p>
            <span className="btn-action-neon small" style={{ marginTop: '5px' }}>{title}</span>
        </Link>
    );
};

// -------------------- COURSE LEADERBOARD -------------------- //
const CourseLeaderboardWidget = ({ courseId, token }) => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [courseInfo, setCourseInfo] = useState({});

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            setError(null);
            if (!token || !courseId) { setLoading(false); return; }

            try {
                const response = await fetch(`${API_BASE_URL}/leaderboard/course/${courseId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.message || 'Failed to retrieve course leaderboard.');
                }

                const data = await response.json();
                if (!data.leaderboard || !Array.isArray(data.leaderboard)) {
                    throw new Error('Leaderboard data structure is invalid or missing.');
                }

                setLeaderboard(data.leaderboard);
                setCourseInfo({ title: data.courseTitle || 'Course', maxPoints: data.maxCoursePoints || 0 });
            } catch (err) {
                console.error('Leaderboard Fetch Error:', err);
                setError(err.message || 'Error loading leaderboard.');
            } finally { setLoading(false); }
        };

        fetchLeaderboard();
    }, [courseId, token]);

    if (loading) return (<div className="widget-card leaderboard-widget"><FaSpinner className="spinner" /> Loading Leaderboard...</div>);
    if (error) return (<div className="widget-card leaderboard-widget error-state-small">Leaderboard Error: {error}</div>);

    const topStudents = leaderboard.slice(0, 5);
    return (
        <div className="widget-card leaderboard-widget">
            <h3 className="widget-title"><FaStar /> Course Leaderboard</h3>
            <p className="widget-subtitle">Top {topStudents.length} Students (Max: {courseInfo.maxPoints} pts)</p>
            {topStudents.length === 0 ? (
                <p className="no-data-message-small">No graded submissions to show ranking.</p>
            ) : (
                <ul className="leaderboard-list">
                    {topStudents.map((s) => (
                        <li key={s.id} className={`leaderboard-item ${s.rank === 1 ? 'rank-one' : ''}`}>
                            <span className="rank-badge">{s.rank}</span>
                            <span className="student-name-list">{s.name}</span>
                            <span className="score-percentage">{s.scorePercentage}%</span>
                        </li>
                    ))}
                </ul>
            )}
            <Link to={`/student/courses/${courseId}/leaderboard`} className="btn-action-neon small full-width-btn">View Full Leaderboard</Link>
        </div>
    );
};

// -------------------- MAIN COMPONENT -------------------- //
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
    const [forumId, setForumId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const toggleProfile = () => setIsProfileOpen(prev => !prev);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const fetchSubmissionStatus = useCallback(async (assignmentId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/my-submission`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return null;
            const data = await res.json();
            return data?.data?.submission || null;
        } catch (err) { return null; }
    }, [token]);

    const fetchForumId = useCallback(async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/forums/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) return null;
            const data = await res.json();
            return data?.id || null;
        } catch (err) { return null; }
    }, [token]);

    useEffect(() => {
        const fetchCourseAndAssignments = async () => {
            setIsLoading(true);
            setError(null);
            if (!token || !courseId) { setIsLoading(false); return; }

            try {
                const courseRes = await fetch(`${API_BASE_URL}/courses/${courseId}`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!courseRes.ok) throw new Error('Failed to fetch course details.');
                const courseData = await courseRes.json();
                setCourse(courseData.course);

                const fetchedForumId = await fetchForumId(courseId);
                setForumId(fetchedForumId);

                const assignmentsRes = await fetch(`${API_BASE_URL}/assignments/course/${courseId}`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!assignmentsRes.ok) throw new Error('Failed to fetch course assignments.');
                const assignmentsData = await assignmentsRes.json();
                const assignmentsWithStatus = await Promise.all(assignmentsData.data.assignments.map(async (a) => ({
                    ...a, submission: await fetchSubmissionStatus(a.id)
                })));
                setAssignments(assignmentsWithStatus);

            } catch (err) {
                console.error(err);
                setError(err.message || 'Error loading course data.');
            } finally { setIsLoading(false); }
        };

        fetchCourseAndAssignments();
    }, [courseId, token, fetchSubmissionStatus, fetchForumId]);

    const mainContentClass = `main-content-area ${!isSidebarOpen ? 'sidebar-closed-content' : ''}`;
    const teacherName = course?.Teacher?.name || 'N/A';

    if (isLoading) return <div className="app-container"><DashboardNavbar studentName={studentName} onLogout={handleLogout} onProfileToggle={toggleProfile} onSidebarToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} /><DashboardSidebar isOpen={isSidebarOpen} /><main className={mainContentClass}><div className="loading-state"><FaSpinner className="spinner" /> <p>Loading course details and assignments...</p></div></main></div>;
    if (error || !course) return <div className="app-container"><DashboardNavbar studentName={studentName} onLogout={handleLogout} onProfileToggle={toggleProfile} onSidebarToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} /><DashboardSidebar isOpen={isSidebarOpen} /><main className={mainContentClass}><div className="error-state"><p>Error: {error || `Course ID ${courseId} not found.`}</p><Link to="/student/my-courses" className="btn-action-neon"><FaArrowLeft /> Back to My Courses</Link></div></main></div>;

    return (
        <>
            {isProfileOpen && <ProfileModal authData={{ name: studentName, logout: handleLogout }} onClose={toggleProfile} />}
            <div className="app-container">
                <DashboardNavbar studentName={studentName} onLogout={handleLogout} onProfileToggle={toggleProfile} onSidebarToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} />
                <DashboardSidebar isOpen={isSidebarOpen} />
                <main className={mainContentClass}>
                    <Link to="/student/my-courses" className="btn-action-neon"><FaArrowLeft /> Back to All My Courses</Link>

                    <div className="welcome-banner dashboard-section">
                        <h1 className="section-title-neon"><FaBookOpen /> {course.title}</h1>
                        <p className="section-subtitle-neon">{course.description}</p>
                    </div>

                    <hr />

                    <section className="dashboard-section core-section course-details-view">
                        <h2 className="section-title-neon">Course Overview</h2>
                        <div className="details-grid">
                            <div className="widget-card detail-item"><FaChalkboardTeacher size={24} /><h3>Instructor</h3><p>{teacherName}</p></div>
                            <div className="widget-card detail-item"><FaClock size={24} /><h3>Duration</h3><p>{course.duration || 'N/A'}</p></div>
                            <div className="widget-card detail-item"><FaCalendarAlt size={24} /><h3>Start Date</h3><p>{course.startDate ? new Date(course.startDate).toLocaleDateString() : 'N/A'}</p></div>

                            <CourseLeaderboardWidget courseId={courseId} token={token} />
                            <CourseLinkCard icon={<FaFolderOpen size={24} />} title="Course Materials" subtitle="View files and links" linkTo={`/student/materials/${courseId}`} />
                            <CourseLinkCard icon={<FaComments size={24} />} title="Discussion Forum" subtitle={forumId ? "Go to Discussion Board" : "Forum not yet created"} linkTo={forumId ? `/student/forums/${forumId}` : '#'} isDimmed={!forumId} />
                            <div className="widget-card detail-item"><FaListAlt size={24} /><h3>Course ID</h3><p>{courseId}</p></div>
                        </div>

                        <hr />

                        <h2 className="section-title-neon" style={{ marginTop: '30px', marginBottom: '15px' }}>Assignments & Progress ({assignments.length} total)</h2>
                        <div className="assignments-list-grid">
                            {assignments.length > 0 ? assignments.map(a => <AssignmentCard key={a.id} assignment={a} />) : <p className="no-data-message">No assignments have been posted for this course yet.</p>}
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
};

export default StudentCourseDetails;
