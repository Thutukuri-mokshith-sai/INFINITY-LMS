import React, { useState, useEffect, useCallback } from 'react';
import { FaPlusCircle, FaBookOpen, FaChalkboardTeacher, FaClock, FaCalendarAlt, FaDollarSign, FaUserGraduate, FaBars, FaTimes, FaUniversity, FaUserCircle, FaSignOutAlt, FaListAlt, FaGraduationCap, FaCloudUploadAlt, FaTrash, FaEdit, FaLink, FaFilePdf, FaVideo, FaDownload, FaArrowLeft } from 'react-icons/fa';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import axios from 'axios';
// Assume the same CSS file is used for styling the dashboard and forms
// import './CreateCourse.css'; 

// ⚠️ API Configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
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
            <div className="logo"><FaUniversity className="logo-icon"/> The Matrix Academy</div>
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
                                            <p className="material-type">Type: **{material.fileType}**</p>
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
        </div>
    );
};

export default ManageCourseMaterials;