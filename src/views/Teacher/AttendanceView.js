import React from "react";

// components
import CardViewAttendance from "../../components/Cards/TeacherCard/CardViewAttendance";
import CardTeacherAttendance from "../../components/Cards/TeacherCard/CardTeacherAttendance";


export default function AttendanceView() {
  return (
    <>      {/* Header */}
      <div className="flex flex-wrap mt-4">
        <div className="w-full mb-12 px-4">
          <CardTeacherAttendance />
        </div>
      </div>
    </>
  );
}