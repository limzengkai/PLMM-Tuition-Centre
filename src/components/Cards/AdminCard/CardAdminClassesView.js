import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Link, useParams } from "react-router-dom";
import { db } from "../../../config/firebase";
import { getDocs, collection, getDoc, doc} from "firebase/firestore";
import CardLoading from "../CardLoading";

function CardAdminClassesView({ color }) {
  const { id } = useParams();
  const [classDetails, setClassDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClassData() {
      try {
        const classCollectionRef = collection(db, "class");
        const classSnapshot = await getDocs(classCollectionRef);
        
        for (const classDoc of classSnapshot.docs) {
          const classData = classDoc.data();
          const classId = classDoc.id;
  
          if (classId === id) {
            const scheduleCollectionRef = collection(classCollectionRef, classId, "Schedule");
            const scheduleSnapshot = await getDocs(scheduleCollectionRef);
  
            const scheduleData = [];
            scheduleSnapshot.forEach((scheduleDoc) => {
              scheduleData.push(scheduleDoc.data());
            });
  
            const mergedData = { id: classId, ...classData, schedule: scheduleData };
            const teacherDoc = await getDoc(doc(db, "teacher", mergedData.teacher));
            const teacherData = await getDoc(doc(db, "users", teacherDoc.data().userID));
            mergedData.teacherName = teacherData.data().firstName + " " + teacherData.data().lastName;
            setClassDetails(mergedData);
            setLoading(false);
            return;
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching documents: ", error);
        setLoading(false);
      }
    }
  
    fetchClassData();
  }, [id]);

  function formatTime(time) {
    if (!time || !time.seconds) {
      return ""; // Handle case where time is undefined or time.seconds is not available
    }
    const date = new Date(time.seconds * 1000); // Convert seconds to milliseconds
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "pm" : "am";
    const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
    const formattedMinutes = minutes.toString().padStart(2, "0"); // Add leading zero if needed
    return `${formattedHours}:${formattedMinutes}${ampm}`;
  }

  return (
    <>
      {loading ? (
        <CardLoading loading={loading} />
      ) : (<div className={"relative mx-auto px-4 py-8 flex flex-col min-w-0 break-words w-full shadow-lg rounded " +
      (color === "light" ? "bg-white" : "bg-lightBlue-900 text-white")}>
      <div className="flex items-center mb-4 font-bold text-xl">
        <Link to="/admin/classes" className="text-blue-500 hover:underline">Classes Management</Link>
        <span className="mx-2">&nbsp;/&nbsp;</span>
        <span className="text-gray-500">View Class's Details</span>
      </div>
      {classDetails ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Class Name</h2>
            <p className="text-sm">{classDetails.CourseName}</p>
          </div>
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Academic Level</h2>
            <p className="text-sm">{classDetails.academicLevel}</p>
          </div>
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Class Fee</h2>
            <p className="text-sm">{classDetails.fee}</p>
          </div>
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Total Registered Students</h2>
            <p className="text-sm">{classDetails.studentID.length}</p>
          </div>
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Teacher Name</h2>
            <p className="text-sm">{classDetails.teacherName}</p>
          </div>
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Location</h2>
            <p className="text-sm">{classDetails.location}</p>
          </div>
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Schedule</h2>
            <ul className="list-disc list-inside">
              {classDetails.schedule.map((day, i) => (
                <li key={i} className="text-sm">{day.day} ({formatTime(day.startTime)} - {formatTime(day.endTime)})</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-red-500">No class's details not found!</div>
      )}
      <div className="mt-8">
        <Link
          to="/admin/classes"
          className="bg-blue-500 text-white py-2 px-4 rounded mr-4"
        >
          Back to Classes
        </Link>
        <Link
          to={`/admin/classes/edit/${id}`}
          className="bg-green-500 text-white py-2 px-4 rounded"
        >
          Edit Class
        </Link>
      </div>
    </div>
    )}
</>
  );
}

CardAdminClassesView.defaultProps = {
  color: "light",
};

CardAdminClassesView.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardAdminClassesView;