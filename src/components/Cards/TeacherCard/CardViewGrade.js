import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link, useParams } from "react-router-dom";
import CardPagination from "../CardPagination";
import { db } from "../../../config/firebase";
import {  collection, getDocs,getDoc,doc } from "firebase/firestore";
import CardLoading from "../CardLoading";
import Swal from 'sweetalert2';

function CardViewGrade({ color }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [testMarks, setTestMarks] = useState([]);
  const [students, setStudents] = useState([]); // Rename state variable to 'students'
  const [testData, setTestData] = useState([]);
  const testsPerPage = 5;
  const { id, testid } = useParams();

  useEffect(() => {
    const fetchTestMarks = async () => {
      try {
        const testMarksCollectionRef = doc(db, "test", testid);
        const testMarksSnapshot = await getDoc(testMarksCollectionRef);
        if (testMarksSnapshot.exists()) {
          const testMarks = { 
            id: testMarksSnapshot.id, 
            ...testMarksSnapshot.data() 
          };
          setTestMarks(testMarks);
          console.log("Test Marks", testMarks);
          setLoading(false);
        } else {
          console.error("Test marks not found.");
          setLoading(false);
        }
  
        const testrecordRef = collection(db, "test", testid, "scores");
        const testrecordSnapshot = await getDocs(testrecordRef);
        if (!testrecordSnapshot.empty) {
          const testrecordData = testrecordSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setTestData(testrecordData);
          console.log("Test Record Data", testrecordData);
        } else {
          console.error("Test record not found.");
        }

        const studentRef = collection(db, "students");
        const studentSnapshot = await getDocs(studentRef);
        const studentData = studentSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setStudents(studentData);
        console.log("Student Data", studentData);
      } catch (error) {
        console.error("Error fetching test marks:", error);
      }
    };
    fetchTestMarks();
  }, [id, testid]);

  // Calculate indexes for pagination
  const indexOfLastTest = currentPage * testsPerPage;
  const indexOfFirstTest = indexOfLastTest - testsPerPage;
  const currentTests = testData.slice(indexOfFirstTest, indexOfLastTest);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Calculate total number of pages
  const totalPages = Math.ceil(testData.length / testsPerPage);

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

  const getStudentName = (studentID) => {
    const foundStudent = students.find((student) => student.id === studentID); // Rename variable to 'foundStudent'
    return foundStudent ? foundStudent.firstName + " " + foundStudent.lastName : "Unknown";
  };

  const getStudentEducation = (studentID) => {
    const foundStudent = students.find((student) => student.id === studentID); // Rename variable to 'foundStudent'
    return foundStudent ? foundStudent.educationLevel : "Unknown";
  }

  const getStudentContactNumber = (studentID) => {
    const foundStudent = students.find((student) => student.id === studentID); // Rename variable to 'foundStudent'
    return foundStudent ? foundStudent.contactNumber : "Unknown";
  }

  const handleCommentButtonClick = (comment) => {
    Swal.fire({
      title: 'Comment',
      text: comment,
      icon: 'info',
      confirmButtonText: 'Close'
    });
  };

  return (
    <>
    {loading ? (
      <CardLoading loading={loading} />
    ) : (
    <div className={"relative mx-auto px-4 py-8 flex flex-col min-w-0 break-words w-full shadow-lg rounded " +
      (color === "light" ? "bg-white" : "bg-lightBlue-900 text-white")}>
      <div className="flex items-center mb-4 font-bold text-xl">
        <Link to="/teacher/classes" className="text-blue-500 hover:underline">Classes</Link>
        <span className="mx-2">&nbsp;/&nbsp;</span>
        <Link to={`/teacher/classes/grade/${id}`}  className="text-blue-500 hover:underline">Class's Grade</Link>
        <span className="mx-2">&nbsp;/&nbsp;</span>
        <span className="text-gray-500">Class's Grade</span>
      </div>
      <div className="grid grid-cols-2 gap-y-3 mb-4 m-0 px-8">
        <div className="font-bold text-lg col-span-2 underline">TEST INFORMATION</div>
          <div className="font-bold">Test Name: <span className="font-normal">{testMarks.testName}</span></div>
          <div className="font-bold">Max Score: <span className="font-normal">{testMarks.maxScore}</span></div>
          <div className="font-bold">Test Date: <span className="font-normal">{testMarks.TestDate}</span></div>
        </div>
      <div className="block w-full overflow-x-auto">
        <table className="w-full bg-transparent border-collapse">
          {/* Table headers */}
          <thead>
            <tr>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">No</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Student Name</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Academic Level</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Score</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Mark</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Grade</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Status</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Comment</th>
            </tr>
          </thead>
          {/* Table body */}
          <tbody>
            {currentTests.map((test, index) => (
              <tr key={test.id}>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{index + 1}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{getStudentName(test.id)}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{getStudentEducation(test.id)}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{test?.score} </td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                  {test ? `${(Number(test.score) / Number(testMarks.maxScore)) * 100}%` : ''}
                </td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{calculateGrade((Number(test.score) / Number(testMarks.maxScore)) * 100)}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                  <span className={`rounded-full px-2 py-1 ${test?.score >= 40 ? "bg-yellow-300" : "bg-red-500"} mx-2`}>
                    {((Number(test.score) / Number(testMarks.maxScore)) * 100) >= 40 ? "Pass" : "Fail"}
                  </span>
                </td>
                <td >
                  <button className="rounded-full px-2 py-1 bg-blue-500 text-white mx-2">
                    <span onClick={() => handleCommentButtonClick(test.comment)} >Comment</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <CardPagination currentPage={currentPage} totalPages={totalPages} paginate={paginate} />
    </div>
    )}
    </>
  );
}

CardViewGrade.defaultProps = {
  color: "light",
};

CardViewGrade.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardViewGrade;