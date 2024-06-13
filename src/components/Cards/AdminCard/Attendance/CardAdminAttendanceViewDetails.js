import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../../../config/context/AuthContext";
import { Link, useNavigate, useParams } from "react-router-dom";
import PropTypes from "prop-types";
import { db } from "../../../../config/firebase";
import CardLoading from "../../CardLoading";
import { collection, getDocs, getDoc, doc, deleteDoc } from "firebase/firestore";
import MUIDataTable from "mui-datatables";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@emotion/react";
import Swal from "sweetalert2";

function CardAdminViewAttendanceDetails({ color }) {
  const { id, attdid } = useParams();
  const { currentUser } = useContext(AuthContext);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        // Query the class document
        const classDoc = doc(db, "class", id);
        const classSnap = await getDoc(classDoc);
        if (classSnap.exists()) {
          const classData = { id: classSnap.id, ...classSnap.data() };
          setClassData(classData);

          // Query the attendance document
          const attendanceDoc = doc(db, "Attendance", attdid);
          const attendanceSnapshot = await getDoc(attendanceDoc);

          if (attendanceSnapshot.exists()) {
            const attendanceData = {
              id: attendanceSnapshot.id,
              ...attendanceSnapshot.data(),
            };

            // Fetch student attendance data from the subcollection
            const studentAttendanceRef = collection(
              db,
              "Attendance",
              attdid,
              "studentAttendance"
            );
            const studentAttendanceSnapshot = await getDocs(
              studentAttendanceRef
            );

            const studentAttendanceData = studentAttendanceSnapshot.docs.map(
              (doc) => ({
                id: doc.id,
                ...doc.data(),
              })
            );

            attendanceData.studentAttendance = studentAttendanceData;

            const studentRef = collection(db, "students");
            const studentSnapshot = await getDocs(studentRef);
            const studentData = studentSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            attendanceData.studentAttendance.forEach((studentAttendance) => {
              const student = studentData.find(
                (data) => data.id === studentAttendance.id
              );
              studentAttendance.studentName = student
                ? student.firstName + " " + student?.lastName
                : "Unknown Student";
            });

            // Update state with attendance record
            setAttendanceRecords(attendanceData);
            setLoading(false);
          } else {
            console.log("Attendance document not found");
          }
        } else {
          console.log("Class document not found");
        }
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      }
    };

    fetchAttendanceData();
  }, [id, currentUser.uid, attdid]);

  const getDate = (timestamp) => {
    if (timestamp && timestamp.toDate) {
      const d = timestamp.toDate();
      const day = d.getDate();
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return "Unknown Date";
  };

  const getTime = (timestamp) => {
    if (timestamp && timestamp.toDate) {
      const d = timestamp.toDate();
      const hours = d.getHours();
      const minutes = d.getMinutes();
      const amOrPm = hours >= 12 ? "PM" : "AM";
      const hourFormat = hours % 12 || 12;
      const minuteFormat = minutes < 10 ? `0${minutes}` : minutes;
      return `${hourFormat}:${minuteFormat} ${amOrPm}`;
    }
    return "Unknown Time";
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
          // Use Swal2
          Swal.fire({
            icon: "success",
            title: "Attendance record deleted successfully",
            showConfirmButton: false,
            timer: 1500,
          });
          navigate(`/admin/attendance/class/${id}`);

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

  const columns = [
    {
      name: "studentName",
      label: "Student Name",
    },
    {
      name: "status",
      label: "Attend Number",
      options: {
        customBodyRender: (value) => (
          <span
            className={`rounded-full px-2 py-1 ${
              value ? "bg-yellow-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {value ? "Present" : "Absent"}
          </span>
        ),
      },
    },
    {
      name: "comment",
      label: "Comment",
      options: {
        customBodyRender: (value) =>
          value !== null && value.trim() !== "" ? value : "No Comment",
      },
    },
  ];

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

  const data = attendanceRecords.studentAttendance
    ? attendanceRecords.studentAttendance.map((attendance) => [
        attendance.studentName,
        attendance.status,
        attendance.comment,
      ])
    : [];

  return (
    <>
      {loading ? (
        <CardLoading loading={loading} />
      ) : (
        <div
          className={`relative mx-auto px-4 py-8 flex flex-col min-w-0 break-words w-full shadow-lg rounded ${
            color === "light" ? "bg-white" : "bg-lightBlue-900 text-white"
          }`}
        >
          <div className="flex items-center mb-4 font-bold text-xl">
            <Link
              to="/admin/attendance"
              className="text-blue-500 hover:underline"
            >
              Attendance
            </Link>
            <span className="mx-2">&nbsp;/&nbsp;</span>
            <Link
              to={`/admin/attendance/class/${id}`}
              className="text-blue-500 hover:underline"
            >
              Attendance Record
            </Link>
            <span className="mx-2">&nbsp;/&nbsp;</span>
            <span className="text-gray-500">
              {classData && classData.CourseName} Attendance
            </span>
          </div>
          {/* Class details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="border rounded-lg p-2">
              <h2 className="text-md font-bold mb-2">
                Class Name:{" "}
                <span className="text-sm font-semibold">
                  {classData && classData.CourseName}
                </span>
              </h2>
            </div>
            <div className="border rounded-lg p-2">
              <h2 className="text-md font-semibold mb-2">
                Academic Level:{" "}
                <span className="text-sm">
                  {classData && classData.academicLevel}
                </span>
              </h2>
            </div>
            <div className="border rounded-lg p-2">
              <h2 className="text-md font-semibold">
                Total Registered Students:{" "}
                <span className="text-sm">
                  {classData && classData.studentID.length} /{" "}
                  {classData && classData.MaxRegisteredStudent}
                </span>
              </h2>
            </div>
            <div className="border rounded-lg p-2">
              <h2 className="text-md font-semibold">
                Location:{" "}
                <span className="text-sm">
                  {classData && classData.location}
                </span>
              </h2>
            </div>
            <h1 className="col-span-2 text-center font-bold text-2xl underline">
              Class Time
            </h1>
            {attendanceRecords && (
              <div className="border rounded-lg p-2 col-span-2">
                <h2 className="text-md font-semibold">
                  Attendance Date:{" "}
                  <span className="text-sm">
                    {attendanceRecords && getDate(attendanceRecords.Date)}
                  </span>
                </h2>
              </div>
            )}
            {attendanceRecords && (
              <div className="border rounded-lg p-2">
                <h2 className="text-md font-semibold">
                  Start Time:{" "}
                  <span className="text-sm">
                    {attendanceRecords && getTime(attendanceRecords.StartTime)}
                  </span>
                </h2>
              </div>
            )}
            {attendanceRecords && (
              <div className="border rounded-lg p-2">
                <h2 className="text-md font-semibold">
                  End Time:{" "}
                  <span className="text-sm">
                    {attendanceRecords && getTime(attendanceRecords.EndTime)}
                  </span>
                </h2>
              </div>
            )}
          </div>
          <div className="mt-6 block w-full overflow-x-auto">
            <ThemeProvider theme={getMuiTheme()}>
              <MUIDataTable
                data={data}
                columns={columns}
                options={{
                  selectableRows: "none",
                  search: false,
                  filter: false,
                  download: false,
                  print: false,
                  viewColumns: false,
                }}
              />
            </ThemeProvider>
          </div>
          {/* // Add Edit navigation and Delete button */}
          <div className="flex justify-center mt-4">
            <Link
              to={`/admin/attendance/class/${id}/edit/${attdid}`}
              className="rounded-lg font-bold py-2 px-4 bg-blue-500 text-white hover:bg-blue-600"
            >
              Edit
            </Link>
            <button
              className="rounded-lg font-bold py-2 px-4 bg-red-500 text-white hover:bg-red-600 ml-2"
              onClick={() => {
                handleDeleteAttendance(attdid);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </>
  );
}

CardAdminViewAttendanceDetails.defaultProps = {
  color: "light",
};

CardAdminViewAttendanceDetails.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardAdminViewAttendanceDetails;
