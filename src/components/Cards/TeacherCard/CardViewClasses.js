import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { db } from "../../../config/firebase";
import { Link, useParams } from "react-router-dom";
import CardPagination from "../CardPagination";
import { getDocs,getDoc,doc, collection, query, where } from "firebase/firestore";
import CardLoading from "../CardLoading";

function CardViewClasses({ color }) {
  const { id } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [classDetails, setClassDetails] = useState(null);
  const [studentData, setStudentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const studentsPerPage = 5; // Number of students to display per page

  useEffect(() => {
    async function fetchClassData() {
      try {
        const classCollectionRef = collection(db, "class");
        const classSnapshot = await getDocs(classCollectionRef);

        // Iterate through each class document
        for (const classDoc of classSnapshot.docs) {
          const classData = classDoc.data();
          const classId = classDoc.id;

          if (classId === id) {
            const scheduleCollectionRef = collection(
              classCollectionRef,
              classId,
              "Schedule"
            );
            const scheduleSnapshot = await getDocs(scheduleCollectionRef);

            const scheduleData = [];
            // Iterate through each schedule document
            scheduleSnapshot.forEach((scheduleDoc) => {
              scheduleData.push(scheduleDoc.data());
            });

            // Merge class data with schedule data
            const mergedData = {
              id: classId,
              ...classData,
              schedule: scheduleData,
            };
            setClassDetails(mergedData);
            console.log("Class Details", mergedData);

            try {
              const StudentQuery = query(collection(db, "students"), where("registeredCourses", "array-contains", id));
              const StudentSnapshot = await getDocs(StudentQuery);
          
              const students = [];
              await Promise.all(StudentSnapshot.docs.map(async (studentDoc) => {
                const studentData = studentDoc.data();
                const studentId = studentDoc.id;
          
                // Fetch additional parent data
                const parentDocRef = doc(db, "users", studentData.parentId); // Corrected line
                const parentDocSnapshot = await getDoc(parentDocRef);
                const parentData = parentDocSnapshot.data();
          
                students.push({ id: studentId, ...studentData, parentData });
              }));
          
              setStudentData(students);
              console.log("Student Data", students);
            } catch (error) {
              console.error("Error fetching student documents:", error);
            }

            setLoading(false);
            return;
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching documents:", error);
        setLoading(false);
      }
    }

    fetchClassData();
  }, [id]);

  // Filter students based on search term
  const filteredStudents = studentData.filter(
    (student) =>
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate indexes for pagination
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(
    indexOfFirstStudent,
    indexOfLastStudent
  );

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Calculate total number of pages
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset pagination to first page when searching
  };

  function formatTime(time) {
    if (!time || !time.seconds) {
      return ""; // Handle case where time is undefined or time.seconds is not available
    }
    const date = new Date(time.seconds * 1000); // Convert seconds to milliseconds
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "pm" : "am";
    const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
    const formattedMinutes = minutes.toString().padStart(2, "0"); // Add leading zero if needed
    return `${formattedHours}:${formattedMinutes}${ampm}`;
  }

  return (
    <>
    {loading ? (
      <CardLoading loading={loading} />
    ) : (
    <div
      className={
        "relative mx-auto px-4 py-8 flex flex-col min-w-0 break-words w-full shadow-lg rounded " +
        (color === "light" ? "bg-white" : "bg-lightBlue-900 text-white")
      }
    >
      <div className="flex items-center mb-4 font-bold text-xl">
        <Link to="/teacher/classes" className="text-blue-500 hover:underline">Classes</Link>
        <span className="mx-2">&nbsp;/&nbsp;</span>
        <span className="text-gray-500">View Class's Details</span>
      </div>
      {/* Search input */}
      <div className="mt-2 mb-4">
        <input
          type="text"
          placeholder="Search by Student Name or ID"
          value={searchTerm}
          onChange={handleSearchChange}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-indigo-500"
        />
      </div>
      {/* Class details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="border rounded-lg p-2">
          <h2 className="text-md font-bold mb-2">
            Class Name:{" "}
            <span className="text-sm font-semibold">{classDetails?.CourseName}</span>
          </h2>
        </div>
        <div className="border rounded-lg p-2">
          <h2 className="text-md font-semibold mb-2">
            Academic Level:{" "}
            <span className="text-sm">{classDetails?.academicLevel}</span>
          </h2>
        </div>
        <div className="border rounded-lg p-2">
          <h2 className="text-md font-semibold">
            Class Fee: <span className="text-sm">{classDetails?.fee}</span>
          </h2>
        </div>
        <div className="border rounded-lg p-2">
          <h2 className="text-md font-semibold">
            Total Registered Students:{" "}
            <span className="text-sm">{classDetails?.studentID.length}</span>
          </h2>
        </div>
        <div className="border rounded-lg p-2">
          <h2 className="text-md font-semibold">
            Teacher Name:{" "}
            <span className="text-sm">{classDetails?.location}</span>
          </h2>
        </div>
        <div className="border rounded-lg p-2">
          <h2 className="text-md font-semibold">
            Location: <span className="text-sm">{classDetails?.location}</span>
          </h2>
        </div>
        <div className="border rounded-lg p-2">
          <h2 className="text-md font-semibold mb-2">Schedule</h2>
          <ul className="list-disc list-inside">
            {classDetails && classDetails.schedule.map((day, i) => (
              <li key={i} className="text-sm">{day.day} ({formatTime(day.startTime)} - {formatTime(day.endTime)})</li>
            ))}
          </ul>
        </div>
      </div>


      {/* Student list */}
      <div className="block w-full overflow-x-auto">
        {/* Student table */}
        <table className="w-full bg-transparent border-collapse mt-4">
          {/* Table headers */}
          <thead>
            <tr>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                No
              </th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                Student Name
              </th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                educationa Level
              </th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                Parent Name
              </th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                Parent Contact Number
              </th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                Registered Date
              </th>
            </tr>
          </thead>
          {/* Table body */}
          <tbody>
          {currentStudents.length > 0 ? (
            currentStudents.map((student, index) => (
              <tr key={student.id}>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                  {index + 1}
                </td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                  {student.firstName + " " + student.lastName}
                </td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                  {student.educationLevel}
                </td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                  {student.parentData.firstName + " " + student.parentData.lastName}
                </td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                  {student.parentData.contactNumber}
                </td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                  {student.registeredDate}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="text-center border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4" colSpan="6">
                No students registered in this class.
              </td>
            </tr>
          )}
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

CardViewClasses.defaultProps = {
  color: "light",
};

CardViewClasses.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardViewClasses;
