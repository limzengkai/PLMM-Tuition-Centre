import React from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const ExportToPDF = () => {
  const exportToPDF = () => {
    const timetableElement = document.getElementById("timetable");
    const exportButton = document.getElementById("export-button");

    // Hide export button temporarily
    exportButton.style.display = "none";

    html2canvas(timetableElement).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("timetable.pdf");

      // Show export button again after capturing timetable
      exportButton.style.display = "block";
    });
  };

  return (
    <button
      id="export-button"
      className="mt-4 p-2 bg-green-500 text-white rounded"
      onClick={exportToPDF}
    >
      Export Timetable to PDF
    </button>
  );
};

export default ExportToPDF;
