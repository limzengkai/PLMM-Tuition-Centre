import React, { useState, useEffect } from "react";
import { useLocation, Link, useParams, useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  addDoc,
  setDoc,
} from "firebase/firestore";
import { db, functions } from "../../../config/firebase";
import CardLoading from "../CardLoading";
import Swal from "sweetalert2";
import { ToastContainer, toast } from "react-toastify";
import { httpsCallable } from "firebase/functions";

function CardUsersRegistration() {
  const [selectedFunction, setSelectedFunction] = useState("management");
  const [registration, setRegistration] = useState([]);
  const [course, setCourse] = useState([]);
  const [error, setError] = useState();
  const location = useLocation();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();


  useEffect(() => {
    const fetchData = async () => {
      try {
        const registrationDocRef = doc(db, "registration", id);
        const registrationDocSnap = await getDoc(registrationDocRef);

        if (registrationDocSnap.exists()) {
          const registrationData = registrationDocSnap.data();
          if (!registrationData.status) {
            navigate("/admin/users/registration");
          }
          setRegistration(registrationData);
        } else {
          console.log("No such document!");
        }

        const courseQuery = query(collection(db, "class"));
        const courseDocs = await getDocs(courseQuery);
        const courses = courseDocs.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCourse(courses);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error.message);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    const pathname = location.pathname;
    if (pathname === "/admin/users" || pathname.startsWith("/admin/users/")) {
      setSelectedFunction("management");
    }
  }, [location.pathname]);

  const getDate = (timestamp) => {
    if (timestamp && timestamp.toDate) {
      const d = timestamp.toDate();
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, "0");
      const day = d.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    return "";
  };

  const getCourse = (id) => {
    const foundCourse = course.find((c) => c.id === id);
    return foundCourse
      ? `${foundCourse.academicLevel}_${foundCourse.CourseName}`
      : "Course not found";
  };

  const handleApproved = async () => {
    const confirmResult = await Swal.fire({
      title: "Are you sure?",
      text: "You are about to approve this registration.",
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, approve it!",
      cancelButtonText: "Cancel",
    });
  
    if (confirmResult.isConfirmed) {
      setLoading(true);
      console.log("1 3")
      try {
        console.log("2")
        const processRegistrationFunction = httpsCallable(functions, 'processRegistration');
        console.log("Process Registration Function:", processRegistrationFunction);
        const result = await processRegistrationFunction({ registration }); // Call the Cloud Function directly without using .call()
        
        if (result.data.error) {
          // If an error is returned from the Cloud Function, display it
          throw new Error(result.data.error);
        }
  
        const user = result.data.userCredential;
        saveStudentInformation(user);
        
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: "The user is registered successfully. The default password has been sent to the user's email."
        });
  
        setLoading(false);
      } catch (error) {
        // If there's an error during registration or from the Cloud Function, display it using Swal
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message,
        });
        console.log("Error approving registration:", error.message);
        setLoading(false);
      }
    }
  };
  
  const saveStudentInformation = async (parentId) => {
    const childrenIds = [];
  
    try {
      for (let index = 0; index < registration.student.length; index++) {
        const student = registration.student[index];
        const studentDocId = `student_${parentId}_${index}`;
        const studentDocRef = doc(db, "students", studentDocId);
  
        // Map selected course objects to their IDs
        const courseIds = student.registeredCourses.map((course) => course);
  
        const updatedStudent = {
          ...student,
          registeredCourses: courseIds,
          parentId: parentId,
        };
  
        // Save student information
        await setDoc(studentDocRef, updatedStudent);
        childrenIds.push(studentDocId);
        toast.success(`Student ${index + 1} information saved successfully.`);
  
        // Update class collection with new student IDs
        for (const courseId of courseIds) {
          const classDocRef = doc(db, "class", courseId);
          const classDoc = await getDoc(classDocRef);
  
          if (classDoc.exists()) {
            const classData = classDoc.data();
            const updatedStudentIds = classData.studentID ? [...classData.studentID, studentDocId] : [studentDocId];
            await updateDoc(classDocRef, { studentID: updatedStudentIds });
            toast.success(`Student ID updated successfully in class collection for course: ${courseId}`);
          } else {
            console.error(`Class document not found for course: ${courseId}`);
            toast.error(`Class document not found for course: ${courseId}`);
          }
        }
      }
  
      // Save children IDs for parent
      await setDoc(doc(db, "parent", parentId), { children: childrenIds });
    } catch (error) {
      console.error("Error saving student information:", error.message);
      toast.error(`Error saving student information: ${error.message}`);
    }
  };
  

  const handleRejected = async () => {
    // Display a confirmation dialog using SweetAlert
    const confirmResult = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, reject it!",
      cancelButtonText: "Cancel",
    });

    // If the user confirms the rejection
    if (confirmResult.isConfirmed) {
      try {
        await updateDoc(doc(db, "registration", id), {
          status: false,
        });
        navigate("/admin/users/registration"); // Navigate to the specified route
        // Display a success message
        Swal.fire(
          "Rejected!",
          "The registration has been rejected.",
          "success"
        );
      } catch (error) {
        console.error("Error rejecting registration:", error.message);
        // Handle error, show a message, etc.
      }
    }
  };
  return (
    <>
      {loading ? (
        <CardLoading loading={loading} />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-4 font-bold text-xl">
            <Link
              to="/admin/users/registration"
              className="text-blue-500 hover:underline"
            >
              User Registration
            </Link>
            <span className="mx-2">&nbsp;/&nbsp;</span>
            <span className="text-gray-500">View</span>
          </div>
          <div className="flex justify-between mb-3">
            <div className="flex">
              <Link
                to="/admin/users"
                className={
                  " rounded-l-lg font-bold py-2 px-4" +
                  (location.pathname === "/admin/users"
                    ? " bg-blue-500 text-white hover:text-lightBlue-100"
                    : " text-black  hover:bg-blue-500 hover:text-white")
                }
                onClick={() => setSelectedFunction("management")}
              >
                Management
              </Link>

              <Link
                to="/admin/users/registration"
                className={
                  " rounded-r-lg font-bold py-2 px-4 m-0" +
                  (location.pathname.includes("/admin/users/registration")
                    ? "  bg-blue-500 text-white hover:text-lightBlue-100"
                    : " text-black  hover:Fbg-blue-500 hover:text-white")
                }
                onClick={() => setSelectedFunction("registration")}
              >
                Registration
              </Link>
            </div>
            <div>
              <button
                className="m-0 p-4 rounded-lg text-black bg-yellow-400 font-bold py-2 px-4"
                onClick={() => {}}
                style={{ marginLeft: "1rem" }}
              >
                Add User
              </button>
            </div>
          </div>
          <div className="block w-full overflow-x-auto">
            {error && (
              <div className="bg-red-500 p-5 text-center">
                <span className="text-white">{error}</span>
              </div>
            )}

            <div className="font-bold mt-4 p-4 text-lg text-center underline">
              Parent Information
            </div>
            <div className="bg-white border shadow-md grid grid-cols-2 gap-4 rounded-md p-4">
              <div className="font-bold col-span-2 underline">
                Parent Information:
              </div>
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold">
                  Parent Name: {registration.firstName} {registration.lastName}
                </div>
              </div>
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold">Email: {registration.email}</div>
              </div>
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold">
                  Birthday: {getDate(registration.birthDate)}
                </div>
              </div>
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold">
                  Contact Number: {registration.contactNumber}
                </div>
              </div>
              <div className="flex justify-between col-span-2 items-center mb-2">
                <div className="font-bold">Address: {registration.address}</div>
              </div>
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold">State: {registration.state}</div>
              </div>
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold">
                  Postcode: {registration.postcode}
                </div>
              </div>
              {registration.student &&
                registration.student.map((student, idx) => (
                  <div
                    key={idx}
                    className="bg-white border shadow-md rounded-md p-4"
                  >
                    <div className="font-bold text-lg mb-4 underline">
                      Student {idx + 1}
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-bold">Student Name:</div>
                      <div>
                        {student.firstName} {student.lastName}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-bold">Contact Number:</div>
                      <div>{student.contactNumber}</div>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-bold">Age:</div>
                      <div>{student.age}</div>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-bold">IC Number:</div>
                      <div>{student.icNumber}</div>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-bold">Academic Level:</div>
                      <div>{student.educationLevel}</div>
                    </div>
                    <div className="font-bold underline">
                      Registered Courses:
                    </div>
                    {student.registeredCourses &&
                      student.registeredCourses.map((course, courseIdx) => (
                        <div
                          key={courseIdx}
                          className="flex justify-between items-center mb-2"
                        >
                          <div className="font-bold">
                            {courseIdx + 1}. Course Name:
                          </div>
                          <div>{getCourse(course)}</div>
                        </div>
                      ))}
                  </div>
                ))}
            </div>
            <div className="flex justify-center mt-4">
              <button
                className="mr-3 text-white rounded-full font-bold py-2 px-4 bg-green-500 focus:outline-none mb-1 ease-linear transition-all duration-150"
                type="button"
                onClick={handleApproved}
              >
                Approved
              </button>
              <button
                className="mr-3 text-white rounded-full font-bold py-2 px-4 bg-red-600 focus:outline-none mb-1 ease-linear transition-all duration-150"
                type="button"
                onClick={handleRejected}
              >
                Rejected
              </button>
            </div>
          </div>
          <ToastContainer />
        </div>
      )}
    </>
  );
}

export default CardUsersRegistration;
