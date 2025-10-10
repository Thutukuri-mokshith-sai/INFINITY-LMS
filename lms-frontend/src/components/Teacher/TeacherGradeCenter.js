import React, { useState, useEffect, useCallback } from 'react';
import { FaArrowLeft, FaUsers, FaUserCircle, FaClock,  FaSpinner, FaTimesCircle, FaBars, FaTimes, FaUniversity, FaSignOutAlt, FaListAlt, FaChalkboardTeacher, FaGraduationCap, FaPlusCircle,  FaEdit, FaTrash, FaCheckCircle, FaExclamationTriangle, FaCalendarAlt, FaTasks } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";

// --- Configuration ---
const API_BASE_URL = 'http://localhost:3000/api/gradecenter'; 

// --- LAYOUT AND MODAL COMPONENTS (Assuming these remain the same) ---

// (TeacherDashboardNavbar, TeacherDashboardSidebar, and GradeModal components omitted for brevity,
// but they should be included in the final file as they were in your previous response.)

// --- Helper Components ---

// NOTE: You must include the Navbar, Sidebar, and Modal components from the previous file here.

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
            <Link to="/teacher/grading" className="nav-link active">
                <FaGraduationCap /> <span className="link-text">Grading Center</span>
            </Link>
            <Link to="/teacher/students" className="nav-link"> 
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

