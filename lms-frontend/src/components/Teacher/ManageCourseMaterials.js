import React, { useState, useEffect, useCallback } from 'react';
import { FaPlusCircle, FaBookOpen, FaChalkboardTeacher, FaClock, FaCalendarAlt, FaDollarSign, FaUserGraduate, FaBars, FaTimes, FaUniversity, FaUserCircle, FaSignOutAlt, FaListAlt, FaGraduationCap, FaCloudUploadAlt, FaTrash, FaEdit, FaLink, FaFilePdf, FaVideo, FaDownload, FaArrowLeft } from 'react-icons/fa';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import axios from 'axios';
// Assume the same CSS file is used for styling the dashboard and forms
// import './CreateCourse.css'; 

// ⚠️ API Configuration
const API_URL = process.env.REACT_APP_API_URL || 'https://lms-backend-foaq.onrender.com/api';
// 🆕 CLOUDINARY CONFIGURATION (REPLACE WITH YOUR ACTUAL VALUES)
const CLOUDINARY_CLOUD_NAME = 'duzmfqbkd';
const CLOUDINARY_UPLOAD_PRESET = 'pdf_upload';

// --- API CALL FUNCTIONS ---

// Existing API functions (apiFetchMaterials, apiCreateMaterial, apiUpdateMaterial, apiDeleteMaterial) remain the same.

// 5. Create Material (Upload to Cloudinary) - NEW FUNCTION
const apiUploadFileToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
        // Use 'raw' endpoint for generic files like PDFs
        const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (res.data.secure_url) {
            return res.data.secure_url;
        } else {
            console.error("Cloudinary Upload Response:", res.data);
            throw new Error('Cloudinary upload failed to return a secure URL.');
        }
    } catch (error) {
        console.error("Cloudinary Upload Error:", error.response || error);
        throw new Error(error.response?.data?.error?.message || 'Failed to upload file to storage.');
    }
};

