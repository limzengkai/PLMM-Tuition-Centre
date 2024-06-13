import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CardLoading from "../../../CardLoading";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../../../config/firebase";
import MUIDataTable from "mui-datatables";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@emotion/react";
import Swal from "sweetalert2";

const VoucherVisibility = Object.freeze({
  PUBLIC: "public",
  PRIVATE: "private",
});

const DiscountType = Object.freeze({
  PERCENTAGE: "percentage",
  NUMERIC: "numeric",
});

function CardVoucherManagement() {
  const [vouchers, setVouchers] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchVouchers() {
      try {
        const vouchersSnapshot = await getDocs(collection(db, "vouchers"));
        const vouchersData = vouchersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setVouchers(vouchersData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching vouchers data:", error);
      }
    }
    fetchVouchers();
  }, []);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUser(usersData);
      } catch (error) {
        console.error("Error fetching users data:", error);
      }
    }
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteDoc(doc(db, "vouchers", id));
          setVouchers(vouchers.filter((voucher) => voucher.id !== id));
          Swal.fire("Deleted!", "Your voucher has been deleted.", "success");
        } catch (error) {
          console.error("Error deleting voucher:", error);
          Swal.fire(
            "Error!",
            "There was an error deleting the voucher.",
            "error"
          );
        }
      }
    });
  };

  const getFullNameById = (UserID) => {
    const userObj = user.find((user) => user.id === UserID);
    return userObj ? `${userObj.firstName} ${userObj.lastName}` : "-";
  };

  const data = vouchers.map((voucher) => {
    const discountType =
      voucher.discountType === DiscountType.PERCENTAGE
        ? "Percentage"
        : "Numeric";
    const visibility =
      voucher.visibility === VoucherVisibility.PUBLIC ? "Public" : "Private";
    const expiryDate = voucher.expiryDate.toDate();
    const expiryDateString = `${expiryDate.getDate()}/${
      expiryDate.getMonth() + 1
    }/${expiryDate.getFullYear()}`;
    const discountValue =
      voucher.discountType === DiscountType.PERCENTAGE
        ? `${voucher.discountValue}%`
        : `RM ${voucher.discountValue}`;

    return [
      voucher.code,
      discountType,
      discountValue,
      expiryDateString,
      voucher.isActive ? "Active" : "Inactive",
      visibility,
      voucher.userId || "-",
      getFullNameById(voucher.usedBy) || "-",
      <div className="flex justify-between">
        <Link
          to={`/admin/fee/voucher/view/${voucher.id}`}
          className="text-white rounded-full font-bold py-2 px-4 bg-blue-500"
        >
          View
        </Link>
        <Link
          to={`/admin/fee/voucher/edit/${voucher.id}`}
          className="text-white rounded-full font-bold py-2 px-4 bg-green-500"
        >
          Edit
        </Link>
        <button
          onClick={() => handleDelete(voucher.id)}
          className="text-white rounded-full font-bold py-2 px-4 bg-red-500"
        >
          Delete
        </button>
      </div>,
    ];
  });

  const columns = [
    { name: "Code" },
    { name: "Discount Type" },
    { name: "Discount Value" },
    { name: "Expiry Date" },
    { name: "Status" },
    { name: "Visibility" },
    { name: "User ID" },
    { name: "Used By" },
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
      excludeColumns: [7],
    },
    rowsPerPage: 5,
    rowsPerPageOptions: [5, 10, 20],
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Voucher Management</h2>
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
            location.pathname === "/admin/fee/voucher"
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
        </div>
      )}
      <div className="flex justify-center my-4">
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          <Link to="/admin/fee/voucher/add" className="no-underline text-white">
            Add Voucher
          </Link>
        </button>
      </div>
    </div>
  );
}

export default CardVoucherManagement;
