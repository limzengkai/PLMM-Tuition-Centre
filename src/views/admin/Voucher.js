import React from "react";
import { useLocation } from "react-router-dom";

// components
import CardVoucher from "../../components/Cards/AdminCard/Fee/Voucher/CardVoucherManagement";
import AddVoucher from "../../components/Cards/AdminCard/Fee/Voucher/AddVoucher";
import VoucherView from "../../components/Cards/AdminCard/Fee/Voucher/ViewVoucher";
import VoucherEdit from "../../components/Cards/AdminCard/Fee/Voucher/EditVoucher";


export default function Voucher() {
    const location = useLocation();

  return (
    <>
      <div className="flex flex-wrap">
        <div className="w-full px-4">
          <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
            {location.pathname.startsWith("/admin/fee/voucher/view") ? (
              <VoucherView />
            ) : location.pathname.startsWith("/admin/fee/voucher/add") ? (
              <AddVoucher />
            ) : location.pathname.startsWith("/admin/fee/voucher/edit") ? (
              <VoucherEdit />
            ) : (
              <CardVoucher />
            )}
          </div>
        </div>
      </div>
    </>
  );
}