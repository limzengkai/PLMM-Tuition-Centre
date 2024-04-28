import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { db } from "../../../config/firebase";
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
import Swal from "sweetalert2";
import CardLoading from "../CardLoading";

function CardUserManagement() {
  const [users, setUsers] = useState([]);
  const [studentData, setStudentData] = useState([]);
  const [selectedFunction, setSelectedFunction] = useState("management");
  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation();
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const pathname = location.pathname;
    if (pathname === "/admin/users" || pathname.startsWith("/admin/users/")) {
      setSelectedFunction("management");
    }
  }, [location.pathname]);

  function formatTime(time) {
    const date = time.toDate();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${day}-${month}-${year}`;
  }

  function getChildrenName(parentId) {
    const student = studentData.find(
      (student) => student.parentId === parentId
    );
    return student ? student.firstName + " " + student.lastName : "No Children";
  }

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
                    console.log("Course ID: ", courseId);
                    const classDoc = await getDoc(doc(db, "class", courseId));
                    const classData = classDoc.data();
                    console.log("Class Data: ", classData);
                    // Remove studentId from classData.studentID array
                    await updateDoc(classDoc.ref, {
                      studentID: arrayRemove(studentId),
                    });
                  }
                }
                // Delete student documents or do other operations here
                await deleteDoc(doc(db, "students", studentId));
              }
              console.log("Deleting parent: ", userId);
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

  return (
    <>
      {loading ? (
        <CardLoading loading={loading} />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-xl font-bold mb-4">User Management</h2>
          <div className="lg:flex justify-between mb-4 sm:block">
            {/* Search Bar */}
            <div className="flex items-center">
              <label
                htmlFor="search"
                className="text-sm font-medium text-gray-700 mr-2"
              >
                Search by:
              </label>
              <input
                type="text"
                id="search"
                name="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 block w-64"
                placeholder={
                  selectedFunction === "management" ? "Name" : "userID"
                }
              />
            </div>
          </div>
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
                onClick={() => setSelectedFunction("management")}
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
                onClick={() => setSelectedFunction("registration")}
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
            <table className="w-full bg-transparent border-collapse">
              <thead>
                <tr>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    No.
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Name
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Role
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Children's Name
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Phone Number
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Registration Date
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.id}>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {index + 1}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {user.firstName + " " + user.lastName}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {user.role}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {user.role === "parent" ? getChildrenName(user.id) : "-"}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {user.contactNumber}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {user.registrationDate
                        ? formatTime(user.registrationDate)
                        : "-"}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      <Link
                        to={`/admin/users/view/${user.id}`}
                        className="mr-3 text-black rounded-full font-bold py-2 px-4 bg-blue-500"
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

export default CardUserManagement;
