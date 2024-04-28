import React from "react";
import { Document, Page, StyleSheet, Text, View, Image, PDFViewer, pdf } from "@react-pdf/renderer";
import logo from "../../../assets/img/PLMM Tuition Centre.jpg";


const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 12,
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
  value: {
    marginBottom: 5,
  },
  tableheader: {
    backgroundColor: "#F3F3EA",
    paddingTop: 5,
    border: "1px solid #323220",
    borderRadius: 5,
    textAlign: "center",
  },
  tablebody: {
    backgroundColor: "#ffffff",
    paddingTop: 5,
    border: "1px solid #323220",
    marginTop: 5,
    borderRadius: 5,
    textAlign: "center",
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
  flexContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  leftHalfContainer: {
    width: "50%",
    marginRight: 10,
  },
  rightHalfContainer: {
    width: "50%",
    marginLeft: 10,
  },
  TableFirstContainer: {
    width: "40%",
    marginRight: 10,
  },
  TableSecondContainer: {
    width: "20%",
    marginLeft: 10,
  },
  TableThirdContainer: {
    width: "20%",
    paddingLeft: 10,
    paddingTop: 5,
    backgroundColor: "#EBEBEB",
    border: "1px solid #323220",
    borderRadius: 5,
  },
  TableFourthContainer: {
    width: "20%",
    marginLeft: 5,
    paddingTop: 5,
    paddingLeft: 10,
    border: "1px solid #323220",
    borderRadius: 5,
  },
});

