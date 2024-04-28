import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link, useLocation, useParams } from "react-router-dom";
import CardPagination from "../CardPagination";
import { db } from "../../../config/firebase";
import { query, collection, where, getDocs, deleteDoc, doc, orderBy } from "firebase/firestore";
import Swal from "sweetalert2";
import CardLoading from "../CardLoading";
import { ToastContainer, toast } from "react-toastify";

function CardGradeClasses({ color }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [testMarks, setTestMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const testsPerPage = 5;
  const { id } = useParams();
  
  useEffect(() => {
    const fetchTestMarks = async () => {
      try {
        const testMarksCollectionQuery = query(
          collection(db, "test"),
          where("classID", "==", id),
          orderBy("TestDate", "desc")
        )
        const testMarksSnapshot = await getDocs(testMarksCollectionQuery);
        const testMarks = testMarksSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setTestMarks(testMarks);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching test marks:", error);
        setLoading(false);
      }
    };
    fetchTestMarks();
  }, [id]);

  const handleDeleteTest = async (testId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteDoc(doc(db, "test", testId));
          setTestMarks(testMarks.filter((test) => test.id !== testId));
          Swal.fire("Deleted!", "Your test has been deleted.", "success");
        } catch (error) {
          console.error("Error deleting test:", error);
          Swal.fire("Error!", "Failed to delete the test. Please try again later.", "error");
        }
      }
    });
  };

  const filteredTests = testMarks.filter((test) => {
    const testName = test?.name?.toLowerCase() ?? '';
    const lowerSearchTerm = searchTerm ? searchTerm.toLowerCase() : '';
    return testName.includes(lowerSearchTerm);
  });

  const indexOfLastTest = currentPage * testsPerPage;
  const indexOfFirstTest = indexOfLastTest - testsPerPage;
  const currentTests = filteredTests.slice(indexOfFirstTest, indexOfLastTest);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const totalPages = Math.ceil(filteredTests.length / testsPerPage);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <>
    {loading ? (
      <CardLoading loading={loading} />
    ) : (
    <div className={"relative mx-auto px-4 py-8 flex flex-col min-w-0 break-words w-full shadow-lg rounded " +
      (color === "light" ? "bg-white" : "bg-lightBlue-900 text-white")}>
      <div className="flex items-center mb-4 font-bold text-xl">
        <Link to="/teacher/classes" className="text-blue-500 hover:underline">Classes</Link>
        <span className="mx-2">&nbsp;/&nbsp;</span>
        <span className="text-gray-500">Class's Grade</span>
      </div>
      <div className="mx-8 mt-4 mb-2">
        <input
          type="text"
          placeholder="Search by Test Name or Date"
          value={searchTerm}
          onChange={handleSearchChange}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div className="block w-full overflow-x-auto">
        <table className="w-full bg-transparent border-collapse">
          <thead>
            <tr>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">No</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Test Name</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Date</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {currentTests.map((test, index) => (
              <tr key={test.id}>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{index + 1}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{test.testName}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{test.TestDate}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                  <Link to={`view/${test.id}`} className="mr-3 text-white rounded-full font-bold py-2 px-4 bg-blue-500 hover:bg-blue-600">
                    View
                  </Link>
                  <Link to={`edit/${test.id}`} className="mr-3 text-white rounded-full font-bold py-2 px-4 bg-green-500 hover:bg-green-600">
                    Edit
                  </Link>
                  <button
                    className="text-white rounded-full font-bold py-2 px-4 bg-red-500 hover:bg-red-600"
                    onClick={() => handleDeleteTest(test.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CardPagination currentPage={currentPage} totalPages={totalPages} paginate={paginate} />
      <div className="flex justify-center m-5 mb-5">
        <Link to={`/teacher/classes/grade/${id}/new`} className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none focus:bg-blue-600">
          Add New Test
        </Link>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
      )}
    </>
  );
}

CardGradeClasses.defaultProps = {
  color: "light",
};

CardGradeClasses.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardGradeClasses;
