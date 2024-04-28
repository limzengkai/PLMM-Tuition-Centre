import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../../config/context/AuthContext";
import { Link } from "react-router-dom";
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
  limit,
} from "firebase/firestore";

function CardTeacherAttendance({ color }) {
  const { currentUser } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]); // Rename state variable to 'students'
  const [classes, setClasses] = useState([]); // Rename state variable to 'classes'
  const [selectedClass, setSelectedClass] = useState(null); // State to track selected class
  const classesPerPage = 5; // Number of classes to display per page

  useEffect(() => {
    const fetchTestMarks = async () => {
      try {
        // Query the teacher collection to find the document matching the current user's userID
        const teacherQuery = query(
          collection(db, "teacher"),
          where("userID", "==", currentUser.uid),
          limit(1)
        );
        const teacherSnapshot = await getDocs(teacherQuery);
  
        // Check if the teacher document exists
        if (!teacherSnapshot.empty) {
          // Extract teacher data
          const teacherData = teacherSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))[0]; // Assuming there's only one document
  
          // Get the teacher's ID
          const teacherID = teacherData.id;
  
          // Query the class collection to find all classes taught by the teacher
          const classQuery = query(
            collection(db, "class"),
            where("teacher", "==", teacherID)
          );
          const classSnapshot = await getDocs(classQuery);
  
          // Extract class data
          const classData = classSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
  
          // Update state with class data
          setClasses(classData);
          console.log("Class Data", classData);
        } else {
          console.log("No teacher document found for the current user");
        }
  
        // Fetch all student data
        const studentRef = collection(db, "students");
        const studentSnapshot = await getDocs(studentRef);
        const studentData = studentSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
  
        // Update state with student data
        setStudents(studentData);
        setLoading(false);
        console.log("Student Data", studentData);
      } catch (error) {
        console.error("Error fetching test marks:", error);
      }
    };
  
    // Call the fetchTestMarks function when the component mounts
    fetchTestMarks();
  }, []);

  // Filter classes based on search term
  const filteredClasses = classes.filter((cls) => {
    // Check if the class name is a string before calling toLowerCase()
    const className = typeof cls.CourseName === 'string' ? cls.CourseName.toLowerCase() : '';
    return className.includes(searchTerm.toLowerCase());
  });

  // Calculate indexes for pagination
  const indexOfLastClass = currentPage * classesPerPage;
  const indexOfFirstClass = indexOfLastClass - classesPerPage;
  const currentClasses = filteredClasses.slice(
    indexOfFirstClass,
    indexOfLastClass
  );

  // Function to handle select class
  const handleSelectClass = (selectedClass) => {
    setSelectedClass(selectedClass);
  };

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Calculate total number of pages
  const totalPages = Math.ceil(filteredClasses.length / classesPerPage);

  // Generate array of page numbers
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
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
        <span className="text-gray-500">
          Attendance
        </span>
      </div>
      {/* Search input */}
      <div className="flex justify-end my-4 mx-8">
        <input
          type="text"
          placeholder="Search by class name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-indigo-500"
          style={{ width: "300px" }}
        />
      </div>
      <div className="block w-full overflow-x-auto">
        {/* Class list */}
        <table className="w-full bg-transparent border-collapse">
          {/* Table headers */}
          <thead>
            <tr>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                Class Name
              </th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                School Level
              </th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                Registered Students
              </th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                Actions
              </th>
            </tr>
          </thead>
          {/* Table body */}
          <tbody>
            {currentClasses.map((cls) => (
              <tr key={cls.id}>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                  {cls.CourseName}
                </td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                  {cls.academicLevel}
                </td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                  {cls.studentID.length} / {cls.MaxRegisteredStudent}
                </td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                  {/* Button to view attendance records */}
                  <Link
                    to={`/teacher/attendance/class/${cls.id}`}
                    className="mr-3 text-white rounded-full font-bold py-2 px-4 bg-blue-500 hover:bg-blue-600"
                    onClick={() => handleSelectClass(cls)}
                  >
                    View
                  </Link>
                  {/* Button to record attendance */}
                  <Link
                    to={`/teacher/attendance/record/${cls.id}`}
                    className="text-white rounded-full font-bold py-2 px-4 bg-green-500 hover:bg-green-600"
                    onClick={() => handleSelectClass(cls)}
                  >
                    Record
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

CardTeacherAttendance.defaultProps = {
  color: "light",
};

CardTeacherAttendance.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardTeacherAttendance;
