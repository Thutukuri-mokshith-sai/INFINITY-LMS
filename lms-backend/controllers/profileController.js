const db = require('../models');
const StudentProfile = db.StudentProfile;
const TeacherProfile = db.TeacherProfile;
const User = db.User;

// Helper function to get the correct profile model based on user role
const getProfileModel = (role) => {
    if (role === 'Student') return StudentProfile;
    if (role === 'Teacher') return TeacherProfile;
    return null;
};

/**
 * @desc Create or update the user's profile (Student or Teacher)
 * @route POST /api/profiles/
 * @access Private (Teacher, Student)
 */
exports.createOrUpdateProfile = async (req, res) => {
    const { role, id: userId } = req.user;
    const ProfileModel = getProfileModel(role);

    if (!ProfileModel) {
        return res.status(403).json({
            status: 'fail',
            message: 'Access denied. Unknown role for profile creation.',
        });
    }

    try {
        const profileData = { ...req.body, userId };

        let profile = await ProfileModel.findOne({ where: { userId } });

        if (profile) {
            await ProfileModel.update(profileData, { where: { userId } });
            profile = await ProfileModel.findOne({ where: { userId } });
            res.status(200).json({
                status: 'success',
                message: `${role} profile updated successfully.`,
                data: { profile },
            });
        } else {
            const newProfile = await ProfileModel.create(profileData);
            res.status(201).json({
                status: 'success',
                message: `${role} profile created successfully.`,
                data: { profile: newProfile },
            });
        }

    } catch (error) {
        console.error('Error creating/updating profile:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error during profile operation.',
            error: error.message,
        });
    }
};

/**
 * @desc Get the authenticated user's profile
 * @route GET /api/profiles/me
 * @access Private (Teacher, Student)
 */
exports.getOwnProfile = async (req, res) => {
    const { role, id: userId } = req.user;
    const ProfileModel = getProfileModel(role);
    const profileAlias = role === 'Student' ? 'StudentProfile' : 'TeacherProfile';

    if (!ProfileModel) {
        return res.status(403).json({
            status: 'fail',
            message: 'Access denied. Cannot fetch profile for unknown role.',
        });
    }

    try {
        const userWithProfile = await User.findByPk(userId, {
            attributes: ['id', 'name', 'email', 'role'], // ✅ FIXED: Only existing columns
            include: [
                {
                    model: ProfileModel,
                    as: profileAlias,
                    attributes: { exclude: ['userId', 'id'] },
                }
            ]
        });

        if (!userWithProfile) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found.',
            });
        }

        res.status(200).json({
            status: 'success',
            data: { user: userWithProfile },
        });

    } catch (error) {
        console.error('Error fetching own profile:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error while fetching profile.',
            error: error.message,
        });
    }
};
