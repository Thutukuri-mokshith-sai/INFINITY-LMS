import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    FaEdit, FaTrash, FaClock, FaUserCircle, FaSignOutAlt, FaListAlt, 
    FaGraduationCap, FaSpinner, FaFileSignature, FaUsers, FaCheckCircle, 
    FaExclamationTriangle, FaFileDownload, FaCommentDots, FaInfoCircle, FaPaperclip,
    FaSave, FaTimes, FaBars, FaUniversity, FaChalkboardTeacher, FaPlusCircle, FaSyncAlt
} from 'react-icons/fa';
import { useAuth } from "../../context/AuthContext";
import axios from 'axios';
import './TeacherCourses.css';

// --- API CONFIG ---
const API_URL = process.env.REACT_APP_API_URL || 'https://lms-portal-backend-h5k8.onrender.com/api';

// --- API FUNCTIONS ---

const apiGetAssignmentDetails = async (assignmentId, token) => {
    const response = await axios.get(`${API_URL}/assignments/${assignmentId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.data.data.assignment || response.data.assignment; 
};

const apiGetSubmissionsByAssignment = async (assignmentId, token) => {
    const response = await axios.get(`${API_URL}/assignments/${assignmentId}/submissions`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.data.data.submissions; 
};

const apiUpdateAssignment = async (assignmentId, data, token) => {
    const response = await axios.patch(`${API_URL}/assignments/${assignmentId}`, data, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.data.data.assignment;
};

const apiDeleteAssignment = async (assignmentId, token) => {
    await axios.delete(`${API_URL}/assignments/${assignmentId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return true;
};

// --- NEW API FUNCTIONS FOR GRADING (Using the /grades endpoint) ---

// API 6: Get Submission Details
const apiGetSubmissionGradeDetails = async (submissionId, token) => {
    const response = await axios.get(`${API_URL}/grades/submission/${submissionId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.data.data;
};

// API 1: Grade or regrade a specific submission
const apiGradeSubmission = async (submissionId, grade, feedback, token) => {
    const response = await axios.patch(`${API_URL}/grades/submission/${submissionId}`, { grade, feedback }, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.data.data;
};

// API 5: Unmark a submission grade
const apiUnmarkSubmissionGrade = async (submissionId, token) => {
    const response = await axios.patch(`${API_URL}/grades/submission/${submissionId}/unmark`, {}, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.data.data;
};


// --- UI COMPONENT: Edit Assignment Modal ---

const EditAssignmentModal = ({ show, onClose, assignment, onSave, loading }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
        maxPoints: 100,
        resources: []
    });

    useEffect(() => {
        if (assignment) {
            setFormData({
                title: assignment.title || '',
                description: assignment.description || '',
                dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().substring(0, 16) : '',
                maxPoints: assignment.maxPoints || 100,
                resources: assignment.Resources || []
            });
        }
    }, [assignment]);

    if (!show) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'maxPoints' ? parseInt(value) || 0 : value }));
    };

    const handleResourceChange = (index, field, value) => {
        const newResources = formData.resources.map((res, i) => {
            if (i === index) return { ...res, [field]: value };
            return res;
        });
        setFormData(prev => ({ ...prev, resources: newResources }));
    };

    const addResource = () => {
        setFormData(prev => ({ 
            ...prev, 
            resources: [...prev.resources, { title: '', resourceLink: '', fileType: 'Link' }] 
        }));
    };

    const removeResource = (index) => {
        setFormData(prev => ({ 
            ...prev, 
            resources: prev.resources.filter((_, i) => i !== index) 
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content widget-card" style={{ maxWidth: '600px', width: '90%' }}>
                <h2 className="form-title-neon"><FaEdit /> Edit Assignment: {assignment?.title}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Title</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea name="description" value={formData.description} onChange={handleChange}></textarea>
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Due Date</label>
                            <input type="datetime-local" name="dueDate" value={formData.dueDate} onChange={handleChange} required />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Max Points</label>
                            <input type="number" name="maxPoints" value={formData.maxPoints} onChange={handleChange} min="1" required />
                        </div>
                    </div>

                    {/* Resources Section */}
                    <h4 style={{ marginTop: '20px', borderBottom: '1px solid var(--neon-yellow)', paddingBottom: '5px' }}>
                        <FaPaperclip /> Resources
                    </h4>
                    {formData.resources.map((res, index) => (
                        <div key={index} style={{ border: '1px dashed #444', padding: '10px', marginBottom: '10px' }}>
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={res.title || ''}
                                    onChange={(e) => handleResourceChange(index, 'title', e.target.value)}
                                    placeholder="Resource Title"
                                />
                            </div>
                            <div className="form-group">
                                <label>Link</label>
                                <input
                                    type="url"
                                    value={res.resourceLink || ''}
                                    onChange={(e) => handleResourceChange(index, 'resourceLink', e.target.value)}
                                    placeholder="http://example.com/file"
                                    required
                                />
                            </div>
                            <button type="button" onClick={() => removeResource(index)} className="btn-icon-danger-neon" style={{ marginTop: '5px' }}>
                                <FaTrash /> Remove Resource
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={addResource} className="btn-secondary-neon" style={{ width: '100%', marginTop: '10px' }}>
                        Add Resource
                    </button>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
                        <button type="button" onClick={onClose} className="btn-icon-danger-neon" disabled={loading}>
                            <FaTimes /> Cancel
                        </button>
                        <button type="submit" className="btn-icon-primary-neon" disabled={loading}>
                            {loading ? <FaSpinner className="spinner" /> : <FaSave />} Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- UI COMPONENT: Grade Submission Modal ---

const GradeSubmissionModal = ({ show, onClose, submissionId, maxPoints, assignmentTitle, onGradeUpdate }) => {
    const { token } = useAuth();
    const [submissionData, setSubmissionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [grade, setGrade] = useState('');
    const [feedback, setFeedback] = useState('');
    const [localError, setLocalError] = useState(null);

    // Fetch submission details when modal opens
    useEffect(() => {
        if (!show || !submissionId) {
            setSubmissionData(null);
            setLocalError(null);
            return;
        }

        const fetchDetails = async () => {
            setLoading(true);
            setLocalError(null);
            try {
                const data = await apiGetSubmissionGradeDetails(submissionId, token);
                setSubmissionData(data);
                // Initialize form fields from fetched data
                setGrade(data.grade === 'N/A (Ungraded)' ? '' : data.grade);
                setFeedback(data.feedback || '');
            } catch (err) {
                setLocalError(err.response?.data?.message || 'Failed to fetch submission details.');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [show, submissionId, token]);


    const handleGradeChange = (e) => {
        const value = e.target.value;
        setLocalError(null);
        // Only allow numbers and empty string
        setGrade(value === '' ? '' : Math.max(0, Math.min(maxPoints, parseInt(value) || 0)));
    };

    const handleSaveGrade = async (e) => {
        e.preventDefault();
        
        const numericGrade = parseInt(grade);
        
        if (grade === '' || isNaN(numericGrade) || numericGrade > maxPoints || numericGrade < 0) {
            setLocalError(`Grade must be a number between 0 and ${maxPoints}.`);
            return;
        }

        setLoading(true);
        setLocalError(null);
        try {
            await apiGradeSubmission(submissionId, numericGrade, feedback || null, token);
            onGradeUpdate('Grade saved successfully.');
            onClose();
        } catch (err) {
            setLocalError(err.response?.data?.message || 'Failed to save grade.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleUnmarkGrade = async () => {
        if (!window.confirm("Are you sure you want to remove this grade and feedback?")) return;
        
        setLoading(true);
        setLocalError(null);
        try {
            await apiUnmarkSubmissionGrade(submissionId, token);
            onGradeUpdate('Grade successfully unmarked.');
            onClose();
        } catch (err) {
            setLocalError(err.response?.data?.message || 'Failed to unmark grade.');
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal-content widget-card" style={{ maxWidth: '700px', width: '90%' }}>
                <h2 className="form-title-neon"><FaGraduationCap /> Grade Submission</h2>
                <h3 style={{ borderBottom: '1px solid var(--neon-yellow)', paddingBottom: '5px', fontSize: '1.2em' }}>{assignmentTitle}</h3>
                
                {loading && !submissionData && (
                    <div className="message-box info-neon"><FaSpinner className="spinner" /> Loading details...</div>
                )}
                
                {localError && (
                    <div className="message-box error-neon"><FaExclamationTriangle /> {localError}</div>
                )}

                {!loading && submissionData && (
                    <form onSubmit={handleSaveGrade}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <p><strong>Student:</strong> {submissionData.studentName}</p>
                            <p><strong>Submitted:</strong> {new Date(submissionData.submittedAt).toLocaleString()}</p>
                            <p style={{ color: submissionData.isLate ? 'var(--neon-pink)' : 'var(--neon-green)' }}>
                                {submissionData.isLate ? <FaClock /> : <FaCheckCircle />} {submissionData.isLate ? 'LATE' : 'On Time'}
                            </p>
                        </div>

                        {/* Submitted Resources */}
                        <h4 style={{ borderBottom: '1px dotted #555', paddingBottom: '5px' }}><FaPaperclip /> Submitted Files:</h4>
                        <div style={{ padding: '10px 0', borderBottom: '1px solid #333' }}>
                            {submissionData.SubmittedResources && submissionData.SubmittedResources.length > 0 ? (
                                submissionData.SubmittedResources.map((res, idx) => (
                                    <a key={idx} href={res.resourceLink} target="_blank" rel="noopener noreferrer" className="btn-icon-link-neon" style={{ marginRight: '10px', marginBottom: '5px' }}>
                                        <FaFileDownload /> {res.title}
                                    </a>
                                ))
                            ) : (
                                <p style={{ opacity: 0.7 }}>No files attached by student.</p>
                            )}
                        </div>

                        {/* Student Comment */}
                        <div style={{ marginTop: '15px', padding: '10px', border: '1px solid var(--neon-blue)', borderRadius: '5px', backgroundColor: 'rgba(0, 150, 255, 0.05)' }}>
                             <p style={{ fontWeight: 'bold' }}><FaCommentDots /> Student Comment:</p>
                             <p style={{ marginTop: '5px', whiteSpace: 'pre-wrap' }}>{submissionData.studentComment || '—'}</p>
                        </div>

                        <hr style={{margin: '20px 0'}} />
                        
                        {/* Current Grade Status */}
                        <p style={{marginBottom: '10px'}}>
                            <strong>Current Grade:</strong> 
                            <span style={{color: submissionData.grade === 'N/A (Ungraded)' ? 'var(--neon-pink)' : 'var(--neon-green)', fontWeight: 'bold', marginLeft: '10px'}}>
                                {submissionData.grade === 'N/A (Ungraded)' ? submissionData.grade : `${submissionData.grade} / ${maxPoints}`}
                            </span>
                        </p>
                        {submissionData.gradedBy && (
                            <p style={{marginBottom: '15px', fontSize: '0.9em', opacity: 0.8}}>
                                Graded By: {submissionData.gradedBy} on {new Date(submissionData.gradedAt).toLocaleString()}
                            </p>
                        )}


                        {/* Grading Form */}
                        <div className="form-group">
                            <label htmlFor="grade">Grade (Max: {maxPoints})</label>
                            <input 
                                id="grade"
                                type="number" 
                                value={grade} 
                                onChange={handleGradeChange} 
                                min="0" 
                                max={maxPoints} 
                                required 
                                style={{ fontSize: '1.2em', padding: '10px' }}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="feedback">Feedback for Student</label>
                            <textarea 
                                id="feedback"
                                value={feedback} 
                                onChange={(e) => setFeedback(e.target.value)} 
                                rows="4"
                            ></textarea>
                        </div>
                        
                        {localError && (
                            <div className="message-box error-neon"><FaExclamationTriangle /> {localError}</div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '30px' }}>
                            <div>
                                {submissionData.grade !== 'N/A (Ungraded)' && (
                                    <button type="button" onClick={handleUnmarkGrade} className="btn-icon-danger-neon" disabled={loading}>
                                        <FaTrash /> Remove Grade
                                    </button>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" onClick={onClose} className="btn-secondary-neon" disabled={loading}>
                                    <FaTimes /> Close
                                </button>
                                <button type="submit" className="btn-icon-primary-neon" disabled={loading}>
                                    {loading ? <FaSpinner className="spinner" /> : <FaSave />} Save Grade
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};


// --- COMPONENT: TeacherAssignmentSubmissions ---
const TeacherAssignmentSubmissions = () => {
    const { isAuthenticated, role, token, name, logout } = useAuth();
    const navigate = useNavigate();
    const { assignmentId } = useParams();

    // Sidebar state
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // State for Assignment Details
    const [assignment, setAssignment] = useState(null);
    const [assignmentLoading, setAssignmentLoading] = useState(true);
    const [assignmentError, setAssignmentError] = useState(null);

    // State for Submissions
    const [submissions, setSubmissions] = useState([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);
    
    // State for Modals
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    // NEW GRADING STATE
    const [showGradeModal, setShowGradeModal] = useState(false);
    const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);

    const [modalLoading, setModalLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    // --- Data Fetcher ---
    const fetchData = async () => {
        setAssignmentLoading(true);
        setAssignmentError(null);
        setErrorMessage(null);
        setSuccessMessage(null); // Clear success message on new fetch

        try {
            // 1. Fetch Assignment Details
            const assignmentData = await apiGetAssignmentDetails(assignmentId, token);
            setAssignment(assignmentData);

            // 2. Fetch Submissions
            setSubmissionsLoading(true); 
            const submissionsList = await apiGetSubmissionsByAssignment(assignmentId, token);
            setSubmissions(submissionsList);

        } catch (err) {
            console.error("Fetch Data Error:", err);
            setAssignmentError(err.response?.data?.message || err.message || "Failed to fetch data.");
        } finally {
            setAssignmentLoading(false);
            setSubmissionsLoading(false); 
        }
    };

    // --- EFFECT: Auth Check & Data Fetch ---
    useEffect(() => {
        if (!isAuthenticated || role !== 'Teacher' || !token || !assignmentId) {
            if (!isAuthenticated) navigate('/login');
            else navigate('/');
            return;
        }
        
        fetchData();
    }, [isAuthenticated, role, navigate, token, assignmentId]);

    // --- Handler for Assignment Update ---
    const handleSaveAssignment = async (updatedData) => {
        setModalLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);
        try {
            const savedAssignment = await apiUpdateAssignment(assignmentId, updatedData, token);
            setAssignment(savedAssignment);
            setSuccessMessage('Assignment successfully updated!');
            setShowEditModal(false);
        } catch (err) {
            setErrorMessage(err.response?.data?.message || err.message || 'Failed to update assignment.');
        } finally {
            setModalLoading(false);
        }
    };

    // --- Handler for Assignment Delete ---
    const handleDeleteAssignment = async () => {
        setModalLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);
        try {
            await apiDeleteAssignment(assignmentId, token);
            setSuccessMessage('Assignment successfully deleted. Redirecting...');
            setShowDeleteConfirm(false);
            
            setTimeout(() => {
                navigate(`/teacher/course/${assignment.courseId}/details`);
            }, 1500);
        } catch (err) {
            setErrorMessage(err.response?.data?.message || err.message || 'Failed to delete assignment.');
            setShowDeleteConfirm(false);
        } finally {
            setModalLoading(false);
        }
    };
    
    // --- Handler for Grading Action ---
    const handleGradeAction = (submissionId) => {
        setSelectedSubmissionId(submissionId);
        setShowGradeModal(true);
    };

    const handleGradeModalClose = () => {
        setSelectedSubmissionId(null);
        setShowGradeModal(false);
    };
    
    // Handler after grade is successfully saved or unmarked
    const handleGradeUpdateSuccess = (message) => {
        setSuccessMessage(message);
        // Re-fetch submissions list to update the table
        fetchData(); 
    };

    // --- SIDEBAR AND NAVBAR HANDLERS ---
    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const handleLogout = logout;

    // --- NAVIGATION BAR COMPONENT ---
    const CourseNavbar = () => (
        <nav className="dashboard-navbar-neon">
            <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
                {isSidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <div className="logo"><FaUniversity className="logo-icon"/> The Matrix Academy</div>
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

    // --- SIDEBAR COMPONENT ---
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
                    <FaUserCircle /> <span className="link-text">Profile</span>
                </Link>
            </nav>
        </aside>
    );

    // --- RENDER LOGIC ---
    if (!isAuthenticated || role !== 'Teacher') return <div className="app-container">Unauthorized Access.</div>;

    const mainContentClass = `main-content-area ${!isSidebarOpen ? 'sidebar-closed-content' : ''}`;

    let backLinkUrl = '/teacher/courses';
    if (assignment && assignment.courseId) {
        backLinkUrl = `/teacher/course/${assignment.courseId}/details`; 
    }

    return (
        <div className="app-container"> 

            <CourseNavbar />
            <CourseSidebar />

            <main className={mainContentClass}>
                <div className="dashboard-section">
                    
                    <h1 className="form-title-neon section-title-neon">
                        <FaFileSignature /> Assignment: {assignment ? assignment.title : 'Loading...'}
                    </h1>
                    
                    <Link to={backLinkUrl} className="btn-secondary-neon back-link" style={{marginBottom: '20px'}}>
                        &larr; Back to Course Overview
                    </Link>
                    
                    <button className="btn-secondary-neon" onClick={fetchData} disabled={assignmentLoading || submissionsLoading} style={{marginLeft: '10px'}}>
                        <FaSyncAlt className={submissionsLoading ? 'spinner' : ''} /> Refresh Data
                    </button>

                    {/* Notifications */}
                    {successMessage && (
                        <div className="message-box success-neon"><FaCheckCircle /> {successMessage}</div>
                    )}
                    {(assignmentError || errorMessage) && (
                        <div className="message-box error-neon"><FaExclamationTriangle /> Error: {assignmentError || errorMessage}</div>
                    )}

                    {/* Loading States */}
                    {(assignmentLoading && !assignment) && (
                        <div className="message-box success-neon"><FaSpinner className="spinner" /> Loading assignment details...</div>
                    )}

                    {/* Assignment Details Panel */}
                    {!assignmentLoading && assignment && (
                        <div className="widget-card assignment-details-card-neon" style={{marginBottom: '30px'}}>
                            <h2 style={{borderBottom: '2px solid var(--neon-blue)', paddingBottom: '10px'}}>{assignment.title}</h2>
                            <p><strong>Course ID:</strong> {assignment.courseId}</p>
                            <p><strong>Max Points:</strong> {assignment.maxPoints}</p>
                            <p><strong>Due Date:</strong> {new Date(assignment.dueDate).toLocaleString()}</p>
                            <p><strong>Description:</strong> {assignment.description || 'No detailed instructions provided.'}</p>
                            
                            {/* Resources List */}
                            {assignment.Resources && assignment.Resources.length > 0 && (
                                <div style={{ marginTop: '15px' }}>
                                    <p style={{ fontWeight: 'bold' }}><FaPaperclip /> Provided Resources:</p>
                                    <ul style={{ listStyleType: 'disc', marginLeft: '20px', fontSize: '0.9em' }}>
                                        {assignment.Resources.map((res, idx) => (
                                            <li key={idx}>
                                                <a href={res.resourceLink} target="_blank" rel="noopener noreferrer" className="neon-link">
                                                    [{res.fileType || 'Link'}] {res.title || 'View Resource'}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <hr style={{margin: '20px 0', border: 'none', borderTop: '1px dotted var(--neon-blue)'}} />
                            
                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    className="btn-secondary-neon" 
                                    onClick={() => setShowEditModal(true)}>
                                    <FaEdit /> Edit Assignment
                                </button>
                                <button 
                                    className="btn-icon-danger-neon" 
                                    onClick={() => setShowDeleteConfirm(true)}>
                                    <FaTrash /> Delete Assignment
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* Submissions List */}
                    {assignment && (
                        <div className="widget-card submission-list-section" style={{ borderTop: '1px solid var(--neon-yellow)' }}>
                            <h3 style={{ marginBottom: '15px' }}><FaUsers /> Submissions ({submissions.length})</h3>
                            
                            {submissionsLoading && (
                                <p className="loading-text"><FaSpinner className="spinner" /> Loading submissions...</p>
                            )}

                            {!submissionsLoading && submissions.length > 0 ? (
                                <table className="data-table-neon" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Submitted At</th>
                                            <th>Status</th>
                                            <th>Grade</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {submissions.map(sub => (
                                            <tr key={sub.id}>
                                                <td>{sub.Student ? sub.Student.name : 'Unknown Student'}</td>
                                                <td>{new Date(sub.submittedAt).toLocaleString()}</td>
                                                <td style={{ color: sub.isLate ? 'var(--neon-pink)' : 'var(--neon-green)' }}>
                                                    {sub.isLate ? <FaClock /> : <FaCheckCircle />} {sub.isLate ? 'LATE' : 'On Time'}
                                                </td>
                                                <td>
                                                    {sub.grade !== null ? `${sub.grade} / ${assignment.maxPoints}` : '—'}
                                                </td>
                                                <td>
                                                    <button 
                                                        className="btn-icon-secondary-neon" 
                                                        title="View Submission Details"
                                                        onClick={() => handleGradeAction(sub.id)} 
                                                    >
                                                        <FaFileDownload /> View
                                                    </button>
                                                    <button 
                                                        className="btn-icon-primary-neon" 
                                                        title="Grade Submission" 
                                                        style={{ marginLeft: '8px' }}
                                                        onClick={() => handleGradeAction(sub.id)} 
                                                    >
                                                        <FaGraduationCap /> Grade
                                                    </button>
                                                    <span title="Student Comment" style={{ marginLeft: '8px', opacity: sub.studentComment ? 1 : 0.3 }}><FaCommentDots /></span>
                                                    
                                                    {sub.SubmittedResources && sub.SubmittedResources.map((res, idx) => (
                                                        <a key={idx} href={res.resourceLink} target="_blank" rel="noopener noreferrer" className="btn-icon-link-neon" title={`Download ${res.title}`}>
                                                            <FaPaperclip />
                                                        </a>
                                                    ))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="message-box info-neon">No submissions received for this assignment yet.</div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Edit Assignment Modal */}
            <EditAssignmentModal 
                show={showEditModal}
                onClose={() => setShowEditModal(false)}
                assignment={assignment}
                onSave={handleSaveAssignment}
                loading={modalLoading}
            />

            {/* Grade Submission Modal (NEW) */}
            <GradeSubmissionModal
                show={showGradeModal}
                onClose={handleGradeModalClose}
                submissionId={selectedSubmissionId}
                maxPoints={assignment?.maxPoints || 100}
                assignmentTitle={assignment?.title || 'Assignment'}
                onGradeUpdate={handleGradeUpdateSuccess}
            />

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal-backdrop">
                    <div className="modal-content widget-card">
                        <h3 className="error-neon"><FaExclamationTriangle /> Confirm Deletion</h3>
                        <p>Are you sure you want to delete the assignment **{assignment?.title}**?</p>
                        <p className="error-neon" style={{ fontWeight: 'bold' }}>This action cannot be undone and will remove all associated student submissions!</p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary-neon" disabled={modalLoading}>
                                <FaTimes /> Cancel
                            </button>
                            <button onClick={handleDeleteAssignment} className="btn-icon-danger-neon" disabled={modalLoading}>
                                {modalLoading ? <FaSpinner className="spinner" /> : <FaTrash />} Confirm Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherAssignmentSubmissions;