import React from "react";
import { useParams } from "react-router-dom"; // Import useParams to get the ID from URL parameters

// components
import CardAttendance from "../../components/Cards/ParentCard/CardAttendance";
import CardAttendanceView from "../../components/Cards/ParentCard/CardAttendanceView";

export default function Attendance() {
  const { id } = useParams(); // Get the ID from URL parameters
  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap">
        <div className="w-full">
          {id ? ( // Check if the ID is available
            <CardAttendanceView /> // If ID is available, render CardAttendanceView
          ) : (
            <CardAttendance /> // If ID is not available, render CardAttendance
          )}
        </div>
      </div>
    </>
  );
}