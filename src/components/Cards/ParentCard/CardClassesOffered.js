import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../../config/context/AuthContext";
import PropTypes from "prop-types";
import CardPagination from "../CardPagination";
import CardLoading from "../CardLoading";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import Swal from "sweetalert2";
import { db } from "../../../config/firebase";
import { Link, useLocation } from "react-router-dom";

function CardClassesOffered({ color }) {
  const { currentUser } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [teachers, setTeachers] = useState([]); // State to store teachers data
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [childrenDetails, setChildrenDetails] = useState([]); // State to store children's details
  const [selectedClass, setSelectedClass] = useState(null); // State to track selected class
  const location = useLocation();
  const classesPerPage = 5; // Number of classes to display per page

  useEffect(() => {
    const fetchChildrenClasses = async () => {
      try {
        const childrenRef = doc(db, "parent", currentUser.uid);
        const childrenSnapshot = await getDoc(childrenRef);
        const childrenData = childrenSnapshot.data();

        if (childrenData && childrenData.children) {
          const childrenIDs = childrenData.children;
          const childClassesPromises = childrenIDs.map(async (childID) => {
            const studentRef = doc(db, "students", childID);
            const studentSnapshot = await getDoc(studentRef);
            const studentData = studentSnapshot.data();
            console.log("Student data for ID:", childID, studentData);
            if (studentData) {
              const classRef = query(
                collection(db, "class"),
                where("academicLevel", "==", studentData.educationLevel)
              );
              const classSnapshot = await getDocs(classRef);
              const classData = classSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              console.log("Classes data: ", classData);

              // Loop through each class snapshot to fetch schedule data
              const classesWithSchedule = [];
              for (const classDoc of classSnapshot.docs) {
                // Get the schedule of the class
                const ClassSchedule = collection(
                  db,
                  "class",
                  classDoc.id,
                  "Schedule"
                );
                const ScheduleSnapshot = await getDocs(ClassSchedule);
                const ScheduleData = ScheduleSnapshot.docs.map((doc) =>
                  doc.data()
                );
                console.log("Schedule data:", ScheduleData);

                // Combine class data with schedule
                const classDataWithSchedule = {
                  id: classDoc.id,
                  ...classDoc.data(),
                  schedule: ScheduleData,
                };
                console.log("Class data with schedule:", classDataWithSchedule);

                // Push the combined data to the array
                classesWithSchedule.push(classDataWithSchedule);
                console.log("Classes with schedule 1: ", classesWithSchedule);
              }

              console.log("Classes with schedule: ", classesWithSchedule);
              console.log("Student data:", studentData);
              classesWithSchedule.forEach((classItem) => {
                studentData.registeredCourses.forEach((course) => {
                  if (classItem.id === course) {
                    const index = classesWithSchedule.findIndex(
                      (item) => item.id === classItem.id
                    );
                    if (index > -1) {
                      classesWithSchedule.splice(index, 1);
                    }
                  }
                });
              });

              return {
                id: childID,
                studentDetails: studentData,
                classes: classesWithSchedule,
              };
            } else {
              console.log("Student data not found for ID:", childID);
              return null;
            }
          });
          const childClasses = await Promise.all(childClassesPromises);

          // get the teacher userID
          const teacherRef = collection(db, "teacher");
          const teacherSnapshot = await getDocs(teacherRef);
          const teacherData = teacherSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // get the teacher Details
          const teacherUserRef = collection(db, "users");
          const teacherUserSnapshot = await getDocs(teacherUserRef);
          const teacherUserData = teacherUserSnapshot.docs.map((doc) =>
            doc.data()
          );
          teacherData.forEach((teacher, index) => {
            teacherData[index].firstName = teacherUserData[index].firstName;
            teacherData[index].lastName = teacherUserData[index].lastName;
          });
          console.log("Teachers data:", teacherData);
          setTeachers(teacherData);
          console.log("Children classes:", childClasses);
          setChildrenDetails(childClasses);
          setLoading(false);
        } else {
          console.log("No children found for user ID:", currentUser.uid);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching children classes:", error);
        setLoading(false);
      }
    };

    fetchChildrenClasses();
  }, []);

  const handleRegisterClass = async (studentID, classId) => {
    console.log("Registering class for student ID:  ", studentID, classId);
    try {
      const { isConfirmed } = await Swal.fire({
        title: 'Confirm Registration',
        text: 'Are you sure you want to register for this class?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Register',
        cancelButtonText: 'Cancel',
      });
  
      if (isConfirmed) {
        // Update the student's registeredCourses array
        const studentRef = doc(db, "students", studentID);
        const studentSnapshot = await getDoc(studentRef);
        const studentData = studentSnapshot.data();
        // Check if registeredCourses array exists, if not create it
        if (!studentData.registeredCourses) {
            studentData.registeredCourses = [];
            studentData.registeredCourses.push(classId);
            await setDoc(studentRef, studentData);
        } else if (studentData.registeredCourses.includes(classId)) {
            console.log("Student already registered for this class");
            return;
        } else {
            studentData.registeredCourses.push(classId);
            await setDoc(studentRef, studentData);
        }
  
        // Update the class's students array
        const classRef = doc(db, "class", classId);
        const classSnapshot = await getDoc(classRef);
        const classData = classSnapshot.data();
        // Check if students array exists, if not create it
        if (!classData.studentID) {
          classData.studentID = [];
          classData.studentID.push(studentID);
          await setDoc(classRef, classData);
        } else if (classData.studentID.includes(studentID)) {
          console.log("Student already registered for this class");
          return;
        } else {
          classData.studentID.push(studentID);
          await setDoc(classRef, classData);
        }
  
        // Update the state to reflect the registration
        setChildrenDetails((prevChildrenDetails) => {
          const updatedChildrenDetails = prevChildrenDetails.map((child) => {
            if (child.id === studentID) {
              const updatedClasses = child.classes.map((classItem) => {
                if (classItem.id === classId) {
                  return {
                    ...classItem,
                    studentID: [...classItem.studentID, studentID],
                  };
                }
                return classItem;
              });
              return {
                ...child,
                classes: updatedClasses,
              };
            }
            return child;
          });
          return updatedChildrenDetails;
        });
  
        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'You have successfully registered for the class.',
        });
      }
    } catch (error) {
      console.error("Error registering class:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'An error occurred while registering for the class. Please try again later.',
      });
    }
  };

  // Filter classes based on search term and active tab
  const filteredClasses = childrenDetails.filter((student) => {
    const filteredStudentClasses = student.classes.filter((classItem) =>
      classItem.CourseName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return filteredStudentClasses.length > 0;
  });

  // Calculate indexes for pagination
  const indexOfLastClass = currentPage * classesPerPage;
  const indexOfFirstClass = indexOfLastClass - classesPerPage;
  const currentClasses = filteredClasses.slice(
    indexOfFirstClass,
    indexOfLastClass
  );

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Calculate total number of pages
  const totalRegisteredPages = Math.ceil(
    filteredClasses.length / classesPerPage
  );

  // Function to close class details modal
  const handleCloseModal = () => {
    setSelectedClass(null);
  };

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
    if (teacher && teacher.firstName && teacher.lastName) {
      return `${teacher.firstName} ${teacher.lastName}`;
    } else {
      return "Not Available";
    }
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
            {/* Search input */}
            <div className="flex justify-end my-4 mx-8">
              <input
                type="text"
                placeholder="Search by subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-indigo-500"
                style={{ width: "300px" }}
              />
            </div>
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
                to="/admin/fee/classes"
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
            {childrenDetails.length >0 ? childrenDetails.map((student, index) => (
              <div key={index} className="mb-8">
                <h2 className="text-lg font-semibold mb-4 mx-5">
                  Student {index + 1}:{" "}
                  {student.studentDetails.firstName &&
                  student.studentDetails.lastName
                    ? student.studentDetails.firstName +
                      " " +
                      student.studentDetails.lastName
                    : "Name Not Available"}
                </h2>
                <table className="items-center w-full bg-transparent border-collapse">
                  {/* Table headers */}
                  <thead>
                    <tr>
                      <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                        Subject
                      </th>
                      <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                        School Level
                      </th>
                      <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                        Class Time
                      </th>
                      <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                        Register Number
                      </th>
                      <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                        Monthly Fee
                      </th>
                      <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                        Teacher Name
                      </th>
                      <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                        Register
                      </th>
                    </tr>
                  </thead>
                  {/* Table body */}
                  <tbody>
                    {student.classes.length > 0 ? (
                      student.classes.map((classItem) => (
                        <tr key={classItem.id}>
                          <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                            {classItem.CourseName}
                          </td>
                          <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                            {classItem.academicLevel}
                          </td>
                          <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                            {classItem.schedule.map((time, index) => (
                              <div key={index}>
                                {time.day} ({getTime(time.startTime)} -{" "}
                                {getTime(time.endTime)})
                              </div>
                            ))}
                          </td>
                          <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                            {classItem.studentID.length} / {classItem.MaxRegisteredStudent}
                          </td>
                          <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                            {classItem.fee}
                          </td>
                          <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                            {getTeacherName(classItem.teacher)}
                          </td>
                          {
                            // Check if the class is full
                            classItem.studentID.length >= classItem.MaxRegisteredStudent ? (
                              <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-red-500">
                                Class Full
                              </td>
                            ) : (
                              <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                                <button
                                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                  onClick={() =>
                                    handleRegisterClass(student.id, classItem.id)
                                  }
                                >
                                  Register
                                </button>
                              </td>
                            )
                          }
                        </tr>
                      ))
                    ) : (
                      <tr  className="text-center mt-3 font-bold">
                        <td colSpan="7">
                          No classes available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )): <div className="text-center text-red-500">No classes available</div>}
          </div>
          {/* Pagination */}
          <CardPagination
            currentPage={currentPage}
            totalPages={totalRegisteredPages}
            paginate={paginate}
          />
        </div>
      )}
    </>
  );
}

CardClassesOffered.defaultProps = {
  color: "light",
};

CardClassesOffered.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardClassesOffered;
