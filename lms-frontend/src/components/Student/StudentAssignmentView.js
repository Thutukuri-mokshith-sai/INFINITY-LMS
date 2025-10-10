import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    FaUniversity, FaBookOpen, FaUserCircle, FaSignOutAlt, FaBars, FaTimes,
    FaListAlt, FaStar, FaArrowLeft, FaClock, FaSpinner, FaExclamationCircle,
    FaFileSignature, FaCheckCircle, FaHourglassHalf, FaClipboardCheck,
    FaPaperclip, FaPlus, FaTrash, FaLink, FaCommentDots, FaRegFilePdf, FaEdit, FaRegTrashAlt
} from 'react-icons/fa';
import { useAuth } from "../../context/AuthContext";
// Assuming the shared styles and reusable components are accessible
import './StudentDashboard.css';

// --- Configuration ---
const API_BASE_URL = 'https://lms-portal-backend-h5k8.onrender.com/api';

// --- CLOUDINARY CONFIGURATION (REPLACE WITH YOUR ACTUAL CREDENTIALS) ---
const CLOUD_NAME = 'duzmfqbkd'; // <-- REPLACE THIS
const UPLOAD_PRESET = 'pdf_upload';     // <-- REPLACE THIS

// ---------------------------------------------------------------------
// --- REUSED DASHBOARD COMPONENTS (Keep these imports or ensure they are imported from a shared file) ---
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

// ---------------------------------------------------------------------
// --- HELPER FUNCTION: CLOUDINARY UPLOAD ---
// ---------------------------------------------------------------------

/**
 * Uploads a local file (PDF) to Cloudinary.
 */
