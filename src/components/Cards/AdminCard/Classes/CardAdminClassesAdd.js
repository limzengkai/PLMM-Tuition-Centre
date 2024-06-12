import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { db } from "../../../../config/firebase";
import Swal from "sweetalert2";
import CardLoading from "../../CardLoading";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDocs,
  getDoc,
} from "firebase/firestore";
import Timetable from "./Timetable";

function CardAdminClassesAdd() {
  const [CourseName, setCourseName] = useState("");
  const [academicLevel, setAcademicLevel] = useState("");
  const [MaxRegisteredStudent, setMaxRegisteredStudent] = useState("");
  const [fee, setFee] = useState("");
  const [teacherData, setTeacherData] = useState([]);
  const [teacher, setTeacher] = useState("");
  const [schedule, setSchedule] = useState([]);
  const [existingSchedules, setExistingSchedules] = useState([]);
  const [allSchedule, setAllSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingschedule, setLoadingschedule] = useState(false);
  const [add, setAdd] = useState(false);

  useEffect(() => {
    async function fetchTeachers() {
      try {
        const teachersSnapshot = await getDocs(collection(db, "teacher"));
        const teachersData = teachersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTeacherData(teachersData);

        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const selectedTeachersData = teachersData.map((teacher) => {
          const userData = usersData.find((user) => user.id === teacher.userID);
          return { ...teacher, userData };
        });

        setTeacherData(selectedTeachersData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching teachers data:", error);
      }
    }
    fetchTeachers();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingschedule(true);
      if (teacher !== "") {
        try {
          const teacherRef = doc(db, "teacher", teacher);
          const teacherDoc = await getDoc(teacherRef);
          if (teacherDoc.exists()) {
            const subjectTaught = teacherDoc.data().subjectTaught || [];
            const schedules = [];

            for (const subject of subjectTaught) {
              const classRef = doc(db, "class", subject);
              const classDoc = await getDoc(classRef);
              if (classDoc.exists()) {
                const className = classDoc.data().CourseName;
                const scheduleRef = collection(classRef, "Schedule");
                const scheduleSnapshot = await getDocs(scheduleRef);
                scheduleSnapshot.forEach((doc) => {
                  const scheduleData = doc.data();
                  schedules.push({
                    className,
                    location: scheduleData.location,
                    day: scheduleData.day,
                    startTime: scheduleData.startTime,
                    endTime: scheduleData.endTime,
                  });
                });
              }
            }

            setExistingSchedules(schedules);
            console.log("schedules : ", schedules);
            setLoadingschedule(false);
          }
        } catch (error) {
          console.error("Error fetching teacher data:", error);
        }
      }
      setLoadingschedule(false);
    };

    fetchData();
  }, [teacher]);

  const handleAddSchedule = () => {
    const newSchedule = {
      day: "Sunday",
      startTime: new Date(),
      endTime: new Date(),
      location: "",
    };
    setSchedule([...schedule, newSchedule]);
  };

  const handleRemoveSchedule = (index) => {
    const newSchedule = [...schedule];
    newSchedule.splice(index, 1);
    setSchedule(newSchedule);
  };

  const handleScheduleChange = (index, key, value) => {
    const newSchedule = [...schedule];
    newSchedule[index][key] = value;
    setSchedule(newSchedule);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const confirmResult = await Swal.fire({
        icon: "question",
        title: "Confirmation",
        text: "Are you sure you want to add this class?",
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No",
      });
  
      if (!confirmResult.isConfirmed) {
        setAdd(false);
        return;
      }
  
      // Fetch schedules and store them in a local variable
      const schedules = await fetchScheduleData();
  
      // Check for overlapping schedules
      let overlapOwnMessages = [];
      let overlapOtherMessages = [];
  
      // Check the teacher's schedule for overlaps
      if (existingSchedules.length > 0) {
        for (let i = 0; i < schedule.length; i++) {
          const { startTime, endTime, day } = schedule[i];
  
          for (let j = 0; j < existingSchedules.length; j++) {
            if (day === existingSchedules[j].day) {
              const start1 = new Date(startTime).getHours() * 60 + new Date(startTime).getMinutes();
              const end1 = new Date(endTime).getHours() * 60 + new Date(endTime).getMinutes();
              const start2 = new Date(existingSchedules[j].startTime.toDate()).getHours() * 60 + new Date(existingSchedules[j].startTime.toDate()).getMinutes();
              const end2 = new Date(existingSchedules[j].endTime.toDate()).getHours() * 60 + new Date(existingSchedules[j].endTime.toDate()).getMinutes();
  
              if (
                (start1 >= start2 && start1 < end2) ||
                (end1 > start2 && end1 <= end2) ||
                (start1 <= start2 && end1 >= end2)
              ) {
                overlapOwnMessages.push(`Schedule ${i + 1} overlaps with class ${existingSchedules[j].className} on ${day}.`);
              }
            }
          }
        }
      }
  
      // Check if the new schedule overlaps with existing schedules for the same location
      for (let i = 0; i < schedule.length; i++) {
        const { startTime, endTime, location, day } = schedule[i];
  
        for (let j = 0; j < schedules.length; j++) {
          if (day === schedules[j].day && location === schedules[j].location) {
            const start1 = new Date(startTime).getHours() * 60 + new Date(startTime).getMinutes();
            const end1 = new Date(endTime).getHours() * 60 + new Date(endTime).getMinutes();
            const start2 = new Date(schedules[j].startTime.toDate()).getHours() * 60 + new Date(schedules[j].startTime.toDate()).getMinutes();
            const end2 = new Date(schedules[j].endTime.toDate()).getHours() * 60 + new Date(schedules[j].endTime.toDate()).getMinutes();
  
            if (
              (start1 >= start2 && start1 < end2) ||
              (end1 > start2 && end1 <= end2) ||
              (start1 <= start2 && end1 >= end2)
            ) {
              overlapOtherMessages.push(`Schedule ${i + 1} overlaps with class ${schedules[j].className} at ${schedules[j].location} on ${day}.`);
            }
          }
        }
      }
  
      if (overlapOwnMessages.length > 0 || overlapOtherMessages.length > 0) {
        let htmlMessage = "<div style='text-align: left;'>";
        if (overlapOwnMessages.length > 0) {
          htmlMessage += `<strong>Overlap with own classes:</strong><br><ul style="margin: 0; padding: 0 0 0 20px;">${overlapOwnMessages.map(msg => `<li>${msg}</li>`).join("")}</ul>`;
        }
        if (overlapOtherMessages.length > 0) {
          htmlMessage += `<br><strong>Overlap with other classes:</strong><br><ul style="margin: 0; padding: 0 0 0 20px;">${overlapOtherMessages.map(msg => `<li>${msg}</li>`).join("")}</ul>`;
        }
        htmlMessage += "</div>";
        
        Swal.fire({
          icon: "error",
          title: "Error",
          html: htmlMessage,
        });
        return;
      }
  
      setAdd(true);
      const newClass = {
        CourseName,
        academicLevel,
        MaxRegisteredStudent,
        teacher,
        fee,
        studentID: [],
      };
  
      const classRef = await addDoc(collection(db, "class"), newClass);
      const classId = classRef.id;
  
      await Promise.all(
        schedule.map(async (item, index) => {
          const scheduleRef = doc(db, "class", classId, "Schedule", `schedule_${index}`);
          await setDoc(scheduleRef, {
            day: item.day,
            startTime: item.startTime,
            endTime: item.endTime,
            location: item.location,
          });
        })
      );
  
      // Add class to teacher's subjectTaught
      const teacherRef = doc(db, "teacher", teacher);
      const teacherDoc = await getDoc(teacherRef);
      if (teacherDoc.exists()) {
        const subjectTaught = teacherDoc.data().subjectTaught || [];
        subjectTaught.push(classId);
        await setDoc(teacherRef, { subjectTaught }, { merge: true });
      }
  
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Class added successfully!",
      });
  
      setCourseName("");
      setAcademicLevel("");
      setMaxRegisteredStudent("");
      setFee("");
      setTeacher("");
      setSchedule([]);
      setAdd(false);
    } catch (error) {
      console.error("Error adding class: ", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while adding the class. Please try again later.",
      });
      setAdd(false);
    }
  };

  const fetchScheduleData = async () => {
    try {
      const classRef = collection(db, "class");
      const classSnapshot = await getDocs(classRef);
      const schedules = [];

      const schedulePromises = classSnapshot.docs.map(async (doc) => {
        const classData = doc.data();
        const className = classData.CourseName;
        const scheduleRef = collection(doc.ref, "Schedule");
        const scheduleSnapshot = await getDocs(scheduleRef);
        scheduleSnapshot.forEach((doc) => {
          const scheduleData = doc.data();
          schedules.push({
            className,
            location: scheduleData.location,
            day: scheduleData.day,
            startTime: scheduleData.startTime,
            endTime: scheduleData.endTime,
          });
        });
      });

      await Promise.all(schedulePromises);

      setAllSchedule(schedules); // Update the state as well
      return schedules; // Return the fetched schedules
    } catch (error) {
      console.error("Error fetching class data:", error);
    }
  };

  return (
    <>
      {loading ? (
        <CardLoading loading={loading} />
      ) : (
        <div className="relative mx-auto px-4 py-8 mb-8 flex flex-col min-w-0 break-words w-full shadow-lg rounded ">
          <div className="flex items-center mb-4 font-bold text-sm md:text-lg lg:text-xl">
            <Link to="/admin/classes" className="text-blue-500 hover:underline">
              Classes Management
            </Link>
            <span className="mx-2">&nbsp;/&nbsp;</span>
            <span className="text-gray-500">Add New Class</span>
          </div>
          <form onSubmit={handleSubmit} className="w-full">
            <div className="grid grid-cols-4 gap-4">
              <div className="mb-4 col-span-2">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Class Name:
                </label>
                <input
                  type="text"
                  value={CourseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="border rounded w-full py-2 px-3 text-gray-700"
                  required
                />
              </div>
              <div className="mb-4 col-span-2">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Academic Level:
                </label>
                <select
                  value={academicLevel}
                  onChange={(e) => setAcademicLevel(e.target.value)}
                  className="border rounded w-full py-2 px-3 text-gray-700"
                  required
                >
                  <option value="" className="text-sm" disabled>
                    Select Academic Level
                  </option>
                  <option value="Standard 1">Standard 1</option>
                  <option value="Standard 2">Standard 2</option>
                  <option value="Standard 3">Standard 3</option>
                  <option value="Standard 4">Standard 4</option>
                  <option value="Standard 5">Standard 5</option>
                  <option value="Standard 6">Standard 6</option>
                  <option value="Form 1">Form 1</option>
                  <option value="Form 2">Form 2</option>
                  <option value="Form 3">Form 3</option>
                  <option value="Form 4">Form 4</option>
                  <option value="Form 5">Form 5</option>
                </select>
              </div>
              <div className="mb-4 col-span-2">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Maximum Student:
                </label>
                <input
                  type="text"
                  value={MaxRegisteredStudent}
                  onChange={(e) => setMaxRegisteredStudent(e.target.value)}
                  className="border rounded w-full py-2 px-3 text-gray-700"
                />
              </div>
              <div className="mb-4 col-span-2">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Fee:
                </label>
                <input
                  type="text"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className="border rounded w-full py-2 px-3 text-gray-700"
                />
              </div>
              <div className="mb-4 col-span-2">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Teacher:
                </label>
                <select
                  value={teacher}
                  onChange={(e) => setTeacher(e.target.value)}
                  className="border rounded w-full py-2 px-3 text-gray-700"
                >
                  <option value="" disabled>
                    Select Teacher
                  </option>
                  {teacherData.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.userData &&
                        teacher.userData.firstName +
                          " " +
                          teacher.userData.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <label className="block col-span-full text-gray-700 text-sm font-bold mb-2">
                Existing Schedule:
              </label>
              <div className="timetable col-span-full ">
                {existingSchedules.length > 0 ? (
                  loadingschedule ? (
                    "Loading Teacher's schedule ..."
                  ) : (
                    <Timetable schedules={existingSchedules} />
                  )
                ) : loadingschedule ? (
                  "Loading Teacher's schedule ..."
                ) : (
                  "No schedule Displayed"
                )}
              </div>
              <label className="block col-span-full text-gray-700 text-sm font-bold mb-2">
                Schedule:
              </label>
              {schedule.map((item, index) => (
                <div
                  key={index}
                  className="col-span-full w-full flex flex-col lg:flex-row items-center mb-2"
                >
                  <select
                    value={item.day}
                    onChange={(e) =>
                      handleScheduleChange(index, "day", e.target.value)
                    }
                    className="border rounded-l py-2 px-3 text-gray-700 lg:w-1/5 mb-2 lg:mb-0 lg:mr-2 "
                  >
                    <option value="" disabled>
                      {" "}
                      Select a Day
                    </option>
                    <option value="Sunday">Sunday</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                  </select>

                  <div className="flex flex-col md:flex-row items-center lg:w-2/5 lg:flex-row lg:mr-2">
                    <DatePicker
                      selected={item.startTime}
                      onChange={(date) =>
                        handleScheduleChange(index, "startTime", date)
                      }
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeCaption="Time"
                      dateFormat="h:mm aa"
                      className="border py-2 px-3 text-gray-700 mb-2 lg:mb-0 lg:w-full"
                    />
                    <div className="mx-4 text-gray-500">to</div>
                    <DatePicker
                      selected={item.endTime}
                      onChange={(date) =>
                        handleScheduleChange(index, "endTime", date)
                      }
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeCaption="Time"
                      minTime={item.startTime}
                      maxTime={new Date().setHours(23, 45)}
                      dateFormat="h:mm aa"
                      className="border py-2 px-3 text-gray-700 mb-2 lg:mb-0 lg:w-full"
                    />
                  </div>

                  <select
                    value={item.location}
                    onChange={(e) =>
                      handleScheduleChange(index, "location", e.target.value)
                    }
                    className="border rounded-l py-2 px-3 text-gray-700 mb-2 lg:mb-0 lg:mr-2 w-full lg:w-1/5"
                  >
                    <option value="" disabled>
                      Select a Class
                    </option>
                    <option value="Location A">Location A</option>
                    <option value="Location B">Location B</option>
                    <option value="Location C">Location C</option>
                    <option value="Location D">Location D</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleRemoveSchedule(index)}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded lg:w-auto"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-center my-2">
              <button
                type="button"
                onClick={handleAddSchedule}
                className="bg-blue-500 text-white py-2 px-4 rounded "
              >
                Add Schedule
              </button>
            </div>
            <div className="flex justify-center my-4">
              <button
                type="submit"
                className="bg-green-500 text-white py-2 px-4 rounded"
              >
                {add ? "Adding ..." : "Add Class"}
              </button>
              <Link
                to="/admin/classes"
                className="ml-4 bg-gray-500 text-white py-2 px-4 rounded"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export default CardAdminClassesAdd;
