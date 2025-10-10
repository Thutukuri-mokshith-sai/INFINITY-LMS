import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    FaUniversity, FaUserCircle, FaSignOutAlt, FaBars, FaTimes,
    FaListAlt, FaStar, FaArrowLeft, FaSpinner, FaComments, FaClock,
    FaHeart, FaReply, FaPlus, FaUsers, FaBell, FaEdit, FaTrash
} from 'react-icons/fa';
import { useAuth } from "../../context/AuthContext";
import './StudentDashboard.css';

// --- Configuration ---
const API_BASE_URL = 'https://lms-portal-backend-h5k8.onrender.com/api';

// --- Complete API Service Functions ---
const forumAPI = {
    // 🔍 Public/Shared Viewing APIs
    getForumByCourseId: async (courseId, token) => {
        const response = await fetch(`${API_BASE_URL}/forums/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch forum details');
        }
        return response.json();
    },
    
    getThreadsByForum: async (forumId, token) => {
        const response = await fetch(`${API_BASE_URL}/forums/${forumId}/threads`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch threads');
        }
        return response.json();
    },
    
    getThreadWithPosts: async (threadId, token) => {
        const response = await fetch(`${API_BASE_URL}/threads/${threadId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch thread details');
        }
        return response.json();
    },
    
    getForumParticipants: async (forumId, token) => {
        const response = await fetch(`${API_BASE_URL}/forums/${forumId}/participants`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch participants');
        }
        return response.json();
    },
    
    getNotifications: async (token) => {
        const response = await fetch(`${API_BASE_URL}/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch notifications');
        }
        return response.json();
    },
    
    markNotificationAsRead: async (notificationId, token) => {
        const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/mark-read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to mark notification as read');
        }
        return response.json();
    },
    
    // 🌐 Participation & Engagement APIs - Thread Management
    createThread: async (forumId, data, token) => {
        const response = await fetch(`${API_BASE_URL}/forums/${forumId}/threads`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create thread');
        }
        return response.json();
    },
    
    updateThread: async (threadId, data, token) => {
        const response = await fetch(`${API_BASE_URL}/threads/${threadId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update thread');
        }
        return response.json();
    },
    
    deleteThread: async (threadId, token) => {
        const response = await fetch(`${API_BASE_URL}/threads/${threadId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete thread');
        }
        return response.json();
    },
    
    // 🌐 Participation & Engagement APIs - Post Management
    createPost: async (threadId, data, token) => {
        const response = await fetch(`${API_BASE_URL}/threads/${threadId}/posts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create post');
        }
        return response.json();
    },
    
    updatePost: async (postId, data, token) => {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update post');
        }
        return response.json();
    },
    
    deletePost: async (postId, token) => {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete post');
        }
        return response.json();
    },
    
    // 🌐 Participation & Engagement APIs - Like System
    toggleThreadLike: async (threadId, token) => {
        const response = await fetch(`${API_BASE_URL}/threads/${threadId}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to toggle thread like');
        }
        return response.json();
    },
    
    togglePostLike: async (postId, token) => {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to toggle post like');
        }
        return response.json();
    }
};

// ---------------------------------------------------------------------
// --- REUSED COMPONENTS ---
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

const DashboardNavbar = ({ studentName, onLogout, onProfileToggle, onSidebarToggle, isSidebarOpen, unreadCount }) => (
    <nav className="dashboard-navbar-neon">
        <button className="sidebar-toggle-btn" onClick={onSidebarToggle}>
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
        <div className="logo"><FaUniversity className="logo-icon" /> The Matrix Academy</div>
        <div className="nav-profile-group">
            <span className="student-name" onClick={onProfileToggle}>
                <FaUserCircle /> {studentName}
                {unreadCount > 0 && (
                    <span style={{
                        marginLeft: '5px',
                        background: 'red',
                        color: 'white',
                        borderRadius: '50%',
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </span>
            <button className="btn-logout-neon" onClick={onLogout}><FaSignOutAlt /> Logout</button>
        </div>
    </nav>
);

const DashboardSidebar = ({ isOpen }) => (
    <aside className={`dashboard-sidebar-neon ${!isOpen ? 'sidebar-closed' : ''}`}>
        <div className="sidebar-header">MENU</div>
        <nav className="sidebar-nav">
            <Link to="/student" className="nav-link"><FaListAlt /> <span className="link-text">Dashboard</span></Link>
            <Link to="/student/my-courses" className="nav-link active"><FaListAlt /> <span className="link-text">My Courses</span></Link>
            <Link to="/student/courses" className="nav-link"><FaUniversity /> <span className="link-text">Enroll Courses</span></Link>
            <Link to="/student/grades" className="nav-link"><FaStar /> <span className="link-text">Grades</span></Link>
            <Link to="/student/disucusion" className="nav-link"><FaStar /> <span className="link-text">Discusion Forum</span></Link>
            <Link to="/student/profile" className="nav-link"><FaUserCircle /> <span className="link-text">Profile</span></Link>
        </nav>
    </aside>
);

// ---------------------------------------------------------------------
// --- New Thread Modal Component ---
// ---------------------------------------------------------------------

const NewThreadModal = ({ onClose, onSubmit, isLoading }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (title.trim() && content.trim()) {
            onSubmit({ title, content });
        } else {
            alert('Title and content are required!');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
                background: '#1a1a2e',
                border: '2px solid #0ff',
                borderRadius: '10px',
                padding: '20px',
                maxWidth: '600px',
                width: '90%'
            }}>
                <h2 style={{ color: '#0ff', marginBottom: '20px' }}><FaPlus /> Start a New Thread</h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#0ff' }}>
                            Thread Title
                        </label>
                        <input 
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="input-neon full-width-input"
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#0ff' }}>
                            Thread Content
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={8}
                            className="textarea-neon full-width-input"
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            type="submit"
                            className="btn-primary-neon" 
                            style={{ flex: 1 }}
                            disabled={isLoading}
                        >
                            {isLoading ? <><FaSpinner className="spinner" /> Posting...</> : 'Post Thread'}
                        </button>
                        <button 
                            type="button"
                            onClick={onClose} 
                            className="btn-secondary-neon" 
                            style={{ flex: 1 }}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------
// --- Thread Card Component with Actions ---
// ---------------------------------------------------------------------

const ThreadCard = ({ thread, onLike, onDelete, onEdit, currentUserId }) => {
    const navigate = useNavigate();
    const lastUpdate = new Date(thread.updatedAt).toLocaleString();
    const postCount = thread.Posts ? thread.Posts.length : 0;
    const likeCount = thread.Likes ? thread.Likes.length : 0;
    const isOwner = thread.userId === currentUserId;
    const userHasLiked = thread.Likes && thread.Likes.some(like => like.userId === currentUserId);

    return (
        <div className="widget-card thread-card-neon">
            <div 
                className="thread-content-area"
                onClick={() => navigate(`/student/threads/${thread.id}`)}
                style={{ cursor: 'pointer', flex: 1 }}
            >
                <h3 className="thread-title">{thread.title}</h3>
                <p className="thread-content-preview" style={{ 
                    color: '#aaa', 
                    fontSize: '14px', 
                    marginTop: '5px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {thread.content?.substring(0, 100)}...
                </p>
                <p className="thread-meta-info">
                    Started by: 
                    <span className="creator-name"> {thread.Creator.name} ({thread.Creator.role})</span>
                </p>
                <p className="thread-meta-info last-update">
                    <FaClock /> Last Activity: {lastUpdate}
                </p>
            </div>
            <div className="thread-stats-area" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px' }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <div className="stat-item">
                        <FaReply />
                        <span className="stat-count">{postCount}</span>
                        <span className="stat-label">Replies</span>
                    </div>
                    <div 
                        className="stat-item" 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            onLike(thread.id); 
                        }} 
                        style={{ cursor: 'pointer', color: userHasLiked ? '#ff0066' : 'inherit' }}
                        title={userHasLiked ? "Unlike" : "Like"}
                    >
                        <FaHeart />
                        <span className="stat-count">{likeCount}</span>
                        <span className="stat-label">Likes</span>
                    </div>
                </div>
                {isOwner && (
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <button 
                            className="btn-secondary-neon" 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                onEdit(thread); 
                            }}
                            style={{ fontSize: '12px', padding: '5px 10px', flex: 1 }}
                            title="Edit Thread"
                        >
                            <FaEdit />
                        </button>
                        <button 
                            className="btn-danger-neon" 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                onDelete(thread.id); 
                            }}
                            style={{ fontSize: '12px', padding: '5px 10px', flex: 1 }}
                            title="Delete Thread"
                        >
                            <FaTrash />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------
// --- MAIN COMPONENT: StudentForumView ---
// ---------------------------------------------------------------------

const StudentForumView = () => {
    const { forumId } = useParams(); 
    const auth = useAuth();
    const navigate = useNavigate();

    const { user, logout, token } = auth;
    const studentName = user?.name || 'Student';

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    
    // State management
    const [forumDetails, setForumDetails] = useState(null); 
    const [threads, setThreads] = useState([]); 
    const [participants, setParticipants] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [showParticipants, setShowParticipants] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showNewThreadModal, setShowNewThreadModal] = useState(false); // New state for Create Thread Modal
    const [isSubmittingNewThread, setIsSubmittingNewThread] = useState(false); // New state for submission loading
    const [editingThread, setEditingThread] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const toggleProfile = () => setIsProfileOpen(prev => !prev);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // --- Fetch Forum Data and Threads ---
    const fetchForumData = async () => {
        setIsLoading(true);
        setError(null);

        if (!token || !forumId) {
            setError(token ? "Invalid forum ID." : "Authentication required. Please log in.");
            if (!token) navigate('/login');
            setIsLoading(false);
            return;
        }

        try {
            const threadsData = await forumAPI.getThreadsByForum(forumId, token);
            setThreads(threadsData);
            
            // Mock forum details - In production, use getForumByCourseId
            setForumDetails({ 
                id: forumId,
                title: `Course Discussion Forum`, 
                description: `Join the conversation and engage with your peers!` 
            });

        } catch (err) {
            console.error("Forum thread fetch error:", err);
            setError(err.message || 'An unexpected error occurred while loading the forum.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchForumData(); 
    }, [forumId, token, navigate]);
    
    // Fetch notifications on mount
    useEffect(() => {
        const fetchNotifications = async () => {
            if (!token) return;
            try {
                const notifs = await forumAPI.getNotifications(token);
                setNotifications(notifs);
                setUnreadCount(notifs.filter(n => !n.isRead).length);
            } catch (err) {
                console.error("Failed to fetch notifications:", err);
            }
        };
        fetchNotifications();
    }, [token]);
    
    // --- New Thread Handler ---
    const handleCreateThread = async (threadData) => {
        setIsSubmittingNewThread(true);
        try {
            // New API Call Implementation
            await forumAPI.createThread(forumId, threadData, token);
            
            // Close modal and refresh thread list
            setShowNewThreadModal(false);
            await fetchForumData();
            alert("Thread created successfully!");
        } catch (err) {
            console.error("Failed to create thread:", err);
            alert(err.message || "Failed to create thread. Please try again.");
        } finally {
            setIsSubmittingNewThread(false);
        }
    };
    
    // --- Thread Like Handler ---
    const handleLikeThread = async (threadId) => {
        try {
            const result = await forumAPI.toggleThreadLike(threadId, token);
            console.log(result.message);
            // Refresh threads to show updated like count
            await fetchForumData();
        } catch (err) {
            console.error("Failed to like thread:", err);
            alert(err.message || "Failed to like thread. Please try again.");
        }
    };
    
    // --- Thread Delete Handler ---
    const handleDeleteThread = async (threadId) => {
        if (!window.confirm("Are you sure you want to delete this thread? This action cannot be undone.")) return;
        try {
            await forumAPI.deleteThread(threadId, token);
            setThreads(threads.filter(t => t.id !== threadId));
            alert("Thread deleted successfully!");
        } catch (err) {
            console.error("Failed to delete thread:", err);
            alert(err.message || "Failed to delete thread. You may not have permission.");
        }
    };
    
    // --- Thread Edit Handler ---
    const handleEditThread = (thread) => {
        setEditingThread({ ...thread });
        setShowEditModal(true);
    };
    
    const saveThreadEdit = async () => {
        if (!editingThread || !editingThread.title.trim() || !editingThread.content.trim()) {
            alert("Title and content are required!");
            return;
        }
        
        try {
            await forumAPI.updateThread(editingThread.id, {
                title: editingThread.title,
                content: editingThread.content
            }, token);
            
            await fetchForumData();
            setShowEditModal(false);
            setEditingThread(null);
            alert("Thread updated successfully!");
        } catch (err) {
            console.error("Failed to update thread:", err);
            alert(err.message || "Failed to update thread.");
        }
    };
    
    // --- Load Participants ---
    const loadParticipants = async () => {
        try {
            const participantsData = await forumAPI.getForumParticipants(forumId, token);
            setParticipants(participantsData);
            setShowParticipants(true);
        } catch (err) {
            console.error("Failed to fetch participants:", err);
            alert(err.message || "Failed to load participants.");
        }
    };
    
    // --- Mark Notification as Read ---
    const handleMarkNotificationRead = async (notificationId) => {
        try {
            await forumAPI.markNotificationAsRead(notificationId, token);
            setNotifications(notifications.map(n => 
                n.id === notificationId ? { ...n, isRead: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Failed to mark notification as read:", err);
        }
    };

    const mainContentClass = `main-content-area ${!isSidebarOpen ? 'sidebar-closed-content' : ''}`;

    if (isLoading) {
        return (
            <div className="app-container">
                <DashboardNavbar 
                    studentName={studentName} 
                    onLogout={handleLogout} 
                    onProfileToggle={toggleProfile} 
                    onSidebarToggle={toggleSidebar} 
                    isSidebarOpen={isSidebarOpen}
                    unreadCount={unreadCount}
                />
                <DashboardSidebar isOpen={isSidebarOpen} />
                <main className={mainContentClass}>
                    <div className="loading-state">
                        <FaSpinner className="spinner" /> 
                        <p>Loading forum threads...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error || !forumDetails) {
        return (
            <div className="app-container">
                <DashboardNavbar 
                    studentName={studentName} 
                    onLogout={handleLogout} 
                    onProfileToggle={toggleProfile} 
                    onSidebarToggle={toggleSidebar} 
                    isSidebarOpen={isSidebarOpen}
                    unreadCount={unreadCount}
                />
                <DashboardSidebar isOpen={isSidebarOpen} />
                <main className={mainContentClass}>
                    <div className="error-state">
                        <p>Error: {error || `Forum ID ${forumId} not accessible or does not exist.`}</p>
                        <Link to="/student/my-courses" className="btn-action-neon" style={{ marginTop: '10px' }}>
                            <FaArrowLeft /> Back to My Courses
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <>
            {isProfileOpen && (
                <ProfileModal 
                    authData={{ 
                        name: studentName, 
                        email: user?.email, 
                        userId: user?.id, 
                        role: user?.role, 
                        logout: handleLogout 
                    }} 
                    onClose={toggleProfile} 
                />
            )}
            
            {showNewThreadModal && (
                <NewThreadModal 
                    onClose={() => setShowNewThreadModal(false)}
                    onSubmit={handleCreateThread}
                    isLoading={isSubmittingNewThread}
                />
            )}
            
            <div className="app-container">
                <DashboardNavbar 
                    studentName={studentName} 
                    onLogout={handleLogout} 
                    onProfileToggle={toggleProfile} 
                    onSidebarToggle={toggleSidebar} 
                    isSidebarOpen={isSidebarOpen}
                    unreadCount={unreadCount}
                />
                <DashboardSidebar isOpen={isSidebarOpen} />

                <main className={mainContentClass}>
                    <Link to="/student/my-courses" className="btn-action-neon" style={{ marginBottom: '20px' }}>
                        <FaArrowLeft /> Back to My Courses
                    </Link>

                    <div className="welcome-banner dashboard-section">
                        <h1 className="section-title-neon">
                            <FaComments /> {forumDetails.title}
                        </h1>
                        <p className="section-subtitle-neon">{forumDetails.description}</p>
                        
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                            {/* Updated button to show the modal */}
                            <button 
                                className="btn-primary-neon" 
                                onClick={() => setShowNewThreadModal(true)} // Open the modal
                            >
                                <FaPlus /> Start New Thread
                            </button>
                            
                            <button 
                                className="btn-secondary-neon" 
                                onClick={loadParticipants}
                            >
                                <FaUsers /> View Participants
                            </button>
                            
                            <button 
                                className="btn-secondary-neon" 
                                onClick={() => setShowNotifications(!showNotifications)}
                                style={{ position: 'relative' }}
                            >
                                <FaBell /> Notifications
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '-5px',
                                        right: '-5px',
                                        background: 'red',
                                        color: 'white',
                                        borderRadius: '50%',
                                        padding: '2px 6px',
                                        fontSize: '10px',
                                        fontWeight: 'bold'
                                    }}>
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                    
                    {/* Participants Modal */}
                    {showParticipants && (
                        <div className="modal-overlay" onClick={() => setShowParticipants(false)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
                                background: '#1a1a2e',
                                border: '2px solid #0ff',
                                borderRadius: '10px',
                                padding: '20px',
                                maxWidth: '500px',
                                width: '90%'
                            }}>
                                <h2 style={{ color: '#0ff', marginBottom: '20px' }}>
                                    Forum Participants ({participants.length})
                                </h2>
                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {participants.map(p => (
                                        <div key={p.id} style={{ 
                                            padding: '10px', 
                                            borderBottom: '1px solid #333',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <strong style={{ color: '#fff' }}>{p.User.name}</strong>
                                                <span style={{ color: '#aaa', marginLeft: '10px' }}>
                                                    {p.User.role}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => setShowParticipants(false)} 
                                    className="btn-primary-neon" 
                                    style={{ marginTop: '15px', width: '100%' }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* Notifications Panel */}
                    {showNotifications && (
                        <div className="modal-overlay" onClick={() => setShowNotifications(false)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
                                background: '#1a1a2e',
                                border: '2px solid #0ff',
                                borderRadius: '10px',
                                padding: '20px',
                                maxWidth: '600px',
                                width: '90%'
                            }}>
                                <h2 style={{ color: '#0ff', marginBottom: '20px' }}>
                                    Notifications ({notifications.length})
                                </h2>
                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {notifications.length > 0 ? notifications.map(notif => (
                                        <div 
                                            key={notif.id} 
                                            style={{ 
                                                padding: '15px', 
                                                borderBottom: '1px solid #333',
                                                backgroundColor: notif.isRead ? 'transparent' : 'rgba(0, 255, 255, 0.1)',
                                                cursor: notif.isRead ? 'default' : 'pointer',
                                                borderLeft: notif.isRead ? 'none' : '3px solid #0ff'
                                            }}
                                            onClick={() => !notif.isRead && handleMarkNotificationRead(notif.id)}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <p style={{ margin: 0 }}>
                                                    <strong style={{ color: '#0ff' }}>
                                                        {notif.type.replace(/_/g, ' ').toUpperCase()}
                                                    </strong>
                                                </p>
                                                {!notif.isRead && (
                                                    <span style={{ color: '#0ff', fontSize: '12px', fontWeight: 'bold' }}>
                                                        • NEW
                                                    </span>
                                                )}
                                            </div>
                                            <p style={{ margin: '10px 0 5px 0', color: '#fff' }}>
                                                {notif.message}
                                            </p>
                                            <small style={{ color: '#888' }}>
                                                {new Date(notif.createdAt).toLocaleString()}
                                            </small>
                                        </div>
                                    )) : (
                                        <p style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                                            No notifications yet
                                        </p>
                                    )}
                                </div>
                                <button 
                                    onClick={() => setShowNotifications(false)} 
                                    className="btn-primary-neon" 
                                    style={{ marginTop: '15px', width: '100%' }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* Edit Thread Modal */}
                    {showEditModal && editingThread && (
                        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
                                background: '#1a1a2e',
                                border: '2px solid #0ff',
                                borderRadius: '10px',
                                padding: '20px',
                                maxWidth: '600px',
                                width: '90%'
                            }}>
                                <h2 style={{ color: '#0ff', marginBottom: '20px' }}>Edit Thread</h2>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#0ff' }}>
                                        Thread Title
                                    </label>
                                    <input 
                                        type="text"
                                        value={editingThread.title}
                                        onChange={(e) => setEditingThread(prev => ({ ...prev, title: e.target.value }))}
                                        className="input-neon full-width-input"
                                    />
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#0ff' }}>
                                        Thread Content
                                    </label>
                                    <textarea
                                        value={editingThread.content}
                                        onChange={(e) => setEditingThread(prev => ({ ...prev, content: e.target.value }))}
                                        rows={6}
                                        className="textarea-neon full-width-input"
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button 
                                        onClick={saveThreadEdit} 
                                        className="btn-primary-neon" 
                                        style={{ flex: 1 }}
                                    >
                                        Save Changes
                                    </button>
                                    <button 
                                        onClick={() => { setShowEditModal(false); setEditingThread(null); }} 
                                        className="btn-secondary-neon" 
                                        style={{ flex: 1 }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Threads List */}
                    <div className="threads-list dashboard-section" style={{ marginTop: '20px' }}>
                        {threads.length > 0 ? threads.map(thread => (
                            <ThreadCard 
                                key={thread.id} 
                                thread={thread} 
                                onLike={handleLikeThread} 
                                onDelete={handleDeleteThread} 
                                onEdit={handleEditThread}
                                currentUserId={user?.id}
                            />
                        )) : (
                            <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                                No threads yet. Start a new discussion!
                            </p>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
};

export default StudentForumView;