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
  where,
} from "firebase/firestore";
import { db } from "../../../config/firebase";
import { Link, useLocation } from "react-router-dom";

function ClassesPage({ color }) {
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
          console.log("Classes snapshot:", classesSnapshot.docs);
          
          // Create an array to store class data with schedules
          const classesWithSchedule = [];
          
          // Loop through each class snapshot to fetch schedule data
          for (const classDoc of classesSnapshot.docs) {
            // Get the schedule of the class
            const ClassSchedule = collection(db, "class", classDoc.id, "Schedule");
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
          ...doc.data()
        }));

        // get the teacher Details
        const teacherUserRef = collection(db, "users");
        const teacherUserSnapshot = await getDocs(teacherUserRef);
        const teacherUserData = teacherUserSnapshot.docs.map((doc) => doc.data());
        teacherData.forEach((teacher, index) => {
          teacherData[index].firstName = teacherUserData[index].firstName;
          teacherData[index].lastName = teacherUserData[index].lastName;
        });
        console.log("Teachers data: ", teacherData);
        setTeachers(teacherData);
        setChildrenDetails(childClasses);
        console.log("Children classes:", childClasses);
        setLoading(false);
      }
    };

    fetchChildrenClasses();
  }, [currentUser.uid]);

  // Dummy data for demonstration
  const dummyRegisteredClasses = [
    {
      id: 1,
      subject: "Mathematics",
      classTime: ["Monday [3:00pm - 5:00pm]", "Saturday [10:00am - 12:00pm]"],
      schoolLevel: "Primary",
      monthlyFee: "$100",
    },
    // Add more registered class data as needed
  ];

  // Filter classes based on search term and active tab
  const filteredClasses = dummyRegisteredClasses.filter((classItem) =>
    classItem.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    dummyRegisteredClasses.length / classesPerPage
  );

  // Function to handle view class details
  const handleViewClass = (classItem) => {
    setSelectedClass(classItem);
  };

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
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : "Not Available";
  }

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
            <h2 className="text-lg font-semibold mb-4 mx-5">Student {index + 1}: {student.childDetails.firstName + " " + student.childDetails.lastName}</h2>
            <table className="table-fixed items-center w-full bg-transparent border-collapse">
              {/* Table headers */}
              <thead>
                <tr>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Subject
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Class Time
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    School Level
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Monthly Fee
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Teacher Name
                  </th>
                </tr>
              </thead>
              {/* Table body */}
              <tbody>
                {Array.isArray(student.classes) && student.classes.map((classItem) => (
                  <tr key={classItem.id}>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {classItem.CourseName}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {classItem.schedule.map((time, index) => (
                        <div key={index}>{time.day} ({getTime(time.startTime)} - {getTime(time.endTime)})</div>
                      ))}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {classItem.academicLevel}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {classItem.fee}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {getTeacherName(classItem.teacher)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
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

ClassesPage.defaultProps = {
  color: "light",
};

ClassesPage.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default ClassesPage;
