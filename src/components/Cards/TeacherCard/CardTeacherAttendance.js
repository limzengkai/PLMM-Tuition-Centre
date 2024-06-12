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

function CardTeacherAttendance({ color }) {
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

  const data = classes.map((cls) => [
    cls.CourseName,
    cls.academicLevel,
    `${cls.studentID ? cls.studentID.length : 0} / ${
      cls.MaxRegisteredStudent
    }`,
    <div className="flex">
      <Link
        to={`/teacher/attendance/class/${cls.id}`}
        className="mr-3 text-white rounded-full font-bold py-2 px-4 bg-blue-500 hover:bg-blue-600"
      >
        View
      </Link>
      <Link
        to={`/teacher/attendance/record/${cls.id}`}
        className="text-white rounded-full font-bold py-2 px-4 bg-green-500 hover:bg-green-600"
      >
        Record
      </Link>
    </div>,
  ]);

  const columns = [
    { name: "Class" },
    { name: "Academic Level" },
    { name: "Registered Students" },
    { name: "Actions", options: { sort: false } },
  ];

  const getMuiTheme = () =>
    createTheme({
      typography: {
        fontFamily: "Poppins",
      },
    });

  const options = {
    responsive: "standard",
    selectableRows: "none",
    downloadOptions: { excludeColumns: [3] },
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
            <span className="text-gray-500">Attendance</span>
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

CardTeacherAttendance.defaultProps = {
  color: "light",
};

CardTeacherAttendance.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardTeacherAttendance;
