import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

// components
import UsersNavbar from "../components/Navbars/UsersNavbar.js";
import AdminNavbar from "../components/Navbars/AdminNavbar.js";
import AdminSidebar from "../components/Sidebar/AdminSidebar.js";
import HeaderStats from "../components/Headers/Admin/HeaderStats.js";
import FooterAdmin from "../components/Footers/FooterAdmin.js";
// import HeaderDashboard from "../components/Headers/HeaderDashboard.js";
// import HeaderFee from "../components/Headers/HeaderFee.js";
// import HeaderAttendance from "../components/Headers/HeaderAttendance.js";
// import HeaderClasses from "../components/Headers/HeaderClasses.js";

import HeaderEmpty from "../components/Headers/HeaderEmpty";
// views
import Dashboard from "../views/admin/Dashboard.js";
import Profile from "../views/admin/Profile.js";
import ChangePassword from "../views/admin/ChangePassword.js";
import Users from "../views/admin/Users.js";
import UsersManagementAction from "../views/admin/UsersManagementAction.js";
import UsersRegistrationView from "../views/admin/UsersRegistrationView.js";
import Info from "../views/admin/Info.js";
import Fee from "../views/admin/Fee.js";
import Attendance from "../views/admin/Attendance.js";
import AttendanceAction from "../views/admin/AttendanceAction.js";
import Classes from "../views/admin/Classes.js";
import ClassesAction from "../views/admin/ClassesAction.js";
import FeeManagementAction from "../views/admin/FeeManagementAction.js";
import FeeManagementViewAction from "../views/admin/FeeManagementViewAction.js";
import FeeClassesAction from "../views/admin/FeeClassesAction.js";
import CardAdminAttendanceEdit from "../components/Cards/AdminCard/Attendance/CardAdminAttendanceEdit";
import CardAdminAttendanceViewDetails from "../components/Cards/AdminCard/Attendance/CardAdminAttendanceViewDetails";
import InfoTeacher from "../components/Cards/AdminCard/Info/InfoTeacher.js";
import Voucher from "../views/admin/Voucher.js";
import CardAnnouncement from "../components/Cards/AdminCard/Info/CardAnnoucement.js";
import CardUsersRegistrationViewDetails from "../components/Cards/AdminCard/Users/Registration/CardUsersRegistrationViewDetails.js";

export default function Admin() {
  const location = useLocation();
  const [headerComponent, setHeaderComponent] = useState(null);
  const [pageTitle, setPageTitle] = useState(null);

  useEffect(() => {
    // Update header component and page title based on the current path
    switch (true) {
      case location.pathname === "/admin/dashboard":
        setHeaderComponent(<HeaderStats />);
        setPageTitle("Dashboard");
        break;
      case location.pathname === "/admin/profile":
        setPageTitle("Profile");
        setHeaderComponent(<HeaderEmpty />);
        break;
      case location.pathname.startsWith("/admin/fee"):
        setHeaderComponent(<HeaderEmpty />);
        setPageTitle("Fees");
        break;
      case location.pathname.startsWith("/admin/attendance"):
        setHeaderComponent(<HeaderEmpty />);
        setPageTitle("Attendance");
        break;
      case location.pathname.startsWith("/admin/change-password"):
        setHeaderComponent(<HeaderEmpty />);
        setPageTitle("Changing Password");
        break;
      case location.pathname.startsWith("/admin/users"):
        setHeaderComponent(<HeaderEmpty />);
        setPageTitle("Users");
        break;
      case location.pathname.startsWith("/admin/info"):
        setHeaderComponent(<HeaderEmpty />);
        setPageTitle("Info");
        break;
      case location.pathname.startsWith("/admin/classes"):
        setHeaderComponent(<HeaderEmpty />);
        setPageTitle("Classes");
        break;
      default:
        setHeaderComponent(null);
        setPageTitle("Dashboard"); // Default title
        break;
    }
  }, [location.pathname]);

  return (
    <>
      <AdminSidebar />
      <div className="relative md:ml-64 bg-blueGray-100">
        <UsersNavbar title={pageTitle} />
        {/* Header */}
        {headerComponent}
        <div className="px-4 md:px-10 mx-auto w-full -m-24">
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="change-password" element={<ChangePassword />} />
            <Route path="users" element={<Users />} />
            <Route path="notifications" element={<Users />} />
            <Route path="users/registration/" element={<Users />} />
            <Route
              path="users/registration/:id"
              element={<UsersRegistrationView />}
            />
            <Route path="users/registration/view/:id" element={<UsersRegistrationView />}></Route>
            <Route path="users/registration/rejected" element={<Users />} />
            <Route path="users/registration/approved" element={<Users />} />
            <Route path="users/view/:id" element={<UsersManagementAction />} />
            <Route path="users/edit/:id" element={<UsersManagementAction />} />
            <Route path="users/add" element={<UsersManagementAction />} />
            <Route path="info" element={<Info />} />
            <Route path="info/teachers" element={<InfoTeacher />} />
            <Route path="info/annoucement" element={<CardAnnouncement />} />

            {/* Fee Management Page */}
            <Route path="fee" element={<Fee />} />
            <Route path="fee/add/:uid" element={<Fee />} />
            <Route path="fee/view/:id" element={<FeeManagementAction />} />
            <Route
              path="fee/view/:id/:feeid"
              element={<FeeManagementViewAction />}
            />
            <Route
              path="fee/edit/:id/:feeid"
              element={<FeeManagementViewAction />}
            />
            <Route
              path="fee/payment-history"
              element={<FeeManagementViewAction />}
            />
            <Route path="fee/classes" element={<FeeClassesAction />} />
            <Route
              path="fee/classes/view/:uid"
              element={<FeeClassesAction />}
            />
            <Route path="fee/classes/add/:uid" element={<FeeClassesAction />} />
            <Route path="fee/classes/:id" element={<FeeClassesAction />} />
            <Route path="fee/voucher" element={<Voucher />} />
            <Route path="fee/voucher/view/:id" element={<Voucher />} />
            <Route path="fee/voucher/add" element={<Voucher />} />
            <Route path="fee/voucher/edit/:id" element={<Voucher />} />

            {/* Attendance Management Page */}
            <Route path="attendance" element={<Attendance />} />
            <Route path="attendance/class/:id" element={<AttendanceAction />} />
            <Route
              path="attendance/class/:id/view/:attdid"
              element={<CardAdminAttendanceViewDetails />}
            />
            <Route
              path="attendance/class/:id/edit/:attdid"
              element={<CardAdminAttendanceEdit />}
            />
            <Route
              path="attendance/record/:id"
              element={<AttendanceAction />}
            />
            <Route path="attendance" element={<Attendance />} />

            {/* Classes Management Page */}
            <Route path="classes" element={<Classes />} />
            <Route path="classes/view/:id" element={<ClassesAction />} />
            <Route path="classes/edit/:id" element={<ClassesAction />} />
            <Route path="classes/add" element={<ClassesAction />} />
            {/* Redirect to dashboard for any other unmatched routes */}
            <Route path="*" element={<Dashboard />} />
          </Routes>
          <FooterAdmin />
        </div>
      </div>
    </>
  );
}
