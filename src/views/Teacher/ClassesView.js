import React from "react";

// components
import CardViewClasses from "../../components/Cards/TeacherCard/CardViewClasses";
import CardTeacherClasses from "../../components/Cards/TeacherCard/CardTeacherClasses";
import { useLocation } from "react-router-dom";

export default function AttendanceView() {
  const location = useLocation( )
  return (
    <>      {/* Header */}
      <div className="flex flex-wrap mt-4">
        <div className="w-full mb-12 px-4">
          {location.pathname.includes("/teacher/classes/view")? <CardViewClasses/> : <CardTeacherClasses/>}
        </div>
      </div>
    </>
  );
}