import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import CardLoading from "../CardLoading";
import "react-datepicker/dist/react-datepicker.css";
import { db } from "../../../config/firebase";
import { ToastContainer, toast } from "react-toastify";
import {
  collection,
  setDoc,
  doc,
  getDoc,
  updateDoc,
  getDocs,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  query,
  where,
  documentId,
} from "firebase/firestore";

function CardAdminClassesEdit() {
  const { id } = useParams();
  const [CourseName, setCourseName] = useState("");
  const [academicLevel, setAcademicLevel] = useState("");
  const [MaxRegisteredStudent, setMaxRegisteredStudent] = useState("");
  const [location, setLocation] = useState("");
  const [teacher, setTeacher] = useState("");
  const [initialTeacher, setInitialTeacher] = useState("");
  const [schedule, setSchedule] = useState([]);
  const [teacherData, setTeacherData] = useState([]);
  const [studentID, setStudentID] = useState([]);
  const [deletedSchedules, setDeletedSchedules] = useState([]);
  const [fee, setFee] = useState("");
  const [loading, setLoading] = useState(true);
  const [update, setUpdate] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(""); // State to store selected student for registration
  const [selectedStudents, setSelectedStudents] = useState([]); // State to store available students for selection
  const [registeringStudent, setRegisteringStudent] = useState(false); // State to manage student registration process

  // Function to register selected student in the course
  const handleRegisterStudent = async () => {
    try {
      // Check if the maximum registered student limit is exceeded
      if (studentID.length >= parseInt(MaxRegisteredStudent)) {
        toast.error("Exceeds the maximum registered student limit!");
        return;
      }
      console.log("Selected student: ", selectedStudent);
      // Add selected student to the studentID array in class document
      await updateDoc(doc(db, "class", id), {
        studentID: arrayUnion(selectedStudent),
      });
  
      // Fetch details of the newly registered student
      const studentDoc = await getDoc(doc(db, "students", selectedStudent));
      if (studentDoc.exists()) {
        const studentData = studentDoc.data();
        const newStudent = {
          studentName: studentData.firstName + " " + studentData.lastName,
          studentID: selectedStudent,
          ...studentData,
        };
        // Update the students state with the new student
        setStudents([...students, newStudent]);
      }
      // Update registeredCourses field in the student document
      await updateDoc(doc(db, "students", selectedStudent), {
        registeredCourses: arrayUnion(id),
      });
      // Remove the newly registered student from the available students list
      setSelectedStudents((prevSelectedStudents) =>
        prevSelectedStudents.filter(
          (student) => student.id !== selectedStudent
        )
      );
      // Optionally, you can perform additional actions after registering the student, such as updating UI or displaying a success message
      toast.success("Student registered successfully!");
    } catch (error) {
      console.error("Error registering student: ", error);
      toast.error("Error registering student. Please try again.");
    } finally {
      setRegisteringStudent(false); // Reset registeringStudent state
    }
  };

  const handleAddSchedule = () => {
    const newSchedule = {
      day: "Sunday",
      startTime: new Date(),
      endTime: new Date(),
    };
    setSchedule([...schedule, newSchedule]);
  };

  const handleRemoveSchedule = (index, id) => {
    const newSchedule = [...schedule];
    newSchedule.splice(index, 1); // Remove the schedule item at the specified index
    setSchedule(newSchedule); // Update the schedule state

    // Store the ID of the deleted schedule item
    setDeletedSchedules((prevDeletedSchedules) => [
      ...prevDeletedSchedules,
      id,
    ]);
  };

  const handleScheduleChange = (index, key, value) => {
    // Create a copy of the schedule array
    const newSchedule = [...schedule];
    // Update the value of the specified key at the given index
    newSchedule[index] = {
      ...newSchedule[index],
      [key]: value,
    };
    // Set the updated schedule array back to the state
    setSchedule(newSchedule);
  };

  function formatTime(time) {
    const date = new Date(time.seconds * 1000); // Convert seconds to milliseconds
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "pm" : "am";
    const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
    const formattedMinutes = minutes.toString().padStart(2, "0"); // Add leading zero if needed
    return `${formattedHours}:${formattedMinutes}${ampm}`;
  }

  const getFullName = (id) => {
    const teacher = teacherData.find((teacher) => teacher.id === id);
    if (teacher && teacher.userData) {
      return `${teacher.userData.firstName || ""} ${
        teacher.userData.lastName || ""
      }`;
    } else {
      console.error(
        `Teacher with ID ${id} does not have userData or is not found.`
      );
      return "-";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setUpdate(true);
    const newClass = {
        CourseName,
        academicLevel,
        MaxRegisteredStudent,
        location,
        teacher,
        fee,
        studentID: studentID,
    };

    // Update class document
    updateDoc(doc(db, "class", id), newClass)
        .then(() => {
            // Update teacher's subjectTaught array if the teacher has changed
            if (initialTeacher !== teacher) {
                // Remove class from previous teacher's subjectTaught array
                return updateDoc(doc(db, "teacher", initialTeacher), {
                    subjectTaught: arrayRemove(id),
                })
                .then(() => {
                    // Add class to current teacher's subjectTaught array
                    return updateDoc(doc(db, "teacher", teacher), {
                        subjectTaught: arrayUnion(id),
                    });
                })
                .then(() => {
                    setInitialTeacher(teacher);
                });
            }
        })
        .then(() => {
            // Update or add schedule documents for the class
            const updateSchedulePromises = schedule.map((item, index) => {
                const scheduleRef = doc(db, "class", id, "Schedule", `schedule_${index}`);
                return setDoc(scheduleRef, {
                    day: item.day,
                    startTime: item.startTime,
                    endTime: item.endTime,
                });
            });

            return Promise.all(updateSchedulePromises);
        })
        .then(() => {
            // Remove schedules that were deleted by the user
            const deleteSchedulePromises = deletedSchedules.map((deletedScheduleId) => {
                return deleteDoc(doc(db, "class", id, "Schedule", deletedScheduleId));
            });

            return Promise.all(deleteSchedulePromises);
        })
        .then(() => {
            setUpdate(false);
            toast.success("Class updated successfully!");
        })
        .catch((error) => {
            console.error("Error updating class: ", error);
            toast.error("Error updating class. Please try again.");
        });
};


  useEffect(() => {
    function fetchClassData() {
        const classDocRef = doc(db, "class", id);

        getDoc(classDocRef)
            .then((classDocSnapshot) => {
                console.log("1");
                
                if (classDocSnapshot.exists()) {
                    const classData = classDocSnapshot.data();
                    console.log("Class data: ", classData);
                    
                    const scheduleCollectionRef = collection(db, "class", id, "Schedule");
                    getDocs(scheduleCollectionRef)
                        .then((scheduleSnapshot) => {
                            console.log("2");
                            const scheduleData = scheduleSnapshot.docs.map((scheduleDoc) => {
                                const scheduleItem = scheduleDoc.data();
                                // Convert timestamp to JavaScript Date object
                                scheduleItem.startTime = scheduleItem.startTime.toDate();
                                scheduleItem.endTime = scheduleItem.endTime.toDate();
                                return { id: scheduleDoc.id, ...scheduleItem }; // Include document ID
                            });

                            const teachersSnapshot = getDocs(collection(db, "teacher"));
                            const usersSnapshot = getDocs(collection(db, "users"));

                            Promise.all([teachersSnapshot, usersSnapshot])
                                .then(([teachersSnapshot, usersSnapshot]) => {
                                    const teachersData = teachersSnapshot.docs.map((doc) => ({
                                        id: doc.id,
                                        ...doc.data(),
                                    }));

                                    setTeacherData(teachersData);
                                    console.log("Teachers data: ", teachersData);

                                    const usersData = usersSnapshot.docs.map((doc) => ({
                                        id: doc.id,
                                        ...doc.data(),
                                    }));

                                    const selectedTeachersData = teachersData.map((teacher) => {
                                        const userData = usersData.find((user) => user.id === teacher.userID);
                                        setInitialTeacher(teacher.id);
                                        return { ...teacher, userData };
                                    });
                                    console.log("Initial teacher: ", initialTeacher);

                                    let studentDetails = [];
                                    if (classData.studentID.length > 0) {
                                        studentDetails = classData.studentID.map(async (student) => {
                                            const studentDoc = await getDoc(doc(db, "students", student));
                                            if (studentDoc.exists()) {
                                                const studentName = studentDoc.data().firstName + " " + studentDoc.data().lastName;
                                                return {
                                                    studentName,
                                                    studentID: student,
                                                    ...studentDoc.data(),
                                                }; // Changed doc to studentDoc
                                            } else {
                                                console.error(`Student document with ID ${student} does not exist.`);
                                                return null; // Return null for non-existing student documents
                                            }
                                        });
                                    } else {
                                        console.log("No students registered in this class");
                                    }

                                    let availableStudentsQuery;

                                    if (classData.studentID.length > 0) {
                                        availableStudentsQuery = query(
                                            collection(db, "students"),
                                            where("educationLevel", "==", classData.academicLevel),
                                            where(documentId(), "not-in", classData.studentID) // Exclude registered students
                                        );
                                    } else {
                                        availableStudentsQuery = query(
                                            collection(db, "students"),
                                            where("educationLevel", "==", classData.academicLevel)
                                        );
                                    }

                                    console.log("3");
                                    getDocs(availableStudentsQuery)
                                        .then((availableStudentsSnapshot) => {
                                            const availableStudentsData = availableStudentsSnapshot.docs.map(
                                                (doc) => ({ id: doc.id, ...doc.data() })
                                            );

                                            console.log("Available students: ", availableStudentsData);

                                            console.log("4");
                                            setSelectedStudents(availableStudentsData);
                                            setStudents(studentDetails);
                                            setTeacherData(selectedTeachersData);
                                            setCourseName(classData.CourseName);
                                            setAcademicLevel(classData.academicLevel);
                                            setMaxRegisteredStudent(classData.MaxRegisteredStudent);
                                            setLocation(classData.location);
                                            setTeacher(classData.teacher);
                                            setSchedule(scheduleData);
                                            setFee(classData.fee);
                                            setStudentID(classData.studentID);
                                            setLoading(false);
                                        })
                                        .catch((error) => {
                                            console.error("Error fetching available students:", error);
                                            setLoading(false);
                                        });
                                })
                                .catch((error) => {
                                    console.error("Error fetching teachers or users:", error);
                                    setLoading(false);
                                });
                        })
                        .catch((error) => {
                            console.error("Error fetching schedule:", error);
                            setLoading(false);
                        });
                } else {
                    console.log("Class not found");
                    setLoading(false);
                }
            })
            .catch((error) => {
                console.error("Error fetching class document:", error);
                setLoading(false);
            });
    }

    fetchClassData();
}, [id]);

  

  return (
    <>
      {loading ? (
        <CardLoading loading={loading} />
      ) : (
        <div className="relative mx-auto px-4 py-8 mb-8 flex flex-col min-w-0 break-words w-full shadow-lg rounded ">
          <ToastContainer position="top-right" />
          <div className="flex items-center mb-4 font-bold text-xl">
            <Link to="/admin/classes" className="text-blue-500 hover:underline">
              Classes Management
            </Link>
            <span className="mx-2">&nbsp;/&nbsp;</span>
            <span className="text-gray-500">Edit New Class</span>
          </div>
          <form onSubmit={handleSubmit} className="w-full">
            <div className="grid grid-cols-4 gap-4">
              {/* Class Name Input */}
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

              {/* Select Academic Level */}
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
                  <option value="" disabled>
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

              {/* Max Registered Student Input */}
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

              {/* Location Input */}
              <div className="mb-4 col-span-2">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Location:
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="border rounded w-full py-2 px-3 text-gray-700"
                />
              </div>

              {/* Add input field for fee */}
              <div className="mb-4 col-span-2">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Fee:
                </label>
                <input
                  type="text"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)} // Update fee state on change
                  className="border rounded w-full py-2 px-3 text-gray-700"
                />
              </div>

              {/* Select Teacher */}
              <div className="mb-4 col-span-2">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Teacher:
                </label>
                <select
                  value={teacher}
                  onChange={(e) => setTeacher(e.target.value)}
                  className="border rounded w-full py-2 px-3 text-gray-700"
                  required
                >
                  <option value="">Select Teacher</option>
                  {teacherData.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {getFullName(teacher.id)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Schedule Input */}
              <label className="block col-span-full text-gray-700 text-sm font-bold mb-2">
                Schedule:
              </label>
              {schedule.map((item, index) => (
                <div
                  key={index}
                  className="col-span-full flex items-center mb-2"
                >
                  <select
                    value={item.day}
                    onChange={(e) =>
                      handleScheduleChange(index, "day", e.target.value)
                    }
                    className="border rounded-l py-2 px-3 text-gray-700 mr-2 appearance-none w-full"
                  >
                    <option value="Sunday" className="px-4">
                      Sunday
                    </option>
                    <option value="Monday" className="px-4">
                      Monday
                    </option>
                    <option value="Tuesday" className="px-4">
                      Tuesday
                    </option>
                    <option value="Wednesday" className="px-4">
                      Wednesday
                    </option>
                    <option value="Thursday" className="px-4">
                      Thursday
                    </option>
                    <option value="Friday" className="px-4">
                      Friday
                    </option>
                    <option value="Saturday" className="px-4">
                      Saturday
                    </option>
                    {/* Add other days as needed */}
                  </select>

                  <div className="flex items-center">
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
                      className="border py-2 px-3 text-gray-700 mr-2 w-40"
                    />
                    <span className="mx-4 text-gray-500">to</span>
                    <DatePicker
                      selected={item.endTime}
                      onChange={(date) =>
                        handleScheduleChange(index, "endTime", date)
                      }
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeCaption="Time"
                      dateFormat="h:mm aa"
                      className="border rounded-r py-2 px-3 text-gray-700 mr-2 w-40"
                      minTime={item.startTime} // Set minTime to start time
                      maxTime={new Date().setHours(23, 59, 0, 0)} // Set maxTime to current time
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSchedule(index, item.id)}
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
              <button
                type="submit"
                className="bg-green-500 text-white py-2 px-4 rounded"
              >
                {update ? "Updating ..." : "Update Class"}
              </button>
              <Link
                to="/admin/classes"
                className="ml-4 bg-gray-500 text-white py-2 px-4 rounded"
              >
                Cancel
              </Link>
            </div>
          </form>
                      {/* Registered Students Section */}
                      <div className="block text-gray-700 text-lg mt-4 text-center font-bold">
              Registered Students
            </div>
            <p className="text-center text-sm mb-2">
              (Only can register the student same academic level)
            </p>
            <table className="items-center w-full bg-transparent border-collapse">
              <thead>
                <tr>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Student Name
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Academic Level
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Contact Number
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td
                      className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4"
                      colSpan="3"
                    >
                      No student registered in this class
                    </td>
                  </tr>
                ) : (
                  students.map((student, index) => (
                    <tr key={index}>
                      <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                        {student.studentName}
                      </td>
                      <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                        {student.educationLevel}
                      </td>
                      <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                        {student.contactNumber}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {/* Student Registration Section */}
            <div className="block text-gray-700 text-lg mt-4 text-center font-bold">
              Register Students
            </div>
            <p className="text-center text-sm mb-2">
              (Select students to register in this class)
            </p>
            {/* Student selection dropdown */}
            <select
              value={selectedStudent} // value from state
              onChange={(e) => setSelectedStudent(e.target.value)} // update state on change
              className="border rounded w-full py-2 px-3 text-gray-700 mb-4"
            >
              <option value="">Select Student</option>
              {/* Map through available students and filter out those already registered */}
              {selectedStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.firstName + " " + student.lastName}
                </option>
              ))}
            </select>
            {/* Register button */}
            <button
              onClick={handleRegisterStudent} // Call function to register student on click
              disabled={!selectedStudent} // Disable button if no student is selected
              className={`bg-blue-500 text-white py-2 px-4 rounded ${
                !selectedStudent && "opacity-50 cursor-not-allowed"
              }`} // Apply styles based on whether a student is selected or not
            >
              {registeringStudent ? "Registering..." : "Register Student"}
            </button>
        </div>
      )}
    </>
  );
}

export default CardAdminClassesEdit;
