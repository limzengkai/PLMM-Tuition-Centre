import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../../config/context/AuthContext";
import { db } from "../../../config/firebase";
import PropTypes from "prop-types";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  orderBy,
} from "firebase/firestore";
import CardLoading from "../CardLoading";
import Swal from 'sweetalert2';
import MUIDataTable from "mui-datatables";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@emotion/react";

function AttendancePage({ color }) {
  const { currentUser } = useContext(AuthContext);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

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

        const attendanceRef = collection(db, "Attendance");
        const attendanceSnapshot = await getDocs(attendanceRef);
        const attendanceData = [];
        attendanceSnapshot.forEach((doc) => {
          attendanceData.push({
            id: doc.id,
            ...doc.data(),
          });
          console.log(doc.id, " => ", doc.data());
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
  
  const columns = [
    { name: "Student Name" },
    { name: "Subject" },
    { name: "Status",
      options: {
        customBodyRender: (value) => (
          <p
            className={`py-1 px-3 inline-flex text-xs leading-5 font-semibold rounded-full ${
              value === 'Present' ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {value}
          </p>
        )
      }
    },
    { name: "Date"},
    { name: "Start Time"},
    { name: "End Time"},
    { name: "Actions", options: { filter: false, sort: false } },
  ];

  const data = attendanceData.map((attendance) => [
    attendance.studentName,
    attendance.className,
    attendance.studentAttendance.status ? "Present" : "Absent",
    getDate(attendance.Date),
    getTime(attendance.StartTime),
    getTime(attendance.EndTime),
    <div className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
    <button 
      onClick={() => handleCommentClick(attendance.studentAttendance.comment)}
      className="bg-blue-500 text-white py-2 px-4 rounded-full mr-4 hover:bg-blue-600"
    >View Comment</button>
    </div>,
  ]);

  const getMuiTheme = () =>
    createTheme({
      typography: {
        fontFamily: "Poppins",
      },
      components: {
        MUIDataTableHeadCell: {
          fixedHeaderCommon: {
            backgroundColor: "transparent"
          },
          styleOverrides: {
            root: {
              fontSize: "12px", // Adjusted font size
              textAlign: "center",
            },
          },
        },
        MUIDataTableBodyCell: {
          styleOverrides: {
            root: {
              fontSize: "12px", // Adjusted font size
            },
          },
        },
      },
    });

  const options = {
    responsive: "standard",
    selectableRows: "none",
    downloadOptions: { excludeColumns: [0, 3] },
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
            <ThemeProvider theme={getMuiTheme()}>
              <MUIDataTable
                data={data}
                columns={columns}
                options={options}
              />
            </ThemeProvider>
          </div>
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
