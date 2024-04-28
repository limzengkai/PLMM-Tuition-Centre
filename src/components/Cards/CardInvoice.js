import React from "react";
import PropTypes from "prop-types";

function Invoice({ payment, onClose }) {
  const { studentName, studentID, fee, description, paidDate, paid } = payment;

  // Calculate total fee
  const totalFee = fee.reduce((acc, curr) => acc + curr, 0);

  return (
    <div className="bg-gray-100 font-sans">
      {/* Header */}
      <header className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold text-center uppercase text-white bg-black py-2 rounded">
          INVOICE
        </h1>
        <div className="flex justify-between mt-4">
          <address className="w-1/2">
            {/* Display student information */}
            <p className="font-semibold">{studentName}/{studentID}</p>
            <p>{description}</p>
          </address>
          {/* Close button */}
          <button
            onClick={onClose}
            className="text-white rounded-full font-bold py-2 px-4 bg-red-500 hover:bg-red-600"
          >
            Close
          </button>
        </div>
      </header>

      {/* Article */}
      <article className="container mx-auto px-4">
        {/* Table */}
        <table className="w-full mt-12">
          <thead>
            <tr>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Quantity</th>
              <th className="px-4 py-2">Unit Price</th>
              <th className="px-4 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {/* Display fee details */}
            <tr>
              <td className="border px-4 py-2">{description}</td>
              <td className="border px-4 py-2">1</td>
              <td className="border px-4 py-2">{totalFee}</td>
              <td className="border px-4 py-2">{totalFee}</td>
            </tr>
          </tbody>
        </table>
      </article>

      {/* Total Amount */}
      <div className="container mx-auto mt-8 px-4">
        <p className="font-semibold text-lg">Total Amount Due: ${totalFee}</p>
      </div>
    </div>
  );
}

Invoice.propTypes = {
  payment: PropTypes.shape({
    studentName: PropTypes.string.isRequired,
    studentID: PropTypes.string.isRequired,
    fee: PropTypes.arrayOf(PropTypes.number).isRequired,
    description: PropTypes.string.isRequired,
    paidDate: PropTypes.string.isRequired,
    paid: PropTypes.bool.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Invoice;
