import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate, useParams } from "react-router-dom";
import CardLoading from "../CardLoading";
import { db } from "../../../config/firebase";
import Swal from "sweetalert2";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  addDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";

function CardNewTestResult({ color }) {
  const [testName, setTestName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [maxScore, setMaxscore] = useState(100); // You can set the maximum score here
  const [studentMarks, setStudentMarks] = useState([]);
  const { id } = useParams();
  const [studentData, setStudentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const studentQuery = query(
          collection(db, "students"),
          where("registeredCourses", "array-contains", id)
        );
        const studentSnapshot = await getDocs(studentQuery);
        const students = studentSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const defaultStudentMarks = students.map(() => ({
          score: "0",
          comment: "",
        })); // Default values
        setStudentMarks(defaultStudentMarks);
        setStudentData(students);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    fetchStudents();
  }, [id]);

  const addTestResult = async () => {
    try {
      const isConfirmed = await Swal.fire({
        title: "Confirm",
        text: "Are you sure you want to add this test result?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No",
      });

      if (isConfirmed.isConfirmed) {
        // Add test result logic
        const testDocRef = await addDoc(collection(db, "test"), {
          classID: id,
          createdAt: serverTimestamp(),
          TestDate: date,
          maxScore: maxScore,
          testName: testName,
        });
        const testId = testDocRef.id;
        console.log("Test ID", testId);
        studentData.forEach(async (student, index) => {
          const studentDocRef = doc(db, "test", testId, "scores", student.id);
          await setDoc(studentDocRef, {
            score: studentMarks[index].score,
            comment: studentMarks[index].comment,
          });
        });

        // Show success message
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Test result added successfully!",
        });
      }
    } catch (error) {
      console.error("Error adding test:", error);
      // Show error message
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while adding the test result.",
      });
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
    navigate("/teacher/classes/grade/" + id );
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
    <div
      className={
        "relative flex flex-col min-w-0 break-words w-full p-4 py-6 shadow-lg rounded " +
        (color === "light" ? "bg-white" : "bg-lightBlue-900 text-white")
      }
    >
      <div className="flex items-center mb-4 font-bold text-xl">
        <Link to="/teacher/classes" className="text-blue-500 hover:underline">Classes</Link>
        <span className="mx-2">&nbsp;/&nbsp;</span>
        <Link to={`/teacher/classes/grade/${id}`} className="text-blue-500 hover:underline">Class's Grade</Link>
        <span className="mx-2">&nbsp;/&nbsp;</span>
        <span className="text-gray-500">Add New Grade</span>
      </div>
      <div className="mx-8 mt-4 mb-2 flex">
        <div className="mb-4 flex-auto">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="testName"
          >
            Test Name:
          </label>
          <input
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-indigo-500"
            id="testName"
            type="text"
            placeholder="Test Name"
            value={testName}
            // size="10"
            required
            onChange={(e) => setTestName(e.target.value)}
          />
        </div>

        <div className="mb-4 flex-auto">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="date"
          >
            Max Score
          </label>
          <input
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-indigo-500"
            id="maxscore"
            type="number"
            value={maxScore}
            // size="75"
            required
            onChange={(e) => setMaxscore(e.target.value)}
          />
        </div>

        <div className="mb-4 flex-auto">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="date"
          >
            Date:
          </label>
          <input
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-indigo-500"
            id="date"
            type="date"
            value={date}
            // size="75"
            required
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>
      {loading ? (
        <CardLoading />
      ) : (
        <div className="block w-full overflow-x-auto">
          <table className="w-full bg-transparent border-collapse">
            <thead>
              <tr>
                <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                  No
                </th>
                <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                  Student Name
                </th>
                <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                  Score
                </th>
                <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                  Mark
                </th>
                <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                  Grade
                </th>
                <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                  Comment
                </th>
              </tr>
            </thead>
            <tbody>
              {studentData.map((student, index) => (
                <tr key={index}>
                  <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                    {index + 1}
                  </td>
                  <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                    {student.firstName} {student.lastName}
                  </td>
                  <td className="w-1/6 border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-indigo-500 mr-4"
                      value={studentMarks[index].score}
                      onChange={(e) => handleInputChange(e, index, "score")}
                    />
                  </td>
                  <td className="w-1/6 border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                    {studentMarks[index].score
                      ? `${(
                          (Number(studentMarks[index].score) /
                            Number(maxScore)) *
                          100
                        ).toFixed(0)}%`
                      : ""}
                  </td>
                  <td className="w-1/6 border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                    {calculateGrade(
                      (Number(studentMarks[index].score) / Number(maxScore)) *
                        100
                    )}
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
      )}
      <div className="flex items-center justify-center m-4">
        <button
          className="rounded-full bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 focus:outline-none focus:shadow-outline"
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

CardNewTestResult.defaultProps = {
  color: "light",
};

CardNewTestResult.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardNewTestResult;
