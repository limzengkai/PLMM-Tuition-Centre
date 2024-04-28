import React, { useState, useEffect, Children } from "react";
import { Link, useParams } from "react-router-dom";
import CardLoading from "../CardLoading";
import { db} from "../../../config/firebase";
import { arrayRemove, arrayUnion } from "firebase/firestore";
import { ToastContainer, toast } from 'react-toastify';
import { MultiSelect } from "react-multi-select-component";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc, addDoc, deleteDoc } from "firebase/firestore"; 

function CardUserManagementEdit() {
  const { id } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [InitialSelectedCourses, setInitialSelectedCourses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [deletedStudents, setDeletedStudents] = useState([]);

  // Fetch user data and associated student data
  useEffect(() => {
    async function fetchData() {
      try {
        const userDocRef = doc(db, "users", id);
        const userDocSnapshot = await getDoc(userDocRef);
        if (userDocSnapshot.exists()) {
          const userData = userDocSnapshot.data();
          setUserData(userData);
          setLoading(false);

          // Fetch associated student data if user role is parent
          if (userData.role === "parent") {
            const studentDataQuery = query(collection(db, "students"), where("parentId", "==", id));
            const studentDataQuerySnapshot = await getDocs(studentDataQuery);

            const coursesQuery = query(collection(db, "class"));
            const coursesSnapshot = await getDocs(coursesQuery);
            const coursesData = coursesSnapshot.docs.map(doc => ({
              label: `${doc.data().academicLevel}_${doc.data().CourseName}`,
              value: doc.id
            }));
            setCourses(coursesData);
            console.log("Courses", coursesData);

            const students = [];
            const selectedCourses = [];
            
            studentDataQuerySnapshot.forEach((doc) => {
              const student = doc.data();
              students.push({ id: doc.id, ...student });
              // Extract registered courses for each student and map them to full course objects
              const courses = student.registeredCourses.map(courseId => {
                const courseData = coursesData.find(course => course.value === courseId);
                return { label: courseData.label, value: courseData.value };
              });
              selectedCourses.push(courses);

            });

            // Set the state for student data and selected courses
            setStudentData(students);
            setInitialSelectedCourses(selectedCourses);
            setSelectedCourses(selectedCourses);
            console.log("selected Data Initial: ", selectedCourses);
          }
        } else {
          console.log("User not found");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    }

    fetchData();
  }, [id]); // Make sure to include 'id' in the dependency array

  useEffect(() => {
    console.log("Selected Courses", selectedCourses.value);
    console.log("Student DATA", studentData);
  }, [selectedCourses]);

  // Handle input changes for user fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  // Handle input changes for student fields
  const handleStudentInputChange = (index, key, value) => {
    const newStudentData = [...studentData];
    newStudentData[index] = { 
      ...newStudentData[index], 
      [key]: value 
    };
    setStudentData(newStudentData);
  };

  // Handle Remove Student Function
  const handleRemoveStudent = (index, studentId) => {
    // Add the ID of the student to be removed to the state
    if (deletedStudents.length === 0) {
      setDeletedStudents([studentId]);
    } else {
      setDeletedStudents([...deletedStudents, studentId]);
    }
    // Remove the student from the state
    const updatedStudentData = [...studentData];
    updatedStudentData.splice(index, 1);
    setStudentData(updatedStudentData);
  };

  // Handle Add Student Function
  const handleAddStudent = () => {
    const newStudent = { firstName: "", lastName: "", age: "", icNumber: "",educationLevel:"" ,contactNumber: "",parentId: id, registeredCourses: []};
    setSelectedCourses([...selectedCourses, []]); // Add an empty array for selected courses
    setStudentData([...studentData, newStudent]); // Update studentData state
  };

  // Handle course selection for each student
  const handleCourseSelection = (index, selectedOptions) => {
    console.log("Selected Options", selectedOptions);
    const updatedSelectedCourses = [...selectedCourses];
    console.log("Selected Courses", updatedSelectedCourses);
    updatedSelectedCourses[index] = selectedOptions;
    console.log("Updated Selected Courses", updatedSelectedCourses);
    console.log(selectedCourses);
    setSelectedCourses(updatedSelectedCourses);
    console.log(selectedCourses);
  };
  
  const getRegisterCourseName = (courseid) => {
    // const course = courses.find(course => course.value === courseid);
    console.log("Course ", courses);
    console.log("Course ID", courseid);
    courses.forEach(course => {
      if(course.value === courseid){
        console.log("Course Name", course.label);
      }
    });
    return courseid
  };

// Update user data
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    if (userData) {
      // Update user data
      if (userData.role === "parent") {
        await updateDoc(doc(db, "users", id), userData);
        console.log("User data updated successfully!");
      }
    }

    if (studentData) {
      // Add new students to the Firestore collection
      const newStudentsID = [];
      await Promise.all(studentData.map(async (student, index) => {
        const studentDocRef = doc(db, "students", `student_${id}_${index}`);

        // Get all students ID
        newStudentsID.push(`student_${id}_${index}`);
        selectedCourses[index].map(course => 
          console.log(index, course.value)
        )
        
        await setDoc(studentDocRef, {
          firstName: student.firstName,
          educationLevel: student.educationLevel,
          lastName: student.lastName,
          age: student.age,
          icNumber: student.icNumber,
          contactNumber: student.contactNumber,
          parentId: id,
          registeredCourses: selectedCourses[index].map(course => course.value) // Save selected courses
        });

        // Update class document with student ID
        try {
          for (const course of selectedCourses[index]) {
            console.log("Course", course);
            const classDocRef = doc(db, "class", course.value); // Assuming each course has at least one value
            const classDocSnapshot = await getDoc(classDocRef);
            console.log("Class Doc", classDocSnapshot);
            if (classDocSnapshot.exists()) {
              const classData = classDocSnapshot.data();
              const updatedStudentIDs = classData.studentID || []; // Existing student IDs or empty array
              
              // Check if the student ID already exists in the array
              if (!updatedStudentIDs.includes(studentDocRef.id)) {
                updatedStudentIDs.push(studentDocRef.id); // Add the new student ID
                
                await updateDoc(classDocRef, {
                  studentID: updatedStudentIDs // Save the array of student IDs
                });
                
                console.log(`Class document updated with student ID for student: ${studentDocRef.id}`);
              } else {
                console.log(`Student ID ${studentDocRef.id} already exists in the class document.`);
              }
            }
          }

          for (const course of InitialSelectedCourses[index]) {
            // Check if the course is not selected
            // Remove the student ID from the class document if the course is not selected and exist in the initial selected courses
            console.log("I AM HERE ...Course", course);
            if (!selectedCourses[index].map(course => course.value).includes(course.value)) {
              const classDocRef = doc(db, "class", course.value); // Assuming each course has at least one value
              const classDocSnapshot = await getDoc(classDocRef);
              console.log("I ENTER ENTER Class Doc", classDocSnapshot);
              if (classDocSnapshot.exists()) {
                const classData = classDocSnapshot.data();
                console.log("Class Data", classData);
                const updatedStudentIDs = classData.studentID || []; // Existing student IDs or empty array
                console.log("Updated Student ID", updatedStudentIDs);
                // Check if the student ID already exists in the array
                if (updatedStudentIDs.includes(studentDocRef.id)) {
                  // updatedStudentIDs.splice(updatedStudentIDs.indexOf(studentDocRef.id), 1); // Remove the student ID
                  await updateDoc(classDocRef, {
                    studentID: arrayRemove(studentDocRef.id) // Save the array of student IDs
                  });
                  
                  console.log(`Class document updated with student ID for student: ${studentDocRef.id}`);
                } else {
                  console.log(`Student ID ${studentDocRef.id} already exists in the class document.`);
                }
              }
            }
          }
          setInitialSelectedCourses(selectedCourses);
        } catch (error) {
          console.error(`Error updating class document for student: ${studentDocRef.id}`, error);
          // Handle error if needed
        }
      }));

      // Update parent document with children IDs
      await setDoc(doc(db, "parent", id), {
        children: arrayUnion(...newStudentsID)
      });

      // Remove students from the Firestore collection
      await Promise.all(deletedStudents.map(async (studentId) => {
        await deleteDoc(doc(db, "students", studentId));
      }));
    }

    toast.success('User updated successfully!');
  } catch (error) {
    console.error('Error updating user: ', error);
    toast.error('Error updating user. Please try again.');
  }
};


  // Log updated studentData after state update
  useEffect(() => {
    console.log("Student",studentData);
    console.log("Deleted Students", deletedStudents);
  }, [studentData]);

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer />
      <div className="flex items-center mb-4 font-bold text-xl">
        <Link to="/admin/users" className="text-blue-500 hover:underline">User Management</Link>
        <span className="mx-2">&nbsp;/&nbsp;</span>
        <span className="text-gray-500">Edit</span>
      </div>

      {loading ? (
        <CardLoading />
      ) : userData ? (
        <form onSubmit={handleSubmit}>
          <span className="text-xl font-bold ">{userData.role === "parent" ? "Parent" : userData.role === "teacher" ? "Teacher" : "Admin"} Information</span>
          <div className="grid grid-cols-2 gap-4">
            {/* User Information */}
            {/* First Name */}
            <div className="flex flex-col">
              <label className="text-sm" htmlFor="firstName">First Name:</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={userData.firstName}
                onChange={handleInputChange}
                className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
              />
            </div>
            {/* Last Name */}
            <div className="flex flex-col">
              <label className="text-sm" htmlFor="lastName">Last Name:</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={userData.lastName}
                onChange={handleInputChange}
                className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
              />
            </div>
            {/* Contact Number */}
            <div className="flex flex-col">
              <label className="text-sm" htmlFor="contactNumber">Contact Number:</label>
              <input
                type="text"
                id="contactNumber"
                name="contactNumber"
                value={userData.contactNumber}
                onChange={handleInputChange}
                className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
              />
            </div>
            {/* Email */}
            <div className="flex flex-col">
              <label className="text-sm" htmlFor="email">Email:</label>
              <input
                type="text"
                id="email"
                name="email"
                value={userData.email}
                onChange={handleInputChange}
                className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
              />
            </div>
            {/* Address */}
            <div className="flex flex-col">
              <label className="text-sm" htmlFor="address">Address:</label>
              <input
                type="text"
                id="address"
                name="address"
                value={userData.address}
                onChange={handleInputChange}
                className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
              />
            </div>
            {/* Postcode */}
            <div className="flex flex-col">
              <label className="text-sm" htmlFor="postcode">Postcode:</label>
              <input
                type="text"
                id="postcode"
                name="postcode"
                value={userData.postcode}
                onChange={handleInputChange}
                className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
              />
            </div>
            {/* City */}
            <div className="flex flex-col">
              <label className="text-sm" htmlFor="city">City:</label>
              <input
                type="text"
                id="city"
                name="city"
                value={userData.city}
                onChange={handleInputChange}
                className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
              />
            </div>
            {/* State */}
            <div className="flex flex-col">
              <label className="text-sm" htmlFor="state">State:</label>
              <input
                type="text"
                id="state"
                name="state"
                value={userData.state}
                onChange={handleInputChange}
                className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
              />
            </div>
          </div>

          {/* Student Information */}
          {userData.role === "parent" && studentData && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Student Information</h2>
              {studentData.map((student, index) => (
                <div key={index} className="mb-4 grid mx-0 md:grid-cols-2 sm:grid-cols-1 sm:mx-2 gap-4">
                  <div>                    
                    <label
                      className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                    >
                      First Name
                    </label>
                    <input
                      type="text"
                      value={student.firstName}
                      onChange={(e) => handleStudentInputChange(index, "firstName", e.target.value)}
                      className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                    />
                  </div>
                  <div>
                    <label
                      className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={student.lastName}
                      onChange={(e) => handleStudentInputChange(index, "lastName", e.target.value)}
                      className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                    />  
                  </div>
                  <div>
                    <label
                      className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                    >
                      Age
                    </label>
                    <input
                      type="text"
                      value={student.age}
                      onChange={(e) => handleStudentInputChange(index, "age", e.target.value)}
                      className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                    />  
                  </div>
                  <div>
                    <label
                      className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                    >
                      IC Number
                    </label>
                    <input
                      type="text"
                      value={student.icNumber}
                      onChange={(e) => handleStudentInputChange(index, "icNumber", e.target.value)}
                      className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                    />  
                  </div>
                  <div>
                    <label
                      className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                    >
                      Contact Number
                    </label>
                    <input
                      type="text"
                      value={student.contactNumber}
                      onChange={(e) => handleStudentInputChange(index, "contactNumber", e.target.value)}
                      className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                    />  
                  </div>
                  <div>
                    <label
                      className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                    >
                      Education Level
                    </label>
                    <select
                      className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      value={student.educationLevel}
                      onChange={(e) => handleStudentInputChange(index, "educationLevel",e.target.value)}
                      required
                    >
                      <option value="" disabled>Select Education Level</option>
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
                  <div className="mt-4">
                    <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                      Select Registered Courses
                    </label>
                    <MultiSelect
                      options={courses}
                      value={getRegisterCourseName(selectedCourses[index])}
                      onChange={(selectedOptions) => handleCourseSelection(index, selectedOptions)}
                      labelledBy={`courses-${index}`}
                      hasSelectAll={false}
                    />
                  </div>
                  <div>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveStudent(index, student.id)} 
                      className="bg-red-500 text-white py-2 px-4 rounded">
                      Remove Student
                    </button>
                  </div>
                </div>
              ))}
              <button 
                type="button" 
                onClick={handleAddStudent} 
                className="bg-blue-500 text-white py-2 px-4 rounded mt-4">
                Add Student
              </button>
            </div>
          )}

          <div className="flex justify-center mt-4">
            <button type="submit" className="bg-green-500 text-white py-2 px-4 rounded">
              Update User
            </button>
            <Link to="/admin/users" className="ml-4 bg-gray-500 text-white py-2 px-4 rounded">
              Cancel
            </Link>
          </div>
        </form>
      ) : (
        <p>User not found.</p>
      )}
    </div>
  );
}

export default CardUserManagementEdit;
