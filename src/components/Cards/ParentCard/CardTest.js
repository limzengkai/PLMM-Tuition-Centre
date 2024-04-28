import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../../config/context/AuthContext";
import PropTypes from "prop-types";
import CardPagination from "../CardPagination";
import CardLoading from "../CardLoading";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../../../config/firebase";
import Swal from "sweetalert2";
import { useLocation } from "react-router-dom";

function CardTest({ color }) {
  const { currentUser } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [teachers, setTeachers] = useState([]); // State to store teachers data
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [childrenDetails, setChildrenDetails] = useState([]); // State to store children's details
  const [selectedClass, setSelectedClass] = useState(null); // State to track selected class
  const location = useLocation();
  const classesPerPage = 5; // Number of classes to display per page

  useEffect(() => {
    const fetchChildrenClasses = async () => {
      const childrenRef = doc(db, "parent", currentUser.uid);
      const childrenSnapshot = await getDoc(childrenRef);
      const childrenData = childrenSnapshot.data();

      // Check if children data exists and has children
      if (childrenData && childrenData.children) {
        const children = childrenData.children;
        const childrenDetails = [];

        for (const child of children) {
          const childRef = doc(db, "students", child);
          const childSnapshot = await getDoc(childRef);
          const childData = childSnapshot.data();

          if (childData) {
            const testRef = collection(db, "test");
            const testSnapshot = await getDocs(testRef);
            const studentTestRecords = [];

            for (const testDoc of testSnapshot.docs) {
              const testData = testDoc.data();
              const testId = testDoc.id;

              const studentTestRef = doc(db, "test", testId, "scores", child);
              const studentTestSnapshot = await getDoc(studentTestRef);

              if (studentTestSnapshot.exists()) {
                const studentTestData = studentTestSnapshot.data();
                studentTestRecords.push({
                  id: testId,
                  ...testData,
                  result: studentTestData,
                });
              }
            }

            childrenDetails.push({
              ...childData,
              classes: studentTestRecords,
            });
          }
        }
        console.log("Children details: ", childrenDetails);
        // // Fetch teacher information
        // const teacherRef = collection(db, "teacher");
        // const teacherSnapshot = await getDocs(teacherRef);
        // const teacherData = teacherSnapshot.docs.map((doc) => ({
        //   id: doc.id,
        //   ...doc.data(),
        // }));

        // // Fetch teacher details
        // const teacherUserRef = collection(db, "users");
        // const teacherUserSnapshot = await getDocs(teacherUserRef);
        // const teacherUserData = teacherUserSnapshot.docs.map((doc) => doc.data());
        // teacherData.forEach((teacher, index) => {
        //   teacherData[index].firstName = teacherUserData[index].firstName;
        //   teacherData[index].lastName = teacherUserData[index].lastName;
        // });

        // Update state with fetched data
        // setTeachers(teacherData);
        setChildrenDetails(childrenDetails);
        setLoading(false);
      }
    };

    fetchChildrenClasses();
  }, [currentUser.uid]);

  // Filter classes based on search term and active tab
  const filteredClasses = childrenDetails.filter((student) =>
    student.classes.some((classItem) =>
      classItem.testName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

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
  const totalRegisteredPages = Math.ceil(
    filteredClasses.length / classesPerPage
  );

  const handleShowComment = (comment) => {
    Swal.fire({
      title: "Comment",
      text: comment,
      icon: "info",
      confirmButtonText: "Close",
    });
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
          {/* Tabs for Registered Classes and Offered Classes */}
          <div className="rounded-t mb-0 px-4 py-3 border-0">
            <div className="flex flex-wrap items-center">
              <div className="relative w-full px-4 max-w-full flex-grow flex-1">
                <h3
                  className={
                    "font-semibold text-lg " +
                    (color === "light" ? "text-blueGray-700" : "text-white")
                  }
                >
                  Test Results
                </h3>
              </div>
            </div>
          </div>
          {/* Class table */}
          <div className="block w-full overflow-x-auto text-center">
            {/* Search input */}
            <div className="flex justify-end my-4 mx-8">
              <input
                type="text"
                placeholder="Search by test name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-indigo-500"
                style={{ width: "300px" }}
              />
            </div>
            {/* Class table */}
            {currentClasses.map((student, index) => (
              <div key={index} className="mb-8">
                <h2 className="text-left text-lg font-semibold mb-4 mx-5">
                  Student {index + 1}:{" "}
                  {student.firstName + " " + student.lastName}
                </h2>
                <table className="table-fixed items-center mx-auto w-full bg-transparent border-collapse">
                  {/* Table headers */}
                  <thead>
                    <tr>
                      <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold">
                        No
                      </th>
                      <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold ">
                        Test Date
                      </th>
                      <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold">
                        Test Name
                      </th>
                      <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold ">
                        Mark
                      </th>
                      <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold">
                        Comment
                      </th>
                    </tr>
                  </thead>
                  {/* Table body */}
                  <tbody>
                    {student.classes.map((classItem, idx) => (
                      <tr key={idx}>
                        <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                          {idx + 1}
                        </td>
                        <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                          {classItem.TestDate}
                        </td>
                        <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                          {classItem.testName}
                        </td>
                        <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                          {(
                            (Number(classItem.result.score) /
                              Number(classItem.maxScore)) *
                            100
                          ).toFixed(0)}
                          %
                        </td>
                        <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                          <button
                            onClick={() =>
                              handleShowComment(classItem.result.comment)
                            }
                            className="bg-blue-500 text-white active:bg-blue-600 font-bold uppercase text-xs px-4 py-2 rounded-full shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                            type="button"
                          >
                            Show Comment
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          {/* Pagination */}
          <CardPagination
            currentPage={currentPage}
            totalPages={totalRegisteredPages}
            paginate={paginate}
          />
        </div>
      )}
    </>
  );
}

CardTest.defaultProps = {
  color: "light",
};

CardTest.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardTest;
