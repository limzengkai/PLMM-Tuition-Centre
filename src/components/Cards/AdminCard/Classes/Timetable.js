// Timetable.js
import React from 'react';
import './Timetable.css';

const Timetable = ({ schedules }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const startHour = 8;

  const calculateEndHour = () => {
    let latestEndTime = 18;
    schedules.forEach((schedule) => {
        const endTime = new Date(schedule.endTime.seconds * 1000 + schedule.endTime.nanoseconds / 1000000);
        const endHour = endTime.getHours();
        const endMinute = endTime.getMinutes();
        if (endHour > latestEndTime || (endHour === latestEndTime && endMinute > 0)) {
          latestEndTime = endMinute > 0 ? endHour + 1 : endHour;
        }
      });
    return latestEndTime < 18 ? 18 - 8 : latestEndTime - 8;
  };

  const endHour = calculateEndHour();

  const renderTimetable = (classes) => {
    console.log(classes);
    return days.map((day) => {
      const daySubjects = classes.filter((entry) => entry.day === day);

      return (
        <div key={day} className="day-column">
          <div className="day-header">{day}</div>
          {daySubjects.map((entry, index) => (
            <div
              key={index}
              className="timetable-entry"
              style={getTimeStyle(convertTimestamp(entry.startTime), convertTimestamp(entry.endTime))}
            >
              <div className="entry-subject">{entry.className}</div>
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
    const startHour = parseInt(start.split(':')[0]);
    const startMinute = parseInt(start.split(':')[1]);
    const endHour = parseInt(end.split(':')[0]);
    const endMinute = parseInt(end.split(':')[1]);

    const startPosition = (startHour - 8) * 60 + startMinute + 60;
    const endPosition = (endHour - 8) * 60 + endMinute + 60;
    const duration = endPosition - startPosition;

    return {
      top: `${startPosition}px`,
      height: `${duration}px`,
    };
  };

  return (
    <div className="timetable-container">
      <div className="time-column">
        <div className="time-slot-title">
          <div className="day-text">Day</div>
          <div className="time-text">Time</div>
        </div>
        {Array.from({ length: endHour }, (_, i) => i + startHour).map((hour) => (
          <div key={hour} className="time-slot">
            {hour}:00
          </div>
        ))}
      </div>
      <div className="timetable">{renderTimetable(schedules)}</div>
    </div>
  );
};

export default Timetable;
