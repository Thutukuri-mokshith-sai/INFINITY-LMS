import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './components/Signup';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import ForgotPassword from './components/ForgotPassword';
import HomePage from './components/Homepage';
import StudentDashboard from './components/Student/StudentDashboard';
import TeacherDashboard from './components/Teacher/TeacherDashboard';
import CreateCourse from './components/Teacher/CreateCourse';
import TeacherCourses from './components/Teacher/TeacherCourses';
import EnrollCourses from './components/Student/EnrollCourses';
import MyCourses from './components/Student/MyCourses';
import StudentProfile from './components/Student/studentprofile';
import StudentCourseDetails from './components/Student/StudentCourseDetails';
import TeacherProfile from './components/Teacher/TeacherProfile';
import TeacherCourseDetails from './components/Teacher/TeacherCourseDetails ';
import TeacherAssignmentSubmissions from './components/Teacher/TeacherAssignmentSubmissions';
import ThreadListPage from './components/Teacher/ThreadListPage';
import StudentAssignmentView from './components/Student/StudentAssignmentView';
import StudentGrades from './components/Student/StudentGrades';
import StudentForumView from './components/Student/StudentForumView';
import StudentThreadDetailView from './components/Student/ThreadDetailView';
import CourseDiscussionDashboard from './components/Student/CourseDiscussionDashboard';
import ManageCourseMaterials from './components/Teacher/ManageCourseMaterials';
import StudentCourseMaterialsView from './components/Student/StudentCourseMaterialsView';
import TeacherStudentsList from './components/Teacher/TeacherStudentsList';
import TeacherGradeCenter from './components/Teacher/TeacherGradeCenter';
const HomeRedirect = () => {
  const { isAuthenticated, role } = useAuth();

  if (isAuthenticated) {
    if (role === 'Teacher') {
      return <Navigate to="/Teacher" />;
    } else if (role === 'Student') {
      return <Navigate to="/Student" />;
    } else {
      return <Navigate to="/dashboard" />;
    }
  } else {
    return <Navigate to="/homepage" />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Redirect '/' based on authentication */}
          <Route path="/" element={<HomeRedirect />} />
          <Route path='/homepage' element={<HomePage/>}/>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          {/* Protected dashboard route */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/Student"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/Teacher"
            element={
              <ProtectedRoute>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/courses/new"
            element={
              <ProtectedRoute>
                <CreateCourse />
              </ProtectedRoute>
            }
          />
        <Route
            path="/teacher/courses"
            element={
              <ProtectedRoute>
                <TeacherCourses />
              </ProtectedRoute>
            }
          />
        <Route
            path="/teacher/profile"
            element={
              <ProtectedRoute>
                <TeacherProfile />
              </ProtectedRoute>
            }
          />
          // AppRouter.js
        <Route path="/course/:courseId/forum/:forumId/threads" element={<ProtectedRoute><ThreadListPage /></ProtectedRoute>} />
        <Route path='/student/threads/:threadId' element={<ProtectedRoute><StudentThreadDetailView/></ProtectedRoute>}/>
        <Route path='/student/disucusion' element={<ProtectedRoute><CourseDiscussionDashboard/></ProtectedRoute>}/>
        <Route path='/teacher/course/:courseId/materials' element={<ProtectedRoute><ManageCourseMaterials/></ProtectedRoute>}/>
        <Route path='teacher/grading' element={<ProtectedRoute><TeacherGradeCenter/></ProtectedRoute>}/>
        // In your main application router (e.g., App.js or Router.js)

        <Route path="/student/materials/:courseId" element={<StudentCourseMaterialsView />} />
        <Route path='/teacher/students' element={<ProtectedRoute><TeacherStudentsList/></ProtectedRoute>}/>
          <Route
            path="/student/courses"
            element={
              <ProtectedRoute>
                <EnrollCourses />
              </ProtectedRoute>
            }
          />
         <Route
            path="/student/my-courses"
            element={
              <ProtectedRoute>
                <MyCourses />
              </ProtectedRoute>
            }
          />
        <Route path="student/forums/:forumId" element={<ProtectedRoute><StudentForumView /></ProtectedRoute>} />

        <Route
            path="/student/profile"
            element={
              <ProtectedRoute>
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/my-courses/:courseId"
            element={
              <ProtectedRoute>
                <StudentCourseDetails />
              </ProtectedRoute>
            }
          />  
          <Route
          path='/student/grades'
          element={
            <ProtectedRoute><StudentGrades/></ProtectedRoute>
          }/>
          <Route
          path='/student/assignments/:assignmentId'
          element={
            <ProtectedRoute><StudentAssignmentView/></ProtectedRoute>
          }/>
          <Route
          path='/teacher/course/:courseId/details'
          element={
            <ProtectedRoute><TeacherCourseDetails/></ProtectedRoute>
          }/>
          <Route
          path='/teacher/assignment/:assignmentId/submissions'
          element={
            <ProtectedRoute><TeacherAssignmentSubmissions/></ProtectedRoute>
          }/>

        </Routes>
        
      </Router>
    </AuthProvider>
  );
}

export default App;
