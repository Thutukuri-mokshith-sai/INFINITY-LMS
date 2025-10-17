import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    FaUserCircle, FaSignOutAlt, FaBookOpen, FaClipboardList, 
    FaCheckCircle, FaStar, FaListAlt, FaCalendarAlt, FaUniversity, 
    FaArrowRight, FaClock, FaBars, FaTimes, FaEnvelope, FaToolbox, 
    FaIdCard, FaFileAlt, FaCommentDots, FaBell, FaRobot,
    FaMicrophone, FaStopCircle, FaPaperPlane, FaVolumeUp, FaVolumeMute
} from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import './StudentDashboard.css'; 
import { useAuth } from "../../context/AuthContext"; 
import axios from 'axios'; 

// --- API Configuration ---
const API_URL = process.env.REACT_APP_API_URL || 'https://lms-backend-foaq.onrender.com/api'; 
const CHAT_API_URL = "https://ecokisan-disease.onrender.com/chat";

// ----------------------------------------------------------------------
// --- Chatbot Modal Component (Integrated) ---
// ----------------------------------------------------------------------
const ChatbotModal = ({ onClose }) => {
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [recognition, setRecognition] = useState(null);
    const chatHistoryRef = useRef(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition();
            
            recognitionInstance.continuous = true;
            recognitionInstance.interimResults = true;
            recognitionInstance.lang = 'en-US';

            recognitionInstance.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    }
                }
                setUserInput(prev => prev + finalTranscript);
            };

            recognitionInstance.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognitionInstance.onend = () => {
                setIsListening(false);
            };

            setRecognition(recognitionInstance);
        }
    }, []);

    const startListening = () => {
        if (recognition && !isListening) {
            recognition.start();
            setIsListening(true);
        }
    };

    const stopListening = () => {
        if (recognition && isListening) {
            recognition.stop();
            setIsListening(false);
        }
    };

    const speak = (text, lang = 'en-US') => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            
            setIsSpeaking(true);
            
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            
            window.speechSynthesis.speak(utterance);
        }
    };

    const stopSpeaking = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };

    useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = useCallback(async () => {
        const trimmedPrompt = userInput.trim();
        if (!trimmedPrompt) return;

        stopSpeaking();

        const newUserMessage = { id: Date.now(), text: trimmedPrompt, sender: 'user' };
        setMessages(prev => [...prev, newUserMessage]);
        setUserInput('');

        const thinkingId = Date.now() + 1;
        const thinkingMessage = { id: thinkingId, text: 'Thinking...', sender: 'ai', loading: true };
        setMessages(prev => [...prev, thinkingMessage]);

        try {
            const response = await fetch(CHAT_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    prompt: trimmedPrompt, 
                    model: 'openai/gpt-oss-20b', 
                    lang: 'en' 
                }),
            });

            if (!response.ok) {
                throw new Error(`AI server error ${response.status}`);
            }

            const aiData = await response.json();
            const aiResponseText = aiData.response || 'No response generated.';

            setMessages(prev => {
                const newMessages = prev.filter(m => m.id !== thinkingId);
                const aiMessage = { 
                    id: Date.now() + 2, 
                    text: aiResponseText, 
                    sender: 'ai', 
                    loading: false 
                };
                return [...newMessages, aiMessage];
            });

            speak(aiResponseText, 'en-US');

        } catch (err) {
            console.error('Prediction failed:', err);
            const errorMessage = 'Request failed. Check your network and backend.';
            setMessages(prev => {
                const newMessages = prev.filter(m => m.id !== thinkingId);
                const errorMsg = { 
                    id: Date.now() + 2, 
                    text: errorMessage, 
                    sender: 'ai', 
                    loading: false 
                };
                return [...newMessages, errorMsg];
            });
            speak(errorMessage, 'en-US');
        }
    }, [userInput]);
    
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    useEffect(() => {
        return () => {
            stopSpeaking();
            if (recognition) {
                recognition.stop();
            }
        };
    }, [recognition]);

    const chatbotStyles = {
        modalBackdrop: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(5px)'
        },
        chatContainer: {
            width: '90%',
            maxWidth: '800px',
            height: '80vh',
            backgroundColor: '#1a1a2e',
            borderRadius: '15px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 0 30px rgba(0, 240, 255, 0.5)',
            border: '2px solid #00F0FF'
        },
        chatHeader: {
            padding: '20px',
            backgroundColor: '#16213e',
            borderTopLeftRadius: '15px',
            borderTopRightRadius: '15px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid #00F0FF'
        },
        headerText: {
            color: '#00F0FF',
            fontSize: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            margin: 0,
            textShadow: '0 0 10px rgba(0, 240, 255, 0.7)'
        },
        closeBtn: {
            background: 'transparent',
            border: '2px solid #ff6b6b',
            color: '#ff6b6b',
            padding: '10px 15px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1.2rem',
            transition: 'all 0.3s ease',
            boxShadow: '0 0 10px rgba(255, 107, 107, 0.3)'
        },
        chatHistory: {
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            backgroundColor: '#0f0f1e',
            scrollBehavior: 'smooth'
        },
        message: {
            marginBottom: '15px',
            padding: '12px 16px',
            borderRadius: '10px',
            maxWidth: '80%',
            wordWrap: 'break-word',
            animation: 'fadeIn 0.3s ease'
        },
        userMessage: {
            backgroundColor: '#00F0FF',
            color: '#0f0f1e',
            marginLeft: 'auto',
            textAlign: 'right',
            boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)'
        },
        aiMessage: {
            backgroundColor: '#16213e',
            color: '#e0e0e0',
            border: '1px solid #00F0FF',
            boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)'
        },
        loadingMessage: {
            opacity: 0.7,
            fontStyle: 'italic'
        },
        initialMessage: {
            textAlign: 'center',
            color: '#888',
            padding: '40px 20px',
            fontSize: '1.1rem'
        },
        inputArea: {
            padding: '20px',
            backgroundColor: '#16213e',
            borderBottomLeftRadius: '15px',
            borderBottomRightRadius: '15px',
            display: 'flex',
            gap: '10px',
            borderTop: '2px solid #00F0FF'
        },
        textInput: {
            flex: 1,
            padding: '12px 16px',
            borderRadius: '8px',
            border: '2px solid #00F0FF',
            backgroundColor: '#0f0f1e',
            color: '#fff',
            fontSize: '1rem',
            outline: 'none',
            transition: 'all 0.3s ease'
        },
        stopSpeakingBtn: {
            padding: '12px 16px',
            borderRadius: '8px',
            border: '2px solid #FF9800',
            backgroundColor: 'transparent',
            color: '#FF9800',
            cursor: 'pointer',
            fontSize: '1.2rem',
            transition: 'all 0.3s ease',
            boxShadow: '0 0 10px rgba(255, 152, 0, 0.3)'
        },
        stopSpeakingBtnActive: {
            backgroundColor: '#FF9800',
            color: '#fff',
            boxShadow: '0 0 20px rgba(255, 152, 0, 0.6)'
        },
        micBtn: {
            padding: '12px 16px',
            borderRadius: '8px',
            border: '2px solid #4CAF50',
            backgroundColor: 'transparent',
            color: '#4CAF50',
            cursor: 'pointer',
            fontSize: '1.2rem',
            transition: 'all 0.3s ease',
            boxShadow: '0 0 10px rgba(76, 175, 80, 0.3)'
        },
        micBtnActive: {
            backgroundColor: '#4CAF50',
            color: '#fff',
            boxShadow: '0 0 20px rgba(76, 175, 80, 0.6)'
        },
        stopBtn: {
            padding: '12px 16px',
            borderRadius: '8px',
            border: '2px solid #ff6b6b',
            backgroundColor: 'transparent',
            color: '#ff6b6b',
            cursor: 'pointer',
            fontSize: '1.2rem',
            transition: 'all 0.3s ease',
            boxShadow: '0 0 10px rgba(255, 107, 107, 0.3)'
        },
        sendBtn: {
            padding: '12px 20px',
            borderRadius: '8px',
            border: '2px solid #00F0FF',
            backgroundColor: '#00F0FF',
            color: '#0f0f1e',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease',
            boxShadow: '0 0 15px rgba(0, 240, 255, 0.5)'
        },
        btnDisabled: {
            opacity: 0.5,
            cursor: 'not-allowed'
        },
        inlineCode: {
            backgroundColor: 'rgba(0, 240, 255, 0.1)',
            color: '#00F0FF',
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: 'monospace'
        },
        codeBlock: {
            display: 'block',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            color: '#0f0',
            padding: '12px',
            borderRadius: '6px',
            fontFamily: 'monospace',
            overflowX: 'auto',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            marginTop: '8px',
            marginBottom: '8px'
        },
        h1: {
            color: '#00F0FF',
            fontSize: '1.5rem',
            marginTop: '10px',
            marginBottom: '10px',
            textShadow: '0 0 5px rgba(0, 240, 255, 0.5)'
        },
        h2: {
            color: '#00F0FF',
            fontSize: '1.3rem',
            marginTop: '8px',
            marginBottom: '8px'
        },
        h3: {
            color: '#00F0FF',
            fontSize: '1.1rem',
            marginTop: '6px',
            marginBottom: '6px'
        },
        paragraph: {
            marginTop: '8px',
            marginBottom: '8px',
            lineHeight: '1.6'
        },
        list: {
            marginTop: '8px',
            marginBottom: '8px',
            paddingLeft: '20px'
        },
        listItem: {
            marginBottom: '4px',
            lineHeight: '1.5'
        },
        strong: {
            color: '#00F0FF',
            fontWeight: 'bold'
        },
        em: {
            color: '#b3b3ff',
            fontStyle: 'italic'
        },
        blockquote: {
            borderLeft: '4px solid #00F0FF',
            paddingLeft: '12px',
            marginLeft: '0',
            marginTop: '8px',
            marginBottom: '8px',
            fontStyle: 'italic',
            color: '#b3b3b3'
        },
        link: {
            color: '#00F0FF',
            textDecoration: 'underline',
            cursor: 'pointer'
        }
    };

    return (
        <div style={chatbotStyles.modalBackdrop}>
            <div style={chatbotStyles.chatContainer}>
                <div style={chatbotStyles.chatHeader}>
                    <h1 style={chatbotStyles.headerText}>
                        <FaRobot style={{ marginRight: '10px' }} /> AI Assistant
                    </h1>
                    <button style={chatbotStyles.closeBtn} onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>
                
                <div ref={chatHistoryRef} style={chatbotStyles.chatHistory}>
                    {messages.length === 0 && (
                        <div style={chatbotStyles.initialMessage}>
                            Hello! I'm your LMS assistant. Ask me anything about your courses, grades, or assignments!
                        </div>
                    )}
                    {messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            style={{
                                ...chatbotStyles.message,
                                ...(msg.sender === 'user' ? chatbotStyles.userMessage : chatbotStyles.aiMessage),
                                ...(msg.loading ? chatbotStyles.loadingMessage : {})
                            }}
                        >
                            {msg.sender === 'ai' && !msg.loading ? (
                                <ReactMarkdown
                                    components={{
                                        code: ({node, inline, ...props}) => (
                                            inline ? 
                                            <code style={chatbotStyles.inlineCode} {...props} /> : 
                                            <code style={chatbotStyles.codeBlock} {...props} />
                                        ),
                                        h1: (props) => <h1 style={chatbotStyles.h1} {...props} />,
                                        h2: (props) => <h2 style={chatbotStyles.h2} {...props} />,
                                        h3: (props) => <h3 style={chatbotStyles.h3} {...props} />,
                                        p: (props) => <p style={chatbotStyles.paragraph} {...props} />,
                                        ul: (props) => <ul style={chatbotStyles.list} {...props} />,
                                        ol: (props) => <ol style={chatbotStyles.list} {...props} />,
                                        li: (props) => <li style={chatbotStyles.listItem} {...props} />,
                                        strong: (props) => <strong style={chatbotStyles.strong} {...props} />,
                                        em: (props) => <em style={chatbotStyles.em} {...props} />,
                                        blockquote: (props) => <blockquote style={chatbotStyles.blockquote} {...props} />,
                                        a: (props) => <a style={chatbotStyles.link} {...props} target="_blank" rel="noopener noreferrer" />
                                    }}
                                >
                                    {msg.text}
                                </ReactMarkdown>
                            ) : (
                                msg.text
                            )}
                        </div>
                    ))}
                </div>
                
                <div style={chatbotStyles.inputArea}>
                    <input 
                        type="text" 
                        style={chatbotStyles.textInput}
                        placeholder={isListening ? "Listening..." : "Type or speak your message..."}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={messages.some(m => m.loading)}
                    />
                    
                    <button 
                        style={{
                            ...chatbotStyles.stopSpeakingBtn,
                            ...(isSpeaking ? chatbotStyles.stopSpeakingBtnActive : {}),
                            ...(!isSpeaking ? chatbotStyles.btnDisabled : {})
                        }}
                        onClick={stopSpeaking}
                        disabled={!isSpeaking}
                        title={isSpeaking ? "Stop AI Voice" : "AI not speaking"}
                    >
                        {isSpeaking ? <FaVolumeUp /> : <FaVolumeMute />}
                    </button>
                    
                    <button 
                        style={{
                            ...chatbotStyles.micBtn,
                            ...(isListening ? chatbotStyles.micBtnActive : {}),
                            ...(messages.some(m => m.loading) || !recognition ? chatbotStyles.btnDisabled : {})
                        }}
                        onClick={startListening}
                        disabled={messages.some(m => m.loading) || isListening || !recognition}
                        title={!recognition ? "Speech recognition not supported" : "Start Voice Input"}
                    >
                        <FaMicrophone />
                    </button>
                    {/* <button 
                        style={{
                            ...chatbotStyles.stopBtn,
                            ...(!isListening ? chatbotStyles.btnDisabled : {})
                        }}
                        onClick={stopListening}
                        disabled={!isListening}
                        title="Stop Voice Input"
                    >
                        <FaStopCircle />
                    </button> */}
                    <button 
                        style={{
                            ...chatbotStyles.sendBtn,
                            ...(!userInput.trim() || messages.some(m => m.loading) ? chatbotStyles.btnDisabled : {})
                        }}
                        onClick={sendMessage}
                        disabled={!userInput.trim() || messages.some(m => m.loading)}
                    >
                        <FaPaperPlane /> Send
                    </button>
                </div>
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// --- Utility Components (Unchanged) ---
// ----------------------------------------------------------------------

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

