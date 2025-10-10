import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaUsers, FaUserCircle, FaEnvelope, FaToolbox,FaClock, FaBookOpen, FaSpinner, FaTimesCircle, FaPhone, FaBars, FaTimes, FaUniversity, FaSignOutAlt, FaListAlt, FaChalkboardTeacher, FaGraduationCap, FaPlusCircle, FaBell } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext"; // Ensure this path is correct

// NOTE: We assume the styles from TeacherDashboard.css cover the layout elements.
// If not, you may need a TeacherStudentsList.css or a dedicated Layout.css file.

// --- REUSABLE DISPLAY COMPONENTS ---

const StudentListItem = ({ student }) => (
    <div className="student-list-item widget-card card-neon">
        <div className="student-header">
            <FaUserCircle className="student-icon" size={36} />
            <div className="student-info">
                <h4 className="student-name-list">{student.name}</h4>
                <p className="student-email-list"><FaEnvelope /> {student.email}</p>
            </div>
        </div>
        
        <div className="student-details info-group-neon">
            <p><FaToolbox /> <strong>Major:</strong> {student.major || 'N/A'}</p>
            <p><FaPhone /> <strong>Phone:</strong> {student.phone_number || 'N/A'}</p>
        </div>

        <div className="enrolled-courses-list">
            <h5 className="courses-title"><FaBookOpen /> Enrolled Courses (Yours):</h5>
            <ul className="course-tags-container">
                {student.enrolledCourses.length > 0 ? (
                    student.enrolledCourses.map((course, index) => (
                        <li key={index} className="course-tag-small course-list-tag">{course}</li>
                    ))
                ) : (
                    <li className="course-tag-small course-list-tag-none">No active enrollments.</li>
                )}
            </ul>
        </div>
    </div>
);

// --- LAYOUT COMPONENTS (REPLICATED FROM DASHBOARD) ---

const TeacherDashboardNavbar = ({ toggleSidebar, isSidebarOpen, name, role, handleLogout }) => (
    <nav className="dashboard-navbar-neon">
        <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
        <Link to="/teacher" className="logo">
            <FaUniversity className="logo-icon"/> The Matrix Academy
        </Link>
        <div className="nav-profile-group">
            <span className="student-name">
                <FaUserCircle /> <strong>{name}</strong> ({role})
            </span>
            <button className="btn-logout-neon" onClick={handleLogout}>
                <FaSignOutAlt /> Logout
            </button>
        </div>
    </nav>
);

const TeacherDashboardSidebar = ({ isSidebarOpen }) => (
    <aside className={`dashboard-sidebar-neon ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
        <div className="sidebar-header">TEACHER MENU</div>
        <nav className="sidebar-nav">
            <Link to="/teacher" className="nav-link">
                <FaListAlt /> <span className="link-text">Dashboard</span>
            </Link>
            <Link to="/teacher/courses" className="nav-link">
                <FaChalkboardTeacher /> <span className="link-text">My Courses</span>
            </Link>
            <Link to="/teacher/grading" className="nav-link">
                <FaGraduationCap /> <span className="link-text">Grading Center</span>
            </Link>
            <Link to="/teacher/students" className="nav-link active"> 
                 <FaUsers /> <span className="link-text">Student Roster</span>
            </Link>
            <Link to="/teacher/courses/new" className="nav-link">
                <FaPlusCircle /> <span className="link-text">Create Course</span>
            </Link>
            
            <Link to="/teacher/profile" className="nav-link"> 
                <FaUserCircle /> <span className="link-text">Profile</span>
            </Link>
        </nav>
    </aside>
);

// --- MAIN COMPONENT ---

const TeacherStudentsList = () => {
    const { token, name, role, logout } = useAuth();
    const navigate = useNavigate();

    // 1. LAYOUT STATE
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const handleLogout = logout; 

    // 2. DATA STATE
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const API_URL = 'http://localhost:3000/api/teacherdashboard/students';

    // 3. FETCH DATA EFFECT
    useEffect(() => {
        const fetchStudentsData = async () => {
            if (!token) {
                setLoading(false);
                setError('Authentication token missing.');
                return;
            }
            
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
                    throw new Error(errorData.message || 'Failed to fetch student list.');
                }

                const data = await response.json();
                
                setStudents(data.students || []); 
                setError(null);

            } catch (err) {
                console.error('API Fetch Error:', err);
                setError(err.message || 'An error occurred while loading student data.');
            } finally {
                setLoading(false);
            }
        };

        fetchStudentsData();
    }, [token]);

    const mainContentClass = `main-content-area ${!isSidebarOpen ? 'sidebar-closed-content' : ''}`;

    // --- Loading and Error State Rendering ---
    if (loading) {
        // Use the same loading state style as your dashboard
        return (
            <div className="loading-state-neon">
                <FaClock className="loading-icon-spin" />
                <p>Compiling Student Roster...</p>
                <div className="loading-bar-neon"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-state-neon full-page-view">
                <FaTimesCircle className="error-icon" />
                <h1>Roster Error</h1>
                <p>Could not load student data: {error}</p>
                <button className="btn-secondary-neon" onClick={() => navigate('/teacher')}><FaArrowLeft /> Go to Dashboard</button>
            </div>
        );
    }
    // --- End Loading and Error State Rendering ---


    return (
        <div className="app-container">
            <TeacherDashboardNavbar 
                toggleSidebar={toggleSidebar} 
                isSidebarOpen={isSidebarOpen} 
                name={name} 
                role={role}
                handleLogout={handleLogout}
            />
            <TeacherDashboardSidebar isSidebarOpen={isSidebarOpen} />

            <main className={mainContentClass}>
                <div className="welcome-banner dashboard-section">
                    <h1 className="section-title-neon"><FaUsers /> Student Roster</h1>
                    <p className="section-subtitle-neon">
                        Viewing <strong>{students.length}</strong> unique students enrolled in your courses.
                    </p>
                </div>
                
                <section className="dashboard-section core-section student-roster-section">
                    <div className="students-list-grid">
                        {students.length > 0 ? (
                            students.map(student => (
                                <StudentListItem key={student.id} student={student} />
                            ))
                        ) : (
                            <div className="empty-state">
                                <p>No students are currently enrolled in any of your courses.</p>
                                <button className="btn-action-neon" onClick={() => navigate('/teacher/courses/new')}>
                                    <FaPlusCircle /> Create a Course to Begin
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default TeacherStudentsList;