import axios from "axios";
import { jsPDF } from "jspdf";
import React, { useState } from "react";
import logo from "./assets/logo.png";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar } from "react-chartjs-2";
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);
export default function BillingApp() {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("");

  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState(1);

  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);

  const [editId, setEditId] = useState(null);

  const [report, setReport] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [monthlyReport, setMonthlyReport] = useState(null);

  const invoiceNumber = "INV-" + Date.now();
  const date = new Date().toLocaleDateString();

  const addItem = () => {
    if (!name || !price) return;

    const newItem = {
      name,
      price: Number(price),
      qty: Number(qty),
    };

    setItems([...items, newItem]);
    setName("");
    setPrice("");
    setQty(1);
  };

  const deleteItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  const saveBill = async () => {
    try {
      if (editId) {
        // ✅ UPDATE
        await axios.put(
          `https://fix-backend-32fw.onrender.com/update-bill/${editId}`,
          {
            customerName,
            phone,
            vehicle,
            items,
            total,
          },
        );

        alert("✅ Bill Updated");
        setEditId(null);
      } else {
        // ✅ CREATE NEW
        await axios.post("https://fix-backend-32fw.onrender.com/save-bill", {
          customerName,
          phone,
          vehicle,
          items,
          total,
        });

        alert("✅ Bill Saved");
      }

      fetchBills();
    } catch (err) {
      console.error(err);
      alert("❌ Error saving");
    }
  };

  const fetchBills = async () => {
    try {
      const res = await axios.get(
        "https://fix-backend-32fw.onrender.com/bills",
      );
      setBills(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReport = async () => {
    try {
      const res = await axios.get(
        "https://fix-backend-32fw.onrender.com/daily-report",
      );
      setReport(res.data);
    } catch (err) {
      console.error(err);
      alert("❌ Error loading report");
    }
  };

  const deleteBill = async (id) => {
    const confirmDelete = window.confirm("Delete this bill?");
    if (!confirmDelete) return;

    try {
      await axios.delete(
        `https://fix-backend-32fw.onrender.com/delete-bill/${id}`,
      );
      fetchBills();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (bill) => {
    setCustomerName(bill.customerName);
    setPhone(bill.phone);
    setVehicle(bill.vehicle);
    setItems(bill.items);
    setEditId(bill._id);
  };
  const fetchMonthlyReport = async () => {
    try {
      const res = await axios.get(
        "https://fix-backend-32fw.onrender.com/monthly-report",
      );
      setMonthlyReport(res.data);
    } catch (err) {
      console.error(err);
      alert("❌ Error loading monthly report");
    }
  };

  const downloadPDF = (bill) => {
    getBase64Image(logo, (imgData) => {
      const doc = new jsPDF();

      // ✅ WATERMARK (FADED LOGO)
      doc.setGState(new doc.GState({ opacity: 0.05 }));

      doc.addImage(imgData, "PNG", 40, 80, 130, 100);

      // ✅ Reset opacity for normal content
      doc.setGState(new doc.GState({ opacity: 1 }));

      // ✅ LOGO
      doc.addImage(imgData, "PNG", 10, 10, 25, 25);

      // ✅ SHOP NAME
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Fix and Drive", 105, 20, null, null, "center");

      // ✅ TAGLINE
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("2 Wheeler Workshop", 105, 26, null, null, "center");

      // ✅ SHOP DETAILS
      doc.setFontSize(9);
      doc.text(
        "Near Pandikkadavu Juma Masjid, Mananthavady, Wayanad",
        105,
        32,
        null,
        null,
        "center",
      );
      doc.text("Phone: 9747727687 , 9847580202", 105, 36, null, null, "center");

      // ✅ LINE
      doc.line(10, 40, 200, 40);

      // ✅ INVOICE INFO
      doc.setFontSize(11);
      doc.text(`Invoice No: INV-${Date.now()}`, 10, 50);
      doc.text(`Date: ${new Date(bill.date).toLocaleString()}`, 130, 50);

      // ✅ CUSTOMER
      doc.text(`Customer: ${bill.customerName}`, 10, 60);
      doc.text(`Phone: ${bill.phone}`, 10, 68);
      doc.text(`Vehicle: ${bill.vehicle}`, 10, 76);

      // ✅ TABLE BOX
      doc.rect(10, 85, 190, 80);

      // ✅ TABLE HEADER
      doc.setFont("helvetica", "bold");
      doc.text("Item", 15, 95);
      doc.text("Qty", 120, 95);
      doc.text("Amount", 160, 95);

      doc.line(10, 100, 200, 100);

      // ✅ ITEMS
      doc.setFont("helvetica", "normal");
      let y = 110;

      bill.items.forEach((item) => {
        doc.text(item.name, 15, y);
        doc.text(String(item.qty), 125, y);
        doc.text(`Rs. ${item.price * item.qty}`, 155, y);
        y += 10;
      });

      // ✅ TOTAL
      doc.line(10, y, 200, y);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`Total: Rs. ${bill.total}`, 130, y + 10);

      // ✅ FOOTER
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Thank you! Visit again.", 105, y + 25, null, null, "center");

      doc.save(`Invoice_${bill.customerName}.pdf`);
    });
  };

  const getBase64Image = (url, callback) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = this.width;
      canvas.height = this.height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(this, 0, 0);

      const dataURL = canvas.toDataURL("image/png");
      callback(dataURL);
    };
  };
  const chartData = {
    labels: ["Today", "This Month"],

    datasets: [
      {
        label: "Income",
        data: [report?.total || 0, monthlyReport?.total || 0],
        backgroundColor: ["#4CAF50", "#2196F3"],
      },
    ],
  };

  const inputStyle = {
    width: "50%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "6px",
    border: "1px solid #555",
    background: "#1e1e1e",
    color: "#fff",
    fontSize: "14px",
    boxSizing: "border-box",
  };
  const buttonStyle = {
    padding: "8px 12px",
    margin: "5px",
    borderRadius: "6px",
    border: "none",
    background: "#4CAF50",
    color: "#fff",
    cursor: "pointer",
  };
  const handlePrint = () => {
    const invoice = document.getElementById("invoice");

    if (!invoice) {
      alert("No invoice selected!");
      return;
    }

    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
    <html>
      <head>
        <title>Print Invoice</title>
        <style>
          body { font-family: Arial; padding: 20px; }
        </style>
      </head>
      <body>
        ${invoice.outerHTML}
      </body>
    </html>
  `);

    printWindow.document.close();
    printWindow.print();
  };
  ``;
  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "auto",
        padding: "20px",
        fontFamily: "Arial",
        background: "#111",
        color: "#fff",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          marginBottom: "20px",
        }}
      >
        Fix and Drive - Billing System
      </h2>
      {/* Customer Details */}
      <div
        style={{
          marginBottom: 20,
          padding: 15,
          border: "1px solid #444",
          borderRadius: 8,
        }}
      >
        <h3>Customer Details</h3>
        <input
          placeholder="Customer Name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          style={inputStyle}
        />
        <br />
        <input
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={inputStyle}
        />
        <br />
        <input
          placeholder="Vehicle Number"
          value={vehicle}
          onChange={(e) => setVehicle(e.target.value)}
          style={inputStyle}
        />

        <br />
        <br />
        <p>
          <b>Invoice:</b> {invoiceNumber}
        </p>
        <p>
          <b>Date:</b> {date}
        </p>
      </div>

      {/* Add Items */}
      <div
        style={{
          marginBottom: 20,
          padding: 15,
          border: "1px solid #444",
          borderRadius: 8,
        }}
      >
        <h3>Add Service / Item</h3>
        <input
          placeholder="Service Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />
        <br />
        <input
          placeholder="Price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={inputStyle}
        />
        <br />
        <input
          placeholder="Quantity"
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          style={inputStyle}
        />
        <br />
        <button style={buttonStyle} onClick={addItem}>
          Add Item
        </button>
      </div>

      {/* Bill Preview */}
      <div
        style={{
          marginBottom: 20,
          padding: 15,
          border: "1px solid #444",
          borderRadius: 8,
        }}
      >
        <h3>Bill</h3>
        {items.map((item, index) => (
          <div
            key={index}
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <span>
              {item.name} (x{item.qty})
            </span>
            <span>₹{item.price * item.qty}</span>
            <button onClick={() => deleteItem(index)}>❌</button>
          </div>
        ))}

        <h2 style={{ marginTop: 10 }}>Total: ₹{total}</h2>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          marginTop: 10,
        }}
      >
        <button onClick={handlePrint}>Print Bill</button>
        <button onClick={saveBill} style={{ marginLeft: 10 }}>
          Save Bill
        </button>
        <button onClick={fetchBills} style={{ marginLeft: 10 }}>
          Load Saved Bills
        </button>
        <button onClick={fetchReport} style={{ marginLeft: 10 }}>
          Load Daily Report
        </button>
        <button onClick={fetchMonthlyReport} style={{ marginLeft: 10 }}>
          Load Monthly Report
        </button>
      </div>
      <div
        style={{
          marginTop: 20,
          padding: 15,
          border: "1px solid #444",
          borderRadius: 8,
        }}
      >
        <h3>📊 Daily Report</h3>
        {report && (
          <div
            style={{
              border: "2px solid black",
              padding: 15,
              marginTop: 10,
            }}
          >
            <p>
              <b>Total Bills Today:</b> {report.count}
            </p>
            <p>
              <b>Total Income:</b> Rs. {report.total}
            </p>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 20,
          padding: 15,
          border: "1px solid #444",
          borderRadius: 8,
        }}
      >
        <h3>📅 Monthly Report</h3>

        {monthlyReport && (
          <div
            style={{
              border: "2px solid blue",
              padding: 15,
              marginTop: 10,
            }}
          >
            <p>
              <b>Total Bills This Month:</b> {monthlyReport.count}
            </p>
            <p>
              <b>Total Income:</b> Rs. {monthlyReport.total}
            </p>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 20,
          padding: 15,
          border: "1px solid #444",
          borderRadius: 8,
        }}
      >
        <h3>📈 Income Chart</h3>

        <div style={{ width: "100%", maxWidth: 500 }}>
          <Bar data={chartData} />
        </div>
      </div>

      <h3>Saved Bills</h3>

      <input
        type="text"
        placeholder="Search by name or vehicle..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ padding: 8, marginBottom: 10, width: "100%" }}
      />

      {bills
        .filter(
          (bill) =>
            bill.customerName
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            bill.vehicle.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        .map((bill, index) => (
          <div
            key={index}
            onClick={() => setSelectedBill(bill)}
            style={{
              border: "1px solid #ccc",
              padding: 10,
              marginBottom: 10,
              cursor: "pointer",
            }}
          >
            <p>
              <b>Name:</b> {bill.customerName}
            </p>
            <p>
              <b>Vehicle:</b> {bill.vehicle}
            </p>
            <p>
              <b>Total:</b> Rs. {bill.total}
            </p>

            {/* ✅ DELETE BUTTON */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // ✅ IMPORTANT FIX
                deleteBill(bill._id);
              }}
            >
              Delete
            </button>

            {/* ✅ EDIT BUTTON */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(bill);
              }}
            >
              Edit
            </button>
          </div>
        ))}
      <hr />
      <h3>Invoice Details</h3>
      {selectedBill && (
        <div id="invoice" style={{ border: "2px solid black", padding: 15 }}>
          <h2>Fix and Drive</h2>
          <p>
            <b>Name:</b> {selectedBill.customerName}
          </p>
          <p>
            <b>Phone:</b> {selectedBill.phone}
          </p>
          <p>
            <b>Vehicle:</b> {selectedBill.vehicle}
          </p>
          <h4>Items:</h4>
          {selectedBill.items.map((item, i) => (
            <div
              key={i}
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <span>
                {item.name} (x{item.qty})
              </span>
              <span>₹{item.price * item.qty}</span>
            </div>
          ))}
          <hr />
          <h3>Total: ₹{selectedBill.total}</h3>
          <button onClick={() => downloadPDF(selectedBill)}>
            Download PDF
          </button>

          <p>
            <b>Date:</b> {new Date(selectedBill.date).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