const GradeModal = ({ submission, onClose, onSave }) => {
    const [grade, setGrade] = useState(submission.grade || '');
    const [feedback, setFeedback] = useState(submission.feedback || '');
    const [isSaving, setIsSaving] = useState(false);

    // If fetching for pending queue, submission structure might be slightly different.
    // Map the properties to handle both 'center' and 'pending' formats consistently.
    const maxPoints = submission.maxPoints || (submission.Assignment && submission.Assignment.maxPoints);
    const assignmentTitle = submission.assignment ? submission.assignment.title : (submission.Assignment && submission.Assignment.title);
    const courseTitle = submission.course ? submission.course.title : (submission.Assignment && submission.Assignment.Course.title);
    const studentName = submission.student ? submission.student.name : (submission.Student && submission.Student.name);
    const canEdit = submission.canEdit !== undefined ? submission.canEdit : (submission.grade !== null); // Assume PENDING is always editable
    const status = submission.status || (submission.grade === null ? 'PENDING' : 'GRADED');


    const handleSubmit = (e) => {
        e.preventDefault();
        const numericGrade = parseInt(grade, 10);

        if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > maxPoints) {
            alert(`Please enter a valid grade between 0 and ${maxPoints}.`);
            return;
        }

        setIsSaving(true);
        // Note: submission.id is always available regardless of source API
        onSave(submission.id, numericGrade, feedback);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content profile-card-neon" onClick={e => e.stopPropagation()}>
                <h2 className="modal-title-neon">
                    <FaGraduationCap /> {status === 'PENDING' ? 'Grade Submission' : 'Edit Grade'}
                </h2>
                <p className="subtitle-neon">
                    **{assignmentTitle}** from **{studentName}** ({courseTitle})
                </p>

                {status === 'GRADED' && !canEdit && (
                    <div className="alert alert-danger-neon">
                        <FaExclamationTriangle /> **Read Only:** Grading window closed (24 hours exceeded).
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group info-group-neon">
                        <label htmlFor="grade">Grade (Max: {maxPoints})</label>
                        <input
                            id="grade"
                            type="number"
                            min="0"
                            max={maxPoints}
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            className="input-neon"
                            required
                            disabled={status === 'GRADED' && !canEdit}
                        />
                    </div>
                    <div className="form-group info-group-neon">
                        <label htmlFor="feedback">Feedback (Optional)</label>
                        <textarea
                            id="feedback"
                            rows="4"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="input-neon"
                            disabled={status === 'GRADED' && !canEdit}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary-neon" onClick={onClose} disabled={isSaving}>
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="btn-action-neon" 
                            disabled={isSaving || (status === 'GRADED' && !canEdit)}
                        >
                            {isSaving ? <FaSpinner className="loading-icon-spin" /> : <FaCheckCircle />} 
                            {isSaving ? 'Saving...' : (status === 'PENDING' ? 'Submit Grade' : 'Update Grade')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---

const TeacherGradeCenter = () => {
    const { token, name, role, logout } = useAuth();
    const navigate = useNavigate();

    // Layout State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const handleLogout = logout; 

    // Data State
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSubmission, setSelectedSubmission] = useState(null); // For Modal
    const [activeTab, setActiveTab] = useState('center'); // 'center' or 'pending'

    // --- API CALLS ---

    // Fetch data based on the active tab
    const fetchSubmissionsData = useCallback(async (tab) => {
        if (!token) return;
        setLoading(true);
        setError(null);
            
        const endpoint = tab === 'pending' ? '/pending' : '/center';

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to fetch ${tab} grading data.`);
            }

            const data = await response.json();
            
            // Normalize data structure if fetching from '/pending'
            let fetchedData = data.submissions || data.gradeCenterData || [];
            
            if (tab === 'pending') {
                fetchedData = fetchedData.map(sub => ({
                    ...sub,
                    status: 'PENDING',
                    // Map deep nested data from backend to flat structure for table
                    assignment: { id: sub.Assignment.id, title: sub.Assignment.title },
                    course: { id: sub.Assignment.Course.id, title: sub.Assignment.Course.title },
                    student: { id: sub.Student.id, name: sub.Student.name },
                    maxPoints: sub.Assignment.maxPoints,
                    grade: null, // Ensure grade is null for pending
                    canEdit: true, // Always editable if pending
                }));
            }
            
            setSubmissions(fetchedData); 

        } catch (err) {
            console.error('API Fetch Error:', err);
            setError(err.message || 'An error occurred while loading grade center data.');
        } finally {
            setLoading(false);
        }
    }, [token]);
    
    // Initial fetch based on activeTab
    useEffect(() => {
        fetchSubmissionsData(activeTab);
    }, [token, activeTab, fetchSubmissionsData]); // Depend on activeTab

    // Grade Submission Handler (Called from Modal)
    const handleGradeSubmission = async (submissionId, grade, feedback) => {
        try {
            const response = await fetch(`${API_BASE_URL}/${submissionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ grade, feedback }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit/update grade.');
            }

            // Refetch data for the current tab to update the table
            await fetchSubmissionsData(activeTab); 
            setSelectedSubmission(null); // Close modal
            alert('Grade successfully recorded.');

        } catch (err) {
            console.error('Grading Error:', err);
            alert(`Error: ${err.message}`);
        }
    };

    // Delete Grade Handler
    const handleDeleteGrade = async (submissionId) => {
        if (!window.confirm('Are you sure you want to delete this grade and reset the submission to PENDING? This can only be done within 24 hours of the original grading.')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/${submissionId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete grade.');
            }

            // Refetch data for the current tab to update the table
            await fetchSubmissionsData(activeTab); 
            alert('Grade successfully deleted. Submission is now pending.');

        } catch (err) {
            console.error('Delete Grade Error:', err);
            alert(`Error: ${err.message}`);
        }
    };
    
    // --- UI/Helper Functions ---

    const openGradeModal = (submission) => {
        // Ensure the submission object passed to the modal has the necessary properties
        // The modal component handles normalization, so passing the current list item is fine.
        setSelectedSubmission(submission);
    };

    const formatSubmissionDate = (date) => {
        return date ? new Date(date).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'N/A';
    };

    const getStatusClass = (status) => {
        return status === 'PENDING' ? 'status-pending' : 'status-graded';
    };

    const mainContentClass = `main-content-area ${!isSidebarOpen ? 'sidebar-closed-content' : ''}`;

    // --- RENDER LOGIC ---

    if (loading) {
        return (
            <div className="loading-state-neon">
                <FaClock className="loading-icon-spin" />
                <p>Loading Grade Center Data...</p>
                <div className="loading-bar-neon"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-state-neon full-page-view">
                <FaTimesCircle className="error-icon" />
                <h1>Grade Center Error</h1>
                <p>Could not load grading data: {error}</p>
                <button className="btn-secondary-neon" onClick={() => navigate('/teacher')}><FaArrowLeft /> Go to Dashboard</button>
            </div>
        );
    }

    const pendingCount = activeTab === 'center' 
        ? submissions.filter(s => s.status === 'PENDING').length
        : submissions.length; // If in pending tab, all visible are pending

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
                    <h1 className="section-title-neon"><FaGraduationCap /> Grade Center</h1>
                    <p className="section-subtitle-neon">
                        {activeTab === 'center' ? 'Manage all submissions (Graded and Pending).' : 'Focusing on submissions awaiting your grade.'}
                    </p>
                </div>
                
                <div className="tab-navigation-neon">
                    <button 
                        className={`tab-btn-neon ${activeTab === 'center' ? 'active' : ''}`}
                        onClick={() => setActiveTab('center')}
                    >
                        <FaListAlt /> All Submissions
                    </button>
                    <button 
                        className={`tab-btn-neon ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        <FaTasks /> Pending Grading ({pendingCount})
                    </button>
                </div>

                <section className="dashboard-section core-section grade-center-section">
                    <h2 className="section-title-neon">
                        {activeTab === 'center' ? `All Submissions (${submissions.length})` : `Pending Submissions (${pendingCount})`}
                    </h2>
                    <div className="grade-list-table course-list-table">
                        <div className="table-header">
                            <span className="col-student">Student</span>
                            <span className="col-course">Course</span>
                            <span className="col-assignment">Assignment</span>
                            <span className="col-submitted">Submitted</span>
                            <span className="col-status">Status</span>
                            <span className="col-grade">Grade</span>
                            <span className="col-actions">Actions</span>
                        </div>
                        
                        {submissions.length > 0 ? (
                            submissions.map(sub => (
                                <div key={sub.id} className="table-row">
                                    {/* Data access is normalized in fetchSubmissionsData */}
                                    <span className="col-student"><FaUserCircle /> {sub.student.name}</span>
                                    <span className="col-course">{sub.course.title}</span>
                                    <span className="col-assignment">{sub.assignment.title}</span>
                                    <span className="col-submitted"><FaCalendarAlt /> {formatSubmissionDate(sub.submittedAt)}</span>
                                    <span className={getStatusClass(sub.status)}>{sub.status}</span>
                                    <span className="col-grade">
                                        {sub.grade !== null ? `${sub.grade} / ${sub.maxPoints}` : '-'}
                                    </span>
                                    <span className="col-actions">
                                        <button 
                                            className="btn-secondary-neon btn-edit" 
                                            onClick={() => openGradeModal(sub)}
                                            title={sub.grade === null ? 'Grade this Submission' : 'Edit Grade'}
                                        >
                                            <FaEdit /> {sub.grade === null ? 'Grade' : 'Edit'}
                                        </button>
                                        
                                        <button 
                                            className="btn-delete-grade" 
                                            onClick={() => handleDeleteGrade(sub.id)}
                                            // The delete button is disabled if no grade exists OR if the 24h window has closed
                                            disabled={sub.grade === null || !sub.canEdit} 
                                            title={sub.grade === null ? 'No grade to delete' : (sub.canEdit ? 'Delete Grade (24h window)' : 'Grading window closed')}
                                        >
                                            <FaTrash /> Delete Grade
                                        </button>
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                {activeTab === 'pending' ? 'Congratulations! No submissions are currently pending.' : 'No submissions found in your courses.'}
                            </div>
                        )}
                    </div>
                </section>
            </main>
            
            {selectedSubmission && (
                <GradeModal 
                    submission={selectedSubmission} 
                    onClose={() => setSelectedSubmission(null)} 
                    onSave={handleGradeSubmission} 
                />
            )}
        </div>
    );
};

export default TeacherGradeCenter;