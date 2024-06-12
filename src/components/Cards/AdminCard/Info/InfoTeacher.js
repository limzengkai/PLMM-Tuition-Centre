import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import MUIDataTable from "mui-datatables";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@emotion/react";
import { storage, db } from "../../../../config/firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { Link, useLocation } from "react-router-dom";
import Swal from "sweetalert2";

export default function InfoTeacher({ color }) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDescription, setEditDescription] = useState(null);
  const [editStatus, setEditStatus] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null); // Track selected teacher for editing
  const [photo, setPhoto] = useState(null); // State for storing photo
  const location = useLocation();

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const teachersCollection = await getDocs(collection(db, "teacher"));
      const teachersData = await Promise.all(
        teachersCollection.docs.map(async (teacherDoc) => {
          const teacher = teacherDoc.data();
          // Fetch corresponding user details
          const userDoc = doc(db, "users", teacher.userID);
          const userSnapshot = await getDoc(userDoc);
          const userData = userSnapshot.data();
          console.log("DATA: ", userData);
          return {
            id: teacherDoc.id,
            name: userData.firstName + " " + userData.lastName,
            description: teacher.description || null,
            photo: teacher.photo || null,
            status: teacher.status || false,
          };
        })
      );
      setTeachers(teachersData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setLoading(false);
    }
  };

  const handleEdit = (id, name, photo, description, status) => {
    // Set the selected teacher for editing
    setSelectedTeacher({ id, name, photo, description, status });
    // Set initial values for editing
    setEditDescription(description);
    setEditStatus(status);
  };

  const handleSaveEdit = async () => {
    try {
      console.log("Editing teacher with ID:", selectedTeacher.id);
      // Update teacher details in the database
      const teacherDoc = doc(db, "teacher", selectedTeacher.id);
      await updateDoc(teacherDoc, {
        description: editDescription,
        status: editStatus === "true" ? true : false,
      });
      console.log(
        `Teacher with ID ${selectedTeacher.id} updated successfully.`
      );
      // Reload the teacher data
      fetchTeachers();
      // Close the edit modal
      setSelectedTeacher(null);
      setEditDescription(null);
      setEditStatus(null);
    } catch (error) {
      console.error("Error updating teacher:", error);
      // Display error message
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update teacher. Please try again later.",
      });
    }
  };

  const removePhoto = () => {
    // Placeholder function for removing photo
    console.log("Removing photo");
    // Implement the logic to remove the photo from storage or reset the photo state variable
    setPhoto(null); // Example of resetting the photo state variable
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPhoto(file);
    }
  };

  const handleUpload = async (id) => {
    if (photo) {
      try {
        console.log("Uploading image...");
        console.log("Uploading image for teacher with ID:", id);
        const storageRef = ref(storage, `teacherImages/${id}`);
        await uploadBytes(storageRef, photo);
        const url = await getDownloadURL(storageRef);
        await updateDoc(doc(db, "teacher", id), {
          photo: url,
        });
        setPhoto(null);
        fetchTeachers();
        // Show success message
        Swal.fire("Uploaded!", "Your file has been uploaded.", "success");
      } catch (error) {
        console.error("Error uploading image:", error);
        // Show error message
        Swal.fire("Error!", "Failed to upload image.", "error");
      }
    }
  };

  const columns = [
    { name: "NAME" },
    {
      name: "DESCRIPTION",
      options: {
        customBodyRender: (value) => <div className="w-[300px]">{value}</div>,
      },
    },
    {
      name: "PHOTO",
      options: {
        customBodyRender: (value) => (
          <img src={value} alt="Teacher" width={100} />
        ),
      },
    },
    {
      name: "STATUS",
      options: {
        customBodyRender: (value) => (
          <span>{value ? "Published" : "Not Published"}</span>
        ),
      },
    },
    {
      name: "ACTIONS",
      options: {
        customBodyRender: (value, tableMeta, updateValue) => (
          <button onClick={() => handleEdit(...value)}>Edit</button>
        ),
        filter: false,
        sort: false,
      },
    },
  ];

  const data = teachers.map((teacher) => [
    teacher.name,
    teacher.description ? teacher.description : "No description available",
    teacher.photo ? teacher.photo : "No photo available",
    teacher.status,
    [
      teacher.id,
      teacher.name,
      teacher.photo,
      teacher.description,
      teacher.status,
    ],
  ]);

  const getMuiTheme = () =>
    createTheme({
      typography: {
        fontFamily: "Poppins",
      },
      components: {
        MuiTableCell: {
          styleOverrides: {
            root: {
              fontSize: "12px",
            },
          },
        },
      },
    });

  const options = {
    responsive: "standard",
    selectableRows: "none",
    rowsPerPage: 5,
    rowsPerPageOptions: [5, 10, 20],
  };

  return (
    <>
      <div
        className={
          "relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded " +
          (color === "light" ? "bg-white" : "bg-lightBlue-900 text-white")
        }
      >
        <div className="rounded-t mb-0 px-4 py-3 border-0">
          <div className="flex flex-wrap items-center">
            <div className="relative w-full mt-4 max-w-full flex-grow flex-1">
              <h1
                className={
                  "font-semibold text-2xl " +
                  (color === "light" ? "text-blueGray-700" : "text-white")
                }
              >
                Teacher Info Management
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
                  " rounded-r-lg font-bold py-2 px-4 m-0" +
                  (location.pathname.includes("/admin/info/teachers")
                    ? "  bg-blue-500 text-white hover:text-lightBlue-100"
                    : " text-black  hover:bg-blue-500 hover:text-white")
                }
              >
                Teacher Home Info
              </Link>
            </div>
            <div></div>
          </div>
        </div>

        <div className="block w-full overflow-x-auto">
          <ThemeProvider theme={getMuiTheme()}>
            <MUIDataTable data={data} columns={columns} options={options} />
          </ThemeProvider>
        </div>
      </div>

      {/* Edit Modal */}
      {selectedTeacher && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800/50">
          <div className="bg-white p-4 rounded shadow-lg">
            <h2 className="text-xl mb-4">Edit Teacher Details</h2>
            <div className="mb-5">
              <div className="flex items-center mb-2">
                <p className="font-semibold mr-2">Name:</p>
                <p>{selectedTeacher.name}</p>
              </div>
              <div className="flex items-center mb-2">
                <p className="font-semibold mr-2 ">Photo:</p>
                <img src={selectedTeacher.photo} alt="Teacher" width={100} />
              </div>
              <div className="block w-full overflow-x-auto p-4">
                <input
                  type="file"
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                >
                  Choose File
                </label>
                <button
                  onClick={() => {
                    handleUpload(selectedTeacher.id);
                  }}
                  disabled={!photo}
                  className={`ml-2 cursor-pointer bg-${
                    photo ? "green" : "gray"
                  }-500 hover:bg-${
                    photo ? "green" : "gray"
                  }-600 text-white font-bold py-2 px-4 rounded ${
                    photo ? "opacity-100" : "opacity-50"
                  }`}
                >
                  Upload
                </button>
                {photo && (
                  <button
                    onClick={removePhoto}
                    className="ml-2 cursor-pointer bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <label htmlFor="description" className="mr-2">
              Description :
            </label>
            <textarea
              id="description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="border p-2 w-full mb-4"
              placeholder="Enter teacher description"
              rows="4"
            />
            <label htmlFor="status" className="mr-2">
              Status:
            </label>
            <select
              id="status"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="border p-2 mb-4 text-sm w-full"
            >
              <option value="true">Published</option>
              <option value="false">Not Published</option>
            </select>
            <div className="flex justify-end">
              <button
                onClick={handleSaveEdit}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded mr-2"
              >
                Save
              </button>
              <button
                onClick={() => setSelectedTeacher(null)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

InfoTeacher.defaultProps = {
  color: "light",
};

InfoTeacher.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};
