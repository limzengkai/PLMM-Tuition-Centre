import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  pdf,
} from "@react-pdf/renderer";
import logo from "../../../../../assets/img/PLMM Tuition Centre.jpg"

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 6,
    paddingTop: 30,
    paddingLeft: 60,
    paddingRight: 60,
    lineHeight: 1.5,
    flexDirection: "column",
    backgroundColor: "#f8f9fa",
    orientation: "landscape",  // Set orientation to landscape
  },
  header: {
    padding: 10,
    alignItems: "center",
    backgroundColor: "#000000",
    borderRadius: 5,
    color: "#FFFFFF",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  logo: {
    width: 80,
    height: 70,
    borderRadius: 5,
    marginLeft: "auto",
    marginRight: "auto",
  },
  section: {
    marginBottom: 10,
    marginTop: 10,
  },
  label: {
    fontWeight: "bold",
    fontSize: 12,
    marginVertical: 5,
  },
  timeSlot: {
    height: 30,  // Reduce height to half
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    paddingLeft: 5,
    paddingRight: 5,
    borderBottom: "1px solid #ddd",
    backgroundColor: "#e9ecef",
  },
  timeSlotTitle: {
    height: 30,  // Reduce height to half
    backgroundColor: "#343a40",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },
  flexContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  dayColumn: {
    flex: 1,
    border: "1px solid #ddd",
    minWidth: 60,
    position: "relative",
    paddingTop: 30,
  },
  dayHeader: {
    textAlign: "center",
    backgroundColor: "#495057",
    color: "#ffffff",
    padding: 10,
    fontSize: 5,
    fontWeight: "bold",
    position: "absolute",
    top: 0,
    width: "100%",
  },
  timetableEntry: {
    position: "absolute",
    width: "100%",
    backgroundColor: "#6c757d",
    color: "#ffffff",
    borderRadius: 8,
    padding: 10,
    boxSizing: "border-box",
    fontSize: 5,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  entrySubject: {
    fontWeight: "bold",
    fontSize: 6,
  },
  entryLocation: {
    fontSize: 5,
    marginTop: 5,
  },
  entryTime: {
    fontSize: 5,
    marginTop: 5,
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

const TimetablePDF = ({ childrenDetails }) => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const startHour = 8;

  const calculateEndHour = (classes) => {
    let latestEndTime = 18;
    classes.forEach((classData) => {
      classData.schedule.forEach((schedule) => {
        const endTime = new Date(schedule.endTime.seconds * 1000 + schedule.endTime.nanoseconds / 1000000);
        const endHour = endTime.getHours();
        const endMinute = endTime.getMinutes();
        if (endHour > latestEndTime || (endHour === latestEndTime && endMinute > 0)) {
          latestEndTime = endMinute > 0 ? endHour + 1 : endHour;
        }
      });
    });
    return latestEndTime < 18 ? 18 : latestEndTime;
  };

  const renderTimetable = (classes) => {
    return days.map((day) => {
      const daySubjects = classes
        .flatMap((classData) =>
          classData.schedule.map((schedule) => ({ ...schedule, ...classData }))
        )
        .filter((entry) => entry.day === day);

      return (
        <View key={day} style={styles.dayColumn}>
          <Text style={styles.dayHeader}>{day}</Text>
          {daySubjects.map((entry, index) => {
            const startTime = new Date(
              entry.startTime.seconds * 1000 +
              entry.startTime.nanoseconds / 1000000
            );
            const endTime = new Date(
              entry.endTime.seconds * 1000 +
              entry.endTime.nanoseconds / 1000000
            );

            const top = ((startTime.getHours() - 8) * 30) + startTime.getMinutes() / 2 + 30;  // Adjust top position
            const height = (((endTime.getHours() - startTime.getHours()) * 60) +
              (endTime.getMinutes() - startTime.getMinutes())) / 2;  // Adjust height

            return (
              <View
                key={index}
                style={{
                  ...styles.timetableEntry,
                  top: isNaN(top) ? 0 : `${top}px`,
                  height: isNaN(height) ? 0 : `${height}px`,
                }}
              >
                <Text style={styles.entrySubject}>{entry.CourseName}</Text>
                <Text style={styles.entryLocation}>{entry.location}</Text>
                <Text style={styles.entryTime}>
                  {convertTimestamp(entry.startTime)} - {convertTimestamp(entry.endTime)}
                </Text>
              </View>
            );
          })}
        </View>
      );
    });
  };

  const convertTimestamp = (timestamp) => {
    const date = new Date(
      timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000
    );
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const handleDownload = () => {
    const doc = (
      <Document>
        <Page style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>PLMM Tuition Centre Timetable</Text>
            <Image src={logo} style={styles.logo} />
          </View>
          {childrenDetails.map((child) => (
            <View key={child.id}>
              <Text style={styles.label}>
                {child.childDetails.firstName} {child.childDetails.lastName}'s Timetable
              </Text>
              <View style={styles.flexContainer}>
                <View>
                  <View style={styles.timeSlotTitle}>
                    <Text>Time</Text>
                  </View>
                  {Array.from({ length: 10 }, (_, i) => i + startHour).map((hour) => (
                    <View key={hour} style={styles.timeSlot}>
                      <Text>{`${hour.toString().padStart(2, "0")}:00`}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.flexContainer}>{renderTimetable(child.classes)}</View>
              </View>
            </View>
          ))}
          <Text style={styles.footer}>Thank you for using PLMM Tuition Centre</Text>
        </Page>
      </Document>
    );

    pdf(doc)
      .toBlob()
      .then((blob) => {
        const pdfUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = pdfUrl;
        a.download = `timetable_${new Date().toLocaleDateString()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
  };

  return (
    <div>
      <button
        onClick={handleDownload}
        className="rounded-lg font-bold py-2 px-4 bg-blue-500 text-white hover:bg-blue-600"
      >
        Download PDF
      </button>
    </div>
  );
};

export default TimetablePDF;
