import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import CardLoading from "../../../CardLoading";
import PropTypes from "prop-types";
import Swal from "sweetalert2";
import "react-toastify/dist/ReactToastify.css";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../../../../config/firebase";

function CardFeeManagementEdit({ color }) {
  const { id, feeid } = useParams();
  const [students, setStudents] = useState({});
  const [users, setUsers] = useState({});
  const [fees, setFees] = useState({ feeDetail: {}, classes: [] });
  const [loading, setLoading] = useState(true);
  const [deletedFee, setDeletedFee] = useState([]);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    async function fetchStudentsAndUsers() {
      try {
        const studentDoc = await getDoc(doc(db, "students", id));
        if (studentDoc.exists()) {
          const studentData = { id: studentDoc.id, ...studentDoc.data() };
          setStudents(studentData);

          const userDoc = await getDoc(doc(db, "users", studentData.parentId));
          if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() };
            setUsers(userData);
          }
        }

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
          const feeClassesData = feeClassesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          feeData.classes = feeClassesData;
          setFees(feeData);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching students, users, and fees data:", error);
        setLoading(false);
      }
    }

    fetchStudentsAndUsers();
  }, [id, feeid]);

  const handleEditFee = async () => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You are about to save changes.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, save changes",
      });

      if (result.isConfirmed) {
        const feeClassesRef = collection(db, "fees", feeid, "Classes");
        const snapshot = await getDocs(feeClassesRef);

        for (const feeItem of fees.classes) {
          const existingDoc = snapshot.docs.find(
            (doc) => doc.id === feeItem.id
          );

          if (existingDoc) {
            await updateDoc(existingDoc.ref, {
              Descriptions: feeItem.Descriptions,
              FeeAmounts: feeItem.FeeAmounts,
              Quantity: feeItem.Quantity,
            });
          } else {
            await addDoc(feeClassesRef, feeItem);
          }
        }

        for (const deletedFeeItem of deletedFee) {
          await deleteDoc(doc(db, "fees", feeid, "Classes", deletedFeeItem.id));
        }

        Swal.fire({
          icon: "success",
          title: "Fee updated successfully!",
          showConfirmButton: false,
          timer: 1500,
        });
        setFormError("");
      }
    } catch (error) {
      console.error("Error updating fee:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong!",
      });
    }
  };

  const handleAddFeeItem = () => {
    const newFeeItem = { Descriptions: [""], FeeAmounts: [0], Quantity: [1] };
    setFees((prevState) => ({
      ...prevState,
      classes: [...prevState.classes, newFeeItem],
    }));
  };

  const handleRemoveFeeItem = (index) => {
    setDeletedFee((prevState) => [...prevState, fees.classes[index]]);
    setFees((prevState) => ({
      ...prevState,
      classes: prevState.classes.filter((_, i) => i !== index),
    }));
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
            <span className="text-gray-500">Edit Student's Fee</span>
          </div>
          <div className="block w-full overflow-x-auto">
            <div className="grid grid-cols-2 gap-y-3 mt-2 m-0 px-8">
              <div className="font-bold mb-4 flex justify-center text-xl col-span-2 underline">
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
              <div className="flex justify-center mt-5 mb-4 font-bold text-xl col-span-2 underline">
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
                    AMOUNT
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left"></th>
                </tr>
              </thead>
              <tbody>
                {fees.classes.map((feeItem, classIndex) => (
                  <tr key={classIndex}>
                    <td className="w-1/2 border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {feeItem.Descriptions.map((description, idx) => (
                        <input
                          key={idx}
                          type="text"
                          value={description}
                          className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                          required
                          onChange={(e) => {
                            const updatedClasses = [...fees.classes];
                            updatedClasses[classIndex].Descriptions[idx] =
                              e.target.value;
                            setFees((prevState) => ({
                              ...prevState,
                              classes: updatedClasses,
                            }));
                          }}
                        />
                      ))}
                    </td>
                    <td className="w-1/4 border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {feeItem.FeeAmounts.map((feeAmount, idx) => (
                        <input
                          key={idx}
                          type="number"
                          value={feeAmount}
                          className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                          required
                          onChange={(e) => {
                            const updatedClasses = [...fees.classes];
                            updatedClasses[classIndex].FeeAmounts[idx] =
                              e.target.value;
                            setFees((prevState) => ({
                              ...prevState,
                              classes: updatedClasses,
                            }));
                          }}
                        />
                      ))}
                    </td>
                    <td className="w-1/4 border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {feeItem.Quantity.map((quantity, idx) => (
                        <input
                          key={idx}
                          type="number"
                          value={quantity}
                          className="border-0 px-3 py-3 border-black placeholder-blueGray-300 text-blueGray-600 rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                          required
                          onChange={(e) => {
                            const updatedClasses = [...fees.classes];
                            updatedClasses[classIndex].Quantity[idx] =
                              e.target.value;
                            setFees((prevState) => ({
                              ...prevState,
                              classes: updatedClasses,
                            }));
                          }}
                        />
                      ))}
                    </td>
                    <td className="w-1/4 border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {feeItem.FeeAmounts.map((feeAmount, idx) => (
                        <span key={idx}>
                          RM{" "}
                          {(
                            parseFloat(feeAmount) *
                            parseFloat(feeItem.Quantity[idx])
                          ).toFixed(2)}
                        </span>
                      ))}
                    </td>
                    <td>
                      <button
                        onClick={() => handleRemoveFeeItem(classIndex)}
                        className="text-white rounded font-bold py-2 px-4 bg-red-500 hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {formError && <div className="text-red-500 mb-4">{formError}</div>}
            <div className="font-bold flex justify-center">
              Total Fee:{" "}
              <span className="font-normal">
                RM
                {fees.classes
                  .reduce((acc, curr) => {
                    const totalAmountPerItem = curr.FeeAmounts.reduce(
                      (total, fee, idx) =>
                        total +
                        parseFloat(fee) * parseFloat(curr.Quantity[idx]),
                      0
                    );
                    return acc + totalAmountPerItem;
                  }, 0)
                  .toFixed(2)}
              </span>
            </div>
            <div className="mt-3 flex justify-center">
              <button
                onClick={handleEditFee}
                className="mr-3 text-white rounded-full font-bold py-2 px-4 bg-blue-500 hover:bg-blue-600"
              >
                Save Changes
              </button>
              <button
                onClick={handleAddFeeItem}
                className="ml-3 text-white rounded-full font-bold py-2 px-4 bg-yellow-400 hover:bg-yellow-500"
              >
                Add Fee Item
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

CardFeeManagementEdit.defaultProps = {
  color: "light",
};

CardFeeManagementEdit.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardFeeManagementEdit;
