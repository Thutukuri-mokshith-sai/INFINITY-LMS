import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaComments, FaBolt, FaBell, FaClock, FaCalendarAlt,
    FaArrowRight, FaUserCircle, FaSpinner, FaExclamationTriangle, FaTimes,
    FaUniversity, FaBookOpen, FaSignOutAlt, FaBars, FaListAlt, FaStar, FaGlobe
} from 'react-icons/fa';
import { useAuth } from "../../context/AuthContext";
import './StudentDashboard.css'; // Assuming shared styles

// --- Configuration ---
const API_BASE_URL = 'https://lms-portal-backend-h5k8.onrender.com/api';

// --- Placeholder for CSS Variables (Must be defined for inline styles to work) ---
// Defining these constants helps simulate CSS variables used in the original style blocks
const CSS_VARS = {
    '--dark-bg': '#1a1a2e',
    '--neon-color': '#00ffff',
    '--highlight-green': '#10b981',
    '--light-text': '#e0e0e0',
    '--color-primary-dark': '#2a2a44',
    '--color-bg-alt': '#1f1f38',
    '--color-accent-neon': '#00ffff',
    '--secondary-shadow': '0 4px 6px rgba(0, 0, 0, 0.3)',
    '--card-bg': 'rgba(255, 255, 255, 0.05)',
    '--widget-hover-bg': 'rgba(0, 0, 0, 0.6)',
    '--widget-shadow-hover': '0 0 15px var(--neon-color)',
};

// ---------------------------------------------------------------------
// --- REUSED COMPONENTS (Retained/Modified for Inline Style Consistency) ---
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
            <Link to="/student/my-courses" className="nav-link"><FaBookOpen /> <span className="link-text">My Courses</span></Link>
            <Link to="/student/courses" className="nav-link"><FaUniversity /> <span className="link-text">Enroll Courses</span></Link>
            <Link to="/student/grades" className="nav-link"><FaStar /> <span className="link-text">Grades</span></Link>
            <Link to="/student/discussion" className="nav-link active"><FaComments /> <span className="link-text">Discussion Forum</span></Link>
            <Link to="/student/profile" className="nav-link"><FaUserCircle /> <span className="link-text">Profile</span></Link>
        </nav>
    </aside>
);

