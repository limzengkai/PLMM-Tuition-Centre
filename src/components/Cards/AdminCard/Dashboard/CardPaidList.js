import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../../config/firebase";
import PaidReportModal from "./PaidReportModal";
import CardChartLoading from "../../CardChartLoading";
import MUIDataTable from "mui-datatables";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@emotion/react";

export default function CardPaidList() {
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [monthlyFees, setMonthlyFees] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const todayMonth = new Date().getMonth() + 1;
        const feesRef = collection(db, "fees");
        const querySnapshot = await getDocs(feesRef);
        const fees = [];
        const monthlyFees = [];
        querySnapshot.forEach((doc) => {
          fees.push({ id: doc.id, ...doc.data() });
        });

        // Filter and display monthly fees that are paid
        fees.forEach((fee) => {
          if (
            fee.DueDate?.toDate().getMonth() + 1 === todayMonth &&
            fee.paymentStatus === true
          ) {
            monthlyFees.push(fee);
          }
        });

        monthlyFees.sort((a, b) => a.DueDate - b.DueDate);
        monthlyFees.forEach((fee) => {
          if (fee && fee.id) {
            const totalFeeRef = getDocs(
              collection(db, "fees", fee.id, "Classes")
            );
            totalFeeRef.then((querySnapshot, index) => {
              let totalFee = 0; // Initialize totalFee to zero
              querySnapshot.forEach((doc) => {
                let feeAmount = doc.data().FeeAmounts;
                let quantity = doc.data().Quantity;
                for (let i = 0; i < quantity.length; i++) {
                  totalFee += feeAmount[i] * quantity[i]; // Accumulate the total fee
                }
              });
              fee.Fee = totalFee; // Assign the total fee to fee.Fee
            });
          }
        });

        setMonthlyFees(monthlyFees);
        setFees(fees);

        const studentsRef = collection(db, "students");
        const studentsSnapshot = await getDocs(studentsRef);
        const students = [];
        studentsSnapshot.forEach((doc) => {
          students.push({ id: doc.id, ...doc.data() });
        });
        setStudents(students);

        const usersRef = query(
          collection(db, "users"),
          where("role", "==", "parent")
        );
        const usersSnapshot = await getDocs(usersRef);
        const users = [];
        usersSnapshot.forEach((doc) => {
          users.push({ id: doc.id, ...doc.data() });
        });
        setUsers(users);

        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const monthsName = [
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

  const columns = [
    {
      name: "ParentName",
      label: "Parent Name",
    },
    {
      name: "StudentName",
      label: "Student Name",
    },
    {
      name: "AcademicLevel",
      label: "Academic Level",
    },
    {
      name: "DueDate",
      label: "Due Date",
    },
    {
      name: "PaymentFee",
      label: "Payment Fee (RM)",
    },
  ];

  const data = monthlyFees.map((fee, index) => ({
    ParentName: `${
      users.find(
        (user) =>
          user.id ===
          students.find((student) => student.id === fee.StudentID)?.parentId
      )?.firstName
    } ${
      users.find(
        (user) =>
          user.id ===
          students.find((student) => student.id === fee.StudentID)?.parentId
      )?.lastName
    }`,
    StudentName: `${
      students.find((student) => student.id === fee.StudentID)?.firstName
    } ${students.find((student) => student.id === fee.StudentID)?.lastName}`,
    AcademicLevel: students.find((student) => student.id === fee.StudentID)
      ?.educationLevel,
    DueDate: fee.DueDate?.toDate().toLocaleDateString(),
    PaymentFee: `RM ${fee.Fee}`,
  }));

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
    filter: false,
    download: false,
    print: false,
    search: false,
    selectableRows: "none",
    viewColumns: false,
  };

  return (
    <>
      <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
        <div className="rounded-t mb-0 px-4 py-3 border-0">
          <div className="flex flex-wrap items-center">
            <div className="relative w-full px-4 max-w-full flex-grow flex-1">
              <h6 className="uppercase text-blueGray-500 mb-1 text-xs font-semibold">
                Overview
              </h6>
              <h2 className="text-blueGray-500  text-xl font-semibold">
                {monthsName[new Date().getMonth()]} Paid List
              </h2>
            </div>
            <PaidReportModal users={users} fees={fees} students={students} />
          </div>
        </div>
        <div className="block w-full overflow-x-auto">
          {loading ? (
            <CardChartLoading /> // Render loading indicator
          ) : (
            <ThemeProvider theme={getMuiTheme()}>
              <MUIDataTable
                title={""}
                data={data}
                columns={columns}
                options={options}
              />
            </ThemeProvider>
          )}
        </div>
      </div>
    </>
  );
}
