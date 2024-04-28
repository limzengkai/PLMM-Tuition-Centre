import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import CardLoading from "../CardLoading";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../config/firebase";

function CardFeePaymentManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    async function fetchStudentsAndUsers() {
      try {
        const studentsSnapshot = await getDocs(collection(db, "students"));
        const studentsData = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(studentsData);

        const usersSnapshot = await getDocs(collection(db, "users"));
        const userData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(userData);

        const feeSnapshot = await getDocs(collection(db, "fees"));
        const feeData = [];
        
        for (const feeDoc of feeSnapshot.docs) {
          console.log("FeeDoc", feeDoc.ref);
          const feeClassesQuery = collection(feeDoc.ref, "Classes");
          const feeClassesSnapshot = await getDocs(feeClassesQuery);
          const feeClassesData = feeClassesSnapshot.docs.map(doc => doc.data());
          
          feeData.push({ 
            id: feeDoc.id,
            feeDetail: feeDoc.data(),
            classes: feeClassesData
          });
        }
        
        setFees(feeData);
        console.log("Fee", feeData);
        

        setLoading(false);
      } catch (error) {
        console.error("Error fetching students and users data:", error);
      }
    }
    fetchStudentsAndUsers();
  }, []);

  const getParentById = (parentId) => {
    const parent = users.find(user => user.id === parentId);
    console.log("Parent", parent);
    return parent || {};
  };

  const getFullName = (firstname, lastname) => {
    return firstname && lastname ? `${firstname} ${lastname}` : '-';
  };


const getOutstandingFeeAndLastestFee = (studentId) => {
  const studentFees = fees.filter(fee => fee.feeDetail.StudentID === studentId);
  let outstandingSum = 0;
  let sumLatestFee = 0;
  let latestFee = null;
  let latestDueDate = new Date(0);

  studentFees.forEach(fee => {
    if (fee.feeDetail.paymentStatus === false) {
      fee.classes?.forEach(feeClass => { // Use optional chaining here
        feeClass.FeeAmounts?.forEach(feeAmount => { // Use optional chaining here
          outstandingSum += Number(feeAmount); // Accessing the FeeAmount directly
        });
      });
    }
    const dueDate = fee.feeDetail.DueDate.toDate();
    if (!latestDueDate || dueDate > latestDueDate) {
      if (fee.feeDetail.publish) {
        latestDueDate = dueDate;
        latestFee = fee;
      }
    }
  });

  studentFees.forEach(fee => {
    if (fee.feeDetail.DueDate.toDate().getTime() === latestDueDate.getTime()) {
      fee.classes?.forEach(feeClass => { // Use optional chaining here
        feeClass.FeeAmounts?.forEach(feeAmount => { // Use optional chaining here
          sumLatestFee += Number(feeAmount); // Accessing the FeeAmount directly
        });
      });
    }
  });

  const latestDueDateString = latestDueDate ? `${latestDueDate.getDate()}/${latestDueDate.getMonth() + 1}/${latestDueDate.getFullYear()}` : '-';
  const latestFeeString = latestFee ? sumLatestFee + ` (${latestDueDateString})` : '-';

  return { outstandingSum, latestFeeString };
};

  const filteredStudents = students.filter(student => {
    const fullname = getFullName(student.firstName, student.lastName);
    return fullname.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Fee Payment Management</h2>
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
          placeholder="Enter student name"
        />
      </div>
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
          to="/admin/fee/history"
          className={`rounded-r-lg font-bold py-2 px-4 ${
            location.pathname === "/admin/fee/classes"
              ? "bg-blue-500 text-white hover:text-lightBlue-100"
              : "text-black hover:text-white hover:bg-blue-500"
          }`}
        >
          Payment History
        </Link>
      </div>
      {loading ? (
        <CardLoading loading={loading} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white border border-gray-200 divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Name</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Phone No</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Email</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding Fee</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Lastest Fee</th>  
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student, index) => (
                <tr key={student.id}>
                  <td className="px-6 text-center py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                  <td className="px-6 text-center py-4 whitespace-nowrap text-sm text-gray-900">{getFullName(student.firstName, student.lastName)}</td>
                  <td className="px-6 text-center py-4 whitespace-nowrap text-sm text-gray-900">{getFullName(getParentById(student.parentId).firstName, getParentById(student.parentId).lastName)}</td>
                  <td className="px-6 text-center py-4 whitespace-nowrap text-sm text-gray-900">{getParentById(student.parentId).contactNumber || '-'}</td>
                  <td className="px-6 text-center py-4 whitespace-nowrap text-sm text-gray-900">{getParentById(student.parentId).email || '-'}</td>
                  <td className="px-6 text-center py-4 whitespace-nowrap text-sm text-gray-900">RM {getOutstandingFeeAndLastestFee(student.id).outstandingSum}</td>
                  <td className="px-6 text-center py-4 whitespace-nowrap text-sm text-gray-900">{student.paymentStatus ? 'Paid' : 'Not Paid'}</td>
                  <td className="px-6 text-center py-4 whitespace-nowrap text-sm text-gray-900">RM {getOutstandingFeeAndLastestFee(student.id).latestFeeString}</td>
                  <td className="px-6 text-center py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/admin/fee/view/${student.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View Payments
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CardFeePaymentManagement;
