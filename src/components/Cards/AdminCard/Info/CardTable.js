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
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Link, useLocation } from "react-router-dom";
import Swal from "sweetalert2";

export default function CardTable({ color }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [photo, setPhoto] = useState(null);
  const [editName, setEditName] = useState(null);
  const location = useLocation();

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const imagesCollection = await getDocs(collection(db, "images"));
      const imagesData = await Promise.all(
        imagesCollection.docs.map(async (imageDoc) => {
          const imageUrl = await getDownloadURL(
            ref(storage, imageDoc.data().path)
          );

          return {
            id: imageDoc.id,
            name: imageDoc.data().name,
            url: imageUrl,
            path: imageDoc.data().path,
          };
        })
      );
      setImages(imagesData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching images:", error);
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    try {
      if (!photo) {
        Swal.fire({
          icon: "error",
          text: "Please select an image to upload!",
        });
        return;
      }

      // Check if the selected file is an image
      if (!photo.type.startsWith("image/")) {
        Swal.fire({
          icon: "error",
          text: "Please upload an image file!",
        });
        return;
      }

      const fileRef = ref(
        storage,
        `images/${new Date().getTime()}_${photo.name}`
      );

      Swal.fire({
        title: "Upload Image",
        text: "Are you sure you want to upload this image?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, upload it!",
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            await uploadBytes(fileRef, photo);
            await addDoc(collection(db, "images"), {
              name: photo.name,
              path: fileRef.fullPath,
            });
            fetchImages();
            setPhoto(null);

            Swal.fire({
              icon: "success",
              text: "Image uploaded successfully!",
            });
          } catch (error) {
            console.error("Error uploading image:", error);
            Swal.fire({
              icon: "error",
              text: "Error uploading image",
            });
          }
        }
      });
    } catch (error) {
      console.error("Error handling upload:", error);
      Swal.fire({
        icon: "error",
        text: "Error handling upload",
      });
    }
  };

  const handleDelete = async (id, path) => {
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
          await deleteObject(ref(storage, path));
          await deleteDoc(doc(db, "images", id));
          fetchImages();
          Swal.fire("Deleted!", "Your image has been deleted.", "success");
        } catch (error) {
          console.error("Error deleting image:", error);
          Swal.fire({
            icon: "error",
            text: "Error deleting image",
          });
        }
      }
    });
  };

  const handleEdit = async (id, newName) => {
    Swal.fire({
      title: "Edit Image Name",
      text: "Are you sure you want to update this image name?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, update it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const imageDoc = doc(db, "images", id);
          await updateDoc(imageDoc, { name: newName });
          fetchImages();
          setEditName(null);
          Swal.fire({
            icon: "success",
            text: "Image name updated successfully!",
          });
        } catch (error) {
          console.error("Error updating image name:", error);
          Swal.fire({
            icon: "error",
            text: "Error updating image name",
          });
        }
      }
    });
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
  };

  const columns = [
    { name: "NAME" },
    {
      name: "IMAGE",
      options: {
        customBodyRender: (value) => (
          <img src={value} alt="Uploaded" width={100} />
        ),
      },
    },
    {
      name: "ACTIONS",
      options: {
        customBodyRender: (value) => (
          <>
            <button
              onClick={() => handleDelete(value.id, value.path)}
              className="text-red-500 mr-2"
            >
              Delete
            </button>
            <button
              onClick={() => setEditName(value)}
              className="text-blue-500"
            >
              Edit
            </button>
          </>
        ),
        filter: false,
        sort: false,
      },
    },
  ];

  const data = images.map((image) => [
    image.name,
    image.url,
    { id: image.id, path: image.path },
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
                Image Upload and Management
              </h1>
            </div>
          </div>
          <div className="flex justify-between mb-3 mt-5 border-t border-gray-300 pt-3">
            <div className="flex">
              <Link
                to="/admin/info"
                className={
                  " rounded-l-lg font-bold py-2 px-4" +
                  (location.pathname === "/admin/info"
                    ? " bg-blue-500 text-white hover:text-lightBlue-100"
                    : " text-black hover:text-white")
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
            onClick={handleUpload}
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
        <div className="block w-full overflow-x-auto">
          <ThemeProvider theme={getMuiTheme()}>
            <MUIDataTable data={data} columns={columns} options={options} />
          </ThemeProvider>
        </div>
      </div>

      {editName && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800/50">
          <div className="bg-white p-4 rounded shadow-lg">
            <h2 className="text-xl mb-4">Edit Image Name</h2>
            <input
              type="text"
              value={editName.name}
              onChange={(e) =>
                setEditName({ ...editName, name: e.target.value })
              }
              className="border p-2 w-full mb-4"
            />
            <div className="flex justify-end">
              <button
                onClick={() => handleEdit(editName.id, editName.name)}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded mr-2"
              >
                Save
              </button>
              <button
                onClick={() => setEditName(null)}
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

CardTable.defaultProps = {
  color: "light",
};

CardTable.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};
