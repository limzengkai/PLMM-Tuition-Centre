import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../../config/context/AuthContext";
import { Link, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PropTypes from "prop-types";
import CardLoading from "../CardLoading";
import { db } from "../../../config/firebase";
import {
  query,
  collection,
  where,
  getDocs,
  getDoc,
  limit,
  doc,
  orderBy,
  addDoc,
  setDoc,
} from "firebase/firestore";

function CardRecordAttendance({ color }) {
  const { id } = useParams();
  const { currentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [classData, setClassData] = useState(null);
  const [attendanceData, setAttendanceData] = useState({
    studentAttendance: [],
  });
  const [editedDate, setEditedDate] = useState(new Date());
  const [editedStartTime, setEditedStartTime] = useState(new Date());
  const [editedEndTime, setEditedEndTime] = useState(new Date());

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        const teacherQuery = query(
          collection(db, "teacher"),
          where("userID", "==", currentUser.uid),
          limit(1)
        );
        const teacherSnapshot = await getDocs(teacherQuery);

        if (!teacherSnapshot.empty) {
          const teacherData = teacherSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))[0];
          console.log("Teacher Data: ", teacherData);

          const classDoc = doc(db, "class", id);
          const classSnap = await getDoc(classDoc);

          if (classSnap.exists()) {
            const classData = { id: classSnap.id, ...classSnap.data() };
            setClassData(classData);
              const studentQuery = query(
                collection(db, "students"),
                where("registeredCourses", "array-contains", id),
                orderBy("firstName")
              );
              const studentSnapshot = await getDocs(studentQuery);
              const studentData = studentSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              setStudents(studentData);
              attendanceData.studentAttendance = studentData.map((student) => ({
                id: student.id,
                studentName: `${student.firstName} ${student.lastName}`,
                status: true,
                comment: "",
              }));
              console.log("attendance data: ", attendanceData.studentAttendance)
              console.log("Student Data", studentData);
              setLoading(false);
          } else {
            console.log("Class document not found");
          }
        } else {
          console.log("No teacher document found for the current user");
        }
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      }
    };

    fetchAttendanceData();
  }, [id, currentUser.uid]);

  const toggleAttendanceStatus = (index) => {
    const updatedAttendanceData = [...attendanceData.studentAttendance];
    updatedAttendanceData[index].status = !updatedAttendanceData[index].status;
    setAttendanceData({
      ...attendanceData,
      studentAttendance: updatedAttendanceData,
    });
    console.log("Updated Attendance Data", updatedAttendanceData);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredAttendance =
  attendanceData.studentAttendance && attendanceData.studentAttendance
      ? attendanceData.studentAttendance.filter((record) => {
          if (record.studentName) {
            return record.studentName
              .toLowerCase()
              .includes(searchTerm.toLowerCase());
          }
          return false;
        })
      : [];

  const getDateForm = (date) => {
    if (date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    return ""; // Return an empty string if date is unknown
  };

  const getTime = (timestamp) => {
    if (timestamp && timestamp.toDate) {
      const d = timestamp.toDate();
      const hours = d.getHours().toString().padStart(2, "0"); // Ensure two digits for hours
      const minutes = d.getMinutes().toString().padStart(2, "0"); // Ensure two digits for minutes
      return `${hours}:${minutes}`;
    }
    return null;
  };

  useEffect(() => {
    console.log("Filtered Attendance", attendanceData);
  }, []);

  const handleStartTimeChange = (date) => {
    setEditedStartTime(date);
  };

  const handleEndTimeChange = (date) => {
    setEditedEndTime(date);
  };
  const handleDateChange = (date) => {
    console.log("Selected Date:", date); // Add this line to log the selected date
    setEditedDate(date);
  };

  // Function to handle editing comment
  const handleCommentChange = (index, comment) => {
    const updatedAttendanceData = [...attendanceData.studentAttendance];
    updatedAttendanceData[index].comment = comment;
    setAttendanceData({
      ...attendanceData,
      studentAttendance: updatedAttendanceData,
    });
    console.log("Updated Attendance Data", updatedAttendanceData);
  };

  const saveAttendanceDetails = async () => {
    try {
      // Ensure editedDate, editedStartTime, and editedEndTime are valid
      if (!editedDate || !editedStartTime || !editedEndTime) {
        console.error("Invalid date or time values");
        return;
      }

      // Construct Date objects
      const dateObj = new Date(editedDate);
      const startTimeObj = new Date(editedStartTime);
      const endTimeObj = new Date(editedEndTime);

      // Check if the time values are valid
      if (
        isNaN(dateObj.getTime()) ||
        isNaN(startTimeObj.getTime()) ||
        isNaN(endTimeObj.getTime())
      ) {
        console.error("Invalid date or time values");
        return;
      }
      console.log("Enter")
      // Update Firestore document
      const NewDoc = await addDoc(collection(db, "Attendance"), {
        CourseID: id,
        Date: dateObj,
        StartTime: startTimeObj,
        EndTime: endTimeObj,
      });

      let newDocID = NewDoc.id;
      console.log("Enter")
      // Update student attendance details
      attendanceData.studentAttendance.forEach(async (record) => {
        await setDoc(doc(db,"Attendance",newDocID,"studentAttendance",record.id), {
          status: record.status,
          comment: record.comment,
        });
      });

      console.log("Attendance details updated successfully!");
    } catch (error) {
      console.error("Error updating attendance details:", error);
    }
  };

  return (
    <>
      {loading ? (
        <CardLoading loading={loading} />
      ) : (
        <div className="flex flex-wrap mt-4">
          <div className="w-full mb-12 px-4">
            <div
              className={
                "relative mx-auto px-4 py-8 flex flex-col min-w-0 break-words w-full shadow-lg rounded " +
                (color === "light" ? "bg-white" : "bg-lightBlue-900 text-white")
              }
            >
              <div className="flex items-center mb-4 font-bold text-xl">
                <Link
                  to="/teacher/attendance"
                  className="text-blue-500 hover:underline"
                >
                  Attendance
                </Link>
                <span className="mx-2">&nbsp;/&nbsp;</span>
                <Link
                  to={`/teacher/attendance/class/${id}`}
                  className="text-blue-500 hover:underline"
                >
                  Attendance Record
                </Link>
                <span className="mx-2">&nbsp;/&nbsp;</span>
                <span className="text-gray-500">
                  Record {classData && classData.CourseName} Class Attendance
                </span>
              </div>
              <div className="flex justify-between mx-8 mt-4 mb-2">
                <div>
                  <input
                    type="text"
                    placeholder="Search by student name or ID"
                    value={searchTerm}
                    onChange={handleSearch}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-indigo-500 mr-4"
                  />
                </div>
              </div>
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
              </div>
              <div className="flex justify-between">
                <div className="mt-4 mx-8">
                  <label className="mr-4 text-sm font-semibold">Date:</label>
                  <input
                    type="date"
                    value={editedDate ? getDateForm(editedDate) : ""}
                    onChange={(e) => handleDateChange(new Date(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-indigo-500 mt-1"
                  />
                </div>
                <div className="mt-4 mx-8">
                  <label className="mr-4 text-sm font-semibold">
                    Start Time:
                  </label>
                  <DatePicker
                    selected={editedStartTime}
                    onChange={handleStartTimeChange}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Time"
                    dateFormat="h:mm aa"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-indigo-500 mt-1"
                  />
                </div>
                <div className="mt-4 mx-8">
                  <label className="mr-4 text-sm font-semibold">
                    End Time:
                  </label>
                  <DatePicker
                    selected={editedEndTime}
                    onChange={handleEndTimeChange}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Time"
                    dateFormat="h:mm aa"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-indigo-500 mt-1"
                  />
                </div>
              </div>
              <div className="mt-4 block w-full overflow-x-auto">
                <table className="w-full bg-transparent border-collapse">
                  <thead>
                    <tr>
                      <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                        No
                      </th>
                      <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                        Student Name
                      </th>
                      <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                        Status
                      </th>
                      <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                        Comment
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendance.map((attendance, index) => (
                      <tr key={attendance.id}>
                        <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                          {index + 1}
                        </td>
                        <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                          {attendance.studentName}
                        </td>
                        <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                          <button
                            style={{
                              backgroundColor: attendance.status
                                ? "#FFFF00"
                                : "#FF0000",
                              color: attendance.status ? "#000000" : "#FFFFFF",
                              border: "none",
                              padding: "8px 12px",
                              borderRadius: "9999px",
                              fontWeight: "bold",
                              cursor: "pointer",
                            }}
                            onClick={() => toggleAttendanceStatus(index)}
                          >
                            {attendance.status ? "ATTEND" : "ABSENT"}
                          </button>
                        </td>
                        <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                          <input
                            type="text"
                            value={attendance.comment}
                            onChange={(e) =>
                              handleCommentChange(index, e.target.value)
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-indigo-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 mx-8 flex justify-center">
                <button
                  onClick={saveAttendanceDetails}
                  className="px-6 py-2 my-4 rounded-full bg-green-500 text-white hover:bg-green-600 focus:outline-none focus:bg-green-600"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

CardRecordAttendance.defaultProps = {
  color: "light",
};

CardRecordAttendance.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardRecordAttendance;
