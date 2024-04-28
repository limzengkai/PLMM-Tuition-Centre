import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Link, useLocation } from "react-router-dom";
import CardPagination from "../CardPagination";

function CardAdminClasses({ classes, color }) {
  const [currentPage, setCurrentPage] = useState(1);
    // State to manage the selected function (Management or Registration)
    const [selectedFunction, setSelectedFunction] = useState("management");
    // State to manage the search term
    const [searchTerm, setSearchTerm] = useState('');
    const location = useLocation();
    // Dummy data for demonstration

    // Update selected function based on URL path
    useEffect(() => {
      const pathname = location.pathname;
      if (pathname === "/admin/users" || pathname.startsWith("/admin/users/")) {
        setSelectedFunction("management");
      }
    }, [location.pathname]);
  const classesPerPage = 5; // Number of classes to display per page

  // Calculate indexes for pagination
  const indexOfLastClass = currentPage * classesPerPage;
  const indexOfFirstClass = indexOfLastClass - classesPerPage;
  const currentClasses = classes.slice(indexOfFirstClass, indexOfLastClass);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Calculate total number of pages
  const totalPages = Math.ceil(classes.length / classesPerPage);

  function formatTime(time) {
    const date = new Date(time.seconds * 1000); // Convert seconds to milliseconds
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "pm" : "am";
    const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
    const formattedMinutes = minutes.toString().padStart(2, "0"); // Add leading zero if needed
    return `${formattedHours}:${formattedMinutes}${ampm}`;
  }

  return (
    <div className={"relative mx-auto px-4 py-8 flex flex-col min-w-0 break-words w-full shadow-lg rounded " +
      (color === "light" ? "bg-white" : "bg-lightBlue-900 text-white")}>
        <h2 className="text-xl font-bold mb-4">Classes Management</h2>
        <div className="lg:flex justify-between mb-4 sm:block">
        {/* Search Bar */}
      </div>
      <div className='flex justify-between mb-3 border-t border-gray-300 pt-3'>
        <div className="flex items-center">
            <label htmlFor="search" className="text-sm font-medium text-gray-700 mr-2">
              Search by:
            </label>
            <input
              type="text"
              id="search"
              name="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 block w-64"
              placeholder={selectedFunction === 'management' ? 'Name' : 'userID'}
            />
          </div>
          <div>
            <Link
                className="m-0 p-4 rounded-lg text-black bg-yellow-400 font-bold py-2 px-4"
                onClick={() => {
                
                }}
                to={`/admin/classes/add`}
                style={{ marginLeft: "1rem"}}
            >
                Add New Class
            </Link>
          </div>
      </div>
      <div className="block w-full overflow-x-auto">
        <table className="w-full bg-transparent border-collapse">
          {/* Table headers */}
          <thead>
            <tr>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">NO</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">CLASS NAME</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">ACADEMIC LEVEL</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">TOTAL REGISTERED STUDENT</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">SCHEDULE</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">LOCATION</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">ACTION</th>
            </tr>
          </thead>
          {/* Table body */}
          <tbody>
            {currentClasses.map((cls, index) => (
              <tr key={cls.id}>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{index + 1}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{cls.CourseName}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{cls.academicLevel}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{cls.studentID.length} / {cls.MaxRegisteredStudent}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                {cls.schedule.map((day, i) => (
                  <div key={i}>
                    {day.day} ({formatTime(day.startTime)} - {formatTime(day.endTime)})
                  </div>
                ))}
              </td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{cls.location}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                  <Link to={`/admin/classes/view/${cls.id}`} className="mr-3 text-black rounded-full font-bold py-2 px-4 bg-blue-500">
                    View
                  </Link>
                  <Link to={`/admin/classes/edit/${cls.id}`} className="text-white rounded-full font-bold py-2 px-4 bg-green-500">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <CardPagination currentPage={currentPage} totalPages={totalPages} paginate={paginate} />
   </div>
  );
}

CardAdminClasses.defaultProps = {
  color: "light",
};

CardAdminClasses.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardAdminClasses;
