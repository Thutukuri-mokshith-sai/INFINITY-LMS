import React, { useState, useEffect, useCallback } from 'react';
import {
    FaUserCircle, FaSignOutAlt, FaBookOpen, FaClipboardList,
    FaCheckCircle, FaStar, FaListAlt, FaCalendarAlt,
    FaUniversity, FaArrowRight, FaClock, FaBars, FaTimes,
    FaEnvelope, FaToolbox, FaIdCard, FaPencilAlt, FaSave, FaExclamationTriangle, FaSpinner,
    FaChalkboardTeacher, FaBriefcase, FaGraduationCap, FaPlusCircle // Added FaPlusCircle
} from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import './TeacherDashboard.css'; // Assuming a separate CSS file for teachers

const API_BASE_URL = 'http://localhost:3000/api'; // <-- IMPORTANT: Set your backend API URL

// --- Cloudinary Configuration (Same as Student) ---
const CLOUDINARY_CLOUD_NAME = 'dj0aqo53e'; // Your Cloud Name
const CLOUDINARY_UPLOAD_PRESET = 'Mokshithsai'; // Your Upload Preset

// ======================================================================
// --- 1. PROFILE MODAL COMPONENT (Reused from StudentProfile) ---
// ======================================================================
const ProfileModal = ({ authData, onClose }) => {
    const { name, email, userId, role, logout } = authData;
    const modalRef = React.useRef();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscapeKey);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [onClose]);

    return (
        <div className="profile-modal-backdrop" onClick={onClose}>
            <div className="profile-card-neon" ref={modalRef} onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}><FaTimes /></button>
                <FaUserCircle className="profile-icon-neon" />
                <h2 className="title-neon">Welcome, {name.split(' ')[0]}!</h2>
                <p className="subtitle-neon">Your LMS Access Panel</p>
                <div className="info-group-neon">
                    <p className="info-line-neon"><FaIdCard className="info-icon-neon" /><strong>ID:</strong> {userId}</p>
                    <p className="info-line-neon"><FaEnvelope className="info-icon-neon" /><strong>Email:</strong> {email}</p>
                    <p className="info-line-neon"><FaToolbox className="info-icon-neon" /><strong>Role:</strong> {role}</p>
                </div>
                <div className="neon-divider-dashboard"></div>
                <button onClick={logout} className="btn-logout-neon full-width-btn">
                    <FaSignOutAlt className="logout-icon-neon" /> Secure Logout
                </button>
            </div>
        </div>
    );
};

// ======================================================================
// --- 2. NAVBAR COMPONENT (Adjusted for Teacher) ---
// ======================================================================
const DashboardNavbar = ({ teacherName, onLogout, onProfileToggle, onSidebarToggle, isSidebarOpen }) => (
    <nav className="dashboard-navbar-neon">
        <button className="sidebar-toggle-btn" onClick={onSidebarToggle}>
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
        <div className="logo"><FaUniversity className="logo-icon" /> The Matrix Academy</div>
        <div className="nav-profile-group">
            <span className="teacher-name" onClick={onProfileToggle}><FaUserCircle /> {teacherName}({useAuth().role})</span>
            <button className="btn-logout-neon" onClick={onLogout}><FaSignOutAlt /> Logout</button>
        </div>
    </nav>
);

// ======================================================================
// --- 3. SIDEBAR COMPONENT (UPDATED as requested) ---
// ======================================================================
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
            <Link to="/teacher/courses/new" className="nav-link">
                <FaPlusCircle /> <span className="link-text">Create Course</span>
            </Link>
            {/* The active class is usually applied by the router context, but for static example, we use the original route's class */}
            <Link to="/teacher/profile" className="nav-link active"> 
  <FaUserCircle /> 
  <span className="link-text">Profile</span>
</Link>

        </nav>
    </aside>
);

// ======================================================================
// --- HELPER COMPONENTS (Reused) ---
// ======================================================================
const DisplayField = ({ icon, label, value }) => (
    <div className="profile-field-display">
        {icon}
        <strong>{label}:</strong>
        <span>{value || 'N/A'}</span>
    </div>
);

