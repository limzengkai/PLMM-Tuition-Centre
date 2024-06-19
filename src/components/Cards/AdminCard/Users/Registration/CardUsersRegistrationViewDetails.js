import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { collection, doc, getDoc, getDocs, query } from "firebase/firestore";
import { db } from "../../../../../config/firebase";
import CardLoading from "../../../CardLoading";
import Swal from "sweetalert2";

function CardUsersRegistrationViewDetails() {
  const [registration, setRegistration] = useState([]);
  const [course, setCourse] = useState([]);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const registrationDocRef = doc(db, "registration", id);
        const registrationDocSnap = await getDoc(registrationDocRef);

        if (registrationDocSnap.exists()) {
          setRegistration(registrationDocSnap.data());
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No such document! Redirecting to registration page.",
          });
          navigate("/admin/users/registration");
        }

        const courseQuery = query(collection(db, "class"));
        const courseDocs = await getDocs(courseQuery);
        const courses = courseDocs.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch Schedule Subcollection for each course
        for (const course of courses) {
          const scheduleQuery = query(
            collection(db, "class", course.id, "Schedule")
          );
          const scheduleDocs = await getDocs(scheduleQuery);
          const schedules = scheduleDocs.docs.map((doc) => ({
            ...doc.data(),
          }));
          course.schedule = schedules;
        }

        setCourse(courses);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error.message);
      }
    };

    fetchData();
  }, [id]);

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
            <span className="text-gray-500">View Details</span>
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
              >
                Registration
              </Link>
            </div>
          </div>

          <div className="block w-full overflow-x-auto">
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

              {/* Display uploaded screenshot or "No image found" */}
              {registration.fileUrl ? (
                <>
                  <div className="flex flex-col items-center mb-2">
                    <div className="font-bold mb-2">Uploaded Screenshot:</div>
                    <img
                      src={registration.fileUrl}
                      alt="Uploaded Screenshot"
                      className="w-64 h-64 object-contain"
                    />
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-bold">
                      FB Username: {registration.fbUsername || "N/A"}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center col-span-2 mb-2">
                  <div className="font-bold mb-2">Uploaded Screenshot:</div>
                  <div>No image found</div>
                </div>
              )}

              {/* Display whether the user has liked the Facebook page */}
              {registration.fileUrl ? (
                <div className="flex items-center col-span-2 mb-2">
                  <div className="font-bold mr-2">
                    User has liked the Facebook page:
                  </div>
                  <input
                    type="checkbox"
                    id="hasLiked"
                    className="mr-2"
                    checked={registration.hasLiked || false}
                    readOnly
                  />
                </div>
              ) : null}

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
          </div>
        </div>
      )}
    </>
  );
}

export default CardUsersRegistrationViewDetails;
