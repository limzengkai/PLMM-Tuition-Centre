import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../config/firebase";
import CardLoading from "../../CardLoading";
import MUIDataTable from "mui-datatables";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@emotion/react";

function CardAdminAttendance({ color }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const classDoc = await getDocs(collection(db, "class"));
        const classData = classDoc.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClasses(classData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching classes:", error);
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const columns = [
    { name: "CLASS NAME" },
    { name: "ACADEMIC LEVEL" },
    { name: "REGISTERED STUDENTS" ,
      options: { filter: false, sort: false },
    },
    {
      name: "ACTIONS",
      options: { filter: false, sort: false },
    },
  ];

  const data = classes.map((classItem) => [
    classItem.CourseName,
    classItem.academicLevel,
    `${classItem.studentID.length} / ${classItem.MaxRegisteredStudent}`,
    <div className="flex">
      <Link
        to={`/admin/attendance/class/${classItem.id}`}
        className="mr-3 text-white rounded-full font-bold py-1 px-4 bg-blue-500 hover:bg-blue-600"
      >
        View
      </Link>
      <Link
        to={`/admin/attendance/record/${classItem.id}`}
        className="text-white rounded-full font-bold py-1 px-4 bg-green-500 hover:bg-green-600"
      >
        Record
      </Link>
    </div>,
  ]);

  const getMuiTheme = () =>
    createTheme({
      typography: {
        fontFamily: "Poppins",
      },
      overrides: {
        MUIDataTableHeadCell: { root: { fontSize: "12px" } },
        MUIDataTableBodyCell: { root: { fontSize: "12px" } },
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
              <MUIDataTable data={data} columns={columns} options={options} />
            </ThemeProvider>
          </div>
        </div>
      )}
    </>
  );
}

CardAdminAttendance.defaultProps = {
  color: "light",
};

CardAdminAttendance.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardAdminAttendance;
