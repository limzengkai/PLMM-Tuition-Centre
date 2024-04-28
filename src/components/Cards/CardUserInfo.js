import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../config/context/AuthContext'; // Import your AuthContext
import { db, auth, storage } from "../../config/firebase"; // Assuming you have auth and storage from Firebase config
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateEmail, EmailAuthProvider, reauthenticateWithCredential, sendEmailVerification, updateProfile } from "firebase/auth";
import CardLoading from './CardLoading';
import Swal from 'sweetalert2';
import profile from "../../assets/img/profile.jpg";
import { ToastContainer, toast } from 'react-toastify'; // Import ToastContainer if you're using react-toastify
import 'react-toastify/dist/ReactToastify.css';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'; // Import ref and uploadBytes for file uploads

function CardUserInfo() {
  const { currentUser } = useContext(AuthContext); // Access currentUser from AuthContext
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    age: "",
    icNumber: "",
    email: "",
    contactNumber: "",
    address: "",
    city: "",
    state: "",
    zip: ""
  });
  const [photo, setPhoto] = useState(null); // Change to null to represent no file selected
  const [photoURL, setPhotoURL] = useState(null); // Add this state to store the photo URL]

  useEffect(() => {
    setLoading(true);
    const fetchUserInfo = async () => {
      try {
        if (currentUser) {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserInfo(docSnap.data());
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
  
        // Check if email has changed
        if (userInfo.email !== currentUser.email) {
          // Show double confirmation if email is changed
          Swal.fire({
            title: 'Are you sure?',
            text: 'Changing your email address will require verification. Are you sure you want to proceed?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, update my email!',
            html: `
              <input id="password" type="password" class="swal2-input" placeholder="Enter your current password">
            `
          }).then(async (result) => {
            if (result.isConfirmed) {
              const { value: password } = Swal.getPopup().querySelector('#password');
  
              // Reauthenticate the user
              const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
              console.log("Credential:", credential);
              console.log("User:", currentUser);
              try {
                await reauthenticateWithCredential(auth.currentUser, credential);
              } catch (error) {
                // Handle incorrect password
                Swal.fire({
                  icon: 'error',
                  title: 'Incorrect Password',
                  text: 'Please enter your correct password.',
                });
                return; // Stop further execution
              }
  
              // Proceed with email update
              await updateEmail(auth.currentUser, userInfo.email);
  
              console.log("Email address updated successfully!");
  
              // Display a message to the user asking them to verify their new email
              toast.info("A verification email has been sent to your new email address. Please verify it before updating.");
              sendEmailVerification(auth.currentUser);
              console.log("Email address has changed. Waiting for email verification...");
  
              // Update other user information in Firestore database
              await updateDoc(docRef, userInfo);
  
              console.log("User information updated successfully!");
              toast.success("User information updated successfully!");
            }
          });
        } else {
          // Show single confirmation if email is not changed
          Swal.fire({
            title: 'Are you sure?',
            text: 'You are about to update your user information. Are you sure you want to proceed?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, update my information!'
          }).then(async (result) => {
            if (result.isConfirmed) {
              // Update other user information in Firestore database
              await updateDoc(docRef, userInfo);
  
              console.log("Other user information updated successfully!");
              toast.success("Other user information updated successfully!");
            }
          });
        }
      } else {
        console.log("No user signed in");
      }
    } catch (error) {
      console.error("Error updating user information:", error);
      toast.error("Error updating user information");
    }
  };

  const uploadImage = async () => {
    try {
      if (photo) {
        setLoading(true);
        const fileRef = ref(storage, `users/${currentUser.uid}/profile.png`);
        await uploadBytes(fileRef, photo);
        const photoURL = await getDownloadURL(fileRef)
        updateProfile(currentUser,{photoURL});
        setPhotoURL(photoURL);
        setLoading(false);
        toast.success("Profile picture uploaded successfully!");
      } else {
        toast.error("Please select a file to upload!");
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast.error("Error uploading profile picture");
    }
  }

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  }

  const removePhoto = () => {
    setPhoto(null);
  };

  return (
    <>
      {loading ? (
        <CardLoading loading={loading} />
      ) : (
        <>
          <div className="flex flex-col items-center m-6">
            <img className="w-40 h-40 p-1 rounded-full ring-2 ring-gray-300 dark:ring-gray-500 mb-4" src={currentUser?.photoURL ? photoURL : profile} alt="Bordered avatar" />
            <div className="flex">
              <input type="file" id="fileInput" onChange={handleImageChange} className="hidden" style={{ display: 'none' }} />
              <label htmlFor="fileInput" className="cursor-pointer bg-blue-500 text-white active:bg-blue-600 font-bold uppercase text-sm px-4 py-2 rounded shadow hover:shadow-lg mr-2">
                Select Photo
              </label>
              <button disabled={!photo} onClick={uploadImage} className={`bg-${photo ? 'blue' : 'gray'}-500 text-white active:bg-${photo ? 'blue' : 'gray'}-600 font-bold uppercase text-sm px-4 py-2 rounded shadow ${photo ? 'hover:shadow-lg' : ''}`} style={{ cursor: photo ? 'pointer' : 'not-allowed' }}>
                Upload
              </button>
              {photo && (
                <button onClick={removePhoto} className="bg-red-500 text-white active:bg-red-600 font-bold uppercase text-sm px-4 mx-2 py-2 rounded shadow hover:shadow-lg mr-2">
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
            {/* Age */}
            <div className="w-full lg:w-6/12 px-4">
              <div className="relative w-full mb-3">
                <label
                  className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                  htmlFor="age"
                >
                  Age
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={userInfo.age}
                  onChange={handleInputChange}
                  className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                  placeholder="User's Age"
                />
              </div>
            </div>
            {/* IC Number */}
            <div className="w-full lg:w-6/12 px-4">
              <div className="relative w-full mb-3">
                <label
                  className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                  htmlFor="icNumber"
                >
                  IC Number
                </label>
                <input
                  type="text"
                  id="icNumber"
                  name="icNumber"
                  value={userInfo.icNumber}
                  onChange={handleInputChange}
                  className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                  placeholder="User's IC Number"
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
                  className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                  placeholder="User's Email"
                />
              </div>
            </div>
            {/* Phone */}
            <div className="w-full lg:w-6/12 px-4">
              <div className="relative w-full mb-3">
                <label
                  className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                  htmlFor="contactNumber"
                >
                  Phone
                </label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  value={userInfo.contactNumber}
                  onChange={handleInputChange}
                  className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                  placeholder="User's Phone Number"
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
            {/* City */}
            <div className="w-full lg:w-6/12 px-4">
              <div className="relative w-full mb-3">
                <label
                  className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                  htmlFor="city"
                >
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={userInfo.city}
                  onChange={handleInputChange}
                  className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                  placeholder="User's City"
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
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={userInfo.state}
                  onChange={handleInputChange}
                  className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                  placeholder="User's State"
                />
              </div>
            </div>
            {/* Zip */}
            <div className="w-full lg:w-6/12 px-4">
              <div className="relative w-full mb-3">
                <label
                  className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                  htmlFor="zip"
                >
                  Zip
                </label>
                <input
                  type="text"
                  id="zip"
                  name="zip"
                  value={userInfo.postcode}
                  onChange={handleInputChange}
                  className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                  placeholder="User's Postcode"
                />
              </div>
            </div>
            {/* Submit button */}
            <div className="w-full px-4">
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
      <ToastContainer />
    </>
  );
}

export default CardUserInfo;
