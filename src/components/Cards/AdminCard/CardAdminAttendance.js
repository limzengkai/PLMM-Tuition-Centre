import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import CardPagination from "../CardPagination";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../config/firebase";
import CardLoading from "../CardLoading";

function CardAdminAttendance({ color }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [classes, setClasses] = useState([]); // State to store classes
  const [loading, setLoading] = useState(true); // State to track loading status
  const classesPerPage = 5; // Number of classes to display per page

  useEffect(() => {
    const fetchClasses = async () => {
      // Fetch classes from the database
      const classDoc = await getDocs(collection(db, "class"));
      const classData = classDoc.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClasses(classData);
      setLoading(false);
    }
    fetchClasses();
  },[]);

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
                    to={`/admin/attendance/class/${cls.id}`}
                    className="mr-3 text-white rounded-full font-bold py-2 px-4 bg-blue-500 hover:bg-blue-600"
                  >
                    View
                  </Link>
                  {/* Button to record attendance */}
                  <Link
                    to={`/admin/attendance/record/${cls.id}`}
                    className="text-white rounded-full font-bold py-2 px-4 bg-green-500 hover:bg-green-600"
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

CardAdminAttendance.defaultProps = {
  color: "light",
};

CardAdminAttendance.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardAdminAttendance;
