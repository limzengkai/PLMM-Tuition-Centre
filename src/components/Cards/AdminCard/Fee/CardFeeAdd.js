import React, { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "../../../../config/firebase";
import CardLoading from "../../CardLoading";
import Swal from "sweetalert2";
import { Class } from "leaflet";

function CardFeeAdd() {
  const [fee, setFee] = useState([]);
  const [empty, setEmpty] = useState([]);
  const [classes, setClasses] = useState([]);
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const { uid } = useParams();
  const [additionalFields, setAdditionalFields] = useState([
    {
      description: "",
      amount: "",
      quantity: "",
    },
  ]);

  useEffect(() => {
    async function fetchStudentsAndClasses() {
      try {
        const classRef = await getDoc(doc(db, "class", uid));
        const classData = classRef.data();
        setClasses(classData);
        console.log("classData:  ", classData);

        let fee = [];
        let empty = [];

        // Iterate over each student ID in the class
        for (const studentId of classData.studentID) {
          const feeQuery = query(
            collection(db, "fees"),
            where("StudentID", "==", studentId),
            where("paymentStatus", "==", false),
            where("publish","==", false)
          );

          const feeSnapshot = await getDocs(feeQuery);

          const feeData = feeSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Filter fees for next month
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);

          const nextMonthFees = feeData.filter((fee) => {
            const dueDate = fee.DueDate.toDate();
            return (
              dueDate.getMonth() === nextMonth.getMonth() &&
              dueDate.getFullYear() === nextMonth.getFullYear()
            );
          });

          // If nextMonthFees is empty then add the student to the list
          if (nextMonthFees.length === 0) {
            empty.push(studentId);
          }

          // Add the fees for next month to the list
          fee.push(...nextMonthFees);
        }
        setEmpty(empty);
        setFee(fee);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching students and classes data:", error);
      }
    }
    fetchStudentsAndClasses();
  }, []);

  useEffect(() => {
    console.log("feilfd:  ", additionalFields);
  }, []);

  const handleAddFee = async () => {
    try {
      // Show confirmation dialog
      const confirmResult = await Swal.fire({
        icon: "question",
        title: "Confirmation",
        text: "Are you sure you want to add this fee?",
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No",
      });

      if (confirmResult.isConfirmed) {
        for (const field of additionalFields) {
          // Add the new fee to each existing fee's classes
          for (const feeItem of fee) {
            const feeClassesRef = collection(db, "fees", feeItem.id, "Classes");
            await addDoc(feeClassesRef, {
              ClassId: uid,
              Descriptions: [field.description],
              FeeAmounts: [Number(field.amount)],
              Quantity: [Number(field.quantity)],
            });
            // Show success message
            Swal.fire({
              icon: "success",
              title: "Fee Added",
              text: "Fee has been successfully added.",
              timer: 2000, // Close after 2 seconds
              timerProgressBar: true,
            });
          }
        }
        // Add the new fee to the database (if needed)
      }
    } catch (error) {
      console.error("Error adding fee:", error);
      // Show error message
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while adding the fee. Please try again later.",
      });
    }
  };

  const handleAddField = () => {
    setAdditionalFields([
      ...additionalFields,
      {
        description: "",
        amount: "",
        quantity: "",
      },
    ]);
  };

  const handleFieldInputChange = (e, index) => {
    console.log("e.target:  ", e.target);
    const { name, value } = e.target;
    const updatedFields = [...additionalFields];
    updatedFields[index][name.split("-")[0]] = value; // Extract the field name from the input name
    setAdditionalFields(updatedFields);
    console.log("additionalFields: ", additionalFields);
  };

  return (
    <>
      {loading ? (
        <CardLoading loading={loading} />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-4 font-bold text-base sm:text-lg md:text-xl lg:text-2xl">
            <Link
              to="/admin/fee/classes"
              className="text-blue-500 hover:underline"
            >
              Payment Class List
            </Link>
            <span className="mx-2">&nbsp;/&nbsp;</span>
            <Link
              to={`/admin/fee/classes/view/${uid}`}
              className="text-blue-500 hover:underline"
            >
              View class's fee
            </Link>
            <span className="mx-2">&nbsp;/&nbsp;</span>
            <span className="text-gray-500">Add Fee By Class</span>
          </div>
          <div className="flex justify-between">
            <div className="flex mb-4">
              <Link
                to="/admin/fee"
                className={`rounded-l-lg font-bold py-2 px-4 ${
                  location.pathname === "/admin/fee"
                    ? "bg-blue-500 text-white hover:text-lightBlue-100"
                    : "text-black hover:text-white hover:bg-blue-500"
                }`}
              >
                Fee list
              </Link>
              <Link
                to="/admin/fee/classes"
                className={`font-bold py-2 px-4 ${
                  location.pathname.startsWith("/admin/fee/classes")
                    ? "bg-blue-500 text-white hover:text-lightBlue-100"
                    : "text-black hover:text-white hover:bg-blue-500"
                }`}
              >
                Class List
              </Link>
              <Link
                to="/admin/fee/payment-history"
                className={`rounded-r-lg font-bold py-2 px-4 ${
                  location.pathname === "/admin/fee/payment-history"
                    ? "bg-blue-500 text-white hover:text-lightBlue-100"
                    : "text-black hover:text-white hover:bg-blue-500"
                }`}
              >
                Payment History
              </Link>
            </div>
          </div>

          {/* Students Table */}
          <div className="block w-full overflow-x-auto">
            {/* Class Information */}
            <div className="mb-4 mx-4 text-lg grid grid-cols-1 sm:grid-cols-2 sm:text-cl gap-4">
              <div>
                <span className="font-bold">Courses Name: </span>{" "}
                {classes.CourseName}
              </div>
              <div>
                <span className="font-bold">Academic Level: </span>{" "}
                {classes.academicLevel}
              </div>
              <div>
                <span className="font-bold">Class Fee: </span> RM {classes.fee}
              </div>
              <div>
                <span className="font-bold">Location: </span> {classes.location}
              </div>
              <div>
                <span className="font-bold">Registered Student: </span>{" "}
                {classes.studentID.length} / {classes.MaxRegisteredStudent}
              </div>
              <div>
                <span className="font-bold">Status: </span>{" "}
                {classes.status ? "Active" : "Inactive"}
              </div>
            </div>
            {fee.length > 0 ? (
              empty.length > 0 ? (
                <div className="text-red-500 mb-4 mx-4">
                  The following students do not have fees for next month:{" "}
                  {empty.join(", ")}
                </div>
              ) : (
                // Input for the fee
                <div className="m-4">
                  <h2 className="font-bold text-lg mb-2">Add Fee</h2>
                  <div className="grid grid-cols-3 gap-4">
                    {additionalFields.map((field, index) => (
                      <React.Fragment key={index}>
                        <input
                          type="text"
                          name={`description-${index}`}
                          placeholder="Description"
                          value={field.description}
                          onChange={(e) => handleFieldInputChange(e, index)}
                          className="border rounded-md p-2"
                        />
                        <input
                          type="number"
                          name={`amount-${index}`}
                          placeholder="Amount"
                          value={field.amount}
                          onChange={(e) => handleFieldInputChange(e, index)}
                          className="border rounded-md p-2"
                        />
                        <input
                          type="number"
                          name={`quantity-${index}`}
                          placeholder="Quantity"
                          value={field.quantity}
                          onChange={(e) => handleFieldInputChange(e, index)}
                          className="border rounded-md p-2"
                        />
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="flex justify-center my-4">
                    <button
                      className="bg-blue-500 text-white rounded-md py-2 px-4 mt-4 mr-2"
                      onClick={handleAddField}
                    >
                      Add More
                    </button>
                    <button
                      className="bg-green-500 text-white rounded-md py-2 px-4 mt-4"
                      onClick={handleAddFee}
                    >
                      Submit Fee
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="text-red-500 mb-4 mx-4">
                No fees record found for next month, please add fees for next
                month. You can click the link below to navigate to generate all
                student fees for next month manually.
                <Link to={`/admin/fee/classes`}>Click me</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default CardFeeAdd;
