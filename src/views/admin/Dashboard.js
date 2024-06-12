import React, { useEffect } from "react";
import CardLineChart from "../../components/Cards/AdminCard/Dashboard/CardLineChart.js";
import CardBarChart from "../../components/Cards/AdminCard/Dashboard/CardBarChart.js";
import CardUnpaidList from "../../components/Cards/AdminCard/Dashboard/CardUnpaidList.js";
import CardAnnouncement from "../../components/Cards/AdminCard/Dashboard/CardAnnouncement.js";
import CardPaidList from "../../components/Cards/AdminCard/Dashboard/CardPaidList.js";

export default function Dashboard() {
  useEffect(() => {
    console.log("Dashboard.js mounted");
  }, []);

  return (
    <>
      <div className="flex flex-wrap">
        <div className="w-full xl:w-6/12">
          {/* <div className="w-full mb-12 px-4">
            <CardLineChart />
          </div>
          <div className="w-full mb-12 px-4">
            <CardBarChart />
          </div>
          <div className="w-full mb-12 px-4">
            <CardUnpaidList />
          </div>
          <div className="w-full mb-12 px-4">
            <CardPaidList />
          </div> */}
        </div>
        <div className="w-full xl:w-6/12">
          {/* <div className="w-full px-4">
            <CardAnnouncement />
          </div> */}
        </div>
      </div>
    </>
  );
}
