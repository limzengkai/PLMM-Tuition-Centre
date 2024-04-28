import React, { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import CardLoading from "../CardLoading";
import PropTypes from 'prop-types';
import { collection, getDocs, getDoc, doc, query, where, orderBy } from "firebase/firestore";
import { db } from "../../../config/firebase";
// import Invoice from "../CardInvoice";
import CardPagination from "../CardPagination";
import CardFeeManagement from "./CardFeeByClassesView";

function CardFeeManagementView({ color }) {
  const {id} = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null); // State to track selected payment
  const projectsPerPage = 10; // Number of projects to display per page
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    async function fetchStudentsAndUsers() {
      try {
        const studentDoc = await getDoc(doc(db, "students", id));
        const studentData = { id: studentDoc.id, ...studentDoc.data() };
        setStudents(studentData);

        const userDoc = await getDoc(doc(db, "users", studentData.parentId));
        const userData = { id: userDoc.id, ...userDoc.data() };
        setUsers(userData);

        const feeQuery = query(
          collection(db, "fees"),
          where("StudentID", "==", id),
          orderBy("DueDate", "desc")
        );
        const feeSnapshot = await getDocs(feeQuery);
        const feeData = [];

        for (const feeDoc of feeSnapshot.docs) {
          const feeClassesQuery = collection(feeDoc.ref, "Classes");
          const feeClassesSnapshot = await getDocs(feeClassesQuery);
          const feeClassesData = feeClassesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log("FeeClassesData", feeClassesData);
          feeData.push({
            id: feeDoc.id,
            feeDetail: feeDoc.data(),
            classes: feeClassesData.map(item => ({
              id: item.id,
              Description: item.Descriptions,
              FeeAmount: item.FeeAmounts
            }))
          });
        }

        console.log("FeeData", feeData);

        setFees(feeData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching students and users data:", error);
      }
    }
    fetchStudentsAndUsers();
  }, []);

  const filteredFees = fees.filter(fee =>
    fee.classes && // Check if fee.classes is defined
    fee.classes.some(Classfee =>
      Classfee.Description && // Check if Classfee.Description is defined
      Classfee.Description.some(description =>
        description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  );

  // Calculate indexes for pagination
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = fees.slice(indexOfFirstProject, indexOfLastProject);

  // Change page
  const paginate = pageNumber => setCurrentPage(pageNumber);
  
  // Calculate total number of pages
  const totalPages = Math.ceil(fees.length / projectsPerPage);

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
      <CardLoading loading={loading} />
    ) : (
    <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-4 font-bold text-xl">
            <Link to="/admin/fee" className="text-blue-500 hover:underline">Fee Management</Link>
            <span className="mx-2">&nbsp;/&nbsp;</span>
            <span className="text-gray-500">View Student's fee</span>
        </div>
         <div className="block w-full overflow-x-auto">
        <div className="grid grid-cols-2 gap-y-3 mt-2 m-0 px-8">
            <div className="font-bold text-lg col-span-2 underline">User Information</div>
            <div className="font-bold">Student Name: <span className="font-normal">{students.firstName + " " + students.lastName}</span></div>
            <div className="font-bold">Academic Level: <span className="font-normal">{students.educationLevel}</span></div>
            <div className="font-bold">Parent Name: <span className="font-normal">{users.firstName + " " + users.lastName}</span></div>
            <div className="font-bold">Parent Phone number: <span className="font-normal">{users.contactNumber}</span></div>
            <div className="font-bold col-span-2">Address: <span className="font-normal">{users.address}</span></div>
            <div className="font-bold">State: <span className="font-normal">{users.state}</span></div>
            <div className="font-bold">City: <span className="font-normal">{users.city}</span></div>
        </div>
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
        <table className="items-center w-full bg-transparent table-auto border-collapse">
          {/* Table content */}
          <thead>
            <tr>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Due Date</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Fee</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Description</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Paid Date</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Action</th>
            </tr>
          </thead>
          <tbody>
          {filteredFees.map(fee => (
          <tr key={fee.id}>
            <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{fee.feeDetail.DueDate.toDate().toDateString()}</td>
            <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
              {fee.classes && fee.classes.map((Classfee, index) => (
                <span key={index}>
                  {index > 0 && ", "}
                  RM {Classfee.FeeAmount}
                </span>
              ))}
            </td>
            <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
              {fee.classes && fee.classes.map((Classfee, index) => (
                <span key={index}>
                  {index > 0 && ", "}
                  Fee for {Classfee.Description.length > 60 ? Classfee.Description.substring(0, 60) + "..." : Classfee.Description}
                </span>
              ))}
            </td>

            <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{fee.feeDetail.paymentStatus ? fee.feeDetail.paymentDate.toDate().toDateString() : "Not Paid"}</td>
            <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
              {fee.feeDetail.paymentStatus ? (
                <Link
                  to={`/admin/fee/view/${id}/${fee.id}`}
                  className="mr-3 text-black rounded-full font-bold py-2 px-4 bg-blue-500"
                >
                  View
                </Link>
              ) : (
                <>
                  <Link
                    to={{
                      pathname: `/admin/fee/view/${id}/${fee.id}`,
                      state: fee
                    }}
                    className="mr-3 text-black rounded-full font-bold py-2 px-4 bg-blue-500"
                  >
                    View
                  </Link>

                  <Link
                    to={`/admin/fee/edit/${id}/${fee.id}`}
                    className="mr-3 text-white rounded-full font-bold py-2 px-4 bg-green-500"
                  >
                    Edit
                  </Link>
                  <Link
                    to={`/admin/fee/delete/${id}/${fee.id}`}
                    className="mr-3 text-white rounded-full font-bold py-2 px-4 bg-red-600"
                  >
                    Delete
                  </Link>
                </>
              )}
            </td>
          </tr>
        ))}

          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <CardPagination currentPage={currentPage} totalPages={ totalPages} paginate={paginate} />
    </div>
    )}
    </>
  );
}

CardFeeManagementView.defaultProps = {
  color: "light",
};

CardFeeManagementView.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardFeeManagementView;