const EditField = ({ label, name, value, type = 'text', onChange, readOnly = false }) => (
    <div className="profile-field-edit">
        <label htmlFor={name}>{label}</label>
        <input
            type={type}
            id={name}
            name={name}
            value={value || ''}
            onChange={onChange}
            className={`profile-input ${readOnly ? 'read-only' : ''}`}
            readOnly={readOnly}
            disabled={readOnly}
            // Add min/max for years_experience
            {...(name === 'years_experience' ? { min: 0, max: 50, step: 1 } : {})}
        />
    </div>
);

// ======================================================================
// --- CLOUDINARY UPLOADER COMPONENT (Reused from Student) ---
// ======================================================================
const CloudinaryUploader = ({ onUploadSuccess, currentPhotoLink, isSaving, showMessage }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setUploadError(null);
    };

    const uploadImage = async () => {
        if (!file) {
            setUploadError('Please select an image file first.');
            return;
        }

        setUploading(true);
        setUploadError(null);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        try {
            const res = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: "POST",
                    body: formData
                }
            );

            const data = await res.json();
            if (data.secure_url) {
                onUploadSuccess(data.secure_url);
                setFile(null); // Clear file input state
                // Reset file input element for allowing re-upload of the same file
                document.getElementById("photoFileInput").value = '';
                showMessage('Image uploaded successfully! Click "Save Changes" to finalize.', 'success');
            } else {
                setUploadError("Upload failed: " + (data.error?.message || 'Unknown error.'));
                showMessage(`Upload failed: ${data.error?.message || 'Unknown error.'}`, 'error');
            }
        } catch (err) {
            console.error('Cloudinary Upload Error:', err);
            setUploadError('Network or API error during upload.');
            showMessage('Network or API error during upload.', 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="cloudinary-uploader-container">
            <h4 className="upload-title">Update Profile Picture</h4>
            {/* Current Photo Preview */}
            <div className="current-photo-preview">
                {currentPhotoLink ? (
                    <img
                        src={currentPhotoLink}
                        alt="Current Profile"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/100/333333/FFFFFF?text=Image+Error'
                        }}
                    />
                ) : (
                    <div className="no-photo-placeholder"><FaUserCircle size={60} /> No Photo Set</div>
                )}
            </div>

            <div className="upload-controls">
                <input
                    type="file"
                    id="photoFileInput"
                    onChange={handleFileChange}
                    accept="image/*"
                    disabled={uploading || isSaving}
                />
                <button
                    onClick={uploadImage}
                    className="btn-upload-neon"
                    disabled={!file || uploading || isSaving}
                >
                    {uploading ? <><FaSpinner className="spin-icon" /> Uploading...</> : <><FaArrowRight /> Upload to Cloudinary</>}
                </button>
            </div>
            {uploadError && (
                <div className="alert-neon-error upload-error"><FaExclamationTriangle /> {uploadError}</div>
            )}
            <p className="upload-note">**Step 1: Upload Image. Step 2: Click "Save Changes" to commit the link.**</p>
        </div>
    );
};

// ======================================================================
// --- 4. CORE TEACHER PROFILE COMPONENT ---
// ======================================================================

