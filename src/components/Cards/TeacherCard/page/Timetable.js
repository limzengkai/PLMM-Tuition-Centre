import React from "react";

const ClassTimetable = () => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const classTimes = [
    { start: "08:00", end: "09:00" },
    { start: "09:00", end: "10:00" },
    { start: "10:00", end: "11:00" },
    { start: "11:00", end: "12:00" },
    { start: "12:00", end: "13:00" },
    { start: "13:00", end: "14:00" },
    { start: "14:00", end: "15:00" },
    { start: "15:00", end: "16:00" },
    { start: "16:00", end: "17:00" },
    { start: "17:00", end: "18:00" },
    { start: "18:00", end: "19:00" },
    { start: "19:00", end: "20:00" },
    { start: "20:00", end: "21:00" },
    { start: "21:00", end: "22:00" },
  ];

  // Sample class schedule data
  const classSchedule = [
    { day: "Monday", start: "08:00", end: "09:00", className: "Mathematics" },
    { day: "Tuesday", start: "10:00", end: "12:00", className: "Science" },
    { day: "Wednesday", start: "09:00", end: "11:00", className: "History" },
    { day: "Thursday", start: "13:00", end: "14:00", className: "English" },
    { day: "Friday", start: "15:00", end: "16:00", className: "Art" },
  ];

  // Function to calculate col span for multi-hour class times
  const calculateColSpan = (startTime, endTime) => {
    const startHour = parseInt(startTime.split(":")[0]);
    const endHour = parseInt(endTime.split(":")[0]);
    return endHour - startHour + 1;
  };

  return (
    <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
      <div className="rounded-t mb-0 px-4 py-3 border-0">
        <h2 className="text-2xl font-bold mb-4 text-center">PLMM Tuition Centre Timetable</h2>
        <div className="grid grid-cols-8">
          {/* Table headers */}
          <div className="col-span-1"></div> {/* Empty space for timings */}
          {days.map((day, index) => (
            <div key={index} className="col-span-1 text-center bg-gray-100 p-2">
              {day}
            </div>
          ))}
          {/* Table cells */}
          {classTimes.map((time, index) => (
            <React.Fragment key={index}>
              <div className="col-span-1 text-right bg-gray-100 p-2">
                <span className="text-xs text-gray-500">{time.start}</span>
              </div>
              {days.map((day, index) => (
                <div
                  key={index}
                  className={`col-span-1 border p-2 ${
                    classSchedule.find(
                      (schedule) =>
                        schedule.day === day &&
                        schedule.start <= time.start &&
                        schedule.end >= time.end
                    )
                      ? "bg-yellow-200" // Change background color to yellow
                      : ""
                  }`}
                >
                  {/* Check if there is a class scheduled for this time and day */}
                  {classSchedule.find(
                    (schedule) =>
                      schedule.day === day &&
                      schedule.start <= time.start &&
                      schedule.end >= time.end
                  ) ? (
                    classSchedule.map(
                      (schedule, index) =>
                        schedule.day === day &&
                        schedule.start <= time.start &&
                        schedule.end >= time.end && (
                          <p
                            key={index}
                            className={`text-sm font-medium text-gray-800 ${
                              calculateColSpan(schedule.start, schedule.end) > 1
                                ? `col-span-${calculateColSpan(schedule.start, schedule.end)}`
                                : ""
                            }`}
                          >
                            {schedule.className}
                            <br />
                            {schedule.start !== schedule.end ? `(${schedule.start} - ${schedule.end})` : ""}
                            <br />
                          </p>
                        )
                    )
                  ) : (
                    // Display empty cell if no class scheduled
                    <div className="h-8"></div>
                  )}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClassTimetable;
