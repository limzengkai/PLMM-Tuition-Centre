import React, { useEffect, useState } from "react";
import MUIDataTable from "mui-datatables";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@emotion/react";
import Swal from "sweetalert2";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../../../config/firebase";
import { Link, useLocation } from "react-router-dom";

function CardAnnouncement() {
  const [announcements, setAnnouncements] = useState([]);
  const location = useLocation();
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const querySnapshot = await getDocs(collection(db, "announcements"));
    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setAnnouncements(data);
  };

  const handleAdd = async (newData) => {
    try {
      const currentDate = new Date().toISOString().split("T")[0]; // Format date as YYYY-MM-DD
      await addDoc(collection(db, "announcements"), {
        ...newData,
        Date: currentDate,
      });
      Swal.fire("Added!", "Your announcement has been added.", "success");
    } catch (error) {
      Swal.fire(
        "Error!",
        "An error occurred while adding the announcement.",
        "error"
      );
    }
    fetchData();
  };

  const handleUpdate = async (updatedData) => {
    try {
      const announcementDoc = doc(db, "announcements", updatedData.id);
      await updateDoc(announcementDoc, updatedData);
      Swal.fire("Updated!", "Your announcement has been updated.", "success");
    } catch (error) {
      Swal.fire(
        "Error!",
        "An error occurred while updating the announcement.",
        "error"
      );
    }
    fetchData();
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "announcements", id));
    fetchData();
  };

  const showAddAnnouncementModal = () => {
    Swal.fire({
      title: "Add Announcement",
      html: `<textarea id="swal-input" class="swal2-textarea" placeholder="Announcement" style="width:80%; height:100px;"></textarea>`,
      focusConfirm: false,
      showCancelButton: true,
      cancelButtonText: "Cancel",
      preConfirm: () => {
        const announcement = document.getElementById("swal-input").value;
        if (!announcement) {
          Swal.showValidationMessage("Please enter an announcement");
          return;
        }
        return { Announcement: announcement };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        handleAdd(result.value);
      }
    });
  };

  const showEditAnnouncementModal = (announcement) => {
    Swal.fire({
      title: "Edit Announcement",
      html: `<textarea id="swal-input" class="swal2-textarea" placeholder="Announcement" style="width:80%; height:100px;">${announcement.Announcement}</textarea>`,
      focusConfirm: false,
      showCancelButton: true,
      cancelButtonText: "Cancel",
      preConfirm: () => {
        const announcementText = document.getElementById("swal-input").value;
        if (!announcementText) {
          Swal.showValidationMessage("Please enter an announcement");
          return;
        }
        return { ...announcement, Announcement: announcementText };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        handleUpdate(result.value);
      }
    });
  };

  const confirmDelete = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, cancel!",
    }).then((result) => {
      if (result.isConfirmed) {
        handleDelete(id);
        Swal.fire("Deleted!", "Your announcement has been deleted.", "success");
      }
    });
  };

  const columns = [
    {
      name: "Date",
    },
    {
      name: "Announcement",
    },
    {
      name: "Actions",
      options: {
        customBodyRender: (value, tableMeta, updateValue) => {
          const announcement = announcements[tableMeta.rowIndex];
          return (
            <div className="flex">
              <button
                onClick={() => showEditAnnouncementModal(announcement)}
                className="bg-blue-500 text-white active:bg-blue-600 font-bold uppercase text-xs px-4 py-2 rounded outline-none focus:outline-none ease-linear transition-all duration-150 mr-2"
              >
                Edit
              </button>
              <button
                onClick={() => confirmDelete(announcement.id)}
                className="bg-red-500 text-white active:bg-red-600 font-bold uppercase text-xs px-4 py-2 rounded outline-none focus:outline-none ease-linear transition-all duration-150"
              >
                Delete
              </button>
            </div>
          );
        },
      },
    },
  ];

  const data = announcements.map((announcement) => [
    announcement.Date,
    announcement.Announcement,
    null, // Actions column
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
    download: false,
    filter: false,
    selectableRows: "none",
    print: false,
    search: false,
    viewColumns: false,
    rowsPerPage: 5,
    rowsPerPageOptions: [5, 10, 20],
  };

  return (
    <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
      <div className="rounded-t mb-0 px-4 py-3 border-0">
        <div className="flex flex-wrap items-center">
          <div className="relative w-full mt-4 max-w-full flex-grow flex-1">
            <h1 className={"font-semibold text-2xl text-blueGray-700"}>
              Announcement
            </h1>
          </div>
        </div>
        <div className="flex justify-between mb-3 mt-5 border-t border-gray-300 pt-3">
          <div className="flex">
            <Link
              to="/admin/info"
              className={
                "rounded-l-lg font-bold py-2 px-4" +
                (location.pathname === "/admin/info"
                  ? " bg-blue-500 text-white hover:text-lightBlue-100"
                  : " text-black  hover:bg-blue-500 hover:text-white")
              }
            >
              Homepage slides
            </Link>

            <Link
              to="/admin/info/teachers"
              className={
                "font-bold py-2 px-4 m-0" +
                (location.pathname.includes("/admin/info/teachers")
                  ? "  bg-blue-500 text-white hover:text-lightBlue-100"
                  : " text-black  hover:bg-blue-500 hover:text-white")
              }
            >
              Teacher Home Info
            </Link>

            <Link
              to="/admin/info/annoucement"
              className={
                "rounded-r-lg font-bold py-2 px-4 m-0" +
                (location.pathname.includes("/admin/info/annoucement")
                  ? "  bg-blue-500 text-white hover:text-lightBlue-100"
                  : " text-black  hover:bg-blue-500 hover:text-white")
              }
            >
              Annoucement Info
            </Link>
          </div>
          <div></div>
        </div>
      </div>
      <div className="rounded-t mb-0 px-4 py-3 bg-transparent">
        <div className="flex flex-wrap items-center">
          <div className="relative w-full max-w-full flex-grow flex-1 text-right">
            <button
              onClick={showAddAnnouncementModal}
              className="bg-blue-500 text-white active:bg-blue-600 font-bold uppercase text-xs px-4 py-2 rounded outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
            >
              Add Announcement
            </button>
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

export default CardAnnouncement;
