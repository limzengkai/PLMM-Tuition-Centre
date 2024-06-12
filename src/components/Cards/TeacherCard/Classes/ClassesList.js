import React from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  Image,
  PDFViewer,
  pdf,
} from "@react-pdf/renderer";
import logo from "../../../../assets/img/PLMM Tuition Centre.jpg";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8,
    fontWeight: "bold",
    paddingTop: 30,
    paddingLeft: 60,
    paddingRight: 60,
    lineHeight: 1.5,
    flexDirection: "column",
  },
  section: {
    marginBottom: 10,
    marginTop: 10,
  },
  header: {
    padding: 10,
    alignItems: "center",
    fontWeight: "bold",
    backgroundColor: "#000000",
    borderRadius: 5,
    color: "#FFFFFF",
  },
  invoiceText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  logo: {
    width: 80,
    height: 70,
    borderRadius: 5,
  },
  label: {
    fontWeight: "bold",
  },
  detail: {
    display: "flex",
    flexDirection: "row",
    fontWeight: "bold",
    fontSize: 10,
    justifyContent: "space-between",
    alignItems: "center",
    padding: 5,
    marginBottom: 5,
    marginTop: 10,
  },
  text: {
    fontWeight: "normal", // Set font weight to normal
  },
  value: {
    marginBottom: 5,
  },
  tableheader: {
    flexDirection: "row",
    backgroundColor: "#F3F3EA",
    padding: 5,
    border: "1px solid #323220",
    borderRadius: 5,
    textAlign: "left",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  tableheaderText: {
    padding: 8,
    fontWeight: "bold",
    flex: 1,
  },
  tablebody: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    padding: 5,
    border: "1px solid #323220",
    marginTop: 5,
    borderRadius: 5,
    textAlign: "left",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  tablebodyText: {
    padding: 2,
    flex: 1,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 60,
    right: 60,
    textAlign: "center",
    fontSize: 10,
    color: "grey",
  },
});

const ClassesList = ({ students, classDetails }) => {
  return (
    <div>
      {/* Preview */}
      <PDFViewer style={{ width: "100%", height: "600px" }}>
        <Document>
          <Page size="A4" style={styles.page}>
            {/* Invoice header */}
            <View style={styles.header}>
              <Text style={styles.invoiceText}>PLMM Tuition Centre</Text>
            </View>

            {/* Student information */}
            <View style={styles.detail}>
              <Text style={styles.label}>
                Class Details: {" "}
                <Text style={styles.text}>{classDetails.CourseName}</Text>
              </Text>
              <Text style={styles.label}>
                Academic Level: {" "}
                <Text style={styles.text}>{classDetails.academicLevel}</Text>
              </Text>
              <Text style={styles.label}>
                Location: {" "}
                <Text style={styles.text}>{classDetails.location}</Text>
              </Text>
            </View>

            {/* Table for student details */}
            <View style={styles.section}>
              <View style={styles.tableheader}>
                <Text>No</Text>
                <Text>Student Name</Text>
                <Text>Student IC</Text>
                <Text>Parent Name</Text>
                <Text>Parent Contact Number</Text>
              </View>
              {students.map((student, index) => (
                <View style={styles.tablebody} key={index}>
                  <Text>{index + 1}</Text>
                  <Text>{student.firstName + " " + student.lastName}</Text>
                  <Text>{student.icNumber}</Text>
                  <Text>
                    {student.parentData.firstName +
                      " " +
                      student.parentData.lastName}
                  </Text>
                  <Text>{student.parentData.contactNumber}</Text>
                </View>
              ))}
            </View>

            {/* Invoice footer */}
            <Text style={styles.footer}>Thank you for your Payment</Text>
          </Page>
        </Document>
      </PDFViewer>

      {/* Download button */}
      <div className="flex justify-center">
        <button
          onClick={handleDownload}
          className="mt-3 ml-3 rounded-lg font-bold py-2 px-4 bg-blue-500 text-white hover:bg-blue-600"
        >
          Download PDF
        </button>
      </div>
    </div>
  );

  function handleDownload() {
    const doc = (
      <Document>
        <Page size="A4" style={styles.page}>
          {/* Invoice header */}
          <View style={styles.header}>
            <Text style={styles.invoiceText}>INVOICE</Text>
          </View>

          {/* Student information */}
          <View style={styles.section}>
            <Text style={styles.label}>List of Students</Text>
          </View>

          {/* Table for student details */}
          <View style={styles.section}>
            <View style={styles.tableheader}>
              <Text>No</Text>
              <Text>Student Name</Text>
              <Text>Student IC</Text>
              <Text>Parent Name</Text>
              <Text>Parent Contact Number</Text>
            </View>
            {students.map((student, index) => (
              <View style={styles.tablebody} key={index}>
                <Text>{index + 1}</Text>
                <Text>{student.name}</Text>
                <Text>{student.ic}</Text>
                <Text>{student.parentName}</Text>
                <Text>{student.parentContactNumber}</Text>
              </View>
            ))}
          </View>

          {/* Invoice footer */}
          <Text style={styles.footer}>Thank you for your Payment</Text>
        </Page>
      </Document>
    );

    pdf(doc)
      .toBlob()
      .then((blob) => {
        const pdfUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = pdfUrl;
        a.download = "invoice.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
  }
};

export default ClassesList;
