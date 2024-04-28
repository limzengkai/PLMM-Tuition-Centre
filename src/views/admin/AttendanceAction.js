import React from "react";
import { useLocation } from "react-router-dom";

// components

import CardAdminAttendanceView from "../../components/Cards/AdminCard/CardAdminAttendanceView";
import CardAdminAttendanceRecord from "../../components/Cards/AdminCard/CardAdminAttendanceRecord";
import CardAdminAttendanceEdit from "../../components/Cards/AdminCard/CardAdminAttendanceEdit";

export default function FeeClassesAction() {
  const location = useLocation();

  return (
    <>
      <div className="flex flex-wrap mt-4">
        <div className="w-full mb-12 px-4">
          <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
            {location.pathname.startsWith("/admin/attendance/class") ? <CardAdminAttendanceView/> :  location.pathname.startsWith("/admin/attendance/record") ? <CardAdminAttendanceRecord/> :<CardAdminAttendanceEdit/>}
          </div>
        </div>
      </div>
    </>
  );
}