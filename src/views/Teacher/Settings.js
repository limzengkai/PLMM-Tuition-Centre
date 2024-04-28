import React from "react";

// components
import CardTeacherAttendance from "../../components/Cards/TeacherCard/CardTeacherAttendance";

export default function Settings() {
  return (
    <>      {/* Header */}
      <div className="flex flex-wrap mt-4">
        <div className="w-full mb-12 px-4">
          <CardTeacherAttendance/>
        </div>
      </div>
    </>
  );
}
