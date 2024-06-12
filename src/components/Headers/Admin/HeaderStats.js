import React, { useContext, useEffect, useState } from "react";
import CardStats from "../../Cards/CardStats.js";
import { AuthContext } from "../../../config/context/AuthContext.js";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../config/firebase.js";
import CardDashboardLoading from "../../Cards/CardDashboardLoading.js";

export default function HeaderStats() {
  const { currentUser } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [lastPayment, setLastPayment] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentQuery = query(collection(db, "students"));
        const studentSnapshot = await getDocs(studentQuery);
        const studentsData = [];
        studentSnapshot.forEach((doc) => {
          studentsData.push({ id: doc.id, ...doc.data() });
        });
        setStudents(studentsData);

        let totalOutstanding = 0;
        let totalLastPayment = 0;
        await Promise.all(
          studentsData.map(async (student) => {
            const feeQuery = query(
              collection(db, "fees"),
              where("StudentID", "==", student.id),
              where("paymentStatus", "==", false)
            );

            const feeSnapshot = await getDocs(feeQuery);
            const feeData = [];
            feeSnapshot.forEach((doc) => {
              feeData.push({ id: doc.id, ...doc.data() });
            });

            // Fetch the latest payment date
            const paymentQuery = query(
              collection(db, "fees"),
              where("StudentID", "==", student.id),
              where("paymentStatus", "==", true)
            );
            const paymentSnapshot = await getDocs(paymentQuery);
            paymentSnapshot.forEach(async (doc) => {
              if (
                doc.data().paymentDate.toDate().getMonth() ===
                  new Date().getMonth() &&
                doc.data().paymentDate.toDate().getFullYear() ===
                  new Date().getFullYear()
              ) {
                await getDocs(collection(db, "fees", doc.id, "Classes")).then(
                  (snapshot) => {
                    snapshot.forEach((fee) => {
                      const feeAmounts = fee.data().FeeAmounts;
                      const quantities = fee.data().Quantity;

                      for (let i = 0; i < feeAmounts.length; i++) {
                        const feeAmount = feeAmounts[i];
                        const quantity = quantities[i];
                        const classTotal = feeAmount * quantity;
                        totalLastPayment += classTotal;
                      }
                    });
                    setLastPayment(totalLastPayment);
                  }
                );
              }
            });

            const totalClassesFee = [];
            await Promise.all(
              feeData.map(async (fee) => {
                const classQuery = collection(db, "fees", fee.id, "Classes");
                const classSnapshot = await getDocs(classQuery);
                classSnapshot.forEach((doc) => {
                  totalClassesFee.push(doc.data());
                });
              })
            );

            totalClassesFee.forEach((fee) => {
              const feeAmounts = fee.FeeAmounts;
              const quantities = fee.Quantity;

              for (let i = 0; i < feeAmounts.length; i++) {
                const feeAmount = feeAmounts[i];
                const quantity = quantities[i];

                const classTotal = feeAmount * quantity;
                totalOutstanding += classTotal;
              }
            });
          })
        );
        setLoading(false);
        setTotalOutstanding(totalOutstanding);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();
  }, [currentUser]);

  return (
    <>
      {/* Header */}
      <div className="relative bg-lightBlue-600 md:pt-32 pb-32 pt-12">
        <div className="px-4 md:px-10 mx-auto w-full">
          <div>
            {/* Card stats */}
            <div className="flex flex-wrap justify-center">
              <div className="w-full lg:w-6/12 xl:w-3/12 px-4">
                <CardStats
                  statSubtitle="Total Students"
                  statTitle={
                    loading ? <CardDashboardLoading /> : students.length
                  }
                  statArrow="up"
                  statPercent="3.48"
                  statPercentColor="text-emerald-500"
                  statDescripiron="Since last month"
                  statIconName="fa-solid fa-person"
                  statIconColor="bg-red-500"
                />
              </div>
              {/* <div className="w-full lg:w-6/12 xl:w-3/12 px-4">
                <CardStats
                  statSubtitle="NEW USERS"
                  statTitle="2,356"
                  statArrow="down"
                  statPercent="3.48"
                  statPercentColor="text-red-500"
                  statDescripiron="Since last week"
                  statIconName="fas fa-chart-pie"
                  statIconColor="bg-orange-500"
                />
              </div> */}
              <div className="w-full lg:w-6/12 xl:w-3/12 px-4">
                <CardStats
                  statSubtitle="All Outstanding Fees"
                  statTitle={
                    loading ? (
                      <CardDashboardLoading />
                    ) : (
                      "RM " + totalOutstanding.toFixed(2)
                    )
                  }
                  statArrow="down"
                  statPercent="1.10"
                  statPercentColor="text-orange-500"
                  statDescripiron="Since yesterday"
                  statIconName="fa-solid fa-money-bill"
                  statIconColor="bg-pink-500"
                />
              </div>
              <div className="w-full lg:w-6/12 xl:w-3/12 px-4">
                <CardStats
                  statSubtitle="Last Month Income"
                  statTitle={
                    loading ? (
                      <CardDashboardLoading />
                    ) : (
                      "RM " + lastPayment.toFixed(2)
                    )
                  }
                  statArrow="up"
                  statPercent="12"
                  statPercentColor="text-emerald-500"
                  statDescripiron={`On ${new Date().getMonth() + 1}/${new Date().getFullYear()}`}
                  statIconName="fa-solid fa-list"
                  statIconColor="bg-lightBlue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
