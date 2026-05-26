const express = require('express');
const app = express();
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

// Use CORS middleware
// app.use(cors()); 

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://amaan-sodagar-portfolio.vercel.app"

  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


// Middleware to parse JSON
app.use(bodyParser.json());

// Connect to MongoDB
// mongoose
//   .connect(
//     "mongodb+srv://sodagaramaan786:HbiVzsmAJNAm4kg4@cluster0.576stzr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
//   )
//   .then(() => console.log("mongodb connected"))
//   .catch((err) => console.log("mongo error", err));




mongoose.connect(
  "mongodb://admin:Admin%402025@93.127.167.226:27017/portfolio?authSource=admin&authMechanism=SCRAM-SHA-256",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("Mongo error:", err));




// Define the schema and model for the portfolio
const portfolioSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
});
const User = mongoose.model("Portfoliocontact", portfolioSchema);

// Endpoint to handle contact form submissions
app.post('/contact', async (req, res) => {
  const { name, mobile, email, message } = req.body;
  console.log(name);

  try {
    // Check if a message with the same email and message already exists
    const exist = await User.findOne({ email, message });
    if (exist) {
      return res.json({ success: false, error: 'You have already messaged..' });
    }

    // Create new user/message
    const result = await User.create({
      name,
      mobile,
      email,
      message,
    });

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome',
      html: `
        <p>Hello ${name},</p>
<p>Thank you for reaching out! I appreciate you taking the time to connect with me. I will get back to you as soon as possible.</p>
<p>Best regards,</p>
<p>Yours truly</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// **3️⃣ Visitor Logging Endpoint**
app.get("/log-visit", async (req, res) => {
  try {
    console.log("📢 New Portfolio Visit Logged!");

    // Send notification email to the owner
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Your email
      subject: "👀 New Portfolio Visit",
      text: "Someone just visited your portfolio!",
    });

    res.json({ success: true, message: "Visit logged successfully." });
  } catch (error) {
    console.error("❌ Error Logging Visit:", error);
    res.status(500).json({ success: false, error: "Failed to log visit." });
  }
});


// 4️⃣ Resume Download Logging Endpoint
app.post("/log-resume-download", async (req, res) => {
  try {
    const { userAgent, ip } = req.body;

    console.log("📄 Resume Downloaded!");

    // Send notification email to the owner
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Get current time
    const currentTime = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'long'
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Your email
      subject: "📄 Resume Downloaded from Portfolio!",
      html: `
        <h2>📄 Resume Download Alert!</h2>
        <p><strong>Someone just downloaded your resume from the portfolio website!</strong></p>
        <hr />
        <p><strong>Time:</strong> ${currentTime}</p>
        <p><strong>User Agent:</strong> ${userAgent || 'Unknown'}</p>
        <p><strong>IP Address:</strong> ${ip || 'Unknown'}</p>
        <hr />
        <p>💡 <em>This could be a potential employer or recruiter showing interest!</em></p>
      `,
    });

    res.json({ success: true, message: "Resume download logged successfully." });
  } catch (error) {
    console.error("❌ Error Logging Resume Download:", error);
    res.status(500).json({ success: false, error: "Failed to log resume download." });
  }
});


app.get('/hello', (req, res) => {
  res.send('Hello World!')
})

// Start the server
app.listen(3035, () => {
  console.log('Server connected');
});