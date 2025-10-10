// StudentThreadDetailView.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    FaArrowLeft, FaComments, FaClock, FaHeart, FaReply, 
    FaEdit, FaTrash, FaSpinner, FaUserCircle, FaTimes,
    FaUniversity, FaBookOpen, FaSignOutAlt, FaBars, FaListAlt, FaStar 
} from 'react-icons/fa';
import { useAuth } from "../../context/AuthContext";
// NOTE: Assuming this file exists and contains the necessary 'neon' styles
import './StudentDashboard.css'; 

// --- Configuration ---
const API_BASE_URL = 'http://localhost:3000/api';

// --- API Service Functions (Provided in prompt) ---
const forumAPI = {
    // Shared Viewing APIs
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
    // Post Management APIs (Required for this view)
    createPost: async (threadId, data, token) => {
        const response = await fetch(`${API_BASE_URL}/threads/${threadId}/posts`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) { const error = await response.json(); throw new Error(error.message || 'Failed to create post'); }
        return response.json();
    },
    updatePost: async (postId, data, token) => { 
        const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) { const error = await response.json(); throw new Error(error.message || 'Failed to update post'); }
        return response.json();
    },
    deletePost: async (postId, token) => { 
        const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) { const error = await response.json(); throw new Error(error.message || 'Failed to delete post'); }
        return response.json();
    },
    // Like System APIs
    toggleThreadLike: async (threadId, token) => {
        const response = await fetch(`${API_BASE_URL}/threads/${threadId}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) { const error = await response.json(); throw new Error(error.message || 'Failed to toggle thread like'); }
        return response.json();
    },
    togglePostLike: async (postId, token) => { 
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) { const error = await response.json(); throw new Error(error.message || 'Failed to toggle post like'); }
        return response.json();
    },
};

// ---------------------------------------------------------------------
// --- REUSED NAVIGATION COMPONENTS (To match StudentDashboard structure) ---
// ---------------------------------------------------------------------

// Placeholder for Profile Modal
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
// --- Post Card Component (Reply View) ---
// ---------------------------------------------------------------------

const PostCard = ({ post, onLike, onDelete, onEdit, currentUserId }) => {
    const postTime = new Date(post.createdAt).toLocaleString();
    // Use optional chaining just in case the backend doesn't return Likes property for an empty array
    const likeCount = post.Likes?.length || 0; 
    const isOwner = post.userId === currentUserId;
    const userHasLiked = post.Likes?.some(like => like.userId === currentUserId);
    
    return (
        <div className="widget-card post-card-neon" style={{ borderLeft: '3px solid #0ff', padding: '15px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaUserCircle size={20} style={{ color: '#0ff' }} />
                    <strong style={{ color: '#fff' }}>{post.Creator?.name || 'Unknown User'}</strong>
                    <small style={{ color: '#aaa' }}>({post.Creator?.role || 'N/A'})</small>
                </div>
                <small style={{ color: '#888' }}><FaClock /> {postTime}</small>
            </div>
            
            <p style={{ color: '#ccc', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{post.content}</p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                {/* Toggle Post Like */}
                <button 
                    className="btn-link-neon"
                    onClick={() => onLike(post.id)}
                    style={{ color: userHasLiked ? '#ff0066' : '#aaa' }}
                    title={userHasLiked ? "Unlike Post" : "Like Post"}
                >
                    <FaHeart /> {likeCount}
                </button>
                
                {/* Post Actions (Only for owner) */}
                {isOwner && (
                    <>
                        <button 
                            className="btn-link-neon"
                            onClick={() => onEdit(post)}
                            title="Edit Post"
                        >
                            <FaEdit /> Edit
                        </button>
                        <button 
                            className="btn-link-neon"
                            onClick={() => onDelete(post.id)}
                            style={{ color: 'red' }}
                            title="Delete Post"
                        >
                            <FaTrash /> Delete
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};


// ---------------------------------------------------------------------
// --- MAIN COMPONENT: StudentThreadDetailView ---
// ---------------------------------------------------------------------
const StudentThreadDetailView = () => {
    const { threadId } = useParams();
    const auth = useAuth();
    const navigate = useNavigate();
    const { token, user, logout } = auth;
    const currentUserId = user?.id;
    const studentName = user?.name || 'Student';

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    
    const [thread, setThread] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [isReplying, setIsReplying] = useState(false);
    
    // State for Editing Posts (updatePost)
    const [editingPost, setEditingPost] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const toggleProfile = () => setIsProfileOpen(prev => !prev);
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // --- Fetch Thread and Posts (getThreadWithPosts) ---
    const fetchThreadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await forumAPI.getThreadWithPosts(threadId, token);
            // Ensure data structure matches expected model (e.g., if data is nested)
            setThread(data.data || data); 
        } catch (err) {
            console.error("Thread detail fetch error:", err);
            setError(err.message || 'Failed to load thread details.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        fetchThreadData();
    }, [threadId, token, navigate]);

    // --- Thread Like Handler (toggleThreadLike) ---
    const handleLikeThread = async () => {
        try {
            await forumAPI.toggleThreadLike(threadId, token);
            await fetchThreadData(); // Refresh data
        } catch (err) {
            alert(err.message || "Failed to toggle thread like.");
        }
    };

    // --- Create Post Handler (createPost) ---
    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) {
            alert('Reply content cannot be empty.');
            return;
        }

        setIsReplying(true);
        try {
            await forumAPI.createPost(threadId, { content: replyContent }, token);
            setReplyContent('');
            await fetchThreadData(); // Refresh data to show new post
        } catch (err) {
            console.error("Error creating post:", err);
            alert(err.message || 'Failed to create reply.');
        } finally {
            setIsReplying(false);
        }
    };

    // --- Post Like Handler (togglePostLike) ---
    const handleLikePost = async (postId) => {
        try {
            await forumAPI.togglePostLike(postId, token);
            await fetchThreadData(); // Refresh data
        } catch (err) {
            alert(err.message || "Failed to toggle post like.");
        }
    };

    // --- Post Edit Handler (updatePost) ---
    const handleEditPost = (post) => {
        setEditingPost({ ...post });
        setShowEditModal(true);
    };

    const savePostEdit = async () => {
        if (!editingPost || !editingPost.content.trim()) {
            alert("Post content is required!");
            return;
        }
        
        try {
            await forumAPI.updatePost(editingPost.id, { content: editingPost.content }, token);
            await fetchThreadData();
            setShowEditModal(false);
            setEditingPost(null);
        } catch (err) {
            console.error("Failed to update post:", err);
            alert(err.message || "Failed to update post.");
        }
    };
    
    // --- Post Delete Handler (deletePost) ---
    const handleDeletePost = async (postId) => {
        if (!window.confirm("Are you sure you want to delete this reply?")) return;
        try {
            await forumAPI.deletePost(postId, token);
            await fetchThreadData(); // Refresh data
        } catch (err) {
            console.error("Failed to delete post:", err);
            alert(err.message || "Failed to delete post. You may not have permission.");
        }
    };

    if (isLoading) return <div className="loading-state"><FaSpinner className="spinner" /> <p>Loading thread...</p></div>;
    if (error || !thread) return <div className="error-state"><p>Error: {error || 'Thread not found.'}</p><Link to="/student/my-courses" className="btn-action-neon">Back to Courses</Link></div>;

    const threadLikeCount = thread.Likes?.length || 0;
    const userHasLikedThread = thread.Likes?.some(like => like.userId === currentUserId);
    
    // Determine the forum ID to navigate back to the thread list
    // Assumes the thread object contains 'forumId' for the specific forum view
    const backLink = thread.forumId ? `/student/forums/${thread.forumId}` : `/student/my-courses`;
    const mainContentClass = `main-content-area ${!isSidebarOpen ? 'sidebar-closed-content' : ''}`;


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
                <main className={mainContentClass}>
                    <div style={{ padding: '20px' }}>
                        
                        {/* Link back to the thread list (StudentForumView) */}
                        <Link to={backLink} className="btn-action-neon" style={{ marginBottom: '20px' }}>
                            <FaArrowLeft /> Back to Threads List
                        </Link>

                        {/* Edit Post Modal (updatePost UI) */}
                        {showEditModal && editingPost && (
                            <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
                                    background: '#1a1a2e', border: '2px solid #0ff', borderRadius: '10px', 
                                    padding: '20px', maxWidth: '600px', width: '90%'
                                }}>
                                    <button className="modal-close-btn" onClick={() => setShowEditModal(false)}><FaTimes /></button>
                                    <h2 style={{ color: '#0ff', marginBottom: '20px' }}>Edit Reply</h2>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', color: '#0ff' }}>Post Content</label>
                                        <textarea
                                            value={editingPost.content}
                                            onChange={(e) => setEditingPost(prev => ({ ...prev, content: e.target.value }))}
                                            rows={6}
                                            className="textarea-neon full-width-input"
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={savePostEdit} className="btn-primary-neon" style={{ flex: 1 }}>
                                            Save Changes
                                        </button>
                                        <button onClick={() => { setShowEditModal(false); setEditingPost(null); }} className="btn-secondary-neon" style={{ flex: 1 }}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Thread Header (Main Content) */}
                        <div className="widget-card thread-card-neon" style={{ marginBottom: '20px' }}>
                            <h1 className="section-title-neon" style={{ marginBottom: '10px' }}>{thread.title}</h1>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <p style={{ color: '#aaa', fontSize: '14px' }}>
                                    Started by: <strong>{thread.Creator?.name || 'Unknown'}</strong> ({thread.Creator?.role || 'N/A'})
                                </p>
                                <small style={{ color: '#888' }}><FaClock /> {new Date(thread.createdAt).toLocaleString()}</small>
                            </div>
                            <p style={{ color: '#fff', fontSize: '16px', lineHeight: '1.6', paddingBottom: '15px', borderBottom: '1px solid #333', whiteSpace: 'pre-wrap' }}>
                                {thread.content}
                            </p>
                            {/* Thread Like Button (toggleThreadLike) */}
                            <div style={{ marginTop: '15px' }}>
                                <button 
                                    className="btn-action-neon"
                                    onClick={handleLikeThread}
                                    style={{ backgroundColor: userHasLikedThread ? '#ff0066' : 'transparent', color: userHasLikedThread ? '#fff' : '#0ff', border: userHasLikedThread ? 'none' : '1px solid #0ff' }}
                                >
                                    <FaHeart /> {threadLikeCount} {userHasLikedThread ? 'Unlike' : 'Like'} Thread
                                </button>
                            </div>
                        </div>

                        {/* Posts/Replies Section (View Posts) */}
                        <h2 className="section-title-neon" style={{ borderLeft: '5px solid #0ff', paddingLeft: '10px', marginBottom: '15px' }}>
                            <FaComments /> Replies ({thread.Posts?.length || 0})
                        </h2>
                        
                        {thread.Posts && thread.Posts.map(post => (
                            <PostCard 
                                key={post.id} 
                                post={post} 
                                onLike={handleLikePost} // togglePostLike
                                onDelete={handleDeletePost} // deletePost
                                onEdit={handleEditPost} // updatePost handler
                                currentUserId={currentUserId}
                            />
                        ))}
                        
                        {/* No Replies Yet */}
                        {thread.Posts?.length === 0 && (
                            <div className="widget-card widget-empty-state">
                                <p>Be the first to reply!</p>
                            </div>
                        )}

                        {/* Reply Form (createPost) */}
                        <div className="widget-card thread-card-neon" style={{ marginTop: '30px' }}>
                            <h3 style={{ color: '#0ff', marginBottom: '15px' }}>Leave a Reply</h3>
                            <form onSubmit={handleCreatePost}>
                                <textarea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    rows={5}
                                    className="textarea-neon full-width-input"
                                    placeholder="Write your reply here..."
                                    disabled={isReplying}
                                />
                                <button 
                                    type="submit" 
                                    className="btn-primary-neon" 
                                    style={{ marginTop: '10px' }}
                                    disabled={isReplying}
                                >
                                    {isReplying ? (
                                        <>
                                            <FaSpinner className="spinner" /> Posting...
                                        </>
                                    ) : (
                                        <>
                                            <FaReply /> Post Reply
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
};

export default StudentThreadDetailView;