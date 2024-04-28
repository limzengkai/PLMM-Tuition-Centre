import React from "react";

function CardMonthlyPayment({ monthlyPayments }) {
  return (
    <table className="w-full border-collapse border border-gray-300">
      <thead>
        <tr>
          <th className="py-2 px-4 bg-gray-100 border border-gray-300">Due Date</th>
          <th className="py-2 px-4 bg-gray-100 border border-gray-300">Amount</th>
          <th className="py-2 px-4 bg-gray-100 border border-gray-300">Description</th>
          <th className="py-2 px-4 bg-gray-100 border border-gray-300">Action</th>
        </tr>
      </thead>
      <tbody>
        {monthlyPayments.map(payment => (
          <tr key={payment.id} className="border-t border-gray-300">
            <td className="py-2 px-4 border border-gray-300">{payment.dueDate}</td>
            <td className="py-2 px-4 border border-gray-300">${payment.amount}</td>
            <td className="py-2 px-4 border border-gray-300">{payment.description}</td>
            <td className="py-2 px-4 border border-gray-300">
              {payment.paid ? (
                <button disabled className="bg-gray-400 text-white py-1 px-2 rounded cursor-not-allowed">Paid</button>
              ) : (
                <button className="bg-blue-500 text-white py-1 px-2 rounded hover:bg-blue-600">Make a Payment</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default CardMonthlyPayment;