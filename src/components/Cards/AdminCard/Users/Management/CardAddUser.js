import React, { useState, useEffect } from "react";
import { db, functions } from "../../../../../config/firebase";
import { doc, setDoc, collection, addDoc, query, getDocs, updateDoc } from 'firebase/firestore';
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import Swal from 'sweetalert2';
import "react-datepicker/dist/react-datepicker.css";
import { MultiSelect } from "react-multi-select-component";
import { httpsCallable } from "firebase/functions";
import { getStates, getCities, getPostcodes } from "@ringgitplus/malaysia-states";

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

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [postcodes, setPostcodes] = useState([]);

  useEffect(() => {
    const fetchStates = () => {
      const statesData = getStates();
      setStates(statesData);
    };

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
        Swal.fire('Error', 'Error fetching courses. Please try again later.', 'error');
      }
    };

    fetchStates();
    fetchCourses();
  }, []);

  const handleStateChange = (selectedState) => {
    setState(selectedState);
    const citiesData = getCities(selectedState);
    setCities(citiesData);
    setCity("");  // Reset city when state changes
    setPostcode(""); // Reset postcode when state changes
  };

  const handleCityChange = (selectedCity) => {
    setCity(selectedCity);
    const postcodesData = getPostcodes(state, selectedCity);
    setPostcodes(postcodesData);
    setPostcode(""); // Reset postcode when city changes
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const processRegistrationFunction = httpsCallable(functions, 'processRegistration');
      const registration = {
        email,
        firstName,
        lastName,
        contactNumber,
        address,
        postcode,
        city,
        state,
        birthDate,
        role
      };

      const result = await processRegistrationFunction({ registration });
      if (result.data.error) {
        // If an error is returned from the Cloud Function, display it
        throw new Error(result.data.error);
      }

      const user = result.data.userCredential;

      if (role === "parent") {
        await saveStudentInformation(user);
      } else if (role === "teacher") {
        await addDoc(collection(db, "teacher"), {
          subjectTaught: [],
          userID: user,
          status: false,
          description: "",
          photo: "",
        });
      } else if (role === "admin") {
        await addDoc(collection(db, "admin"), {
          userID: user
        });
      } else {
        Swal.fire('Error', 'Invalid role selected. Please try again.', 'error');
        return;
      }
      Swal.fire('Success', 'The user is registered successfully. The default password has been sent to the user\'s email.', 'success');
    } catch (error) {
      setError(error.message);
      Swal.fire('Error', error.message, 'error');
    }

    // Reset form fields
    // setEmail("");
    // setFirstName("");
    // setLastName("");
    // setContactNumber("");
    // setAddress("");
    // setPostcode("");
    // setCity("");
    // setState("");
    // setBirthDate(new Date(new Date().setFullYear(new Date().getFullYear() - 18)));
    // setRole("admin");


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
        Swal.fire('Success', `Student ${index + 1} information saved successfully.`, 'success');
      } catch (error) {
        Swal.fire('Error', `Error saving student ${index + 1} information: ${error.message}`, 'error');
      }

      // Update class collection with new studentID
      try {
        await updateDoc(doc(db, "class", courseIds), {
          studentID: [childrenIds]
        });
        Swal.fire('Success', 'Student IDs updated successfully in class collection.', 'success');
      } catch (error) {
        Swal.fire('Error', `Error updating student IDs in class collection: ${error.message}`, 'error');
      }
    });

    setAddress(""); // Reset address field
    setCity(""); // Reset city field
    setPostcode(""); // Reset postcode field
    setFirstName(""); // Reset first name field
    setLastName(""); // Reset last name field
    setContactNumber(""); // Reset contact number field
    setBirthDate(new Date(new Date().setFullYear(new Date().getFullYear() - 18))); // Reset birth date field
    setStudents([
      {
        firstName: "",
        lastName: "",
        age: 0,
        icNumber: "",
        contactNumber: "",
        educationLevel: "",
        registeredCourses: [],
        parentId: "",
      },
    ]); // Reset students array
    
    try {
      await setDoc(doc(db, "parent", parentId), { children: childrenIds });
    } catch (error) {
      Swal.fire('Error', `Error saving children IDs for parent ${parentId}: ${error.message}`, 'error');
    }
  };

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
                {/* Basic Details */}
                <h6 className="text-blueGray-400 text-sm mt-3 mb-6 font-bold uppercase">
                  User Information
                </h6>
                <div className="flex flex-wrap">
                  {/* Email Field */}
                  <div className="w-full lg:w-6/12 px-4">
                    <div className="relative w-full mb-3">
                      <label
                        className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                        htmlFor="grid-password"
                      >
                        Email address
                      </label>
                      <input
                        type="email"
                        className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* First Name Field */}
                  <div className="w-full lg:w-6/12 px-4">
                    <div className="relative w-full mb-3">
                      <label
                        className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                        htmlFor="grid-password"
                      >
                        First Name
                      </label>
                      <input
                        type="text"
                        className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Last Name Field */}
                  <div className="w-full lg:w-6/12 px-4">
                    <div className="relative w-full mb-3">
                      <label
                        className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                        htmlFor="grid-password"
                      >
                        Last Name
                      </label>
                      <input
                        type="text"
                        className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Contact Number Field */}
                  <div className="w-full lg:w-6/12 px-4">
                    <div className="relative w-full mb-3">
                      <label
                        className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                        htmlFor="grid-password"
                      >
                        Contact Number
                      </label>
                      <input
                        type="text"
                        className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Address Field */}
                  <div className="w-full lg:w-6/12 px-4">
                    <div className="relative w-full mb-3">
                      <label
                        className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                        htmlFor="grid-password"
                      >
                        Address
                      </label>
                      <input
                        type="text"
                        className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* State Field */}
                  <div className="w-full lg:w-6/12 px-4">
                    <div className="relative w-full mb-3">
                      <label
                        className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                        htmlFor="grid-password"
                      >
                        State
                      </label>
                      <select
                        className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        value={state}
                        onChange={(e) => handleStateChange(e.target.value)}
                        required
                      >
                        <option value="">Select State</option>
                        {states.map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* City Field */}
                  <div className="w-full lg:w-6/12 px-4">
                    <div className="relative w-full mb-3">
                      <label
                        className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                        htmlFor="grid-password"
                      >
                        City
                      </label>
                      <select
                        className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        value={city}
                        onChange={(e) => handleCityChange(e.target.value)}
                        required
                        disabled={!state}
                      >
                        <option value="">Select City</option>
                        {cities.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Postcode Field */}
                  <div className="w-full lg:w-6/12 px-4">
                    <div className="relative w-full mb-3">
                      <label
                        className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                        htmlFor="grid-password"
                      >
                        Postcode
                      </label>
                      <select
                        className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        value={postcode}
                        onChange={(e) => setPostcode(e.target.value)}
                        required
                        disabled={!city}
                      >
                        <option value="">Select Postcode</option>
                        {postcodes.map((postcode) => (
                          <option key={postcode} value={postcode}>{postcode}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Birth Date Field */}
                  <div className="w-full lg:w-6/12 px-4">
                    <div className="relative w-full mb-3">
                      <label
                        className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                        htmlFor="grid-password"
                      >
                        Birth Date
                      </label>
                      <DatePicker
                        selected={birthDate}
                        onChange={(date) => setBirthDate(date)}
                        className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        dateFormat="dd/MM/yyyy"
                        maxDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
                        showYearDropdown
                        scrollableYearDropdown
                        required
                      />
                    </div>
                  </div>

                  {/* Role Field */}
                  <div className="w-full lg:w-6/12 px-4">
                    <div className="relative w-full mb-3">
                      <label
                        className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                        htmlFor="grid-password"
                      >
                        Role
                      </label>
                      <select
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

                {/* Student Details */}
                {role === "parent" && (
                  <div>
                    <h6 className="text-blueGray-400 text-sm mt-3 mb-6 font-bold uppercase">
                      Children Information
                    </h6>
                    {students.map((student, index) => (
                      <div key={index} className="flex flex-wrap border-2 border-blueGray-400 rounded-md mb-2 p-4">
                        <div className="w-full lg:w-6/12 px-4">
                          <div className="relative w-full mb-3">
                            <label
                              className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                              htmlFor="grid-password"
                            >
                              Child's First Name
                            </label>
                            <input
                              type="text"
                              className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                              value={student.firstName}
                              onChange={(e) => handleStudentChange(index, e, "firstName")}
                              required
                            />
                          </div>
                        </div>
                        <div className="w-full lg:w-6/12 px-4">
                          <div className="relative w-full mb-3">
                            <label
                              className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                              htmlFor="grid-password"
                            >
                              Child's Last Name
                            </label>
                            <input
                              type="text"
                              className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                              value={student.lastName}
                              onChange={(e) => handleStudentChange(index, e, "lastName")}
                              required
                            />
                          </div>
                        </div>
                        <div className="w-full lg:w-6/12 px-4">
                          <div className="relative w-full mb-3">
                            <label
                              className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                              htmlFor="grid-password"
                            >
                              Child's Age
                            </label>
                            <input
                              type="number"
                              className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                              value={student.age}
                              onChange={(e) => handleStudentChange(index, e, "age")}
                              required
                            />
                          </div>
                        </div>
                        <div className="w-full lg:w-6/12 px-4">
                          <div className="relative w-full mb-3">
                            <label
                              className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                              htmlFor="grid-password"
                            >
                              Child's IC Number
                            </label>
                            <input
                              type="text"
                              className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                              value={student.icNumber}
                              onChange={(e) => handleStudentChange(index, e, "icNumber")}
                              required
                            />
                          </div>
                        </div>
                        <div className="w-full lg:w-6/12 px-4">
                          <div className="relative w-full mb-3">
                            <label
                              className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                              htmlFor="grid-password"
                            >
                              Child's Contact Number
                            </label>
                            <input
                              type="text"
                              className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                              value={student.contactNumber}
                              onChange={(e) => handleStudentChange(index, e, "contactNumber")}
                              required
                            />
                          </div>
                        </div>
                        <div className="w-full lg:w-6/12 px-4">
                          <div className="relative w-full mb-3">
                            <label
                              className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                              htmlFor="grid-password"
                            >
                              Child's Education Level
                            </label>
                            <input
                              type="text"
                              className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                              value={student.educationLevel}
                              onChange={(e) => handleStudentChange(index, e, "educationLevel")}
                              required
                            />
                          </div>
                        </div>
                        <div className="w-full lg:w-12/12 px-4">
                          <div className="relative w-full mb-3">
                            <label
                              className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                              htmlFor="grid-password"
                            >
                              Registered Courses
                            </label>
                            <MultiSelect
                              options={courses}
                              value={selectedCourses[index]}
                              onChange={(selected) => handleCourseSelection(index, selected)}
                              labelledBy="Select"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={addStudentField}
                        className="bg-blue-500 text-white active:bg-blue-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150"
                      >
                        Add Another Student
                      </button>
                      {students.length > 1 && (
                        <button
                          type="button"
                          onClick={removeStudentField}
                          className="bg-red-500 text-white active:bg-red-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150"
                        >
                          Remove Last Student
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-center mt-6">
                  <button
                    className="w-6/12 bg-gray-800 hover:bg-gray-600 text-white active:bg-gray-600 text-sm font-bold uppercase px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Registering..." : "Register"}
                  </button>
                </div>
              </form>
              {error && <div className="flex justify-center"><div className="text-red-500 mt-2">{error}</div></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardAddUser;
