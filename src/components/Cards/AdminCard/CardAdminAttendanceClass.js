import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../../config/context/AuthContext";
import { Link, useParams } from "react-router-dom";
import PropTypes from "prop-types";
import { db } from "../../../config/firebase";
import CardPagination from "../CardPagination";
import CardLoading from "../CardLoading";
import {
  query,
  collection,
  where,
  getDocs,
  getDoc,
  doc,
  orderBy,
} from "firebase/firestore";

function CardAdminAttendanceClass({ color }) {
  const { id } = useParams();
  const { currentUser } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [classData, setClassData] = useState(null); // Define classData state
  const classesPerPage = 5;

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true); // Set loading to true before fetching data

        // Query the class document
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
              const studentAttendanceSnapshot = await getDocs(studentAttendanceQuery);
              const studentAttendanceData = studentAttendanceSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              record.studentAttendance = studentAttendanceData;
              return record;
            })
          );

          // Update state with attendance records
          setAttendanceRecords(updatedAttendanceData);
          console.log("Attendance Data: ", updatedAttendanceData);
        } else {
          console.log("Class document not found");
        }

        // Fetch student data
        const studentRef = collection(db, "students");
        const studentSnapshot = await getDocs(studentRef);
        const studentData = studentSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStudents(studentData);
        setLoading(false); // Set loading to false after fetching data
        console.log("Student Data", studentData);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
        setLoading(false); // Ensure loading state is updated even in case of error
      }
    };

    fetchAttendanceData();
  }, [id]);

  // Filter attendance based on search term
  const filteredAttendance = attendanceRecords
    ? attendanceRecords.filter(
        (record) =>
          record.date &&
          record.date.toLowerCase().includes(searchTerm.toLowerCase())
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
                  <p className="font-bold">
                    Location: {classData && classData.location}
                  </p>
                </div>
              </div>
              <div className="block w-full overflow-x-auto">
                <table className="w-full bg-transparent border-collapse">
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
                  <tbody>
                    {currentAttendance.map((record, index) => (
                      <tr key={record.id}>
                        <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                          {index + 1}
                        </td>
                        <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                          {record.Date.toDate().toLocaleDateString()}
                        </td>
                        <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                          {getTime(record.StartTime)}
                        </td>
                        <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                          {getTime(record.EndTime)}
                        </td>
                        <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                          {record.studentAttendance.filter(student => student.status).length} / {record.studentAttendance.length}
                        </td>
                        <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                          <Link
                            to={`/admin/attendance/class/${id}/view/${record.id}`}
                            className="mr-3 text-black rounded-full font-bold py-2 px-4 bg-blue-500"
                          >
                            View
                          </Link>
                          <Link
                            to={`/admin/attendance/class/${id}/edit/${record.id}`}
                            className="text-white rounded-full font-bold py-2 px-4 bg-green-500"
                          >
                            Edit
                          </Link>
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

CardAdminAttendanceClass.defaultProps = {
  color: "light",
};

CardAdminAttendanceClass.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardAdminAttendanceClass;
