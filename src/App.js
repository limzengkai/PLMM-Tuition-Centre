import React, { useContext } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Admin from "./layouts/Admin.js";
import Parent from "./layouts/Parent.js";
import Auth from "./layouts/Auth.js";
import Teacher from "./layouts/Teacher";
import Landing from "./views/Landing.js";
import Profile from "./views/Profile.js";
import Index from "./views/Index.js";
import AuthGuard from "./views/auth/AuthGuard.js";
import VerifyEmail from "./views/auth/verify-email.js";
import ActionMode from "./views/auth/ActionMode.js";
import ChangePassword from "./views/auth/ChangePassword.js";
import Registration from "./views/auth/Register.js";
import { AuthContext } from "./config/context/AuthContext.js";
import Teachers from "./views/Teachers.js";
import AboutUs from "./views/AboutUs.js";
import Classes from "./views/Classes.js";
import ClassesLevel from "./views/ClassesLevel.js";

function App() {
  const { currentUser, emailVerified } = useContext(AuthContext);

  const RequireAuth = ({ children }) => {
    if (currentUser !== null && emailVerified) {
      return children;
    } else if (currentUser !== null && !emailVerified) {
      return <Navigate to="/auth/verify-email" />;
    } else {
      return <Navigate to="/auth/login" />;
    }
  };

  const RequireAdmin = ({ children }) => {
    if (currentUser && currentUser.role === "admin" && emailVerified) {
      return children;
    } else if (currentUser !== null && !emailVerified) {
      return <Navigate to="/auth/verify-email" />;
    } else {
      return <Navigate to="/" />;
    }
  };

  const RequireParent = ({ children }) => {
    if (currentUser && currentUser.role === "parent" && emailVerified) {
      return children;
    } else if (currentUser !== null && !emailVerified) {
      return <Navigate to="/auth/verify-email" />;
    } else {
      return <Navigate to="/" />;
    }
  };

  const RequireTeacher = ({ children }) => {
    if (currentUser && currentUser.role === "teacher") {
      return children;
    } else {
      return <Navigate to="/" />;
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Routes with layouts */}
        <Route path="/admin/*" element={<RequireAdmin><Admin /></RequireAdmin>} />
        <Route path="/parent/*" element={<RequireParent><Parent /></RequireParent>} />
        <Route path="/teacher/*" element={<RequireTeacher><Teacher /></RequireTeacher>} />
        <Route path="/auth/*" element={<AuthGuard><Auth /></AuthGuard>} />
        <Route path="/auth/verify-email" element={<VerifyEmail />} />
        <Route path="/auth/action-mode" element={<ActionMode />} />
        <Route path="/auth/change-password" exact element={<ChangePassword />} />

        {/* Routes without layouts */}
        {/* <Route path="/landing" element={<Landing />} /> */}
        {/* <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} /> */}
        <Route path="/" element={<Index />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/classes/:level" element={<ClassesLevel />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/about-us" element={<AboutUs />} />

        {/* Redirect all unmatched routes to the landing page */}
        <Route path="*" element={<Navigate to="/landing" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
