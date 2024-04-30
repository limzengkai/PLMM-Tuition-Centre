import { addDoc, collection, doc, getDocs, updateDoc } from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2"; // Import SweetAlert
import { db } from "../../../../config/firebase";
import CardLoading from "../../CardLoading";
import { AuthContext } from "../../../../config/context/AuthContext";

function PaymentPage() {
  const { id } = useParams();
  const { currentUser } = useContext(AuthContext);
  const [payment, setPayment] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [discountvalue, setDiscountvalue] = useState(0);
  // Define state variables for email, cardHolder, cardNo, expiry, and cvc
  const [email, setEmail] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardNo, setCardNo] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeePaymentData = async () => {
      try {
        setLoading(true);
        // Reference to the 'Classes' collection under the 'fees' document with the given id
        const feePaymentRef = collection(db, "fees", id, "Classes");
        // Get all documents from the collection
        const querySnapshot = await getDocs(feePaymentRef);
        // Initialize an empty array to store the payment data
        const paymentData = [];

        // Iterate over the documents and construct objects with id and data
        querySnapshot.forEach((doc) => {
          paymentData.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setPayment(paymentData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching fee payment data:", error);
      }
    };

    fetchFeePaymentData(); // Call the async function to fetch data
  }, [id]); // Make sure to include 'id' in the dependency array if it's a prop

  useEffect(() => {
    // Calculate subtotal
    const subtotalAmount = payment.reduce(
      (accumulator, fee) =>
        accumulator + fee.FeeAmounts.reduce((a, b) => a + b, 0),
      0
    );
    setSubtotal(subtotalAmount);
  }, [payment]);

  const handleDiscountSubmit = () => {
    console.log("I wish to have a discount!!!");
  };
  // Calculate total after applying discount
  const total = subtotal - discountvalue;

  const handleDiscountChange = (e) => {
    setDiscount(e.target.value);
  };

  const handleSubmit = async () => {
    // // Check if all required fields are filled
    // if (!email || !cardHolder || !cardNo || !expiry || !cvc) {
    //   Swal.fire({
    //     icon: "error",
    //     title: "Missing Information",
    //     text: "Please fill in all required fields before submitting.",
    //   });
    //   return;
    // }
  
    // // Validate card information format
    // const cardNoPattern = /\d{4}\d{4}\d{4}\d{4}/;
    // const expiryPattern = /(0[1-9]|1[0-2])\/[0-9]{2}/;
    // const cvcPattern = /\d{3}/;
  
    // if (!cardNoPattern.test(cardNo)) {
    //   Swal.fire({
    //     icon: "error",
    //     title: "Invalid Card Number",
    //     text: "Please enter a valid card number (xxxx-xxxx-xxxx-xxxx).",
    //   });
    //   return;
    // }
  
    // if (!expiryPattern.test(expiry)) {
    //   Swal.fire({
    //     icon: "error",
    //     title: "Invalid Expiry Date",
    //     text: "Please enter a valid expiry date (MM/YY).",
    //   });
    //   return;
    // }
  
    // if (!cvcPattern.test(cvc)) {
    //   Swal.fire({
    //     icon: "error",
    //     title: "Invalid CVC",
    //     text: "Please enter a valid CVC (3 digits).",
    //   });
    //   return;
    // }
  
    try {
      console.log("Enter")
      // Update payment status in the database
      await updateDoc(doc(db, "fees", id), {
        paymentStatus: true,
        paidAmount: total,
        paymentDate: new Date(),
      }).then(async() => {

      });
 
      // Display success message
      await Swal.fire({
        icon: "success",
        title: "Payment Successful",
        text: "Thank you for your payment!",
        confirmButtonText: "Back to Fee Payment Page",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/parent/fee");
        }
      });
    } catch (error) {
      console.error("Error submitting payment:", error);
      // Handle any errors that occur during payment submission
      Swal.fire({
        icon: "error",
        title: "Payment Error",
        text: "An error occurred while processing your payment. Please try again later.",
      });
    }
  };
  
  return (
    <>
      {loading ? (
        <CardLoading loading={loading} />
      ) : (
        <div className="relative mx-auto px-4 py-8 flex flex-col bg-white  min-w-0 break-words w-full shadow-lg rounded">
          <header className="flex justify-center border-b  py-4 sm:text-base lg:text-lg md:text-lg sm:flex-row sm:px-10 lg:px-20 xl:px-32 px-5">
            <a href="#" className="text-2xl font-bold text-gray-800">
              PLMM Tuition Centre Payment Page
            </a>
          </header>

          {/* Main Content */}
          <main className="grid sm:px-10 lg:grid-cols-2 lg:px-20 xl:px-32">
            {/* Order Summary */}
            <div className="px-4 pt-8">
              <p className="text-xl font-medium text-center">Payment Summary</p>
              <p className="text-gray-400 text-center">
                Check your items before paying the fee
              </p>
              {/* Products */}
              <div className="mt-8 space-y-3 rounded-lg border border-gray-400 px-2 py-4 sm:px-6">
                {payment.map((fee) => (
                  <div
                    className="flex flex-col rounded-lg bg-white sm:flex-row"
                    key={fee.id}
                  >
                    <div className="flex w-full flex-col px-4 py-4">
                      {fee.Descriptions.map((desc, index) => (
                        <span key={index} className="font-semibold">
                          {desc}
                        </span>
                      ))}
                      {fee.FeeAmounts.map((amount, index) => (
                        <p key={index} className="text-lg font-bold">
                          RM {amount.toFixed(2)} x {fee.Quantity[index]}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Details */}
            <div className="mt-10 bg-gray-50 px-4 pt-8 lg:mt-0">
              <p className="text-xl font-medium">Payment Details</p>
              <p className="text-gray-400">
                Complete your payment by providing your payment details.
              </p>
              <div>
                {/* Email */}
                <label
                  htmlFor="email"
                  className="mt-4 mb-2 block text-sm font-medium"
                >
                  Email
                </label>
                <input
                  type="text"
                  id="email"
                  name="email"
                  className="w-full rounded-md border border-gray-200 px-4 py-3 pl-11 text-sm shadow-sm outline-none focus:z-10 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="your.email@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {/* Card Holder */}
                <label
                  htmlFor="card-holder"
                  className="mt-4 mb-2 block text-sm font-medium"
                >
                  Card Holder*
                </label>
                <input
                  type="text"
                  id="card-holder"
                  name="card-holder"
                  className="w-full rounded-md border border-gray-200 px-4 py-3 pl-11 text-sm uppercase shadow-sm outline-none focus:z-10 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Your full name here"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  required
                />
                {/* Card Details */}
                {/* Card Number */}
                <label
                  htmlFor="card-no"
                  className="mt-4 mb-2 block text-sm font-medium"
                >
                  Card Details*
                </label>
                <div className="flex">
                  <div className="relative w-7/12 flex-shrink-0">
                    <input
                      type="text"
                      id="card-no"
                      name="card-no"
                      className="w-full rounded-md border border-gray-200 px-2 py-3 pl-11 text-sm shadow-sm outline-none focus:z-10 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="8888 8888 8888 8888"
                      value={cardNo}
                      onChange={(e) => setCardNo(e.target.value)}
                      pattern="\d{4}-\d{4}-\d{4}-\d{4}"
                      required
                    />
                  </div>
                  {/* Expiry Date */}
                  <input
                    type="text"
                    name="credit-expiry"
                    className="w-full rounded-md border border-gray-200 px-2 py-3 text-sm shadow-sm outline-none focus:z-10 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    pattern="(0[1-9]|1[0-2])\/[0-9]{2}"
                    required
                  />
                  {/* CVC */}
                  <input
                    type="text"
                    name="credit-cvc"
                    className="w-1/6 flex-shrink-0 rounded-md border border-gray-200 px-2 py-3 text-sm shadow-sm outline-none focus:z-10 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="CVC"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    pattern="\d{3}"
                    required
                  />
                </div>

                {/* Total */}
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Subtotal</p>
                  <p className="font-semibold text-gray-900">
                    ${subtotal.toFixed(2)}
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <label
                    htmlFor="discount"
                    className="text-sm font-medium text-gray-900"
                  >
                    Discount
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      id="discount"
                      name="discount"
                      className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter discount code"
                      value={discount}
                      onChange={handleDiscountChange}
                    />
                    <button
                      type="button"
                      className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:bg-blue-600"
                      onClick={handleDiscountSubmit}
                    >
                      Apply
                    </button>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Total</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ${total.toFixed(2)}
                  </p>
                </div>
              </div>
              {/* Place Order Button */}
              <button
                className="mt-4 mb-8 w-full rounded-md bg-gray-900 px-6 py-3 font-medium text-white"
                onClick={handleSubmit}
              >
                Place Order
              </button>
            </div>
          </main>
        </div>
      )}
    </>
  );
}

export default PaymentPage;
