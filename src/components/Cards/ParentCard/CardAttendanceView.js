import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../../config/context/AuthContext";
import { db } from "../../../config/firebase";
import PropTypes from "prop-types";
import {
  getDoc,
  doc,
} from "firebase/firestore";
import { Link, useLocation, useParams } from "react-router-dom";
import CardLoading from "../CardLoading";

function CardAttendanceView({ color }) {
  const { currentUser } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState(null); // Initialize searchTerm to null
  const [attendanceData, setAttendanceData] = useState([]); // State to store attendance data
  const [loading, setLoading] = useState(true);
  const [selectedAttendance, setSelectedAttendance] = useState(null); // State to track selected attendance
  const attendancesPerPage = 5; // Number of attendance records to display per page
  const { id, stuid } = useParams();
  const location = useLocation();
  const { studentID } = location.state || {};

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        // Fetch student data
        const studentDataRef = doc(db, "students", stuid);
        const studentDataSnapshot = await getDoc(studentDataRef);
        if (!studentDataSnapshot.exists() || studentDataSnapshot.data().parentId !== currentUser.uid) {
          setLoading(false);
          console.log("Student not found");
          return;
        }
        const studentData = {
          id: studentDataSnapshot.id,
          ...studentDataSnapshot.data(),
        };
  
        const attendance = [];
        // Fetch attendance data for the specified student
        const attendanceRef= doc(db, "Attendance",id)
        const attendanceSnapshot = await getDoc(attendanceRef);
        const StudentAttendance = doc(db, "Attendance", id, "studentAttendance", stuid);
        const StudentAttendanceSnapshot = await getDoc(StudentAttendance);
        const classref = doc(db, "class", attendanceSnapshot.data().CourseID);
        const classSnapshot = await getDoc(classref);
        attendance.push({
          id: attendanceSnapshot.id,
          ...attendanceSnapshot.data(),
          studentName: studentData.firstName + " " + studentData.lastName,
          CourseName: classSnapshot.data().CourseName,
          classAttendance: StudentAttendanceSnapshot.data()
        })

  
        // Set the attendance data state
        setAttendanceData(attendance);
        console.log("Attendance data:", attendance);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error("Error fetching data:", error);
      }
    };
  
    fetchAttendanceData();
  }, [currentUser.uid, stuid]);  

  return (
    <>
      {loading ? (
        <CardLoading loading={loading} />
      ) : (
        <div
          className={
            "relative flex flex-col min-w-0 break-words w-full shadow-lg rounded " +
            (color === "light" ? "bg-white" : "bg-lightBlue-900 text-white")
          }
        >
          <div className="flex items-center mb-4 font-bold text-xl">
            <Link
              to="/parent/attendance"
              className="text-blue-500 hover:underline"
            >
              Attendance
            </Link>
            <span className="mx-2">&nbsp;/&nbsp;</span>
            <span className="text-gray-500">View Attendance</span>
          </div>
          <div className="block w-full overflow-x-auto">
            {/* Search input */}
            <div className="flex justify-end my-4 mx-8">
              <input
                type="text"
                placeholder="Search by subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-indigo-500"
                style={{ width: "300px" }}
              />
            </div>
            {/* Attendance table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">Class Name</h2>
              <p className="text-sm">{attendanceData.CourseName}</p>
            </div>
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">Academic Level</h2>
              <p className="text-sm">{attendanceData.Date}</p>
            </div>
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">Class Fee</h2>
              <p className="text-sm">{classDetails.fee}</p>
            </div>
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">Total Registered Students</h2>
              <p className="text-sm">{classDetails.studentID.length}</p>
            </div>
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">Teacher Name</h2>
              <p className="text-sm">{classDetails.location}</p>
            </div>
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">Location</h2>
              <p className="text-sm">{classDetails.location}</p>
            </div>
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">Schedule</h2>
              <ul className="list-disc list-inside">
                {classDetails.schedule.map((day, i) => (
                  <li key={i} className="text-sm">{day.day} ({formatTime(day.startTime)} - {formatTime(day.endTime)})</li>
                ))}
              </ul>
            </div> */}
          </div>
          </div>
        </div>
      )}
    </>
  );
}

CardAttendanceView.defaultProps = {
  color: "light",
};

CardAttendanceView.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardAttendanceView;
