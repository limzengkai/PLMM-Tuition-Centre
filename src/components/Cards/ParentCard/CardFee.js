import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../../config/context/AuthContext";
import { db } from "../../../config/firebase";
import PropTypes from "prop-types";
import CardPagination from "../CardPagination";
import CardLoading from "../CardLoading";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  addDoc,
} from "firebase/firestore";
import { Link } from "react-router-dom";

function CardFee({ color }) {
  const { currentUser } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [feePayments, setFeePayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [showUnpaidOnly, setShowUnpaidOnly] = useState(false); // State to toggle showing only unpaid payments
  const projectsPerPage = 2;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentDataQuery = query(
          collection(db, "students"),
          where("parentId", "==", currentUser.uid)
        );
        const studentDataSnapshot = await getDocs(studentDataQuery);
        const studentData = [];

        studentDataSnapshot.forEach((doc) => {
          studentData.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        const fee = [];
        await Promise.all(
          studentData.map(async (student) => {
            const feePaymentQuery = query(
              collection(db, "fees"),
              where("StudentID", "==", student.id),
              orderBy("paymentStatus", "asc"),
              orderBy("DueDate", "desc")
            );

            const feeData = [];
            const feePaymentSnapshot = await getDocs(feePaymentQuery);
            feePaymentSnapshot.forEach((doc) => {
              feeData.push({
                id: doc.id,
                ...doc.data(),
              });
            });

            await Promise.all(
              feePaymentSnapshot.docs.map(async (doc) => {
                const feePaymentlist = await getDocs(
                  collection(db, "fees", doc.id, "Classes")
                );
                const classesData = [];
                feePaymentlist.forEach((classDoc) => {
                  classesData.push({
                    id: classDoc.id,
                    ...classDoc.data(),
                  });
                });

                fee.push({
                  id: doc.id,
                  ...doc.data(),
                  classes: classesData,
                  studentName: student.firstName + " " + student.lastName,
                });
              })
            );
          })
        );

        setFeePayments(fee);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [currentUser.uid]);


  const handleSort = (key) => {
    if (sortConfig.key === key) {
      setSortConfig({
        ...sortConfig,
        direction:
          sortConfig.direction === "ascending" ? "descending" : "ascending",
      });
    } else {
      setSortConfig({ key, direction: "ascending" });
    }
  };

  const sortData = (data) => {
    const sortedData = [...data];
    if (sortConfig.key) {
      sortedData.sort((a, b) => {
        if (sortConfig.key === "fee") {
          const feeA = calculateTotalFee(a);
          const feeB = calculateTotalFee(b);
          return sortConfig.direction === "ascending"
            ? feeA - feeB
            : feeB - feeA;
        } else {
          if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === "ascending" ? -1 : 1;
          }
          if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === "ascending" ? 1 : -1;
          }
          return 0;
        }
      });
    }

    // Filter paid payments if showUnpaidOnly is true
    if (showUnpaidOnly) {
      return sortedData.filter((project) => !project.paymentStatus);
    }
    return sortedData;
  };

  const calculateTotalFee = (project) => {
    return project.classes?.reduce((totalFee, classItem) => {
      return (
        totalFee + classItem.FeeAmounts.reduce((acc, curr) => acc + curr, 0)
      );
    }, 0);
  };

  const getDate = (timestamp) => {
    if (timestamp && timestamp.toDate) {
      const d = timestamp.toDate();
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, "0");
      const day = d.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    return "";
  };

  const toggleShowUnpaidOnly = () => {
    setShowUnpaidOnly(!showUnpaidOnly);
  };

  const renderSortIcon = (column) => {
    if (sortConfig.key === column) {
      return sortConfig.direction === "ascending" ? (
        <span>&uarr;</span>
      ) : (
        <span>&darr;</span>
      );
    }
    return null;
  };

  // Calculate indexes for pagination
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = feePayments.slice(
    indexOfFirstProject,
    indexOfLastProject
  );

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Calculate total number of pages
  const totalPages = Math.ceil(feePayments.length / projectsPerPage);

  // Generate array of page numbers
  const pageNumbers = [];
  if (totalPages <= 10) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    const leftBound = Math.max(1, currentPage - 4);
    const rightBound = Math.min(currentPage + 5, totalPages);

    if (currentPage < 6) {
      for (let i = 1; i <= 10; i++) {
        pageNumbers.push(i);
      }
    } else if (currentPage >= totalPages - 5) {
      for (let i = totalPages - 9; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      for (let i = leftBound; i <= rightBound; i++) {
        pageNumbers.push(i);
      }
    }
  }

  return (
    <>
      {loading ? (
        <CardLoading />
      ) : (
        <div
          className={
            "relative flex flex-col min-w-0 break-words w-full shadow-lg rounded " +
            (color === "light" ? "bg-white" : "bg-lightBlue-900 text-white")
          }
        >
          <div className="rounded-t mb-0 px-4 py-3 border-0">
            <div className="flex flex-wrap items-center">
              <div className="relative w-full px-4 max-w-full flex-grow flex-1">
                <h3
                  className={
                    "font-semibold text-lg " +
                    (color === "light" ? "text-blueGray-700" : "text-white")
                  }
                >
                  Fee Payment
                </h3>
                <p className="text-sm text-gray-500">
                  View and manage your fee payments here
                </p>
              </div>
              <div>
                <button
                  className="bg-transparent hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
                  onClick={toggleShowUnpaidOnly}
                >
                  {showUnpaidOnly ? "Show All" : "Show Unpaid Only"}
                </button>
              </div>
            </div>
          </div>
          <div className="block w-full overflow-x-auto">
            <table className="items-center w-full bg-transparent border-collapse">
              <thead>
                <tr>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    No
                  </th>
                  <th
                    className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left cursor-pointer"
                    onClick={() => handleSort("DueDate")}
                  >
                    Due Date {renderSortIcon("DueDate")}
                  </th>
                  <th
                    className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left cursor-pointer"
                    onClick={() => handleSort("studentName")}
                  >
                    Student Name {renderSortIcon("studentName")}
                  </th>
                  <th
                    className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left cursor-pointer"
                    onClick={() => handleSort("fee")}
                  >
                    Fee {renderSortIcon("fee")}
                  </th>
                  <th
                    className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left cursor-pointer"
                    onClick={() => handleSort("description")}
                  >
                    Description
                  </th>
                  <th
                    className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left cursor-pointer"
                    onClick={() => handleSort("paymentDate")}
                  >
                    Paid Date {renderSortIcon("paymentDate")}
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortData(feePayments).map((project, index) => (
                  <tr key={index}>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {index + 1}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {getDate(project.DueDate)}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {project.studentName}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {"RM " +
                        project.classes?.reduce((totalFee, classItem) => {
                          return (
                            totalFee +
                            classItem.FeeAmounts.reduce(
                              (acc, curr) => acc + curr,
                              0
                            )
                          );
                        }, 0)}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {project.classes
                        ?.map((classItem) => classItem.Descriptions)
                        .join(", ")}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {project.paymentStatus
                        ? getDate(project.paymentDate)
                        : "Not Paid"}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      <Link
                        to={`/parent/fee/view/${project.id}`}
                        className="mr-3 text-black rounded-full font-bold py-2 px-4 bg-blue-500"
                      >
                        View
                      </Link>
                      {!project.paymentStatus ? (
                        <Link
                          to={`/parent/fee/payment/${project.id}/`}
                          className="text-white rounded-full font-bold py-2 px-4 hover:bg-blue-600"
                          style={{
                            backgroundColor: project.paymentStatus
                              ? "#808080"
                              : "#04086D",
                          }}
                        >
                          Make a payment
                        </Link>
                      ) : (
                        <button
                          className="bg-gray-400 rounded-full font-bold py-2 px-4"
                          disabled
                        >
                          paid
                        </button>
                      )}
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

CardFee.defaultProps = {
  color: "light",
};
CardFee.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardFee;