const TeacherProfileContent = () => {
    const auth = useAuth();
    const { token, name: authName, email: authEmail, userId: authUserId, role: authRole } = auth;

    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // --- STATE FOR TRANSIENT MESSAGES ---
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState('success');
    // ----------------------------------------

    // Initial state structure based on User and TeacherProfile model
    const [formData, setFormData] = useState({
        // User fields
        name: authName || '',
        email: authEmail || '',
        // TeacherProfile fields
        phone_number: '',
        designation: '',
        subject_area: '',
        years_experience: '',
        highest_degree: '',
        photo_link: '',
    });
    const [originalData, setOriginalData] = useState(formData);

    // --- MESSAGE HANDLER ---
    const showMessage = useCallback((msg, type = 'success') => {
        setMessage(msg);
        setMessageType(type);
        const timer = setTimeout(() => {
            setMessage(null);
        }, 3000); // Hide after 3 seconds
        return () => clearTimeout(timer); // Cleanup on component unmount
    }, []);
    // -----------------------

    // --- FETCH PROFILE DATA ---
    useEffect(() => {
        const fetchProfile = async () => {
            if (!token || !authUserId) {
                setLoading(false);
                showMessage('Authentication data missing.', 'error');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/profiles/me`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.message || `Failed to fetch profile: ${response.statusText}`);
                }

                const result = await response.json();
                const user = result.data.user;
                const profile = user.TeacherProfile || {}; // NOTE: TeacherProfile alias

                const fetchedData = {
                    name: user.name || authName,
                    email: user.email || authEmail,
                    // TeacherProfile fields
                    phone_number: profile.phone_number || '',
                    designation: profile.designation || '',
                    subject_area: profile.subject_area || '',
                    years_experience: profile.years_experience !== undefined ? profile.years_experience.toString() : '',
                    highest_degree: profile.highest_degree || '',
                    photo_link: profile.photo_link || '',
                    isNewProfile: !user.TeacherProfile // Check if profile exists
                };

                setFormData(fetchedData);
                setOriginalData(fetchedData);
                showMessage('Profile loaded successfully.', 'success');

            } catch (err) {
                console.error('Fetch Profile Error:', err);
                showMessage(err.message || 'Could not load profile data.', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, authUserId, authName, authEmail]);

    // --- HANDLERS ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handler for Cloudinary upload success
    const handlePhotoUploadSuccess = (url) => {
        setFormData(prev => ({ ...prev, photo_link: url }));
    };


    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        showMessage(null); // Clear existing messages

        // Data to send to the backend.
        const updatePayload = {
            phone_number: formData.phone_number,
            designation: formData.designation,
            subject_area: formData.subject_area,
            years_experience: formData.years_experience ? parseInt(formData.years_experience) : 0,
            highest_degree: formData.highest_degree,
            photo_link: formData.photo_link || null,
        };

        // Determine method based on whether a profile existed
        const method = originalData.isNewProfile ? 'POST' : 'PUT';

        try {
            const response = await fetch(`${API_BASE_URL}/profiles/`, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatePayload),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Profile save failed.');
            }

            // Update local state and mark profile as existing
            const updatedOriginalData = { ...formData, isNewProfile: false };
            setOriginalData(updatedOriginalData);
            setFormData(updatedOriginalData);
            setIsEditing(false);
            showMessage('Profile Saved Successfully!', 'success');

        } catch (err) {
            console.error('Save Profile Error:', err);
            showMessage(err.message || 'An unexpected error occurred during save.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData(originalData);
        setIsEditing(false);
        showMessage('Editing cancelled. Profile reverted to last saved state.', 'info');
    };

    const hasNoProfileData = originalData.isNewProfile;

    // --- RENDER LOGIC ---
    if (loading) {
        return <div className="loading-state-neon"><FaSpinner className="spin-icon" /> Loading Profile Data...</div>;
    }

    // Component for displaying transient messages
    const MessageDisplay = ({ message, type }) => {
        if (!message) return null;
        const icon = type === 'success' ? <FaCheckCircle /> : type === 'error' ? <FaExclamationTriangle /> : <FaClock />;
        const className = type === 'success' ? 'alert-neon-success' : type === 'error' ? 'alert-neon-error' : 'alert-neon-info';

        return (
            <p className={`${className} message-transient`}>
                {icon} {message}
            </p>
        );
    };

    // Determine the main button text/action
    const actionButton = isEditing ? (
        <button
            className={`btn-action-neon btn-cancel`}
            onClick={handleCancel}
            disabled={isSaving}
        >
            <FaTimes /> Cancel Edit
        </button>
    ) : (
        <button
            className={`btn-action-neon btn-edit`}
            onClick={() => setIsEditing(true)}
            disabled={isSaving}
        >
            <FaPencilAlt /> {hasNoProfileData ? 'Add Profile Details' : 'Edit Profile'}
        </button>
    );

    return (
        <div className="profile-page-container">
            <header className="profile-header-neon">
                {/* Display actual image or fallback icon */}
                {formData.photo_link ? (
                    <img
                        src={formData.photo_link}
                        alt={`${formData.name}'s Profile`}
                        className="profile-avatar-image"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/100/333333/FFFFFF?text=P+Error'
                        }}
                    />
                ) : (
                    <FaUserCircle className="profile-avatar-neon" />
                )}
                <h1 className="title-neon">{formData.name}'s Profile</h1>
                <p className="subtitle-neon">Manage Your Digital Identity</p>
            </header>

            <div className="profile-card-content-neon">

                <div className="profile-actions">
                    {actionButton}
                </div>

                {/* Transient Message Display */}
                <MessageDisplay message={message} type={messageType} />

                {/* Conditional Alert for New Users */}
                {hasNoProfileData && !isEditing && (
                    <div className="alert-neon-warning">
                        <FaExclamationTriangle /> **Action Required:** No detailed profile found. Click "Add Profile Details" to fill in your professional information.
                    </div>
                )}

                <div className="profile-info-grid">

                    {/* Uneditable Core Info */}
                    <div className="info-group-static">
                        <h3 className="group-title">Core Credentials</h3>
                        <DisplayField icon={<FaIdCard />} label="User ID" value={authUserId} />
                        <DisplayField icon={<FaToolbox />} label="Role" value={authRole} />
                        <DisplayField icon={<FaEnvelope />} label="Email" value={formData.email} />
                        <DisplayField icon={<FaUserCircle />} label="Full Name" value={formData.name} />
                    </div>

                    {/* Editable/Detailed Info */}
                    <div className="info-group-detailed">
                        <h3 className="group-title">Professional Details</h3>

                        {isEditing ? (
                            <form onSubmit={handleSave} className="edit-form">

                                <EditField label="Designation" name="designation" value={formData.designation} onChange={handleInputChange} />
                                <EditField label="Subject Area" name="subject_area" value={formData.subject_area} onChange={handleInputChange} />
                                <EditField label="Highest Degree" name="highest_degree" value={formData.highest_degree} onChange={handleInputChange} />
                                <EditField label="Years Experience" name="years_experience" value={formData.years_experience} type="number" onChange={handleInputChange} />
                                <EditField label="Phone Number" name="phone_number" value={formData.phone_number} type="tel" onChange={handleInputChange} />

                                {/* Photo Upload Component */}
                                <CloudinaryUploader
                                    onUploadSuccess={handlePhotoUploadSuccess}
                                    currentPhotoLink={formData.photo_link}
                                    isSaving={isSaving}
                                    showMessage={showMessage}
                                />

                                <button type="submit" className="btn-action-neon btn-save full-width-btn" disabled={isSaving}>
                                    {isSaving ? <><FaSpinner className="spin-icon" /> Saving...</> : <><FaSave /> Save Changes</>}
                                </button>
                            </form>
                        ) : (
                            <>
                                <DisplayField icon={<FaBriefcase />} label="Designation" value={formData.designation} />
                                <DisplayField icon={<FaChalkboardTeacher />} label="Subject Area" value={formData.subject_area} />
                                <DisplayField icon={<FaGraduationCap />} label="Highest Degree" value={formData.highest_degree} />
                                <DisplayField icon={<FaClock />} label="Years Experience" value={formData.years_experience ? `${formData.years_experience} Years` : 'N/A'} />
                                <DisplayField icon={<FaEnvelope />} label="Phone" value={formData.phone_number} />
                            </>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};


// ======================================================================
// --- 5. MAIN TEACHER PROFILE LAYOUT COMPONENT (The Exported Default) ---
// ======================================================================

const TeacherProfile = () => {
    const auth = useAuth();
    const navigate = useNavigate();

    // Get essential data from Auth context
    const {
        name = 'Morpheus',
        email = 'morpheus@thematrix.edu',
        userId = 'T001',
        role = 'Teacher',
        logout
    } = auth;

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const toggleProfile = () => setIsProfileOpen(prev => !prev);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const mainContentClass = `main-content-area ${!isSidebarOpen ? 'sidebar-closed-content' : ''}`;

    return (
        <>
            {/* Profile Modal */}
            {isProfileOpen && (
                <ProfileModal
                    authData={{ name, email, userId, role, logout: handleLogout }}
                    onClose={toggleProfile}
                />
            )}

            <div className="app-container">
                {/* Navbar */}
                <DashboardNavbar
                    teacherName={name}
                    onLogout={handleLogout}
                    onProfileToggle={toggleProfile}
                    onSidebarToggle={toggleSidebar}
                    isSidebarOpen={isSidebarOpen}
                />

                {/* Sidebar - NOW USING THE NEW COMPONENT */}
                <TeacherDashboardSidebar isSidebarOpen={isSidebarOpen} />

                {/* Main Content: The Profile Component */}
                <main className={mainContentClass}>
                    <TeacherProfileContent />
                </main>
            </div>
        </>
    );
};

export default TeacherProfile;