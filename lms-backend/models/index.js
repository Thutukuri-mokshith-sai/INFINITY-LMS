// models/index.js

const sequelize = require('../config/database');

// Import all models
const User = require('./User');
const Course = require('./Course');
const Enrollment = require('./Enrollment');
const TeacherProfile = require('./TeacherProfile');
const StudentProfile = require('./StudentProfile');
const Assignment = require('./Assignment');
const Submission = require('./Submission');
const AssignmentResource = require('./AssignmentResource');
const SubmissionResource = require('./SubmissionResource');

// New Forum & Engagement Models
const Forum = require('./Forum');
const Thread = require('./Thread');
const Post = require('./Post');
const ForumParticipant = require('./ForumParticipant');
const Notification = require('./Notification');
const Like = require('./Like');
const Resource = require('./Resource'); // Generic Resource for Forum/Post attachments

// NEW: Import the Material model
const Material = require('./Material'); //

// ----------------------------------------------------
// Define Associations
// ----------------------------------------------------

// 🧑‍🏫 User (Teacher) ↔ Course (One-to-Many)
User.hasMany(Course, {
    as: 'TaughtCourses',
    foreignKey: 'teacherId',
    onDelete: 'CASCADE',
});
Course.belongsTo(User, {
    as: 'Teacher',
    foreignKey: 'teacherId',
});

// 🧑‍🎓 User (Student) ↔ Course (Many-to-Many via Enrollment)
User.belongsToMany(Course, {
    through: Enrollment,
    as: 'EnrolledCourses',
    foreignKey: 'userId',
});
Course.belongsToMany(User, {
    through: Enrollment,
    as: 'Students',
    foreignKey: 'courseId',
});

// ✅ Explicit Enrollment associations (Fixes EagerLoadingError)
Enrollment.belongsTo(User, { foreignKey: 'userId', as: 'Student' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'Course' });
User.hasMany(Enrollment, { foreignKey: 'userId', as: 'Enrollments' });
Course.hasMany(Enrollment, { foreignKey: 'courseId', as: 'Enrollments' });

// 🧩 User ↔ Profile (One-to-One)
User.hasOne(TeacherProfile, {
    as: 'TeacherProfile',
    foreignKey: 'userId',
    onDelete: 'CASCADE',
});
TeacherProfile.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(StudentProfile, {
    as: 'StudentProfile',
    foreignKey: 'userId',
    onDelete: 'CASCADE',
});
StudentProfile.belongsTo(User, { foreignKey: 'userId' });

// 📚 Course ↔ Assignment (One-to-Many)
Course.hasMany(Assignment, {
    as: 'Assignments',
    foreignKey: 'courseId',
    onDelete: 'CASCADE',
});
Assignment.belongsTo(Course, { as: 'Course', foreignKey: 'courseId' });

// 🧑‍🏫 Teacher (User) ↔ Assignment (One-to-Many)
User.hasMany(Assignment, {
    as: 'CreatedAssignments',
    foreignKey: 'teacherId',
});
Assignment.belongsTo(User, { as: 'Creator', foreignKey: 'teacherId' });

// 📝 Assignment ↔ Submission (One-to-Many)
Assignment.hasMany(Submission, {
    as: 'Submissions',
    foreignKey: 'assignmentId',
    onDelete: 'CASCADE',
});
Submission.belongsTo(Assignment, { as: 'Assignment', foreignKey: 'assignmentId' });

// 🧑‍🎓 Student (User) ↔ Submission (One-to-Many)
User.hasMany(Submission, {
    as: 'StudentSubmissions',
    foreignKey: 'studentId',
});
Submission.belongsTo(User, { as: 'Student', foreignKey: 'studentId' });

// ✅ Grader (User) ↔ Submission (One-to-Many)
User.hasMany(Submission, {
    as: 'GradedSubmissions',
    foreignKey: 'gradedBy',
});
Submission.belongsTo(User, {
    as: 'Grader', // MUST match alias in gradeController.js
    foreignKey: 'gradedBy',
});

// 📂 Assignment ↔ AssignmentResource (One-to-Many)
Assignment.hasMany(AssignmentResource, {
    as: 'Resources',
    foreignKey: 'assignmentId',
    onDelete: 'CASCADE',
});
AssignmentResource.belongsTo(Assignment, {
    as: 'Assignment',
    foreignKey: 'assignmentId',
});

// 📎 Submission ↔ SubmissionResource (One-to-Many)
Submission.hasMany(SubmissionResource, {
    as: 'SubmittedResources',
    foreignKey: 'submissionId',
    onDelete: 'CASCADE',
});
SubmissionResource.belongsTo(Submission, {
    as: 'Submission',
    foreignKey: 'submissionId',
});

// ----------------------------------------------------
// 📄 Course Material Associations (NEW)
// ----------------------------------------------------

// 📚 Course ↔ Material (One-to-Many)
Course.hasMany(Material, { 
    foreignKey: 'courseId', 
    as: 'Materials', 
    onDelete: 'CASCADE' 
});
Material.belongsTo(Course, { 
    foreignKey: 'courseId', 
    as: 'Course' 
});

