import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "../../../../../config/firebase";
import CardLoading from "../../../CardLoading";
import MUIDataTable from "mui-datatables";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@emotion/react";

function CardFeeManagement() {
  const { uid } = useParams();
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const classDocRef = doc(db, "class", uid); // Corrected collection name from "class" to "classes"
        const classDocSnapshot = await getDoc(classDocRef);
        const classData = classDocSnapshot.data();
        setClasses(classData);

        const studentQuery = query(
          collection(db, "students"),
          where("registeredCourses", "array-contains", uid)
        );
        const studentsSnapshot = await getDocs(studentQuery);
        const studentData = studentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStudents(studentData);

        const fetchParentInfo = async (student) => {
          const parentQuery = query(
            collection(db, "parent"),
            where("children", "array-contains", student.id)
          );
          const parentSnapshot = await getDocs(parentQuery);
          const parentData = parentSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const fetchUserData = parentData.map(async (parent) => {
            const userDocRef = doc(db, "users", parent.id);
            const userDocSnapshot = await getDoc(userDocRef);
            return userDocSnapshot.data();
          });

          const userData = await Promise.all(fetchUserData);
          return parentData.map((parent, index) => ({
            ...parent,
            userData: userData[index],
          }));
        };

        const updatedStudents = await Promise.all(
          studentData.map(async (student) => {
            const parentInfo = await fetchParentInfo(student);
            return { ...student, parentInfo };
          })
        );

        setStudents(updatedStudents);

        const feeQuery = query(
          collection(db, "fees"),
          orderBy("DueDate", "desc")
        );
        const feesSnapshot = await getDocs(feeQuery);
        const feesData = await Promise.all(
          feesSnapshot.docs.map(async (feeDoc) => {
            const feebyClassQuery = query(
              collection(feeDoc.ref, "Classes"),
              where("ClassId", "==", uid)
            );
            const feebyClassSnapshot = await getDocs(feebyClassQuery);
            const feebyClassData = feebyClassSnapshot.docs.map((doc) =>
              doc.data()
            );
            return { feeDetail: feeDoc.data(), ClassFee: feebyClassData };
          })
        );
        setFees(feesData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [uid]);

  const getFeeStatus = (studentId) => {
    const fee = fees.find((fee) => fee.feeDetail.StudentID === studentId);
    if (!fee) return "No Fee Record Found!";
    return fee.feeDetail.paymentStatus ? "Paid" : "Unpaid";
  };

  const getParentById = (parentId) => {
    const studentWithParent = students.find(
      (student) =>
        student.parentInfo &&
        student.parentInfo.find((parent) => parent.id === parentId)
    );
    if (!studentWithParent) return "";
    const parent = studentWithParent.parentInfo.find(
      (parent) => parent.id === parentId
    );
    return `${parent.userData.firstName} ${parent.userData.lastName}`;
  };

  const getParentPhoneById = (parentId) => {
    const parent = students
      .flatMap((student) => student.parentInfo)
      .find((parent) => parent && parent.id === parentId);
    if (!parent) return "-";
    return parent.userData.contactNumber || "-";
  };

  const getParentEmailById = (parentId) => {
    const parent = students
      .flatMap((student) => student.parentInfo)
      .find((parent) => parent && parent.id === parentId);
    if (!parent) return "-";
    return parent.userData.email || "-";
  };

  const data = students.map((student) => [
    `${student.firstName} ${student.lastName}`,
    getParentById(student.parentId),
    getParentPhoneById(student.parentId),
    getParentEmailById(student.parentId),
    getFeeStatus(student.id),
    <Link
      to={`/admin/fee/view/${student.id}`}
      className="mr-3 text-black rounded-full font-bold py-2 px-4 bg-blue-500"
    >
      View
    </Link>,
  ]);

  const columns = [
    { name: "STUDENT NAME" },
    { name: "PARENT NAME" },
    { name: "PARENT PHONE NO" },
    { name: "PARENT EMAIL" },
    {
      name: "STATUS",
      options: {
        customBodyRender: (value) => (
          <p
            className={`py-1 px-3 inline-flex text-xs leading-5 font-semibold rounded-full ${
              value === "Paid"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {value}
          </p>
        ),
      },
    },
    { name: "Actions", options: { filter: false, sort: false } },
  ];

  const getMuiTheme = () =>
    createTheme({
      typography: {
        fontFamily: "Poppins",
      },
      overrides: {
        MUIDataTableHeadCell: { root: { fontSize: "12px" } },
        MUIDataTableBodyCell: { root: { fontSize: "12px" } },
      },
    });

  const options = {
    responsive: "standard",
    selectableRows: "none",
    downloadOptions: { excludeColumns: [5] },
    rowsPerPage: 5,
    rowsPerPageOptions: [5, 10, 20],
  };

  return (
    <>
      {loading ? (
        <CardLoading loading={loading} />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-4 font-bold text-xl">
            <Link
              to="/admin/fee/classes"
              className="text-blue-500 hover:underline"
            >
              Payment Class List
            </Link>
            <span className="mx-2">&nbsp;/&nbsp;</span>
            <span className="text-gray-500">View class's fee</span>
          </div>
          {classes ? (
            <div className="grid grid-cols-4 sm:grid-cols-2">
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
                <span className="font-bold mr-2">
                  Total Registered Student:
                </span>
                <span>
                  {classes.studentID.length} / {classes.MaxRegisteredStudent}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-red-500">No class details found!</div>
          )}
          {/* Students Table */}
          <div className="overflow-x-auto">
            <ThemeProvider theme={getMuiTheme()}>
              <MUIDataTable data={data} columns={columns} options={options} />
            </ThemeProvider>
          </div>
          <div className="relative mt-6 flex justify-center">
            <Link
              to={`/admin/fee/classes/add/${uid}`}
              className="mt-4 text-white rounded-full font-bold py-2 px-4 bg-blue-500"
            >
              Add Fee By Class
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

export default CardFeeManagement;
