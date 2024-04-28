import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../../config/context/AuthContext";
import { db } from "../../../config/firebase";
import PropTypes from "prop-types";
import CardPagination from "../CardPagination";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  orderBy,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import CardLoading from "../CardLoading";
import Swal from 'sweetalert2';

function AttendancePage({ color }) {
  const { currentUser } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const attendancesPerPage = 5;

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        const studentDataQuery = query(
          collection(db, "students"),
          where("parentId", "==", currentUser.uid)
        );
        const studentDataSnapshot = await getDocs(studentDataQuery);
        const studentData = [];

        studentDataSnapshot.forEach((doc) => {
          studentData.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        const attendance = [];
        for (const student of studentData) {
          for (const course of student.registeredCourses) {
            const attendanceQuery = query(
              collection(db, "Attendance"),
              where("CourseID", "==", course),
              orderBy("Date", "desc")
            );
            const attendanceSnapshot = await getDocs(attendanceQuery);
            for (const document of attendanceSnapshot.docs) {
              const studentAttendanceRef = doc(
                db,
                "Attendance",
                document.id,
                "studentAttendance",
                student.id
              );
              const studentAttendanceSnapshot = await getDoc(
                studentAttendanceRef
              );

              const classref = doc(db, "class", document.data().CourseID);
              const classSnapshot = await getDoc(classref);
              if (studentAttendanceSnapshot.exists()) {
                attendance.push({
                  id: document.id,
                  ...document.data(),
                  className: classSnapshot.data().CourseName,
                  studentID: student.id,
                  studentName: student.firstName + " " + student.lastName,
                  studentAttendance: studentAttendanceSnapshot.data(),
                });
              }
            }
          }
        }

        setAttendanceData(attendance);
        setLoading(false);
        console.log("Attendance data: ", attendance)
      } catch (error) {
        setLoading(false);
        console.error("Error fetching data:", error);
      }
    };

    fetchAttendanceData();
  }, []);



  const filteredAttendances =
    searchTerm === null
      ? attendanceData
      : attendanceData.filter((attendance) =>
          attendance.className?.toLowerCase().includes(searchTerm.toLowerCase())
        );

  const indexOfLastAttendance = currentPage * attendancesPerPage;
  const indexOfFirstAttendance = indexOfLastAttendance - attendancesPerPage;
  const currentAttendances = filteredAttendances.slice(
    indexOfFirstAttendance,
    indexOfLastAttendance
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const totalPages = Math.ceil(filteredAttendances.length / attendancesPerPage);

  const pageNumbers = [];
  if (totalPages <= 10) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    const leftBound = Math.max(1, currentPage - 4);
    const rightBound = Math.min(currentPage + 5, totalPages);

    if (currentPage < 6) {
      for (let i = 1; i <= 10; i++) {
        pageNumbers.push(i);
      }
    } else if (currentPage >= totalPages - 5) {
      for (let i = totalPages - 9; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      for (let i = leftBound; i <= rightBound; i++) {
        pageNumbers.push(i);
      }
    }
  }

  const getDate = (timestamp) => {
    if (timestamp && timestamp.toDate) {
      const d = timestamp.toDate();
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, "0");
      const day = d.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    return "";
  };

  const getTime = (timestamp) => {
    if (timestamp && timestamp.toDate) {
      const d = timestamp.toDate();
      let hours = d.getHours();
      const period = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      const minutes = d.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes} ${period}`;
    }
    return null;
  };

  const handleCommentClick = (comment) => {
    Swal.fire({
      title: 'Attendance Comment',
      text: comment.trim() != "" ? comment: "No comment available",
      icon: 'info',
      confirmButtonText: 'Close',
    });
  };

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
          <div className="relative w-full px-4 max-w-full flex-grow flex-1">
            <h3
              className={
                "font-semibold text-lg " +
                (color === "light" ? "text-blueGray-700" : "text-white")
              }
            >
              Attendance
            </h3>
          </div>
          <div className="block w-full overflow-x-auto">
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
            <table className="table-auto items-center w-full bg-transparent border-collapse">
              <thead>
                <tr>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Student Name
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Subject
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Status
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Date
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Class Date
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Class ID
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentAttendances.map((attendance) => (
                  <tr key={attendance.id}>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {attendance.studentName}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {attendance.className}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                    <span className={`p-2 rounded-full font-bold ${attendance.studentAttendance.status ? 'bg-yellow-300' : 'bg-red-500'}`}>
                      {attendance.studentAttendance.status ? "Present" : "Absent"}
                    </span>
                  </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {getDate(attendance.Date)}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {getTime(attendance.StartTime)}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {getTime(attendance.EndTime)}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      <button 
                        onClick={() => handleCommentClick(attendance.studentAttendance.comment)}
                        className="bg-blue-500 text-white py-2 px-4 rounded-full mr-4 hover:bg-blue-600"
                      >View Comment</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <CardPagination
            currentPage={currentPage}
            totalPages={totalPages}
            paginate={paginate}
          />
        </div>
      )}
    </>
  );
}

AttendancePage.defaultProps = {
  color: "light",
};

AttendancePage.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default AttendancePage;
