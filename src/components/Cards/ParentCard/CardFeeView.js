import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../../config/context/AuthContext";
import { db } from "../../../config/firebase";
import PropTypes from "prop-types";
import { loadStripe } from '@stripe/stripe-js';
import Invoice from "../CardInvoice";
import CardPagination from "../CardPagination";
import CardLoading from "../CardLoading";
import { collection, query, where, getDocs, orderBy, getDoc, doc } from "firebase/firestore";
import { useParams } from "react-router-dom";

function CardFee({ color }) {
  const { currentUser } = useContext(AuthContext);
  const {id} = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [feePayments, setFeePayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null); // State to track selected payment
  const projectsPerPage = 2; // Number of projects to display per page

  useEffect(() => {
    const fetchData = async () => {
      try {
        const feePayment = doc(db, "fees", id);
        const feePaymentDataSnapShot = await getDoc(feePayment);
        const feePaymentData = {
            id: feePaymentDataSnapShot.id,
            ...feePaymentDataSnapShot.data(),
            };  
        const feeClasses = collection(db, "fees", id, "Classes");
        const feeClassesDataSnapShot = await getDocs(feeClasses);
        const classesData = [];
        feeClassesDataSnapShot.forEach((doc) => {
            classesData.push({
                id: doc.id,
                ...doc.data(),
            });
        });
        console.log("Classes data:", classesData);
        const studentDataDoc = doc(db, "students", feePaymentData.StudentID);
        const studentDataSnapshot = await getDoc(studentDataDoc);
        const studentData = {
            id: studentDataSnapshot.id,
            ...studentDataSnapshot.data(),
        };
        console.log("Student data:", studentData);
        const feePaymentDataWithStudentClasses = {
            ...feePaymentData,
            classes: classesData,
            studentName: studentData.firstName + " " + studentData.lastName,
        };

        setFeePayments(feePaymentDataWithStudentClasses);
        setLoading(false);
        console.log("Fee payment data 1:", feePaymentDataWithStudentClasses);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    fetchData();
  }, []);
  
  useEffect(() => {
    console.log("Fee payment data 3:", feePayments);

  }, []);

  const makePayment = async () => {
    const stripe = await loadStripe("pk_test_51Ox8pMLX6vV4bYTHC6AR8YpbPIu5HWlfch5dauc8yvUUXwEz0gITpCUexMCGnKxMO29n2apcEvcfPCufOmtsk1fh00ujg1JGZi");
    const paymentIntent = await fetch("http://localhost:4242/api/create-payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [{ id: feePayments.id, classes: feePayments.classes.map((Class) => Class.Descriptions)}],
      }),
    }).then((res) => res.json());
    const result = await stripe.redirectToCheckout({
      sessionId: paymentIntent.id,
    });
    if (result.error) {
      console.error(result.error.message);
    }
  }

  return (
    <>
      {loading ? (
        <CardLoading />
      ) : (
        <div
          className={
            "relative flex flex-col min-w-0 break-words w-full shadow-lg rounded " +
            (color === "light" ? "bg-white" : "bg-lightBlue-900 text-white")
          }
        >
          <div className="rounded-t mb-0 px-4 py-3 border-0">
            <div className="flex flex-wrap items-center">
              <div className="relative w-full px-4 max-w-full flex-grow flex-1">
                <h3
                  className={
                    "font-semibold text-lg " +
                    (color === "light" ? "text-blueGray-700" : "text-white")
                  }
                >
                  Fee Payment
                </h3>
                <p className="text-sm text-gray-500">
                  View and manage your fee payments {feePayments.length}
                </p>
              </div>
            </div>
          </div>
          <div className="block w-full overflow-x-auto">
            <div className="flex justify-end my-4 mx-8">
              <input
                type="text"
                placeholder="Search by description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-indigo-500"
                style={{ width: "300px" }}
              />
            </div>
            <div className="grid grid-cols-2 gap-y-3 mt-2 m-0 px-8">
              <div className="flex justify-center mt-5 mb-3 font-bold text-xl col-span-2 underline">Fee Details</div>
              <div className="font-bold">Due Date: <span className="font-normal">{feePayments.DueDate.toDate().toDateString()}</span></div>
              <div className="font-bold">Payment Status: <span className="font-normal">{feePayments.paymentStatus ? "Paid" : "Not Paid"}</span></div>
              <div className="font-bold">Payment Date: <span className="font-normal">{feePayments.paymentStatus ? feePayments.paymentDate.toDate().toDateString() : "Not Paid"}</span></div>
            </div>
            <table className="mt-5 items-center w-full bg-transparent table-auto border-collapse">
              <thead>
                <tr>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Item / Description</th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Fee</th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">Quantity</th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {feePayments.classes.map((Classfee) => (
                    <tr key={Classfee.ClassId}>
                    {Classfee.Descriptions.map((description, index) => (
                        <td key={index} className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                        {description.length > 60 ? description.substring(0, 60) + "..." : description}
                        </td>
                    ))}
                    {Classfee.FeeAmounts.map((fee, index) => (
                        <td key={index} className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                        RM {fee}
                        </td>
                    ))}
                    {Classfee.Quantity.map((qty, index) => (
                        <td key={index} className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                        {qty}
                        </td>
                    ))}
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                        RM {Classfee.FeeAmounts.reduce((acc, curr, index) => acc + curr * Classfee.Quantity[index], 0)}
                    </td>
                    </tr>
                ))}
                <tr>
                    <td></td>
                    <td></td>
                    <td className="text-lg border-t-0 px-6 align-middle border-l-0 border-r-0 whitespace-nowrap p-4 font-bold">
                        Total
                    </td>
                    <td className="text-lg border-t-0 px-6 align-middle border-l-0 border-r-0 whitespace-nowrap p-4 font-bold">
                        RM {feePayments.classes.reduce((acc, curr) => acc + curr.FeeAmounts.reduce((subAcc, subCurr, index) => subAcc + subCurr * curr.Quantity[index], 0), 0)}
                    </td>
                </tr>
                </tbody>
            </table>
            <div className="flex justify-center">
                <button 
                    onClick={makePayment}
                    className="mb-3 rounded-lg font-bold py-2 px-4 bg-blue-500 text-white hover:bg-blue-600"
                >
                    Make a Payment
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

CardFee.defaultProps = {
  color: "light",
};
CardFee.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardFee;
