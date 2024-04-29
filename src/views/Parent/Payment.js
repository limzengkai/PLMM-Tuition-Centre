import React from "react";

import PaymentPage from "../../components/Cards/ParentCard/Payment/paymentpage";

export default function Payment() {

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap">
        <div className="w-full">
          <PaymentPage/>
        </div>
      </div>
    </>
  );
}