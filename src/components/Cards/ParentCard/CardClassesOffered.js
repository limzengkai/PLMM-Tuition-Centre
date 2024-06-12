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
import Swal from "sweetalert2";
import { db } from "../../../config/firebase";
import { Link, useLocation, useNavigate } from "react-router-dom";

function CardClassesOffered({ color }) {
  const { currentUser } = useContext(AuthContext);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [childrenDetails, setChildrenDetails] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchChildrenClasses = async () => {
    try {
      const childrenRef = doc(db, "parent", currentUser.uid);
      const childrenSnapshot = await getDoc(childrenRef);
      const childrenData = childrenSnapshot.data();

      if (childrenData && childrenData.children) {
        const childrenIDs = childrenData.children;
        const childClassesResults = [];

        for (const childID of childrenIDs) {
          const studentRef = doc(db, "students", childID);
          const studentSnapshot = await getDoc(studentRef);
          const studentData = studentSnapshot.data();
          if (studentData) {
            const classRef = query(
              collection(db, "class"),
              where("academicLevel", "==", studentData.educationLevel)
            );
            const classSnapshot = await getDocs(classRef);
            const classesWithSchedule = [];

            for (const classDoc of classSnapshot.docs) {
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

              const classDataWithSchedule = {
                id: classDoc.id,
                ...classDoc.data(),
                schedule: ScheduleData,
              };
              classesWithSchedule.push(classDataWithSchedule);
            }

            for (let i = 0; i < classesWithSchedule.length; i++) {
              for (let j = 0; j < studentData.registeredCourses.length; j++) {
                if (
                  classesWithSchedule[i].id === studentData.registeredCourses[j]
                ) {
                  const index = classesWithSchedule.findIndex(
                    (item) => item.id === studentData.registeredCourses[j]
                  );
                  if (index > -1) {
                    classesWithSchedule.splice(index, 1);
                  }
                }
              }
            }
            childClassesResults.push({
              id: childID,
              studentDetails: studentData,
              classes: classesWithSchedule,
            });
          } else {
            console.log("Student data not found for ID: ", childID);
          }
        }

        const teacherRef = collection(db, "teacher");
        const teacherSnapshot = await getDocs(teacherRef);
        const teacherData = teacherSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const teacherUserRef = collection(db, "users");
        const teacherUserSnapshot = await getDocs(teacherUserRef);
        const teacherUserData = teacherUserSnapshot.docs.map((doc) =>
          doc.data()
        );
        teacherData.forEach((teacher, index) => {
          teacherData[index].firstName = teacherUserData[index].firstName;
          teacherData[index].lastName = teacherUserData[index].lastName;
        });

        setTeachers(teacherData);
        setChildrenDetails(childClassesResults.filter((item) => item !== null));
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching children classes:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildrenClasses();
  }, []);

  const calculateFee = (schedule) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const dayMapping = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    // Function to calculate the number of specific days in a month
    const countSpecificDaysInMonth = (year, month, day) => {
      let count = 0;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        if (date.getDay() === day) {
          count++;
        }
      }
      return count;
    };

    // Function to calculate remaining specific days in the month
    const countRemainingSpecificDaysInMonth = (
      year,
      month,
      day,
      currentDay
    ) => {
      let count = 0;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let i = currentDay; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        if (date.getDay() === day) {
          count++;
        }
      }
      return count;
    };

    let totalClasses = 0;
    let remainingClasses = 0;

    schedule.forEach((classSchedule) => {
      const dayOfWeek = dayMapping[classSchedule.day]; // Convert day name to day number
      totalClasses += countSpecificDaysInMonth(
        currentYear,
        currentMonth,
        dayOfWeek
      );
      remainingClasses += countRemainingSpecificDaysInMonth(
        currentYear,
        currentMonth,
        dayOfWeek,
        currentDate.getDate()
      );
    });

    return {
      totalClasses,
      remainingClasses,
    };
  };

  const handleRegisterClass = async (CourseName, studentID, classId, fee, schedule) => {
    try {
      const { isConfirmed } = await Swal.fire({
        title: "Confirm Registration",
        text: "Are you sure you want to register for this class?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Register",
        cancelButtonText: "Cancel",
      });

      if (isConfirmed) {
        console.log(calculateFee(schedule));
        const totalClasses = calculateFee(schedule).totalClasses;
        const remainingClasses = calculateFee(schedule).remainingClasses;
        const totalFee = (fee / totalClasses) * remainingClasses;

        Swal.fire({
          title: "Payment Required",
          text: `The total fee is RM${totalFee.toFixed(
            2
          )}. Proceed to payment?`,
          icon: "info",
          showCancelButton: true,
          confirmButtonText: "Proceed",
          cancelButtonText: "Cancel",
        }).then((result) => {
          if (result.isConfirmed) {
            navigate(`/parent/new-class/payment`, {
              state: {
                courseName: CourseName,
                totalFee: totalFee,
                studentID: studentID,
                classId: classId,
              },
            });
          }
        });
      }
    } catch (error) {
      console.error("Error registering class:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "An error occurred while registering for the class. Please try again later.",
      });
    }
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
            {childrenDetails.length > 0 ? (
              childrenDetails.map((student, index) => (
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
                              {classItem.studentID.length} /{" "}
                              {classItem.MaxRegisteredStudent}
                            </td>
                            <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                              {classItem.fee}
                            </td>
                            <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                              {getTeacherName(classItem.teacher)}
                            </td>
                            {classItem.studentID.length >=
                            classItem.MaxRegisteredStudent ? (
                              <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-red-500">
                                Class Full
                              </td>
                            ) : (
                              <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                                <button
                                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                  onClick={() =>
                                    handleRegisterClass(
                                      classItem.CourseName,
                                      student.id,
                                      classItem.id,
                                      classItem.fee,
                                      classItem.schedule
                                    )
                                  }
                                >
                                  Register
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr className="text-center mt-3 font-bold">
                          <td colSpan="7">No classes available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ))
            ) : (
              <div className="text-center text-red-500">
                No classes available
              </div>
            )}
          </div>
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
