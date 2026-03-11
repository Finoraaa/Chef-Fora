import express from "express";
import { createServer as createViteServer } from "vite";
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/feedback", async (req, res) => {
    const { name, email, category, message } = req.body;

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is missing");
      return res.status(500).json({ error: "E-posta servisi yapılandırılmamış." });
    }

    try {
      const { data, error } = await resend.emails.send({
        from: 'Sef Fora <onboarding@resend.dev>',
        to: ['ynsmr3545@gmail.com'],
        subject: `Şef Fora Geri Bildirim: ${category.toUpperCase()}`,
        html: `
          <h2>Yeni Geri Bildirim</h2>
          <p><strong>Gönderen:</strong> ${name} (${email})</p>
          <p><strong>Kategori:</strong> ${category}</p>
          <p><strong>Mesaj:</strong></p>
          <p>${message}</p>
        `,
      });

      if (error) {
        console.error("Resend Error:", error);
        return res.status(400).json({ error });
      }

      res.status(200).json({ success: true, data });
    } catch (err) {
      console.error("Server Error:", err);
      res.status(500).json({ error: "Mesaj gönderilirken bir hata oluştu." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