// 1. Fetch Materials
const apiFetchMaterials = async (courseId, token) => {
    try {
        const response = await axios.get(`${API_URL}/material/course/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data.data;
    } catch (error) {
        console.error("API Fetch Materials Error:", error.response || error);
        throw new Error(error.response?.data?.message || 'Failed to load course materials.');
    }
};

// 2. Create Material (Upload) - POST /api/material
const apiCreateMaterial = async (materialData, token) => {
    const sanitizedData = {
        ...materialData,
        materialLink: materialData.materialLink ? materialData.materialLink.trim() : '',
        title: materialData.title ? materialData.title.trim() : materialData.title
    };

    try {
        const response = await axios.post(`${API_URL}/material`, sanitizedData, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        return response.data.data.material;
    } catch (error) {
        console.error("API Create Material Error:", error.response || error);
        throw new Error(error.response?.data?.message || 'Failed to upload material.');
    }
};

// 3. Update Material - PATCH /api/material/:id
const apiUpdateMaterial = async (materialId, materialData, token) => {
    const sanitizedData = {
        ...materialData,
        materialLink: materialData.materialLink ? materialData.materialLink.trim() : '',
        title: materialData.title ? materialData.title.trim() : materialData.title
    };

    try {
        const response = await axios.patch(`${API_URL}/material/${materialId}`, sanitizedData, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        return response.data.data.material;
    } catch (error) {
        console.error("API Update Material Error:", error.response || error);
        throw new Error(error.response?.data?.message || 'Failed to update material.');
    }
};

// 4. Delete Material - DELETE /api/material/:id
const apiDeleteMaterial = async (materialId, token) => {
    try {
        await axios.delete(`${API_URL}/material/${materialId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return { message: 'Material deleted successfully.' };
    } catch (error) {
        console.error("API Delete Material Error:", error.response || error);
        throw new Error(error.response?.data?.message || 'Failed to delete material.');
    }
};


const ManageCourseMaterials = () => {
    const { user, name, role, logout, token } = useAuth();
    const navigate = useNavigate();
    const { courseId } = useParams();

    // State for materials list
    const [materials, setMaterials] = useState([]);
    const [courseTitle, setCourseTitle] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    // State for CRUD operations (Create/Update Modal)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentMaterial, setCurrentMaterial] = useState(null);

    // Form state for creating/updating a material
    const [formInput, setFormInput] = useState({
        title: '',
        materialLink: '',
        fileType: 'Link', // Default type
    });

    // 🆕 State for file upload
    const [selectedFile, setSelectedFile] = useState(null); 

    const [opMessage, setOpMessage] = useState('');
    const [isOpError, setIsOpError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Sidebar state (from CreateCourse.js)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const handleLogout = logout;

    // ⬅️ Go Back to previous page
    const handleGoBack = () => {
        navigate(-1);
    };

    // --- FETCH DATA LOGIC ---
    const fetchMaterials = useCallback(async () => {
        if (!token || !courseId) return;

        setIsLoading(true);
        setFetchError(null);

        try {
            const data = await apiFetchMaterials(courseId, token);
            setMaterials(data.materials);
            setCourseTitle(data.courseTitle);
        } catch (error) {
            setFetchError(error.message);
            setMaterials([]);
        } finally {
            setIsLoading(false);
        }
    }, [courseId, token]);

    useEffect(() => {
        fetchMaterials();
    }, [fetchMaterials]);

    // --- FORM HANDLERS ---

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        // When changing fileType, clear the file input but keep the materialLink if it was a link before
        if (name === 'fileType') {
            setSelectedFile(null); // Clear file selection on type change
        }
        setFormInput(prev => ({ ...prev, [name]: value }));
    };

    // 🆕 File Handler
    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0] || null);
    };

    const handleModalOpen = (material = null) => {
        setOpMessage('');
        setIsOpError(false);
        setSelectedFile(null); // 🆕 Clear file state
        
        if (material) {
            // Edit mode
            setIsEditing(true);
            setCurrentMaterial(material);
            setFormInput({
                title: material.title,
                materialLink: material.materialLink,
                fileType: material.fileType,
            });
        } else {
            // Create mode
            setIsEditing(false);
            setCurrentMaterial(null);
            setFormInput({
                title: '',
                materialLink: '',
                fileType: 'Link',
            });
        }
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setCurrentMaterial(null);
        setSelectedFile(null); // 🆕 Clear file state on close
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setOpMessage('');
        setIsOpError(false);

        const trimmedTitle = formInput.title.trim();
        let materialUrl = formInput.materialLink.trim();

        // Basic validation
        if (!trimmedTitle) {
            setIsOpError(true);
            setOpMessage('Title is required.');
            setIsSubmitting(false);
            return;
        }
        
        // 🆕 FILE UPLOAD LOGIC
        if (formInput.fileType !== 'Link' && selectedFile) {
            // A file is selected and not a 'Link' type, so upload it
            try {
                setOpMessage(`Uploading file: ${selectedFile.name}...`);
                materialUrl = await apiUploadFileToCloudinary(selectedFile);
                setOpMessage(`File uploaded successfully!`);
                setIsOpError(false);
            } catch (error) {
                setIsOpError(true);
                setOpMessage(error.message || 'File upload failed.');
                setIsSubmitting(false);
                return;
            }
        } else if (formInput.fileType === 'Link' && !materialUrl) {
             // Link type selected, but no URL provided
             setIsOpError(true);
             setOpMessage('Link/URL is required for "Web Link / General" type.');
             setIsSubmitting(false);
             return;
        } else if (formInput.fileType !== 'Link' && !materialUrl && !selectedFile && !isEditing) {
            // Non-link type chosen, but no file selected and not editing
            setIsOpError(true);
            setOpMessage('A file must be selected for this file type, or switch to "Web Link / General" and provide a URL.');
            setIsSubmitting(false);
            return;
        }
        
        // Final sanity check for materialLink before calling the backend API
        if (!materialUrl) {
            setIsOpError(true);
            setOpMessage('Material link is missing. Please upload a file or provide a URL.');
            setIsSubmitting(false);
            return;
        }

        const payload = {
            courseId,
            title: trimmedTitle,
            materialLink: materialUrl,
            fileType: formInput.fileType,
        };

        try {
            if (isEditing) {
                // UPDATE
                await apiUpdateMaterial(currentMaterial.id, payload, token);
                setOpMessage('Material updated successfully!');
            } else {
                // CREATE
                await apiCreateMaterial(payload, token);
                setOpMessage('Material created successfully!');
            }

            // Update the local state
            fetchMaterials(); // Re-fetch all materials to ensure data integrity
            
            setTimeout(() => {
                handleModalClose();
            }, 1500);

        } catch (error) {
            setIsOpError(true);
            // Handle the specific Sequelize error client-side for better user feedback
            if (error.message.includes('Validation isUrl on materialLink failed')) {
                 setOpMessage('Validation Error: The material link you provided is not a valid URL. Please check for leading/trailing spaces or typos.');
            } else {
                 setOpMessage(error.message || 'Operation failed.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- DELETE HANDLER (No changes needed) ---
    const handleDeleteMaterial = async (materialId, materialTitle) => {
        if (!window.confirm(`Are you sure you want to delete the material: "${materialTitle}"? This cannot be undone.`)) {
            return;
        }

        setIsSubmitting(true);
        setOpMessage('');
        setIsOpError(false);

        try {
            await apiDeleteMaterial(materialId, token);
            setOpMessage('Material deleted successfully!');
            setIsOpError(false);
            // Remove from local state
            setMaterials(prev => prev.filter(m => m.id !== materialId));

            setTimeout(() => setOpMessage(''), 3000); // Clear message after a delay
        } catch (error) {
            setIsOpError(true);
            setOpMessage(error.message || 'Failed to delete material.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- RENDERING HELPERS (No changes needed) ---
    const getFileIcon = (fileType) => {
        switch (fileType) {
            case 'PDF': return <FaFilePdf className="file-icon pdf" />;
            case 'Video': return <FaVideo className="file-icon video" />;
            case 'Image': return <FaBookOpen className="file-icon image" />; // Using BookOpen for generic file
            default: return <FaLink className="file-icon link" />;
        }
    };

    // --- UI COMPONENTS (Sidebar and Navbar omitted for brevity, but exist in original code) ---
    const CourseNavbar = () => (
        <nav className="dashboard-navbar-neon">
            <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
                {isSidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <div className="logo"><FaUniversity className="logo-icon"/> INFINITY  LMS</div>
            <div className="nav-profile-group">
                <span className="student-name">
                    <FaUserCircle /> <strong>{name}</strong>({role})
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
                    <FaUserCircle /> 
                    <span className="link-text">Profile</span>
                </Link>
            </nav>
        </aside>
    );

    const mainContentClass = `main-content-area ${!isSidebarOpen ? 'sidebar-closed-content' : ''}`;


    // --- MAIN RENDER ---

    if (isLoading) {
        return (
            <div className="app-container">
                <CourseNavbar />
                <CourseSidebar />
                <main className={mainContentClass}>
                    <div className="loading-message">Loading materials...</div>
                </main>
            </div>
        );
    }

    if (fetchError) {
        return (
             <div className="app-container">
                 <CourseNavbar />
                 <CourseSidebar />
                 <main className={mainContentClass}>
                     <div className="error-neon dashboard-section">
                         <h1><FaTimes /> Error Loading Materials</h1>
                         <p>{fetchError}</p>
                         <button onClick={() => navigate('/teacher/courses')} className="btn-secondary-neon">Go Back to Courses</button>
                     </div>
                 </main>
             </div>
        );
    }


    return (
        <div className="app-container">
            <CourseNavbar />
            <CourseSidebar />

            <main className={mainContentClass}>
                <div className="course-materials-container dashboard-section">
                    <div className="section-header-neon">
                        <h1 className="section-title-neon"><FaCloudUploadAlt /> Course Materials: {courseTitle}</h1>
                        <p className="section-subtitle-neon">Manage lectures, readings, and resources for this course.</p>
                    </div>

                    <div className="form-actions" style={{marginBottom: '20px'}}>
                        <button 
                            className="btn-secondary-neon" 
                            onClick={handleGoBack}
                            disabled={isSubmitting}
                            style={{marginRight: '10px'}}
                        >
                            <FaArrowLeft /> Go Back
                        </button>
                        
                        <button 
                            className="btn-primary-neon" 
                            onClick={() => handleModalOpen()}
                            disabled={isSubmitting}
                        >
                            <FaPlusCircle /> Add New Material
                        </button>
                        <button 
                            className="btn-secondary-neon" 
                            onClick={() => navigate(`/teacher/courses/${courseId}`)}
                            disabled={isSubmitting}
                        >
                            <FaChalkboardTeacher /> Course Details Page
                        </button>
                    </div>

                    {opMessage && !isModalOpen && ( // Display outside modal only if modal is closed
                        <div className={`message-box ${isOpError ? 'error-neon' : 'success-neon'}`}>
                            {opMessage}
                        </div>
                    )}

                    <div className="materials-list-container widget-card">
                        {materials.length === 0 ? (
                            <p className="no-data-message">No materials have been uploaded for this course yet. Use the button above to start.</p>
                        ) : (
                            <ul className="materials-list">
                                {materials.map(material => (
                                    <li key={material.id} className="material-item">
                                        <div className="material-icon">{getFileIcon(material.fileType)}</div>
                                        <div className="material-info">
                                            <h3 className="material-title">{material.title}</h3>
                                            <p className="material-type">Type: <strong>{material.fileType}</strong></p>
                                            <p className="material-uploader">Uploaded by: {material.Uploader.name} ({new Date(material.createdAt).toLocaleDateString()})</p>
                                            <a 
                                                href={material.materialLink} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="btn-link-sm"
                                            >
                                                <FaDownload /> Access Material
                                            </a>
                                        </div>
                                        <div className="material-actions">
                                            <button 
                                                className="btn-edit-sm" 
                                                onClick={() => handleModalOpen(material)}
                                                disabled={isSubmitting}
                                            >
                                                <FaEdit /> Edit
                                            </button>
                                            <button 
                                                className="btn-delete-sm" 
                                                onClick={() => handleDeleteMaterial(material.id, material.title)}
                                                disabled={isSubmitting}
                                            >
                                                <FaTrash /> Delete
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </main>

            {/* --- CREATE/UPDATE MODAL --- */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content widget-card">
                        <div className="modal-header">
                            <h2>{isEditing ? 'Edit Material' : 'Add New Material'}</h2>
                            <button className="close-btn" onClick={handleModalClose}><FaTimes /></button>
                        </div>
                        <form onSubmit={handleFormSubmit}>
                             {opMessage && (
                                 <div className={`message-box ${isOpError ? 'error-neon' : 'success-neon'}`}>
                                     {opMessage}
                                 </div>
                             )}

                            <div className="form-group">
                                <label htmlFor="materialTitle">Title *</label>
                                <input
                                    type="text"
                                    id="materialTitle"
                                    name="title"
                                    value={formInput.title}
                                    onChange={handleFormChange}
                                    required
                                    placeholder="e.g., Week 1 Lecture Slides"
                                    disabled={isSubmitting}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="fileType">File Type</label>
                                <select
                                    id="fileType"
                                    name="fileType"
                                    value={formInput.fileType}
                                    onChange={handleFormChange}
                                    required
                                    disabled={isSubmitting}
                                >
                                    <option value="Link">Web Link / General</option>
                                    <option value="PDF">PDF Document (Upload)</option>
                                    <option value="Video">Video (Upload or Link)</option>
                                    <option value="Image">Image (Upload or Link)</option>
                                </select>
                            </div>

                            {/* 🆕 CONDITIONAL FILE UPLOAD INPUT */}
                            {formInput.fileType !== 'Link' && !isEditing && ( // Only show file input on Create mode for non-Link types
                                <div className="form-group upload-group">
                                    <label htmlFor="fileUpload"><FaCloudUploadAlt /> Select File to Upload</label>
                                    <input
                                        type="file"
                                        id="fileUpload"
                                        name="fileUpload"
                                        accept={formInput.fileType === 'PDF' ? 'application/pdf' : (formInput.fileType === 'Video' ? 'video/*' : 'image/*')}
                                        onChange={handleFileChange}
                                        required={!isEditing}
                                        disabled={isSubmitting}
                                    />
                                    <small className="input-hint">{selectedFile ? `File selected: ${selectedFile.name}` : `Please select a ${formInput.fileType} file.`}</small>
                                </div>
                            )}
                            
                            {/* Material Link Input - Disabled if uploading a file, or if it's Edit mode with a file that can't be changed */}
                            <div className="form-group">
                                <label htmlFor="materialLink">Material Link / URL *</label>
                                <input
                                    type="url"
                                    id="materialLink"
                                    name="materialLink"
                                    value={formInput.materialLink}
                                    onChange={handleFormChange}
                                    required={formInput.fileType === 'Link'}
                                    disabled={isSubmitting || (formInput.fileType !== 'Link' && selectedFile && !isEditing) || (formInput.fileType !== 'Link' && isEditing && !formInput.materialLink)}
                                    placeholder="e.g., https://youtube.com/video-link"
                                />
                                <small className="input-hint">
                                    {formInput.fileType === 'Link' ? 
                                        'Provide a direct URL. It must be a valid link.' :
                                        (isEditing ? 'Editing existing link. To upload a *new* file, you must delete and re-create the material.' : 'This will be automatically populated after a successful file upload.')
                                    }
                                </small>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="submit"
                                    className="btn-primary-neon"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Processing...' : (isEditing ? 'Update Material' : 'Upload & Save Material')}
                                </button>
                                <button
                                    type="button"
                                    className="btn-secondary-neon"
                                    onClick={handleModalClose}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <style>{`/* --- Global Variables and Base Styles (for Neon/Cyberpunk Theme) --- */
:root {
   /* Adapted Neon Palette based on the second scheme's colors */

/* Backgrounds & Main Colors */
--color-dark-bg: #022c22;     /* Dark-green background (from --dark-bg) */
--color-card-bg: rgba(0, 0, 0, 0.4); /* Card background (from --card-bg) */

/* Text Color */
--color-text-light: #ecfdf5;  /* Light text (from --light-text) */

/* Primary & Secondary Neon */
--color-primary: #00FFFF;     /* Electric Blue (from --neon-color) */
--color-secondary: #09d6d6ff;   /* Red Neon (from --red-neon) */

/* Status Colors */
--color-success: #10b981;     /* Highlight Green (from --highlight-green) */
--color-error: #0ad5d5ff;       /* Red Neon (using --red-neon for error) */

/* Borders & Layout (Keeping originals as they are independent of color) */
--border-radius-sm: 4px;
--border-radius-lg: 8px;
--transition-speed: 0.3s;

/* Neon Shadows (Adapted to use the new colors and specific shadow definitions) */
--shadow-neon-primary: 0 0 5px var(--color-primary), 0 0 15px var(--color-primary), 0 0 25px rgba(0, 255, 255, 0.5); 
/* Uses --neon-shadow-blue definition */
--shadow-neon-secondary: 0 0 5px var(--color-secondary), 0 0 15px var(--color-secondary); 
/* Uses --neon-shadow-red definition */
    --sidebar-width-open: 250px;
    --sidebar-width-closed: 70px;
    --transition-speed: 0.3s;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    background-color: var(--color-dark-bg);
    color: var(--color-text-light);
    line-height: 1.6;
}

a {
    color: var(--color-primary);
    text-decoration: none;
}

/* --- Layout Container --- */
.app-container {
    display: flex;
    min-height: 100vh;
}

/* --- Dashboard Navigation (Navbar and Sidebar) --- */

/* Navbar */
.dashboard-navbar-neon {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 60px;
    background-color: var(--color-card-bg);
    border-bottom: 2px solid var(--color-primary);
    box-shadow: var(--shadow-neon-primary);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    z-index: 1000;
}

.logo {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--color-primary);
    text-shadow: var(--shadow-neon-primary);
    display: flex;
    align-items: center;
}

.logo-icon {
    margin-right: 10px;
    font-size: 1.8rem;
}

.sidebar-toggle-btn {
    background: none;
    border: none;
    color: var(--color-text-light);
    font-size: 1.5rem;
    cursor: pointer;
    margin-right: 15px;
    display: none; /* Hidden on desktop */
}

.nav-profile-group {
    display: flex;
    align-items: center;
}

.student-name {
    margin-right: 20px;
    display: flex;
    align-items: center;
}

.student-name svg {
    margin-right: 5px;
    color: var(--color-secondary);
}

/* Sidebar */
.dashboard-sidebar-neon {
    width: 250px;
    position: fixed;
    top: 60px; /* Below navbar */
    left: 0;
    height: calc(100vh - 60px);
    background-color: var(--color-card-bg);
    padding: 20px 0;
    transition: width var(--transition-speed), transform var(--transition-speed);
    z-index: 999;
    border-right: 2px solid var(--color-secondary);
    box-shadow: 2px 0 10px rgba(255, 121, 198, 0.4);
}

.sidebar-closed {
    width: 60px;
}

.sidebar-header {
    text-align: center;
    color: var(--color-secondary);
    font-size: 0.9rem;
    margin-bottom: 20px;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 0 15px;
    border-bottom: 1px solid rgba(255, 121, 198, 0.3);
    padding-bottom: 10px;
    text-shadow: 0 0 5px rgba(255, 121, 198, 0.7);
}

.sidebar-closed .sidebar-header,
.sidebar-closed .link-text {
    display: none;
}

.sidebar-nav .nav-link {
    display: flex;
    align-items: center;
    padding: 10px 20px;
    margin: 5px 0;
    color: var(--color-text-light);
    transition: background-color var(--transition-speed), color var(--transition-speed), text-shadow var(--transition-speed);
}

.sidebar-nav .nav-link:hover {
    background-color: rgba(0, 188, 212, 0.1);
    color: var(--color-primary);
    text-shadow: var(--shadow-neon-primary);
}

.sidebar-nav .nav-link.active {
    background-color: rgba(0, 188, 212, 0.2);
    border-left: 4px solid var(--color-primary);
    color: var(--color-primary);
    text-shadow: var(--shadow-neon-primary);
    font-weight: bold;
}

.sidebar-nav .nav-link svg {
    font-size: 1.2rem;
    margin-right: 15px;
    min-width: 20px;
}

.sidebar-closed .sidebar-nav .nav-link {
    justify-content: center;
    padding: 10px 0;
}
.sidebar-closed .sidebar-nav .nav-link svg {
    margin-right: 0;
}

/* --- Main Content Area --- */
.main-content-area {
    margin-left: 250px;
    padding: 80px 20px 20px 20px; /* Padding for navbar and sides */
    flex-grow: 1;
    transition: margin-left var(--transition-speed);
}

.sidebar-closed-content {
    margin-left: 60px;
}

/* --- Utility Components --- */

/* Widget/Card Styling */
.widget-card {
    background-color: var(--color-card-bg);
    padding: 25px;
    border-radius: var(--border-radius-lg);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(0, 188, 212, 0.3);
}

/* Section Header */
.dashboard-section {
    margin-bottom: 40px;
}

.section-header-neon {
    border-bottom: 2px solid var(--color-secondary);
    padding-bottom: 15px;
    margin-bottom: 20px;
}

.section-title-neon {
    color: var(--color-primary);
    text-shadow: var(--shadow-neon-primary);
    font-size: 2rem;
    display: flex;
    align-items: center;
    margin-bottom: 5px;
}

.section-title-neon svg {
    margin-right: 10px;
}

.section-subtitle-neon {
    color: rgba(255, 255, 255, 0.7);
    font-style: italic;
}

/* Message Boxes (Success/Error) */
.message-box {
    padding: 15px;
    margin-bottom: 20px;
    border-radius: var(--border-radius-sm);
    font-weight: bold;
    text-align: center;
    animation: fadeIn var(--transition-speed) ease-out;
}

.success-neon {
    background-color: rgba(80, 250, 123, 0.1);
    color: var(--color-success);
    border: 1px solid var(--color-success);
    box-shadow: 0 0 5px var(--color-success);
}

.error-neon {
    background-color: rgba(255, 85, 85, 0.1);
    color: var(--color-error);
    border: 1px solid var(--color-error);
    box-shadow: 0 0 5px var(--color-error);
}

.no-data-message {
    text-align: center;
    padding: 40px;
    font-style: italic;
    color: rgba(255, 255, 255, 0.5);
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: var(--border-radius-sm);
    border: 1px dashed rgba(255, 255, 255, 0.2);
}

/* --- Buttons --- */
.form-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
}

.btn-base {
    padding: 10px 20px;
    border: none;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-weight: bold;
    transition: all var(--transition-speed);
    display: flex;
    align-items: center;
    justify-content: center;
    text-transform: uppercase;
}

.btn-base svg {
    margin-right: 5px;
}

.btn-primary-neon {
    composes: btn-base;
    background-color: var(--color-primary);
    color: var(--color-dark-bg);
    box-shadow: var(--shadow-neon-primary);
    border: 1px solid var(--color-primary);
}

.btn-primary-neon:hover:not(:disabled) {
    background-color: #00e5ff;
    box-shadow: 0 0 10px #00e5ff, 0 0 20px #00e5ff;
    transform: translateY(-2px);
}

.btn-secondary-neon {
    composes: btn-base;
    background-color: transparent;
    color: var(--color-secondary);
    border: 1px solid var(--color-secondary);
    box-shadow: var(--shadow-neon-secondary);
}

.btn-secondary-neon:hover:not(:disabled) {
    background-color: rgba(255, 121, 198, 0.1);
    color: #ffb8e6;
    box-shadow: 0 0 10px #ffb8e6;
    transform: translateY(-2px);
}

.btn-logout-neon {
    composes: btn-base;
    padding: 8px 15px;
    background: none;
    color: var(--color-error);
    border: 1px solid var(--color-error);
    box-shadow: 0 0 5px var(--color-error);
    font-size: 0.9rem;
}

.btn-logout-neon:hover:not(:disabled) {
    background-color: rgba(255, 85, 85, 0.1);
    color: #ff8080;
    box-shadow: 0 0 10px #ff8080;
}

.btn-base:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
}

/* Small Buttons (used in list actions) */
.btn-edit-sm, .btn-delete-sm {
    padding: 5px 10px;
    font-size: 0.8rem;
    border-radius: var(--border-radius-sm);
    margin-left: 8px;
    transition: all var(--transition-speed);
}

.btn-edit-sm {
    background-color: transparent;
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
}

.btn-edit-sm:hover:not(:disabled) {
    background-color: rgba(0, 188, 212, 0.1);
    box-shadow: 0 0 5px var(--color-primary);
}

.btn-delete-sm {
    background-color: transparent;
    color: var(--color-error);
    border: 1px solid var(--color-error);
}

.btn-delete-sm:hover:not(:disabled) {
    background-color: rgba(255, 85, 85, 0.1);
    box-shadow: 0 0 5px var(--color-error);
}

.btn-link-sm {
    composes: btn-base;
    padding: 5px 10px;
    font-size: 0.85rem;
    background-color: transparent;
    color: var(--color-success);
    border: 1px solid var(--color-success);
    text-transform: none;
    margin-right: 10px;
}

.btn-link-sm:hover:not(:disabled) {
    background-color: rgba(80, 250, 123, 0.1);
    box-shadow: 0 0 5px var(--color-success);
}

/* --- Forms and Inputs --- */
.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
    color: var(--color-secondary);
}

.form-group input[type="text"],
.form-group input[type="url"],
.form-group select {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--color-secondary);
    border-radius: var(--border-radius-sm);
    background-color: #383857; /* Darker input background */
    color: var(--color-text-light);
    font-size: 1rem;
    transition: box-shadow var(--transition-speed), border-color var(--transition-speed);
}

.form-group input:focus,
.form-group select:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 5px var(--color-primary);
    outline: none;
}

.input-hint {
    display: block;
    margin-top: 5px;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
    font-style: italic;
}

/* File Upload Specific */
.upload-group input[type="file"] {
    padding: 10px;
    border: 1px dashed var(--color-primary);
    cursor: pointer;
}
.upload-group input[type="file"]::-webkit-file-upload-button {
    visibility: hidden;
}
.upload-group input[type="file"]::before {
    content: 'Click to select file';
    display: inline-block;
    background: var(--color-primary);
    color: var(--color-dark-bg);
    border: 1px solid var(--color-primary);
    border-radius: var(--border-radius-sm);
    padding: 5px 8px;
    outline: none;
    white-space: nowrap;
    cursor: pointer;
    font-weight: 700;
    font-size: 10pt;
}
.upload-group input[type="file"]:hover::before {
    border-color: #00e5ff;
}

/* --- Material List --- */
.materials-list {
    list-style: none;
}

.material-item {
    display: flex;
    align-items: center;
    padding: 15px;
    margin-bottom: 15px;
    border-radius: var(--border-radius-sm);
    background-color: #383857; /* Slightly darker than card for list items */
    border-left: 5px solid var(--color-primary);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    transition: transform 0.2s;
}

.material-item:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5), 0 0 5px var(--color-secondary);
}

.material-icon {
    font-size: 2.5rem;
    margin-right: 20px;
    min-width: 40px;
    text-align: center;
}

.file-icon.pdf { color: var(--color-error); }
.file-icon.video { color: var(--color-secondary); }
.file-icon.link { color: var(--color-primary); }
.file-icon.image { color: var(--color-success); }


.material-info {
    flex-grow: 1;
}

.material-title {
    font-size: 1.2rem;
    color: var(--color-text-light);
    margin-bottom: 5px;
}

.material-type {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
}

.material-uploader {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 8px;
}

.material-actions {
    min-width: 150px;
    display: flex;
    justify-content: flex-end;
}

/* --- Modal Styling --- */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.85); /* Darker backdrop */
    z-index: 2000;
    display: flex;
    justify-content: center;
    align-items: center;
}

.modal-content {
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    animation: scaleIn 0.3s ease-out;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 15px;
    margin-bottom: 20px;
}

.modal-header h2 {
    color: var(--color-primary);
    text-shadow: var(--shadow-neon-primary);
}

.close-btn {
    background: none;
    border: none;
    color: var(--color-error);
    font-size: 1.5rem;
    cursor: pointer;
    transition: color 0.2s;
}

.close-btn:hover {
    color: #ff8080;
    text-shadow: 0 0 5px #ff8080;
}

/* --- Loading State --- */
.loading-message {
    text-align: center;
    padding: 50px;
    font-size: 1.5rem;
    color: var(--color-secondary);
    text-shadow: var(--shadow-neon-secondary);
}

/* --- Media Queries (Responsiveness) --- */
@media (max-width: 768px) {
    .dashboard-sidebar-neon {
        width: 250px;
        transform: translateX(-250px);
        box-shadow: none;
    }

    .dashboard-sidebar-neon.sidebar-closed {
        width: 250px; /* Sidebar remains full width when closed */
        transform: translateX(-250px);
    }
    
    /* When sidebar is OPEN (not closed) on mobile */
    .dashboard-sidebar-neon:not(.sidebar-closed) {
        transform: translateX(0);
        box-shadow: 4px 0 10px rgba(255, 121, 198, 0.4);
    }

    .sidebar-toggle-btn {
        display: block; /* Show toggle button on mobile */
    }

    .main-content-area {
        margin-left: 0; /* Content takes full width */
        padding-top: 70px;
    }

    .sidebar-closed-content {
        margin-left: 0; /* No margin when closed, as it slides out */
    }

    .nav-profile-group {
        display: none; /* Hide profile group on smaller screens */
    }

    .material-item {
        flex-direction: column;
        align-items: flex-start;
    }

    .material-icon {
        margin-bottom: 10px;
    }

    .material-actions {
        width: 100%;
        margin-top: 10px;
        justify-content: flex-start;
    }
}

/* --- Keyframe Animations --- */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes scaleIn {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}`}</style>
        </div>
    );
};

export default ManageCourseMaterials;