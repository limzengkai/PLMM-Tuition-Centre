import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import CardLoading from "../../../CardLoading";
import PropTypes from "prop-types";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import Swal from "sweetalert2";
import { db } from "../../../../../config/firebase";
import MUIDataTable from "mui-datatables";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@emotion/react";

function CardFeeManagementView() {
  const { id } = useParams();
  const [students, setStudents] = useState({});
  const [users, setUsers] = useState({});
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudentsAndUsers() {
      try {
        const studentDoc = await getDoc(doc(db, "students", id));
        const studentData = { id: studentDoc.id, ...studentDoc.data() };
        setStudents(studentData);

        const userDoc = await getDoc(doc(db, "users", studentData.parentId));
        const userData = { id: userDoc.id, ...userDoc.data() };
        setUsers(userData);

        const feeQuery = query(
          collection(db, "fees"),
          where("StudentID", "==", id),
          orderBy("DueDate", "desc")
        );
        const feeSnapshot = await getDocs(feeQuery);
        const feeData = [];

        for (const feeDoc of feeSnapshot.docs) {
          const feeClassesQuery = collection(feeDoc.ref, "Classes");
          const feeClassesSnapshot = await getDocs(feeClassesQuery);
          const feeClassesData = feeClassesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          feeData.push({
            id: feeDoc.id,
            feeDetail: feeDoc.data(),
            classes: feeClassesData.map((item) => ({
              id: item.id,
              Description: item.Descriptions,
              FeeAmount: item.FeeAmounts,
            })),
          });
        }

        setFees(feeData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching students and users data:", error);
        setLoading(false); // Ensure loading state is set to false even if there's an error
      }
    }
    fetchStudentsAndUsers();
  }, [id]);

  const handleDelete = async (feeId) => {
    try {
      const confirmResult = await Swal.fire({
        icon: "question",
        title: "Confirmation",
        text: "Are you sure you want to delete this fee?",
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No",
      });
      if (confirmResult.isConfirmed) {
        // Delete the fee document
        await deleteDoc(doc(db, "fees", feeId));

        // Get a reference to the "Classes" subcollection of the fee document
        const classesRef = collection(db, "fees", feeId, "Classes");

        // Get all documents in the "Classes" subcollection
        const querySnapshot = await getDocs(classesRef);

        // Delete each document in the "Classes" subcollection
        querySnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });

        // Display success message
        Swal.fire({
          icon: "success",
          title: "Fee Deleted",
          text: "Fee and its associated classes have been successfully deleted.",
          timer: 2000,
          timerProgressBar: true,
        });

        // Update the fees state to trigger re-render
        setFees((prevFees) => prevFees.filter((fee) => fee.id !== feeId));
      }
    } catch (error) {
      console.error("Error deleting fee:", error);
      // Display error message
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while deleting the fee. Please try again later.",
      });
    }
  };

  const handlePublish = async (feeId) => {
    try {
      const confirmResult = await Swal.fire({
        icon: "question",
        title: "Confirmation",
        text: "Are you sure you want to publish this fee?",
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No",
      });
      if (confirmResult.isConfirmed) {
        // Update the "publish" field of the fee document to true
        await updateDoc(doc(db, "fees", feeId), {
          publish: true,
        });
        // Display success message
        Swal.fire({
          icon: "success",
          title: "Fee Published",
          text: "Fee has been successfully published.",
          timer: 2000,
          timerProgressBar: true,
        });

        // Update the fees state to trigger re-render
        setFees((prevFees) =>
          prevFees.map((fee) =>
            fee.id === feeId
              ? { ...fee, feeDetail: { ...fee.feeDetail, publish: true } }
              : fee
          )
        );
      }
    } catch (error) {
      console.error("Error publishing fee:", error);
      // Display error message
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while publishing the fee. Please try again later.",
      });
    }
  };

  const handleUnpublish = async (feeId) => {
    try {
      const confirmResult = await Swal.fire({
        icon: "question",
        title: "Confirmation",
        text: "Are you sure you want to unpublish this fee?",
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No",
      });
      if (confirmResult.isConfirmed) {
        // Update the "publish" field of the fee document to false
        await updateDoc(doc(db, "fees", feeId), {
          publish: false,
        });
        // Display success message
        Swal.fire({
          icon: "success",
          title: "Fee Unpublished",
          text: "Fee has been successfully unpublished.",
          timer: 2000,
          timerProgressBar: true,
        });

        // Update the fees state to trigger re-render
        setFees((prevFees) =>
          prevFees.map((fee) =>
            fee.id === feeId
              ? { ...fee, feeDetail: { ...fee.feeDetail, publish: false } }
              : fee
          )
        );
      }
    } catch (error) {
      console.error("Error unpublishing fee:", error);
      // Display error message
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while unpublishing the fee. Please try again later.",
      });
    }
  };

  function truncateString(str, maxLength) {
    return str.length > maxLength ? str.substring(0, maxLength) + "..." : str;
  }

  const getDate = (timestamp) => {
    if (timestamp && timestamp.toDate) {
      const d = timestamp.toDate();
      const day = d.getDate();
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return "Unknown Date";
  };

  const data = fees.map((fee) => [
    getDate(fee.feeDetail.DueDate),
    fee.classes &&
      fee.classes.map((Classfee, index) => {
        const totalFeeAmount = Array.isArray(Classfee.FeeAmount)
          ? Classfee.FeeAmount.reduce((a, b) => {
              const numA = parseFloat(a) || 0;
              const numB = parseFloat(b) || 0;
              return numA + numB;
            }, 0).toFixed(2)
          : "0.00";
        return (
          <span key={index}>
            {`RM ${totalFeeAmount}`}
            <br />
          </span>
        );
      }),
    fee.classes &&
      fee.classes.map((Classfee, index) => {
        const description = Array.isArray(Classfee.Description)
          ? Classfee.Description.join(", ")
          : "";
        return (
          <span key={index}>
            {index > 0 && ", "}
            {index > 0 && <br />}
            {truncateString(description, 20)}
          </span>
        );
      }),
    fee.feeDetail.paymentStatus
      ? getDate(fee.feeDetail.paymentDate)
      : "Not Paid",
    fee.feeDetail.publish ? "Published" : "Not Published",
    fee.feeDetail.paymentStatus ? (
      <Link
        to={`/admin/fee/view/${id}/${fee.id}`}
        className="text-white rounded-full font-bold py-2 px-4 bg-blue-500 mr-3 hover:bg-blue-600"
      >
        View
      </Link>
    ) : (
      <>
        <div className="flex ">
          <Link
            to={{ pathname: `/admin/fee/view/${id}/${fee.id}`, state: fee }}
            className="text-white rounded-full font-bold py-2 px-4 bg-blue-500 mr-3 hover:bg-blue-600"
          >
            View
          </Link>
          <Link
            to={`/admin/fee/edit/${id}/${fee.id}`}
            className="text-white rounded-full font-bold py-2 px-4 bg-green-500 mr-3 hover:bg-green-600"
          >
            Edit
          </Link>
          {fee.feeDetail.paymentStatus ? (
            <span className="text-white rounded-full font-bold py-2 px-4 bg-gray-500 mr-3">
              The fee is already paid
            </span>
          ) : fee.feeDetail.publish ? (
            <>
              <button
                onClick={() => {
                  handleUnpublish(fee.id);
                }}
                className="text-white rounded-full font-bold py-2 px-4 bg-gray-500 mr-3 hover:bg-gray-600"
              >
                Unpublish
              </button>
              <button
                onClick={() => {
                  handleDelete(fee.id);
                }}
                className="text-white rounded-full font-bold py-2 px-4 bg-red-500 mr-3 hover:bg-red-600"
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  handlePublish(fee.id);
                }}
                className="text-white rounded-full font-bold py-2 px-4 bg-gray-500 mr-3 hover:bg-gray-600"
              >
                Publish
              </button>
              <button
                onClick={() => {
                  handleDelete(fee.id);
                }}
                className="text-white rounded-full font-bold py-2 px-4 bg-red-500 mr-3 hover:bg-red-600"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </>
    ),
  ]);

  const columns = [
    {
      name: "Due Date",
      options: {
        sortCompare: (order) => (a, b) => {
          const dateA = new Date(a.data);
          const dateB = new Date(b.data);
          return order === "asc" ? dateA - dateB : dateB - dateA;
        },
      },
    },
    { name: "Fee", options: { sort: false } },
    { name: "Description", options: { sort: false } },
    { name: "Paid Date" },
    { name: "Status" },
    { name: "Action", options: { filter: false, sort: false } },
  ];

  const getMuiTheme = () =>
    createTheme({
      typography: { fontFamily: "Poppins" },
      overrides: {
        MUIDataTableHeadCell: { root: { fontSize: "12px" } },
        MUIDataTableBodyCell: { root: { fontSize: "12px" } },
      },
    });

  const options = {
    responsive: "standard",
    selectableRows: "none",
    search: false,
    download: false,
    print: false,
    filter: false,
    viewColumns: false,
    rowsPerPage: 5,
    rowsPerPageOptions: [5, 10, 20],
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {loading ? (
        <CardLoading loading={loading} />
      ) : (
        <>
          <div className="flex items-center mb-4 font-bold text-xl">
            <Link to="/admin/fee" className="text-blue-500 hover:underline">
              Fee Management
            </Link>
            <span className="mx-2">&nbsp;/&nbsp;</span>
            <span className="text-gray-500">View Student's fee</span>
          </div>
          <div className="grid grid-cols-2 gap-y-3 mt-2 m-0 px-8">
            <div className="font-bold text-lg col-span-2 underline">
              User Information
            </div>
            <div className="font-bold">
              Student Name:{" "}
              <span className="font-normal">
                {students.firstName} {students.lastName}
              </span>
            </div>
            <div className="font-bold">
              Academic Level:{" "}
              <span className="font-normal">{students.educationLevel}</span>
            </div>
            <div className="font-bold">
              Parent Name:{" "}
              <span className="font-normal">
                {users.firstName} {users.lastName}
              </span>
            </div>
            <div className="font-bold">
              Parent Phone number:{" "}
              <span className="font-normal">{users.contactNumber}</span>
            </div>
            <div className="font-bold col-span-2">
              Address: <span className="font-normal">{users.address}</span>
            </div>
            <div className="font-bold">
              State: <span className="font-normal">{users.state}</span>
            </div>
            <div className="font-bold">
              City: <span className="font-normal">{users.city}</span>
            </div>
          </div>
          <div className="overflow-x-auto mt-4">
            <ThemeProvider theme={getMuiTheme()}>
              <MUIDataTable data={data} columns={columns} options={options} />
            </ThemeProvider>
          </div>
          <div className="flex justify-center">
            <button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold py-2 px-4 mt-4">
              <Link
                to={`/admin/fee/add/${id}`}
                className="text-white rounded-full font-bold py-2 px-4 bg-blue-500 mr-3 hover:bg-blue-600"
              >
                Add Fee
              </Link>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

CardFeeManagementView.defaultProps = {
  color: "light",
};

CardFeeManagementView.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardFeeManagementView;
