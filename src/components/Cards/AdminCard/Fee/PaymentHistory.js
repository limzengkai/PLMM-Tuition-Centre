import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import CardLoading from "../../CardLoading";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "../../../../config/firebase";
import MUIDataTable from "mui-datatables";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@emotion/react";

function PaymentHistory() {
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    async function fetchStudentsAndUsers() {
      try {
        console.log("Fetching students and users data....");

        // Fetch students data
        const studentsSnapshot = await getDocs(collection(db, "students"));
        const studentsData = studentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStudents(studentsData);

        // Fetch users data
        const usersSnapshot = await getDocs(collection(db, "users"));
        const userData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(userData);

        // Fetch fee data
        const feeData = [];
        const feeSnapshot = await getDocs(
          query(
            collection(db, "fees"),
            where("paymentStatus", "==", true),
            orderBy("paymentDate", "desc")
          )
        );

        // Process fee data
        for (const doc of feeSnapshot.docs) {
          const feeClassesQuery = collection(doc.ref, "Classes");
          const feeClassesSnapshot = await getDocs(feeClassesQuery);
          const feeClassesData = feeClassesSnapshot.docs.map((doc) =>
            doc.data()
          );

          feeData.push({
            id: doc.id,
            feeDetail: doc.data(),
            classes: feeClassesData,
          });
        }

        setFees(feeData);
        console.log("Fee ", feeData);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching students and users data:", error);
      }
    }
    fetchStudentsAndUsers();
  }, []);

  const getParentById = (parentId) => {
    const parent = users.find((user) => user.id === parentId);
    return parent || "Deleted User";
  };

  const getParentFullName = (parentId) => {
    const parent = users.find((user) => user.id === parentId);
    return parent ? `${parent.firstName} ${parent.lastName}` : "Deleted User";
  };

  const getStudentFullName = (studentId) => {
    const student = students.find((student) => student.id === studentId);
    return student
      ? `${student.firstName} ${student.lastName}`
      : "Deleted Student";
  };

  const getFullName = (firstname, lastname) => {
    return firstname && lastname ? `${firstname} ${lastname}` : "-";
  };

  const getStudent = (studentId) => {
    const student = students.find((student) => student.id === studentId);
    return student;
  };

  const getOutstandingFeeAndLastestFee = (studentId) => {
    const studentFees = fees.filter(
      (fee) => fee.feeDetail.StudentID === studentId
    );
    let outstandingSum = 0;
    let sumLatestFee = 0;
    let latestFee = 0;
    let latestDueDate = new Date();

    studentFees.forEach((fee) => {
      if (fee.feeDetail.paymentStatus === false) {
        fee.classes?.forEach((feeClass) => {
          // Use optional chaining here
          feeClass.FeeAmounts?.forEach((feeAmount) => {
            // Use optional chaining here
            outstandingSum += Number(feeAmount); // Accessing the FeeAmount directly
          });
        });
      }
      const dueDate = fee.feeDetail.DueDate.toDate();
      if (!latestDueDate || dueDate > latestDueDate) {
        if (fee.feeDetail.paymentStatus === false) {
          latestDueDate = dueDate;
          latestFee = fee;
        }
      }
    });

    studentFees.forEach((fee) => {
      if (
        fee.feeDetail.DueDate.toDate().getTime() === latestDueDate.getTime()
      ) {
        fee.classes?.forEach((feeClass) => {
          // Use optional chaining here
          feeClass.FeeAmounts?.forEach((feeAmount) => {
            // Use optional chaining here
            sumLatestFee += Number(feeAmount); // Accessing the FeeAmount directly
          });
        });
      }
    });

    const latestDueDateString = latestDueDate
      ? `${latestDueDate.getDate()}/${
          latestDueDate.getMonth() + 1
        }/${latestDueDate.getFullYear()}`
      : "-";
    const latestFeeString = latestFee
      ? sumLatestFee + ` (${latestDueDateString})`
      : "-";

    return { outstandingSum, latestFeeString };
  };

  const getTotal = (payment) => {
    let total = 0;
    payment.forEach((fee) => {
      for (let i = 0; i < fee.FeeAmounts.length; i++) {
        total += parseFloat(fee.FeeAmounts[i]) * fee.Quantity[i];
      }
    });
    return total;
  };

  function getDate(timestamp) {
    const { seconds, nanoseconds } = timestamp;
    // Create a new Date object using the seconds and milliseconds
    const milliseconds = seconds * 1000 + nanoseconds / 1000000;
    const date = new Date(milliseconds);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
  

  const idata = fees.map((fee) => {
    return [
      getStudentFullName(fee.feeDetail.StudentID),
      getParentFullName(getStudent(fee.feeDetail.StudentID).parentId),
      `RM ${getTotal(fee.classes)}`,
      fee.feeDetail.paymentStatus ? "Paid" : "Not Paid",
      getDate(fee.feeDetail.paymentDate),
    ];
  });

  const data = students.map((student) => {
    return [
      getFullName(student.firstName, student.lastName),
      getFullName(
        getParentById(student.parentId).firstName,
        getParentById(student.parentId).lastName
      ),
      `RM ${getOutstandingFeeAndLastestFee(student.id).outstandingSum}`,
      student.paymentStatus ? "Paid" : "Not Paid",
      `RM ${getOutstandingFeeAndLastestFee(student.id).latestFeeString}`,
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
      name: "Payment Status",
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
      name: "Pay Date",
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
            fontSize: "12px",
          },
        },
        MUIDataTableBodyCell: {
          root: {
            fontSize: "12px",
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
            <MUIDataTable data={idata} columns={columns} options={options} />
          </ThemeProvider>
        </div>
      )}
    </div>
  );
}

export default PaymentHistory;
