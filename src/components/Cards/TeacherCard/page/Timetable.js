import React, { useContext, useEffect, useState } from "react";
import ExportToPDF from "./ExportToPDF";
import "./Timetable.css";
import { AuthContext } from "../../../../config/context/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../../config/firebase";

const Timetable = () => {
  const { currentUser } = useContext(AuthContext);
  const [classes, setClasses] = useState([]);
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const startHour = 8;
  const endHour = 18;

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const teacherQuery = query(collection(db, "teacher"), where("userID", "==", currentUser.uid));
        const teacherSnapshot = await getDocs(teacherQuery);

        if (!teacherSnapshot.empty) {
          const firstTeacherDoc = teacherSnapshot.docs[0];
          const teacherData = {
            id: firstTeacherDoc.id,
            ...firstTeacherDoc.data(),
          };

          const classesQuery = query(collection(db, "class"), where("teacher", "==", teacherData.id));
          const classesSnapshot = await getDocs(classesQuery);

          const classesData = await Promise.all(
            classesSnapshot.docs.map(async (doc) => {
              const classData = {
                id: doc.id,
                ...doc.data(),
              };

              const scheduleQuery = query(collection(db, "class", classData.id, "Schedule"));
              const scheduleSnapshot = await getDocs(scheduleQuery);
              const scheduleData = scheduleSnapshot.docs.map((doc) => doc.data());

              classData.schedule = scheduleData;
              return classData;
            })
          );

          setClasses(classesData);
        }
      } catch (error) {
        console.error("Error fetching classes data:", error);
      }
    };

    fetchClasses();
  }, [currentUser]);

  const renderTimetable = () => {
    return days.map((day) => {
      const daySubjects = classes
        .flatMap((classData) => classData.schedule.map((schedule) => ({ ...schedule, ...classData })))
        .filter((entry) => entry.day === day);

      return (
        <div key={day} className="day-column">
          <div className="day-header">{day}</div>
          {daySubjects.map((entry, index) => (
            <div
              key={index}
              className="timetable-entry"
              style={getTimeStyle(convertTimestamp(entry.startTime), convertTimestamp(entry.endTime))}
            >
              <div className="entry-subject">{entry.CourseName}</div>
              <div className="entry-location">{entry.location}</div>
              <div className="entry-time">
                {convertTimestamp(entry.startTime)} - {convertTimestamp(entry.endTime)}
              </div>
            </div>
          ))}
        </div>
      );
    });
  };

  const convertTimestamp = (timestamp) => {
    const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getTimeStyle = (start, end) => {
    const startHour = parseInt(start.split(":")[0]);
    const startMinute = parseInt(start.split(":")[1]);
    const endHour = parseInt(end.split(":")[0]);
    const endMinute = parseInt(end.split(":")[1]);

    const startPosition = (startHour - 8) * 60 + startMinute + 60;
    const endPosition = (endHour - 8) * 60 + endMinute + 60;
    const duration = endPosition - startPosition;

    return {
      top: `${startPosition}px`,
      height: `${duration}px`,
    };
  };

  const renderTimeSlots = () => {
    const slots = [];
    for (let i = startHour; i <= endHour; i++) {
      slots.push(
        <div key={i} className="time-slot">
          {i}:00
        </div>
      );
    }
    return slots;
  };

  return (
    <div id="timetable" className="timetable-container flex flex-col">
      <div className="flex justify-center items-center mb-4">
        <div className="font-bold text-xl text-center">
          PLMM Tuition Centre Timetable
        </div>
        <div className="ml-auto">
          <ExportToPDF />
        </div>
      </div>

      <div className="flex">
        <div className="time-column">
          <div className="time-slot-title">
            <div className="day-text">Day</div>
            <div className="time-text">Time</div>
          </div>
          {renderTimeSlots()}
        </div>
        <div className="timetable">{renderTimetable()}</div>
      </div>
    </div>
  );
};

export default Timetable;
