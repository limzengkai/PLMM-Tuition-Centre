import React, { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { collection, query, where, getDocs, addDoc, doc, getDoc, orderBy } from "firebase/firestore";
import { db } from "../../../config/firebase";
import CardLoading from "../CardLoading";

function CardFeeManagement() {
  const { uid } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching data for class:", uid);
  
        // Fetch Class data
        const classDocRef = doc(db, "class", uid);
        const classDocSnapshot = await getDoc(classDocRef);
        const classData = classDocSnapshot.data();
        setClasses(classData);
  
        // Fetch students data
        const studentQuery = query(
          collection(db, "students"),
          where("registeredCourses", "array-contains", uid)
        );
        const studentsSnapshot = await getDocs(studentQuery);
        const studentData = studentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setStudents(studentData);
  
        // Fetch parent information and calculate outstanding fees for each student
        const fetchParentInfo = async (student) => {
          const parentQuery = query(
            collection(db, "parent"),
            where("children", "array-contains", student.id)
          );
          const parentSnapshot = await getDocs(parentQuery);
          const parentData = parentSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
  
          const fetchUserData = parentData.map(async (parent) => {
            const userQuery = query(
              collection(db, "users"),
              where(firebase.firestore.FieldPath.documentId(), "==", parent.id)
            );
            const userSnapshot = await getDocs(userQuery);
            return userSnapshot.docs.map(doc => doc.data());
          });
  
          const userData = await Promise.all(fetchUserData);
          parentData.forEach((parent, index) => {
            parent.userData = userData[index];
          });
  
          student.parentInfo = parentData;
        };
  
        await Promise.all(studentData.map(async (student) => {
          await fetchParentInfo(student);
        }));
  
        // Fetch fees data
        const feeQuery = query(
          collection(db, "fees"),
          orderBy("DueDate", "desc")
        );
        const feesSnapshot = await getDocs(feeQuery);
        const feesData = await Promise.all(feesSnapshot.docs.map(async (feeDoc) => {
          const feebyClassQuery = query(
            collection(feeDoc.ref, "Classes"),
            where("ClassId", "==", uid)
          );
          const feebyClassSnapshot = await getDocs(feebyClassQuery);
          const feebyClassData = feebyClassSnapshot.docs.map(doc => doc.data());
          return { feeDetail: feeDoc.data(), ClassFee: feebyClassData };
        }));
        setFees(feesData);

  
        console.log("Fetched data:", { classes: classData, students: studentData, fees: feesData });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
  
    fetchData();
  }, [uid]);

  const getFeeStatus = (studentId) => {
    let foundFee = false;
    for (const fee of fees) {
      if (fee.feeDetail.StudentID === studentId) {
        foundFee = true;
        if (!fee.feeDetail.paymentStatus) {
          return "UnPaid";  
        } else {
          return "Paid";
        }
      }
    }
    if (!foundFee) {
      return "No Fee Record Found!";
    } else {
      return "Paid";
    }
  };

  // Function to get parent by ID
  const getParentById = (parentId) => {
    let parentName = '';
    students.forEach(student => {
      student.parentInfo.forEach(parent => {
        if (parent.id === parentId) {
          parentName = parent.userData[0].firstName + " " + parent.userData[0].lastName;
        }
      });
    });
    return parentName;
  };

  // Function to get parent's Phone by ID
  const getParentPhoneById = (parentId) => {
    let parentName = '';
    students.forEach(student => {
      student.parentInfo.forEach(parent => {
        if (parent.id === parentId) {
          parentName = parent.userData[0].contactNumber;
        }
      });
    });
    return parentName;
  };

  // Function to get parent's Email  by ID
  const getParentEmailById = (parentId) => {
    let parentName = '';
    students.forEach(student => {
      student.parentInfo.forEach(parent => {
        if (parent.id === parentId) {
          parentName = parent.userData[0].email;
        }
      });
    });
    return parentName;
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    (student.firstName && student.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.lastName && student.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
    {loading ? (
      <CardLoading loading={loading} />
    ) : (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-4 font-bold text-xl">
        <Link to="/admin/fee/classes" className="text-blue-500 hover:underline">Payment Class List</Link>
        <span className="mx-2">&nbsp;/&nbsp;</span>
        <span className="text-gray-500">View class's fee</span>
      </div>
      {/* Search Bar */}
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
      {classes ? (
        <div  className="grid grid-col-4 sm:grid-cols-2">
          <div className="mb-4">
            <span className="font-bold mr-2">Class Name:</span>
            <span>{classes.CourseName}</span>
          </div>
          <div className="mb-4">
            <span className="font-bold mr-2">Academic Level:</span>
            <span>{classes.academicLevel}</span>
          </div>
          <div className="mb-4">
            <span className="font-bold mr-2">Class Fee:</span>
            <span>RM {classes.fee}</span>
          </div>
          <div className="mb-4">
            <span className="font-bold mr-2">Location:</span>
            <span>{classes.location}</span>
          </div>
          <div className="mb-4">
            <span className="font-bold mr-2">Total Registered Student:</span>
            <span>{classes.studentID.length} / {classes.MaxRegisteredStudent}</span>
          </div>
        </div>
      ) : (
        <div className="text-red-500">No class's details not found!</div>
      )}
      {/* Students Table */}
      <div className="block w-full overflow-x-auto">
        <table className="w-full bg-transparent border-collapse">
          <thead>
            <tr>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">No.</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Student Name</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Parent Name</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Parent Phone No</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Parent Email</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Status</th>
              <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student, index) => (
              <tr key={student.id}>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{index + 1}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{student.firstName + " " + student.lastName}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{getParentById(student.parentId)}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{getParentPhoneById(student.parentId) || '-'}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{getParentEmailById(student.parentId) || '-'}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{getFeeStatus(student.id)}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                  <Link
                    to={`/admin/fee/view/${student.id}`}
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

export default CardFeeManagement;
