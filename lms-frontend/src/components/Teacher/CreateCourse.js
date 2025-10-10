import React, { useState, useEffect } from 'react';
import { FaPlusCircle, FaBookOpen, FaChalkboardTeacher, FaClock, FaCalendarAlt, FaDollarSign, FaUserGraduate, FaBars, FaTimes, FaUniversity, FaUserCircle, FaSignOutAlt, FaListAlt, FaGraduationCap } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import axios from 'axios';
import './CreateCourse.css';

// ⭐️ REAL API CALL FUNCTION ⭐️
const apiCreateCourse = async (courseData, token) => {
    // ⚠️ IMPORTANT: Replace with your actual backend URL
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

    try {
        const response = await axios.post(`${API_URL}/courses`, courseData, {
            headers: {
                // Pass the authorization token from the context
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        // Backend returns: res.status(201).json({ message: 'Course created successfully.', course: newCourse })
        return response.data;

    } catch (error) {
        // Handle API errors (e.g., 400 validation error, 500 server error)
        console.error("API Course Creation Error:", error.response || error);

        // Extract a specific error message from the backend response if available
        const errorMessage = error.response?.data?.message || 'Server error while creating course.';

        // Re-throw the error to be caught by the handleSubmit
        throw new Error(errorMessage);
    }
};

// --- HELPER FUNCTION FOR DATE CALCULATION ---
/**
 * Calculates the end date based on a start date and a duration string (e.g., "8 Weeks").
 * @param {string} startDateString - The start date in 'YYYY-MM-DD' format.
 * @param {number} value - The numeric value for the duration (e.g., 8).
 * @param {string} unit - The unit for the duration (e.g., 'Weeks').
 * @returns {string} The calculated end date in 'YYYY-MM-DD' format.
 */
const calculateEndDate = (startDateString, value, unit) => {
    if (!startDateString || !value || !unit) return '';

    const startDate = new Date(startDateString);
    const endDate = new Date(startDate.getTime()); // Clone the start date

    // Logic to add duration
    switch (unit.toLowerCase()) {
        case 'days':
            endDate.setDate(endDate.getDate() + value);
            break;
        case 'weeks':
            endDate.setDate(endDate.getDate() + (value * 7));
            break;
        case 'months':
            endDate.setMonth(endDate.getMonth() + value);
            break;
        default:
            return ''; // For 'Self-Paced' or invalid unit
    }

    // Format the date back to 'YYYY-MM-DD'
    return endDate.toISOString().split('T')[0];
};

const CreateCourse = ({ onCourseCreated }) => {
    const { user, name, role, logout, isAuthenticated, token } = useAuth();
    const navigate = useNavigate();

    // ⭐️ UPDATED STATE STRUCTURE ⭐️
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        // Separate duration fields for flexible input
        durationPreset: '8 Weeks', // e.g., '4 Weeks', '8 Weeks', 'Custom', 'Self-Paced'
        durationValue: 8, // for Custom: e.g., 8
        durationUnit: 'Weeks', // for Custom: e.g., 'Days', 'Weeks', 'Months'
        // Aligning with Sequelize types
        startDate: new Date().toISOString().split('T')[0],
        endDate: calculateEndDate(new Date().toISOString().split('T')[0], 8, 'Weeks'), // Initial calculated end date
        price: 0,
        maxStudents: 30,
    });
    
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // --- EFFECT TO UPDATE END DATE ---
    useEffect(() => {
        let newEndDate = '';

        if (formData.durationPreset === 'Self-Paced') {
            newEndDate = ''; // Clear end date for self-paced
        } else if (formData.durationPreset === 'Custom') {
            newEndDate = calculateEndDate(formData.startDate, formData.durationValue, formData.durationUnit);
        } else {
            // Handle '4 Weeks', '8 Weeks', '12 Weeks' presets
            const [valueStr, unit] = formData.durationPreset.split(' ');
            const value = parseInt(valueStr, 10);
            if (value && unit) {
                newEndDate = calculateEndDate(formData.startDate, value, unit);
            }
        }
        
        // Only update if the calculated date is different, to avoid infinite loops or unnecessary re-renders
        if (newEndDate !== formData.endDate) {
            setFormData(prevData => ({ ...prevData, endDate: newEndDate }));
        }
    }, [formData.startDate, formData.durationPreset, formData.durationValue, formData.durationUnit]);


    // --- DASHBOARD NAVIGATION HANDLERS ---
    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const handleLogout = logout;
    const handleCancel = () => navigate('/teacher/courses');

    // ⭐️ UPDATED CHANGE HANDLER ⭐️
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        
        setFormData(prevData => {
            let newData = { ...prevData };
            
            // Handle numeric values
            const newValue = type === 'number' ? (value === '' ? '' : Number(value)) : value;

            if (name === 'durationPreset') {
                newData[name] = newValue;
                // Set default custom values if switching to 'Custom'
                if (newValue === 'Custom' && newData.durationValue === '') {
                    newData.durationValue = 1;
                    newData.durationUnit = 'Weeks';
                }
                // Update duration for presets to ensure correct API payload
                if (newValue !== 'Custom' && newValue !== 'Self-Paced') {
                    const [val, unit] = newValue.split(' ');
                    newData.durationValue = Number(val);
                    newData.durationUnit = unit;
                }
            } else if (name === 'durationValue' && newValue < 1) {
                // Prevent duration value from going below 1
                newData[name] = 1;
            } else if (name === 'durationUnit' || name === 'startDate') {
                newData[name] = newValue;
            } else {
                // For title, description, price, maxStudents
                newData[name] = newValue;
            }

            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setIsError(false);

        // Simple client-side validation for required fields
        const isSelfPaced = formData.durationPreset === 'Self-Paced';

        if (!formData.title || !formData.description || !formData.durationPreset || !formData.startDate || (!isSelfPaced && !formData.endDate)) {
            setIsError(true);
            setMessage('Please fill in all required fields (Title, Description, Duration, and Dates).');
            setIsLoading(false);
            return;
        }
        
        // Final duration value for the API payload
        const finalDurationString = isSelfPaced ? 'Self-Paced' : `${formData.durationValue} ${formData.durationUnit}`;

        const submissionData = {
            title: formData.title,
            description: formData.description,
            // ⭐️ Use the constructed duration string and only send endDate if not self-paced ⭐️
            duration: finalDurationString, 
            startDate: formData.startDate,
            endDate: isSelfPaced ? null : formData.endDate, // Send null or undefined for self-paced
            price: formData.price, 
            maxStudents: formData.maxStudents, 
        };

        try {
            const response = await apiCreateCourse(submissionData, token);

            setMessage(response.message);

            // Redirect to the list of courses or a success page after a short delay
            setTimeout(() => {
                navigate('/teacher/courses');
                if (onCourseCreated) onCourseCreated(response.course);
            }, 1000);

        } catch (error) {
            setIsError(true);
            setMessage(error.message || 'An unknown error occurred during course creation.');
        } finally {
            // Keep loading false only if we didn't navigate away
            if (message === '') setIsLoading(false);
        }
    };

    // --- NAVIGATION BAR COMPONENT (No changes) ---
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

    // --- SIDEBAR COMPONENT (No changes) ---
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
                <Link to="/teacher/courses/new" className="nav-link active">
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
    const isCustomDuration = formData.durationPreset === 'Custom';
    const isSelfPaced = formData.durationPreset === 'Self-Paced';

    return (
        <div className="app-container">
            <CourseNavbar />
            <CourseSidebar />

            <main className={mainContentClass}>
                <div className="create-course-container dashboard-section">
                    <h1 className="form-title-neon section-title-neon"><FaPlusCircle /> Create New Course</h1>
                    <p className="form-subtitle section-subtitle-neon">Define the core structure and details of your new offering.</p>

                    <form className="course-form" onSubmit={handleSubmit}>

                        {/* 1. Basic Info */}
                        <fieldset className="form-section widget-card">
                            <legend><FaBookOpen /> Course Fundamentals</legend>

                            <div className="form-group">
                                <label htmlFor="title">Course Title *</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., Advanced React Hooks"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description *</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    rows="4"
                                    placeholder="A brief summary of what students will learn."
                                ></textarea>
                            </div>
                        </fieldset>

                        {/* 2. Logistics */}
                        <fieldset className="form-section widget-card">
                            <legend><FaChalkboardTeacher /> Course Logistics</legend>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="durationPreset"><FaClock /> Duration *</label>
                                    {/* ⭐️ DURATION PRESET SELECT ⭐️ */}
                                    <select
                                        id="durationPreset"
                                        name="durationPreset"
                                        value={formData.durationPreset}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="4 Weeks">4 Weeks</option>
                                        <option value="8 Weeks">8 Weeks</option>
                                        <option value="12 Weeks">12 Weeks</option>
                                        <option value="Self-Paced">Self-Paced</option>
                                        <option value="Custom">Custom...</option>
                                    </select>
                                </div>
                                
                                {/* ⭐️ CUSTOM DURATION INPUTS ⭐️ */}
                                {isCustomDuration && (
                                    <>
                                        <div className="form-group">
                                            <label htmlFor="durationValue">Custom Value *</label>
                                            <input
                                                type="number"
                                                id="durationValue"
                                                name="durationValue"
                                                value={formData.durationValue}
                                                onChange={handleChange}
                                                required
                                                min="1"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="durationUnit">Custom Unit *</label>
                                            <select
                                                id="durationUnit"
                                                name="durationUnit"
                                                value={formData.durationUnit}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="Days">Days</option>
                                                <option value="Weeks">Weeks</option>
                                                <option value="Months">Months</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                                
                                {/* Start Date is always needed */}
                                <div className="form-group">
                                    <label htmlFor="startDate"><FaCalendarAlt /> Start Date *</label>
                                    <input
                                        type="date"
                                        id="startDate"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                
                                {/* ⭐️ CALCULATED END DATE (Read-only/Hidden for Self-Paced) ⭐️ */}
                                {!isSelfPaced && (
                                    <div className="form-group">
                                        <label htmlFor="endDate"><FaCalendarAlt /> Calculated End Date</label>
                                        <input
                                            type="date"
                                            id="endDate"
                                            name="endDate"
                                            value={formData.endDate}
                                            readOnly
                                            disabled // Prevent manual editing
                                            className="read-only-input"
                                        />
                                        <small className="input-hint">Automatically calculated based on Start Date and Duration.</small>
                                    </div>
                                )}
                                
                                {/* Price and Max Students remain optional/fixed */}
                                <div className="form-group">
                                    <label htmlFor="price"><FaDollarSign /> Price (USD)</label>
                                    <input
                                        type="number"
                                        id="price"
                                        name="price"
                                        value={formData.price} 
                                        onChange={handleChange}
                                        min="0"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="maxStudents"><FaUserGraduate /> Max Students</label>
                                    <input
                                        type="number"
                                        id="maxStudents"
                                        name="maxStudents"
                                        value={formData.maxStudents} 
                                        onChange={handleChange}
                                        min="1"
                                    />
                                </div>
                            </div>
                        </fieldset>

                        {/* Submission and Messaging */}
                        {message && (
                            <div className={`message-box ${isError ? 'error-neon' : 'success-neon'}`}>
                                {message}
                            </div>
                        )}

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="btn-primary-neon"
                                disabled={isLoading || !formData.title || !formData.description || (!isSelfPaced && !formData.endDate)}
                            >
                                {isLoading ? 'Creating...' : 'Create Course'}
                            </button>
                            <button
                                type="button"
                                className="btn-secondary-neon"
                                onClick={handleCancel}
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default CreateCourse;