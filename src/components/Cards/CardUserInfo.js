import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../config/context/AuthContext"; // Import your AuthContext
import { db, auth, storage } from "../../config/firebase"; // Assuming you have auth and storage from Firebase config
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import CardLoading from "./CardLoading";
import Swal from "sweetalert2";
import profile from "../../assets/img/profile.jpg";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"; // Import ref and uploadBytes for file uploads
import DatePicker from "react-datepicker"; // Import DatePicker for Birth Date
import {
  getStates,
  getCities,
  getPostcodes,
} from "@ringgitplus/malaysia-states"; // Import Malaysian states, cities, and postcodes

function CardUserInfo() {
  const { currentUser } = useContext(AuthContext); // Access currentUser from AuthContext
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    birthDate: new Date(), // Change to birthDate
    email: "",
    contactNumber: "",
    address: "",
    city: "",
    state: "",
    postcode: "",
  });
  const [photo, setPhoto] = useState(null); // Change to null to represent no file selected
  const [photoURL, setPhotoURL] = useState(null); // Add this state to store the photo URL

  useEffect(() => {
    setLoading(true);
    const fetchUserInfo = async () => {
      try {
        if (currentUser) {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserInfo({
              ...data,
              birthDate: data.birthDate ? data.birthDate.toDate() : new Date(),
            });
          } else {
            console.log("No such document!");
          }
          setPhotoURL(currentUser.photoURL);
          setLoading(false);
        } else {
          console.log("No user signed in");
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    fetchUserInfo();
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserInfo({ ...userInfo, [name]: value });
  };

  const handleDateChange = (date) => {
    setUserInfo({ ...userInfo, birthDate: date });
  };

  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    setUserInfo({ ...userInfo, state: selectedState, city: "", postcode: "" });
  };

  const handleCityChange = (e) => {
    const selectedCity = e.target.value;
    setUserInfo({ ...userInfo, city: selectedCity, postcode: "" });
  };

  const handleContactNumberChange = (e) => {
    const contactNumberPattern = /^\d{3}-\d{7,8}$/;
    const { value } = e.target;
    if (contactNumberPattern.test(value) || value === "") {
      setUserInfo({ ...userInfo, contactNumber: value });
    } else {
      Swal.fire({
        icon: "error",
        text: "Invalid contact number format (xxx-xxxxxxx or xxx-xxxxxxxx).",
      });
    }
  };

  const validateContactNumber = (number) => {
    const contactNumberPattern = /^\d{3}-\d{7,8}$/;
    return contactNumberPattern.test(number);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);

        // Check if email has changed
        if (userInfo.email !== currentUser.email) {
          // Show double confirmation if email is changed
          Swal.fire({
            title: "Are you sure?",
            text: "Changing your email address will require verification. Are you sure you want to proceed?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, update my email!",
            html: `
              <input id="password" type="password" class="swal2-input" placeholder="Enter your current password">
            `,
          }).then(async (result) => {
            if (result.isConfirmed) {
              const password = Swal.getPopup().querySelector("#password").value;

              // Reauthenticate the user
              const credential = EmailAuthProvider.credential(
                auth.currentUser.email,
                password
              );
              try {
                await reauthenticateWithCredential(
                  auth.currentUser,
                  credential
                );
              } catch (error) {
                // Handle incorrect password
                Swal.fire({
                  icon: "error",
                  title: "Incorrect Password",
                  text: "Please enter your correct password.",
                });
                return; // Stop further execution
              }

              // Proceed with email update
              await updateEmail(auth.currentUser, userInfo.email);

              // Display a message to the user asking them to verify their new email
              Swal.fire({
                icon: "info",
                text: "A verification email has been sent to your new email address. Please verify it before updating.",
              });
              sendEmailVerification(auth.currentUser);

              // Update other user information in Firestore database
              await updateDoc(docRef, userInfo);

              Swal.fire({
                icon: "success",
                text: "User information updated successfully!",
              });
            }
          });
        } else {
          // Show single confirmation if email is not changed
          Swal.fire({
            title: "Are you sure?",
            text: "You are about to update your user information. Are you sure you want to proceed?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, update my information!",
          }).then(async (result) => {
            if (result.isConfirmed) {
              // Update other user information in Firestore database
              await updateDoc(docRef, userInfo);

              Swal.fire({
                icon: "success",
                text: "Other user information updated successfully!",
              });
            }
          });
        }
      } else {
        console.log("No user signed in");
      }
    } catch (error) {
      console.error("Error updating user information:", error);
      Swal.fire({
        icon: "error",
        text: "Error updating user information",
      });
    }
  };

  const uploadImage = async () => {
    try {
      if (photo) {
        // Validate file type
        const validImageTypes = ["image/jpeg", "image/png", "image/gif"];
        if (!validImageTypes.includes(photo.type)) {
          Swal.fire({
            icon: "error",
            text: "Unsupported file format. Please upload an image file (jpg, png, gif).",
          });
          return;
        }

        const confirmUpload = await Swal.fire({
          title: "Upload Profile Picture",
          text: "Are you sure you want to upload this profile picture?",
          icon: "question",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Yes, upload it!",
          cancelButtonText: "No, cancel",
        });

        if (confirmUpload.isConfirmed) {
          setLoading(true);
          const fileRef = ref(storage, `users/${currentUser.uid}/profile.png`);
          await uploadBytes(fileRef, photo);
          const photoURL = await getDownloadURL(fileRef);

          // Update user's photoURL in Firebase Auth
          await updateProfile(auth.currentUser, { photoURL });

          // Update local state with new photoURL
          setPhotoURL(photoURL);
          setLoading(false);
          setPhoto(null);
          Swal.fire({
            icon: "success",
            text: "Profile picture uploaded successfully!",
          }).then(() => {
            window.location.reload();
          });
        }
      } else {
        Swal.fire({
          icon: "error",
          text: "Please select a file to upload!",
        });
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      Swal.fire({
        icon: "error",
        text: "Error uploading profile picture",
      });
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
  };

  const states = getStates();
  const cities = userInfo.state ? getCities(userInfo.state) : [];
  const postcodes = userInfo.city
    ? getPostcodes(userInfo.state, userInfo.city)
    : [];

  return (
    <>
      {loading ? (
        <CardLoading loading={loading} />
      ) : (
        <>
          <div className="flex flex-col items-center m-6">
            <img
              className="w-40 h-40 p-1 rounded-full ring-2 ring-gray-300 dark:ring-gray-500 mb-4"
              src={currentUser?.photoURL ? photoURL : profile}
              alt="Bordered avatar"
            />
            <div className="flex">
              <input
                type="file"
                id="fileInput"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                style={{ display: "none" }}
              />
              <label
                htmlFor="fileInput"
                className="cursor-pointer bg-blue-500 text-white active:bg-blue-600 font-bold uppercase text-sm px-4 py-2 rounded shadow hover:shadow-lg mr-2"
              >
                Select Photo
              </label>
              <button
                disabled={!photo}
                onClick={uploadImage}
                className={`bg-${
                  photo ? "blue" : "gray"
                }-500 text-white active:bg-${
                  photo ? "blue" : "gray"
                }-600 font-bold uppercase text-sm px-4 py-2 rounded shadow ${
                  photo ? "hover:shadow-lg" : ""
                }`}
                style={{ cursor: photo ? "pointer" : "not-allowed" }}
              >
                Upload
              </button>
              {photo && (
                <button
                  onClick={removePhoto}
                  className="bg-red-500 text-white active:bg-red-600 font-bold uppercase text-sm px-4 mx-2 py-2 rounded shadow hover:shadow-lg mr-2"
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-wrap">
            {/* Form fields */}
            {/* First Name */}
            <div className="w-full lg:w-6/12 px-4">
              <div className="relative w-full mb-3">
                <label
                  className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                  htmlFor="firstName"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={userInfo.firstName}
                  onChange={handleInputChange}
                  className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                  placeholder="User's First Name"
                />
              </div>
            </div>
            {/* Last Name */}
            <div className="w-full lg:w-6/12 px-4">
              <div className="relative w-full mb-3">
                <label
                  className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                  htmlFor="lastName"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={userInfo.lastName}
                  onChange={handleInputChange}
                  className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                  placeholder="User's Last Name"
                />
              </div>
            </div>

            <div className="w-full lg:w-6/12 px-4">
              <div className="relative w-full mb-3">
                <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                  Contact Number
                </label>
                <input
                  type="text"
                  className={`border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150 ${
                    !validateContactNumber(userInfo.contactNumber) &&
                    userInfo.contactNumber !== ""
                      ? "border-red-500"
                      : ""
                  }`}
                  placeholder="xxx-xxxxxxx or xxx-xxxxxxxx"
                  value={userInfo.contactNumber}
                  onChange={(e) =>
                    handleContactNumberChange(e, "contactNumber")
                  }
                  required
                />
                {!validateContactNumber(userInfo.contactNumber) &&
                  userInfo.contactNumber !== "" && (
                    <small className="text-red-500">
                      Invalid contact number format (01x-xxxxxxx or
                      011-xxxxxxxx).
                    </small>
                  )}
              </div>
            </div>

            {/* Birth Date */}
            <div className="w-full lg:w-6/12 px-4">
              <div className="relative w-full mb-3">
                <label
                  className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                  htmlFor="birthDate"
                >
                  Birth Date
                </label>
                <DatePicker
                  selected={userInfo.birthDate}
                  onChange={handleDateChange}
                  dateFormat="dd/MM/yyyy"
                  showYearDropdown
                  className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                  placeholderText="Select Birth Date"
                />
              </div>
            </div>
            {/* Email */}
            <div className="w-full lg:w-6/12 px-4">
              <div className="relative w-full mb-3">
                <label
                  className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={userInfo.email}
                  onChange={handleInputChange}
                  disabled
                  className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-gray-300 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                  placeholder="User's Email"
                />
              </div>
            </div>
            {/* Address */}
            <div className="w-full lg:w-6/12 px-4">
              <div className="relative w-full mb-3">
                <label
                  className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                  htmlFor="address"
                >
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={userInfo.address}
                  onChange={handleInputChange}
                  className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                  placeholder="User's Address"
                />
              </div>
            </div>
            {/* State */}
            <div className="w-full lg:w-6/12 px-4">
              <div className="relative w-full mb-3">
                <label
                  className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                  htmlFor="state"
                >
                  State
                </label>
                <select
                  id="state"
                  name="state"
                  value={userInfo.state}
                  onChange={handleStateChange}
                  className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                >
                  <option value="">Select State</option>
                  {states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* City */}
            <div className="w-full lg:w-6/12 px-4">
              <div className="relative w-full mb-3">
                <label
                  className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                  htmlFor="city"
                >
                  City
                </label>
                <select
                  id="city"
                  name="city"
                  value={userInfo.city}
                  onChange={handleCityChange}
                  className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                  disabled={!userInfo.state}
                >
                  <option value="">Select City</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Postcode */}
            <div className="w-full lg:w-6/12 px-4">
              <div className="relative w-full mb-3">
                <label
                  className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                  htmlFor="postcode"
                >
                  Postcode
                </label>
                <select
                  id="postcode"
                  name="postcode"
                  value={userInfo.postcode}
                  onChange={handleInputChange}
                  className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                  disabled={!userInfo.city}
                >
                  <option value="">Select Postcode</option>
                  {postcodes.map((postcode) => (
                    <option key={postcode} value={postcode}>
                      {postcode}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="w-full lg:w-6/12 px-4"></div>
            {/* Submit button */}
            <div className=" px-4 my-4 mx-auto">
              <button
                type="submit"
                className="bg-blue-500 text-white active:bg-blue-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 w-full ease-linear transition-all duration-150"
              >
                Update
              </button>
            </div>
          </form>
        </>
      )}
    </>
  );
}

export default CardUserInfo;
