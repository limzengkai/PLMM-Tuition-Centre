import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { collection, query, where, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../../../config/firebase";
import CardLoading from "../CardLoading";

function CardFeeAdd() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [fee, setFee] = useState([]);
  const [feeAmount, setFeeAmount] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isFeeGenerated, setIsFeeGenerated] = useState(false);
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudentsAndClasses() {
      try {
        const studentsSnapshot = await getDocs(collection(db, "students"));
        const studentsData = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(studentsData);
        console.log("Student",studentsData)

        const classesSnapshot = await getDocs(collection(db, "class"));
        const classesData = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setClasses(classesData);
        console.log("Class",classesData)

        const feeSnapshot = await getDocs(collection(db, "fees"));
        const feeData = feeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFee(feeData);
        console.log("Fee",fee)

        // Check if fee for next month is already generated
        const isGenerated = await isFeeForNextMonthCreated();
        setIsFeeGenerated(isGenerated);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching students and classes data:", error);
      }
    }
    fetchStudentsAndClasses();
  }, []);

  const isFeeForNextMonthCreated = async () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;

    // Get the starting date of the next month
    const nextMonthStart = new Date(currentDate.getFullYear(), nextMonth - 1, 1);

    // Convert the JavaScript date to a Firestore Timestamp
    const nextMonthStartTimestamp = Timestamp.fromDate(nextMonthStart);

    const feesSnapshot = await getDocs(
      query(
        collection(db, "fees"), 
        where("DueDate", ">=", nextMonthStartTimestamp)
      )
    );
    return !feesSnapshot.empty;
  };
    // State to manage the search term
    const [searchTerm, setSearchTerm] = useState('');
    // Dummy data for demonstration
    const studentss = [
        { id: 1, name: 'LIM ZENG KAI 1', studentID: 'User0001', phoneNumber: '1234567890', parentID: 2, outstanding: 50 },
        { id: 2, name: 'LIM ZENG KAI 2', studentID: 'User0001', phoneNumber: '1234567890', parentID: 1, outstanding: 0 },
        { id: 3, name: 'LIM ZENG KAI 3', studentID: 'User0001', phoneNumber: '1234567890', parentID: 1, outstanding: 25 },
        { id: 4, name: 'LIM ZENG KAI 4', studentID: 'User0001', phoneNumber: '1234567890', parentID: 2, outstanding: 0 },
      ];

      const parents = [
        { id: 1, name: 'Ahmad', phoneNumber: '1234567890', email: "ABC@gmal.com" },
        { id: 2, name: 'Abdullah', phoneNumber: '1234567890', email: "XYZ@gmal.com" },
      ];
    
      // Function to get parent by ID
      const getParentById = (parentId) => {
        return parents.find(parent => parent.id === parentId);
      };
    
      // Filter students based on search term
      const filteredStudents = studentss.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

  return (
    <>
    {loading ? (
      <CardLoading loading={loading} />
    ) : (
    <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-4 font-bold text-xl">
            <Link to="/admin/fee" className="text-blue-500 hover:underline">Fee Payment Management</Link>
            <span className="mx-2">&nbsp;/&nbsp;</span>
            <Link to="/admin/fee/add" className="text-blue-500 hover:underline">Class List</Link>
            <span className="mx-2">&nbsp;/&nbsp;</span>
            <span className="text-gray-500">Add Class Fee</span>
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
                    location.pathname === "/admin/fee/add"
                    ? "bg-blue-500 text-white hover:text-lightBlue-100"
                    : "text-black hover:text-white hover:bg-blue-500"
                }`}
                >
                Class List
                </Link>
                <Link
                to="/admin/fee/classes"
                className={`rounded-r-lg font-bold py-2 px-4 ${
                    location.pathname === "/admin/fee/classes"
                    ? "bg-blue-500 text-white hover:text-lightBlue-100"
                    : "text-black hover:text-white hover:bg-blue-500"
                }`}
                >
                Payment History
                </Link>
            </div>
        </div>
        
            {/* Students Table */}
            <div className="block w-full overflow-x-auto">
        <table className="w-full bg-transparent border-collapse">
          <thead>
            <tr>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">No.</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Classes Name</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Classes ID</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Classes March Fee</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Teacher</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Unpaid Student</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student, index) => (
              <tr key={student.id}>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{index + 1}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{student.name}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{getParentById(student.parentID)?.name || '-'}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{getParentById(student.parentID)?.phoneNumber || '-'}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{getParentById(student.parentID)?.email || '-'}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{student.outstanding}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                  <Link
                    to={`/admin/fee/classes/${student.id}`}
                    className="mr-3 text-black rounded-full font-bold py-2 px-4 bg-blue-500"
                  >
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

export default CardFeeAdd;