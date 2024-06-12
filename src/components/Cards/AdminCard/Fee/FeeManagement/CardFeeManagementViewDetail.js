import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import CardLoading from "../../../CardLoading";
import PropTypes from "prop-types";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "../../../../../config/firebase";
import InvoiceModal from "../../../InvoiceModal";

function CardFeeManagementViewDetail() {
  const { id, feeid } = useParams();
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  useEffect(() => {
    async function fetchStudentsAndUsers() {
      try {
        const studentDoc = await getDoc(doc(db, "students", id));
        const studentData = { id: studentDoc.id, ...studentDoc.data() };
        setStudents(studentData);

        const userDoc = await getDoc(doc(db, "users", studentData.parentId));
        const userData = { id: userDoc.id, ...userDoc.data() };
        setUsers(userData);

        const feeDocRef = doc(db, "fees", feeid);
        const feeSnapshot = await getDoc(feeDocRef);

        if (feeSnapshot.exists()) {
          const feeData = {
            id: feeSnapshot.id,
            feeDetail: feeSnapshot.data(),
            classes: [],
          };

          const feeClassesQuery = collection(feeDocRef, "Classes");
          const feeClassesSnapshot = await getDocs(feeClassesQuery);
          const feeClassesData = feeClassesSnapshot.docs.map((doc) =>
            doc.data()
          );

          feeData.classes = feeClassesData;
          setFees(feeData);

          console.log("Fee", feeData.classes[1].Descriptions);
          setLoading(false);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching students, users, and fees data:", error);
      }
    }

    fetchStudentsAndUsers();
  }, [id, feeid]);

  const openInvoiceModal = () => {
    setIsInvoiceModalOpen(true);
  };

  const closeInvoiceModal = () => {
    setIsInvoiceModalOpen(false);
  };

  return (
    <>
      {loading ? (
        <CardLoading loading={loading} />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-4 font-bold text-xl">
            <Link to="/admin/fee" className="text-blue-500 hover:underline">
              Fee Management
            </Link>
            <span className="mx-2">&nbsp;/&nbsp;</span>
            <Link
              to={`/admin/fee/view/${id}`}
              className="text-blue-500 hover:underline"
            >
              View Student's fee
            </Link>
            <span className="mx-2">&nbsp;/&nbsp;</span>
            <span className="text-gray-500">View Student'fee Detail</span>
          </div>
          <div className="block w-full overflow-x-auto">
            <div className="grid grid-cols-2 gap-y-3 mt-2 m-0 px-8">
              <div className="font-bold flex justify-center text-xl col-span-2 underline">
                User Information
              </div>
              <div className="font-bold">
                Student Name:{" "}
                <span className="font-normal">
                  {students.firstName + " " + students.lastName}
                </span>
              </div>
              <div className="font-bold">
                Academic Level:{" "}
                <span className="font-normal">{students.educationLevel}</span>
              </div>
              <div className="font-bold">
                Parent Name:{" "}
                <span className="font-normal">
                  {users.firstName + " " + users.lastName}
                </span>
              </div>
              <div className="font-bold">
                Parent Phone number:{" "}
                <span className="font-normal">{users.contactNumber}</span>
              </div>
              <div className="font-bold col-span-2">
                Address: <span className="font-normal">{users.address}</span>
              </div>
              <div className="font-bold">
                State: <span className="font-normal">{users.state}</span>
              </div>
              <div className="font-bold">
                City: <span className="font-normal">{users.city}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-y-3 mt-2 m-0 px-8">
              <div className="flex justify-center mt-5 mb-3 font-bold text-xl col-span-2 underline">
                Fee Details
              </div>
              <div className="font-bold">
                Due Date:{" "}
                <span className="font-normal">
                  {fees.feeDetail.DueDate.toDate().toDateString()}
                </span>
              </div>
              <div className="font-bold">
                Payment Status:{" "}
                <span className="font-normal">
                  {fees.feeDetail.paymentStatus ? "Paid" : "Not Paid"}
                </span>
              </div>
              <div className="font-bold">
                Payment Date:{" "}
                <span className="font-normal">
                  {fees.feeDetail.paymentStatus
                    ? fees.feeDetail.paymentDate.toDate().toDateString()
                    : "Not Paid"}
                </span>
              </div>
            </div>
            <table className="mt-5 items-center w-full bg-transparent table-auto border-collapse">
              <thead>
                <tr>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Item / Description
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Fee
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Quantity
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {fees.classes.map((Classfee, classIndex) =>
                  Classfee.Descriptions.map((description, index) => (
                    <tr key={`${classIndex}-${index}`}>
                      <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                        {description.length > 60
                          ? description.substring(0, 60) + "..."
                          : description}
                      </td>
                      <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                        RM {Classfee.FeeAmounts[index].toFixed(2)}
                      </td>
                      <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                        {Classfee.Quantity[index]}
                      </td>
                      <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                        RM {(Classfee.FeeAmounts[index] * Classfee.Quantity[index]).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
                <tr>
                  <td></td>
                  <td></td>
                  <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-lg whitespace-nowrap p-4 font-bold">
                    Total
                  </td>
                  <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-lg whitespace-nowrap p-4 font-bold">
                    RM{" "}
                    {fees.classes
                      .reduce(
                        (acc, curr) =>
                          acc +
                          curr.FeeAmounts.reduce(
                            (subAcc, subCurr, idx) =>
                              subAcc + subCurr * curr.Quantity[idx],
                            0
                          ),
                        0
                      )
                      .toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="flex justify-center">
              <button
                onClick={openInvoiceModal}
                className="mb-3 rounded-lg font-bold py-2 px-4 bg-blue-500 text-white hover:bg-blue-600"
              >
                View Invoice
              </button>
            </div>
            {isInvoiceModalOpen && (
              <InvoiceModal
                onClose={closeInvoiceModal}
                students={students}
                users={users}
                fees={fees}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

CardFeeManagementViewDetail.defaultProps = {
  color: "light",
};

CardFeeManagementViewDetail.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardFeeManagementViewDetail;
