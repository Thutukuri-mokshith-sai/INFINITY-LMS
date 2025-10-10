import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    FaChalkboardTeacher, FaPlusCircle, FaEdit, FaTrash, FaClock,
    FaCalendarAlt, FaTimes, FaBars, FaUniversity, FaUserCircle,
    FaSignOutAlt, FaListAlt, FaGraduationCap, FaSpinner, FaInfoCircle, FaUsers, 
    FaChevronDown, FaChevronUp, FaFileSignature, FaPaperclip, FaSave, FaExclamationTriangle, FaUpload,
    FaComments, FaEye, FaPen // <-- ALL NECESSARY ICONS IMPORTED
} from 'react-icons/fa';
import { useAuth } from "../../context/AuthContext";
import axios from 'axios';
import './TeacherCourses.css'; 

// --- API CONFIG ---
const API_URL = process.env.REACT_APP_API_URL || 'https://lms-portal-backend-h5k8.onrender.com/api';

// --- CLOUDINARY CONFIG (Use environment variables in a real app) ---
const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'duzmfqbkd'; // REPLACE THIS
const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'pdf_upload'; // REPLACE THIS

// Utility function to generate a simple unique ID
const generateUniqueId = () => Date.now() + Math.random();

// --- API FUNCTIONS ---

const apiGetCourseDetails = async (courseId, token) => {
    try {
        const response = await axios.get(`${API_URL}/courses/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        return response.data.course;
    } catch (error) {
        console.error("API Fetch Course Details Error:", error.response || error);
        throw new Error(error.response?.data?.message || 'Server error while fetching course details.');
    }
};

const apiGetStudentsByCourse = async (courseId, token) => {
    try {
        const response = await axios.get(`${API_URL}/enrollments/course/${courseId}/students`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        return response.data.data.students;
    } catch (error) {
        console.error("API Fetch Students Error:", error.response || error);
        throw new Error(error.response?.data?.message || 'Server error while fetching student roster.');
    }
};

const apiGetCourseAssignments = async (courseId, token) => {
    try {
        const response = await axios.get(`${API_URL}/assignments/course/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        return response.data.data.assignments;
    } catch (error) {
        console.error("API Fetch Assignments Error:", error.response || error);
        throw new Error(error.response?.data?.message || 'Server error while fetching assignments.');
    }
};

const apiCreateAssignment = async (assignmentData, token) => {
    try {
        const response = await axios.post(`${API_URL}/assignments`, assignmentData, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        return response.data.data.assignment;
    } catch (error) {
        console.error("API Create Assignment Error:", error.response || error);
        throw new Error(error.response?.data?.message || 'Server error while creating assignment.');
    }
};


// --- FORUM API FUNCTIONS ---

const apiGetForumByCourse = async (courseId, token) => {
    try {
        const response = await axios.get(`${API_URL}/forums/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        return response.data; 
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return null;
        }
        console.error("API Fetch Forum Error:", error.response || error);
        throw new Error(error.response?.data?.message || 'Server error while fetching forum details.');
    }
};

const apiCreateForum = async (forumData, token) => {
    try {
        const response = await axios.post(`${API_URL}/forums`, forumData, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        return response.data.forum;
    } catch (error) {
        console.error("API Create Forum Error:", error.response || error);
        throw new Error(error.response?.data?.message || 'Server error while creating forum.');
    }
};

const apiUpdateForum = async (forumId, forumData, token) => {
    try {
        const response = await axios.put(`${API_URL}/forums/${forumId}`, forumData, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("API Update Forum Error:", error.response || error);
        throw new Error(error.response?.data?.message || 'Server error while updating forum.');
    }
};

const apiDeleteForum = async (forumId, token) => {
    try {
        const response = await axios.delete(`${API_URL}/forums/${forumId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("API Delete Forum Error:", error.response || error);
        throw new Error(error.response?.data?.message || 'Server error while deleting forum.');
    }
};


// --- MAIN COMPONENT ---
const TeacherCourseDetails = () => {
    const { isAuthenticated, name: currentUserName, role, logout, token } = useAuth();
    const navigate = useNavigate();
    const { courseId } = useParams();

    // Course Details State
    const [course, setCourse] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isRosterOpen, setIsRosterOpen] = useState(false);
    const [isAssignmentOpen, setIsAssignmentOpen] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    // NEW: Forum State
    const [forum, setForum] = useState(null);
    const [isForumLoading, setIsForumLoading] = useState(false);
    const [isForumOpen, setIsForumOpen] = useState(false);
    const [isForumFormOpen, setIsForumFormOpen] = useState(false);
    const [forumForm, setForumForm] = useState({ title: '', description: '' });
    const [forumMessage, setForumMessage] = useState({ type: '', text: '' });

    // Student Roster State
    const [students, setStudents] = useState([]);
    const [isStudentsLoading, setIsStudentsLoading] = useState(false);
    const [studentsError, setStudentsError] = useState(null);

    // Assignment States
    const [assignments, setAssignments] = useState([]);
    const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false);
    const [assignmentsError, setAssignmentsError] = useState(null);

    const [newAssignment, setNewAssignment] = useState({
        title: '',
        description: '',
        dueDate: '',
        maxPoints: 100,
        resources: [{ id: generateUniqueId(), title: '', resourceLink: '', isUploading: false, fileType: '' }]
    });
    const [assignmentFormMessage, setAssignmentFormMessage] = useState({ type: '', text: '' });


    // --- EFFECT: Auth Check & Redirection ---
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (role !== 'Teacher') {
            navigate('/');
        }
    }, [isAuthenticated, role, navigate]);

    // --- EFFECT: Fetch Course Data, Roster, Assignments, & FORUM ---
    const fetchDetails = useCallback(async () => {
        if (!token || !courseId || !isAuthenticated) return;

        setIsLoading(true);
        setError(null);
        try {
            const data = await apiGetCourseDetails(courseId, token);
            setCourse(data);

            await fetchStudentRoster(courseId, token);
            await fetchAssignments(courseId, token);
            await fetchForumDetails(courseId, token);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [token, courseId, isAuthenticated]);

    const fetchStudentRoster = async (id, userToken) => {
        setStudentsError(null);
        try {
            const roster = await apiGetStudentsByCourse(id, userToken);
            setStudents(roster);
        } catch (err) {
            setStudentsError(err.message);
        }
    };

    const fetchAssignments = async (id, userToken) => {
        setIsAssignmentsLoading(true);
        setAssignmentsError(null);
        try {
            const list = await apiGetCourseAssignments(id, userToken);
            setAssignments(list);
        } catch (err) {
            setAssignmentsError(err.message);
        } finally {
            setIsAssignmentsLoading(false);
        }
    };

    const fetchForumDetails = async (id, userToken) => {
        setIsForumLoading(true);
        setForumMessage({ type: '', text: '' });
        try {
            const forumData = await apiGetForumByCourse(id, userToken);
            setForum(forumData);
            setForumForm({
                title: forumData ? forumData.title : '',
                description: forumData ? forumData.description : ''
            });
        } catch (err) {
            setForumMessage({ type: 'error', text: err.message });
        } finally {
            setIsForumLoading(false);
        }
    };
    
    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);


    // --- HANDLERS (Assignment) ---

    const handleToggleRoster = async () => {
        const newRosterState = !isRosterOpen;
        setIsRosterOpen(newRosterState);
        
        if (newRosterState && (students.length === 0 || studentsError)) {
             setIsStudentsLoading(true);
             setStudentsError(null);
             try {
                const roster = await apiGetStudentsByCourse(courseId, token);
                setStudents(roster);
            } catch (err) {
                setStudentsError(err.message);
            } finally {
                setIsStudentsLoading(false);
            }
        }
    };

    const handleAssignmentChange = (e) => {
        const { name, value } = e.target;
        setNewAssignment(prev => ({ ...prev, [name]: value }));
    };

    const handleResourceChange = (id, e) => {
        const { name, value } = e.target;
        const updatedResources = newAssignment.resources.map((resource) =>
            resource.id === id ? { ...resource, [name]: value } : resource
        );
        setNewAssignment(prev => ({ ...prev, resources: updatedResources }));
    };

    const handleAddResource = () => {
        setNewAssignment(prev => ({
            ...prev,
            resources: [...prev.resources, { id: generateUniqueId(), title: '', resourceLink: '', isUploading: false, fileType: '' }]
        }));
    };

    const handleRemoveResource = (id) => {
        setNewAssignment(prev => ({
            ...prev,
            resources: prev.resources.filter(resource => resource.id !== id)
        }));
    };

    const handleFileUpload = async (id, file) => {
        if (!file) return;

        // Set uploading state for this specific resource
        setNewAssignment(prev => ({
            ...prev,
            resources: prev.resources.map((res) =>
                res.id === id ? { ...res, isUploading: true, resourceLink: '', fileType: file.type.split('/')[1] || 'file' } : res
            )
        }));

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (data.secure_url) {
                setNewAssignment(prev => ({
                    ...prev,
                    resources: prev.resources.map((res) =>
                        res.id === id ? {
                            ...res,
                            resourceLink: data.secure_url,
                            isUploading: false,
                            title: res.title || file.name || data.public_id,
                            fileType: data.format || 'link'
                        } : res
                    )
                }));
            } else {
                throw new Error(data.error?.message || "Cloudinary upload failed.");
            }
        } catch (err) {
            console.error("Cloudinary Upload Error:", err);
            setAssignmentFormMessage({ type: 'error', text: `Failed to upload file: ${err.message}` });
            setNewAssignment(prev => ({
                ...prev,
                resources: prev.resources.map((res) =>
                    res.id === id ? { ...res, isUploading: false, resourceLink: '', fileType: '' } : res
                )
            }));
        }
    };

    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        setAssignmentFormMessage({ type: '', text: '' });

        const isAnyResourceUploading = newAssignment.resources.some(r => r.isUploading);
        if (isAnyResourceUploading) {
            setAssignmentFormMessage({ type: 'error', text: 'Please wait for all files to finish uploading before creating the assignment.' });
            return;
        }

        if (!newAssignment.title || !newAssignment.dueDate) {
            setAssignmentFormMessage({ type: 'error', text: 'Title and Due Date are required.' });
            return;
        }

        const assignmentData = {
            ...newAssignment,
            courseId: parseInt(courseId),
            resources: newAssignment.resources.filter(r => r.resourceLink.trim() !== ''),
        };

        try {
            const createdAssignment = await apiCreateAssignment(assignmentData, token);
            setAssignments(prev => [...prev, createdAssignment]);
            setAssignmentFormMessage({ type: 'success', text: `Assignment "${createdAssignment.title}" created successfully!` });

            // Reset form and close it
            setNewAssignment({
                title: '',
                description: '',
                dueDate: '',
                maxPoints: 100,
                resources: [{ id: generateUniqueId(), title: '', resourceLink: '', isUploading: false, fileType: '' }]
            });
            setIsFormOpen(false);

        } catch (err) {
            setAssignmentFormMessage({ type: 'error', text: err.message });
        }
    };
    
    // --- NEW HANDLERS (Forum) ---
    
    const handleForumFormChange = (e) => {
        const { name, value } = e.target;
        setForumForm(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenCreateForum = () => {
        setForumForm({ title: course.title + ' Discussion', description: 'General discussion board for ' + course.title });
        setIsForumFormOpen(true);
    };

    const handleSaveForum = async (e) => {
        e.preventDefault();
        setForumMessage({ type: '', text: '' });
        
        if (!forumForm.title) {
            setForumMessage({ type: 'error', text: 'Forum title is required.' });
            return;
        }

        const data = {
            courseId: parseInt(courseId),
            title: forumForm.title,
            description: forumForm.description
        };

        try {
            if (forum && forum.id) {
                // Update existing forum
                await apiUpdateForum(forum.id, data, token);
                setForum(prev => ({ ...prev, ...data }));
                setForumMessage({ type: 'success', text: 'Forum updated successfully!' });
            } else {
                // Create new forum
                const newForum = await apiCreateForum(data, token);
                setForum(newForum);
                setForumMessage({ type: 'success', text: 'Forum created successfully!' });
            }
            setIsForumFormOpen(false);
        } catch (err) {
            setForumMessage({ type: 'error', text: err.message });
        }
    };
    
    const handleDeleteForum = async () => {
        if (!forum || !forum.id || !window.confirm(`Are you sure you want to permanently delete the discussion forum "${forum.title}"? This action cannot be undone.`)) {
            return;
        }
        
        setForumMessage({ type: '', text: '' });
        try {
            await apiDeleteForum(forum.id, token);
            setForum(null);
            setForumMessage({ type: 'success', text: 'Forum deleted successfully.' });
            setIsForumOpen(false); // Close the display section
        } catch (err) {
            setForumMessage({ type: 'error', text: err.message });
        }
    };

    // UI Helpers
    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const handleLogout = logout;

    // --- UI COMPONENTS ---

    const CourseNavbar = () => (
        <nav className="dashboard-navbar-neon">
            <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
                {isSidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <div className="logo"><FaUniversity className="logo-icon"/> The Matrix Academy</div>
            <div className="nav-profile-group">
                <span className="student-name">
                    <FaUserCircle /> <strong>{currentUserName}</strong>({role})
                </span>
                <button className="btn-logout-neon" onClick={handleLogout}>
                    <FaSignOutAlt /> Logout
                </button>
            </div>
        </nav>
    );

    const CourseSidebar = () => (
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

    const AssignmentForm = () => (
        <form onSubmit={handleCreateAssignment} className="form-neon" style={{padding: '20px', border: '1px solid var(--neon-pink)', borderRadius: '8px', marginBottom: '20px'}}>
            <h4><FaPlusCircle /> Create New Assignment</h4>
            
            {/* Form Message */}
            {assignmentFormMessage.text && (
                <div className={`message-box ${assignmentFormMessage.type === 'error' ? 'error-neon' : 'success-neon'}`}>
                    {assignmentFormMessage.type === 'error' ? <FaExclamationTriangle /> : <FaInfoCircle />} {assignmentFormMessage.text}
                </div>
            )}
            
            <div className="form-group-neon">
                <label>Assignment Title <span className="required-star">*</span></label>
                <input 
                    type="text" 
                    name="title" 
                    value={newAssignment.title} 
                    onChange={handleAssignmentChange} 
                    required 
                />
            </div>
            
            <div className="form-group-neon">
                <label>Description</label>
                <textarea 
                    name="description" 
                    value={newAssignment.description} 
                    onChange={handleAssignmentChange} 
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group-neon">
                    <label>Due Date & Time <span className="required-star">*</span></label>
                    <input 
                        type="datetime-local" 
                        name="dueDate" 
                        value={newAssignment.dueDate} 
                        onChange={handleAssignmentChange} 
                        required 
                    />
                </div>
                <div className="form-group-neon">
                    <label>Max Points</label>
                    <input 
                        type="number" 
                        name="maxPoints" 
                        value={newAssignment.maxPoints} 
                        onChange={handleAssignmentChange} 
                        min="1"
                    />
                </div>
            </div>
            
            {/* Resources Section */}
            <h5 style={{ marginTop: '20px', borderBottom: '1px solid var(--neon-blue)', paddingBottom: '5px' }}><FaPaperclip /> Assignment Resources (Links/Files)</h5>
            <p style={{ fontSize: '0.8em', color: 'var(--text-faded)', marginBottom: '10px' }}>You can paste a URL or upload a file directly. Uploaded files will replace any manually entered URL in that field.</p>
            {newAssignment.resources.map((resource) => ( 
                <div key={resource.id} style={{ border: resource.isUploading ? '1px dashed var(--neon-green)' : '1px dashed var(--neon-pink)', padding: '15px', marginBottom: '10px', borderRadius: '5px' }}>
                    
                    {/* Resource Title & Link/URL */}
                    <div className="resource-fields" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 0.1fr', gap: '10px' }}>
                        <div className="form-group-neon" style={{marginBottom: 0}}>
                            <label>Title</label>
                            <input
                                type="text"
                                name="title"
                                value={resource.title}
                                onChange={(e) => handleResourceChange(resource.id, e)}
                                placeholder="e.g., Instructions PDF"
                                disabled={resource.isUploading}
                            />
                        </div>
                        <div className="form-group-neon" style={{marginBottom: 0}}>
                            <label>Resource Link (URL)</label>
                            <input
                                type="url"
                                name="resourceLink"
                                value={resource.resourceLink}
                                onChange={(e) => handleResourceChange(resource.id, e)}
                                placeholder="https://example.com/file.pdf"
                                disabled={resource.isUploading}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            {newAssignment.resources.length > 1 && (
                                <button type="button" onClick={() => handleRemoveResource(resource.id)} className="btn-icon-danger-neon" disabled={resource.isUploading}>
                                    <FaTrash />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* File Upload Section */}
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderTop: '1px dotted var(--neon-blue)' }}>
                        <label style={{ margin: 0 }}>
                            <input
                                type="file"
                                style={{ display: 'none' }}
                                accept=".pdf,.doc,.docx,.xlsx,.txt,.zip" 
                                onChange={(e) => handleFileUpload(resource.id, e.target.files[0])}
                                disabled={resource.isUploading}
                            />
                            <button 
                                type="button"
                                className="btn-secondary-neon"
                                onClick={(e) => e.target.closest('label').querySelector('input[type="file"]').click()}
                                disabled={resource.isUploading}
                            >
                                <FaUpload /> {resource.isUploading ? 'Uploading...' : 'Choose File to Upload'}
                            </button>
                        </label>
                        
                        {/* Display File Status */}
                        {resource.isUploading && <FaSpinner className="spinner" style={{ color: 'var(--neon-green)' }} />}
                        {resource.resourceLink && !resource.isUploading && (
                             <p style={{ margin: 0, color: 'var(--neon-green)' }}>
                                <FaPaperclip /> File Uploaded: <a href={resource.resourceLink} target="_blank" rel="noopener noreferrer" className="neon-link">View ({resource.fileType})</a>
                            </p>
                        )}
                        
                    </div>
                </div>
            ))}
            
            <button type="button" onClick={handleAddResource} className="btn-secondary-neon" style={{ marginTop: '10px', marginBottom: '20px' }} disabled={newAssignment.resources.some(r => r.isUploading)}>
                <FaPlusCircle /> Add Another Resource
            </button>
            
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsFormOpen(false)} className="btn-secondary-neon">
                    <FaTimes /> Cancel
                </button>
                <button type="submit" className="btn-primary-neon" disabled={newAssignment.resources.some(r => r.isUploading)}>
                    <FaSave /> Save Assignment
                </button>
            </div>
        </form>
    );

    const AssignmentList = () => (
        <div className="widget-card assignment-list-section" style={{ marginTop: '20px', borderTop: '1px solid var(--neon-green)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4>Course Assignments ({assignments.length})</h4>
                <button 
                    onClick={() => setIsFormOpen(prev => !prev)} 
                    className={`btn-primary-neon ${isFormOpen ? 'active' : ''}`}
                >
                    {isFormOpen ? <FaTimes /> : <FaPlusCircle />} {isFormOpen ? 'Close Form' : 'Create New Assignment'}
                </button>
            </div>
            
            {isFormOpen && <AssignmentForm />}
            
            {isAssignmentsLoading && (
                <p className="loading-text"><FaSpinner className="spinner" /> Loading assignments...</p>
            )}

            {assignmentsError && (
                <div className="message-box error-neon">Error fetching assignments: {assignmentsError}</div>
            )}
            
            {!isAssignmentsLoading && !assignmentsError && (
                assignments.length > 0 ? (
                    <div style={{ marginTop: '15px' }}>
                        {assignments.map(assignment => (
                            <div key={assignment.id} className="assignment-item-card widget-card" style={{ marginBottom: '15px', padding: '15px', borderLeft: '5px solid var(--neon-green)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h5>
                                        <FaFileSignature /> {assignment.title} 
                                        <span style={{ marginLeft: '10px', fontSize: '0.8em', color: 'var(--neon-pink)' }}>
                                            ({assignment.maxPoints} pts)
                                        </span>
                                    </h5>
                                    <div className="assignment-actions" style={{ display: 'flex', gap: '10px' }}>
                                        <Link 
                                            to={`/teacher/assignment/${assignment.id}/submissions`} 
                                            className="btn-primary-neon btn-small"
                                        >
                                            <FaUsers /> View Assignment and Submissions
                                        </Link>
                                    </div>
                                </div>
                                
                                <p style={{ fontSize: '0.9em', color: 'var(--text-faded)' }}>{assignment.description}</p>
                                <p>
                                    <FaClock /> **Due:** {new Date(assignment.dueDate).toLocaleString()}
                                </p>
                                
                                {assignment.Resources && assignment.Resources.length > 0 && (
                                    <div style={{ marginTop: '10px' }}>
                                        <p style={{ fontWeight: 'bold' }}>Resources:</p>
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
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="message-box info-neon">No assignments have been created yet.</div>
                )
            )}
        </div>
    );
    
    // --- FORUM MANAGEMENT COMPONENT ---
    const ForumManagement = () => (
        <div className="widget-card forum-management-section" style={{ marginTop: '20px', borderTop: '1px solid var(--neon-blue)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4><FaComments /> Discussion Forum</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                    
                    {forum && (
                        <button 
                            onClick={() => setIsForumFormOpen(true)} 
                            className="btn-secondary-neon btn-small"
                        >
                            <FaPen /> Edit Forum
                        </button>
                    )}
                    
                    {forum && (
                        <button 
                            onClick={handleDeleteForum} 
                            className="btn-icon-danger-neon btn-small"
                        >
                            <FaTrash /> Delete Forum
                        </button>
                    )}
                    
                    {!forum && (
                        <button 
                            onClick={handleOpenCreateForum} 
                            className="btn-primary-neon btn-small"
                        >
                            <FaPlusCircle /> Create Forum
                        </button>
                    )}
                </div>
            </div>
            
            {/* Loading/Message */}
            {isForumLoading && <p className="loading-text"><FaSpinner className="spinner" /> Checking forum status...</p>}
            {forumMessage.text && (
                <div className={`message-box ${forumMessage.type === 'error' ? 'error-neon' : 'success-neon'}`}>
                    {forumMessage.type === 'error' ? <FaExclamationTriangle /> : <FaInfoCircle />} {forumMessage.text}
                </div>
            )}
            
            {/* Create/Edit Form */}
            {isForumFormOpen && (
                <form onSubmit={handleSaveForum} className="form-neon" style={{padding: '20px', border: '1px solid var(--neon-pink)', borderRadius: '8px', marginTop: '15px'}}>
                    <h5>{forum ? 'Edit Forum Details' : 'Create New Forum'}</h5>
                    <div className="form-group-neon">
                        <label>Forum Title <span className="required-star">*</span></label>
                        <input 
                            type="text" 
                            name="title" 
                            value={forumForm.title} 
                            onChange={handleForumFormChange} 
                            required 
                        />
                    </div>
                    <div className="form-group-neon">
                        <label>Forum Description</label>
                        <textarea 
                            name="description" 
                            value={forumForm.description} 
                            onChange={handleForumFormChange} 
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '15px' }}>
                        <button type="button" onClick={() => setIsForumFormOpen(false)} className="btn-secondary-neon">
                            <FaTimes /> Cancel
                        </button>
                        <button type="submit" className="btn-primary-neon">
                            <FaSave /> {forum ? 'Update Forum' : 'Create Forum'}
                        </button>
                    </div>
                </form>
            )}

            {/* Forum Display */}
            {!isForumLoading && !isForumFormOpen && forum && (
                <div style={{ marginTop: '15px', padding: '15px', border: '1px solid var(--neon-green)', borderRadius: '8px' }}>
                    <h5 style={{ color: 'var(--neon-green)' }}>{forum.title}</h5>
                    <p style={{ fontSize: '0.9em', color: 'var(--text-faded)' }}>{forum.description || 'No description provided.'}</p>
                    <p style={{ fontSize: '0.8em', marginTop: '10px' }}>
                        <FaUserCircle /> Created By: {forum.Creator?.name || 'Unknown'}
                    </p>
                    <Link to={`/course/${courseId}/forum/${forum.id}/threads`} className="btn-secondary-neon btn-small" style={{ marginTop: '10px' }}>
                        <FaEye /> Go to Discussion Board
                    </Link>
                </div>
            )}
            
            {!isForumLoading && !isForumFormOpen && !forum && (
                <div className="message-box info-neon">No discussion forum exists for this course. Click "Create Forum" to set one up.</div>
            )}
        </div>
    );


    // --- MAIN RENDER ---
    const mainContentClass = `main-content-area ${!isSidebarOpen ? 'sidebar-closed-content' : ''}`;

    if (!isAuthenticated || role !== 'Teacher') {
        return <div className="app-container">Unauthorized Access. Redirecting...</div>;
    }

    return (
        <div className="app-container">
            <CourseNavbar />
            <CourseSidebar />

            <main className={mainContentClass}>
                <div className="dashboard-section">

                    <h1 className="form-title-neon section-title-neon">
                        <FaInfoCircle /> Course Details: {course ? course.title : 'Loading...'}
                    </h1>

                    <Link to="/teacher/courses" className="btn-secondary-neon back-link" style={{marginBottom: '20px'}}>
                        &larr; Back to My Courses
                    </Link>

                    {/* Loading/Error States */}
                    {isLoading && !error && (
                        <div className="message-box success-neon">
                            <FaSpinner className="spinner" /> Loading course details for ID: {courseId}...
                        </div>
                    )}
                    {error && (
                        <div className="message-box error-neon">
                            Error: {error}
                        </div>
                    )}

                    {/* Main Content Area */}
                    {!isLoading && course && (
                        <div className="widget-card course-details-card-neon">

                            {/* Course Overview */}
                            <h2 style={{borderBottom: '2px solid var(--neon-blue)', paddingBottom: '10px'}}>{course.title}</h2>
                            <p><strong>Description:</strong> {course.description || 'N/A'}</p>
                            <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '15px' }}>
                                <p><FaUsers /> <strong>Enrolled Students:</strong> {studentsError ? <FaExclamationTriangle color="var(--neon-pink)" /> : students.length}</p>
                                <p><FaFileSignature /> <strong>Assignments:</strong> {assignmentsError ? <FaExclamationTriangle color="var(--neon-pink)" /> : assignments.length}</p>
                                <p><FaClock /> <strong>Duration:</strong> {course.duration}</p>
                                <p><FaUserCircle /> <strong>Created By:</strong> {course.Teacher ? course.Teacher.name : 'Unknown Teacher'}</p>
                                <p><FaCalendarAlt /> <strong>Start Date:</strong> {new Date(course.startDate).toLocaleDateString()}</p>
                                <p><FaCalendarAlt /> <strong>End Date:</strong> {new Date(course.endDate).toLocaleDateString()}</p>
                            </div>

                            <hr style={{margin: '20px 0', border: 'none', borderTop: '1px dotted var(--neon-blue)'}} />

                            {/* Action Buttons/Sections */}
                            <div className="course-action-sections">
                                <h3>Course Management</h3>
                                <div style={{ display: 'flex', gap: '15px', marginTop: '10px', flexWrap: 'wrap' }}>

                                    {/* Toggle Roster */}
                                    <button
                                        onClick={handleToggleRoster}
                                        className={`btn-primary-neon ${isRosterOpen ? 'active' : ''}`}
                                        disabled={isStudentsLoading}
                                    >
                                        <FaUsers /> {isRosterOpen ? 'Hide Roster' : 'View Roster'}
                                        {isRosterOpen ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>

                                    {/* Toggle Assignments */}
                                    <button
                                        onClick={() => setIsAssignmentOpen(prev => !prev)}
                                        className={`btn-primary-neon ${isAssignmentOpen ? 'active' : ''}`}
                                        disabled={isAssignmentsLoading}
                                    >
                                        <FaFileSignature /> {isAssignmentOpen ? 'Hide Assignments' : 'View Assignments'}
                                        {isAssignmentOpen ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>
                                    
                                     {/* Toggle Forum */}
                                    <button
                                        onClick={() => setIsForumOpen(prev => !prev)}
                                        className={`btn-primary-neon ${isForumOpen ? 'active' : ''}`}
                                        disabled={isForumLoading}
                                    >
                                        <FaComments /> {isForumOpen ? 'Hide Forum' : 'Manage Forum'}
                                        {isForumOpen ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>

                                    <Link to={`/teacher/course/${courseId}/materials`} className="btn-primary-neon">
                                        <FaGraduationCap /> Add and Manage Course Materaial
                                    </Link>
                                </div>
                            </div>

                            {/* Enrolled Roster Display (Toggle Section) */}
                            {isRosterOpen && (
                                <div className="widget-card student-roster-section" style={{ marginTop: '20px', borderTop: '1px solid var(--neon-pink)' }}>
                                    <h4>Enrolled Students ({students.length})</h4>
                                    {isStudentsLoading && (<p className="loading-text"><FaSpinner className="spinner" /> Loading student roster...</p>)}
                                    {studentsError && (<div className="message-box error-neon">Error fetching students: {studentsError}</div>)}

                                    {!isStudentsLoading && !studentsError && (
                                        students.length > 0 ? (
                                            <table className="data-table-neon" style={{ width: '100%', marginTop: '15px' }}>
                                                <thead>
                                                    <tr><th>ID</th><th>Name</th><th>Email</th><th>Enrollment Date</th></tr>
                                                </thead>
                                                <tbody>
                                                    {students.map(student => (
                                                        <tr key={student.id}>
                                                            <td>{student.id}</td>
                                                            <td>{student.name}</td>
                                                            <td>{student.email}</td>
                                                            <td>{new Date(student.Enrollment.enrollmentDate).toLocaleDateString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (<div className="message-box info-neon">No students are currently enrolled in this course.</div>)
                                    )}
                                </div>
                            )}

                            {/* Assignment Management Section */}
                            {isAssignmentOpen && <AssignmentList />}
                            
                            {/* NEW: Forum Management Section */}
                            {isForumOpen && <ForumManagement />}

                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default TeacherCourseDetails;