const DashboardNavbar = ({ studentName, onLogout, onProfileToggle, onSidebarToggle, isSidebarOpen }) => (
    <nav className="dashboard-navbar-neon">
        <button className="sidebar-toggle-btn" onClick={onSidebarToggle}>
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
        <div className="logo"><FaUniversity className="logo-icon" /> INFINITY LMS</div>
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
            <Link to="/student/disucusion" className="nav-link"><FaCommentDots /> <span className="link-text">Discussion Forum</span></Link>
            <Link to="/student/profile" className="nav-link"><FaUserCircle /> <span className="link-text">Profile</span></Link>
        </nav>
    </aside>
);

const CourseCard = ({ course, actionType, onActionClick }) => {
    const isEnrolled = actionType === 'view';
    const progressText = isEnrolled ? `${course.progress}% Complete` : null;
    const progressValue = isEnrolled ? course.progress : 0;
    
    return (
        <div className={`course-card-neon ${isEnrolled ? 'enrolled' : 'available'}`}>
            <h4 className="card-title">{course.title}</h4>
            <p className="card-description">{course.description}</p>
            <div className="card-meta">
                <span><FaClock /> {course.duration}</span>
                {progressText && <span><FaCheckCircle /> {progressText}</span>}
            </div>
            {isEnrolled && (
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${progressValue}%` }}></div>
                </div>
            )}
            <button 
                className={`btn-action-neon ${isEnrolled ? 'btn-view' : 'btn-enroll'}`} 
                onClick={() => onActionClick(course)}
            >
                {isEnrolled ? (<><FaArrowRight /> View Course</>) : (<><FaBookOpen /> Enroll Now</>)}
            </button>
        </div>
    );
};

const PendingAssignmentsWidget = ({ pendingAssignments }) => (
    <div className="widget-card pending-assignments-widget">
        <h3 className="widget-title"><FaClipboardList /> Pending Assignments</h3>
        <div className="widget-content">
            {pendingAssignments.length > 0 ? (
                pendingAssignments.slice(0, 4).map(assignment => (
                    <div key={assignment.assignmentId} className="assignment-item">
                        <span className="assignment-name">{assignment.title}</span>
                        <span className="assignment-meta">
                            <span className="course-tag">{assignment.courseTitle}</span>
                            <span className="due-date"><FaCalendarAlt /> Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                        </span>
                    </div>
                ))
            ) : (
                <p className="widget-empty">All caught up! No pending assignments.</p>
            )}
        </div>
    </div>
);

const RecentGradesWidget = ({ recentGrades }) => (
    <div className="widget-card recent-grades-widget">
        <h3 className="widget-title"><FaStar /> Recent Grades</h3>
        <div className="widget-content">
            {recentGrades.length > 0 ? (
                recentGrades.slice(0, 4).map((grade, index) => (
                    <div key={index} className="grade-item">
                        <span className="grade-score">{grade.grade}/{grade.maxPoints}</span>
                        <div className="grade-details">
                            <span className="grade-name">{grade.assignmentTitle}</span>
                            <span className="grade-course">{grade.courseTitle} - {new Date(grade.gradedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))
            ) : (
                <p className="widget-empty">No recent grades to display.</p>
            )}
        </div>
    </div>
);

const RecentMaterialsWidget = ({ materials }) => (
    <div className="widget-card materials-widget">
        <h3 className="widget-title"><FaFileAlt /> Recent Materials</h3>
        <div className="widget-content">
            {materials.length > 0 ? (
                materials.map((m) => (
                    <div key={m.id} className="material-item">
                        <span className="material-name" title={m.title}>{m.title}</span>
                        <span className="material-meta">
                            <span className="course-tag">{m.courseTitle}</span>
                            <span className="file-type">({m.fileType || 'Link'})</span>
                            <span className="timestamp">{new Date(m.createdAt).toLocaleDateString()}</span>
                        </span>
                    </div>
                ))
            ) : (
                <p className="widget-empty">No new materials uploaded recently.</p>
            )}
        </div>
    </div>
);

const RecentThreadsWidget = ({ threads }) => (
    <div className="widget-card threads-widget">
        <h3 className="widget-title"><FaCommentDots /> Recent Discussions</h3>
        <div className="widget-content">
            {threads.length > 0 ? (
                threads.map((t) => (
                    <div key={t.id} className="thread-item">
                        <span className="thread-title" title={t.title}>{t.title}</span>
                        <span className="thread-meta">
                            <span className="course-tag">{t.courseTitle}</span>
                            <span className="author">by {t.createdBy}</span>
                            <span className="timestamp">{new Date(t.createdAt).toLocaleDateString()}</span>
                        </span>
                    </div>
                ))
            ) : (
                <p className="widget-empty">No recent discussion activity.</p>
            )}
        </div>
    </div>
);

const RecentNotificationsWidget = ({ notifications }) => (
    <div className="widget-card notifications-widget">
        <h3 className="widget-title"><FaBell /> Recent Notifications</h3>
        <div className="widget-content">
            {notifications.length > 0 ? (
                notifications.map((n) => (
                    <div key={n.id} className={`notification-item ${n.isRead ? 'read' : 'unread'}`}>
                        <span className="notification-message">{n.message}</span>
                        <span className="notification-meta">
                            <span className={`status-dot ${n.isRead ? 'read-dot' : 'unread-dot'}`}></span>
                            <span className="timestamp">{new Date(n.createdAt).toLocaleTimeString()}</span>
                        </span>
                    </div>
                ))
            ) : (
                <p className="widget-empty">No new notifications.</p>
            )}
        </div>
    </div>
);

// ----------------------------------------------------------------------
// --- Chatbot Floating Button Component ---
// ----------------------------------------------------------------------
const ChatbotButton = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            title="Open Chatbot Assistant"
            style={{
                padding: '10px 15px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                backgroundColor: 'transparent',
                border: '2px solid #00F0FF',
                boxShadow: '0 0 10px #00F0FF, 0 0 20px rgba(0, 240, 255, 0.6), inset 0 0 5px #00F0FF',
                letterSpacing: '1px',
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: '1000'
            }}
        >
            <FaRobot style={{ marginRight: '8px', fontSize: '1.2em' }}/>
             INFINITY ASSISTANT
        </button>
    );
};

// ----------------------------------------------------------------------
// --- Custom Hook for Data Fetching & Simple Caching ---
// ----------------------------------------------------------------------

let dashboardCache = null;

const useStudentDashboardData = (token, logout, navigate, isAuthenticated) => {
    const initialData = {
        enrolledCourses: [],
        availableCourses: [],
        pendingAssignments: [],
        recentMaterials: [],
        recentThreads: [],
        recentGrades: [],
        recentNotifications: [],
    };
    const [dashboardData, setDashboardData] = useState(dashboardCache || initialData);
    const [loading, setLoading] = useState(!dashboardCache);
    const [error, setError] = useState(null);

    const fetchDashboardData = useCallback(async () => {
        if (!token || !isAuthenticated) {
            setLoading(false);
            if (!isAuthenticated) navigate('/login');
            return;
        }

        if (dashboardCache) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/studentdashboard`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            
            const data = response.data.dashboard;
            setDashboardData(data);
            dashboardCache = data;
            setError(null);
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            
            const statusCode = err.response ? err.response.status : null;
            
            if (statusCode === 401 || statusCode === 403) {
                console.log("Unauthorized API access. Logging out and redirecting to login.");
                logout(); 
                navigate('/login'); 
                return; 
            }

            setError("Failed to load dashboard data. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [token, logout, navigate, isAuthenticated]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    return { dashboardData, loading, error, refresh: fetchDashboardData };
};

// ----------------------------------------------------------------------
// --- Main StudentDashboard Component ---
// ----------------------------------------------------------------------
const StudentDashboard = () => {
    const auth = useAuth();
    const navigate = useNavigate();
    
    const { name, email, userId, role, logout, token, isAuthenticated } = auth;
    
    const { dashboardData, loading, error } = useStudentDashboardData(token, logout, navigate, isAuthenticated);

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const toggleProfile = () => setIsProfileOpen(prev => !prev);
    const toggleChatbot = () => setIsChatbotOpen(prev => !prev);

    const handleEnroll = (course) => {
        navigate(`/enroll/${course.id}`); 
    };

    const handleViewCourse = (course) => {
        navigate(`/student/my-courses/${course.id}`);
    };

    const handleLogout = () => {
        dashboardCache = null;
        logout();
        navigate('/login');
    };

    if (loading) {
        return <div className="loading-screen"><p>Loading Dashboard...</p></div>;
    }

    if (error) {
        return <div className="error-screen"><p>Error: {error}</p></div>;
    }

    const mainContentClass = `main-content-area ${!isSidebarOpen ? 'sidebar-closed-content' : ''}`;

    const { 
        enrolledCourses, 
        availableCourses, 
        pendingAssignments,
        recentMaterials,
        recentThreads,
        recentGrades,
        recentNotifications
    } = dashboardData;

    return (
        <>
            {isProfileOpen && (
                <ProfileModal 
                    authData={{ name, email, userId, role, logout: handleLogout }} 
                    onClose={toggleProfile} 
                />
            )}

            {isChatbotOpen && (
                <ChatbotModal onClose={toggleChatbot} />
            )}

            <div className="app-container">
                
                <ChatbotButton onClick={toggleChatbot} />

                <DashboardNavbar 
                    studentName={name} 
                    onLogout={handleLogout}
                    onProfileToggle={toggleProfile}
                    onSidebarToggle={toggleSidebar}
                    isSidebarOpen={isSidebarOpen}
                />
                
                <DashboardSidebar isOpen={isSidebarOpen} />

                <main className={mainContentClass}>
                    <div className="welcome-banner dashboard-section">
                        <h1 className="section-title-neon">Welcome Back, {name.split(' ')[0]}!</h1>
                        {/* <p className="section-subtitle-neon">Here is an immediate overview of your academic life.</p> */}
                    </div>

                    <section className="dashboard-section core-section">
                        <h2 className="section-title-neon">📚 My Enrolled Courses</h2>
                        <div className="courses-grid">
                            {enrolledCourses.length > 0 ? (
                                enrolledCourses.map(course => (
                                    <CourseCard 
                                        key={course.id}
                                        course={course}
                                        actionType="view"
                                        onActionClick={handleViewCourse}
                                    />
                                ))
                            ) : (
                                <p className="widget-empty full-width-message">You are not currently enrolled in any courses. Explore below!</p>
                            )}
                        </div>
                    </section>
                    
                    <section className="dashboard-section">
                        <h2 className="section-title-neon">🗂️ Action Items & Progress</h2>
                        <div className="secondary-widgets-container">
                            <PendingAssignmentsWidget pendingAssignments={pendingAssignments} />
                            <RecentGradesWidget recentGrades={recentGrades} />
                        </div>
                    </section>

                    <section className="dashboard-section recent-activity-section">
                        <h2 className="section-title-neon">⏱️ Recent Activity</h2>
                        <div className="tertiary-widgets-container">
                            <RecentMaterialsWidget materials={recentMaterials} />
                            <RecentThreadsWidget threads={recentThreads} />
                            <RecentNotificationsWidget notifications={recentNotifications} />
                        </div>
                    </section>

                    <section className="dashboard-section featured-section">
                        <h2 className="section-title-neon">🚀 Available Courses</h2>
                        <p className="section-subtitle-neon">Expand your mind with new opportunities.</p>
                        <div className="courses-grid">
                            {availableCourses.length > 0 ? (
                                availableCourses.map(course => (
                                    <CourseCard 
                                        key={course.id}
                                        course={course}
                                        actionType="enroll"
                                        onActionClick={handleEnroll}
                                    />
                                ))
                            ) : (
                                <p className="widget-empty full-width-message">No additional courses are currently available for enrollment.</p>
                            )}
                        </div>
                    </section>

                </main>
            </div>
        </>
    );
};

export default StudentDashboard;