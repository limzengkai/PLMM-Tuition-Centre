import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth, db } from "../../../config/firebase";
import { doc, setDoc, collection, addDoc, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import { ToastContainer, toast } from 'react-toastify';
import "react-datepicker/dist/react-datepicker.css";
import { MultiSelect } from "react-multi-select-component";

function CardAddUser() {
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [birthDate, setBirthDate] = useState(() => new Date(new Date().setFullYear(new Date().getFullYear() - 18)));
  const [role, setRole] = useState("admin"); // Default role
  const [students, setStudents] = useState([
    {
      firstName: "",
      lastName: "",
      age: 0,
      icNumber: "",
      contactNumber: "",
      educationLevel: "",
      registeredCourses: [], // Separate state for each student's selected courses
      parentId: ""
    }
  ]);
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([[]]); // Separate state for each student's selected courses

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesQuery = query(collection(db, "class"));
        const coursesSnapshot = await getDocs(coursesQuery);
        const coursesData = coursesSnapshot.docs.map(doc => ({
          label: `${doc.data().academicLevel}_${doc.data().CourseName}`,
          value: doc.id
        }));
        setCourses(coursesData);
      } catch (error) {
        toast.error("Error fetching courses: " + error.message + ". Please try again later.");
      }
    };
    fetchCourses();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const generatedPassword = generateRandomPassword(12);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        generatedPassword
      );
    
      // Send email verification
      await sendEmailVerification(userCredential.user);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        firstName,
        lastName,
        contactNumber,
        address,
        postcode,
        city,
        state,
        birthDate,
        role,
        registrationDate: new Date(),
      });

      if (role === "parent") {
        await saveStudentInformation(user.uid);
      }else if(role === "teacher"){
        await addDoc(collection(db,"teacher"), {
          subjectTaught: [],
          userID: user.uid
        });
      }else if(role === "admin"){
        await addDoc(collection(db, "admin"), {
          userID: user.uid
        });
      }else{
        toast.error("Invalid role selected. Please try again.");
      }
      addDoc(collection(db,"mail"), {
        to: email,
        message: {
          subject: "Welcome to PLMM Tuition Centre",
          html: `
            <html>
              <head>
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    padding: 20px;
                  }
                  .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #fff;
                    border-radius: 8px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    padding: 20px;
                  }
                  h1 {
                    color: #333;
                    text-align: center;
                  }
                  p {
                    color: #666;
                    text-align: center;
                  }
                  .password {
                    font-size: 18px;
                    font-weight: bold;
                    color: #007bff;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>Welcome to PLMM Tuition Centre</h1>
                  <p>Your default password is <span class="password">${generatedPassword}</span></p>
                  <p>Please change your password after logging in. Thank you!</p>
                </div>
              </body>
            </html>
          `,
        }
      });
      toast("The user is registered successfully. The default password has been sent to the user's email.");
    } catch (error) {
      setError(error.message);
    }

    setLoading(false);
  };

  const saveStudentInformation = async (parentId) => {
    const childrenIds = [];
    students.forEach(async (student, index) => {
      const studentDocId = `student_${parentId}_${index}`; // Generate custom ID
      const studentDocRef = doc(db, "students", studentDocId);
      
      // Map selected course objects to their IDs
      const courseIds = selectedCourses[index].map(course => course.value);
      
      const updatedStudent = {
        ...student,
        registeredCourses: courseIds,
        parentId: parentId
      };
  
      try {
        childrenIds.push(studentDocId);
        await setDoc(studentDocRef, updatedStudent);
        toast.success(`Student ${index + 1} information saved successfully.`);
      } catch (error) {
        toast.error(`Error saving student ${index + 1} information: ${error.message}`);
      }

      // Update class collection with new studentID
      try {
        await updateDoc(doc(db, "class", courseIds), {
          studentID: [childrenIds]
        });
        toast.success('Student IDs updated successfully in class collection.');
      } catch (error) {
        toast.error(`Error updating student IDs in class collection: ${error.message}`);
      }
    });
  
    try {
      await setDoc(doc(db, "parent", parentId), { children: childrenIds });
    } catch (error) {
      toast.error(`Error saving children IDs for parent ${parentId}: ${error.message}`);
    }


  }

  function generateRandomPassword(length) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  const addStudentField = () => {
    setStudents([...students, { 
      firstName: "", 
      lastName: "", 
      age: "", 
      icNumber: "", 
      contactNumber: "", 
      educationLevel: "", 
      registeredCourses: [], 
      parentId: "" 
    }]);
    setSelectedCourses([...selectedCourses, []]); // Add an empty array for selected courses for the new student
  };

  const removeStudentField = () => {
    const updatedStudents = [...students];
    updatedStudents.pop();
    setStudents(updatedStudents);

    const updatedSelectedCourses = [...selectedCourses];
    updatedSelectedCourses.pop();
    setSelectedCourses(updatedSelectedCourses);
  };

  const handleStudentChange = (index, e, fieldName) => {
    const { value } = e.target;
    const updatedStudents = [...students];
    updatedStudents[index][fieldName] = value;
    setStudents(updatedStudents);
  };

  const handleCourseSelection = (index, selectedOptions) => {
    const updatedSelectedCourses = [...selectedCourses];
    updatedSelectedCourses[index] = selectedOptions;
    setSelectedCourses(updatedSelectedCourses);
  };


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-4 md:font-bold md:text-xl sm:text-lg">
      <ToastContainer />
        <Link to="/admin/users" className="text-blue-500 hover:underline">User Management</Link>
        <span className="mx-2">&nbsp;/&nbsp;</span>
        <span className="text-gray-500">Add User</span>
      </div>

      <div className="flex content-center items-center justify-center h-full">
        <div className="w-full lg:w-10/12 px-4">
          <div className="relative flex flex-col break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-200 border-0">
            <div className="rounded-t mb-0 px-6 py-6">
              <div className="text-center mb-3">
                <h6 className="text-blueGray-500 text-sm font-bold">
                  Sign up Page
                </h6>
              </div>
              <hr className="mt-6 border-b-1 border-blueGray-300" />
            </div>
            <div className="md:px-10 py-10 px-2 pt-0">
              <form onSubmit={handleRegister}>
                <div className="grid md:grid-cols-2 gap-4 sm:grid-cols-1">
                <div className="relative mb-3 ">
                    <label
                      className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                      htmlFor="email"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="relative mb-3">
                    <label
                      className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                      htmlFor="password"
                    >
                      Password
                    </label>
                    <input
                      disabled
                      type="password"
                      id="password"
                      className="border-0 px-3 py-3 placeholder-blueGray-300 text-gray-800 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      placeholder="Default Password will send to users email"
                      minLength={6}
                      required
                    />
                  </div>
                  <div className="relative mb-3">
                    <label
                      className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                      htmlFor="firstName"
                    >
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="relative mb-3">
                    <label
                      className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                      htmlFor="lastName"
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="relative mb-3">
                    <label
                      className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                      htmlFor="contactNumber"
                    >
                      Contact Number
                    </label>
                    <input
                      type="text"
                      id="contactNumber"
                      className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      placeholder="Contact Number"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      required
                    />
                  </div>

                  <div className="relative mb-3">
                    <label
                      className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                    >
                      Date of Birth
                    </label>
                    <DatePicker
                      showYearDropdown
                      dateFormat="dd/MM/yyyy"
                      id="birthDate"
                      className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      selected={birthDate} // Set selected prop to birthDate
                      onChange={(date) => setBirthDate(date)}
                      required
                    />
                  </div>
                </div>

              {/* Second column */}
              <div>
                <div className="relative mb-3 mt-3">
                    <label
                      className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                      htmlFor="address"
                    >
                      Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      placeholder="Address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative mb-3">
                    <label
                      className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                      htmlFor="postcode"
                    >
                      Postcode
                    </label>
                    <input
                      type="text"
                      id="postcode"
                      className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      placeholder="Postcode"
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                      required
                    />
                  </div>

                  <div className="relative mb-3">
                    <label
                      className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                      htmlFor="city"
                    >
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>

                  <div className="relative mb-3">
                    <label
                      className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                      htmlFor="state"
                    >
                      State
                    </label>
                    <input
                      type="text"
                      id="state"
                      className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      placeholder="State"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="relative mb-3">
                    <label
                      className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                      htmlFor="role"
                    >
                      Role
                    </label>
                    <select
                      id="role"
                      className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                    >
                      <option value="admin">Admin</option>
                      <option value="teacher">Teacher</option>
                      <option value="parent">Parent</option>
                    </select>
                  </div>
                </div>
                </div>
                <div>
                  {/* Additional fields for student information */}
                  {role === "parent" && (
                    <div>
                      <h2 className="text-lg font-semibold mb-4">Student Information</h2>
                      {students.map((student, index) => (
                        <div key={index} className="mb-4 grid md:grid-cols-2 sm:grid-cols-1 sm:mx-2 gap-4">
                          <div>                    
                            <label
                              className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                              htmlFor={`firstName-${index}`}
                            >
                              First Name
                            </label>
                            <input
                              type="text"
                              placeholder="First Name"
                              className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                              value={student.firstName}
                              onChange={(e) => handleStudentChange(index, e, "firstName")}
                              required
                            />
                          </div>
                          <div>
                            <label
                              className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                              htmlFor={`lastName-${index}`}
                            >
                              Last Name
                            </label>
                            <input
                              type="text"
                              placeholder="Last Name"
                              className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                              value={student.lastName}
                              onChange={(e) => handleStudentChange(index, e, "lastName")}
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                              <label
                                className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                              >
                                Age
                              </label>
                              <input
                                type="number"
                                placeholder="Age"
                                className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                                value={student.age}
                                onChange={(e) => handleStudentChange(index, e, "age")}
                                min={0}
                                max={120}
                                required
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
                                placeholder="IC Number"
                                className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                                value={student.icNumber}
                                onChange={(e) => handleStudentChange(index, e, "icNumber")}
                                required
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                              <label
                                className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                              >
                                Contact Number
                              </label>
                              <input
                                type="text"
                                placeholder="Contact Number"
                                className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                                value={student.contactNumber}
                                onChange={(e) => handleStudentChange(index, e, "contactNumber")}
                                required
                              />
                            </div>
                            <div>
                              <label
                                className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                              >
                                Education Level
                              </label>
                              <select
                                className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                                value={student.educationLevel}
                                onChange={(e) => handleStudentChange(index, e, "educationLevel")}
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
                          </div>
                          <div className="mt-4">
                          <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                            Select Registered Courses
                          </label>
                          <MultiSelect
                            options={courses}
                            value={selectedCourses[index]}
                            onChange={(selectedOptions) => handleCourseSelection(index, selectedOptions)}
                            labelledBy={`courses-${index}`}
                            hasSelectAll={false}
                          />
                        </div>
                      </div>
                      ))}
                      <div className="flex justify-center mt-4">
                        <button
                          type="button"
                          className="bg-blue-500 text-white px-5 py-3 mb-3 rounded-full mt-4 mr-2"
                          onClick={addStudentField}
                        >
                          Add Student
                        </button>
                        <button
                          type="button"
                          className="bg-red-500 text-white px-5 py-3 mb-3 rounded-full mt-4"
                          onClick={removeStudentField}
                        >
                          Remove Student
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Submit button and error message */}
                  <div className="text-center mt-6">
                    <button
                      className={`${
                        loading ? "bg-gray-800" : "bg-blue-800"
                      } text-white active:bg-blueGray-600 text-sm font-bold uppercase px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 w-full ease-linear transition-all duration-150`}
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Creating Account..." : "Create Account"}
                    </button>
                  </div>
                </div>
              </form>
              {error && (
                <div className="text-red-500 text-center mt-4">{error}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardAddUser;