import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../../../config/firebase";

const generateUniqueVoucherCode = async (userID) => {
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

  const voucherData = {
    code,
    discountType: "numeric", // Default values, change as needed
    discountValue: 20, // Default values, change as needed
    expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // 1 month from now
    isActive: true,
    visibility: "private",
    userId: userID,
    usedBy: "",
  };

  await addDoc(collection(db, "vouchers"), voucherData);

  return {code, expiryDate: voucherData.expiryDate};
};

export default generateUniqueVoucherCode;
