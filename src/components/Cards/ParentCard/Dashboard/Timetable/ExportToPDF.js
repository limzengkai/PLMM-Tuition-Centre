import React from 'react';
import { pdf } from '@react-pdf/renderer';
import TimetablePDF from './TimetablePDF';

const ExportToPDF = ({ childrenDetails }) => {

  const handleDownload = async () => {
    const doc = <TimetablePDF childrenDetails={childrenDetails} />;
    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "timetable.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <button
      onClick={handleDownload}
      className="rounded-lg font-bold py-2 px-4 bg-blue-500 text-white hover:bg-blue-600"
    >
      Export to PDF
    </button>
  );
};

export default ExportToPDF;
