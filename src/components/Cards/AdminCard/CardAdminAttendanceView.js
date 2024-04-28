import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import PropTypes from "prop-types";
import { db } from "../../../config/firebase";
import CardPagination from "../CardPagination";
import CardLoading from "../CardLoading";
import {
  query,
  collection,
  where,
  getDoc, 
  getDocs,
  doc,
  orderBy,
} from "firebase/firestore";

function CardAdminAttendanceView({ color }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState(null); // State to track selected class
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const [classData, setClassData] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  const classesPerPage = 5; // Number of classes to display per page

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true); // Set loading to true before fetching data

        // Get class Document
        const classDoc = doc(db, "class", id);
        const classSnap = await getDoc(classDoc);

        if (classSnap.exists()) {
          const classData = { id: classSnap.id, ...classSnap.data() };
          setClassData(classData);

          // Query the attendance collection for records related to the class
          const attendanceQuery = query(
            collection(db, "Attendance"),
            where("CourseID", "==", id),
            orderBy("Date", "desc"),
            orderBy("StartTime", "desc")
          );
          const attendanceSnapshot = await getDocs(attendanceQuery);

          const attendanceData = attendanceSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Fetch and assign student attendance data to corresponding attendance records
          const updatedAttendanceData = await Promise.all(
            attendanceData.map(async (record) => {
              const studentAttendanceQuery = query(
                collection(db, "Attendance", record.id, "studentAttendance")
              );
              const studentAttendanceSnapshot = await getDocs(
                studentAttendanceQuery
              );
              const studentAttendanceData = studentAttendanceSnapshot.docs.map(
                (doc) => ({
                  id: doc.id,
                  ...doc.data(),
                })
              );
              record.studentAttendance = studentAttendanceData;
              return record;
            })
          );

          // Update state with attendance records
          setAttendanceRecords(updatedAttendanceData);
        } else {
          console.log("Class document not found");
        }

        setLoading(false); // Set loading to false after fetching data
      } catch (error) {
        console.error("Error fetching attendance data:", error);
        setLoading(false); // Ensure loading state is updated even in case of error
      }
    };

    fetchAttendanceData();
  }, [id]);

  // Perform search based on selected start and end dates
  const filteredAttendance = attendanceRecords.filter((attendance) => {
    if (startDate && endDate) {
      const attendanceDate = new Date(attendance.Date.toDate());
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      return attendanceDate >= startDateObj && attendanceDate <= endDateObj;
    }
    return true;
  });

  // Calculate indexes for pagination
  const indexOfLastAttendance = currentPage * classesPerPage;
  const indexOfFirstAttendance = indexOfLastAttendance - classesPerPage;
  const currentAttendance = filteredAttendance.slice(
    indexOfFirstAttendance,
    indexOfLastAttendance
  );

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Calculate total number of pages
  const totalPages = Math.ceil(filteredAttendance.length / classesPerPage);

  // Handle search button click
  const handleSearch = () => {
    // Check conditions before performing the search
    if (endDate < startDate) {
      alert("End date cannot be less than start date");
      return;
    }

    const now = new Date().toLocaleDateString();
    if (
      new Date(endDate) > new Date(now) ||
      new Date(startDate) > new Date(now)
    ) {
      alert("Selected dates cannot be beyond today's date");
      return;
    }

    // Update the filtered attendance data
    setCurrentPage(1); // Reset pagination to first page
  };

  const getTime = (timestamp) => {
    const d = timestamp.toDate();
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const amOrPm = hours >= 12 ? "PM" : "AM";
    const hourFormat = hours % 12 || 12;
    const minuteFormat = minutes < 10 ? `0${minutes}` : minutes;
    return `${hourFormat}:${minuteFormat} ${amOrPm}`;
  };

  return (
    <>
      {loading ? (
        <CardLoading loading={loading} />
      ) : (
        <div
          className={
            "relative flex flex-col mt-4 min-w-0 break-words w-full shadow-lg rounded " +
            (color === "light" ? "bg-white" : "bg-lightBlue-900 text-white")
          }
        >
          <div className="flex items-center mb-4 ml-4 font-bold text-xl">
            <Link
              to={"/admin/attendance"}
              className="text-blue-500 hover:underline"
            >
              Attendance
            </Link>
            <span className="mx-2">&nbsp;/&nbsp;</span>
            <span className="text-gray-500">Attendance List</span>
          </div>
          {/* Class and school level details */}
          <div className="flex justify-between mx-8 mt-4 mb-2">
            <div>
              <p className="font-bold">
                Class Name: {classData && classData.CourseName}
              </p>
              <p className="font-bold">
                School Level: {classData && classData.academicLevel}
              </p>
            </div>
            {/* Date range inputs */}
            <div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-indigo-500 mr-4"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-indigo-500 mr-4"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:bg-blue-600"
              >
                Search
              </button>
            </div>
          </div>
          {/* Attendance list */}
          <div className="block w-full overflow-x-auto">
            {/* Attendance table */}
            <table className="w-full bg-transparent border-collapse">
              {/* Table headers */}
              <thead>
                <tr>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    No
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Date
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Start Time
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    End Time
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Attend Number
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Action
                  </th>
                </tr>
              </thead>
              {/* Table body */}
              <tbody>
                {currentAttendance.map((attendance, index) => (
                  <tr key={attendance.id}>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {index + 1}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {attendance.Date.toDate().toLocaleDateString()}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {getTime(attendance.StartTime)}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {getTime(attendance.EndTime)}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {
                        attendance.studentAttendance.filter(
                          (student) => student.status
                        ).length
                      }{" "}
                      / {attendance.studentAttendance.length}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      <Link
                        to={`/admin/attendance/class/${id}/view/${attendance.id}`}
                        className="mr-3 text-black rounded-full font-bold py-2 px-4 bg-blue-500"
                      >
                        View
                      </Link>
                      <Link
                        className="text-white rounded-full font-bold py-2 px-4 bg-green-500"
                        to={`/admin/attendance/class/${id}/edit/${attendance.id}`}
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
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

CardAdminAttendanceView.defaultProps = {
  color: "light",
};

CardAdminAttendanceView.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardAdminAttendanceView;
