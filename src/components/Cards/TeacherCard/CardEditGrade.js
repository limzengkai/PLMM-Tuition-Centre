import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Link, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { toast, ToastContainer } from "react-toastify";
import "sweetalert2/dist/sweetalert2.css";
import "react-toastify/dist/ReactToastify.css";
import CardPagination from "../CardPagination";
import CardLoading from "../CardLoading";
import { db } from "../../../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

function CardEditResult({ color }) {
  const [testName, setTestName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [maxScore, setMaxscore] = useState(100);
  const [studentMarks, setStudentMarks] = useState([]);
  const { id, testid } = useParams();
  const [studentData, setStudentData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const studentQuery = query(collection(db, "students"), where("registeredCourses", "array-contains", id));
        const studentSnapshot = await getDocs(studentQuery);
        const students = studentSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        const TestDetail = doc(db, "test", testid);
        const TestDetailSnapshot = await getDoc(TestDetail);
        const testDetailData = TestDetailSnapshot.data();
        setTestName(testDetailData.testName);
        setDate(testDetailData.TestDate);
        setMaxscore(testDetailData.maxScore);

        const defaultStudentMarks = await Promise.all(
          students.map(async (student) => {
            const testrecordRef = doc(db, "test", testid, "scores", student.id);
            const testrecordSnapshot = await getDoc(testrecordRef);
            const score = testrecordSnapshot.exists() ? testrecordSnapshot.data().score : 0;
            const comment = testrecordSnapshot.exists() ? testrecordSnapshot.data().comment : "";
            return {
              studentID: student.id,
              score: score,
              comment: comment,
            };
          })
        );

        setStudentMarks(defaultStudentMarks);
        setStudentData(students);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    fetchStudents();
  }, [id, testid]);

  const confirmSubmit = (e) => {
    e.preventDefault(); // Prevent the default form submission
    Swal.fire({
      title: "Are you sure?",
      text: "You are about to submit the test results",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Submit",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        handleSubmit(e); // Pass the event object to handleSubmit
      }
    });
  };

  const handleSuccess = () => {
    toast.success("Test updated successfully!", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const handleFailure = () => {
    toast.error("Error updating test. Please try again later.", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const addTestResult = async () => {
    try {
      const testDocRef = doc(db, "test", testid);
      await updateDoc(testDocRef, {
        classID: id,
        createdAt: serverTimestamp(),
        TestDate: date,
        maxScore: maxScore,
        testName: testName,
      });
      const testId = testDocRef.id;

      studentData.forEach(async (student, index) => {
        const studentDocRef = doc(db, "test", testId, "scores", student.id);
        await setDoc(studentDocRef, {
          score: studentMarks[index].score,
          comment: studentMarks[index].comment,
        });
      });

      handleSuccess();
    } catch (error) {
      console.error("Error adding test:", error);
      handleFailure();
    }
  };

  // Function to calculate grade based on mark
  const calculateGrade = (mark) => {
    if (mark >= 90) return "A+ (Excellent)";
    else if (mark >= 80) return "A (Excellent)";
    else if (mark >= 70) return "A- (Brilliant)";
    else if (mark >= 65) return "B+ (Highest Honours)";
    else if (mark >= 60) return "B (High Honours)";
    else if (mark >= 55) return "C+ (Top Honours)";
    else if (mark >= 50) return "C (Praiseworthy)";
    else if (mark >= 45) return "D (Upon Graduation)";
    else if (mark >= 40) return "E (Pass)";
    else return "G (Fail)";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addTestResult();
  };

  useEffect(() => {
    console.log("Student Marks", studentMarks);
  }, []);

  const handleInputChange = (e, index, field) => {
    const updatedStudentMarks = [...studentMarks];
    updatedStudentMarks[index][field] = e.target.value;
    setStudentMarks(updatedStudentMarks);
  };

  return (
    <div className={"relative mx-auto px-4 py-8 flex flex-col min-w-0 break-words w-full shadow-lg rounded " +
    (color === "light" ? "bg-white" : "bg-lightBlue-900 text-white")}>
    <div className="flex items-center mb-4 font-bold text-xl">
      <Link to="/teacher/classes" className="text-blue-500 hover:underline">Classes</Link>
      <span className="mx-2">&nbsp;/&nbsp;</span>
      <Link to={`/teacher/classes/grade/${id}`}  className="text-blue-500 hover:underline">Class's Grade</Link>
      <span className="mx-2">&nbsp;/&nbsp;</span>
      <span className="text-gray-500">Edit Grade</span>
    </div>
      {loading ? (
        <CardLoading />
      ) : (
        <>
          <div className="mx-8 mt-4 mb-2 flex">
            <div className="mb-4 flex-auto">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="testName">
                Test Name:
              </label>
              <input
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-indigo-500"
                id="testName"
                type="text"
                placeholder="Test Name"
                value={testName}
                required
                onChange={(e) => setTestName(e.target.value)}
              />
            </div>

            <div className="mb-4 flex-auto">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="maxscore">
                Max Score
              </label>
              <input
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-indigo-500"
                id="maxscore"
                type="number"
                value={maxScore}
                required
                onChange={(e) => setMaxscore(e.target.value)}
              />
            </div>

            <div className="mb-4 flex-auto">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
                Date:
              </label>
              <input
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-indigo-500"
                id="date"
                type="date"
                value={date}
                required
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="block w-full overflow-x-auto">
            <table className="w-full bg-transparent border-collapse">
              <thead>
                <tr>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">No</th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Student Name</th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Score</th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Mark</th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Grade</th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Comment</th>
                </tr>
              </thead>
              <tbody>
                {studentData.map((student, index) => (
                  <tr key={index}>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{index + 1}</td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{student.firstName} {student.lastName}</td>
                    <td className="w-1/6 border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-indigo-500 mr-4"
                        value={studentMarks[index].score}
                        onChange={(e) => handleInputChange(e, index, "score")}
                      />
                    </td>
                    <td className="w-1/6 border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {studentMarks[index].score ? `${((Number(studentMarks[index].score) / Number(maxScore)) * 100).toFixed(0)}%` : ""}
                    </td>
                    <td className="w-1/6 border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {calculateGrade((Number(studentMarks[index].score) / Number(maxScore)) * 100)}
                    </td>
                    <td className="w-1/2 border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-indigo-500 mr-4"
                        value={studentMarks[index].comment}
                        onChange={(e) => handleInputChange(e, index, "comment")}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <div className="flex items-center justify-center m-4">
        <button
          className="rounded-full bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 focus:outline-none focus:shadow-outline"
          onClick={(e) => confirmSubmit(e)}
        >
          Submit
        </button>
      </div>
      <ToastContainer />
    </div>
  );
}

CardEditResult.defaultProps = {
  color: "light",
};

CardEditResult.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardEditResult;
