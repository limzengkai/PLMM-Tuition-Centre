import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../../config/firebase";
import Swal from "sweetalert2";

const DiscountType = Object.freeze({
  PERCENTAGE: "percentage",
  NUMERIC: "numeric",
});

const Visibility = Object.freeze({
  PUBLIC: "public",
  PRIVATE: "private",
});

function EditVoucherComponent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    code: "",
    discountType: DiscountType.PERCENTAGE,
    discountValue: 0,
    expiryDate: "",
    isActive: true,
    visibility: Visibility.PUBLIC,
    userId: "",
  });

  useEffect(() => {
    async function fetchVoucher() {
      try {
        const docRef = doc(db, "vouchers", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setVoucher(data);
          setFormData({
            ...data,
            expiryDate: data.expiryDate.toDate().toISOString().split("T")[0],
          });
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to save the changes to this voucher?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, save it!",
      cancelButtonText: "No, cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const docRef = doc(db, "vouchers", id);
          await updateDoc(docRef, {
            ...formData,
            expiryDate: new Date(formData.expiryDate),
          });
          Swal.fire({
            title: "Success",
            text: "Voucher updated successfully!",
            icon: "success",
            confirmButtonText: "OK",
          }).then(() => {
            navigate("/admin/fee/voucher");
          });
        } catch (error) {
          console.error("Error updating voucher:", error);
          Swal.fire({
            title: "Error",
            text: "There was an error updating the voucher. Please try again.",
            icon: "error",
            confirmButtonText: "OK",
          });
        }
      }
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!voucher) {
    return <div>Voucher not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-4 font-bold text-xl">
        <Link to="/admin/fee/voucher" className="text-blue-500 hover:underline">
          Voucher List
        </Link>
        <span className="mx-2">&nbsp;/&nbsp;</span>
        <span className="text-gray-500">Edit Voucher</span>
      </div>
      <h2 className="text-2xl font-bold mb-4">Edit Voucher</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2">Code:</label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Discount Type:</label>
          <select
            name="discountType"
            value={formData.discountType}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          >
            <option value={DiscountType.PERCENTAGE}>Percentage</option>
            <option value={DiscountType.NUMERIC}>Numeric</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-2">Discount Value:</label>
          <input
            type="number"
            name="discountValue"
            value={formData.discountValue}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Expiry Date:</label>
          <input
            type="date"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Status:</label>
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="mr-2"
          />
          Active
        </div>
        <div className="mb-4">
          <label className="block mb-2">Visibility:</label>
          <select
            name="visibility"
            value={formData.visibility}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          >
            <option value={Visibility.PUBLIC}>Public</option>
            <option value={Visibility.PRIVATE}>Private</option>
          </select>
        </div>
        {formData.visibility === Visibility.PRIVATE && (
          <div className="mb-4">
            <label className="block mb-2">User ID:</label>
            <input
              type="text"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
        )}
        <button
          type="submit"
          className="bg-blue-500 text-white py-2 px-4 rounded"
        >
          Save
        </button>
      </form>
    </div>
  );
}

export default EditVoucherComponent;
