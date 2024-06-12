import React, { useEffect, useState } from "react";
import MUIDataTable from "mui-datatables";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@emotion/react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../../../config/firebase";

function CardAnnouncement() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const q = query(collection(db, "announcements"), orderBy("Date", "desc"));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setAnnouncements(data);
  };
  

  const columns = [
    {
      name: "Date",
    },
    {
      name: "Announcement",
    },
  ];

  const data = announcements.map((announcement) => [
    announcement.Date,
    announcement.Announcement,
  ]);

  const getMuiTheme = () =>
    createTheme({
      typography: {
        fontFamily: "Poppins",
      },
      overrides: {
        MUIDataTableHeadCell: { root: { fontSize: "12px" } },
        MUIDataTableBodyCell: { root: { fontSize: "12px" } },
      },
    });

  const options = {
    responsive: "standard",
    elevation: 0,
    download: false,
    filter: false,
    selectableRows: "none",
    print: false,
    search: false,
    viewColumns: false,
    rowsPerPage: 5,
    rowsPerPageOptions: [5, 10, 20],
  };

  return (
    <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
      <div className="rounded-t mb-0 px-4 py-3 bg-transparent">
        <div className="flex flex-wrap items-center">
          <div className="relative w-full max-w-full flex-grow flex-1">
            <h2 className="text-blueGray-700 text-xl font-semibold">
              ANNOUNCEMENT
            </h2>
          </div>
        </div>
      </div>
      <div className="p-4 flex-auto">
        <ThemeProvider theme={getMuiTheme()}>
          <MUIDataTable
            title=""
            data={data}
            columns={columns}
            options={options}
          />
        </ThemeProvider>
      </div>
    </div>
  );
}

export default CardAnnouncement;
