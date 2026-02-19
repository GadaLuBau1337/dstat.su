import axios from "axios";
import * as cheerio from "cheerio";

let cacheData = null;
let cacheTime = 0;

const CACHE_DURATION = 60 * 1000; // 1 menit

export default async function handler(req, res) {
  try {
    // Cache system
    if (cacheData && Date.now() - cacheTime < CACHE_DURATION) {
      return res.status(200).json({
        cached: true,
        ...cacheData
      });
    }

    const response = await axios.get("https://dstat.su/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);

    const result = {
      layer4: [],
      layer7: []
    };

    $("a").each((i, el) => {
      const text = $(el).text().trim();
      const link = $(el).attr("href");

      if (!link) return;

      if (link.includes("/l4/")) {
        result.layer4.push({
          name: text.replace(/\s+/g, " "),
          url: `https://dstat.su${link}`
        });
      }

      if (link.includes("/l7/")) {
        result.layer7.push({
          name: text.replace(/\s+/g, " "),
          url: `https://dstat.su${link}`
        });
      }
    });

    cacheData = result;
    cacheTime = Date.now();

    return res.status(200).json({
      cached: false,
      ...result
    });

  } catch (error) {
    console.error("ERROR:", error.message);

    return res.status(500).json({
      error: true,
      message: error.message
    });
  }
      }
