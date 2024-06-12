import React, { useEffect, useState, useRef } from "react";
import Chart from "chart.js/auto";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../config/firebase";
import CardChartLoading from "../../CardChartLoading";

export default function CardBarChart() {
  const [chartInstance, setChartInstance] = useState(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let students = [];
        const studentDocRef = collection(db, "students");
        const querySnapshot = await getDocs(studentDocRef);
        querySnapshot.forEach((doc) => {
          students.push(doc.data());
        });

        console.log("STUDENTS:  ", students);

        const educationLevels = [
          "Standard 1",
          "Standard 2",
          "Standard 3",
          "Standard 4",
          "Standard 5",
          "Standard 6",
          "Form 1",
          "Form 2",
          "Form 3",
          "Form 4",
          "Form 5",
        ];

        const educationLevelCounts = educationLevels.map((level) => {
          return students.filter((student) => student.educationLevel === level)
            .length;
        });
        console.log("EDUCATION LEVEL COUNTS: ", educationLevelCounts);
        updateChart(educationLevelCounts);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching student data: ", error);
        fetchData();
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const updateChart = (data) => {
    const ctx = chartRef.current.getContext("2d");

    if (chartInstance) {
      chartInstance.destroy();
    }

    const config = {
      type: "bar",
      data: {
        labels: [
          "Standard 1",
          "Standard 2",
          "Standard 3",
          "Standard 4",
          "Standard 5",
          "Standard 6",
          "Form 1",
          "Form 2",
          "Form 3",
          "Form 4",
          "Form 5",
        ],
        datasets: [
          {
            label: new Date().getFullYear(),
            backgroundColor: "#4c51bf",
            borderColor: "#4c51bf",
            data,
            barThickness: 8,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          legend: {
            labels: {
              fontColor: "rgba(0,0,0,.4)",
            },
            align: "end",
            position: "bottom",
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: "Education Level",
            },
            grid: {
              borderDash: [2],
              borderDashOffset: [2],
              color: "rgba(33, 37, 41, 0.3)",
              zeroLineColor: "rgba(33, 37, 41, 0.3)",
              zeroLineBorderDash: [2],
              zeroLineBorderDashOffset: [2],
            },
          },
          y: {
            display: true,
            title: {
              display: true,
              text: "Number of Students",
            },
            grid: {
              borderDash: [2],
              drawBorder: false,
              borderDashOffset: [2],
              color: "rgba(33, 37, 41, 0.2)",
              zeroLineColor: "rgba(33, 37, 41, 0.15)",
              zeroLineBorderDash: [2],
              zeroLineBorderDashOffset: [2],
            },
          },
        },
      },
    };

    const newChartInstance = new Chart(ctx, config);
    setChartInstance(newChartInstance);
  };

  return (
    <>
      <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
        <div className="rounded-t mb-0 px-4 py-3 bg-transparent">
          <div className="flex flex-wrap items-center">
            <div className="relative w-full max-w-full flex-grow flex-1">
              <h6 className="uppercase text-blueGray-400 mb-1 text-xs font-semibold">
                Student Number
              </h6>
              <h2 className="text-blueGray-700 text-xl font-semibold">
                Total Student
              </h2>
            </div>
          </div>
        </div>
        <div className="p-4 flex-auto">
          {loading ? (
            <CardChartLoading />
          ) : (
            <div className="relative h-350-px">
              <canvas ref={chartRef}></canvas>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
