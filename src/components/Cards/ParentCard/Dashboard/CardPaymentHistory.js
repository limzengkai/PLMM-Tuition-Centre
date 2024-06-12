import React, { useContext, useEffect, useState } from "react";
import MUIDataTable from "mui-datatables";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@emotion/react";
import { AuthContext } from "../../../../config/context/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../../../config/firebase";
import InvoiceModal from "./InvoiceModal";
import CardDashboardLoading from "../../CardDashboardLoading";

function CardPaymentHistory() {
  const { currentUser } = useContext(AuthContext);
  const [feePayments, setFeePayments] = useState([]);
  const [userData, setUserData] = useState({});
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userDocSnapshot = await getDoc(doc(db, "users", currentUser.uid));
        const user = userDocSnapshot.data();
        setUserData(user);
        const studentDataQuery = query(
          collection(db, "students"),
          where("parentId", "==", currentUser.uid)
        );
        const studentDataSnapshot = await getDocs(studentDataQuery);
        const studentData = [];

        studentDataSnapshot.forEach((doc) => {
          studentData.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        const fee = [];
        const InvoiceFee = [];
        await Promise.all(
          studentData.map(async (student) => {
            const feePaymentQuery = query(
              collection(db, "fees"),
              where("StudentID", "==", student.id),
              where("paymentStatus", "==", true),
            );

            const feeData = [];
            const feePaymentSnapshot = await getDocs(feePaymentQuery);
            feePaymentSnapshot.forEach((doc) => {
              feeData.push({
                id: doc.id,
                ...doc.data(),
              });
            });

            await Promise.all(
              feePaymentSnapshot.docs.map(async (doc) => {
                const feePaymentlist = await getDocs(
                  collection(db, "fees", doc.id, "Classes")
                );
                const classesData = [];
                feePaymentlist.forEach((classDoc) => {
                  classesData.push({
                    id: classDoc.id,
                    ...classDoc.data(),
                  });
                });
                let totalAmount = 0;

                classesData.forEach((classData) => {
                  const { Quantity, FeeAmounts } = classData;
                  for (let i = 0; i < Quantity.length; i++) {
                    totalAmount += Quantity[i] * FeeAmounts[i];
                  }
                });
                fee.push({
                  id: doc.id,
                  ...doc.data(),
                  classes: classesData,
                  amount: totalAmount,
                  studentName: student.firstName + " " + student.lastName,
                });
                InvoiceFee.push({
                    id: doc.id,
                    classes: classesData,
                    feeDetail: doc.data(),
                });
              })
            );
          })
        );

        // Sort the fee array
        fee.sort((a, b) => {
          // sort by paymentStatus
          if (a.paymentStatus === false && b.paymentStatus === true) return -1;
          if (a.paymentStatus === true && b.paymentStatus === false) return 1;

          // if paymentStatus is the same, sort by DueDate in descending order
          return b.paymentDate.seconds - a.paymentDate.seconds;
        });
        setFees(InvoiceFee);
        setFeePayments(fee);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error("Error fetching data:", error);
      }
    };
    setLoading(false);
    fetchData();
  }, []);

  const getDate = (timestamp) => {
    if (timestamp && timestamp.toDate) {
      const d = timestamp.toDate();
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, "0");
      const day = d.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    return "";
  };

  const invoiceModals = fees.map((fee) => (
    <InvoiceModal key={fee.id} fees={fee} users={userData} />
  ));

  const columns = ["Due Date","Payment Date", "Amount", "Status", "Invoice"];
  const data = feePayments.map((fee) => [
    getDate(fee.DueDate),
    getDate(fee.paymentDate),
    "RM " + fee.amount.toFixed(2),
    fee.paymentStatus ? "Paid" : "Unpaid",
    invoiceModals.find((modal) => modal.key === fee.id),
  ]);

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
    elevation: 0,
    download: false, // Disable print and CSV export
    filter: false, // Disable filtering
    selectableRows: "none", // Disable row selection
    print: false, // Hide print button
    search: false, // Hide search bar
    viewColumns: false, // Hide view columns
    rowsPerPage: 5,
    rowsPerPageOptions: [5, 10, 20],
  };

  return (
    <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
      <div className="rounded-t mb-0 px-4 py-3 bg-transparent">
        <div className="flex flex-wrap items-center">
          <div className="relative w-full max-w-full flex-grow flex-1">
            {/* <h6 className="uppercase text-blueGray-400 mb-1 text-xs font-semibold">
              {performance}
            </h6> */}
            <h2 className="text-blueGray-700 text-xl font-semibold">
              PAYMENT HISTORY
            </h2>
          </div>
        </div>
      </div>
      <div className="p-4 flex-auto">
        <ThemeProvider theme={getMuiTheme()}>
          <MUIDataTable
            title=""
            data={data}
            columns={columns}
            options={options}
          />
        </ThemeProvider>
      </div>
    </div>
  );
}

export default CardPaymentHistory;
