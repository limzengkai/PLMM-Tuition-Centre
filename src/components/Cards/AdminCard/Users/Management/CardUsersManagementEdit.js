import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import CardLoading from "../../../CardLoading";
import { db } from "../../../../../config/firebase";
import { arrayRemove, arrayUnion } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import { MultiSelect } from "react-multi-select-component";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  getStates,
  getCities,
  getPostcodes,
} from "@ringgitplus/malaysia-states";

function CardUserManagementEdit() {
  const { id } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [initialSelectedCourses, setInitialSelectedCourses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [deletedStudents, setDeletedStudents] = useState([]);
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const userDocRef = doc(db, "users", id);
        const userDocSnapshot = await getDoc(userDocRef);
        if (userDocSnapshot.exists()) {
          const userData = userDocSnapshot.data();
          setUserData(userData);
          setState(userData.state);
          setCity(userData.city);
          setPostcode(userData.postcode);

          if (userData.role === "parent") {
            const studentDataQuery = query(
              collection(db, "students"),
              where("parentId", "==", id)
            );
            const studentDataQuerySnapshot = await getDocs(studentDataQuery);

            const coursesQuery = query(collection(db, "class"));
            const coursesSnapshot = await getDocs(coursesQuery);
            const coursesData = coursesSnapshot.docs.map((doc) => ({
              label: `${doc.data().academicLevel}_${doc.data().CourseName}`,
              value: doc.id,
            }));
            setCourses(coursesData);

            const students = [];
            const selectedCourses = [];

            studentDataQuerySnapshot.forEach((doc) => {
              const student = doc.data();
              students.push({ id: doc.id, ...student });
              const courses = student.registeredCourses.map((courseId) => {
                const courseData = coursesData.find(
                  (course) => course.value === courseId
                );
                return { label: courseData.label, value: courseData.value };
              });
              selectedCourses.push(courses);
            });

            setStudentData(students);
            setInitialSelectedCourses(selectedCourses);
            setSelectedCourses(selectedCourses);
          }
        } else {
          console.log("User not found");
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleStudentInputChange = (index, key, value) => {
    const newStudentData = [...studentData];
    newStudentData[index] = {
      ...newStudentData[index],
      [key]: value,
    };
    setStudentData(newStudentData);
  };

  const handleRemoveStudent = (index, studentId) => {
    setDeletedStudents([...deletedStudents, studentId]);
    const updatedStudentData = [...studentData];
    updatedStudentData.splice(index, 1);
    setStudentData(updatedStudentData);
  };

  const handleAddStudent = () => {
    const newStudent = {
      firstName: "",
      lastName: "",
      age: "",
      icNumber: "",
      educationLevel: "",
      contactNumber: "",
      parentId: id,
      registeredCourses: [],
    };
    setSelectedCourses([...selectedCourses, []]);
    setStudentData([...studentData, newStudent]);
  };

  const handleCourseSelection = (index, selectedOptions) => {
    const updatedSelectedCourses = [...selectedCourses];
    updatedSelectedCourses[index] = selectedOptions;
    setSelectedCourses(updatedSelectedCourses);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (userData) {
        await updateDoc(doc(db, "users", id), userData);
      }

      if (studentData) {
        const newStudentsID = [];
        await Promise.all(
          studentData.map(async (student, index) => {
            const studentDocRef = doc(
              db,
              "students",
              student.id || `student_${id}_${index}`
            );
            newStudentsID.push(studentDocRef.id);

            await setDoc(studentDocRef, {
              ...student,
              registeredCourses: selectedCourses[index].map(
                (course) => course.value
              ),
            });

            const currentSelectedCourses = selectedCourses[index].map(
              (course) => course.value
            );
            const initialSelectedCoursesValues =
              initialSelectedCourses[index]?.map((course) => course.value) ||
              [];

            const coursesToAdd = currentSelectedCourses.filter(
              (course) => !initialSelectedCoursesValues.includes(course)
            );
            const coursesToRemove = initialSelectedCoursesValues.filter(
              (course) => !currentSelectedCourses.includes(course)
            );

            await Promise.all(
              coursesToAdd.map(async (courseId) => {
                const classDocRef = doc(db, "class", courseId);
                await updateDoc(classDocRef, {
                  studentID: arrayUnion(studentDocRef.id),
                });
              })
            );

            await Promise.all(
              coursesToRemove.map(async (courseId) => {
                const classDocRef = doc(db, "class", courseId);
                await updateDoc(classDocRef, {
                  studentID: arrayRemove(studentDocRef.id),
                });
              })
            );
          })
        );

        await setDoc(doc(db, "parent", id), {
          children: newStudentsID,
        });

        await Promise.all(
          deletedStudents.map(async (studentId) => {
            await deleteDoc(doc(db, "students", studentId));
          })
        );
      }

      toast.success("User updated successfully!");
    } catch (error) {
      console.error("Error updating user: ", error);
      toast.error("Error updating user. Please try again.");
    }
  };

  const states = getStates();

  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    setState(selectedState);
    setCity("");
    setPostcode("");
  };

  const handleCityChange = (e) => {
    const selectedCity = e.target.value;
    setCity(selectedCity);
    setPostcode("");
  };

  const cities = state ? getCities(state) : [];
  const postcodes = city ? getPostcodes(state, city) : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer />
      <div className="flex items-center mb-4 font-bold text-xl">
        <Link to="/admin/users" className="text-blue-500 hover:underline">
          User Management
        </Link>
        <span className="mx-2">&nbsp;/&nbsp;</span>
        <span className="text-gray-500">Edit</span>
      </div>

      {loading ? (
        <CardLoading />
      ) : userData ? (
        <form onSubmit={handleSubmit}>
          <span className="text-xl font-bold ">
            {userData.role === "parent"
              ? "Parent"
              : userData.role === "teacher"
              ? "Teacher"
              : "Admin"}{" "}
            Information
          </span>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm" htmlFor="firstName">
                First Name:
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={userData.firstName}
                onChange={handleInputChange}
                className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm" htmlFor="lastName">
                Last Name:
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={userData.lastName}
                onChange={handleInputChange}
                className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm" htmlFor="contactNumber">
                Contact Number:
              </label>
              <input
                type="text"
                id="contactNumber"
                name="contactNumber"
                value={userData.contactNumber}
                onChange={handleInputChange}
                className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm" htmlFor="email">
                Email:
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={userData.email}
                onChange={handleInputChange}
                className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm" htmlFor="state">
                State:
              </label>
              <select
                id="state"
                name="state"
                value={userData.state || state}
                onChange={(e) => {
                  handleInputChange(e);
                  handleStateChange(e);
                }}
                className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
              >
                <option value="">Select State</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm" htmlFor="city">
                City:
              </label>
              <select
                id="city"
                name="city"
                value={userData.city || city}
                onChange={(e) => {
                  handleInputChange(e);
                  handleCityChange(e);
                }}
                className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
              >
                <option value="">Select City</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm" htmlFor="postcode">
                Postcode:
              </label>
              <select
                id="postcode"
                name="postcode"
                value={userData.postcode || postcode}
                onChange={handleInputChange}
                className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
              >
                <option value="">Select Postcode</option>
                {postcodes.map((postcode) => (
                  <option key={postcode} value={postcode}>
                    {postcode}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {userData.role === "parent" && (
            <>
              <span className="text-xl font-bold mt-4 block">
                Children Information
              </span>
              {studentData.map((student, index) => (
                <div
                  key={index}
                  className="border border-gray-300 p-4 rounded mt-4"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold mb-2">
                      Child {index + 1}
                    </h2>
                    <button
                      type="button"
                      onClick={() => handleRemoveStudent(index, student.id)}
                      className="bg-red-500 text-white py-1 px-3 rounded"
                    >
                      Remove Child
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label
                        className="text-sm"
                        htmlFor={`child-${index}-firstName`}
                      >
                        First Name:
                      </label>
                      <input
                        type="text"
                        id={`child-${index}-firstName`}
                        name="firstName"
                        value={student.firstName}
                        onChange={(e) =>
                          handleStudentInputChange(
                            index,
                            "firstName",
                            e.target.value
                          )
                        }
                        className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label
                        className="text-sm"
                        htmlFor={`child-${index}-lastName`}
                      >
                        Last Name:
                      </label>
                      <input
                        type="text"
                        id={`child-${index}-lastName`}
                        name="lastName"
                        value={student.lastName}
                        onChange={(e) =>
                          handleStudentInputChange(
                            index,
                            "lastName",
                            e.target.value
                          )
                        }
                        className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm" htmlFor={`child-${index}-age`}>
                        Age:
                      </label>
                      <input
                        type="number"
                        id={`child-${index}-age`}
                        name="age"
                        value={student.age}
                        onChange={(e) =>
                          handleStudentInputChange(index, "age", e.target.value)
                        }
                        className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label
                        className="text-sm"
                        htmlFor={`child-${index}-icNumber`}
                      >
                        IC Number:
                      </label>
                      <input
                        type="text"
                        id={`child-${index}-icNumber`}
                        name="icNumber"
                        value={student.icNumber}
                        onChange={(e) =>
                          handleStudentInputChange(
                            index,
                            "icNumber",
                            e.target.value
                          )
                        }
                        className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      />
                    </div>
                    <div>
                      <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                        Education Level
                      </label>
                      <select
                        className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        id={`child-${index}-educationLevel`}
                        name="educationLevel"
                        value={student.educationLevel}
                        onChange={(e) =>
                          handleStudentInputChange(
                            index,
                            "educationLevel",
                            e.target.value
                          )
                        }
                        required
                      >
                        <option value="" disabled>
                          Select Education Level
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
                    <div className="flex flex-col">
                      <label
                        className="text-sm"
                        htmlFor={`child-${index}-contactNumber`}
                      >
                        Contact Number:
                      </label>
                      <input
                        type="text"
                        id={`child-${index}-contactNumber`}
                        name="contactNumber"
                        value={student.contactNumber}
                        onChange={(e) =>
                          handleStudentInputChange(
                            index,
                            "contactNumber",
                            e.target.value
                          )
                        }
                        className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      />
                    </div>
                    <div className="flex flex-col col-span-2">
                      <label className="text-sm">Registered Courses:</label>
                      <MultiSelect
                        options={courses}
                        value={selectedCourses[index]}
                        onChange={(selected) =>
                          handleCourseSelection(index, selected)
                        }
                        labelledBy={"Select"}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleAddStudent}
                  className="bg-green-500 text-white py-2 px-4 rounded"
                >
                  Add Child
                </button>
              </div>
            </>
          )}

          <div className="mt-4">
            <button
              type="submit"
              className="bg-blue-500 text-white py-2 px-4 rounded"
            >
              Update User
            </button>
          </div>
        </form>
      ) : (
        <p>User not found</p>
      )}
    </div>
  );
}

export default CardUserManagementEdit;
