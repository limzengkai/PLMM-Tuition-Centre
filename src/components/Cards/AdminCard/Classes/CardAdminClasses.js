import React from "react";
import PropTypes from "prop-types";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import {
  arrayRemove,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import MUIDataTable from "mui-datatables";
import { db } from "../../../../config/firebase";

function CardAdminClasses({ classes, color }) {

  function formatTime(time) {
    const date = new Date(time.seconds * 1000); // Convert seconds to milliseconds
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "pm" : "am";
    const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
    const formattedMinutes = minutes.toString().padStart(2, "0"); // Add leading zero if needed
    return `${formattedHours}:${formattedMinutes}${ampm}`;
  }

  const handleDeactivate = (id) => {
    // Implement activation logic
  };

  const handleDelete = async (id) => {
    try {
      // Show confirmation dialog
      const confirmation = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
      });

      // If user confirms deletion
      if (confirmation.isConfirmed) {
        // Construct a reference to the class document
        const classDocRef = doc(db, "class", id);
        const classDoc = await getDoc(classDocRef);
        if (!classDoc.exists()) {
          throw new Error("Document not found");
        }

        // Fetch all documents in the Schedule subcollection
        const scheduleRef = collection(db, "class", id, "Schedule");
        const scheduleSnapshot = await getDocs(scheduleRef);

        // Delete each document in the Schedule subcollection
        await Promise.all(
          scheduleSnapshot.docs.map((scheduleDoc) =>
            deleteDoc(doc(db, "class", id, "Schedule", scheduleDoc.id))
          )
        );

        // Fetch all students registered for the class
        const studentClassQuery = query(
          collection(db, "students"),
          where("registeredCourses", "array-contains", id)
        );
        const studentClassSnapshot = await getDocs(studentClassQuery);

        // Remove courseId from registeredCourses array for each student
        await Promise.all(
          studentClassSnapshot.docs.map(async (studentDoc) => {
            const studentRef = doc(db, "students", studentDoc.id);
            await updateDoc(studentRef, {
              registeredCourses: arrayRemove(id),
            });
          })
        );

        // Remove the teacher subjectTaught field
        const teacherRef = doc(db, "teacher", classDoc.data().teacher);
        await updateDoc(teacherRef, {
          subjectTaught: arrayRemove(id),
        });

        // Delete the class document
        await deleteDoc(classDocRef);

        // Show success message
        Swal.fire(
          "Deleted!",
          "Class document has been deleted.",
          "success"
        ).then(() => {
          window.location.reload();
        });
      }
    } catch (error) {
      // Handle errors
      console.error("Error deleting class document:", error);
      // Show error message
      Swal.fire("Error!", "Failed to delete class document.", "error");
    }
  };

  const columns = [
    {
      name: "CourseName",
      label: "CLASS NAME",
    },
    {
      name: "academicLevel",
      label: "ACADEMIC LEVEL",
    },
    {
      name: "studentID",
      label: "REGISTERED STUDENT",
      options: { filter: false, sort: false },
    },
    {
      name: "schedule",
      label: "SCHEDULE",
      options: { filter: false, sort: false },
    },
    {
      name: "location",
      label: "LOCATION",
    },
    {
      name: "actions",
      label: "ACTION",
      options: { filter: false, sort: false },
    },
  ];

  const data = classes.map((cls) => [
    cls.CourseName,
    cls.academicLevel,
    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
      {cls.studentID.length} / {cls.MaxRegisteredStudent}
    </td>,
    <div className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
      {cls.schedule.map((day, i) => (
        <div key={i}>
          {day.day} ({formatTime(day.startTime)} - {formatTime(day.endTime)})
        </div>
      ))}
    </div>,
    <div className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
      {cls.schedule.map((day, i) => (
        <div key={i}>{day.location}</div>
      ))}
    </div>,
    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
      <Link
        to={`/admin/classes/view/${cls.id}`}
        className="mr-3 text-black rounded-full font-bold py-2 px-4 bg-blue-500"
      >
        View
      </Link>
      <Link
        to={`/admin/classes/edit/${cls.id}`}
        className="text-white rounded-full font-bold py-2 px-4 bg-green-500"
      >
        Edit
      </Link>
      <button
        onClick={() => handleDelete(cls.id)}
        className="text-white rounded-full font-bold py-2 px-4 bg-gray-500 ml-2"
      >
        Delete
      </button>
      {/* <button
        onClick={() => handleDeactivate(cls.id)}
        className="text-white rounded-full font-bold py-2 px-4 bg-red-500 ml-2"
      >
        Deactivate
      </button> */}
    </td>,
  ]);

  const getMuiTheme = () =>
    createTheme({
      typography: {
        fontFamily: "Poppins",
      },
      components: {
        MUIDataTableHeadCell: {
          styleOverrides: {
            root: {
              fontSize: "12px", // Adjusted font size
              // textAlign: "center",
            },
          },
        },
        MUIDataTableBodyCell: {
          styleOverrides: {
            root: {
              fontSize: "12px", // Adjusted font size
              textAlign: "left", // Align text to the left
            },
          },
        },
      },
    });

  return (
    <div
      className={
        "relative mx-auto px-4 py-8 flex flex-col min-w-0 break-words w-full shadow-lg rounded " +
        (color === "light" ? "bg-white" : "bg-lightBlue-900 text-white")
      }
    >
      <h2 className="text-xl font-bold mb-4">Classes Management</h2>
      <div className="flex justify-between mb-3 border-t border-gray-300 pt-3">
        {/* Active and Inactive class */}
        <div className="flex">
          {/* <Link
            to="/admin/classes"
            className={
              " rounded-l-lg font-bold py-2 px-4" +
              (location.pathname === "/admin/classes"
                ? " bg-blue-500 text-white hover:text-lightBlue-100"
                : " text-black  hover:bg-blue-500 hover:text-white")
            }
          >
            Active Class
          </Link>

          <Link
            to="/admin/classes/inactive"
            className={
              " rounded-r-lg font-bold py-2 px-4 m-0" +
              (location.pathname.includes("/admin/users/registration")
                ? "  bg-blue-500 text-white hover:text-lightBlue-100"
                : " text-black  hover:bg-blue-500 hover:text-white")
            }
          >
            Registration
          </Link> */}
        </div>
        <div>
          <Link
            className="m-0 p-4 rounded-lg text-black bg-yellow-400 font-bold py-2 px-4"
            onClick={() => {
              // Add New Class functionality here
            }}
            to={`/admin/classes/add`}
            style={{ marginLeft: "1rem" }}
          >
            Add New Class
          </Link>
        </div>
      </div>
      <div className="block w-full overflow-x-auto">
        <ThemeProvider theme={getMuiTheme()}>
          <MUIDataTable
            title=""
            data={data}
            columns={columns}
            options={{
              selectableRows: "none",
              search: false,
              filter: false,
              download: false,
              print: false,
              viewColumns: false,
            }}
          />
        </ThemeProvider>
      </div>
    </div>
  );
}

CardAdminClasses.defaultProps = {
  color: "light",
};

CardAdminClasses.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardAdminClasses;
