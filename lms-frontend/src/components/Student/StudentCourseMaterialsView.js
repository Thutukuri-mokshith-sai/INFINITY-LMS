import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    FaUniversity, FaUserCircle, FaSignOutAlt, FaBars, FaTimes,
    FaArrowLeft, FaSpinner, FaFolderOpen, FaFilePdf, FaFileWord, 
    FaFileImage, FaLink, FaFileAlt, FaVideo, FaListAlt, FaBookOpen, FaStar, FaClock, FaChalkboardTeacher, FaComments 
} from 'react-icons/fa';
import { useAuth } from "../../context/AuthContext";
// Assuming you have a CSS file for styling
import './StudentDashboard.css'; // <-- CSS Import

// --- Configuration ---
// 🚀 QoL Update: Added explicit /api to base URL for clarity
const API_BASE_URL = 'http://localhost:3000/api'; 


// ---------------------------------------------------------------------
// --- REUSED COMPONENTS (Keeping them as is) ---
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
            <Link to="/student/discussion" className="nav-link"><FaComments /> <span className="link-text">Discussion Forum</span></Link> 
            <Link to="/student/profile" className="nav-link"><FaUserCircle /> <span className="link-text">Profile</span></Link>
        </nav>
    </aside>
);


// ---------------------------------------------------------------------
// --- MAIN COMPONENT: StudentCourseMaterialsView ---
// ---------------------------------------------------------------------

// Helper function to get the appropriate icon based on file type
const getFileIcon = (fileType) => {
    const type = fileType ? fileType.toLowerCase() : 'link';
    if (type.includes('pdf')) return <FaFilePdf className="file-icon pdf" />;
    if (type.includes('doc') || type.includes('word')) return <FaFileWord className="file-icon doc" />;
    if (type.includes('png') || type.includes('jpg') || type.includes('jpeg')) return <FaFileImage className="file-icon img" />;
    if (type.includes('video')) return <FaVideo className="file-icon video" />;
    if (type === 'link') return <FaLink className="file-icon link" />;
    return <FaFileAlt className="file-icon generic" />;
};

// Material Card Component
const MaterialCard = ({ material }) => {
    const formattedDate = new Date(material.createdAt).toLocaleDateString();
    
    return (
        <div className="widget-card material-card-neon">
            <div className="material-header">
                <div className="material-icon-box">
                    {getFileIcon(material.fileType)}
                </div>
                <div className="material-info">
                    <h3 className="material-title">{material.title}</h3>
                    <p className="material-meta">
                        Type: **{material.fileType || 'Link'}** | Uploaded By: **{material.Uploader?.name || 'Unknown'}** on **{formattedDate}**
                    </p>
                </div>
            </div>
            <div className="material-action">
                <a 
                    href={material.materialLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-action-neon small"
                >
                    <FaLink /> Access Material
                </a>
            </div>
        </div>
    );
};


const StudentCourseMaterialsView = () => {
    const { courseId } = useParams(); 
    const auth = useAuth();
    const navigate = useNavigate();

    const { user, logout, token } = auth;
    const studentName = user?.name || 'Student';

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const [materialsData, setMaterialsData] = useState({ materials: [], courseTitle: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const toggleProfile = () => setIsProfileOpen(prev => !prev);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // API call to fetch all course materials
    useEffect(() => {
        const fetchMaterials = async () => {
            setIsLoading(true);
            setError(null);

            if (!token || !courseId) {
                setError(token ? "Invalid course ID." : "Authentication required. Please log in.");
                if (!token) navigate('/login');
                setIsLoading(false);
                return;
            }

            try {
                // 🚨 FIX APPLIED HERE: Changed from /materials/ to /material/
                const response = await fetch(`${API_BASE_URL}/material/course/${courseId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    // 🚀 QoL Update: Check if response text is valid JSON before parsing
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.indexOf("application/json") !== -1) {
                        const errorData = await response.json();
                        if (response.status === 403) {
                            throw new Error(errorData.message || 'Access Denied. Not authorized/enrolled.');
                        }
                        throw new Error(errorData.message || `Failed with status ${response.status}.`);
                    } else {
                        // The server returned HTML (the <!DOCTYPE error)
                        throw new Error(`Connection Error: The server returned an invalid response (Status ${response.status}). Check your backend routing.`);
                    }
                }
                
                const data = await response.json();
                setMaterialsData(data.data); 

            } catch (err) {
                console.error("Material fetch error:", err);
                setError(err.message || 'An unexpected error occurred while loading materials.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchMaterials();
    }, [courseId, token, navigate]);

    const mainContentClass = `main-content-area ${!isSidebarOpen ? 'sidebar-closed-content' : ''}`;
    
    // --- Render Logic ---
    
    // 1. Loading State UI
    if (isLoading) return (
        <div className="app-container">
            <DashboardNavbar studentName={studentName} onLogout={handleLogout} onProfileToggle={toggleProfile} onSidebarToggle={toggleSidebar} isSidebarOpen={isSidebarOpen}/>
            <DashboardSidebar isOpen={isSidebarOpen} />
            <main className={mainContentClass}>
                <div className="loading-state">
                    <FaSpinner className="spinner" /> 
                    <p>Loading course materials...</p>
                </div>
            </main>
        </div>
    );
    
    // 2. Error State UI
    if (error) return (
        <div className="app-container">
            <DashboardNavbar studentName={studentName} onLogout={handleLogout} onProfileToggle={toggleProfile} onSidebarToggle={toggleSidebar} isSidebarOpen={isSidebarOpen}/>
            <DashboardSidebar isOpen={isSidebarOpen} />
            <main className={mainContentClass}>
                <div className="error-state">
                    <h2 className="section-title-neon">Loading Failed</h2>
                    <p className="error-message">Error: **{error}**</p>
                    <Link to={`/student/my-courses/${courseId}`} className="btn-action-neon" style={{ marginTop: '10px' }}>
                        <FaArrowLeft /> Back to Course Details
                    </Link>
                </div>
            </main>
        </div>
    );

    const { materials, courseTitle } = materialsData;
    
    // 3. Success State UI
    return (
        <>
            {isProfileOpen && (<ProfileModal authData={{ name: studentName, email: user?.email, userId: user?.id, role: user?.role, logout: handleLogout }} onClose={toggleProfile} />)}
            <div className="app-container">
                <DashboardNavbar studentName={studentName} onLogout={handleLogout} onProfileToggle={toggleProfile} onSidebarToggle={toggleSidebar} isSidebarOpen={isSidebarOpen}/>
                <DashboardSidebar isOpen={isSidebarOpen} />
                <main className={mainContentClass}>
                    
                    <Link to={`/student/my-courses/${courseId}`} className="btn-action-neon" style={{ marginBottom: '20px' }}>
                        <FaArrowLeft /> Back to **{courseTitle || 'Course'}** Details
                    </Link>

                    <div className="welcome-banner dashboard-section">
                        <h1 className="section-title-neon">
                            <FaFolderOpen /> Course Materials for **{courseTitle}**
                        </h1>
                        <p className="section-subtitle-neon">Access all shared files, links, and resources for this course.</p>
                    </div>

                    <hr/>

                    <section className="dashboard-section core-section">
                        <h2 className="section-title-neon">Resources ({materials.length} Total)</h2>
                        
                        <div className="materials-list-grid">
                            {materials.length > 0 ? (
                                materials.map(material => (
                                    <MaterialCard key={material.id} material={material} />
                                ))
                            ) : (
                                <p className="no-data-message">No course materials have been uploaded yet.</p>
                            )}
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
};

export default StudentCourseMaterialsView;