// 🧑‍🏫 User (Uploader) ↔ Material (One-to-Many)
User.hasMany(Material, { 
    foreignKey: 'uploadedBy', 
    as: 'UploadedMaterials' 
});
Material.belongsTo(User, { 
    foreignKey: 'uploadedBy', 
    as: 'Uploader' // Alias used in materialController.js 
});

// ----------------------------------------------------
// 🧩 Discussion Forum Associations
// ----------------------------------------------------

// 🔗 Course ↔ Forum (One-to-One: Using courseId as FK in Forum)
Course.hasOne(Forum, { foreignKey: 'courseId', as: 'DiscussionForum', onDelete: 'CASCADE' });
Forum.belongsTo(Course, { foreignKey: 'courseId', as: 'Course' });

// 🧑‍🏫 User ↔ Forum (One-to-Many: User created the forum)
User.hasMany(Forum, { foreignKey: 'createdById', as: 'CreatedForums' });
Forum.belongsTo(User, { foreignKey: 'createdById', as: 'Creator' });

// 🔗 Forum ↔ Thread (One-to-Many)
Forum.hasMany(Thread, { foreignKey: 'forumId', as: 'Threads', onDelete: 'CASCADE' });
Thread.belongsTo(Forum, { foreignKey: 'forumId', as: 'Forum' });

// 🔗 Thread ↔ Post (One-to-Many)
Thread.hasMany(Post, { foreignKey: 'threadId', as: 'Posts', onDelete: 'CASCADE' });
Post.belongsTo(Thread, { foreignKey: 'threadId', as: 'Thread' });

// 🧑‍🎓 User ↔ Thread (One-to-Many: User created the thread)
User.hasMany(Thread, { foreignKey: 'userId', as: 'CreatedThreads' });
Thread.belongsTo(User, { foreignKey: 'userId', as: 'Creator' });

// 🧑‍🎓 User ↔ Post (One-to-Many: User created the post)
User.hasMany(Post, { foreignKey: 'userId', as: 'CreatedPosts' });
Post.belongsTo(User, { foreignKey: 'userId', as: 'Creator' }); // <-- DEFINED ALIAS
// 👥 Forum ↔ User (Many-to-Many via ForumParticipant)
Forum.belongsToMany(User, { through: ForumParticipant, as: 'Participants', foreignKey: 'forumId' });
User.belongsToMany(Forum, { through: ForumParticipant, as: 'ParticipatedForums', foreignKey: 'userId' });
ForumParticipant.belongsTo(User, { foreignKey: 'userId', as: 'User' });
ForumParticipant.belongsTo(Forum, { foreignKey: 'forumId', as: 'Forum' });

// ----------------------------------------------------
// 🔔 Notifications, ❤️ Likes, & 🖼️ Resources Associations
// ----------------------------------------------------

// 🔔 User ↔ Notification (One-to-Many)
User.hasMany(Notification, { foreignKey: 'userId', as: 'UserNotifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'Recipient' });

// ❤️ User ↔ Like (One-to-Many)
User.hasMany(Like, { foreignKey: 'userId', as: 'GivenLikes', onDelete: 'CASCADE' });
Like.belongsTo(User, { foreignKey: 'userId', as: 'Liker' });

// Count likes on Thread/Post (Polymorphic Association setup)
Thread.hasMany(Like, {
    as: 'Likes',
    foreignKey: 'entityId',
    scope: { entityType: 'Thread' },
    onDelete: 'CASCADE'
});
Post.hasMany(Like, {
    as: 'Likes',
    foreignKey: 'entityId',
    scope: { entityType: 'Post' },
    onDelete: 'CASCADE'
});

// 🖼️ Thread ↔ Resource (Polymorphic One-to-Many)
Thread.hasMany(Resource, {
    as: 'Resources',
    foreignKey: 'entityId',
    scope: { entityType: 'Thread' },
    onDelete: 'CASCADE'
});
Resource.belongsTo(Thread, {
    foreignKey: 'entityId',
    constraints: false // Required for polymorphic associations
});

// 🖼️ Post ↔ Resource (Polymorphic One-to-Many)
Post.hasMany(Resource, {
    as: 'Resources',
    foreignKey: 'entityId',
    scope: { entityType: 'Post' },
    onDelete: 'CASCADE'
});
Resource.belongsTo(Post, {
    foreignKey: 'entityId',
    constraints: false // Required for polymorphic associations
});

// ----------------------------------------------------
// Export models and sequelize instance
// ----------------------------------------------------
const db = {
    sequelize,
    User,
    Course,
    Enrollment,
    TeacherProfile,
    StudentProfile,
    Assignment,
    Submission,
    AssignmentResource,
    SubmissionResource,
    // NEW: Material Model
    Material, //
    // Forum Models
    Forum,
    Thread,
    Post,
    ForumParticipant,
    // Engagement Models
    Notification,
    Like,
    Resource,
};

// Utility sync function
db.sync = async (options) => {
    await sequelize.sync(options);
};

module.exports = db;