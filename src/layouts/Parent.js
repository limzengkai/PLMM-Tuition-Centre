import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// components
import ParentNavbar from "../components/Navbars/ParentNavbar.js";
import Sidebar from "../components/Sidebar/ParentSidebar.js";
// import HeaderDashboard from "../components/Headers/HeaderDashboard.js";
// import HeaderFee from "../components/Headers/HeaderFee.js";
// import HeaderAttendance from "../components/Headers/HeaderAttendance.js";
// import HeaderClasses from "../components/Headers/HeaderClasses.js";
import PaymentClassRegistered from "../components/Cards/ParentCard/Classes/PaymentClassRegistered.js";
import HeaderStats from "../components/Headers/Parent/HeaderStats.js";
import HeaderEmpty from "../components/Headers/HeaderEmpty";
import FooterAdmin from "../components/Footers/FooterAdmin.js";

// views
import Dashboard from "../views/Parent/Dashboard.js";
import Attendance from "../views/Parent/Attendance.js";
import Profile from "../views/Parent/Profile";
import Class from "../views/Parent/Class.js";
import Fees from "../views/Parent/Fees.js";
import TestResult from "../views/Parent/TestResult.js";
import Payment from "../views/Parent/Payment.js";
import ChangePassword from "../views/Parent/ChangePassword.js";

export default function Parent() {
  const location = useLocation();
  const [headerComponent, setHeaderComponent] = useState(null);
  const [pageTitle, setPageTitle] = useState(null);

  useEffect(() => {
    // Update header component and page title based on the current path
    switch (true) {
      case location.pathname === "/parent/dashboard":
        setHeaderComponent(<HeaderStats />);
        setPageTitle("Dashboard");
        break;
      case location.pathname === "/parent/profile":
        setPageTitle("Profile");
        setHeaderComponent(<HeaderEmpty />);
        break;
      case location.pathname.startsWith("/parent/fee"):
        setHeaderComponent(<HeaderEmpty />);
        setPageTitle("Fees");
        break;
      case location.pathname.startsWith("/parent/change-password"):
        setHeaderComponent(<HeaderEmpty />);
        setPageTitle("Changing Password");
        break;
      case location.pathname.startsWith("/parent/attendance"):
        setHeaderComponent(<HeaderEmpty />);
        setPageTitle("Attendance");
        break;
      case location.pathname.startsWith("/parent/classes"):
        setHeaderComponent(<HeaderEmpty />);
        setPageTitle("Classes");
        break;
      case location.pathname.startsWith("/parent/testresult"):
        setHeaderComponent(<HeaderEmpty />);
        setPageTitle("Test Results");
        break;
      case location.pathname.startsWith("/parent/new-class"):
        setHeaderComponent(<HeaderEmpty />);
        setPageTitle("Payment");
        break;
      default:
        setHeaderComponent(null);
        setPageTitle("");
        break;
    }
  }, [location.pathname]);

  return (
    <>
      <Sidebar />
      <div className="flex flex-col relative md:ml-64 bg-blueGray-100 min-h-screen">
        <ParentNavbar title={pageTitle} />
        {headerComponent}
        <div className="px-4 md:px-10 mx-auto w-full -m-24">
          <div className="flex-grow">
            <Routes>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="fee" element={<Fees />} />
              <Route path="change-password" element={<ChangePassword />} />
              <Route path="fee/view/:id" element={<Fees />} />
              <Route path="attendance" element={<Attendance />} />
              <Route
                path="attendance/:id/view/:stuid"
                element={<Attendance />}
              />
              <Route path="new-class/payment" element={<PaymentClassRegistered/>}></Route>
              <Route path="classes" element={<Class />} />
              <Route path="classes/register" element={<Class />} />
              <Route path="testresult" element={<TestResult />} />
              <Route path="fee/payment/:id" element={<Payment />} />
              <Route path="*" element={<Navigate to="/parent/dashboard" />} />
            </Routes>
          </div>

          <FooterAdmin />
        </div>
      </div>
    </>
  );
}
