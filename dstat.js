import axios from "axios";
import cheerio from "cheerio";

let cache = {
  data: null,
  timestamp: 0
};

const CACHE_DURATION = 60 * 1000; // 1 menit

export default async function handler(req, res) {
  try {
    // Cache check
    if (cache.data && Date.now() - cache.timestamp < CACHE_DURATION) {
      return res.status(200).json({
        cached: true,
        ...cache.data
      });
    }

    const response = await axios.get("https://dstat.su/", {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const $ = cheerio.load(response.data);

    const result = {
      layer4: {
        massive: [],
        non_protected: [],
        protected: []
      },
      layer7: {
        massive: [],
        non_protected: [],
        protected: []
      }
    };

    function extractSection(titleText, targetArray) {
      $("a").each((i, el) => {
        const text = $(el).text().trim();

        if (text.includes("Gbps") || text.includes("M") || text.includes("K")) {
          const name = text.replace(/\s+/g, " ").trim();
          const link = $(el).attr("href");

          if (link && link.includes("/l4/")) {
            targetArray.layer4.push({
              name,
              url: `https://dstat.su${link}`
            });
          }

          if (link && link.includes("/l7/")) {
            targetArray.layer7.push({
              name,
              url: `https://dstat.su${link}`
            });
          }
        }
      });
    }

    // Simple categorization (basic logic)
    $("a").each((i, el) => {
      const text = $(el).text().trim();
      const link = $(el).attr("href");

      if (!link) return;

      const item = {
        name: text.replace(/\s+/g, " ").trim(),
        url: `https://dstat.su${link}`
      };

      if (link.includes("/l4/")) {
        if (text.includes("Gbps")) {
          result.layer4.massive.push(item);
        }
      }

      if (link.includes("/l7/")) {
        if (text.includes("M") || text.includes("K")) {
          result.layer7.massive.push(item);
        }
      }
    });

    cache = {
      data: result,
      timestamp: Date.now()
    };

    res.status(200).json({
      cached: false,
      ...result
    });

  } catch (error) {
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
        }
