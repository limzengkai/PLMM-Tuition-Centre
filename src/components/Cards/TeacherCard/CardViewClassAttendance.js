import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../../config/context/AuthContext";
import { Link, useParams } from "react-router-dom";
import PropTypes from "prop-types";
import { db } from "../../../config/firebase";
import CardLoading from "../CardLoading";
import {
  query,
  collection,
  where,
  getDocs,
  getDoc,
  limit,
  doc,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import MUIDataTable from "mui-datatables";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@emotion/react";
import Swal from "sweetalert2";

function CardViewClassAttendance({ color }) {
  const { id } = useParams();
  const { currentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [classData, setClassData] = useState(null); // Define classData state

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        // Query the teacher collection to find the document matching the current user's userID
        const teacherQuery = query(
          collection(db, "teacher"),
          where("userID", "==", currentUser.uid),
          limit(1)
        );
        const teacherSnapshot = await getDocs(teacherQuery);

        if (!teacherSnapshot.empty) {
          // Query the class document
          const classDoc = doc(db, "class", id);
          const classSnap = await getDoc(classDoc);

          if (classSnap.exists()) {
            const classData = { id: classSnap.id, ...classSnap.data() };

            // fetch schedule data for each class
            const scheduleQuery = collection(db, "class", id, "Schedule");

            const scheduleSnapshot = await getDocs(scheduleQuery);
            const scheduleData = scheduleSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            classData.scheduleData = scheduleData;
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
                const studentAttendanceData =
                  studentAttendanceSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                  }));
                record.studentAttendance = studentAttendanceData;
                return record;
              })
            );

            // Update state with attendance records
            setAttendanceRecords(updatedAttendanceData);
          } else {
            console.log("Class document not found");
          }
        } else {
          console.log("No teacher document found for the current user");
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      }
    };

    fetchAttendanceData();
  }, [id, currentUser.uid]);

  useEffect(() => {
    console.log(classData);
  }, [classData]);

  const deleteRecord = async (recordId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, "Attendance", recordId));
        // Filter out the deleted record from the attendanceRecords state
        setAttendanceRecords(
          attendanceRecords.filter((record) => record.id !== recordId)
        );
        Swal.fire("Deleted!", "Your record has been deleted.", "success");
      } catch (error) {
        console.error("Error deleting attendance record:", error);
        Swal.fire("Error!", "There was an error deleting the record.", "error");
      }
    }
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
    { name: "Date" },
    { name: "Start Time" },
    { name: "End Time" },
    { name: "Attend Number", options: { filter: false, sort: false } },
    { name: "Action", options: { filter: false, sort: false } },
  ];

  const data = attendanceRecords.map((record) => [
    record.Date.toDate().toLocaleDateString(),
    getTime(record.StartTime),
    getTime(record.EndTime),
    `${record.studentAttendance.filter((student) => student.status).length} / ${
      record.studentAttendance.length
    }`,
    <div className="flex">
      <Link
        to={`/teacher/attendance/class/${id}/view/${record.id}`}
        className="mr-3 text-black rounded-full font-bold py-1 px-4 bg-blue-500"
      >
        View
      </Link>
      <Link
        to={`/teacher/attendance/class/${id}/edit/${record.id}`}
        className="mr-3 text-white rounded-full font-bold py-1 px-4 bg-green-500"
      >
        Edit
      </Link>
      <button
        onClick={() => deleteRecord(record.id)}
        className="text-white rounded-full font-bold py-1 px-4 bg-red-500"
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
      components: {
        MUIDataTableHeadCell: {
          fixedHeaderCommon: {
            backgroundColor: "transparent",
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
    downloadOptions: { excludeColumns: [3] },
    rowsPerPage: 5,
    rowsPerPageOptions: [5, 10, 20],
  };

  return (
    <>
      {loading ? (
        <CardLoading loading={loading} />
      ) : (
        <div className="flex flex-wrap mt-4">
          <div className="w-full mb-12 px-4">
            <div
              className={`relative mx-auto px-4 py-8 flex flex-col min-w-0 break-words w-full shadow-lg rounded ${
                color === "light" ? "bg-white" : "bg-lightBlue-900 text-white"
              }`}
            >
              <div className="flex items-center mb-4 font-bold text-xl">
                <Link
                  to="/teacher/attendance"
                  className="text-blue-500 hover:underline"
                >
                  Attendance
                </Link>
                <span className="mx-2">&nbsp;/&nbsp;</span>
                <span className="text-gray-500">Attendance Record</span>
              </div>
              <div className="flex justify-between mx-8 mt-4 mb-2">
                <div>
                  <p className="font-bold">
                    Class Name: {classData && classData.CourseName}
                  </p>
                  <p className="font-bold">
                    Academic Level: {classData && classData.academicLevel}
                  </p>
                  <p className="font-bold">
                    Registered Student:{" "}
                    {classData && classData.studentID.length} /{" "}
                    {classData && classData.MaxRegisteredStudent}
                  </p>
                  <p className="font-bold mt-4">
                    Schedule @ Location:
                    {classData &&
                      classData.scheduleData.map((schedule) => (
                        <div key={schedule.id}>
                          <p>
                            {schedule.day} - {getTime(schedule.startTime)} -{" "}
                            {getTime(schedule.endTime)} @ {schedule.location}
                          </p>
                        </div>
                      ))}
                  </p>
                </div>
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
          </div>
        </div>
      )}
    </>
  );
}

CardViewClassAttendance.defaultProps = {
  color: "light",
};

CardViewClassAttendance.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardViewClassAttendance;
