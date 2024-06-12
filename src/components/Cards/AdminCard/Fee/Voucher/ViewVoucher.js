import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../../config/firebase";


function ViewVoucherComponent() {
  const { id } = useParams();
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVoucher() {
      try {
        const docRef = doc(db, "vouchers", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setVoucher(docSnap.data());
        } else {
          console.log("No such document!");
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching voucher data:", error);
      }
    }
    fetchVoucher();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!voucher) {
    return <div>Voucher not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">View Voucher</h2>
      <div className="mb-4">
        <strong>Code:</strong> {voucher.code}
      </div>
      <div className="mb-4">
        <strong>Discount Type:</strong> {voucher.discountType}
      </div>
      <div className="mb-4">
        <strong>Discount Value:</strong> {voucher.discountType === "percentage" ? `${voucher.discountValue}%` : `RM ${voucher.discountValue}`}
      </div>
      <div className="mb-4">
        <strong>Expiry Date:</strong> {new Date(voucher.expiryDate.toDate()).toLocaleDateString()}
      </div>
      <div className="mb-4">
        <strong>Status:</strong> {voucher.isActive ? "Active" : "Inactive"}
      </div>
      <div className="mb-4">
        <strong>Visibility:</strong> {voucher.visibility}
      </div>
      <div className="mb-4">
        <strong>User ID:</strong> {voucher.userId || "-"}
      </div>
      <Link to="/admin/voucher" className="text-blue-500 hover:text-blue-700">Back to List</Link>
    </div>
  );
}

export default ViewVoucherComponent;
