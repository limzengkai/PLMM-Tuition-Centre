import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../../../../../config/firebase";
import CardLoading from "../../../CardLoading";
import RegistrationheaderNav from "../../Registration/Registrationheadernav";

function CardUsersRegistration() {
  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] = useState([]);

  useEffect(() => {
    const fetchRegistration = async () => {
      try {
        // Construct the query to fetch registrations with status true and ordered by registrationDate
        const registrationQuery = query(
          collection(db, "registration"),
          where("status", "==", true),
          orderBy("registrationDate", "desc")
        );

        // Get the documents based on the query
        const registrationDocs = await getDocs(registrationQuery);
        console.log("DOC: ", registrationDocs);
        // Map the document data to an array of objects containing the document ID and data
        const registrations = registrationDocs.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Set the fetched registrations to the state
        setRegistration(registrations);
        setLoading(false);
        // Log the fetched registrations to the console
        console.log(registrations);
      } catch (error) {
        console.error("Error fetching registrations:", error.message);
      }
    };
    fetchRegistration();
  }, []);

  return (
    <>
      {loading ? (
        <CardLoading loading={loading} />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-xl font-bold mb-4">User Registration</h2>
          <RegistrationheaderNav />

          {/* Users Table */}
          <div className="block w-full overflow-x-auto rounded">
            <table className="w-full bg-transparent border-collapse mb-4">
              <thead>
                <tr>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    No.
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Name
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Student Name
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
                {registration.map((user, index) => (
                  <tr key={user.id}>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {index + 1}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {user.firstName + " " + user.lastName}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {user.student.map((student, index) => {
                        return (
                          <div key={index}>
                            {index + 1}. {student.firstName} {student.lastName}
                          </div>
                        );
                      })}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {user.contactNumber}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {user.registrationDate.toDate().toLocaleDateString()}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      <Link
                        to={`/admin/users/registration/${user.id}`}
                        className="mr-3 text-white rounded-full font-bold py-2 px-4 bg-blue-500 hover:bg-blue-600"
                      >
                        View
                      </Link>
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

export default CardUsersRegistration;
