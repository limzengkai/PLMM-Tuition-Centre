import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../../config/context/AuthContext";
import { db } from "../../../config/firebase";
import PropTypes from "prop-types";
import CardLoading from "../CardLoading";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import MUIDataTable from "mui-datatables";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@emotion/react";

function CardFee({ color }) {
  const { currentUser } = useContext(AuthContext);
  const [feePayments, setFeePayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
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
        await Promise.all(
          studentData.map(async (student) => {
            console.log(student.id);
            const feePaymentQuery = query(
              collection(db, "fees"),
              where("StudentID", "==", student.id),
              where("publish", "==", true),
              orderBy("paymentStatus", "asc"),
              orderBy("DueDate", "desc")
            );

            console.log(await getDocs(feePaymentQuery)); 

            const feeData = [];
            const feePaymentSnapshot = await getDocs(feePaymentQuery);
            feePaymentSnapshot.forEach((doc) => {
              feeData.push({
                id: doc.id,
                ...doc.data(),
              });
            });
            console.log(feeData);
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

                fee.push({
                  id: doc.id,
                  ...doc.data(),
                  classes: classesData,
                  studentName: student.firstName + " " + student.lastName,
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
          return b.DueDate.seconds - a.DueDate.seconds;
        });
        console.log(fee);
        setFeePayments(fee);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [currentUser.uid]);

  const calculateTotalFee = (project) => {
    return project.classes?.reduce((totalFee, classItem) => {
      return (
        totalFee + classItem.FeeAmounts.reduce((acc, curr) => acc + curr, 0)
      );
    }, 0);
  };

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
  const confirmPayment = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure you want to proceed with the payment?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      navigate(`/parent/fee/payment/${id}`);
    }
  };

  const columns = [
    { name: "Due Date" },
    { name: "Student Name" },
    {
      name: "Fee",
    },
    { name: "Description" },
    { name: "Paid Date" },
    { name: "Actions", options: { filter: false, sort: false } },
  ];

  const data = feePayments.map((project) => [
    getDate(project.DueDate),
    project.studentName,
    "RM " + calculateTotalFee(project),
    project.classes?.map((classItem) => classItem.Descriptions).join(", "),
    project.paymentStatus ? getDate(project.paymentDate) : "Not Paid",
    <div className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
      <Link
        to={`/parent/fee/view/${project.id}`}
        className="mr-3 text-black rounded-full font-bold py-2 px-4 bg-blue-500"
      >
        View
      </Link>
      {!project.paymentStatus ? (
        <button
          onClick={() => confirmPayment(project.id)} // Pass the ID here
          className="text-white rounded-full font-bold py-2 px-4 hover:bg-blue-600"
          style={{
            backgroundColor: project.paymentStatus ? "#808080" : "#04086D",
          }}
        >
          Make a payment
        </button>
      ) : (
        <button
          className="bg-gray-400 rounded-full font-bold py-2 px-4"
          disabled
        >
          Paid
        </button>
      )}
    </div>,
  ]);

  const getMuiTheme = () =>
    createTheme({
      typography: {
        fontFamily: "Poppins",
      },
      components: {
        MUIDataTableHeadCell: {
          fixedHeaderCommon: {
            backgroundColor: "transparent",
          },
          styleOverrides: {
            root: {
              fontSize: "12px", // Adjusted font size
              textAlign: "center",
            },
          },
        },
        MUIDataTableBodyCell: {
          styleOverrides: {
            root: {
              fontSize: "12px", // Adjusted font size
            },
          },
        },
      },
    });

  const options = {
    responsive: "standard",
    selectableRows: "none",
    downloadOptions: { excludeColumns: [0, 3] },
    rowsPerPage: 5,
    rowsPerPageOptions: [5, 10, 20],
  };

  return (
    <>
      {loading ? (
        <CardLoading />
      ) : (
        <div
          className={
            "relative flex flex-col min-w-0 break-words w-full shadow-lg rounded " +
            (color === "light" ? "bg-white" : "bg-lightBlue-900 text-white")
          }
        >
          <div className="rounded-t mb-0 px-4 py-3 border-0">
            <div className="flex flex-wrap items-center">
              <div className="relative w-full px-4 max-w-full flex-grow flex-1">
                <h3
                  className={
                    "font-semibold text-lg " +
                    (color === "light" ? "text-blueGray-700" : "text-white")
                  }
                >
                  Fee Payment
                </h3>
                <p className="text-sm text-gray-500">
                  View and manage your fee payments here
                </p>
              </div>
            </div>
          </div>
          <div className="block w-full overflow-x-auto">
            <ThemeProvider theme={getMuiTheme()}>
              <MUIDataTable data={data} columns={columns} options={options} />
            </ThemeProvider>
          </div>
        </div>
      )}
    </>
  );
}

CardFee.defaultProps = {
  color: "light",
};
CardFee.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardFee;
