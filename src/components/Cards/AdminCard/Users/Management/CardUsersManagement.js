import React, { useState, useEffect, useContext } from "react";
import { useLocation, Link } from "react-router-dom";
import { db, functions } from "../../../../../config/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  deleteDoc,
  updateDoc,
  arrayRemove,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import MUIDataTable from "mui-datatables";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@emotion/react";
import Swal from "sweetalert2";
import CardLoading from "../../../CardLoading";
import { AuthContext } from "../../../../../config/context/AuthContext";
import { httpsCallable } from "firebase/functions";

function CardUserManagement() {
  const { currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [studentData, setStudentData] = useState([]);
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [userStatuses, setUserStatuses] = useState({});

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const fetchedUsers = [];
      snapshot.forEach((doc) => {
        fetchedUsers.push({ id: doc.id, ...doc.data() });
      });
      setUsers(fetchedUsers);
      setLoading(false);
    });

    const fetchStudents = async () => {
      try {
        const studentsSnapshot = await getDocs(collection(db, "students"));
        const studentsData = studentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStudentData(studentsData);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    fetchStudents();
    return unsubscribe; // Cleanup the snapshot listener
  }, []); // Empty dependency array to run the effect only once

  function formatTime(time) {
    const date = time.toDate();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const formattedMonth = month < 10 ? "0" + month : month; // Add leading zero if month is less than 10
    const formattedDay = day < 10 ? "0" + day : day; // Add leading zero if day is less than 10
    return `${year}-${formattedMonth}-${formattedDay}`; // Return date in YYYY-MM-DD format
  }

  function getChildrenName(parentId) {
    const student = studentData.find(
      (student) => student.parentId === parentId
    );
    return student ? student.firstName + " " + student.lastName : "No Children";
  }

  const getUserStatus = async (userUid) => {
    setLoading(true);
    try {
      const checkUserStateFunction = httpsCallable(functions, "checkUserState");
      const result = await checkUserStateFunction({ uid: userUid }); // Pass userUid inside an object
      if (result.data.error) {
        // If an error is returned from the Cloud Function, display it
        throw new Error(result.data.error);
      }
      setLoading(false);
      return result.data ? "Disabled" : "Enabled"; // Return the user status
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
      return "The user is not existing";
    }
  };

  const deleteUser = async (userId) => {
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
        console.log("Deleting user with ID: ", userId);
        try {
          const usersCollectionRef = doc(db, "users", userId);
          const userSnapshot = await getDoc(usersCollectionRef);
          const user = { id: userSnapshot.id, ...userSnapshot.data() };
          console.log("User Snapshot: ", user);

          if (user.role === "parent") {
            // Delete parent document
            // await deleteDoc(doc(db, "parent", userId));
            const parentDoc = doc(db, "parent", userId);
            const parentSnapshot = await getDoc(parentDoc);
            const parentData = parentSnapshot.data();

            // Delete parent document
            if (parentData && parentData.children) {
              for (const studentId of parentData.children) {
                const studentDoc = await getDoc(doc(db, "students", studentId));
                const studentData = studentDoc.data();
                if (studentData && studentData.registeredCourses) {
                  for (const courseId of studentData.registeredCourses) {
                    const classDoc = await getDoc(doc(db, "class", courseId));
                    const classData = classDoc.data();
                    // Remove studentId from classData.studentID array
                    await updateDoc(classDoc.ref, {
                      studentID: arrayRemove(studentId),
                    });
                  }
                }
                // Delete student documents or do other operations here
                await deleteDoc(doc(db, "students", studentId));
              }
              // Delete Parent document
              await deleteDoc(parentDoc);
            }
          } else if (user.role === "teacher") {
            // Delete Teacher
            const teacherQuery = query(
              collection(db, "teacher"),
              where("userID", "==", userId)
            );
            const teacherSnapshot = await getDocs(teacherQuery);
            const teacherDeletes = teacherSnapshot.docs.map(async (doc) =>
              deleteDoc(doc.ref)
            );
            await Promise.all(teacherDeletes);
          } else if (user.role === "admin") {
            // Delete Admin
            const adminQuerty = query(
              collection(db, "admin"),
              where("userID", "==", userId)
            );
            const adminSnapshot = await getDocs(adminQuerty);
            const adminDeletes = adminSnapshot.docs.map(async (doc) =>
              deleteDoc(doc.ref)
            );
            await Promise.all(adminDeletes);
          }

          // Delete user
          await deleteDoc(usersCollectionRef);

          if (user.role === "parent") {
            Swal.fire(
              "Deleted!",
              "The user and associated student information have been deleted.",
              "success"
            );
          } else {
            Swal.fire("Deleted!", "The user has been deleted.", "success");
          }
        } catch (error) {
          Swal.fire(
            "Error!",
            "Failed to delete the user and associated student information.",
            "error"
          );
        }
      }
    });
  };

  useEffect(() => {
    const fetchUserStatuses = async () => {
      const statusPromises = users.map(async (user) => {
        const status = await getUserStatus(user.id);
        return { [user.id]: status }; // Store the status with the user ID as key
      });
      const resolvedStatuses = await Promise.all(statusPromises);
      const statusObject = resolvedStatuses.reduce(
        (acc, cur) => ({ ...acc, ...cur }),
        {}
      );
      setUserStatuses(statusObject);
    };
    fetchUserStatuses();
  }, [users]); // Trigger the effect whenever users change

  const columns = [
    { name: "NAME" },
    { name: "ROLE" },
    { name: "CHILDREN'S NAME" },
    { name: "PHONE NUMBER", options: { filter: false, sort: false } },
    {
      name: "REGISTRATION DATE",
      options: {
        sort: true,
        customSort: (a, b) => {
          // Custom sorting function for dates in the format yyyy-mm-dd
          const dateA = new Date(a.split("-").join("-"));
          const dateB = new Date(b.split("-").join("-"));
          return dateA - dateB; // Compare the dates
        },
      },
    },
    {
      name: "STATUS",
      options: {
        customBodyRenderLite: (dataIndex) => {
          const status = data[dataIndex][5]; // Assuming status is at index 5 of each row
          let statusColorClass = "bg-gray-200 text-gray-800"; // Default color class

          if (status === "Disabled") {
            statusColorClass = "bg-red-500 text-white"; // Red color for Disabled status
          } else if (status === "Enabled") {
            statusColorClass = "bg-green-500 text-white"; // Green color for Enabled status
          }

          return (
            <div className={`px-2 py-1 font-bold rounded ${statusColorClass}`}>
              {status}
            </div>
          );
        },
      },
    },
    {
      name: "ACTIONS",
      options: { filter: false, sort: false },
    },
  ];

  const disabledUser = async (userId) => {
    // Show Swal confirmation message
    Swal.fire({
      title: "Are you sure?",
      text: "You are about to toggle the user's status.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, toggle it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          console.log("Toggling user status for user with ID:  ", userId);
          // Call the Cloud Function to toggle the user's status
          const updateUserStatusFunction = httpsCallable(
            functions,
            "updateUserStatus"
          );
          console.log("Current User:", updateUserStatusFunction);
          const result = await updateUserStatusFunction({ userId });

          console.log("User Status Updated:", result);
          setLoading(false);

          // Update the userStatuses state to reflect the change immediately
          setUserStatuses((prevState) => ({
            ...prevState,
            [userId]: result.data.disabled ? "Disabled" : "Enabled", // Update the status for the specific user
          }));

          // Show success message
          Swal.fire({
            icon: "success",
            title: "User status toggled successfully!",
            showConfirmButton: false,
            timer: 1500,
          });
        } catch (error) {
          console.error("Error updating user status:", error);
          setLoading(false);

          // Show error message
          Swal.fire({
            icon: "error",
            title: "Oops... Something went wrong!",
            text: "Failed to toggle user status.",
          });
        }
      }
    });
  };

  const data = users.map((user) => [
    user.firstName + " " + user.lastName,
    user.role,
    user.role === "parent" ? getChildrenName(user.id) : "-", // Children's Name
    user.contactNumber,
    user.registrationDate ? formatTime(user.registrationDate) : "-",
    userStatuses[user.id], // Get the user status from the state
    <div className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
      <Link
        to={`/admin/users/view/${user.id}`}
        className="mr-3 text-white rounded-full font-bold py-2 px-4 bg-blue-500"
      >
        View
      </Link>
      <Link
        to={`/admin/users/edit/${user.id}`}
        className="mr-3 text-white rounded-full font-bold py-2 px-4 bg-green-500"
      >
        Edit
      </Link>
      <button
        className="mr-3 text-white rounded-full font-bold py-2 px-4 bg-red-600"
        onClick={() => deleteUser(user.id)}
      >
        Delete
      </button>
      {(userStatuses[user.id] === "Enabled" ||
        userStatuses[user.id] === "Disabled") && (
        <button
          className={`mr-3 text-white rounded-full font-bold py-2 px-4 ${
            userStatuses[user.id] === "Enabled" ? "bg-red-500" : "bg-green-500"
          }`}
          onClick={() => disabledUser(user.id)}
        >
          {userStatuses[user.id] === "Enabled" ? "Disable" : "Enable"}
        </button>
      )}
    </div>,
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
    selectableRows: "none",
    downloadOptions: { excludeColumns: [3] },
    rowsPerPage: 5,
    rowsPerPageOptions: [5, 10, 20, 50, 100],
    sortOrder: {
      name: "REGISTRATION DATE",
      direction: "desc",
    },
  };

  return (
    <>
      {loading ? (
        <CardLoading loading={loading} />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-xl font-bold mb-4">User Management</h2>
          <div className="flex justify-between mb-3 border-t border-gray-300 pt-3">
            {/* Management and Registration Tabs */}
            <div className="flex">
              <Link
                to="/admin/users"
                className={
                  " rounded-l-lg font-bold py-2 px-4" +
                  (location.pathname === "/admin/users"
                    ? " bg-blue-500 text-white hover:text-lightBlue-100"
                    : " text-black hover:text-white")
                }
              >
                Management
              </Link>

              <Link
                to="/admin/users/registration"
                className={
                  " rounded-r-lg font-bold py-2 px-4 m-0" +
                  (location.pathname.includes("/admin/users/registration")
                    ? "  bg-blue-500 text-white hover:text-lightBlue-100"
                    : " text-black  hover:bg-blue-500 hover:text-white")
                }
              >
                Registration
              </Link>
            </div>
            <div>
              <Link
                className="m-0 p-4 rounded-lg text-black bg-yellow-400 font-bold py-2 px-4"
                style={{ marginLeft: "1rem" }}
                to={`/admin/users/add`}
              >
                Add User
              </Link>
            </div>
          </div>

          {/* Users Table */}
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

export default CardUserManagement;
