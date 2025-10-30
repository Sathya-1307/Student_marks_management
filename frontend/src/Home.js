import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // for navigation after logout

function Home() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    os: "",
    dbms: "",
    ds: "",
    coa: "",
    java: "",
    jcp: "" // optional subject
  });
  const [editingId, setEditingId] = useState(null);

  // Fetch all students
  const getStudents = async () => {
    try {
      const res = await axios.get("http://localhost:5000/students");
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getStudents();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/students/${editingId}`, form);
        setEditingId(null);
      } else {
        await axios.post("http://localhost:5000/students", form);
      }
      setForm({ name: "", email: "", os: "", dbms: "", ds: "", coa: "", java: "", jcp: "" });
      getStudents();
    } catch (err) {
      console.error(err);
      alert("Error saving data");
    }
  };

  const handleEdit = (student) => {
    setForm({
      name: student.name,
      email: student.email,
      os: student.os,
      dbms: student.dbms,
      ds: student.ds,
      coa: student.coa,
      java: student.java,
      jcp: student.jcp || ""
    });
    setEditingId(student._id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/students/${id}`);
      getStudents();
    } catch (err) {
      console.error(err);
      alert("Error deleting student");
    }
  };
  
  const handleDownload = () => {
    if (!students.length) return alert("No data to download");

    const headers = ["Name", "Email", "OS", "DBMS", "DS", "COA", "Java", "JCP", "CGPA", "Grade"];
    const rows = students.map(s => [
      s.name, s.email, s.os, s.dbms, s.ds, s.coa, s.java, s.jcp || "", s.cgpa, s.grade
    ]);

    const csvContent = [headers, ...rows]
      .map(e => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "student_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = () => {
    localStorage.removeItem("username");
    navigate("/login");
  };

  const gradeOptions = ["O+", "A+", "A", "B+", "B", "C+", "C", "D+"];

  return (
    <div style={{ padding: "30px", fontFamily: "Arial, sans-serif", backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", backgroundColor: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <h2 style={{ margin: 0, color: "#333", fontSize: "28px", fontWeight: "600" }}>Student Marks Management</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <button onClick={handleDownload} style={{ padding: "8px 16px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "14px", fontWeight: "500", transition: "background-color 0.3s ease" }}
            onMouseOver={(e) => e.target.style.backgroundColor = "#0056b3"}
            onMouseOut={(e) => e.target.style.backgroundColor = "#007bff"}
          >
            Download Report
          </button>
          <span style={{ color: "#666", fontSize: "16px" }}>Profile: <strong>{username}</strong></span>
          <button onClick={handleLogout} style={{ padding: "8px 16px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "14px", fontWeight: "500", transition: "background-color 0.3s ease" }}
            onMouseOver={(e) => e.target.style.backgroundColor = "#c82333"}
            onMouseOut={(e) => e.target.style.backgroundColor = "#dc3545"}
          >
            Logout
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: "30px", backgroundColor: "white", padding: "25px", borderRadius: "10px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
          <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required style={{ padding: "12px 15px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "16px", outline: "none" }} />
          <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required style={{ padding: "12px 15px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "16px", outline: "none" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px", marginBottom: "20px" }}>
          {["os", "dbms", "ds", "coa", "java", "jcp"].map((subject) => (
            <select
              key={subject}
              name={subject}
              value={form[subject]}
              onChange={handleChange}
              style={{ padding: "12px 15px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "16px", backgroundColor: "white", cursor: "pointer" }}
              required={subject !== "jcp"} // JCP is optional
            >
              <option value="">{subject === "jcp" ? "Optional: JCP" : `Select ${subject.toUpperCase()}`}</option>
              {gradeOptions.map((grade) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          ))}
        </div>

        <button type="submit" style={{ padding: "12px 30px", backgroundColor: editingId ? "#ffc107" : "#28a745", color: editingId ? "#212529" : "white", border: "none", borderRadius: "5px", fontSize: "16px", fontWeight: "600", cursor: "pointer" }}>
          {editingId ? "Update Student" : "Add Student"}
        </button>
      </form>

      <div style={{ backgroundColor: "white", borderRadius: "10px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ backgroundColor: "#343a40", color: "white" }}>
              <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>Name</th>
              <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>Email</th>
              <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>OS</th>
              <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>DBMS</th>
              <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>DS</th>
              <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>COA</th>
              <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>Java</th>
              <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>JCP</th>
              <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>CGPA</th>
              <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>Grade</th>
              <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr key={student._id} style={{ backgroundColor: index % 2 === 0 ? "#f8f9fa" : "white" }}>
                <td style={{ padding: "15px", borderBottom: "1px solid #dee2e6" }}>{student.name}</td>
                <td style={{ padding: "15px", borderBottom: "1px solid #dee2e6" }}>{student.email}</td>
                <td style={{ padding: "15px", borderBottom: "1px solid #dee2e6" }}>{student.os}</td>
                <td style={{ padding: "15px", borderBottom: "1px solid #dee2e6" }}>{student.dbms}</td>
                <td style={{ padding: "15px", borderBottom: "1px solid #dee2e6" }}>{student.ds}</td>
                <td style={{ padding: "15px", borderBottom: "1px solid #dee2e6" }}>{student.coa}</td>
                <td style={{ padding: "15px", borderBottom: "1px solid #dee2e6" }}>{student.java}</td>
                <td style={{ padding: "15px", borderBottom: "1px solid #dee2e6" }}>{student.jcp || "-"}</td>
                <td style={{ padding: "15px", borderBottom: "1px solid #dee2e6" }}>{student.cgpa}</td>
                <td style={{ padding: "15px", borderBottom: "1px solid #dee2e6" }}>{student.grade}</td>
                <td style={{ padding: "15px", borderBottom: "1px solid #dee2e6" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => handleEdit(student)} style={{ padding: "6px 12px", backgroundColor: "#17a2b8", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>Edit</button>
                    <button onClick={() => handleDelete(student._id)} style={{ padding: "6px 12px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Home;
