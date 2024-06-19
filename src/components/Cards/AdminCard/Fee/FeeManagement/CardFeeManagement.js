import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import CardLoading from "../../../CardLoading";
import { collection, getDocs, updateDoc, doc, addDoc, query, where } from "firebase/firestore";
import { db } from "../../../../../config/firebase";
import MUIDataTable from "mui-datatables";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@emotion/react";
import Swal from "sweetalert2";

function CardFeePaymentManagement() {
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allFeesPublished, setAllFeesPublished] = useState(false);

  const location = useLocation();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const currentMonthName = monthNames[new Date().getMonth()];

  useEffect(() => {
    async function fetchStudentsAndUsers() {
      try {
        const studentsSnapshot = await getDocs(collection(db, "students"));
        const studentsData = studentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStudents(studentsData);

        const usersSnapshot = await getDocs(
          query(collection(db, "users"), where("role", "==", "parent"))
        );
        const userData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(userData);

        const feeSnapshot = await getDocs(collection(db, "fees"));
        const feeData = [];

        for (const feeDoc of feeSnapshot.docs) {
          const feeClassesQuery = collection(feeDoc.ref, "Classes");
          const feeClassesSnapshot = await getDocs(feeClassesQuery);
          const feeClassesData = feeClassesSnapshot.docs.map((doc) => doc.data());

          feeData.push({
            id: feeDoc.id,
            feeDetail: feeDoc.data(),
            classes: feeClassesData,
          });
        }
        setFees(feeData);

        // Check if all fees are published
        const allPublished = feeData.every(
          (fee) => fee.feeDetail.publish === true
        );
        setAllFeesPublished(allPublished);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching students and users data:", error);
      }
    }
    fetchStudentsAndUsers();
  }, []);

  const getStudentById = (studentId) => {
    const student = students.find((student) => student.id === studentId);
    return student || {};
  };

  const getParentById = (parentId) => {
    const parent = users.find((user) => user.id === parentId);
    return parent || {};
  };

  const getFullName = (firstname, lastname) => {
    return firstname && lastname ? `${firstname} ${lastname}` : "-";
  };

  const getPaymentStatusForCurrentMonth = (studentId) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const studentFee = fees.find((fee) => {
      const dueDate = fee.feeDetail.DueDate.toDate();
      return (
        fee.feeDetail.StudentID === studentId &&
        dueDate.getMonth() === currentMonth &&
        dueDate.getFullYear() === currentYear
      );
    });

    if (studentFee && studentFee.feeDetail.paymentStatus) {
      return "Paid";
    } else if (studentFee) {
      return "Not Paid";
    } else {
      return "No Record for this month";
    }
  };

  const getOutstandingFeeAndLatestFee = (studentId) => {
    const studentFees = fees.filter(
      (fee) => fee.feeDetail.StudentID === studentId
    );

    let outstandingSum = 0;
    let latestFeeSum = 0;
    let latestDueDate = null;

    studentFees.forEach((fee) => {
      if (fee.feeDetail.paymentStatus === false) {
        fee.classes.forEach((feeClass) => {
          feeClass.FeeAmounts.forEach((feeAmount) => {
            outstandingSum += Number(feeAmount);
          });
        });
      }

      const dueDate = fee.feeDetail.DueDate.toDate();
      if (!latestDueDate || dueDate > latestDueDate) {
        latestDueDate = dueDate;
        latestFeeSum = 0;
        fee.classes.forEach((feeClass) => {
          feeClass.FeeAmounts.forEach((feeAmount) => {
            latestFeeSum += Number(feeAmount);
          });
        });
      }
    });

    const latestDueDateString = latestDueDate
      ? `${latestDueDate.getDate()}/${
          latestDueDate.getMonth() + 1
        }/${latestDueDate.getFullYear()}`
      : "-";
    const latestFeeString = latestDueDate ? `RM ${latestFeeSum} (${latestDueDateString})` : "-";

    return { outstandingSum, latestFeeString };
  };

  const data = students.map((student) => {
    const fullName = getFullName(student.firstName, student.lastName);
    const parentFullName = getFullName(
      getParentById(student.parentId).firstName,
      getParentById(student.parentId).lastName
    );
    const { outstandingSum, latestFeeString } = getOutstandingFeeAndLatestFee(student.id);

    const paymentStatus = getPaymentStatusForCurrentMonth(student.id);

    return [
      fullName,
      parentFullName,
      `RM ${outstandingSum}`,
      paymentStatus,
      latestFeeString,
      <Link
        to={`/admin/fee/view/${student.id}`}
        className="text-indigo-600 hover:text-indigo-900"
      >
        View Payments
      </Link>,
    ];
  });

  const columns = [
    {
      name: "Student Name",
    },
    {
      name: "Parent Name",
    },
    {
      name: "Outstanding Fee",
      options: {
        sortCompare: (order) => (a, b) => {
          const numA = parseFloat(a.data.replace(/[^\d.-]/g, ""));
          const numB = parseFloat(b.data.replace(/[^\d.-]/g, ""));
          return order === "asc" ? numA - numB : numB - numA;
        },
      },
    },
    {
      name: `Payment Status (${currentMonthName})`,
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
    {
      name: "Latest Fee",
    },
    {
      name: "Actions",
      options: {
        filter: false,
      },
    },
  ];

  const getMuiTheme = () =>
    createTheme({
      typography: {
        fontFamily: "Poppins",
      },
      overrides: {
        MUIDataTableHeadCell: {
          root: {
            padding: 0,
            margin: 0,
            fontSize: "12px",
          },
        },
        MUIDataTableBodyCell: {
          root: {
            fontSize: "12px",
            textAlign: "left",
          },
        },
      },
    });

  const options = {
    responsive: "standard",
    selectableRows: "none",
    downloadOptions: {
      excludeColumns: [5],
    },
    rowsPerPage: 5,
    rowsPerPageOptions: [5, 10, 20],
  };

  const handlePublishAll = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to publish all fees?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, publish all!",
    });

    if (result.isConfirmed) {
      try {
        const feeCollection = collection(db, "fees");
        const feeDocs = await getDocs(feeCollection);

        // Filter feeDocs to get only the fees that are not yet published
        const unpublishedFees = feeDocs.docs.filter(
          (feeDoc) => !feeDoc.data().publish
        );

        for (const feeDoc of unpublishedFees) {
          await updateDoc(doc(db, "fees", feeDoc.id), { publish: true });

          // Add notification to parent here
          const parent = getParentById(getStudentById(feeDoc.data().StudentID).parentId).id;
          const notificationData = {
            title: "Fee Published",
            message: `The fee for ${currentMonthName} has been published.`,
            isRead: false,
            userId: parent,
            AddTime: new Date(),
          };
          await addDoc(collection(db, "notifications"), notificationData);
        }

        setAllFeesPublished(true);

        Swal.fire("Published!", "All fees have been published.", "success");
      } catch (error) {
        console.error("Error publishing fees:", error);
        Swal.fire("Error!", "There was an error publishing the fees.", "error");
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Fee Payment Management</h2>
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
          to="/admin/fee/voucher"
          className={`font-bold py-2 px-4 ${
            location.pathname === "/admin/voucher"
              ? "bg-blue-500 text-white hover:text-lightBlue-100"
              : "text-black hover:text-white hover:bg-blue-500"
          }`}
        >
          Voucher List
        </Link>
        <Link
          to="/admin/fee/payment-history"
          className={`rounded-r-lg font-bold py-2 px-4 ${
            location.pathname === "/admin/fee/payment-history"
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
          <ThemeProvider theme={getMuiTheme()}>
            <MUIDataTable data={data} columns={columns} options={options} />
          </ThemeProvider>
          <div className="flex justify-center">
            <button
              onClick={handlePublishAll}
              disabled={allFeesPublished}
              className={`${
                allFeesPublished
                  ? "bg-gray-400"
                  : "bg-blue-500 hover:bg-blue-600"
              } text-white rounded-full font-bold py-2 px-4 mt-4`}
            >
              Publish All the Fee
            </button>
          </div>
          <div className="flex justify-center items-center flex-col mt-4">
            {/* Display all fee are publish message if all fees are published */}
            {allFeesPublished ? (
              <p className="text-sm text-green-500 font-bold">
                All fees are published
              </p>
            ) : (
              <p className="text-sm text-red-500 font-bold">
                The latest fee is until {currentMonthName}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CardFeePaymentManagement;
