import React, { useState, useEffect } from "react";
import { useLocation, Link, useParams, useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  setDoc,
  addDoc,
} from "firebase/firestore";
import { db, functions } from "../../../../../config/firebase";
import CardLoading from "../../../CardLoading";
import Swal from "sweetalert2";
import { ToastContainer, toast } from "react-toastify";
import { httpsCallable } from "firebase/functions";
import generateUniqueVoucherCode from "./CardGenerateVoucherCode";

function CardUsersRegistrationView() {
  const [registration, setRegistration] = useState([]);
  const [course, setCourse] = useState([]);
  const [hasLiked, setHasLiked] = useState(false);
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
          setHasLiked(registrationData.hasLiked || false);
          setRegistration(registrationData);
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

  const calculateFee = (schedule) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const dayMapping = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    // Function to calculate the number of specific days in a month
    const countSpecificDaysInMonth = (year, month, day) => {
      let count = 0;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        if (date.getDay() === day) {
          count++;
        }
      }
      return count;
    };

    // Function to calculate remaining specific days in the month
    const countRemainingSpecificDaysInMonth = (
      year,
      month,
      day,
      currentDay
    ) => {
      let count = 0;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let i = currentDay; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        if (date.getDay() === day) {
          count++;
        }
      }
      return count;
    };

    let totalClasses = 0;
    let remainingClasses = 0;

    schedule.forEach((classSchedule) => {
      const dayOfWeek = dayMapping[classSchedule.day]; // Convert day name to day number
      totalClasses += countSpecificDaysInMonth(
        currentYear,
        currentMonth,
        dayOfWeek
      );
      remainingClasses += countRemainingSpecificDaysInMonth(
        currentYear,
        currentMonth,
        dayOfWeek,
        currentDate.getDate()
      );
    });

    return {
      totalClasses,
      remainingClasses,
    };
  };

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

  const getCourseName = (id) => {
    const foundCourse = course.find((c) => c.id === id);
    return foundCourse ? `${foundCourse.CourseName}` : "Course not found";
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
      try {
        const processRegistrationFunction = httpsCallable(
          functions,
          "processRegistration"
        );
        const result = await processRegistrationFunction({ registration }); // Call the Cloud Function directly without using .call()

        if (result.data.error) {
          // If an error is returned from the Cloud Function, display it
          throw new Error(result.data.error);
        }
        const user = result.data.userCredential; // Ensure user ID is obtained correctly
        // Save student information
        await saveStudentInformation(user);

        let voucherCode = "";
        if (hasLiked) {
          voucherCode = await generateUniqueVoucherCode(user);

          // Send Voucher Code to user via notification
          await addDoc(collection(db, "notifications"), {
            AddTime: new Date(),
            userId: user,
            isRead: false,
            message: `We are pleased to offer you the following voucher code: ${voucherCode.code} becuase of you like our facebook page. This voucher must be used before ${voucherCode.expiryDate}. `,
          });

          // Send Voucher Code to user via email
          await addDoc(collection(db, "mail"), {
            to: registration.email,
            message: {
              subject: "Voucher Code for Liking Facebook Page",
              html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                  <h2>Thank You for Liking Our Facebook Page!</h2>
                  <p>Dear ${registration.firstName},</p>
                  <p>Thank you for supporting us by liking our Facebook page. As a token of our appreciation, we are pleased to offer you the following voucher code:</p>
                  <p style="font-size: 20px; font-weight: bold; color: #2c3e50;">${voucherCode.code}</p>
                  <p>This voucher must be used before ${voucherCode.expiryDate} .Use this code at checkout to enjoy your discount.</p>
                  <p>If you have any questions, feel free to reach out to us.</p>
                  <br>
                  <p>Best Regards,</p>
                  <p>PLMM TUITION CENTRE</p>
                </div>
              `,
            },
          });
        }
        // Update registration status
        await updateDoc(doc(db, "registration", id), {
          status: false,
          result: true,
          rejectReason: null,
          hasLiked: hasLiked, // Include the hasLiked state
        });

        // Create initial payment for each student
        for (const student of registration.student) {
          const paymentData = {
            DiscountID: null,
            DueDate: new Date(new Date().setDate(new Date().getDate() + 10)),
            StudentID: `student_${user}_${registration.student.indexOf(
              student
            )}`,
            isDiscount: false,
            paidAmount: 0,
            paymentDate: null,
            paymentStatus: false,
            publish: true,
          };

          const paymentRef = await addDoc(collection(db, "fees"), paymentData);

          // Add payment for each course in Classes collection
          for (const course of student.registeredCourses) {
            const classDocRef = doc(db, "class", course);
            const classDoc = await getDoc(classDocRef);

            if (classDoc.exists()) {
              const classFee = classDoc.data().fee;
              const scheduleQuery = query(
                collection(db, "class", course, "Schedule")
              );
              const scheduleDocs = await getDocs(scheduleQuery);
              const schedules = scheduleDocs.docs.map((doc) => doc.data());

              for (const schedule of schedules) {
                const { totalClasses, remainingClasses } = calculateFee([
                  schedule,
                ]);
                const feePerClass = classFee / totalClasses;
                const totalFee = feePerClass * remainingClasses;

                await addDoc(collection(paymentRef, "Classes"), {
                  ClassId: course,
                  Descriptions: [
                    `Fee for ${remainingClasses} classes left for ${getCourseName(
                      course
                    )}`,
                  ],
                  FeeAmounts: [totalFee],
                  Quantity: [1],
                });
              }
            } else {
              console.error(`Class document not found for course: ${course}`);
            }
          }

          // Add notification to the course teacher
          for (const course of student.registeredCourses) {
            const classDocRef = doc(db, "class", course);
            const classDoc = await getDoc(classDocRef);

            if (classDoc.exists()) {
              const classData = classDoc.data();
              const teacherId = classData.teacher;
              const teacherDocRef = doc(db, "teacher", teacherId);
              const teacherDoc = await getDoc(teacherDocRef);

              if (teacherDoc.exists()) {
                const teacherUserId = teacherDoc.data().userID;
                await addDoc(collection(db, "notifications"), {
                  AddTime: new Date(),
                  userId: teacherUserId,
                  isRead: false,
                  message: `A new student named ${student.firstName + " " +student.lastName} has registered for ${getCourseName(
                    course
                  )}.`,
                });
              } else {
                console.error(`Teacher document not found for course: ${course}`);
              }
            } else {
              console.error(`Class document not found for course: ${course}`);
            }
          }

          // Add registration fee to payment
          await addDoc(collection(paymentRef, "Classes"), {
            ClassId: null,
            Descriptions: [
              `Registration Fee for ${student.firstName} ${student.lastName}`,
            ],
            FeeAmounts: [30],
            Quantity: [1],
          });
        }

        Swal.fire({
          icon: "success",
          title: "Success",
          text: "The user is registered successfully. The default password has been sent to the user's email.",
        }).then((result) => {
          if (result.isConfirmed) {
            navigate("/admin/users/registration");
          }
        });

        setLoading(false);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message,
        });
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
            const updatedStudentIds = classData.studentID
              ? [...classData.studentID, studentDocId]
              : [studentDocId];
            await updateDoc(classDocRef, { studentID: updatedStudentIds });
            toast.success(
              `Student ID updated successfully in class collection for course: ${courseId}`
            );
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
    const { value: rejectReason, isConfirmed } = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, reject it!",
      cancelButtonText: "Cancel",
      input: "text", // Add input field for reason
      inputPlaceholder: "Enter reason for rejection", // Placeholder for the input field
      inputValidator: (value) => {
        if (!value) {
          return "You need to enter a reason for rejection"; // Validate that reason is entered
        }
      },
    });

    // If the user confirms the rejection and entered a reason
    if (isConfirmed && rejectReason) {
      try {
        await updateDoc(doc(db, "registration", id), {
          status: false,
          result: false,
          rejectReason: rejectReason, // Save rejection reason in database
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

              {/* Display uploaded screenshot or "No image found" */}
              {registration.fileUrl ? (
                <>
                  <div className="flex flex-col col-span-2 items-center mb-2">
                    <div className="font-bold mb-2">Uploaded Screenshot:</div>
                    <img
                      src={registration.fileUrl}
                      alt="Uploaded Screenshot"
                      className="w-128 h-128 object-contain"
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center col-span-2 mb-2">
                  <div className="font-bold mb-2">Uploaded Screenshot:</div>
                  <div>No image found</div>
                </div>
              )}

              {/* Checkbox for admin to mark if the user has liked the page */}
              {registration.fileUrl ? (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-bold">
                      FB Username: {registration.fbUsername || "N/A"}
                    </div>
                  </div>
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="hasLiked"
                      className="mr-2"
                      checked={hasLiked}
                      onChange={(e) => setHasLiked(e.target.checked)}
                    />
                    <label htmlFor="hasLiked" className="font-bold">
                      User has liked the Facebook page
                    </label>
                  </div>
                </>
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

export default CardUsersRegistrationView;
