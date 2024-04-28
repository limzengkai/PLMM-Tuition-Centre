import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { collection, query, where, getDocs, addDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../../../config/firebase";
import CardLoading from "../CardLoading";

function CardFeeByClasses() {
  const [loading, setLoading] = useState(true);
  const [isFetch, setIsFetch] = useState(false);
  const [isFeeGenerated, setIsFeeGenerated] = useState(false);
  const [fees, setFees] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();

  useEffect(() => {
    async function fetchData() {
      try {
        if (!isFetch) {
          const studentsSnapshot = await getDocs(collection(db, "students"));
          const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setStudents(students);

          const classesSnapshot = await getDocs(collection(db, "class"));
          const classes = classesSnapshot.docs.map(doc => ({id:doc.id, ...doc.data()}));
          setClasses(classes);

          const feesSnapshot = await getDocs(collection(db, "fees"));
          const fees = [];
          for (const feeDoc of feesSnapshot.docs) {
            const feeData = feeDoc.data();
            feeData.DueDate = feeData.DueDate.toDate();
            const feeSubcollectionSnapshot = await getDocs(collection(feeDoc.ref, "Classes"));
            const feeSubcollection = feeSubcollectionSnapshot.docs.map(subDoc => subDoc.data());
            feeData.Courses = feeSubcollection;
            fees.push(feeData);
          }

          const mergedFees = fees.map(fee => {
            const student = students.find(student => student.id === fee.StudentID);
            return { ...fee, student };
          });
          setFees(mergedFees);
          setIsFetch(true);
        }

        const isGenerated = await isFeeForNextMonthCreated();
        setIsFeeGenerated(isGenerated);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    }
    fetchData();
  }, [isFetch]);

  const isFeeForNextMonthCreated = async () => {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextMonthStart = new Date(currentDate.getFullYear(), nextMonth - 1, 1);

      for (const student of students) {
        if (student.registeredCourses.length > 0) {
          for (const courseId of student.registeredCourses) {
            const feeExists = fees.some(fee =>
              fee.DueDate.getMonth() + 1 === nextMonthStart.getMonth() + 1 &&
              fee.StudentID === student.id &&
              fee.Courses.some(course => course.ClassId === courseId)
            );

            if (!feeExists) { 
              return false;
            }
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error checking if fees for next month are created:", error);
      throw error;
    }
  };

  const generateFeesForNextMonth = async () => {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextMonthStart = new Date(currentDate.getFullYear(), nextMonth - 1, 1);
  
      for (const student of students) {
        if (student.registeredCourses.length > 0) {
          for (const courseId of student.registeredCourses) {
            const feeExists = fees.some(fee =>
              fee.DueDate.getMonth() + 1 === nextMonthStart.getMonth() + 1 &&
              fee.StudentID === student.id &&
              fee.CourseID === courseId
            );
            if (!feeExists) {
              await generateFeesForStudent(student.id, nextMonthStart);
            }
          }
        }
      }
      alert("Fees for next month generated successfully for all students.");
      setIsFeeGenerated(true);
    } catch (error) {
      console.error("Error generating fees for next month:", error);
      alert("An error occurred while generating fees for next month. Please try again.");
    }
  };

  const filteredClass = classes.filter(classItem => {
    return classItem.CourseName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const generateFeesForStudent = async (studentId, nextMonthStartTimestamp) => {
    try {
      const studentDocRef = doc(db, "students", studentId);
      const studentDocSnapshot = await getDoc(studentDocRef);
      if (!studentDocSnapshot.exists()) {
        throw new Error("Student not found.");
      }
      const studentData = studentDocSnapshot.data();

      const existingFeeQuery = query(collection(db, "fees"), 
        where("DueDate", "==", nextMonthStartTimestamp), 
        where("StudentID", "==", studentId)
      );
      const existingFeeSnapshot = await getDocs(existingFeeQuery);
      let newDocRef;

      if (existingFeeSnapshot.empty) {
        newDocRef = await addDoc(collection(db, "fees"), {
          DueDate: nextMonthStartTimestamp,
          StudentID: studentId,
          paidAmount: 0,
          paymentDate: null,
          paymentStatus: false,
          publish: false,
        });
      } else {
        newDocRef = existingFeeSnapshot.docs[0].ref;
      }

      for (const courseId of studentData.registeredCourses) {
        const existingCourseQuery = query(
          collection(newDocRef, "Classes"), 
          where("ClassId", "==", courseId)
        );
        const existingCourseSnapshot = await getDocs(existingCourseQuery);

        if (existingCourseSnapshot.empty) {
          const courseDocRef = doc(db, "class", courseId);
          const courseDocSnapshot = await getDoc(courseDocRef);

          if (courseDocSnapshot.exists()) {
            const courseData = courseDocSnapshot.data();
            const feeAmount = courseData.fee;

            const classesData = [
              {Description: `Fee for ${courseData.CourseName}`, FeeAmount: feeAmount}
            ]
            const descriptions = classesData.map(item => item.Description);
            const feeAmounts = classesData.map(item => Number(item.FeeAmount));
            const Quantity = [Number(1)]

            await addDoc(collection(newDocRef, "Classes"), {
              ClassId: courseId,
              Descriptions: descriptions,
              FeeAmounts: feeAmounts,
              Quantity: Quantity
            });
          } else {
            console.log(`Course with ID ${courseId} does not exist.`);
          }
        }
      }
    } catch (error) {
      console.error(`Error generating fees for student ${studentId}:`, error);
      throw error;
    }
  };

  return (
    <>
      {loading ? (
        <CardLoading loading={loading} />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-4 font-bold text-xl">
            <Link to="/admin/fee" className="text-blue-500 hover:underline">Fee Payment Management</Link>
            <span className="mx-2">&nbsp;/&nbsp;</span>
            <span className="text-gray-500">Class List</span>
          </div>
          <div className="flex items-center mb-4">
            <label htmlFor="search" className="text-sm font-medium text-gray-700 mr-2">
              Search by Name:
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 block w-64"
              placeholder="Enter Class Name"
            />
          </div>
          <div className="flex justify-between">
            <div className="flex mb-4">
              <Link
                to="/admin/fee"
                className={`rounded-l-lg font-bold py-2 px-4 ${
                  location.pathname === "/admin/fee"
                    ? "bg-blue-500 text-white hover:text-lightBlue-100"
                    : "text-black hover:text-white hover:bg-blue-500"
                }`}
              >
                Fee list
              </Link>
              <Link
                to="/admin/fee/classes"
                className={`font-bold py-2 px-4 ${
                  location.pathname === "/admin/fee/classes"
                    ? "bg-blue-500 text-white hover:text-lightBlue-100"
                    : "text-black hover:text-white hover:bg-blue-500"
                }`}
              >
                Class List
              </Link>
              <Link
                to="/admin/fee/history"
                className={`rounded-r-lg font-bold py-2 px-4 ${
                  location.pathname === "/admin/fee/x"
                    ? "bg-blue-500 text-white hover:text-lightBlue-100"
                    : "text-black hover:text-white hover:bg-blue-500"
                }`}
              >
                Payment History
              </Link>
            </div>

            <div>
              <Link
                to={`/admin/fee/classes/add`}
                className="mr-4 py-2 px-4 border border-transparent shadow-sm text-sm rounded-md font-bold text-black bg-yellow-400 hover:bg-yellow-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Fee By Class
              </Link>
              <button
                onClick={generateFeesForNextMonth}
                className={`py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md ${
                  isFeeGenerated ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
                disabled={isFeeGenerated}
              >
                Generate Next Month Fee
              </button>
            </div>
          </div>

          <div className="block w-full overflow-x-auto">
            <table className="w-full bg-transparent border-collapse">
              <thead>
                <tr>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Class Name</th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Academic Level</th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Registered Number</th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Class Fee</th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredClass.map((className, index) => (
                  <tr key={index}>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{className.CourseName}</td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{className.academicLevel}</td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {className.studentID && className.studentID.length} / {className.MaxRegisteredStudent}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">RM {className.fee}</td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      <Link to={`/admin/fee/classes/view/${className.id}`} 
                        className="mr-3 text-white rounded-full font-bold py-2 px-4 bg-blue-500 hover:bg-blue-600">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

export default CardFeeByClasses;