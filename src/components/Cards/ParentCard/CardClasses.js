import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../../config/context/AuthContext";
import PropTypes from "prop-types";
import CardLoading from "../CardLoading";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../../config/firebase";
import { Link, useLocation } from "react-router-dom";
import MUIDataTable from "mui-datatables";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@emotion/react";

function ClassesPage({ color }) {
  const { currentUser } = useContext(AuthContext);
  const [teachers, setTeachers] = useState([]); // State to store teachers data
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [childrenDetails, setChildrenDetails] = useState([]); // State to store children's details
  const location = useLocation();

  useEffect(() => {
    const fetchChildrenClasses = async () => {
      const childrenRef = doc(db, "parent", currentUser.uid);
      const childrenSnapshot = await getDoc(childrenRef);
      const childrenData = childrenSnapshot.data();

      // Check if children data exists and has children
      if (childrenData && childrenData.children) {
        const childrenIDs = childrenData.children;
        const childClassesPromises = childrenIDs.map(async (childID) => {
          const classesRef = query(
            collection(db, "class"),
            where("studentID", "array-contains", childID)
          );
          const classesSnapshot = await getDocs(classesRef);

          // Create an array to store class data with schedules
          const classesWithSchedule = [];

          // Loop through each class snapshot to fetch schedule data
          for (const classDoc of classesSnapshot.docs) {
            // Get the schedule of the class
            const ClassSchedule = collection(
              db,
              "class",
              classDoc.id,
              "Schedule"
            );
            const ScheduleSnapshot = await getDocs(ClassSchedule);
            const ScheduleData = ScheduleSnapshot.docs.map((doc) => doc.data());

            // Combine class data with schedule
            const classDataWithSchedule = {
              id: classDoc.id,
              ...classDoc.data(),
              schedule: ScheduleData,
            };

            // Push the combined data to the array
            classesWithSchedule.push(classDataWithSchedule);
          }

          //Get the student Details
          const childRef = doc(db, "students", childID);
          const childSnapshot = await getDoc(childRef);
          const childData = childSnapshot.data();

          return {
            id: childID,
            childDetails: childData,
            classes: classesWithSchedule,
          };
        });
        const childClasses = await Promise.all(childClassesPromises);

        // get the teacher userID
        const teacherRef = collection(db, "teacher");
        const teacherSnapshot = await getDocs(teacherRef);
        const teacherData = teacherSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // get the Users Details
        const teacherUserRef = collection(db, "users");
        const teacherUserSnapshot = await getDocs(teacherUserRef);
        const teacherUserData = teacherUserSnapshot.docs.map((doc) => {
          return { uid: doc.id, ...doc.data() };
        });

        teacherData.forEach((teacher, index) => {
          teacherUserData.find((user) => {
            if (user.uid === teacher.userID) {
              teacherData[index] = { ...teacher, ...user };
            }
          });
        });
        setTeachers(teacherData);
        setChildrenDetails(childClasses);
        setLoading(false);
      }
    };

    fetchChildrenClasses();
  }, [currentUser.uid]);

  const getTime = (timestamp) => {
    const d = timestamp.toDate();
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const amOrPm = hours >= 12 ? "PM" : "AM";
    const hourFormat = hours % 12 || 12;
    const minuteFormat = minutes < 10 ? `0${minutes}` : minutes;
    return `${hourFormat}:${minuteFormat} ${amOrPm}`;
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find((teacher) => teacher.id === teacherId);
    return teacher
      ? `${teacher.firstName} ${teacher.lastName}`
      : "Not Available";
  };

  const columns = [
    { name: "Subject" },
    { name: "Class Time", options: { filter: false, sort: false } },
    { name: "School Level" },
    { name: "Monthly Fee" },
    { name: "Teacher Name" },
  ];

  const getMuiTheme = () =>
    createTheme({
      typography: {
        fontFamily: "Poppins",
      },
      components: {
        MUIDataTableHeadCell: {
          fixedHeaderCommon: {
            backgroundColor: "transparent",
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
            "relative flex flex-col min-w-0 break-words w-full shadow-lg rounded " +
            (color === "light" ? "bg-white" : "bg-lightBlue-900 text-white")
          }
        >
          {/* Tabs for Registered Classes and Offered Classes */}
          <div className="rounded-t mb-0 px-4 py-3 border-0">
            <div className="flex flex-wrap items-center">
              <div className="relative w-full px-4 max-w-full flex-grow flex-1">
                <h3
                  className={
                    "font-semibold text-lg " +
                    (color === "light" ? "text-blueGray-700" : "text-white")
                  }
                >
                  Classes
                </h3>
                <p className="text-sm text-gray-500">
                  To delete a class, please contact the admin
                </p>
              </div>
            </div>
          </div>
          {/* Class table */}
          <div className="block w-full overflow-x-auto">
            <div className="flex mb-4 mx-4">
              <Link
                to="/parent/classes"
                className={`rounded-l-lg font-bold py-2 px-4 ${
                  location.pathname === "/parent/classes"
                    ? "bg-blue-500 text-white hover:text-lightBlue-100"
                    : "text-black hover:text-white hover:bg-blue-500"
                }`}
              >
                Class List
              </Link>
              <Link
                to="/parent/classes/register"
                className={`rounded-r-lg font-bold py-2 px-4 ${
                  location.pathname === "/parent/classes/register"
                    ? "bg-blue-500 text-white hover:text-lightBlue-100"
                    : "text-black hover:text-white hover:bg-blue-500"
                }`}
              >
                Class Offered
              </Link>
            </div>
            {/* Class table */}
            {childrenDetails.map((student, index) => (
              <div key={index} className="mb-8">
                <div className="block w-full overflow-x-auto">
                  <ThemeProvider theme={getMuiTheme()}>
                    <MUIDataTable
                      title={`Student ${index + 1}: ${
                        student.childDetails.firstName
                      } ${student.childDetails.lastName}`}
                      data={student.classes.map((classItem) => [
                        classItem.CourseName,
                        <div>
                          {classItem.schedule.map((time, i) => (
                            <React.Fragment key={i}>
                              {`${time.day} (${getTime(
                                time.startTime
                              )} - ${getTime(time.endTime)})`}
                              <br />
                            </React.Fragment>
                          ))}
                        </div>,
                        classItem.academicLevel,
                        "RM "+ classItem.fee,
                        getTeacherName(classItem.teacher),
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

ClassesPage.defaultProps = {
  color: "light",
};

ClassesPage.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default ClassesPage;
