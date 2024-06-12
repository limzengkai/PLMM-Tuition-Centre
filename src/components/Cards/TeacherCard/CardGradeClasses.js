import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link, useParams } from "react-router-dom";
import { db } from "../../../config/firebase";
import { query, collection, where, getDocs, deleteDoc, doc, orderBy } from "firebase/firestore";
import Swal from "sweetalert2";
import CardLoading from "../CardLoading";
import { ToastContainer, toast } from "react-toastify";
import MUIDataTable from "mui-datatables";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@emotion/react";

function CardGradeClasses({ color }) {
  const [testMarks, setTestMarks] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const columns = [
    { name: "Test Name" },
    { name: "Date" },
    { name: "Action", options: { filter: false, sort: false } },
  ];

  const data = testMarks.map((test, index) => [
    test.testName,
    test.TestDate,
    <div className="flex">
      <Link
        to={`view/${test.id}`}
        className="mr-3 text-white rounded-full font-bold py-2 px-4 bg-blue-500 hover:bg-blue-600"
      >
        View
      </Link>
      <Link
        to={`edit/${test.id}`}
        className="mr-3 text-white rounded-full font-bold py-2 px-4 bg-green-500 hover:bg-green-600"
      >
        Edit
      </Link>
      <button
        className="text-white rounded-full font-bold py-2 px-4 bg-red-500 hover:bg-red-600"
        onClick={() => handleDeleteTest(test.id)}
      >
        Delete
      </button>
    </div>,
  ]);

  const getMuiTheme = () =>
    createTheme({
      typography: {
        fontFamily: "Poppins",
      },
      components: {
        MUIDataTableHeadCell: {
          fixedHeaderCommon: {
            backgroundColor: "transparent"
          },
          styleOverrides: {
            root: {
              fontSize: "12px", // Adjusted font size
              textAlign: "center",
            },
          },
        },
        MUIDataTableBodyCell: {
          styleOverrides: {
            root: {
              fontSize: "12px", // Adjusted font size
            },
          },
        },
      },
    });

  const options = {
    responsive: "standard",
    selectableRows: "none",
    downloadOptions: { excludeColumns: [0, 3] },
    rowsPerPage: 5,
    rowsPerPageOptions: [5, 10, 20],
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
          <div className="block w-full overflow-x-auto">
            <ThemeProvider theme={getMuiTheme()}>
              <MUIDataTable
                data={data}
                columns={columns}
                options={options}
              />
            </ThemeProvider>
          </div>
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