const uploadFileToCloudinary = async (file) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
        throw new Error("Cloudinary configuration is missing. Cannot upload file.");
    }
    
    if (!file || file.type !== "application/pdf") {
        throw new Error("Invalid or non-PDF file provided for upload.");
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`, {
        method: 'POST',
        body: formData
    });

    const data = await res.json();
    
    if (data.secure_url) {
        return { 
            resourceLink: data.secure_url, 
            title: file.name,
            fileType: 'PDF' // Explicitly set type for server-side
        };
    } else {
        console.error("Cloudinary response:", data);
        throw new Error(data.error?.message || "Cloudinary upload failed.");
    }
};

// ---------------------------------------------------------------------
// --- MAIN COMPONENT: StudentAssignmentView ---
// ---------------------------------------------------------------------

const initialResource = { 
    title: '', 
    resourceLink: '', 
    fileType: 'Link', 
    file: null, 
    inputType: 'Link' // 'Link' or 'File'
};

const StudentAssignmentView = () => {
    const { assignmentId } = useParams();
    const auth = useAuth();
    const navigate = useNavigate();

    const { user, logout, token } = auth;
    const studentName = user?.name || 'Student';

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const [assignment, setAssignment] = useState(null);
    const [submission, setSubmission] = useState(null);
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState(null);
    const [submissionSuccess, setSubmissionSuccess] = useState(null);
    
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);
    const [deleteSuccess, setDeleteSuccess] = useState(null);


    // --- Submission Form State ---
    const [studentComment, setStudentComment] = useState('');
    const [resources, setResources] = useState([initialResource]);

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const toggleProfile = () => setIsProfileOpen(prev => !prev);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // --- Resource Management Functions ---
    const handleResourceChange = (index, field, value) => {
        const newResources = resources.map((res, i) => {
            if (i === index) {
                // If updating a file input, store the file object and its name/type
                if (field === 'file') {
                    const file = value;
                    if (file && file.type === 'application/pdf') {
                        return { 
                            ...res, 
                            file: file,
                            title: file.name, // Use file name as title
                            resourceLink: '', // Clear old link
                            fileType: 'PDF'
                        };
                    } else if (file) {
                        alert("Please select a valid PDF file.");
                        return { ...res, file: null, title: '', resourceLink: '' };
                    } else {
                        // File input was cleared
                        return { ...res, file: null, title: '', resourceLink: '' };
                    }
                }
                
                // If changing the input type
                if (field === 'inputType') {
                    // Reset resource state when changing type
                    return { ...initialResource, inputType: value };
                }

                // Normal text input update (for Link type)
                return { ...res, [field]: value };
            }
            return res;
        });
        setResources(newResources);
    };

    const addResource = () => {
        setResources([...resources, initialResource]);
    };

    const removeResource = (index) => {
        setResources(resources.filter((_, i) => i !== index));
    };

    // --- API Fetch Logic ---
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            if (!token || !assignmentId) {
                setError(token ? "Invalid assignment ID." : "Authentication required. Please log in.");
                if (!token) navigate('/login');
                setIsLoading(false);
                return;
            }

            try {
                // 1. Fetch Assignment Details
                const assignmentResponse = await fetch(`${API_BASE_URL}/assignments/${assignmentId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!assignmentResponse.ok) {
                    throw new Error('Failed to fetch assignment details.');
                }
                const assignmentData = await assignmentResponse.json();
                const fetchedAssignment = assignmentData.data.assignment;
                setAssignment(fetchedAssignment);
                
                // 2. Fetch Student's Submission Status
                const submissionResponse = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/my-submission`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (submissionResponse.status === 200) {
                    const submissionData = await submissionResponse.json();
                    const fetchedSubmission = submissionData.data.submission;
                    setSubmission(fetchedSubmission);

                    // Pre-fill form with existing submission data for resubmission
                    setStudentComment(fetchedSubmission.studentComment || '');
                    if (fetchedSubmission.SubmittedResources && fetchedSubmission.SubmittedResources.length > 0) {
                        setResources(fetchedSubmission.SubmittedResources.map(res => ({
                            title: res.title || '',
                            resourceLink: res.resourceLink || '',
                            fileType: res.fileType || 'Link',
                            file: null, // Always null for existing resources
                            inputType: 'Link' // Existing resources are always treated as links/URLs
                        })));
                    } else {
                        setResources([initialResource]);
                    }
                } else if (submissionResponse.status !== 404) {
                    throw new Error('Failed to retrieve your submission status.');
                } else {
                    setSubmission(null);
                    setStudentComment('');
                    setResources([initialResource]);
                }
                
            } catch (err) {
                console.error("Assignment/Submission fetch error:", err);
                setError(err.message || 'An unexpected error occurred while loading assignment data.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [assignmentId, token, navigate]);


    // --- Unified Submission/Update Handler ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmissionError(null);
        setSubmissionSuccess(null);
        setIsSubmitting(true);
        setDeleteSuccess(null); 

        // 1. Validate and Prepare Resources for Upload/Submission
        const resourcesToUpload = resources.filter(r => r.inputType === 'File' && r.file);
        const resourcesToSubmit = resources.filter(r => r.inputType === 'Link' && r.resourceLink.trim() !== '');
        
        if (resourcesToUpload.length === 0 && resourcesToSubmit.length === 0) {
            setSubmissionError('You must provide at least one resource link or upload a PDF file.');
            setIsSubmitting(false);
            return;
        }

        let finalSubmissionResources = [];

        try {
            // 2. Cloudinary Upload for PDF Files
            const uploadPromises = resourcesToUpload.map(r => uploadFileToCloudinary(r.file));
            const uploadedResources = await Promise.all(uploadPromises);
            
            // Combine already-ready link resources and newly uploaded resources
            finalSubmissionResources = [...resourcesToSubmit, ...uploadedResources];
            
            // 3. Determine API Method 
            const isDue = new Date(assignment.dueDate);
            const isPastDue = new Date() > isDue;
            
            let method = 'POST';
            let url = `${API_BASE_URL}/assignments/${assignmentId}/submit`; // Initial/Late Resubmission
            let successMessage = submission ? 'Assignment successfully resubmitted.' : 'Assignment successfully submitted.';
            
            // Use PATCH for strict pre-due date updates
            if (submission && !isPastDue && submission.grade === null) {
                method = 'PATCH';
                url = `${API_BASE_URL}/assignments/${assignmentId}/my-submission`;
                successMessage = 'Submission successfully updated.';
            }

            // 4. Send Data to Backend
            const payload = {
                studentComment: studentComment,
                resources: finalSubmissionResources // Only include title, resourceLink, fileType
            };

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to process submission.');
            }

           // ✅ Fetch latest submission details after successful submission
try {
    const refreshResponse = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/my-submission`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!refreshResponse.ok) throw new Error("Failed to fetch updated submission data.");

    const refreshedData = await refreshResponse.json();
    const latestSubmission = refreshedData.data.submission;

    setSubmission(latestSubmission);
    setSubmissionSuccess(successMessage);
    setSubmissionError(null);

    // Refresh form fields with new data
    setStudentComment(latestSubmission.studentComment || '');
    if (latestSubmission.SubmittedResources && latestSubmission.SubmittedResources.length > 0) {
        setResources(latestSubmission.SubmittedResources.map(res => ({
            title: res.title || '',
            resourceLink: res.resourceLink || '',
            fileType: res.fileType || 'Link',
            file: null,
            inputType: 'Link'
        })));
    } else {
        setResources([initialResource]);
    }

} catch (fetchErr) {
    console.warn("Could not refresh submission after save:", fetchErr);
    setSubmissionSuccess(successMessage + " (but failed to refresh latest data)");
}

        } catch (err) {
            console.error("Submission error:", err);
            setSubmissionError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // --- Delete Handler ---
    const handleDeleteSubmission = async () => {
        if (!window.confirm("Are you sure you want to delete your submission? This action cannot be undone.")) return;

        setIsDeleting(true);
        setDeleteError(null);
        setDeleteSuccess(null);
        setSubmissionSuccess(null);

        try {
            const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/my-submission`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const responseBody = response.status === 204 ? {} : await response.json();

            if (!response.ok) {
                 // Check for 403 (due date passed) or 404 (not found)
                 throw new Error(responseBody.message || 'Failed to delete submission.');
            }

            // Success: Remove local submission state and reset form
            setSubmission(null);
            setStudentComment('');
            setResources([initialResource]);
            setDeleteSuccess('Submission successfully deleted. You can submit again.');

        } catch (err) {
            console.error("Delete error:", err);
            setDeleteError(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const mainContentClass = `main-content-area ${!isSidebarOpen ? 'sidebar-closed-content' : ''}`;

    // --- Helper for Status Display ---
    const getSubmissionStatus = () => {
        if (!assignment) return { status: 'Loading...', icon: <FaSpinner className="spinner" /> };
        
        const due = new Date(assignment.dueDate);
        const now = new Date();
        const isOverdue = now > due;

        if (submission) {
            if (submission.grade !== null) {
                return { 
                    status: 'Graded', 
                    class: 'graded', 
                    icon: <FaClipboardCheck /> 
                };
            }
            return { 
                status: `Submitted: ${submission.isLate ? 'Late' : 'On Time'}`, 
                class: 'submitted', 
                icon: <FaCheckCircle /> 
            };
        }

        if (isOverdue) {
            return { status: 'Overdue - Not Submitted', class: 'overdue', icon: <FaExclamationCircle /> };
        }

        return { status: 'Pending Submission', class: 'pending', icon: <FaHourglassHalf /> };
    };

    // --- Loading and Error States ---
    if (isLoading) {
         return (
             <div className="app-container">
                    <DashboardNavbar studentName={studentName} onLogout={handleLogout} onProfileToggle={toggleProfile} onSidebarToggle={toggleSidebar} isSidebarOpen={isSidebarOpen}/>
                    <DashboardSidebar isOpen={isSidebarOpen} />
                    <main className={mainContentClass}>
                        <div className="loading-state">
                            <FaSpinner className="spinner" />
                            <p>Loading assignment details...</p>
                        </div>
                    </main>
             </div>
         );
    }

    if (error || !assignment) {
         return (
             <div className="app-container">
                    <DashboardNavbar studentName={studentName} onLogout={handleLogout} onProfileToggle={toggleProfile} onSidebarToggle={toggleSidebar} isSidebarOpen={isSidebarOpen}/>
                    <DashboardSidebar isOpen={isSidebarOpen} />
                    <main className={mainContentClass}>
                        <div className="error-state">
                            <p>Error: {error || `Assignment ID ${assignmentId} not found.`}</p>
                            <Link to="/student/my-courses" className="btn-action-neon" style={{ marginTop: '10px' }}>
                                <FaArrowLeft /> Back to My Courses
                            </Link>
                        </div>
                    </main>
             </div>
         );
    }
    
    const status = getSubmissionStatus();
    const isDue = new Date(assignment.dueDate);
    const isPastDue = new Date() > isDue;
    // Can delete if submitted, not graded, and before deadline
    const canDelete = submission && !isPastDue && submission.grade === null; 
    const isSubmittedAndGraded = submission && submission.grade !== null;

    // --- Main Render ---
    return (
        <>
            {isProfileOpen && (
                <ProfileModal authData={{ name: studentName, email: user?.email, userId: user?.id, role: user?.role, logout: handleLogout }} onClose={toggleProfile} />
            )}

            <div className="app-container">
                <DashboardNavbar studentName={studentName} onLogout={handleLogout} onProfileToggle={toggleProfile} onSidebarToggle={toggleSidebar} isSidebarOpen={isSidebarOpen}/>
                <DashboardSidebar isOpen={isSidebarOpen} />

                <main className={mainContentClass}>
                    <Link to={`/student/my-courses/${assignment.courseId}`} className="btn-action-neon" style={{ marginBottom: '20px' }}>
                        <FaArrowLeft /> Back to Course View
                    </Link>

                    <div className="welcome-banner dashboard-section assignment-header-view">
                        <h1 className="section-title-neon"><FaFileSignature /> {assignment.title}</h1>
                        <p className="section-subtitle-neon">Course: {assignment.Course?.title || 'Loading...'}</p>
                    </div>

                    <div className="assignment-view-grid">
                        
                        {/* -------------------- Column 1: Assignment Details -------------------- */}
                        <section className="dashboard-section assignment-details">
                            <h2 className="section-title-neon">Instructions & Resources</h2>
                            <div className="widget-card">
                                
                                <div className="detail-meta">
                                    <p><FaClock /> <strong>Due Date:</strong> {isDue.toLocaleDateString()} {isDue.toLocaleTimeString()}</p>
                                    <p><FaStar /> <strong>Points Possible:</strong> {assignment.maxPoints}</p>
                                </div>
                                
                                <h4 style={{ color: '#00ff00', marginTop: '15px' }}>Description:</h4>
                                <p style={{ whiteSpace: 'pre-wrap' }}>{assignment.description || 'No detailed instructions provided.'}</p>
                                
                                <h4 style={{ color: '#00ff00', marginTop: '20px' }}>Provided Resources:</h4>
                                {assignment.Resources && assignment.Resources.length > 0 ? (
                                    <ul className="resource-list">
                                        {assignment.Resources.map((res, index) => (
                                            <li key={index}>
                                                <FaPaperclip /> 
                                                <a href={res.resourceLink} target="_blank" rel="noopener noreferrer" className="neon-link">
                                                    {res.title} ({res.fileType})
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>No resources provided by the teacher.</p>
                                )}
                            </div>

                            {/* Teacher Feedback Card (Only visible if graded) */}
                            {isSubmittedAndGraded && (
                                <div className="widget-card feedback-card">
                                    <h2 className="section-title-neon" style={{ color: '#87cefa' }}><FaCommentDots /> Teacher Feedback</h2>
                                    <p className="status-detail">
                                        Your assignment has been **GRADED**. Check the Grades tab for your score.
                                    </p>
                                    <div className="feedback-content">
                                        <h4 style={{ color: '#00ff00', marginTop: '10px' }}>Feedback Notes:</h4>
                                        <p style={{ whiteSpace: 'pre-wrap' }}>{submission.feedback || 'No written feedback provided.'}</p>
                                    </div>
                                    <p className="graded-at">Graded on: {new Date(submission.gradedAt).toLocaleDateString()}</p>
                                </div>
                            )}

                        </section>

                        {/* -------------------- Column 2: Submission Area -------------------- */}
                        <section className="dashboard-section submission-area">
                            <h2 className="section-title-neon">Your Submission Status</h2>
                            
                            {/* Submission Status Box */}
                            <div className={`widget-card status-box status-${status.class}`}>
                                <div className="status-indicator">
                                    {status.icon} 
                                    <span>{status.status}</span>
                                </div>
                                <p className="status-detail">
                                    {submission 
                                        ? `Last submitted on: ${new Date(submission.submittedAt).toLocaleString()}` 
                                        : (isPastDue ? 'This assignment is past due. Submissions will be marked as late.' : 'Ready to submit.')
                                    }
                                </p>

                                {/* Delete Button - Visible only if criteria met */}
                                {canDelete && (
                                    <div className="delete-submission-area">
                                        <button 
                                            type="button" 
                                            onClick={handleDeleteSubmission} 
                                            className="btn-delete-neon" 
                                            disabled={isDeleting || isSubmitting}
                                            style={{ marginTop: '15px' }}
                                        >
                                            {isDeleting ? <FaSpinner className="spinner" /> : <FaRegTrashAlt />} 
                                            {isDeleting ? 'Deleting...' : 'Delete Submission'}
                                        </button>
                                    </div>
                                )}

                                {/* Display submitted resources if submission exists */}
                                {submission && submission.SubmittedResources && submission.SubmittedResources.length > 0 && (
                                    <div style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                                        <h4>Submitted Resources:</h4>
                                        <ul className="submitted-resource-list">
                                            {submission.SubmittedResources.map((res, index) => (
                                                <li key={index}>
                                                    {res.fileType === 'PDF' ? <FaRegFilePdf /> : <FaLink />} 
                                                    <a href={res.resourceLink} target="_blank" rel="noopener noreferrer" className="neon-link">{res.title || res.resourceLink} ({res.fileType})</a>
                                                </li>
                                            ))}
                                        </ul>
                                        <h4 style={{ marginTop: '10px' }}>Your Comment:</h4>
                                        <p className="student-comment-display">{submission.studentComment || 'No comment provided.'}</p>
                                    </div>
                                )}
                            </div>

                            {/* Submission/Resubmission Form */}
                            <form className="widget-card submission-form" onSubmit={handleSubmit}>
                                <h3 className="section-title-neon form-title">
                                    {submission ? (!isPastDue ? <FaEdit /> : <FaCheckCircle />) : <FaFileSignature />}
                                    {isSubmittedAndGraded ? 'Submission Finalized (Graded)' : (submission ? (isPastDue ? 'Late Resubmission' : 'Update/Resubmit') : 'New Submission')}
                                </h3>

                                {submissionError && <p className="error-message-neon">{submissionError}</p>}
                                {submissionSuccess && <p className="success-message-neon">{submissionSuccess}</p>}
                                {deleteError && <p className="error-message-neon">{deleteError}</p>}
                                {deleteSuccess && <p className="success-message-neon">{deleteSuccess}</p>}
                                
                                {isPastDue && !isSubmittedAndGraded && <p className="warning-message-neon">WARNING: Submitting now will mark your work as LATE.</p>}
                                {isSubmittedAndGraded && <p className="info-message-neon">This assignment has been graded and cannot be resubmitted.</p>}
                                
                                {/* Resource Inputs */}
                                <fieldset disabled={isSubmittedAndGraded}>
                                    <label className="form-label-neon">Submission Resources (Links or PDFs)</label>
                                    <div className="resource-input-group">
                                        {resources.map((res, index) => (
                                            <div key={index} className="resource-item">
                                                {/* Resource Type Selector */}
                                                <select 
                                                    value={res.inputType}
                                                    onChange={(e) => handleResourceChange(index, 'inputType', e.target.value)}
                                                    className="input-neon small"
                                                    style={{ width: '100px', flexShrink: 0, marginRight: '10px' }}
                                                >
                                                    <option value="Link">Link</option>
                                                    <option value="File">PDF File</option>
                                                </select>

                                                {res.inputType === 'Link' ? (
                                                    <>
                                                        <input
                                                            type="text"
                                                            placeholder="Link Title (e.g., GitHub Repo)"
                                                            value={res.title}
                                                            onChange={(e) => handleResourceChange(index, 'title', e.target.value)}
                                                            className="input-neon small"
                                                        />
                                                        <input
                                                            type="url"
                                                            placeholder="Resource URL (Required)"
                                                            value={res.resourceLink}
                                                            onChange={(e) => handleResourceChange(index, 'resourceLink', e.target.value)}
                                                            className="input-neon"
                                                            required={res.inputType === 'Link'}
                                                        />
                                                    </>
                                                ) : (
                                                    <>
                                                        {res.file ? <FaRegFilePdf style={{ color: '#00ff00', marginRight: '5px' }} /> : <FaRegFilePdf style={{ color: '#ccc', marginRight: '5px' }} />}
                                                        
                                                        {res.file && (
                                                            <span className="selected-file-name" style={{ flexGrow: 1, color: '#87cefa', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {res.file.name} (Ready)
                                                            </span>
                                                        )}
                                                        
                                                        <input
                                                            type="file"
                                                            accept="application/pdf"
                                                            onChange={(e) => handleResourceChange(index, 'file', e.target.files[0])}
                                                            className="input-neon"
                                                            required={res.inputType === 'File' && !res.file}
                                                            style={{ 
                                                                flexGrow: 1, 
                                                                // If a file is selected, show a clickable placeholder to clear it or the actual input
                                                                display: res.file ? 'none' : 'block' 
                                                            }} 
                                                        />
                                                        {res.file && (
                                                            <button 
                                                                type="button" 
                                                                onClick={() => handleResourceChange(index, 'file', null)} 
                                                                className="btn-remove-resource" 
                                                                title="Clear selected file"
                                                            >
                                                                <FaTimes />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                                
                                                {resources.length > 1 && (
                                                    <button type="button" onClick={() => removeResource(index)} className="btn-remove-resource">
                                                        <FaTrash />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button type="button" onClick={addResource} className="btn-add-resource full-width-btn">
                                            <FaPlus /> Add Another Resource
                                        </button>
                                    </div>

                                    {/* Student Comment Input */}
                                    <label htmlFor="studentComment" className="form-label-neon">Comment for Teacher (Optional)</label>
                                    <textarea
                                        id="studentComment"
                                        value={studentComment}
                                        onChange={(e) => setStudentComment(e.target.value)}
                                        rows="4"
                                        className="input-neon"
                                        placeholder="e.g., 'Please review commit history on the GitHub link.'"
                                    ></textarea>
                                </fieldset>
                                
                                <button type="submit" className="btn-submit-neon full-width-btn" disabled={isSubmitting || isDeleting || isSubmittedAndGraded}>
                                    {isSubmitting ? <FaSpinner className="spinner" /> : (isSubmittedAndGraded ? 'Graded - Cannot Resubmit' : (submission ? (isPastDue ? 'Resubmit Late' : 'Update Submission') : 'Submit Assignment'))}
                                </button>
                            </form>

                        </section>
                    </div>
                </main>
            </div>
        </>
    );
};

export default StudentAssignmentView;