const InvoiceModal = ({ isOpen, onClose, students, users, fees }) => {

  return (
    <div>
      {/* Preview */}
      <PDFViewer style={{ width: "100%", height: "600px" }}>
        <Document>
          <Page size="A4" style={styles.page}>
            {/* Invoice header */}
            <View style={styles.header}>
              <Text style={styles.invoiceText}>INVOICE</Text>
            </View>
            
            {/* Student information */}
            <View style={styles.section}>
                {/* Flex for header */}
              <View style={styles.flexContainer}>
                <View>
                    <Text style={styles.label}>Invoice ID: </Text>
                    <Text style={styles.label}>Payment Date: </Text>
                    <Text style={styles.label}>Due Date: {fees && fees.feeDetail.DueDate.toDate().toDateString()}</Text>
                </View>
                <View style={styles.label}>
                    <Image src={logo} style={styles.logo} />
                </View>
              </View>
            </View>

            {/* Fee details */}
            <View style={styles.flexContainer}>
                <View style={[styles.section, styles.leftHalfContainer]}>
                    <Text style={styles.label}>PLMM Tuition Center</Text>
                    <Text style={styles.label}>Address: No. 21, 21A, 23A & 25A, Jalan Pendekar 17, Taman Ungku Tun Aminah, 81300 Skudai, Johor</Text>
                    <Text style={styles.label}>016-710 8177</Text>
                 </View>    
                
                <View style={[styles.section, styles.rightHalfContainer]}>
                    <Text style={styles.label}>This Invoice is to: </Text>
                    <Text style={styles.label}>
                        {users.firstName} {users.lastName}
                    </Text>
                    <Text style={styles.label}>
                        Address: {users.address}, {users.postcode} {users.city}, {users.state}
                    </Text>
                    <Text style={styles.label}>{users.contactNumber}</Text>
                </View>
            </View>
            
            {/* Table for fee details */}
            <View style={styles.flexContainer}>
              <View style={[styles.section, styles.TableFirstContainer]}>
                <Text style={styles.tableheader}>DESCRIPTION</Text>
                {fees && fees.classes.map((Classfee, index) => (
                  <React.Fragment key={index}>
                    {Classfee.Descriptions.map((description, idx) => (
                      <Text key={idx} style={styles.tablebody}>
                        {description}
                      </Text>
                    ))}
                  </React.Fragment>
                ))}
              </View>

              <View style={[styles.section, styles.TableSecondContainer]}>
                <Text style={styles.tableheader}>QUANTITY</Text>
                {fees && fees.classes.map((Classfee, index) => (
                  <React.Fragment key={index}>
                    {Classfee.Quantity.map((quantity, idx) => (
                      <Text key={idx} style={styles.tablebody}>
                        {quantity}
                      </Text>
                    ))}
                  </React.Fragment>
                ))}
              </View>

              <View style={[styles.section, styles.TableSecondContainer]}>
                <Text style={styles.tableheader}>PRICE</Text>
                {fees && fees.classes.map((Classfee, index) => (
                  <React.Fragment key={index}>
                    {Classfee.FeeAmounts.map((fee, idx) => (
                      <Text key={idx} style={styles.tablebody}>
                        RM {fee}
                      </Text>
                    ))}
                  </React.Fragment>
                ))}
              </View>
              
              <View style={[styles.section, styles.TableSecondContainer]}>
                <Text style={styles.tableheader}>AMOUNT</Text>
                {fees && fees.classes.map((Classfee, index) => (
                  <React.Fragment key={index}>
                    {Classfee.Quantity.map((quantity, idx) => (
                      <Text key={idx} style={styles.tablebody}>
                        RM {parseFloat(quantity) * parseFloat(Classfee.FeeAmounts[idx])}
                      </Text>
                    ))}
                  </React.Fragment>
                ))}
              </View>
            </View>

            {/* Fee summary */}
            <View style={styles.flexContainer}>
              <View style={[styles.section, styles.TableFirstContainer]}></View>
              <Text style={[styles.section, styles.TableThirdContainer]}>Total Fee:</Text>
              <Text style={[styles.section, styles.TableFourthContainer]}>RM {
                fees && fees.classes.reduce((acc, curr) => {
                  return acc + curr.FeeAmounts.reduce((total, fee) => total + parseFloat(fee), 0);
                }, 0).toFixed(2)
              }</Text>
            </View>

            <View style={styles.flexContainer}>
              <View style={[styles.section, styles.TableFirstContainer]}></View>
              <Text style={[styles.section, styles.TableThirdContainer]}>Paid Amount: </Text>
              <Text style={[styles.section, styles.TableFourthContainer]}>RM {fees.feeDetail.paidAmount}</Text>
            </View>

            <View style={styles.flexContainer}>
              <View style={[styles.section, styles.TableFirstContainer]}></View>
              <Text style={[styles.section, styles.TableThirdContainer]}>Balance Left: </Text>
              <Text style={[styles.section, styles.TableFourthContainer]}>RM {
                (fees && fees.classes.reduce((acc, curr) => {
                  return acc + curr.FeeAmounts.reduce((total, fee) => total + parseFloat(fee), 0);
                }, 0) - fees.feeDetail.paidAmount).toFixed(2)
              }</Text>
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
        <button 
          onClick={onClose}
          className="mt-3 ml-3 rounded-lg font-bold py-2 px-4 bg-red-500 text-white hover:bg-red-600"
        >
          Close
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
              {/* Flex for header */}
            <View style={styles.flexContainer}>
              <View>
                  <Text style={styles.label}>Invoice ID: </Text>
                  <Text style={styles.label}>Payment Date: </Text>
                  <Text style={styles.label}>Due Date: {fees && fees.feeDetail.DueDate.toDate().toDateString()}</Text>
              </View>
              <View style={styles.label}>
                  <Image src={logo} style={styles.logo} />
              </View>
            </View>
          </View>

          {/* Fee details */}
          <View style={styles.flexContainer}>
              <View style={[styles.section, styles.leftHalfContainer]}>
                  <Text style={styles.label}>PLMM Tuition Center</Text>
                  <Text style={styles.label}>Address: No. 21, 21A, 23A & 25A, Jalan Pendekar 17, Taman Ungku Tun Aminah, 81300 Skudai, Johor</Text>
                  <Text style={styles.label}>016-710 8177</Text>
              </View>    
              
              <View style={[styles.section, styles.rightHalfContainer]}>
                  <Text style={styles.label}>This Invoice is to: </Text>
                  <Text style={styles.label}>
                      {users.firstName} {users.lastName}
                  </Text>
                  <Text style={styles.label}>
                      Address: {users.address}, {users.postcode} {users.city}, {users.state}
                  </Text>
                  <Text style={styles.label}>{users.contactNumber}</Text>
              </View>
          </View>
          
          {/* Table for fee details */}
          <View style={styles.flexContainer}>
            <View style={[styles.section, styles.TableFirstContainer]}>
              <Text style={styles.tableheader}>DESCRIPTION</Text>
              {fees && fees.classes.map((Classfee, index) => (
                <React.Fragment key={index}>
                  {Classfee.Descriptions.map((description, idx) => (
                    <Text key={idx} style={styles.tablebody}>
                      {description}
                    </Text>
                  ))}
                </React.Fragment>
              ))}
            </View>

            <View style={[styles.section, styles.TableSecondContainer]}>
              <Text style={styles.tableheader}>QUANTITY</Text>
              {fees && fees.classes.map((Classfee, index) => (
                <React.Fragment key={index}>
                  {Classfee.Quantity.map((quantity, idx) => (
                    <Text key={idx} style={styles.tablebody}>
                      {quantity}
                    </Text>
                  ))}
                </React.Fragment>
              ))}
            </View>

            <View style={[styles.section, styles.TableSecondContainer]}>
              <Text style={styles.tableheader}>PRICE</Text>
              {fees && fees.classes.map((Classfee, index) => (
                <React.Fragment key={index}>
                  {Classfee.FeeAmounts.map((fee, idx) => (
                    <Text key={idx} style={styles.tablebody}>
                      RM {fee}
                    </Text>
                  ))}
                </React.Fragment>
              ))}
            </View>
            
            <View style={[styles.section, styles.TableSecondContainer]}>
              <Text style={styles.tableheader}>AMOUNT</Text>
              {fees && fees.classes.map((Classfee, index) => (
                <React.Fragment key={index}>
                  {Classfee.Quantity.map((quantity, idx) => (
                    <Text key={idx} style={styles.tablebody}>
                      RM {parseFloat(quantity) * parseFloat(Classfee.FeeAmounts[idx])}
                    </Text>
                  ))}
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* Fee summary */}
          <View style={styles.flexContainer}>
            <View style={[styles.section, styles.TableFirstContainer]}></View>
            <Text style={[styles.section, styles.TableThirdContainer]}>Total Fee:</Text>
            <Text style={[styles.section, styles.TableFourthContainer]}>RM {
              fees && fees.classes.reduce((acc, curr) => {
                return acc + curr.FeeAmounts.reduce((total, fee) => total + parseFloat(fee), 0);
              }, 0).toFixed(2)
            }</Text>
          </View>

          <View style={styles.flexContainer}>
            <View style={[styles.section, styles.TableFirstContainer]}></View>
            <Text style={[styles.section, styles.TableThirdContainer]}>Paid Amount: </Text>
            <Text style={[styles.section, styles.TableFourthContainer]}>RM {fees.feeDetail.paidAmount}</Text>
          </View>

          <View style={styles.flexContainer}>
            <View style={[styles.section, styles.TableFirstContainer]}></View>
            <Text style={[styles.section, styles.TableThirdContainer]}>Balance Left: </Text>
            <Text style={[styles.section, styles.TableFourthContainer]}>RM {
              (fees && fees.classes.reduce((acc, curr) => {
                return acc + curr.FeeAmounts.reduce((total, fee) => total + parseFloat(fee), 0);
              }, 0) - fees.feeDetail.paidAmount).toFixed(2)
            }</Text>
          </View>

          {/* Invoice footer */}
          <Text style={styles.footer}>Thank you for your Payment</Text>
        </Page>
      </Document>
    );

    pdf(doc).toBlob().then(blob => {
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

export default InvoiceModal;