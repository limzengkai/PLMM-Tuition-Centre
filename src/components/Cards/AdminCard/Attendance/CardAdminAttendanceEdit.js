import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../../../config/context/AuthContext";
import { Link, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PropTypes from "prop-types";
import CardLoading from "../../CardLoading";
import { db } from "../../../../config/firebase";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import Swal from "sweetalert2";

function EditAttendancePage({ color }) {
  const { id, attdid } = useParams();
  const { currentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
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


          const classDoc = doc(db, "class", id);
          const classSnap = await getDoc(classDoc);

          if (classSnap.exists()) {
            const classData = { id: classSnap.id, ...classSnap.data() };
            setClassData(classData);

            const attendanceDoc = doc(db, "Attendance", attdid);
            const attendanceSnapshot = await getDoc(attendanceDoc);

            if (attendanceSnapshot.exists()) {
              const attendanceData = {
                id: attendanceSnapshot.id,
                ...attendanceSnapshot.data(),
              };

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

              setAttendanceData(attendanceData);
              setLoading(false);
              setEditedDate(attendanceData.Date.toDate());
              setEditedStartTime(attendanceData.StartTime.toDate());
              setEditedEndTime(attendanceData.EndTime.toDate());
              setLoading(false);
            } else {
              console.log("Attendance document not found");
              setLoading(false);
            }
          } else {
            console.log("Class document not found");
            setLoading(false);
          }
      } catch (error) {
        console.error("Error fetching attendance data:", error);
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [id, currentUser.uid, attdid]);

  const toggleAttendanceStatus = (index) => {
    const updatedAttendanceData = [...attendanceData.studentAttendance];
    updatedAttendanceData[index].status = !updatedAttendanceData[index].status;
    setAttendanceData({
      ...attendanceData,
      studentAttendance: updatedAttendanceData,
    });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredAttendance =
    attendanceData && attendanceData.studentAttendance
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

  const handleStartTimeChange = (date) => {
    setEditedStartTime(date);
  };

  const handleEndTimeChange = (date) => {
    setEditedEndTime(date);
  };
  const handleDateChange = (date) => {
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

      // Show confirmation dialog
      const { value } = await Swal.fire({
        title: "Are you sure?",
        text: "You are about to save the attendance details.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, save it!",
      });

      if (value) {
        // Update Firestore document
        await updateDoc(doc(db, "Attendance", attdid), {
          Date: dateObj,
          StartTime: startTimeObj,
          EndTime: endTimeObj,
        });

        // Update student attendance details
        attendanceData.studentAttendance.forEach(async (record) => {
          const studentAttendanceRef = doc(
            db,
            "Attendance",
            attdid,
            "studentAttendance",
            record.id
          );
          await updateDoc(studentAttendanceRef, {
            status: record.status,
            comment: record.comment,
          });
        });


        Swal.fire(
          "Saved!",
          "Attendance details have been updated successfully.",
          "success"
        );
      }
    } catch (error) {
      console.error("Error updating attendance details:", error);
      Swal.fire("Error!", "An error occurred while saving attendance details.", "error");
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
                  Edit {classData && classData.CourseName} Class Attendance
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

EditAttendancePage.defaultProps = {
  color: "light",
};

EditAttendancePage.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default EditAttendancePage;
