import React from "react";

// components

import CardAdminAttendance from "../../components/Cards/AdminCard/Attendance/CardAdminAttendance";

export default function Settings() {
  return (
    <>
      <div className="flex flex-wrap">
        <div className="w-full px-4">
          <CardAdminAttendance />
        </div>
      </div>
    </>
  );
}
