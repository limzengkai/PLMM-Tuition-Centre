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
import { sendEmailVerification } from "firebase/auth";

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
  
        const userCredential = result.data.userCredential;
        const emailVerificationLink = result.data.emailVerificationLink
        const generatedPassword = result.data.generatedPassword
        console.log(userCredential)
        const user = userCredential;
  
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          firstName: registration.firstName,
          lastName: registration.lastName,
          contactNumber: registration.contactNumber,
          address: registration.address,
          postcode: registration.postcode,
          city: registration.city,
          state: registration.state,
          birthDate: registration.birthDate,
          role: registration.role,
          registrationDate: new Date(),
        });
  
        saveStudentInformation(user.uid);
  
        const loginLink = `http://localhost:3000/auth/login`;
        const emailBody = `
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f7f7f7;
              border-radius: 10px;
            }
            .button {
              display: inline-block;
              background-color: #3085d6;
              color: #ffffff;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <p>Hello ${registration.firstName},</p>
            <p>Your account has been approved. Please click the following button to login:</p>
            <a href="${loginLink}" class="button">Login</a>
            <p>Your default password is: ${generatedPassword}</p>
            <p>Please verify your account by clicking the button below:</p>
            <a href="${emailVerificationLink}" class="button">Verify Account</a>
            <p>Please change your password after logging in. Thank you!</p>
          </div>
        </body>
        </html>
        `;
  
        await addDoc(collection(db, "mail"), {
          to: user.email,
          message: {
            subject: "Welcome to PLMM Tuition Centre",
            html: emailBody,
          },
        });
  
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
    console.log("Registration: ",registration)
    registration.student.forEach(async (student, index) => {
      const studentDocId = `student_${parentId}_${index}`; // Generate custom ID
      const studentDocRef = doc(db, "students", studentDocId);

      // Map selected course objects to their IDs
      const courseIds = student.registeredCourses.map((course) => course);

      const updatedStudent = {
        ...student,
        registeredCourses: courseIds,
        parentId: parentId,
      };

      try {
        childrenIds.push(studentDocId);
        await setDoc(studentDocRef, updatedStudent);
        toast.success(`Student ${index + 1} information saved successfully.`);
      } catch (error) {
        toast.error(
          `Error saving student ${index + 1} information: ${error.message}`
        );
      }

      // Update class collection with new studentID
      try {
        console.log("CLASS: ", courseIds)
        await updateDoc(doc(db, "class", courseIds), {
          studentID: [childrenIds],
        });
        toast.success("Student IDs updated successfully in class collection.");
      } catch (error) {
        toast.error(
          `Error updating student IDs in class collection: ${error.message}`
        );
      }
    });

    try {
      await setDoc(doc(db, "parent", parentId), { children: childrenIds });
    } catch (error) {
      toast.error(
        `Error saving children IDs for parent ${parentId}: ${error.message}`
      );
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
