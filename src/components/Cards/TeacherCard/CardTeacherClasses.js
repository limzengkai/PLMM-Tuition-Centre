import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../../config/context/AuthContext";
import PropTypes from "prop-types";
import { db } from "../../../config/firebase";
import { Link } from "react-router-dom";
import CardLoading from "../CardLoading";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import MUIDataTable from "mui-datatables";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@emotion/react";

function CardTeacherClasses({ color }) {
  const { currentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const teacherQuery = query(
          collection(db, "teacher"),
          where("userID", "==", currentUser.uid)
        );

        const teacherSnapshot = await getDocs(teacherQuery);

        if (!teacherSnapshot.empty) {
          const firstTeacherDoc = teacherSnapshot.docs[0];
          const teacherData = {
            id: firstTeacherDoc.id,
            ...firstTeacherDoc.data(),
          };

          const classesQuery = query(
            collection(db, "class"),
            where("teacher", "==", teacherData.id)
          );

          const classesSnapshot = await getDocs(classesQuery);

          const classesData = classesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setLoading(false);
          setClasses(classesData);
        }
      } catch (error) {
        console.error("Error fetching classes data:", error);
      }
    };

    fetchClasses();
  }, [currentUser]);

  const columns = [
    { name: "Class" },
    { name: "Academic Level" },
    { name: "Register No", options: { filter: false, sort: false } },
    { name: "Action", options: { filter: false, sort: false } },
  ];

  const data = classes.map((cls) => [
    cls.CourseName,
    cls.academicLevel,
    `${cls.studentID ? cls.studentID.length : 0} / ${
      cls.MaxRegisteredStudent
    }`,
    <div className="flex">
      <Link
        to={`/teacher/classes/view/${cls.id}`}
        className="mr-3 text-white rounded-full font-bold py-2 px-4 bg-blue-500 hover:bg-blue-600"
      >
        View
      </Link>
      <Link
        to={`/teacher/classes/grade/${cls.id}`}
        className="text-white rounded-full font-bold py-2 px-4 bg-green-500"
      >
        Grade
      </Link>
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
        <div
          className={
            "relative mx-auto px-4 py-8 flex flex-col min-w-0 break-words w-full shadow-lg rounded " +
            (color === "light" ? "bg-white" : "bg-lightBlue-900 text-white")
          }
        >
          <div className="flex items-center mb-4 font-bold text-xl">
            <span to="/admin/classes" className="text-gray-500">
              Classes
            </span>
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
        </div>
      )}
    </>
  );
}

CardTeacherClasses.defaultProps = {
  color: "light",
};

CardTeacherClasses.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardTeacherClasses;
