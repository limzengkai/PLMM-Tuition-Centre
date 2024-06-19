import React, { useState, useEffect, useContext } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import UsersNavbar from "../components/Navbars/UsersNavbar.js";
import Sidebar from "../components/Sidebar/TeacherSidebar.js";
import HeaderFee from "../components/Headers/HeaderFee.js";
import HeaderAttendance from "../components/Headers/HeaderAttendance.js";
import HeaderClasses from "../components/Headers/HeaderClasses.js";
import HeaderStats from "../components/Headers/HeaderStats";
import HeaderEmpty from "../components/Headers/HeaderEmpty";
import FooterAdmin from "../components/Footers/FooterAdmin.js";
import Dashboard from "../views/Teacher/Dashboard.js";
import Profile from "../views/Teacher/Profile";
import ChangePassword from "../views/Teacher/ChangePassword.js";
import ClassesView from "../views/Teacher/ClassesView";
import CardRecordAttendance from "../components/Cards/TeacherCard/CardRecordAttendance";
import CardEditAttendance from "../components/Cards/TeacherCard/CardEditAttendance";
import AttendanceView from "../views/Teacher/AttendanceView";
import ClassesGradeEdit from "../views/Teacher/ClassesGradeEdit.js";
import CardViewClassAttendance from "../components/Cards/TeacherCard/CardViewClassAttendance.js";
import { AuthContext } from "../config/context/AuthContext.js";
import CardViewAttendance from "../components/Cards/TeacherCard/CardViewAttendance.js";
import ClassesGrade from "../views/Teacher/ClassesGrade.js";
import ClassesGradeView from "../views/Teacher/ClassesGradeView.js";
import ClassesAddTestResult from "../views/Teacher/ClassesAddTestResult.js";

export default function Teacher() {
  const location = useLocation();
  const [headerComponent, setHeaderComponent] = useState(null);
  const [pageTitle, setPageTitle] = useState(null);
  const { currentUser } = useContext(AuthContext);

  useEffect(() => {
    switch (true) {
      case location.pathname === "/teacher/dashboard":
        setHeaderComponent(<HeaderStats />);
        setPageTitle("Dashboard");
        break;
      case location.pathname === "/teacher/profile":
        setPageTitle("Profile");
        setHeaderComponent(<HeaderEmpty />);
        break;
      case location.pathname === "/teacher/fee":
        setHeaderComponent(<HeaderEmpty />);
        setPageTitle("Fees");
        break;
      case location.pathname.startsWith("/teacher/change-password"):
        setHeaderComponent(<HeaderEmpty />);
        setPageTitle("Changing Password");
        break;
      case location.pathname.startsWith("/teacher/attendance"):
        setHeaderComponent(<HeaderEmpty />);
        setPageTitle("Attendance");
        break;
      case location.pathname.startsWith("/teacher/classes"):
        setHeaderComponent(<HeaderEmpty />);
        setPageTitle("Classes");
        break;
      default:
        setHeaderComponent(null);
        setPageTitle("Dashboard"); // Default title
        break;
    }
  }, [location.pathname]);

  useEffect(() => {}, [currentUser]);

  const RequireTeacher = ({ children }) => {
    if (currentUser && currentUser.role === "teacher") {
      return children;
    } else {
      return <Navigate to="/" />;
    }
  };

  return (
    <>
      <RequireTeacher>
        <Sidebar />
        <div className="relative md:ml-64 bg-blueGray-100">
          <UsersNavbar title={pageTitle} />
          {headerComponent}
          <div className="px-4 md:px-10 mx-auto w-full -m-24">
            <Routes>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="change-password" element={<ChangePassword />} />
              <Route path="attendance" element={<AttendanceView />} />
              <Route path="notifications" element={<AttendanceView />} />
              <Route
                path="attendance/class/:id"
                element={<CardViewClassAttendance />}
              />
              <Route
                path="attendance/record/:id"
                element={<CardRecordAttendance />}
              />
              <Route
                path="attendance/class/:id/edit/:attdid"
                element={<CardEditAttendance />}
              />
              <Route
                path="attendance/class/:id/view/:attdid"
                element={<CardViewAttendance />}
              />
              <Route path="classes" element={<ClassesView />} />
              <Route path="classes/view/:id" element={<ClassesView />} />
              <Route path="classes/grade/:id" element={<ClassesGrade />} />
              <Route
                path="classes/grade/:id/new"
                element={<ClassesAddTestResult />}
              />
              <Route
                path="classes/grade/:id/edit/:testid"
                element={<ClassesGradeEdit />}
              />
              <Route
                path="classes/grade/:id/view/:testid"
                element={<ClassesGradeView />}
              />
            </Routes>
            <FooterAdmin />
          </div>
        </div>
      </RequireTeacher>
    </>
  );
}
