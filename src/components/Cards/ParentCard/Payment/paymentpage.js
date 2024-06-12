import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2"; // Import SweetAlert
import { db } from "../../../../config/firebase";
import CardLoading from "../../CardLoading";
import { AuthContext } from "../../../../config/context/AuthContext";

function PaymentPage() {
  const { id } = useParams();
  const currentUser = useContext(AuthContext);
  const [total, setTotal] = useState(0);
  const [payment, setPayment] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(null);
  const [discountType, setDiscountType] = useState("");
  const [discountData, setDiscountData] = useState([]);
  const [discountCode, setDiscountCode] = useState("");
  const [discountID, setDiscountID] = useState("");
  const [discountStatusMssg, setDiscountStatusMssg] = useState("");
  const [loading, setLoading] = useState(false);
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
        const feePaymentRef = collection(db, "fees", id, "Classes");
        const querySnapshot = await getDocs(feePaymentRef);
        const paymentData = [];

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

    fetchFeePaymentData();
  }, [id]);

  useEffect(() => {
    const subtotalAmount = payment.reduce((accumulator, fee) => {
      const feeTotal = fee.FeeAmounts.reduce((sum, amount, index) => {
        const quantity = fee.Quantity[index];
        return sum + amount * quantity;
      }, 0);
      return accumulator + feeTotal;
    }, 0);

    setSubtotal(subtotalAmount);
    setTotal(subtotalAmount);
  }, [payment]);

  useEffect(() => {
    if (discount !== null) {
      let newTotal = subtotal;
      if (discountType === "percentage") {
        newTotal = subtotal * (1 - discount / 100);
      } else if (discountType === "numeric") {
        newTotal = subtotal - discount;
      }
      setTotal(newTotal);
    }
  }, [discount, subtotal, discountType]);

  const DiscountData = async () => {
    try {
      const publicDiscountData = await getDocs(
        query(collection(db, "vouchers"), where("visibility", "==", "public"))
      );
      const publicDiscountDataArray = publicDiscountData.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const privateDiscountData = await getDocs(
        query(
          collection(db, "vouchers"),
          where("visibility", "==", "private"),
          where("userId", "==", currentUser.currentUser.uid)
        )
      );
      const privateDiscountDataArray = privateDiscountData.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const combinedDiscountData = [
        ...publicDiscountDataArray,
        ...privateDiscountDataArray,
      ];

      setDiscountData(combinedDiscountData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching discounts data:", error);
    }
  };

  useEffect(() => {
    console.log(currentUser.currentUser.uid);
    console.log("Discount Data : ", discountData);
    DiscountData();
  }, []);

  const handleDiscountSubmit = async () => {
    console.log("asdasdasd");
    const appliedDiscount = discountData.find(
      (discount) => discount.code === discountCode
    );
    console.log(appliedDiscount);
    if (appliedDiscount) {
      // Find discount ID
      console.log("asd", appliedDiscount.id);
      const discountId = appliedDiscount.id;
      setDiscountID(discountId);
      setDiscount(appliedDiscount.discountValue);
      setDiscountType(appliedDiscount.discountType);
      setDiscountStatusMssg("Discount code applied successfully!");

      try {
        // Update the discount to set isActive to false
        await updateDoc(doc(db, "vouchers", discountId), {
          isActive: false,
        });
      } catch (error) {
        console.error("Error updating discount status:", error);
      }
    } else {
      setDiscount(0);
      setDiscountID("");
      setDiscountCode("");
      setDiscountType("");
      setDiscountStatusMssg("Invalid discount code!");
    }
  };

  const handleCardNoChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 16) {
      value = value.slice(0, 16);
    }
    setCardNo(
      value
        .match(/.{1,4}/g)
        ?.join(" ")
        .slice(0, 19) || ""
    );
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) {
      value = value.slice(0, 4);
    }
    if (value.length > 2) {
      value = value.slice(0, 2) + "/" + value.slice(2);
    }
    setExpiry(value);
  };

  const handleSubmit = async () => {
    if (!email || !cardHolder || !cardNo || !expiry || !cvc) {
      Swal.fire({
        icon: "error",
        title: "Missing Information",
        text: "Please fill in all required fields before submitting.",
      });
      return;
    }

    const cardNoPattern = /\d{4} \d{4} \d{4} \d{4}/;
    const expiryPattern = /(0[1-9]|1[0-2])\/[0-9]{2}/;
    const cvcPattern = /\d{3}/;

    if (!cardNoPattern.test(cardNo)) {
      Swal.fire({
        icon: "error",
        title: "Invalid Card Number",
        text: "Please enter a valid card number (xxxx xxxx xxxx xxxx).",
      });
      return;
    }

    if (!expiryPattern.test(expiry)) {
      Swal.fire({
        icon: "error",
        title: "Invalid Expiry Date",
        text: "Please enter a valid expiry date (MM/YY).",
      });
      return;
    }

    if (!cvcPattern.test(cvc)) {
      Swal.fire({
        icon: "error",
        title: "Invalid CVC",
        text: "Please enter a valid CVC (3 digits).",
      });
      return;
    }

    // Add confirmation prompt before final submission
    Swal.fire({
      title: "Confirm Payment",
      text: `You are about to pay RM ${total.toFixed(
        2
      )}. Do you want to proceed?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, confirm",
      cancelButtonText: "No, cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          if (discountID) {
            await updateDoc(doc(db, "fees", id), {
              paymentStatus: true,
              paidAmount: total,
              paymentDate: new Date(),
              isDiscount: true,
              DiscountID: discountID,
            });

            await updateDoc(doc(db, "vouchers", discountID), {
              isActive: false,
            });
          } else {
            await updateDoc(doc(db, "fees", id), {
              paymentStatus: true,
              paidAmount: total,
              paymentDate: new Date(),
              isDiscount: false,
              DiscountID: null,
            });
          }

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
          Swal.fire({
            icon: "error",
            title: "Payment Error",
            text: "An error occurred while processing your payment. Please try again later.",
          });
        }
      }
    });
  };

  return (
    <>
      {loading ? (
        <CardLoading loading={loading} />
      ) : (
        <div className="relative mx-auto px-4 py-8 flex flex-col bg-white min-w-0 break-words w-full shadow-lg rounded">
          <header className="flex justify-center border-b py-4 sm:text-base lg:text-lg md:text-lg sm:flex-row sm:px-10 lg:px-20 xl:px-32 px-5">
            <a href="#" className="text-2xl font-bold text-gray-800">
              PLMM Tuition Centre Payment Page
            </a>
          </header>

          <main className="grid sm:px-10 lg:grid-cols-2 lg:px-20 xl:px-32">
            <div className="px-4 pt-8">
              <p className="text-xl font-medium text-center">Payment Summary</p>
              <p className="text-gray-400 text-center">
                Check your items before paying the fee
              </p>
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

            <div className="mt-10 bg-gray-50 px-4 pt-8 lg:mt-0">
              <p className="text-xl font-medium">Payment Details</p>
              <p className="text-gray-400">
                Complete your payment by providing your payment details.
              </p>
              <div>
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
                      onChange={handleCardNoChange}
                      maxLength={19}
                      required
                    />
                  </div>
                  <input
                    type="text"
                    name="credit-expiry"
                    className="w-full rounded-md border border-gray-200 px-2 py-3 text-sm shadow-sm outline-none focus:z-10 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={handleExpiryChange}
                    maxLength={5}
                    required
                  />
                  <input
                    type="text"
                    name="credit-cvc"
                    className="w-1/6 flex-shrink-0 rounded-md border border-gray-200 px-2 py-3 text-sm shadow-sm outline-none focus:z-10 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="CVC"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    pattern="\d{3}"
                    maxLength={3}
                    required
                  />
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Subtotal</p>
                  <p className="font-semibold text-gray-900">
                    RM {subtotal.toFixed(2)}
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
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
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
                <p className="text-sm text-green-500">{discountStatusMssg}</p>
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Total</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    RM {total.toFixed(2)}
                  </p>
                </div>
              </div>
              <button
                className="mt-4 mb-8 w-full rounded-md bg-gray-900 px-6 py-3 font-medium text-white"
                onClick={handleSubmit}
              >
                Pay Now
              </button>
            </div>
          </main>
        </div>
      )}
    </>
  );
}

export default PaymentPage;
