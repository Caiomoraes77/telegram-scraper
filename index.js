import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post("/api/telegram-scraper", async (req, res) => {
  const { url } = req.body;

  if (!url || !url.startsWith("https://t.me/")) {
    return res.status(400).json({ error: "URL inválida do Telegram." });
  }

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(url.replace("https://t.me/", "https://t.me/s/"), {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });

    const data = await page.evaluate(() => {
      const getText = (selector) =>
        document.querySelector(selector)?.innerText?.trim() || "";

      const getBackgroundImage = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return "";
        const bg = window.getComputedStyle(el).getPropertyValue("background-image");
        return bg.replace(/^url\(["']?/, "").replace(/["']?\)$/, "");
      };

      return {
        title: getText(".tgme_page_title"),
        description: getText(".tgme_page_description"),
        subscribers: getText(".tgme_page_extra"),
        image: getBackgroundImage(".tgme_page_photo"),
      };
    });

    await browser.close();

    res.json(data);
  } catch (err) {
    console.error("Erro ao extrair dados do Telegram:", err);
    res.status(500).json({ error: "Erro ao processar a URL do Telegram." });
  }
});

app.get("/", (req, res) => {
  res.send("API Telegram Scraper ativa.");
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
