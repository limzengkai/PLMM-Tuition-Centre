import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
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

function AddVoucherComponent() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    code: "",
    discountType: DiscountType.PERCENTAGE,
    discountValue: 0,
    expiryDate: "",
    isActive: true,
    visibility: Visibility.PUBLIC,
    userId: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const generateRandomCode = async () => {
    const length = 10;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code;
    let isUnique = false;

    while (!isUnique) {
      code = Array.from({ length }, () =>
        chars.charAt(Math.floor(Math.random() * chars.length))
      ).join("");
      const vouchersQuery = query(
        collection(db, "vouchers"),
        where("code", "==", code)
      );
      const querySnapshot = await getDocs(vouchersQuery);
      if (querySnapshot.empty) {
        isUnique = true;
      }
    }

    return code;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validation
    if (
      formData.discountType === DiscountType.PERCENTAGE &&
      formData.discountValue > 100
    ) {
      setError(
        "Discount value cannot exceed 100% for percentage discount type."
      );
      return;
    }

    setError(""); // Clear any previous errors

    try {
      const uniqueCode = await generateRandomCode();
      await addDoc(collection(db, "vouchers"), {
        ...formData,
        code: uniqueCode,
        expiryDate: new Date(formData.expiryDate),
      });
      Swal.fire({
        title: "Success",
        text: "Voucher added successfully!",
        icon: "success",
        confirmButtonText: "OK",
      }).then(() => {
        navigate("/admin/fee/voucher");
      });
    } catch (error) {
      console.error("Error adding voucher:", error);
      Swal.fire({
        title: "Error",
        text: "There was an error adding the voucher. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-4 font-bold text-xl">
        <Link to="/admin/fee/voucher" className="text-blue-500 hover:underline">
          Voucher List
        </Link>
        <span className="mx-2">&nbsp;/&nbsp;</span>
        <span className="text-gray-500">Add New Voucher</span>
      </div>
      <h2 className="text-2xl font-bold mb-4">Add Voucher</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2">Code:</label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Auto-generated code"
            disabled
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
          {formData.discountType === DiscountType.PERCENTAGE &&
            formData.discountValue > 100 && (
              <p className="text-red-500 text-sm">
                Discount value cannot exceed 100% for percentage discount type.
              </p>
            )}
        </div>
        <div className="mb-4">
          <label className="block mb-2">Expiry Date:</label>
          <input
            type="date"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            min={new Date().toISOString().split("T")[0]}
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
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button
          type="submit"
          className="bg-blue-500 text-white py-2 px-4 rounded"
        >
          Add Voucher
        </button>
      </form>
    </div>
  );
}

export default AddVoucherComponent;