// --- Widget Component with Interactive Hover Effect ---
const DashboardWidget = ({ title, icon: Icon, children, style = {}, className = '' }) => {
    const [isHovered, setIsHovered] = useState(false);

    const baseStyle = {
        padding: '20px',
        borderRadius: '10px',
        background: CSS_VARS['--card-bg'], // Default background
        border: `1px solid rgba(0, 255, 255, 0.1)`,
        boxShadow: `0 0 5px rgba(0, 255, 255, 0.1)`,
        transition: 'all 0.3s ease',
        ...style
    };

    const hoverStyle = {
        transform: 'translateY(-5px)',
        background: CSS_VARS['--widget-hover-bg'],
        boxShadow: `0 0 15px ${CSS_VARS['--neon-color']}`,
        zIndex: 10,
    };

    return (
        <section 
            className={`dashboard-widget ${className}`}
            style={isHovered ? { ...baseStyle, ...hoverStyle } : baseStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <h3 style={{
                fontSize: '1.4em',
                fontWeight: 600,
                color: CSS_VARS['--neon-color'],
                textShadow: `0 0 3px ${CSS_VARS['--neon-color']}`,
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
                paddingBottom: '10px',
            }}>
                <Icon style={{ color: CSS_VARS['--highlight-green'] }} /> {title}
            </h3>
            <div className="widget-content">
                {children}
            </div>
        </section>
    );
};

// ---------------------------------------------------------------------
// --- NEW Components for Displaying Overall Data (Slightly modified to remove widget styling) ---
// ---------------------------------------------------------------------

const OverallRecentThreadCard = ({ thread }) => (
    // Note: Applying card-specific styles inline here
    <div className="widget-item-neon thread-card" style={{
        padding: '15px',
        marginBottom: '10px',
        background: 'rgba(0, 0, 0, 0.4)',
        borderRadius: '8px',
        borderLeft: `4px solid ${CSS_VARS['--neon-color']}`,
    }}>
        <Link to={`/student/threads/${thread.id}`} className="thread-title-link" style={{
            fontSize: '1.1em',
            fontWeight: 600,
            color: CSS_VARS['--neon-color'],
            textDecoration: 'none',
            display: 'block',
            marginBottom: '8px',
        }}>
            <FaBolt style={{ marginRight: '5px' }} /> {thread.title}
        </Link>
        <div className="thread-meta" style={{
            fontSize: '0.85em',
            color: '#a7f3d0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        }}>
            <span className="thread-course-tag" style={{ background: '#10b98133', padding: '3px 8px', borderRadius: '4px' }}>{thread.courseTitle}</span>
            <span style={{ color: '#9ca3af' }}><FaClock style={{ marginRight: '3px' }} size={10} /> {new Date(thread.createdAt).toLocaleDateString()}</span>
        </div>
    </div>
);

const OverallRecentReplyCard = ({ reply }) => (
    <div className="widget-item-neon reply-card" style={{
        padding: '15px',
        marginBottom: '10px',
        background: CSS_VARS['--color-bg-alt'],
        borderRadius: '8px',
        borderLeft: `3px solid ${CSS_VARS['--highlight-green']}`,
    }}>
        <p className="reply-snippet" style={{
            color: CSS_VARS['--light-text'],
            fontStyle: 'italic',
            marginBottom: '8px',
            fontSize: '0.9em',
        }}>
            "{reply.contentSnippet}"
        </p>
        <div className="reply-meta" style={{
            fontSize: '0.8em',
            color: '#a7f3d0',
        }}>
            <span>Replied by: <strong>{reply.poster}</strong> in </span>
            <Link to={`/student/threads/${reply.threadId}`} className="reply-thread-link" style={{
                color: CSS_VARS['--neon-color'],
                textDecoration: 'none',
                fontWeight: 'bold',
            }}>
                "{reply.threadTitle}"
            </Link>
        </div>
    </div>
);

const NotificationCard = ({ notification }) => {
    const isNew = !notification.isRead;
    const icon = notification.type.includes('reply') ? <FaComments /> : notification.type.includes('like') ? <FaStar /> : <FaBolt />;
    const bgColor = isNew ? CSS_VARS['--color-primary-dark'] : CSS_VARS['--color-bg-alt'];

    return (
        <div className="widget-item-neon notification-card" style={{
            backgroundColor: bgColor,
            borderLeft: isNew ? `4px solid ${CSS_VARS['--color-accent-neon']}` : 'none',
            padding: '12px',
            marginBottom: '8px',
            borderRadius: '5px',
        }}>
            <div className="notification-header" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '3px',
                color: isNew ? CSS_VARS['--neon-color'] : CSS_VARS['--light-text'],
            }}>
                {icon}
                <span className={`notification-type ${isNew ? 'unread' : 'read'}`} style={{
                    fontSize: '0.8em',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    color: isNew ? CSS_VARS['--highlight-green'] : '#9ca3af',
                }}>{notification.type.replace('_', ' ')}</span>
            </div>
            <p className="notification-message" style={{ color: CSS_VARS['--light-text'], fontSize: '0.9em' }}>{notification.message}</p>
            <span className="notification-date" style={{ fontSize: '0.75em', color: '#9ca3af', display: 'block', marginTop: '3px' }}><FaCalendarAlt /> {new Date(notification.createdAt).toLocaleString()}</span>
        </div>
    );
};


// ---------------------------------------------------------------------
// --- MAIN COMPONENT: OverallDiscussionDashboard ---
// ---------------------------------------------------------------------

const OverallDiscussionDashboard = () => {
    const auth = useAuth();
    const navigate = useNavigate();

    const { user, logout, token } = auth;
    const studentName = user?.name || 'Student';

    const [discussionData, setDiscussionData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // UI state
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const toggleProfile = () => setIsProfileOpen(prev => !prev);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // --- API Fetch Logic (Unchanged) ---
    useEffect(() => {
        const fetchOverallDiscussionData = async () => {
            if (!token) {
                setError("Authentication required. Please log in.");
                setIsLoading(false);
                navigate('/login');
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(`${API_BASE_URL}/discussions/dashboard`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch overall discussion dashboard data.');
                }

                const data = await response.json();
                setDiscussionData(data);

            } catch (err) {
                console.error("Overall discussion data fetch error:", err);
                setError(err.message || 'An unexpected error occurred while loading the discussion dashboard.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchOverallDiscussionData();
    }, [token, navigate]);


    const mainContentClass = `main-content-area ${!isSidebarOpen ? 'sidebar-closed-content' : ''}`;

    if (isLoading) {
        return (
            <div className="loading-state full-page">
                <FaSpinner className="spinner large" />
                <p>Loading overall discussion activity...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-state full-page">
                <FaExclamationTriangle className="error-icon" />
                <h1 className="section-title-neon">Error Loading Discussion Summary</h1>
                <p>Details: {error}</p>
                <Link to="/student/my-courses" className="btn-action-neon">
                    <FaArrowRight /> View My Courses
                </Link>
            </div>
        );
    }

    const {
        enrolledCoursesCount,
        recentThreads,
        recentReplies,
        recentNotifications
    } = discussionData;

    const threadsCount = recentThreads.length;
    const repliesCount = recentReplies.length;

    // --- Dynamic Grid Layout Style (Inline CSS) ---
    const overallGridStyle = {
        display: 'grid',
        // Responsive grid: 1 column on small, then a 2-column staggered layout
        gridTemplateColumns: '1fr', // Default to single column
        gap: '25px',
        padding: '20px 0',
        '@media (min-width: 900px)': { // This media query syntax is NOT supported by standard React inline styles
            // In a real app, this would require a CSS file or a library like `styled-components`
            // Since we must use inline styles, we will approximate a 2-column layout for simplicity.
        },
    };

    const twoColumnGridStyle = {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr', // Threads/Replies on left (2/3), Notifications on right (1/3)
        gap: '25px',
        padding: '20px 0',
        // Note: For a true staggered layout, CSS grid-column/grid-row properties are needed, which is complex for inline styles.
        // We will stick to a basic 2-column split (Left: Threads, Right: Replies & Notifications stacked)
    };
    
    // Applying the 2-column structure for the overall summary using flex for approximation
    const overallSummaryWrapperStyle = {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '25px',
    }

    const threadsWidgetStyle = {
        flex: '2 1 500px', // Takes more space, min-width 500px
        minHeight: '400px',
    }
    
    const sideColumnStyle = {
        flex: '1 1 300px', // Takes less space, min-width 300px
        display: 'flex',
        flexDirection: 'column',
        gap: '25px',
    }


    return (
        <>
            {/* Profile Modal */}
            {isProfileOpen && (
                <ProfileModal
                    authData={{ name: studentName, email: user?.email, userId: user?.id, role: user?.role, logout: handleLogout }}
                    onClose={toggleProfile}
                />
            )}

            <div className="app-container">
                {/* Navbar */}
                <DashboardNavbar
                    studentName={studentName}
                    onLogout={handleLogout}
                    onProfileToggle={toggleProfile}
                    onSidebarToggle={toggleSidebar}
                    isSidebarOpen={isSidebarOpen}
                />

                {/* Sidebar */}
                <DashboardSidebar isOpen={isSidebarOpen} />

                {/* Main Content */}
                <main className={mainContentClass} style={{ padding: '20px' }}>
                    <div className="welcome-banner dashboard-section" style={{
                         marginBottom: '30px',
                         padding: '25px',
                         borderRadius: '10px',
                         background: 'linear-gradient(90deg, #1a1a2e, #1a1a2e 90%, #00ffff1a)',
                         border: `1px solid rgba(0, 255, 255, 0.2)`,
                    }}>
                        <h1 className="section-title-neon" style={{color: CSS_VARS['--neon-color'], textShadow: `0 0 5px ${CSS_VARS['--neon-color']}`}}>🌐 Global Discussion Dashboard</h1>
                        <h2 className="section-subtitle-neon" style={{color: '#a7f3d0', fontSize: '1.2em', fontWeight: 400}}><FaComments /> Activity across <strong>{enrolledCoursesCount}</strong> Enrolled Course(s)</h2>
                        <p className="discussion-description" style={{color: CSS_VARS['--light-text'], marginTop: '10px'}}>Keep up-to-date with the latest forum activity in your enrolled courses.</p>
                    </div>

                    <div className="discussion-grid overall-summary" style={overallSummaryWrapperStyle}>
                        
                        {/* LEFT COLUMN: Recent Threads (Wider) */}
                        <DashboardWidget 
                            title={`Top ${threadsCount} Recent Threads`}
                            icon={FaBolt}
                            style={threadsWidgetStyle}
                            className="threads-widget"
                        >
                            {threadsCount > 0 ? (
                                recentThreads.map(thread => (
                                    <OverallRecentThreadCard key={thread.id} thread={thread} />
                                ))
                            ) : (
                                <p className="empty-message" style={{color: '#9ca3af'}}>No recent thread activity found across your forums.</p>
                            )}
                        </DashboardWidget>

                        {/* RIGHT COLUMN: Replies & Notifications (Stacked) */}
                        <div style={sideColumnStyle}>
                            
                            {/* Recent Replies Widget */}
                            <DashboardWidget 
                                title={`Top ${repliesCount} Latest Replies`}
                                icon={FaComments}
                                className="replies-widget"
                            >
                                {repliesCount > 0 ? (
                                    recentReplies.map(reply => (
                                        <OverallRecentReplyCard key={reply.id} reply={reply} />
                                    ))
                                ) : (
                                    <p className="empty-message" style={{color: '#9ca3af'}}>No recent reply activity found.</p>
                                )}
                            </DashboardWidget>

                            {/* Recent Notifications Widget */}
                            <DashboardWidget 
                                title={`Your Discussion Alerts (${recentNotifications.length})`}
                                icon={FaBell}
                                className="notifications-widget"
                            >
                                {recentNotifications.length > 0 ? (
                                    recentNotifications.map(notification => (
                                        <NotificationCard key={notification.id} notification={notification} />
                                    ))
                                ) : (
                                    <p className="empty-message" style={{color: '#9ca3af'}}>No recent discussion alerts for you.</p>
                                )}
                            </DashboardWidget>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
};

export default OverallDiscussionDashboard;