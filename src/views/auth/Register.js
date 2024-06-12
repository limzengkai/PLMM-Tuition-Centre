import React, { useState, useEffect } from "react";
import { db } from "../../config/firebase";
import { collection, addDoc, query, getDocs } from "firebase/firestore";
import IndexNavbar from "../../components/Navbars/IndexNavbar";
import DatePicker from "react-datepicker";
import Swal from "sweetalert2";
import { MultiSelect } from "react-multi-select-component";
import Footer from "../../components/Footers/Footer";
import {
  getStates,
  getCities,
  getPostcodes,
} from "@ringgitplus/malaysia-states";
import ReCAPTCHA from "react-google-recaptcha";

const RECAPTCHA_SITE_KEY = process.env.REACT_APP_GOOGLE_RECAPTCHA_SITE_KEY;

function Registration() {
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
  const [birthDate, setBirthDate] = useState(
    () => new Date(new Date().setFullYear(new Date().getFullYear() - 18))
  );

  const [students, setStudents] = useState([
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
  ]);
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([[]]);
  const [recaptchaToken, setRecaptchaToken] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesQuery = query(collection(db, "class"));
        const coursesSnapshot = await getDocs(coursesQuery);
        const coursesData = coursesSnapshot.docs.map((doc) => ({
          label: `${doc.data().academicLevel}_${doc.data().CourseName}`,
          value: doc.id,
        }));
        setCourses(coursesData);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: `Error fetching courses: ${error.message}. Please try again later.`,
        });
      }
    };
    fetchCourses();
  }, []);

  const handleRegister = async () => {
    // Show confirmation dialog
    const confirmResult = await Swal.fire({
      icon: "warning",
      title: "Confirm Registration",
      text: "Are you sure you want to register?",
      showCancelButton: true,
      confirmButtonText: "Yes, register",
      cancelButtonText: "No, cancel",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    });

    // Proceed with registration if the user confirms
    if (confirmResult.isConfirmed) {
      setLoading(true);
      setError("");

      if (!recaptchaToken) {
        setError("Please complete the reCAPTCHA");
        setLoading(false);
        return;
      }

      try {
        UpdatedStudentInformation();

        await addDoc(collection(db, "registration"), {
          status: true,
          email,
          firstName,
          lastName,
          contactNumber,
          address,
          postcode,
          city,
          state,
          birthDate,
          result: null,
          role: "parent",
          registrationDate: new Date(),
          student: students.map((student, index) => ({
            ...student,
            registeredCourses: selectedCourses[index].map(
              (course) => course.value
            ),
          })),
        });

        Swal.fire({
          icon: "success",
          title: "Success",
          text: "The user is registered successfully. The default password has been sent to your email after approval by Admin.",
        });
      } catch (error) {
        setError(error.message);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: `Error registering user: ${error.message}`,
        });
      }

      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    Swal.fire({
      title: "Confirm Registration",
      text: "Are you sure you want to submit the registration form?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, submit",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        handleRegister();
      }
    });
  };

  const UpdatedStudentInformation = () => {
    const updatedStudents = students.map((student, index) => {
      const courseIds = selectedCourses[index].map((course) => course.value);
      return {
        ...student,
        registeredCourses: courseIds,
      };
    });
    setStudents(updatedStudents);
  };

  const addStudentField = () => {
    setStudents([
      ...students,
      {
        firstName: "",
        lastName: "",
        age: "",
        icNumber: "",
        contactNumber: "",
        educationLevel: "",
        registeredCourses: [],
        parentId: "",
      },
    ]);
    setSelectedCourses([...selectedCourses, []]);
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

  const filterCoursesByEducationLevel = (educationLevel) => {
    return courses.filter((course) => course.label.startsWith(educationLevel));
  };

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

  const states = getStates();
  const cities = state ? getCities(state) : [];
  const postcodes = city ? getPostcodes(state, city) : [];

  const onChangeRecaptcha = (value) => {
    setRecaptchaToken(value);
  };

  const validateContactNumber = (number) => {
    const contactNumberPattern = /^\d{3}-\d{7,8}$/;
    return contactNumberPattern.test(number);
  };

  const validateIcNumber = (icNumber) => {
    const icNumberPattern = /^\d{6}-\d{2}-\d{4}$/;
    return icNumberPattern.test(icNumber);
  };

  return (
    <>
      <IndexNavbar fixed />
      <div className="mt-20 min-h-screen flex justify-center items-center bg-gray-100">
        <section className="w-full max-w-5xl">
          <div className="w-full lg:w-10/12 px4 mx-auto">
            <div className="relative flex flex-col break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-200 border-0">
              <div className="rounded-t mb-0 px-6 py-6">
                <div className="text-center mb-3">
                  <h6 className="text-blueGray-500 text-sm font-bold">
                    Registration Form
                  </h6>
                </div>
                <hr className="mt-6 border-b-1 border-blueGray-300" />
              </div>
              <div className="md:px-10 py-10 px-2 pt-0">
                <form onSubmit={handleFormSubmit}>
                  <div className="grid md:grid-cols-2 gap-4 sm:grid-cols-1">
                    <div className="relative mb-3">
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
                        placeholder="The Password will be sent to your email after registration approved by admin"
                        minLength={6}
                        required
                      />
                      <small className="text-red-500">
                        Note: Your Default password will be sent to your email
                        after registration approved by admin
                      </small>
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
                        className={`border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150 ${
                          !validateContactNumber(contactNumber) &&
                          contactNumber !== ""
                            ? "border-red-500"
                            : ""
                        }`}
                        placeholder="xxx-xxxxxxx or xxx-xxxxxxxx"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        required
                      />
                      {!validateContactNumber(contactNumber) &&
                        contactNumber !== "" && (
                          <small className="text-red-500">
                            Invalid contact number format.
                          </small>
                        )}
                    </div>

                    <div className="relative mb-3">
                      <label
                        className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                        htmlFor="birthDate"
                      >
                        Birth Date
                      </label>
                      <DatePicker
                        selected={birthDate}
                        onChange={(date) => setBirthDate(date)}
                        dateFormat="dd/MM/yyyy"
                        showYearDropdown
                        className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        required
                      />
                    </div>

                    <div className="relative mb-3">
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

                    <div className="relative mb-3">
                      <label
                        className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                        htmlFor="state"
                      >
                        State
                      </label>
                      <select
                        id="state"
                        className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        value={state}
                        onChange={handleStateChange}
                        required
                      >
                        <option value="">Select State</option>
                        {states.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="relative mb-3">
                      <label
                        className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                        htmlFor="city"
                      >
                        City
                      </label>
                      <select
                        id="city"
                        className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        value={city}
                        onChange={handleCityChange}
                        required
                        disabled={!state}
                      >
                        <option value="">Select City</option>
                        {cities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="relative mb-3">
                      <label
                        className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                        htmlFor="postcode"
                      >
                        Postcode
                      </label>
                      <select
                        id="postcode"
                        className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        value={postcode}
                        onChange={(e) => setPostcode(e.target.value)}
                        required
                        disabled={!city}
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

                  <h6 className="text-blueGray-500 text-sm mt-3 mb-6 font-bold uppercase">
                    Students
                  </h6>

                  {students.map((student, index) => (
                    <div
                      key={index}
                      className="border-b border-blueGray-300 mb-6 pb-4"
                    >
                      <div className="grid md:grid-cols-2 gap-4 sm:grid-cols-1">
                        <div className="relative mb-3">
                          <label
                            className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                            htmlFor={`studentFirstName-${index}`}
                          >
                            Student's First Name
                          </label>
                          <input
                            type="text"
                            id={`studentFirstName-${index}`}
                            className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                            placeholder="First Name"
                            value={student.firstName}
                            onChange={(e) =>
                              handleStudentChange(index, e, "firstName")
                            }
                            required
                          />
                        </div>

                        <div className="relative mb-3">
                          <label
                            className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                            htmlFor={`studentLastName-${index}`}
                          >
                            Student's Last Name
                          </label>
                          <input
                            type="text"
                            id={`studentLastName-${index}`}
                            className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                            placeholder="Last Name"
                            value={student.lastName}
                            onChange={(e) =>
                              handleStudentChange(index, e, "lastName")
                            }
                            required
                          />
                        </div>

                        <div className="relative mb-3">
                          <label
                            className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                            htmlFor={`studentAge-${index}`}
                          >
                            Age
                          </label>
                          <input
                            type="number"
                            id={`studentAge-${index}`}
                            className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                            placeholder="Age"
                            value={student.age}
                            onChange={(e) =>
                              handleStudentChange(index, e, "age")
                            }
                            required
                          />
                        </div>

                        <div className="relative mb-3">
                          <label
                            className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                            htmlFor={`studentIcNumber-${index}`}
                          >
                            IC Number
                          </label>
                          <input
                            type="text"
                            id={`studentIcNumber-${index}`}
                            className={`border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150 ${
                              !validateIcNumber(student.icNumber) &&
                              student.icNumber !== ""
                                ? "border-red-500"
                                : ""
                            }`}
                            placeholder="xxxxxx-xx-xxxx"
                            value={student.icNumber}
                            onChange={(e) =>
                              handleStudentChange(index, e, "icNumber")
                            }
                            required
                          />
                          {!validateIcNumber(student.icNumber) &&
                            student.icNumber !== "" && (
                              <small className="text-red-500">
                                Invalid IC number format.
                              </small>
                            )}
                        </div>

                        <div className="relative mb-3">
                          <label
                            className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                            htmlFor={`studentContactNumber-${index}`}
                          >
                            Contact Number
                          </label>
                          <input
                            type="text"
                            id={`studentContactNumber-${index}`}
                            className={`border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150 ${
                              !validateContactNumber(student.contactNumber) &&
                              student.contactNumber !== ""
                                ? "border-red-500"
                                : ""
                            }`}
                            placeholder="xxx-xxxxxxx or xxx-xxxxxxxx"
                            value={student.contactNumber}
                            onChange={(e) =>
                              handleStudentChange(index, e, "contactNumber")
                            }
                            required
                          />
                          {!validateContactNumber(student.contactNumber) &&
                            student.contactNumber !== "" && (
                              <small className="text-red-500">
                                Invalid contact number format.
                              </small>
                            )}
                        </div>

                        <div>
                          <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                            Education Level
                          </label>
                          <select
                            className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                            value={student.educationLevel}
                            onChange={(e) =>
                              handleStudentChange(index, e, "educationLevel")
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

                        <div className="relative mb-3">
                          <label
                            className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                            htmlFor={`registeredCourses-${index}`}
                          >
                            Registered Courses
                          </label>
                          <MultiSelect
                            options={filterCoursesByEducationLevel(
                              student.educationLevel
                            )}
                            value={selectedCourses[index]}
                            onChange={(selected) =>
                              handleCourseSelection(index, selected)
                            }
                            labelledBy={"Select Courses"}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="relative mb-3">
                    <ReCAPTCHA
                      sitekey={RECAPTCHA_SITE_KEY}
                      onChange={onChangeRecaptcha}
                    />
                  </div>

                  <div className="flex justify-between items-center mb-6">
                    <button
                      type="button"
                      onClick={addStudentField}
                      className="bg-blue-500 text-white active:bg-blue-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                    >
                      Add Student
                    </button>
                    {students.length > 1 && (
                      <button
                        type="button"
                        onClick={removeStudentField}
                        className="bg-red-500 text-white active:bg-red-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                      >
                        Remove Student
                      </button>
                    )}
                  </div>

                  {error && (
                    <p className="text-red-500 text-center mb-3">{error}</p>
                  )}

                  <div className="text-center mt-6">
                    <button
                      type="submit"
                      className="bg-blue-500 text-white active:bg-blue-600 text-sm font-bold uppercase px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150"
                      disabled={loading}
                    >
                      {loading ? "Registering..." : "Register"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}

export default Registration;
