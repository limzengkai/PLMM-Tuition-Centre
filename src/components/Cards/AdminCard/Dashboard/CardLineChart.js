import React, { useEffect, useState } from "react";
import Chart from "chart.js/auto";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../../config/firebase";
import LineReportModal from "./LineReportModal";
import CardChartLoading from "../../CardChartLoading";

export default function CardLineChart() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const feesRef = collection(db, "fees");
        const querySnapshot = await getDocs(feesRef);
        const fees = [];
        querySnapshot.forEach((doc) => {
          fees.push(doc.data());
        });
        setFees(fees);

        const studentsRef = collection(db, "students");
        const studentsSnapshot = await getDocs(studentsRef);
        const students = [];
        studentsSnapshot.forEach((doc) => {
          students.push({ id: doc.id, ...doc.data() });
        });
        setStudents(students);

        const usersRef = query(
          collection(db, "users"),
          where("role", "==", "parent")
        );
        const usersSnapshot = await getDocs(usersRef);
        const users = [];
        usersSnapshot.forEach((doc) => {
          users.push({ id: doc.id, ...doc.data() });
        });
        setUsers(users);

        const data = {
          labels: [],
          datasets: [
            {
              label: new Date().getFullYear(),
              backgroundColor: "#4c51bf",
              borderColor: "#4c51bf",
              data: [],
              fill: false,
            },
          ],
        };

        querySnapshot.forEach((doc) => {
          const paymentDate = doc.data().paymentDate;
          const paidAmount = doc.data().paidAmount;
          const paymentStatus = doc.data().paymentStatus;

          if (paymentStatus) {
            if (paymentDate && paymentDate.seconds) {
              const date = new Date(paymentDate.seconds * 1000);
              const month = date.toLocaleString("default", { month: "long" });

              const yearDiff = new Date().getFullYear() - date.getFullYear();
              if (yearDiff === 0 || yearDiff === 1) {
                const datasetIndex = yearDiff === 0 ? 0 : 1;

                if (!data.labels.includes(month)) {
                  data.labels.push(month);
                  data.datasets[datasetIndex].data.push({ month, paidAmount });
                } else {
                  const monthIndex = data.labels.indexOf(month);
                  data.datasets[datasetIndex].data[monthIndex].paidAmount +=
                    paidAmount;
                }
              }
            }
          }
        });

        data.labels.sort((a, b) => {
          const months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ];
          return months.indexOf(a) - months.indexOf(b);
        });

        data.datasets.forEach((dataset) => {
          dataset.data.sort((a, b) => {
            return data.labels.indexOf(a.month) - data.labels.indexOf(b.month);
          });
          dataset.data = dataset.data.map((entry) => entry.paidAmount);
        });

        setChartData(data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (chartData) {
      const ctx = document.getElementById("line-chart");
      const existingChartInstance = Chart.getChart(ctx);
      if (existingChartInstance) {
        existingChartInstance.destroy(); // Destroy the existing Chart instance
      }
      new Chart(ctx, {
        type: "line",
        data: chartData,
        options: {
          maintainAspectRatio: false,
          responsive: true,
          title: {
            display: false,
            text: "Sales Charts",
            fontColor: "white",
          },
          legend: {
            labels: {
              fontColor: "white",
            },
            align: "end",
            position: "bottom",
          },
          tooltips: {
            mode: "index",
            intersect: false,
          },
          hover: {
            mode: "nearest",
            intersect: true,
          },
          scales: {
            xAxes: [
              {
                scaleLabel: {
                  display: true,
                  labelString: "probability",
                },
                ticks: {
                  fontColor: "#839156",
                },
                display: true,
                scaleLabel: {
                  display: false,
                  labelString: "Month",
                  fontColor: "white",
                },
                gridLines: {
                  display: false,
                  borderDash: [2],
                  borderDashOffset: [2],
                  color: "rgba(33, 37, 41, 0.3)",
                  zeroLineColor: "rgba(0, 0, 0, 0)",
                  zeroLineBorderDash: [2],
                  zeroLineBorderDashOffset: [2],
                },
              },
            ],
            yAxes: [
              {
                ticks: {
                  fontColor: "#839156",
                },
                display: true,
                scaleLabel: {
                  display: false,
                  labelString: "Value",
                  fontColor: "white",
                },
                gridLines: {
                  borderDash: [3],
                  borderDashOffset: [3],
                  drawBorder: false,
                  color: "rgba(255, 255, 255, 0.15)",
                  zeroLineColor: "rgba(33, 37, 41, 0)",
                  zeroLineBorderDash: [2],
                  zeroLineBorderDashOffset: [2],
                },
              },
            ],
          },
        },
      });
    }
  }, [chartData]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
        <div className="rounded-t mb-0 px-4 py-3 border-0">
          <div className="flex flex-wrap items-center">
            <div className="relative w-full px-4 max-w-full flex-grow flex-1">
              <h6 className="uppercase text-blueGray-500 mb-1 text-xs font-semibold">
                Overview
              </h6>
              <h2 className="text-blueGray-500  text-xl font-semibold">
                Monthly Sales Value
              </h2>
            </div>
            <LineReportModal users={users} fees={fees} students={students} />
          </div>
        </div>
        <div className="p-4 flex-auto">
          {loading ? (
            <CardChartLoading /> // Render loading indicator
          ) : (
            <div className="relative h-350-px">
              <canvas id="line-chart"></canvas>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
