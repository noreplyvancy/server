// pages/server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { Resend } from "resend";
import path from "path";
import { fileURLToPath } from "url";

// ✅ Ensure .env loads correctly (no matter where you run from)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "./.env") });

// ✅ Initialize
const app = express();
const PORT = process.env.PORT || 5000;
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(cors());
app.use(bodyParser.json());

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Aluxim Resend Server running ✅");
});

// ✅ Contact form email route
app.post("/send-email", async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message)
    return res.status(400).json({ error: "All fields required." });

  try {
    await resend.emails.send({
      from: "Aluxim Contact <onboarding@resend.dev>",
      to: "noreplyvancy@gmail.com",
      subject: `New Contact Message: ${subject}`,
      html: `
        <h3>New Contact Submission</h3>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Subject:</b> ${subject}</p>
        <p><b>Message:</b><br>${message}</p>
      `,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Send error:", err);
    res.status(500).json({ error: "Failed to send message." });
  }
});

// ✅ Job application route (used by CareersPage)
app.post("/apply-job", async (req, res) => {
  const { name, email, position, message, resumeUrl } = req.body;
  if (!name || !email || !position)
    return res.status(400).json({ error: "Missing required fields." });

  try {
    // 1️⃣ Send to admin
    await resend.emails.send({
      from: "Aluxim Careers <onboarding@resend.dev>",
      to: "noreplyvancy@gmail.com",
      subject: `New Job Application: ${position}`,
      html: `
        <h2>📄 New Job Application</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Position:</b> ${position}</p>
        <p><b>Resume:</b> <a href="${resumeUrl || "#"}" target="_blank">${resumeUrl || "(No link provided)"}</a></p>
        <p><b>Message:</b><br>${message || "(No message provided)"}</p>
      `,
    });

    // 2️⃣ Auto-reply
    await resend.emails.send({
      from: "Aluxim Careers <onboarding@resend.dev>",
      to: email,
      subject: `Application Received - ${position}`,
      html: `
        <h3>Hi ${name},</h3>
        <p>Thanks for applying for <b>${position}</b> at <b>Aluxim Pvt Ltd</b>.</p>
        <p>Our HR team will review your application and contact you if shortlisted.</p>
        <p>Best regards,<br>The Aluxim Team</p>
      `,
    });

    console.log(`✅ Job application received for ${position}`);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error sending application:", error);
    res.status(500).json({ error: "Failed to send application." });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
