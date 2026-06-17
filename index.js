const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const brevo = require("@getbrevo/brevo");

dotenv.config();

// Use CORS middleware
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
app.use(express.json());
app.use(bodyParser.json());

// ===============================
// ✉️ Brevo API Setup (HTTP API) - EXACTLY LIKE KPS
// ===============================
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

// Helper function to send email via Brevo API - EXACTLY LIKE KPS
async function sendBrevoEmail({ fromName, fromEmail, toEmail, subject, html }) {
  console.log("\n📤 Attempting to send email:");
  console.log("From:", fromEmail);
  console.log("To:", toEmail);
  console.log("Subject:", subject);

  try {
    const emailData = {
      sender: { name: fromName, email: fromEmail },
      to: [{ email: toEmail }],
      subject,
      htmlContent: html,
    };

    const response = await apiInstance.sendTransacEmail(emailData);
    console.log("✅ Email sent successfully!");
    console.log("📧 Message ID:", response?.messageId || "(none)");
    return true;
  } catch (error) {
    console.error("❌ Email sending failed!");
    console.error(error.response ? error.response.body : error);
    return false;
  }
}

// ===============================
// MongoDB Connection
// ===============================
mongoose.connect(
  "mongodb://admin:Admin%402025@93.127.167.226:27017/portfolio?authSource=admin&authMechanism=SCRAM-SHA-256",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ Mongo error:", err));

// ===============================
// Portfolio Schema & Model
// ===============================
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

// ===============================
// 📬 Contact Form Endpoint
// ===============================
app.post('/contact', async (req, res) => {
  console.log("\n==============================");
  console.log("📨 New Contact Form Attempt");
  console.log("==============================");

  const { name, mobile, email, message } = req.body;
  console.log("📝 Received Data:", { name, mobile, email, message });

  try {
    console.log("🔍 Checking for duplicate message...");
    const exist = await User.findOne({ email, message });
    if (exist) {
      console.warn("⚠️ Duplicate message detected for:", email);
      return res.json({ success: false, error: 'You have already messaged..' });
    }

    console.log("💾 Saving contact data...");
    const result = await User.create({
      name,
      mobile,
      email,
      message,
    });
    console.log("✅ Contact data saved successfully!");

    console.log("📧 Sending acknowledgment to user...");
    await sendBrevoEmail({
      fromName: "Amaan Sodagar",
      fromEmail: process.env.SENDER_EMAIL,
      toEmail: email,
      subject: "Thanks for reaching out to Amaan Sodagar!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Dear ${name},</h2>
          <p>Thank you for reaching out to me! I appreciate you taking the time to connect with me.</p>
          <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
            <p><strong>Your Message:</strong></p>
            <p>${message}</p>
          </div>
          <p>I will get back to you as soon as possible.</p>
          <p>Best regards,<br>
          <strong>Amaan Sodagar</strong></p>
        </div>
      `,
    });

    console.log("📨 Sending admin notification...");
    await sendBrevoEmail({
      fromName: "Amaan Sodagar Portfolio",
      fromEmail: process.env.SENDER_EMAIL,
      toEmail: process.env.ADMIN_EMAIL,
      subject: `📬 New Portfolio Contact: ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2196F3;">📬 NEW CONTACT FORM SUBMISSION</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>👤 Contact Details:</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${mobile}</p>
            
            <h3 style="margin-top: 20px;">💬 Message:</h3>
            <div style="background: white; padding: 15px; border-radius: 3px; border-left: 4px solid #2196F3;">
              ${message}
            </div>
            
            <p><strong>⏰ Submitted At:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
            <p><strong>⚠️ ACTION REQUIRED:</strong></p>
            <p>1. Reply to ${name} at ${email}</p>
            <p>2. Call: ${mobile}</p>
            <p>3. Follow up within 24 hours</p>
          </div>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated notification from the Portfolio Contact Portal.
          </p>
        </div>
      `,
    });

    console.log("🎉 Contact form processed successfully!");
    res.json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error("❌ Contact Error Details:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===============================
// 📊 Visitor Logging Endpoint
// ===============================
app.get("/log-visit", async (req, res) => {
  try {
    console.log("📢 New Portfolio Visit Logged!");

    await sendBrevoEmail({
      fromName: "Amaan Sodagar Portfolio",
      fromEmail: process.env.SENDER_EMAIL,
      toEmail: process.env.ADMIN_EMAIL,
      subject: "👀 New Portfolio Visit",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">👀 New Portfolio Visit!</h2>
          <p>Someone just visited <strong>Amaan Sodagar's</strong> portfolio website.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 14px;">
            ⏰ Time: ${new Date().toLocaleString()}
          </p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated notification from the Portfolio Visit Logger.
          </p>
        </div>
      `
    });

    res.json({ success: true, message: "Visit logged successfully." });
  } catch (error) {
    console.error("❌ Error Logging Visit:", error);
    res.status(500).json({ success: false, error: "Failed to log visit." });
  }
});

// ===============================
// 📄 Resume Download Logging Endpoint
// ===============================
app.post("/log-resume-download", async (req, res) => {
  try {
    const { userAgent, ip } = req.body;
    console.log("📄 Resume Downloaded!");

    const currentTime = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'long'
    });

    await sendBrevoEmail({
      fromName: "Amaan Sodagar Portfolio",
      fromEmail: process.env.SENDER_EMAIL,
      toEmail: process.env.ADMIN_EMAIL,
      subject: "📄 Resume Downloaded from Portfolio!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff9800;">📄 RESUME DOWNLOAD ALERT!</h2>
          <p><strong>Someone just downloaded your resume from the portfolio website!</strong></p>
          <hr style="margin: 20px 0;">
          <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>⏰ Time:</strong> ${currentTime}</p>
            <p><strong>🖥️ User Agent:</strong> ${userAgent || 'Unknown'}</p>
            <p><strong>🌐 IP Address:</strong> ${ip || 'Unknown'}</p>
          </div>
          <div style="background: #e8f5e9; padding: 15px; border-radius: 5px;">
            <p><strong>💡</strong> <em>This could be a potential employer or recruiter showing interest!</em></p>
          </div>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated notification from the Portfolio Resume Logger.
          </p>
        </div>
      `
    });

    res.json({ success: true, message: "Resume download logged successfully." });
  } catch (error) {
    console.error("❌ Error Logging Resume Download:", error);
    res.status(500).json({ success: false, error: "Failed to log resume download." });
  }
});

// ===============================
// 🧠 Test Routes
// ===============================
app.get('/hello', (req, res) => {
  res.send('Hello from Amaan Sodagar Portfolio Backend!');
});

// Test route - EXACTLY LIKE KPS
app.get("/test-email", async (req, res) => {
  const result = await sendBrevoEmail({
    fromName: "Amaan Sodagar",
    fromEmail: process.env.SENDER_EMAIL,
    toEmail: "sodagaramaan786@gmail.com",
    subject: "Test Email from Brevo",
    html: "<h2>✅ Working!</h2><p>Your Brevo integration is set up correctly!</p>"
  });
  res.json({ success: result, message: result ? "Email sent!" : "Failed" });
});

// ===============================
// 🚀 Start Server
// ===============================
app.listen(3035, () => {
  console.log('🚀 Server running on port 3035');
  console.log('✅ Brevo HTTP API configured with sender: Amaan Sodagar');
});