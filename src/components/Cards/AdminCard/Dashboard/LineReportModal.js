import React, { useState } from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 20,
  },
  page: {
    padding: 30,
    fontSize: 10,
  },
  section: {
    marginBottom: 10,
  },
  tableHeader: {
    backgroundColor: "#f0f0f0",
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  columnHeader: {
    flex: 1,
    textAlign: "center",
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  cell: {
    flex: 1,
    textAlign: "center",
  },
  dropdown: {
    marginBottom: 10,
  },
});

const ReportModal = ({ users, fees, students }) => {
  const [selectedMonth, setSelectedMonth] = useState("");

  // Function to handle dropdown change
  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  // Get unique months from fee due dates
  const months = [
    ...new Set(fees.map((fee) => fee.DueDate?.toDate().getMonth())),
  ];

  // Check if fees array is empty or undefined
  if (!fees || fees.length === 0) {
    return (
      <div>
        <p>No fees data available</p>
      </div>
    );
  }

  const monthsName = [
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

  return (
    <div className="flex justify-center flex-col">
      {/* Dropdown menu */}
      <select
        className="bg-white border border-gray-400 rounded py-2 px-4 text-sm block w-full"
        onChange={handleMonthChange}
        value={selectedMonth}
      >
        <option value="">Select Month</option>
        {months.map((month, index) => (
          <option key={index} value={month}>
            {new Date(0, month).toLocaleString("default", { month: "long" })}
          </option>
        ))}
      </select>

      <button
        onClick={handleDownload}
        className="mt-2 mx-7 bg-indigo-500 text-white active:bg-indigo-600 text-xs font-bold uppercase px-3 py-1 rounded outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
        type="button"
        disabled={!selectedMonth} // Disable button if no month selected
      >
        Get Report
      </button>
    </div>
  );

  function handleDownload() {
    const filteredFees = fees.filter(
      (fee) =>
        fee.paymentDate?.toDate().getMonth() === parseInt(selectedMonth) &&
        fee.paymentStatus // Include only fees with paymentStatus set to true
    );

    // Check if filteredFees is empty
    if (filteredFees.length === 0) {
      alert("No records found for the selected month.");
      return;
    }

    const doc = (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.title}>
              {monthsName[selectedMonth]} Payment Report
            </Text>
          </View>
          <View style={styles.section}>
            <View style={styles.tableHeader}>
              <Text style={styles.columnHeader}>Parent Name</Text>
              <Text style={styles.columnHeader}>Student Name</Text>
              <Text style={styles.columnHeader}>Academic Level</Text>
              <Text style={styles.columnHeader}>Due Date</Text>
              <Text style={styles.columnHeader}>Payment Date</Text>
              <Text style={styles.columnHeader}>Payment Fee(RM)</Text>
            </View>
            {filteredFees.map((fee) => {
              const student = students.find(
                (student) => student.id === fee.StudentID
              );
              const StudentfullName = student
                ? `${student.firstName} ${student.lastName}`
                : "-";
              return (
                <View style={styles.tableRow} key={fee.id}>
                  <Text style={styles.cell}>
                    {
                      users.find(
                        (user) =>
                          user.id ===
                          students.find(
                            (student) => student.id === fee.StudentID
                          )?.parentId
                      )?.firstName
                    }{" "}
                    {
                      users.find(
                        (user) =>
                          user.id ===
                          students.find(
                            (student) => student.id === fee.StudentID
                          )?.parentId
                      )?.lastName
                    }
                  </Text>
                  <Text style={styles.cell}>{StudentfullName}</Text>
                  <Text style={styles.cell}>
                    {
                      students.find((student) => student.id === fee.StudentID)
                        ?.educationLevel
                    }
                  </Text>
                  <Text style={styles.cell}>
                    {fee.DueDate?.toDate().toLocaleDateString()}
                  </Text>
                  <Text style={styles.cell}>
                    {fee.paymentDate
                      ? fee.paymentDate?.toDate().toLocaleDateString()
                      : "Not Paid"}
                  </Text>
                  <Text style={styles.cell}>{fee.paidAmount}</Text>
                </View>
              );
            })}
          </View>
        </Page>
      </Document>
    );

    pdf(doc)
      .toBlob()
      .then((blob) => {
        const pdfUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = pdfUrl;
        a.download = "MonthlySales (" + monthsName[selectedMonth] + ").pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
  }
};

export default ReportModal;
