import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../../config/context/AuthContext";
import PropTypes from "prop-types";
import CardLoading from "../CardLoading";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../../../config/firebase";
import Swal from "sweetalert2";
import MUIDataTable from "mui-datatables";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@emotion/react";

function CardTest({ color }) {
  const { currentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [childrenDetails, setChildrenDetails] = useState([]); // State to store children's details

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
        setChildrenDetails(childrenDetails);
        setLoading(false);
      }
    };

    fetchChildrenClasses();
  }, [currentUser.uid]);

  const handleShowComment = (comment) => {
    Swal.fire({
      title: "Comment",
      text: comment,
      icon: "info",
      confirmButtonText: "Close",
    });
  };

  const columns = [
    { name: "Test Date", options: { filter: true } },
    { name: "Test Name", options: { filter: true } },
    { name: "Mark", options: { filter: false } },
    { name: "Comment", options: { filter: false } },
  ];

  const getMuiTheme = () =>
    createTheme({
      typography: {
        fontFamily: "Poppins",
      },
      overrides: {
        MUIDataTableHeadCell: {
          root: {
            textAlign: "left",
          },
        },
      },
    });

  const options = {
    responsive: "standard",
    selectableRows: "none",
    downloadOptions: { excludeColumns: [0] },
    rowsPerPage: 5,
    rowsPerPageOptions: [5, 10, 20],
    customToolbarSelect: () => {},
    // onRowClick: (rowData) => handleShowComment(rowData[4]),
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
          <div className="rounded-t mb-0 mt-4 px-4 py-3 border-0">
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
          <div className="block w-full overflow-x-auto">
            {/* Class table */}
            {childrenDetails.map((student, index) => (
              <div key={index} className="mb-8">
                <div className="block w-full overflow-x-auto">
                  <ThemeProvider theme={getMuiTheme()}>
                    <MUIDataTable
                      title={
                        `Student ${index + 1}` +
                        " - " +
                        student.firstName +
                        " " +
                        student.lastName
                      }
                      data={student.classes.map((classItem) => [
                        classItem.TestDate,
                        classItem.testName,
                        `${(
                          (Number(classItem.result.score) /
                            Number(classItem.maxScore)) *
                          100
                        ).toFixed(0)}%`,
                        <button
                          onClick={() =>
                            handleShowComment(classItem.result.comment)
                          }
                          className="bg-blue-500 text-white active:bg-blue-600 font-bold uppercase text-xs px-4 py-2 rounded-full shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                          type="button"
                        >
                          Show Comment
                        </button>,
                      ])}
                      columns={columns}
                      options={options}
                    />
                  </ThemeProvider>
                </div>
              </div>
            ))}
          </div>
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
