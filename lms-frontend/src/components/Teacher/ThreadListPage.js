import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    FaChalkboardTeacher, FaPlusCircle, FaEdit, FaTrash, FaClock,
    FaBars, FaUniversity, FaUserCircle, FaSignOutAlt,
    FaSpinner, FaInfoCircle, FaUsers, FaComments, FaEye,
    FaChevronLeft, FaHeart, FaComment, FaExclamationTriangle, FaTimes, FaSave,
    FaBullhorn, FaBell, FaCheckCircle
} from 'react-icons/fa';
import { useAuth } from "../../context/AuthContext";
import axios from 'axios';
// Assuming the necessary CSS file exists for styling
import './TeacherCourses.css'; 

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// ====================================================
// 🚀 API FUNCTIONS (Mapped from forumController & routes)
// ====================================================

const apiGetForumByCourseId = async (courseId, token) => {
    const response = await axios.get(`${API_URL}/forums/${courseId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.data;
};

const apiGetThreadsByForum = async (forumId, token) => {
    const response = await axios.get(`${API_URL}/forums/${forumId}/threads`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.data;
};

const apiGetForumParticipants = async (forumId, token) => {
    const response = await axios.get(`${API_URL}/forums/${forumId}/participants`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.data;
};

const apiGetNotifications = async (token) => {
    const response = await axios.get(`${API_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.data;
};

const apiMarkNotificationAsRead = async (notificationId, token) => {
    const response = await axios.put(`${API_URL}/notifications/${notificationId}/mark-read`, {}, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.data;
};

const apiCreateForum = async (courseId, forumData, token) => {
    const response = await axios.post(`${API_URL}/forums`, { courseId, ...forumData }, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.data;
};

const apiUpdateForum = async (forumId, forumData, token) => {
    const response = await axios.put(`${API_URL}/forums/${forumId}`, forumData, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.data;
};

const apiDeleteForum = async (forumId, token) => {
    const response = await axios.delete(`${API_URL}/forums/${forumId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.data;
};

const apiCreateThread = async (forumId, threadData, token) => {
    const response = await axios.post(`${API_URL}/forums/${forumId}/threads`, threadData, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.data.thread;
};

const apiUpdateThread = async (threadId, threadData, token) => {
    const response = await axios.put(`${API_URL}/threads/${threadId}`, threadData, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.data;
};

const apiDeleteAnyThread = async (threadId, token) => {
    // Note: Using deleteAnyThread for Teacher/Admin moderation
    const response = await axios.delete(`${API_URL}/threads/${threadId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.data;
};

const apiSendAnnouncement = async (courseId, message, token) => {
    const response = await axios.post(`${API_URL}/notifications/announcement`, { courseId, message }, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.data;
};

// NOTE: apiGetThreadWithPosts, apiDeleteOwnThread, apiCreatePost, apiUpdatePost, 
// apiDeleteOwnPost, apiDeleteAnyPost, apiToggleThreadLike, apiTogglePostLike are 
// typically used on the ThreadDetail page, but included here for completeness.

// ====================================================
// 💻 MAIN COMPONENT: EnhancedTeacherForum (ThreadListPage)
// ====================================================
const EnhancedTeacherForum = () => {
    const { isAuthenticated, name: currentUserName, role, logout, token, userId: currentUserId } = useAuth();
    const navigate = useNavigate();
    const { courseId } = useParams(); // forumId param is not used in the initial fetch, it's derived from courseId

    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('threads'); // threads, participants, notifications

    // Forum State
    const [forum, setForum] = useState(null);
    const [threads, setThreads] = useState([]);
    const [participants, setParticipants] = useState([]);
    const [notifications, setNotifications] = useState([]);

    // Filter & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('recent'); // recent, oldest, popular

    // Modals State
    const [isCreateThreadOpen, setIsCreateThreadOpen] = useState(false);
    const [isEditForumOpen, setIsEditForumOpen] = useState(false);
    const [isAnnouncingOpen, setIsAnnouncingOpen] = useState(false);
    const [selectedThread, setSelectedThread] = useState(null);
    const [isEditThreadOpen, setIsEditThreadOpen] = useState(false);

    // Forms State
    const [threadForm, setThreadForm] = useState({ title: '', content: '' });
    const [forumForm, setForumForm] = useState({ title: '', description: '' });
    const [announcementText, setAnnouncementText] = useState('');
    const [formMessage, setFormMessage] = useState({ type: '', text: '' });

    // --- EFFECTS & DATA FETCHING ---

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    const fetchAllData = useCallback(async () => {
        if (!token || !courseId) return;

        setIsLoading(true);
        setError(null);
        try {
            // 1. Fetch forum details
            const forumData = await apiGetForumByCourseId(courseId, token);
            setForum(forumData);
            
            if (forumData?.id) {
                // 2. Fetch threads
                const threadsData = await apiGetThreadsByForum(forumData.id, token);
                setThreads(threadsData);
                
                // 3. Fetch participants
                const participantsData = await apiGetForumParticipants(forumData.id, token);
                setParticipants(participantsData);
            }

            // 4. Fetch notifications (user-specific)
            const notificationsData = await apiGetNotifications(token);
            setNotifications(notificationsData);

            // 5. Initialize forum form with current data
            if (forumData) {
                setForumForm({ title: forumData.title || '', description: forumData.description || '' });
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setIsLoading(false);
        }
    }, [token, courseId]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    // --- HANDLERS ---

    const handleCreateThread = async (e) => {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });

        if (!threadForm.title.trim() || !threadForm.content.trim()) {
            setFormMessage({ type: 'error', text: 'Title and content are required.' });
            return;
        }

        try {
            await apiCreateThread(forum.id, threadForm, token);
            setFormMessage({ type: 'success', text: 'Thread created successfully!' });
            setThreadForm({ title: '', content: '' });
            setIsCreateThreadOpen(false);
            await fetchAllData(); // Refresh data
        } catch (err) {
            setFormMessage({ type: 'error', text: err.response?.data?.message || err.message });
        }
    };

    const handleUpdateForum = async (e) => {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });

        try {
            await apiUpdateForum(forum.id, forumForm, token);
            setFormMessage({ type: 'success', text: 'Forum updated successfully!' });
            setIsEditForumOpen(false);
            await fetchAllData(); // Refresh forum title/description
        } catch (err) {
            setFormMessage({ type: 'error', text: err.response?.data?.message || err.message });
        }
    };

    const handleDeleteForum = async () => {
        if (!window.confirm('Are you sure you want to delete this entire forum? This action cannot be undone.')) {
            return;
        }

        try {
            await apiDeleteForum(forum.id, token);
            setFormMessage({ type: 'success', text: 'Forum deleted successfully!' });
            // Redirect after successful deletion
            navigate(`/teacher/courses/${courseId}`);
        } catch (err) {
            setFormMessage({ type: 'error', text: err.response?.data?.message || err.message });
        }
    };

    const handleDeleteThread = async (threadId) => {
        if (!window.confirm('Are you sure you want to delete this thread? This action cannot be undone.')) {
            return;
        }

        try {
            // Teacher/Admin uses the moderation endpoint
            await apiDeleteAnyThread(threadId, token); 
            setFormMessage({ type: 'success', text: 'Thread deleted successfully (Moderation).' });
            await fetchAllData(); // Refresh threads list
        } catch (err) {
            setFormMessage({ type: 'error', text: err.response?.data?.message || err.message });
        }
    };

    const handleUpdateThread = async (e) => {
        e.preventDefault();
        if (!selectedThread) return;

        try {
            await apiUpdateThread(selectedThread.id, threadForm, token);
            setFormMessage({ type: 'success', text: 'Thread updated successfully!' });
            setIsEditThreadOpen(false);
            setSelectedThread(null);
            await fetchAllData(); // Refresh threads list
        } catch (err) {
            setFormMessage({ type: 'error', text: err.response?.data?.message || err.message });
        }
    };

    const handleSendAnnouncement = async (e) => {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });

        if (!announcementText.trim()) {
            setFormMessage({ type: 'error', text: 'Announcement message cannot be empty.' });
            return;
        }

        try {
            const result = await apiSendAnnouncement(courseId, announcementText, token);
            setFormMessage({ type: 'success', text: result.message });
            setAnnouncementText('');
            setIsAnnouncingOpen(false);
        } catch (err) {
            setFormMessage({ type: 'error', text: err.response?.data?.message || err.message });
        }
    };

    const handleMarkNotificationRead = async (notificationId) => {
        try {
            await apiMarkNotificationAsRead(notificationId, token);
            setNotifications(prev => prev.map(n => 
                n.id === notificationId ? { ...n, isRead: true } : n
            ));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const openEditThread = (thread) => {
        setSelectedThread(thread);
        setThreadForm({ title: thread.title, content: thread.content });
        setIsEditThreadOpen(true);
    };

    // --- FILTERING & SORTING ---
    const filteredAndSortedThreads = threads
        .filter(thread => 
            thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            thread.content?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            switch (sortBy) {
                case 'recent':
                    return new Date(b.updatedAt) - new Date(a.updatedAt);
                case 'oldest':
                    return new Date(a.updatedAt) - new Date(b.updatedAt);
                case 'popular':
                    // Note: thread.Likes is an array of Like objects from Sequelize include
                    return (b.Likes?.length || 0) - (a.Likes?.length || 0);
                default:
                    return 0;
            }
        });

    // --- UI COMPONENTS (MODALS & TABS) ---

    // [All UI Components: ForumManagementSection, EditForumModal, AnnouncementModal, 
    // CreateThreadModal, EditThreadModal, ThreadsTab, ParticipantsTab, NotificationsTab] 
    // ... remain as provided in the original file ...

    const ForumManagementSection = () => (
        <div className="widget-card" style={{ marginBottom: '20px', borderLeft: '5px solid var(--neon-green)' }}>
            <h3><FaEdit /> Forum Management</h3>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                <button onClick={() => setIsEditForumOpen(true)} className="btn-primary-neon">
                    <FaEdit /> Edit Forum Settings
                </button>
                <button onClick={handleDeleteForum} className="btn-icon-danger-neon">
                    <FaTrash /> Delete Forum
                </button>
                <button onClick={() => setIsAnnouncingOpen(true)} className="btn-primary-neon">
                    <FaBullhorn /> Send Announcement
                </button>
            </div>

            {forum && (
                <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(0, 255, 255, 0.1)', borderRadius: '8px' }}>
                    <h4>{forum.title}</h4>
                    <p style={{ color: 'var(--text-faded)' }}>{forum.description}</p>
                    <p style={{ fontSize: '0.85em', marginTop: '10px' }}>
                        Created by: {forum.Creator?.name} ({forum.Creator?.role})
                    </p>
                </div>
            )}
        </div>
    );

    const EditForumModal = () => (
        isEditForumOpen && (
            <div className="modal-overlay-neon" onClick={() => setIsEditForumOpen(false)}>
                <div className="modal-content-neon" onClick={(e) => e.stopPropagation()}>
                    <h3><FaEdit /> Edit Forum Settings</h3>
                    <form onSubmit={handleUpdateForum}>
                        <div className="form-group-neon">
                            <label>Forum Title</label>
                            <input
                                type="text"
                                value={forumForm.title}
                                onChange={(e) => setForumForm({ ...forumForm, title: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group-neon">
                            <label>Description</label>
                            <textarea
                                value={forumForm.description}
                                onChange={(e) => setForumForm({ ...forumForm, description: e.target.value })}
                                rows="4"
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button type="button" onClick={() => setIsEditForumOpen(false)} className="btn-secondary-neon">
                                <FaTimes /> Cancel
                            </button>
                            <button type="submit" className="btn-primary-neon">
                                <FaSave /> Update Forum
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    );

    const AnnouncementModal = () => (
        isAnnouncingOpen && (
            <div className="modal-overlay-neon" onClick={() => setIsAnnouncingOpen(false)}>
                <div className="modal-content-neon" onClick={(e) => e.stopPropagation()}>
                    <h3><FaBullhorn /> Send Course Announcement</h3>
                    <form onSubmit={handleSendAnnouncement}>
                        <div className="form-group-neon">
                            <label>Announcement Message</label>
                            <textarea
                                value={announcementText}
                                onChange={(e) => setAnnouncementText(e.target.value)}
                                placeholder="Type your announcement to all enrolled students..."
                                rows="5"
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button type="button" onClick={() => setIsAnnouncingOpen(false)} className="btn-secondary-neon">
                                <FaTimes /> Cancel
                            </button>
                            <button type="submit" className="btn-primary-neon">
                                <FaBullhorn /> Send to All Students
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    );

    const CreateThreadModal = () => (
        isCreateThreadOpen && (
            <div className="modal-overlay-neon" onClick={() => setIsCreateThreadOpen(false)}>
                <div className="modal-content-neon" onClick={(e) => e.stopPropagation()}>
                    <h3><FaPlusCircle /> Create New Thread</h3>
                    <form onSubmit={handleCreateThread}>
                        <div className="form-group-neon">
                            <label>Thread Title</label>
                            <input
                                type="text"
                                value={threadForm.title}
                                onChange={(e) => setThreadForm({ ...threadForm, title: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group-neon">
                            <label>Content</label>
                            <textarea
                                value={threadForm.content}
                                onChange={(e) => setThreadForm({ ...threadForm, content: e.target.value })}
                                rows="6"
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button type="button" onClick={() => setIsCreateThreadOpen(false)} className="btn-secondary-neon">
                                <FaTimes /> Cancel
                            </button>
                            <button type="submit" className="btn-primary-neon">
                                <FaSave /> Post Thread
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    );

    const EditThreadModal = () => (
        isEditThreadOpen && selectedThread && (
            <div className="modal-overlay-neon" onClick={() => setIsEditThreadOpen(false)}>
                <div className="modal-content-neon" onClick={(e) => e.stopPropagation()}>
                    <h3><FaEdit /> Edit Thread</h3>
                    <form onSubmit={handleUpdateThread}>
                        <div className="form-group-neon">
                            <label>Thread Title</label>
                            <input
                                type="text"
                                value={threadForm.title}
                                onChange={(e) => setThreadForm({ ...threadForm, title: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group-neon">
                            <label>Content</label>
                            <textarea
                                value={threadForm.content}
                                onChange={(e) => setThreadForm({ ...threadForm, content: e.target.value })}
                                rows="6"
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button type="button" onClick={() => setIsEditThreadOpen(false)} className="btn-secondary-neon">
                                <FaTimes /> Cancel
                            </button>
                            <button type="submit" className="btn-primary-neon">
                                <FaSave /> Update Thread
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    );

    const ThreadsTab = () => (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div className="form-group-neon" style={{ margin: 0 }}>
                        <input
                            type="text"
                            placeholder="Search threads..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '250px' }}
                        />
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="form-control-neon"
                    >
                        <option value="recent">Most Recent</option>
                        <option value="oldest">Oldest First</option>
                        <option value="popular">Most Popular</option>
                    </select>
                </div>
                <button onClick={() => setIsCreateThreadOpen(true)} className="btn-primary-neon">
                    <FaPlusCircle /> New Thread
                </button>
            </div>

            {filteredAndSortedThreads.length > 0 ? (
                filteredAndSortedThreads.map(thread => {
                    const isOwner = thread.Creator?.id === currentUserId;
                    // Teacher/Admin can edit their own or delete any
                    const canEdit = isOwner; 
                    const canDelete = role === 'Teacher' || role === 'Admin';

                    return (
                        <div key={thread.id} className="widget-card" style={{ marginBottom: '15px', borderLeft: '5px solid var(--neon-blue)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <h4>
                                        <Link to={`/threads/${thread.id}`} className="neon-link">
                                            {thread.title}
                                        </Link>
                                    </h4>
                                    <p style={{ fontSize: '0.85em', color: 'var(--text-faded)', marginTop: '5px' }}>
                                        By {thread.Creator?.name} ({thread.Creator?.role}) • {new Date(thread.updatedAt).toLocaleString()}
                                    </p>
                                    <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontSize: '0.9em' }}>
                                        <span style={{ color: 'var(--neon-pink)' }}>
                                            <FaHeart /> {thread.Likes?.length || 0} Likes
                                        </span>
                                        <span style={{ color: 'var(--neon-green)' }}>
                                            <FaComment /> {thread.Posts?.length || 0} Replies
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {canEdit && (
                                        <button onClick={() => openEditThread(thread)} className="btn-secondary-neon btn-small">
                                            <FaEdit /> Edit
                                        </button>
                                    )}
                                    <Link to={`/student/threads/${thread.id}`} className="btn-secondary-neon btn-small">
                                        <FaEye /> View
                                    </Link>
                                    {canDelete && (
                                        <button onClick={() => handleDeleteThread(thread.id)} className="btn-icon-danger-neon btn-small">
                                            <FaTrash /> Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="message-box info-neon">
                    No threads found. {searchTerm && 'Try adjusting your search.'}
                </div>
            )}
        </div>
    );

    const ParticipantsTab = () => (
        <div>
            <h3><FaUsers /> Forum Participants ({participants.length})</h3>
            {participants.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px', marginTop: '20px' }}>
                    {participants.map(participant => (
                        <div key={participant.id} className="widget-card" style={{ padding: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FaUserCircle size={40} style={{ color: 'var(--neon-blue)' }} />
                                <div>
                                    <h5 style={{ margin: 0 }}>{participant.User?.name}</h5>
                                    <p style={{ margin: 0, fontSize: '0.85em', color: 'var(--text-faded)' }}>
                                        {participant.User?.role} • {participant.role}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="message-box info-neon">No participants yet.</div>
            )}
        </div>
    );

    const NotificationsTab = () => (
        <div>
            <h3><FaBell /> Notifications ({notifications.filter(n => !n.isRead).length} unread)</h3>
            {notifications.length > 0 ? (
                <div style={{ marginTop: '20px' }}>
                    {notifications.map(notification => (
                        <div 
                            key={notification.id} 
                            className="widget-card" 
                            style={{ 
                                marginBottom: '10px', 
                                padding: '15px',
                                opacity: notification.isRead ? 0.6 : 1,
                                borderLeft: `5px solid ${notification.isRead ? 'var(--text-faded)' : 'var(--neon-green)'}`
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <p style={{ margin: 0 }}>{notification.message}</p>
                                    <p style={{ fontSize: '0.8em', color: 'var(--text-faded)', marginTop: '5px' }}>
                                        {new Date(notification.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                {!notification.isRead && (
                                    <button 
                                        onClick={() => handleMarkNotificationRead(notification.id)}
                                        className="btn-secondary-neon btn-small"
                                    >
                                        <FaCheckCircle /> Mark Read
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="message-box info-neon">No notifications.</div>
            )}
        </div>
    );

    // --- MAIN RENDER ---
    const mainContentClass = `main-content-area ${!isSidebarOpen ? 'sidebar-closed-content' : ''}`;

    if (!isAuthenticated) return null;

    return (
        <div className="app-container">
            <nav className="dashboard-navbar-neon">
                <button className="sidebar-toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    {isSidebarOpen ? <FaTimes /> : <FaBars />}
                </button>
                <div className="logo"><FaUniversity className="logo-icon"/> The Matrix Academy</div>
                <div className="nav-profile-group">
                    <span className="student-name">
                        <FaUserCircle /> <strong>{currentUserName}</strong> ({role})
                    </span>
                    <button className="btn-logout-neon" onClick={logout}>
                        <FaSignOutAlt /> Logout
                    </button>
                </div>
            </nav>

            <aside className={`dashboard-sidebar-neon ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
                <div className="sidebar-header">TEACHER MENU</div>
                <nav className="sidebar-nav">
                    <Link to="/teacher" className="nav-link">
                        <FaComments /> <span className="link-text">Dashboard</span>
                    </Link>
                    <Link to="/teacher/courses" className="nav-link">
                        <FaChalkboardTeacher /> <span className="link-text">My Courses</span>
                    </Link>
                    <Link to={`/teacher/courses/${courseId}`} className="nav-link">
                        <FaChalkboardTeacher /> <span className="link-text">Course Details</span>
                    </Link>
                    <Link to="/teacher/grading" className="nav-link">
                        <FaComments /> <span className="link-text">Grading Center</span>
                    </Link>
                    <Link to="/teacher/profile" className="nav-link">
                        <FaUserCircle /> <span className="link-text">Profile</span>
                    </Link>
                </nav>
            </aside>

            <main className={mainContentClass}>
                <div className="dashboard-section">
                    <h1 className="form-title-neon section-title-neon">
                        <FaComments /> {forum?.title || 'Discussion Forum'}
                    </h1>

                    <Link to={`/teacher/course/${courseId}/details`} className="btn-secondary-neon back-link" style={{marginBottom: '20px'}}>
                        <FaChevronLeft /> Back to Course Details
                    </Link>

                    {/* Message Display */}
                    {formMessage.text && (
                        <div className={`message-box ${formMessage.type === 'error' ? 'error-neon' : 'success-neon'}`}>
                            {formMessage.type === 'error' ? <FaExclamationTriangle /> : <FaInfoCircle />} {formMessage.text}
                        </div>
                    )}

                    {/* Loading/Error States */}
                    {isLoading && (
                        <div className="message-box success-neon">
                            <FaSpinner className="spinner" /> Loading forum data...
                        </div>
                    )}
                    
                    {error && (
                        <div className="message-box error-neon">
                            <FaExclamationTriangle /> Error: {error}
                        </div>
                    )}

                    {/* Main Content */}
                    {!isLoading && forum && (
                        <>
                            {/* Teacher/Admin Management Section */}
                            <ForumManagementSection />

                            {/* Tab Navigation */}
                            <div className="widget-card" style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', gap: '15px', borderBottom: '2px solid var(--neon-blue)', paddingBottom: '10px' }}>
                                    <button
                                        onClick={() => setActiveTab('threads')}
                                        className={activeTab === 'threads' ? 'tab-button-active' : 'tab-button'}
                                        style={{
                                            background: activeTab === 'threads' ? 'var(--neon-blue)' : 'transparent',
                                            color: activeTab === 'threads' ? '#000' : 'var(--neon-blue)',
                                            border: 'none',
                                            padding: '10px 20px',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <FaComments /> Threads ({threads.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('participants')}
                                        className={activeTab === 'participants' ? 'tab-button-active' : 'tab-button'}
                                        style={{
                                            background: activeTab === 'participants' ? 'var(--neon-green)' : 'transparent',
                                            color: activeTab === 'participants' ? '#000' : 'var(--neon-green)',
                                            border: 'none',
                                            padding: '10px 20px',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <FaUsers /> Participants ({participants.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('notifications')}
                                        className={activeTab === 'notifications' ? 'tab-button-active' : 'tab-button'}
                                        style={{
                                            background: activeTab === 'notifications' ? 'var(--neon-pink)' : 'transparent',
                                            color: activeTab === 'notifications' ? '#000' : 'var(--neon-pink)',
                                            border: 'none',
                                            padding: '10px 20px',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            transition: 'all 0.3s ease',
                                            position: 'relative'
                                        }}
                                    >
                                        <FaBell /> Notifications 
                                        {notifications.filter(n => !n.isRead).length > 0 && (
                                            <span style={{
                                                position: 'absolute',
                                                top: '-5px',
                                                right: '-5px',
                                                background: 'red',
                                                color: 'white',
                                                borderRadius: '50%',
                                                padding: '2px 6px',
                                                fontSize: '0.7em'
                                            }}>
                                                {notifications.filter(n => !n.isRead).length}
                                            </span>
                                        )}
                                    </button>
                                </div>

                                {/* Tab Content */}
                                <div style={{ marginTop: '20px' }}>
                                    {activeTab === 'threads' && <ThreadsTab />}
                                    {activeTab === 'participants' && <ParticipantsTab />}
                                    {activeTab === 'notifications' && <NotificationsTab />}
                                </div>
                            </div>
                        </>
                    )}

                    {!isLoading && !forum && (
                        <div className="message-box error-neon">
                            <FaExclamationTriangle /> Forum not found for this course.
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            <EditForumModal />
            <AnnouncementModal />
            <CreateThreadModal />
            <EditThreadModal />

            {/* CSS Styles for Modals (Inlined for completeness, though should be external) */}
            <style>{`
                .modal-overlay-neon {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    animation: fadeIn 0.3s ease;
                }

                .modal-content-neon {
                    background: var(--card-bg, #1a1a1a);
                    border: 2px solid var(--neon-blue);
                    border-radius: 10px;
                    padding: 30px;
                    max-width: 600px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 0 30px var(--neon-blue);
                    animation: slideUp 0.3s ease;
                }

                .modal-content-neon h3 {
                    color: var(--neon-blue);
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from { 
                        transform: translateY(50px);
                        opacity: 0;
                    }
                    to { 
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                .spinner {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .form-control-neon {
                    background: rgba(0, 255, 255, 0.1);
                    border: 1px solid var(--neon-blue);
                    color: var(--text-color, #fff);
                    padding: 8px 12px;
                    border-radius: 5px;
                    outline: none;
                    transition: all 0.3s ease;
                }

                .form-control-neon:focus {
                    border-color: var(--neon-green);
                    box-shadow: 0 0 10px var(--neon-green);
                }

                .btn-small {
                    padding: 5px 10px;
                    font-size: 0.85em;
                }

                .back-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    text-decoration: none;
                }

                .neon-link {
                    color: var(--neon-blue);
                    text-decoration: none;
                    transition: all 0.3s ease;
                }

                .neon-link:hover {
                    color: var(--neon-green);
                    text-shadow: 0 0 10px var(--neon-green);
                }

                .message-box {
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    animation: slideDown 0.3s ease;
                }

                .success-neon {
                    background: rgba(0, 255, 0, 0.1);
                    border: 1px solid var(--neon-green);
                    color: var(--neon-green);
                }

                .error-neon {
                    background: rgba(255, 0, 0, 0.1);
                    border: 1px solid #ff0000;
                    color: #ff6b6b;
                }

                .info-neon {
                    background: rgba(0, 255, 255, 0.1);
                    border: 1px solid var(--neon-blue);
                    color: var(--neon-blue);
                }

                @keyframes slideDown {
                    from {
                        transform: translateY(-20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                .widget-card {
                    background: var(--card-bg, #1a1a1a);
                    border: 1px solid var(--neon-blue);
                    border-radius: 10px;
                    padding: 20px;
                    transition: all 0.3s ease;
                }

                .widget-card:hover {
                    box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
                }

                .required-star {
                    color: var(--neon-pink);
                }
            `}</style>
        </div>
    );
};

export default EnhancedTeacherForum;