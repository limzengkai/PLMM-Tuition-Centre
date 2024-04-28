import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../../config/context/AuthContext";
import { db } from "../../../config/firebase";
import PropTypes from "prop-types";
import Invoice from "../CardInvoice";
import CardPagination from "../CardPagination";
import CardLoading from "../CardLoading";
import { collection, query, where, getDocs, orderBy, addDoc } from "firebase/firestore";
import { Link } from "react-router-dom";

function CardFee({ color }) {
  const { currentUser } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [feePayments, setFeePayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null); // State to track selected payment
  const projectsPerPage = 2; // Number of projects to display per page

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch student data
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
        
        // Update the student state with fetched data
        setStudents(studentData);
        console.log("Student data:", studentData);
  
        const fee = [];
        // Fetch fee payments for each student
        await Promise.all(
          studentData.map(async (student) => {
            console.log("Student ID:", student.id);
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
            console.log("Classes data:", student.firstName + " " + student.lastName , ": ", feeData);
  
            // Fetch data from subcollection "Classes"
            await Promise.all(feePaymentSnapshot.docs.map(async (doc) => {
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
            }));
          })
        );
  
        // Update the fee payment state with fetched data
        setFeePayments(fee);
        setLoading(false);
        console.log("Fee payment data 2:", fee);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    fetchData();
  }, []);
  
  useEffect(() => {
    console.log("Fee payment data 3:", feePayments);

  }, []);

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

  // Function to handle payment action
  const handlePayment = (id) => {
    // Perform payment action here
    addDoc(collection(db, "mail"),{
      to: "limzengkai96@gmail.com",
      message:{
        subject: "Payment Notification",
        text: "Payment has been made for the fee payment with ID: " + id,
        html: "The Payment with "+ id + "has been made for the fee payment"
      }
    })
  };


  const getDate = (timestamp) => {
    if (timestamp && timestamp.toDate) {
      const d = timestamp.toDate();
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, "0");
      const day = d.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    return ""; // Return an empty string if date is unknown
  };

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
                  View and manage your fee payments {feePayments.length}
                </p>
              </div>
            </div>
          </div>
          <div className="block w-full overflow-x-auto">
            <div className="flex justify-end my-4 mx-8">
              <input
                type="text"
                placeholder="Search by description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-indigo-500"
                style={{ width: "300px" }}
              />
            </div>
            <table className="items-center w-full bg-transparent border-collapse">
              {/* Table content */}
              <thead>
                <tr>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    No
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Due Date
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Student Name
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Fee
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Description
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Paid Date
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {feePayments.length > 0 &&
                  feePayments.map((project, index) => (
                    <tr key={index}>
                      {" "}
                      {/* Add key prop here */}
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
                        {"RM " +project.classes?.reduce((totalFee, classItem) => {
                          return totalFee + classItem.FeeAmounts.reduce((acc, curr) => acc + curr, 0);
                        }, 0)}
                      </td>
                      <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                        {project.classes
                          ?.map((classItem) => classItem.Descriptions)
                          .join(", ")}
                      </td>
                      <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                        {project.paid ? project.paidDate : "Not Paid"}
                      </td>
                      <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                        <Link
                          to={`/parent/fee/view/${project.id}`}
                          className="mr-3 text-black rounded-full font-bold py-2 px-4 bg-blue-500"
                        >
                          View
                        </Link>
                        <button
                          className={
                            "text-white rounded-full font-bold py-2 px-4 " +
                            (project.paid
                              ? "bg-orange-600 cursor-default"
                              : "font-bold py-2 px-4 hover:bg-blue-600")
                          }
                          onClick={() => handlePayment(project.id)}
                          disabled={project.paid}
                          style={{
                            backgroundColor: project.paid
                              ? "#808080"
                              : "#04086D",
                          }}
                        >
                          {project.paid ? "Paid" : "Make a payment"}
                        </button>
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
