import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { db } from "../../config/firebase";
import { getDocs, collection, orderBy, query } from "firebase/firestore";

// Components
import CardUsersManagement from "../../components/Cards/AdminCard/CardUsersManagement";
import CardUsersRegistration from "../../components/Cards/AdminCard/CardUsersRegistration";
import CardLoading from "../../components/Cards/CardLoading";

async function fetchUsersData() {
  try {
    const UserCollectionRef = collection(db, "users");
    const q = query(UserCollectionRef, orderBy("registrationDate", "desc"));
    const UsersSnapshot = await getDocs(q); // Fetch all users documents
    return UsersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching documents:", error);
    throw error; // Propagate the error to the caller
  }
}

export default function Users() {
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await fetchUsersData();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false); // Set loading to false regardless of success or failure
      }
    }
    fetchData();
  }, []);

  return (
    <div className="flex flex-wrap">
      <div className="w-full px-4">
        <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
          {loading ? (
            <CardLoading loading={loading} />
          ) : (
            location.pathname === "/admin/users" ? (
              <CardUsersManagement users={users} />
            ) : (
              <CardUsersRegistration />
            )
          )}
        </div>
      </div>
    </div>
  );
}