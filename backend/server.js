const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// ------------------ MongoDB Connection ------------------
mongoose.connect(
  "mongodb+srv://Sathya:Sathya@cluster0.7kcvcev.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  { useNewUrlParser: true, useUnifiedTopology: true }
)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

// ------------------ User Schema ------------------
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model("User", userSchema);

// Signup Route
app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    res.status(200).json({ message: "Login successful", username: user.username });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ------------------ Student Schema ------------------
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  os: { type: String, required: true },
  dbms: { type: String, required: true },
  ds: { type: String, required: true },
  coa: { type: String, required: true },
  java: { type: String, required: true },
  jcp: { type: String, default: "-" }, // Optional subject
  cgpa: { type: Number },
  grade: { type: String }
});

const Student = mongoose.model("Student", studentSchema);

// ------------------ CGPA Calculation ------------------
function calculateCGPA(os, dbms, ds, coa, java, jcp) {
  const gradeMap = { "O+": 10, "A+": 9, "A": 8, "B+": 7, "B": 6, "C+": 5, "C": 4, "D+": 3 };

  // Credit weights: OS-4, DBMS-4, DS-3, COA-2, Java-3
  let totalPoints = gradeMap[os]*4 + gradeMap[dbms]*4 + gradeMap[ds]*3 + gradeMap[coa]*2 + gradeMap[java]*3;
  let totalCredits = 16;

  // Optional subject JCP counts as 2 credits
  if (jcp && gradeMap[jcp]) {
    totalPoints += gradeMap[jcp]*2;
    totalCredits += 2;
  }

  const cgpa = (totalPoints / totalCredits).toFixed(2);

  let finalGrade = "";
  if (cgpa >= 9) finalGrade = "O+";
  else if (cgpa >= 8) finalGrade = "A+";
  else if (cgpa >= 7) finalGrade = "A";
  else if (cgpa >= 6) finalGrade = "B+";
  else if (cgpa >= 5) finalGrade = "B";
  else if (cgpa >= 4) finalGrade = "C+";
  else finalGrade = "D+";

  return { cgpa, grade: finalGrade };
}

// ------------------ Student Routes ------------------
// Add Student
app.post("/students", async (req, res) => {
  const { name, email, os, dbms, ds, coa, java, jcp } = req.body;
  try {
    const { cgpa, grade } = calculateCGPA(os, dbms, ds, coa, java, jcp);
    const newStudent = new Student({ name, email, os, dbms, ds, coa, java, jcp, cgpa, grade });
    await newStudent.save();
    res.status(201).json({ message: "Student added", student: newStudent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all students
app.get("/students", async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update student
app.put("/students/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, os, dbms, ds, coa, java, jcp } = req.body;
  try {
    const { cgpa, grade } = calculateCGPA(os, dbms, ds, coa, java, jcp);
    const updated = await Student.findByIdAndUpdate(
      id,
      { name, email, os, dbms, ds, coa, java, jcp, cgpa, grade },
      { new: true }
    );
    res.status(200).json({ message: "Student updated", student: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete student
app.delete("/students/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await Student.findByIdAndDelete(id);
    res.status(200).json({ message: "Student deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
