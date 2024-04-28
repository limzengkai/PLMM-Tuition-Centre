import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../config/firebase";
import Swal from 'sweetalert2';

function CardUserManagementView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [childrenData, setChildrenData] = useState([]);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const userDocRef = doc(db, "users", id);
        const userDocSnapshot = await getDoc(userDocRef);
        if (userDocSnapshot.exists()) {
          const userData = userDocSnapshot.data();
          setUserData(userData);
          setLoading(false);

          // Fetch associated children's data if user role is parent
          if (userData.role === "parent") {
            const childrenDataQuery = query(collection(db, "students"), where("parentId", "==", id));
            console.log(childrenDataQuery)
            const childrenDataSnapshot = await getDocs(childrenDataQuery);
            const children = [];
            childrenDataSnapshot.forEach((doc) => {
              children.push(doc.data());
            });
            setChildrenData(children);
          }
        } else {
          console.log("User not found");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    }

    fetchUserData();
  }, [id]);

  const handleDeleteUser = async () => {
    // Show confirmation alert
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this user!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    // If user confirms deletion, proceed with deletion logic
    if (result.isConfirmed) {
        try {
          // Delete user document
          await deleteDoc(doc(db, "users", id));
  
          // Optionally, delete associated children documents or any other related data
          // Delete associated student information
          if(childrenData.length > 0){
            if (childrenData.length > 0) {
                console.log("Deleting children data for user with ID:", id);
                const studentsSnapshot = await getDocs(query(collection(db, "students"), where("parentId", "==", id)));
                
                // Delete each associated student document
                const studentDeletes = studentsSnapshot.docs.map(async (doc) => {
                  await deleteDoc(doc.ref); // Use doc.ref to get the reference to the document
                });
              
                // Wait for all deletion operations to complete
                await Promise.all(studentDeletes);
              }

          }
  
          // Show success message
          await Swal.fire('Deleted!', 'The user has been deleted.', 'success');
          // Redirect to user management page
          navigate("/admin/users"); // Use navigate function to redirect
        } catch (error) {
          console.error("Error deleting user:", error);
          await Swal.fire('Error!', 'An error occurred while deleting the user.', 'error');
        }
      }
    };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-4 font-bold text-xl">
        <Link to="/admin/users" className="text-blue-500 hover:underline">User Management</Link>
        <span className="mx-2">&nbsp;/&nbsp;</span>
        <span className="text-gray-500">View</span>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : userData ? (
        <>
          <span className="font-bold p-4">
            {userData.role === "parent" ? "Parent" : userData.role === "teacher" ? "Teacher" : "Admin"} Information
          </span>
          <table className="w-full bg-transparent border-collapse mt-4">
            <thead>
              <tr>
                <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Name</th>
                <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">User ID</th>
                <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Email</th>
                <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Phone Number</th>
                <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Address</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{userData.name}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{id}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{userData.email}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{userData.phoneNumber}</td>
                <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{userData.address + ", " + userData.postcode + " " +userData.city +", "+ userData.state}</td>
              </tr>
            </tbody>
          </table>

          {userData.role === "parent" && childrenData.length > 0 && (
            <>
              <span className="font-bold p-4">
                Children's Information
              </span>
              <table className="w-full bg-transparent border-collapse my-4">
                <thead>
                  <tr>
                    <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Name</th>
                    <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">IC Number</th>
                    <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Educational Stage</th>
                    <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Standard/Form</th>
                  </tr>
                </thead>
                <tbody>
                  {childrenData.map((child, index) => (
                    <tr key={index}>
                      <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{child.firstName} {child.lastName}</td>
                      <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{child.icNumber}</td>
                      <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{child.educationalStage}</td>
                      <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">{child.standardForm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        <div className="flex justify-center">
            <Link
                to={`/admin/users/edit/${id}`}
                className="bg-green-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded mt-4 mr-4"
            >
                Edit User
            </Link>

            <button
                onClick={handleDeleteUser}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded mt-4"
            >
                Delete User
            </button>
        </div>

        </>
      ) : (
        <p>User not found.</p>
      )}
    </div>
  );
}

export default CardUserManagementView;