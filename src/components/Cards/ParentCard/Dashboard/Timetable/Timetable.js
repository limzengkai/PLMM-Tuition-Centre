import React from 'react';
import ExportToPDF from './ExportToPDF';
import TimetablePDF from './TimetablePDF';
import './Timetable.css';

const Timetable = ({ child }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const startHour = 8;

  const calculateEndHour = (classes) => {
    let latestEndTime = 18;
    classes.forEach((classData) => {
      classData.schedule.forEach((schedule) => {
        const endTime = new Date(schedule.endTime.seconds * 1000 + schedule.endTime.nanoseconds / 1000000);
        const endHour = endTime.getHours();
        const endMinute = endTime.getMinutes();
        if (endHour > latestEndTime || (endHour === latestEndTime && endMinute > 0)) {
          latestEndTime = endMinute > 0 ? endHour + 1 : endHour;
        }
      });
    });
    return latestEndTime < 18 ? 18 : latestEndTime;
  };

  const endHour = calculateEndHour(child.classes);

  const renderTimetable = (classes) => {
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
    <div id="timetable" className="timetable-container">
      <div className="flex justify-center items-center mb-4">
        <div className="font-bold text-xl text-center">PLMM Tuition Centre Timetable</div>
        <div className="ml-auto">
          <TimetablePDF childrenDetails={[child]} />
        </div>
      </div>

      <div key={child.id} className="child-timetable">
        <h2 className="child-name">
          {child.childDetails.firstName} {child.childDetails.lastName}'s Timetable
        </h2>
        <div className="flex">
          <div className="time-column">
            <div className="time-slot-title">
              <div className="day-text">Day</div>
              <div className="time-text">Time</div>
            </div>
            {renderTimeSlots()}
          </div>
          <div className="timetable">{renderTimetable(child.classes)}</div>
        </div>
      </div>
    </div>
  );
};

export default Timetable;
