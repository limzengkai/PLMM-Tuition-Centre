import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../../config/context/AuthContext";
import { db } from "../../../config/firebase";
import PropTypes from "prop-types";
// import { loadStripe } from "@stripe/stripe-js";
import InvoiceModal from "../InvoiceModal";
import CardLoading from "../CardLoading";
import Swal from "sweetalert2";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { Link, useNavigate, useParams } from "react-router-dom";

function CardFeeView({ color }) {
  const { currentUser } = useContext(AuthContext);
  const { id } = useParams();
  const [feePayments, setFeePayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false); // State to control invoice modal visibility
  const [userData, setUserData] = useState(null);
  const [fees, setFees] = useState([]);
  const navigate = useNavigate();

  const checkPublish = async () => {
    try {
      const feePayment = doc(db, "fees", id);
      const feePaymentDataSnapShot = await getDoc(feePayment);
      const feePaymentData = {
        id: feePaymentDataSnapShot.id,
        ...feePaymentDataSnapShot.data(),
      };
      if (feePaymentData.publish === false) {
        return false;
      } else {
        return true;
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

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
      const studentDataDoc = doc(db, "students", feePaymentData.StudentID);
      const studentDataSnapshot = await getDoc(studentDataDoc);
      const studentData = {
        id: studentDataSnapshot.id,
        ...studentDataSnapshot.data(),
      };
      const feePaymentDataWithStudentClasses = {
        ...feePaymentData,
        classes: classesData,
        studentName: studentData.firstName + " " + studentData.lastName,
      };
      const feeData = {
        id: id,
        feeDetail: feePaymentDataSnapShot.data(),
        classes: classesData,
      };
      setFees(feeData);
      setFeePayments(feePaymentDataWithStudentClasses);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  async function fetchUserData() {
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnapshot = await getDoc(userDocRef);
      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();
        setUserData(userData);
        setLoading(false);
      } else {
        console.log("User not found");

        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setLoading(false);
    }
  }

  useEffect(() => {
    const checkAndFetchData = async () => {
      setLoading(true);
      const publishStatus = await checkPublish();
      if (publishStatus) {
        await fetchData();
        await fetchUserData();
      } else {
        navigate("/parent/fee");
      }
      setLoading(false);
    };

    checkAndFetchData();
  }, []);

  const confirmPayment = async () => {
    const result = await Swal.fire({
      title: "Are you sure you want process to make the payment?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      navigate(`/parent/fee/payment/${id}`);
    }
  };

  // const makePayment = async () => {
  //   const stripe = await loadStripe(
  //     "pk_test_51Ox8pMLX6vV4bYTHC6AR8YpbPIu5HWlfch5dauc8yvUUXwEz0gITpCUexMCGnKxMO29n2apcEvcfPCufOmtsk1fh00ujg1JGZi"
  //   );
  //   const paymentIntent = await fetch(
  //     "http://localhost:4242/api/create-payment-intent",
  //     {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         items: [
  //           {
  //             id: feePayments.id,
  //             classes: feePayments.classes.map((Class) => Class.Descriptions),
  //           },
  //         ],
  //       }),
  //     }
  //   ).then((res) => res.json());
  //   const result = await stripe.redirectToCheckout({
  //     sessionId: paymentIntent.id,
  //   });
  //   if (result.error) {
  //     console.error(result.error.message);
  //   }
  // };

  // Function to open the invoice modal
  const openInvoiceModal = () => {
    setIsInvoiceModalOpen(true);
  };

  // Function to close the invoice modal
  const closeInvoiceModal = () => {
    setIsInvoiceModalOpen(false);
  };

  const getDate = (timestamp) => {
    if (timestamp && timestamp.toDate) {
      const d = timestamp.toDate();
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, "0");
      const day = d.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    return ""; // Return an empty string if date is unknown
  };

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
                <div className="flex items-center mb-4 font-bold text-xl">
                  <Link
                    to="/parent/fee"
                    className="text-blue-500 hover:underline"
                  >
                    Fee payment
                  </Link>
                  <span className="mx-2">&nbsp;/&nbsp;</span>
                  <span className="text-gray-500">Viewing payment</span>
                </div>
                <p className="text-sm text-gray-500">
                  View and manage your fee payments {feePayments.length}
                </p>
              </div>
            </div>
          </div>
          <div className="block w-full overflow-x-auto">
            <div className="grid grid-cols-2 gap-y-3 mt-2 m-0 px-8">
              <div className="flex justify-center mt-5 mb-3 font-bold text-xl col-span-2 underline">
                Fee Details
              </div>
              <div className="font-bold">
                Due Date:{" "}
                <span className="font-normal">
                  {getDate(feePayments.DueDate)}
                </span>
              </div>
              <div className="font-bold">
                Payment Status:{" "}
                <span className="font-normal">
                  {feePayments.paymentStatus ? "Paid" : "Not Paid"}
                </span>
              </div>
              <div className="font-bold">
                Payment Date:{" "}
                <span className="font-normal">
                  {feePayments.paymentStatus
                    ? getDate(feePayments.paymentDate)
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
                </tr>
              </thead>
              <tbody>
                {feePayments.classes?.map((Classfee) => (
                  <tr key={Classfee.ClassId}>
                    {Classfee.Descriptions?.map((description, index) => (
                      <td
                        key={index}
                        className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4"
                      >
                        {description.length > 60
                          ? description.substring(0, 60) + "..."
                          : description}
                      </td>
                    ))}
                    {Classfee.FeeAmounts?.map((fee, index) => (
                      <td
                        key={index}
                        className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4"
                      >
                        RM {fee}
                      </td>
                    ))}
                    {Classfee.Quantity?.map((qty, index) => (
                      <td
                        key={index}
                        className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4"
                      >
                        {qty}
                      </td>
                    ))}
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      RM{" "}
                      {Classfee.FeeAmounts?.reduce(
                        (acc, curr, index) =>
                          acc + curr * Classfee.Quantity[index],
                        0
                      )}
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
                    RM{" "}
                    {feePayments.classes?.reduce(
                      (acc, curr) =>
                        acc +
                        curr.FeeAmounts?.reduce(
                          (subAcc, subCurr, index) =>
                            subAcc + subCurr * curr.Quantity[index],
                          0
                        ),
                      0
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="flex justify-center my-4">
              {!feePayments.paymentStatus ? (
                <button
                  onClick={confirmPayment}
                  className="text-white rounded-full font-bold py-2 px-4 bg-blue-500 hover:bg-blue-600"
                >
                  Make a payment
                </button>
              ) : (
                <div className="flex justify-center my-4">
                  <button
                    onClick={openInvoiceModal}
                    className="mb-3 rounded-lg font-bold py-2 px-4 bg-blue-500 text-white hover:bg-blue-600"
                  >
                    View Invoice
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {isInvoiceModalOpen && ( // Render InvoiceModal if isInvoiceModalOpen is true
        <InvoiceModal
          onClose={closeInvoiceModal}
          users={userData}
          fees={fees}
        />
      )}
    </>
  );
}

CardFeeView.defaultProps = {
  color: "light",
};
CardFeeView.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardFeeView;
