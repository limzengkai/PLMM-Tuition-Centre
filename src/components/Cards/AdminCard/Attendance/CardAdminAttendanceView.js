import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import PropTypes from "prop-types";
import { db } from "../../../../config/firebase";
import CardLoading from "../../CardLoading";
import {
  query,
  collection,
  where,
  getDoc,
  getDocs,
  doc,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import Swal from "sweetalert2";
import MUIDataTable from "mui-datatables";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@emotion/react";

function CardAdminAttendanceView({ color }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const [classData, setClassData] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);

        const classDoc = doc(db, "class", id);
        const classSnap = await getDoc(classDoc);

        if (classSnap.exists()) {
          const classData = { id: classSnap.id, ...classSnap.data() };
          setClassData(classData);

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

          setAttendanceRecords(updatedAttendanceData);
          setFilteredAttendance(updatedAttendanceData); // Initialize filteredAttendance with all attendance records
        } else {
          console.log("Class document not found");
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [id]);

  const handleSearch = () => {
    // Check if both start date and end date are selected
    if (startDate && endDate) {
      // Convert start and end dates to Date objects
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
  
      // Check if start date is greater than end date
      if (startDateObj > endDateObj) {
        alert("End date should be greater than start date.");
        return;
      }
  
      // Check if end date is beyond today
      const today = new Date();
      if (endDateObj > today) {
        alert("End date cannot be beyond today's date.");
        return;
      }
  
      // Filter attendance records based on date range
      const filtered = attendanceRecords.filter((attendance) => {
        const attendanceDate = new Date(attendance.Date.toDate());
        return attendanceDate >= startDateObj && attendanceDate <= endDateObj;
      });
      setFilteredAttendance(filtered);
    } else {
      // If either start date or end date is not selected, show alert
      alert("Please select both start date and end date.");
    }
  };
  
  const handleDeleteAttendance = async (attendanceId) => {
    // Show confirmation dialog
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        // Delete attendance record from the attendance collection
        try {
          const attendanceCollectionRef = collection(db, "Attendance");
          const attendanceSubCollectionRef = collection(
            attendanceCollectionRef,
            attendanceId,
            "studentAttendance"
          );
          // Delete all student attendance records
          await deleteDoc(doc(attendanceCollectionRef, attendanceId));
          // Delet SubCollection
          await deleteDoc(doc(attendanceSubCollectionRef, attendanceId));
          const updatedAttendanceRecords = attendanceRecords.filter(
            (attendance) => attendance.id !== attendanceId
          );
          // Use Swal2
          Swal.fire({
            icon: "success",
            title: "Attendance record deleted successfully",
            showConfirmButton: false,
            timer: 1500,
          });

          setAttendanceRecords(updatedAttendanceRecords);
          setFilteredAttendance(updatedAttendanceRecords);
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "An error occurred. Please try again.",
            showConfirmButton: false,
            timer: 1500,
          });
        }
      }
    });
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setFilteredAttendance(attendanceRecords); // Reset filtered attendance to all attendance records
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

  const columns = [
    { name: "DATE" },
    { name: "START TIME" },
    { name: "END TIME" },
    { name: "ATTEND NUMBER", options: { filter: false, sort: false } },
    {
      name: "ACTIONS",
      options: { filter: false, sort: false },
    },
  ];

  const data = filteredAttendance.map((attendance) => [
    attendance.Date.toDate().toLocaleDateString(),
    getTime(attendance.StartTime),
    getTime(attendance.EndTime),
    `${
      attendance.studentAttendance.filter((student) => student.status).length
    } / ${attendance.studentAttendance.length}`,
    <div>
      <Link
        to={`/admin/attendance/class/${id}/view/${attendance.id}`}
        className="mr-3 text-white rounded-full font-bold py-2 px-4 bg-blue-500"
      >
        View
      </Link>
      <Link
        to={`/admin/attendance/class/${id}/edit/${attendance.id}`}
        className="text-white rounded-full font-bold py-2 px-4 bg-yellow-500"
      >
        Edit
      </Link>
      <button
        className="text-white rounded-full font-bold py-2 px-4 ml-3 bg-red-500"
        onClick={() => handleDeleteAttendance(attendance.id)}
      >
        Delete
      </button>
    </div>,
  ]);

  const getMuiTheme = () =>
    createTheme({
      typography: {
        fontFamily: "Poppins",
      },
      overrides: {
        MUIDataTableHeadCell: { root: { fontSize: "12px" } },
        MUIDataTableBodyCell: { root: { fontSize: "12px" } },
      },
    });

  const options = {
    responsive: "standard",
    selectableRows: "none",
    downloadOptions: { excludeColumns: [3] },
    rowsPerPage: 5,
    rowsPerPageOptions: [5, 10, 20],
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
          <div className="flex justify-between mx-8 mt-4 mb-2">
            <div >
              <p className="font-bold mb-2">
                Class Name: {classData && classData.CourseName}
              </p>
              <p className="font-bold">
                School Level: {classData && classData.academicLevel}
              </p>
            </div>
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
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-indigo-500 mr-4"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:bg-blue-600"
              >
                Search
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:bg-gray-600 ml-4"
              >
                Reset
              </button>
            </div>
          </div>
          <div className="block w-full overflow-x-auto">
            <ThemeProvider theme={getMuiTheme()}>
              <MUIDataTable data={data} columns={columns} options={options} />
            </ThemeProvider>
          </div>
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
