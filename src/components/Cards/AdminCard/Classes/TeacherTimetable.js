import React from "react";
import "./TeacherTimetable.css";

const TeacherTimetable = ({ schedules }) => {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const startHour = 8;

  const calculateEndHour = () => {
    let latestEndTime = 18;
    schedules.forEach((schedule) => {
      const endTime = new Date(
        schedule.endTime.seconds * 1000 + schedule.endTime.nanoseconds / 1000000
      );
      const endHour = endTime.getHours();
      const endMinute = endTime.getMinutes();
      if (
        endHour > latestEndTime ||
        (endHour === latestEndTime && endMinute > 0)
      ) {
        latestEndTime = endMinute > 0 ? endHour + 1 : endHour;
      }
    });
    return latestEndTime < 18 ? 18 - 8 : latestEndTime - 8;
  };

  const endHour = calculateEndHour();

  const renderTimetable = (classes) => {
    return days.map((day) => {
      const daySubjects = classes.filter((entry) => entry.day === day);

      return (
        <div key={day} className="day-column">
          <div className="day-header">{day}</div>
          {daySubjects.map((entry, index) => (
            <div
              key={index}
              className="timetable-entry"
              style={getTimeStyle(
                convertTimestamp(entry.startTime),
                convertTimestamp(entry.endTime)
              )}
            >
              <div className="entry-subject" style={getTextStyle(entry.startTime, entry.endTime)}>
                {entry.className}
              </div>
              <div className="text-sm" style={getTextStyle(entry.startTime, entry.endTime)} >{"("+entry.academicLevel+")"}</div>
              <div className="entry-location" style={getTextStyle(entry.startTime, entry.endTime)}>{entry.location}</div>
              <div className="entry-time" style={getTextStyle(entry.startTime, entry.endTime)}>
                {convertTimestamp(entry.startTime)} -{" "}
                {convertTimestamp(entry.endTime)}
              </div>
            </div>
          ))}
        </div>
      );
    });
  };

  const convertTimestamp = (timestamp) => {
    const date = new Date(
      timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000
    );
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
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

  const getTextStyle = (startTime, endTime) => {
    const start = new Date(startTime.seconds * 1000 + startTime.nanoseconds / 1000000);
    const end = new Date(endTime.seconds * 1000 + endTime.nanoseconds / 1000000);
    const duration = (end - start) / (1000 * 60 * 60); // duration in hours

    return {
      fontSize: duration < 1.5 ? '9px' : '14px'
    };
  };

  return (
    <div className="timetable-container ">
      <div className="flex">
        <div className="time-column">
          <div className="time-slot-title">
            <div className="day-text">Days</div>
            <div className="time-text">Times</div>
          </div>
          {Array.from({ length: endHour }, (_, i) => i + startHour).map(
            (hour) => (
              <div key={hour} className="time-slot">
                {hour}:00
              </div>
            )
          )}
        </div>
        <div className="timetable">{renderTimetable(schedules)}</div>
      </div>
    </div>
  );
};

export default TeacherTimetable;
