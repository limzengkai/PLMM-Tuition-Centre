import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { db } from "../../../config/firebase";
import { ToastContainer, toast } from 'react-toastify';
import CardLoading from "../CardLoading";
import { collection, addDoc, doc, setDoc, getDocs, query, where } from "firebase/firestore"; 

function CardAdminClassesAdd() {
  const [CourseName, setCourseName] = useState("");
  const [academicLevel, setAcademicLevel] = useState("");
  const [MaxRegisteredStudent, setMaxRegisteredStudent] = useState("");
  const [location, setLocation] = useState("");
  const [fee, setFee] = useState("");
  const [teacherData, setTeacherData] = useState([]);
  const [teacher, setTeacher] = useState(""); // Changed to hold single teacher ID
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [add, setAdd] = useState(false);

  useEffect(() => {
    async function fetchTeachers() {
      try {
        const teachersSnapshot = await getDocs(collection(db, "teacher"));
        const teachersData = teachersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTeacherData(teachersData);

        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const selectedTeachersData = teachersData.map(teacher => {
          const userData = usersData.find(user => user.id === teacher.userID);
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

  const handleAddSchedule = () => {
    const newSchedule = {
      day: "Sunday",
      startTime: new Date(),
      endTime: new Date()
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
    setAdd(true);
    const newClass = {
      CourseName,
      academicLevel,
      MaxRegisteredStudent,
      location,
      teacher,
      fee,
      studentID:[],
    };
  
    try {
      const classRef = await addDoc(collection(db, "class"), newClass);
      const classId = classRef.id;
  
      await Promise.all(schedule.map(async (item, index) => {
        const scheduleRef = doc(db, "class", classId, "Schedule", `schedule_${index}`);
        await setDoc(scheduleRef, {
          day: item.day,
          startTime: item.startTime,
          endTime: item.endTime
        });
      }));
  
      toast.success("Class added successfully!");
      setAdd(false);
      setCourseName("");
      setAcademicLevel("");
      setMaxRegisteredStudent("");
      setLocation("");
      setTeacher(""); // Reset teacher state to clear selection
      setFee("");
      setSchedule([]);
    } catch (error) {
      console.error('Error adding class: ', error);
    }
  };

  return (
    <>
    {loading ? (
      <CardLoading loading={loading} />
    ) : (
    <div className="relative mx-auto px-4 py-8 mb-8 flex flex-col min-w-0 break-words w-full shadow-lg rounded ">
      <ToastContainer position="top-right"/>
      <div className="flex items-center mb-4 font-bold text-xl">
        <Link to="/admin/classes" className="text-blue-500 hover:underline">Classes Management</Link>
        <span className="mx-2">&nbsp;/&nbsp;</span>
        <span className="text-gray-500">Add New Class</span>
      </div>
      <form onSubmit={handleSubmit} className="w-full">
        <div className="grid grid-cols-4 gap-4">
          <div className="mb-4 col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2">Class Name:</label>
            <input
              type="text"
              value={CourseName}
              onChange={(e) => setCourseName(e.target.value)}
              className="border rounded w-full py-2 px-3 text-gray-700"
              required
            />
          </div>
          <div className="mb-4 col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2">Academic Level:</label>
            <select
              value={academicLevel}
              onChange={(e) => setAcademicLevel(e.target.value)}
              className="border rounded w-full py-2 px-3 text-gray-700"
              required
            >
              <option value="" disabled>Select Academic Level</option>
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
            <label className="block text-gray-700 text-sm font-bold mb-2">Maximum Student:</label>
            <input
              type="text"
              value={MaxRegisteredStudent}
              onChange={(e) => setMaxRegisteredStudent(e.target.value)}
              className="border rounded w-full py-2 px-3 text-gray-700"
            />
          </div>
          <div className="mb-4 col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2">Location:</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="border rounded w-full py-2 px-3 text-gray-700"
            />
          </div>
          <div className="mb-4 col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2">Fee:</label>
            <input
              type="text"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="border rounded w-full py-2 px-3 text-gray-700"
            />
          </div>
          <div className="mb-4 col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2">Teacher:</label>
            <select
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              className="border rounded w-full py-2 px-3 text-gray-700"
            >
              <option value="" disabled>Select Teacher</option>
              {teacherData.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacher.userData.firstName + " " + teacher.userData.lastName }</option>
              ))}
            </select>
          </div>
          <label className="block col-span-full text-gray-700 text-sm font-bold mb-2">Schedule:</label>
          {schedule.map((item, index) => (
            <div key={index} className="col-span-full flex items-center mb-2">
              <select
                value={item.day}
                onChange={(e) => handleScheduleChange(index, "day", e.target.value)}
                className="border rounded-l py-2 px-3 text-gray-700 mr-2 appearance-none w-full"
              >
                <option value="Sunday" className="px-4">Sunday</option>
                <option value="Monday" className="px-4">Monday</option>
                <option value="Tuesday" className="px-4">Tuesday</option>
                <option value="Wednesday" className="px-4">Wednesday</option>
                <option value="Thursday" className="px-4">Thursday</option>
                <option value="Friday" className="px-4">Friday</option>
                <option value="Saturday" className="px-4">Saturday</option>
                {/* Add other days as needed */}
              </select>
              
              <div className="flex items-center">
                <DatePicker
                  selected={item.startTime}
                  onChange={(date) => handleScheduleChange(index, "startTime", date)}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  timeCaption="Time"
                  dateFormat="h:mm aa"
                  className="border py-2 px-3 text-gray-700 mr-2 w-40"
                />
                <span className="mx-4 text-gray-500">to</span>
                <DatePicker
                  selected={item.endTime}
                  onChange={(date) => handleScheduleChange(index, "endTime", date)}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  timeCaption="Time"
                  minTime={item.startTime}
                  maxTime={new Date().setHours(23, 45)}
                  dateFormat="h:mm aa"
                  className="border rounded-r py-2 px-3 text-gray-700 mr-2 w-40"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveSchedule(index)}
                className="bg-red-500 text-white py-2 px-4 rounded"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={handleAddSchedule}
          className="bg-blue-500 text-white py-2 px-4 rounded"
        >
          Add Schedule
        </button>
        <div className="flex justify-center mb-4">
          <button type="submit" className="bg-green-500 text-white py-2 px-4 rounded">
            {add ? "Adding ..." : "Add Class"}
          </button>
          <Link to="/admin/classes" className="ml-4 bg-gray-500 text-white py-2 px-4 rounded">
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
