import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../../config/context/AuthContext";
import { Link, useParams } from "react-router-dom";
import PropTypes from "prop-types";
import { db } from "../../../config/firebase";
import CardPagination from "../CardPagination";
import Swal from "sweetalert2";
import CardLoading from "../CardLoading";
import {
  query,
  collection,
  where,
  getDocs,
  getDoc,
  limit,
  doc,
  addDoc,
} from "firebase/firestore";

function CardViewAttendance({ color }) {
  const { id, attdid } = useParams();
  const { currentUser } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [students, setStudents] = useState({});
  const [showSendEmail, setShowSendEmail] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAbsentNumber, setShowAbsentNumber] = useState(false);
  const [MaxAbsent, setMaxAbsent] = useState(0);
  const [SendAbsentEmail, setSendAbsentEmail] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [classData, setClassData] = useState(null);
  const classesPerPage = 5;

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
          const teacherData = teacherSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))[0];

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
              setStudents(studentData);

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
        } else {
          console.log("No teacher document found for the current user");
        }
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      }
    };

    fetchAttendanceData();
  }, [id, currentUser.uid]);

  // Filter attendance based on search term
  const filteredAttendance = attendanceRecords.studentAttendance
    ? attendanceRecords.studentAttendance.filter(
        (record) =>
          record.studentName &&
          record.studentName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

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

  async function handleAbsentEmail() {
    // Show confirmation dialog before proceeding
    const confirmation = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to send emails to parents of absent students?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, send emails",
      cancelButtonText: "Cancel",
    });

    // Proceed only if the user confirms
    if (confirmation.isConfirmed) {
      try {
        setShowSendEmail(true);
        const studentAttendanceRef = collection(
          db,
          "Attendance",
          attdid,
          "studentAttendance"
        );
        const studentAttendanceSnapshot = await getDocs(studentAttendanceRef);
        const studentAttendanceData = studentAttendanceSnapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })
        );

        const absentStudents = studentAttendanceData.filter(
          (student) => student.status === false
        );

        const studentRef = collection(db, "students");
        const studentSnapshot = await getDocs(studentRef);
        const studentData = studentSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        studentData.forEach((student) => {
          const studentAttendance = absentStudents.find(
              (data) => data.id === student.id
          );
          if (studentAttendance) {
              studentAttendance.studentName = student ? student.firstName + " " + student.lastName : "Unknown Student";
          }
        });
        setMaxAbsent(absentStudents.length);
        setShowAbsentNumber(true); // Show progress during email sending
        // Get the email of the parent of the absent student
        absentStudents.forEach(async (student, index) => {
          const parentcollectionRef = query(
            collection(db, "parent"),
            where("children", "array-contains", student.id)
          );
          const parentSnapshot = await getDocs(parentcollectionRef);
          const parentData = parentSnapshot.docs.map((doc) => ({
            id: doc.id,
          }));
          parentData.forEach(async (parent) => {
            const UserInfo = await getDoc(doc(db, "users", parent.id));
            const userData = UserInfo.data();
            await addDoc(collection(db, "mail"), {
              to: userData.email,
              message: {
                subject: "Absent Student",
                html: `
                <!DOCTYPE html>
                  <html lang="en">
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Absent Student Notification</title>
                    <style>
                      body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                      }
                      .container {
                        max-width: 600px;
                        margin: auto;
                        padding: 20px;
                        border: 1px solid #ddd;
                        border-radius: 5px;
                        background-color: #f9f9f9;
                      }
                      .header {
                        text-align: center;
                        margin-bottom: 20px;
                      }
                      .header h1 {
                        color: #007bff;
                        margin-bottom: 5px;
                      }
                      .message {
                        margin-bottom: 20px;
                      }
                      .footer {
                        text-align: center;
                        margin-top: 20px;
                        font-size: 12px;
                        color: #777;
                      }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <div class="header">
                        <h1>Absent Student Notification</h1>
                      </div>
                      <div class="message">
                        <p>Dear Parent,</p>
                        <p>Your child <strong>${
                          student.studentName
                        }</strong> was marked absent for the class <strong>${
                                    classData.CourseName
                                  }</strong> on <strong>${getDate(
                                    attendanceRecords.Date
                                  )}</strong> at <strong>${getTime(
                                    attendanceRecords.StartTime
                                  )}</strong>.</p>
                        <p>Please ensure your child's attendance in future classes.</p>
                        <p>Regards,</p>
                        <p>PLMM Tuition Centre Team</p>
                      </div>
                      <div class="footer">
                        <p>This email was sent automatically. Please do not reply.</p>
                      </div>
                    </div>
                  </body>
                  </html>
                `,
              },
            });
            setSendAbsentEmail(index + 1); // Update send count
          });
        });
        
        // Hide progress after emails are sent
        setShowAbsentNumber(false);
        setShowSendEmail(false);

        if(showAbsentNumber === false && showSendEmail === false) {
          // Show success message using Swal
          Swal.fire({
            icon: "success",
            title: "Emails Sent",
            text: "Emails to parents of absent students have been sent successfully!",
          });
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
        // Show error message using Swal
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to send emails. Please try again later.",
        });
      }
    }
  }


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
                    Attend Number
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    comment
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentAttendance.map((record, index) => (
                  <tr key={record.id}>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {index + 1}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {record.studentName}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      <span
                        className={`rounded-full px-2 py-1 ${
                          record.status
                            ? "bg-yellow-500 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {record.status ? "Present" : "Absent"}
                      </span>
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {record.comment !== null && record.comment.trim() !== ""
                        ? record.comment
                        : "No Comment"}
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
          <div className="flex justify-center">
            <div>
              <button
                className="rounded-lg mx-auto text-black bg-yellow-400 font-bold py-2 px-4"
                onClick={handleAbsentEmail}
                disabled={showSendEmail === true} // Disable button when sending emails
                style={{ marginLeft: "1rem" }}
              >
                {showSendEmail === true
                  ? "Sending..."
                  : "Send All Absent Email"}
              </button>
            </div>
          </div>
          <p className="text-center text-xs pt-2">
            Note: This will send an email to all students who are marked as
            Absent
          </p>
          {showAbsentNumber && (
            <div className="text-center font-bold pt-2">
              {SendAbsentEmail} / {MaxAbsent}
            </div>
          )}
        </div>
      )}
    </>
  );
}

CardViewAttendance.defaultProps = {
  color: "light",
};

CardViewAttendance.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardViewAttendance;
