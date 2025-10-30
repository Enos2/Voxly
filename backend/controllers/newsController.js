import News from "../models/newsModel.js";

/* 📰 Create News Post */
export const createNews = async (req, res) => {
  try {
    const { title, body, author, coverImage, category } = req.body;

    if (!title || !body || !author)
      return res.status(400).json({ message: "Title, body, and author required" });

    const news = await News.create({ title, body, author, coverImage, category });
    res.status(201).json({ message: "News created", news });
  } catch (error) {
    console.error("❌ News Creation Error:", error);
    res.status(500).json({ message: "Server error creating news" });
  }
};

/* 📋 Get All News */
export const getAllNews = async (req, res) => {
  try {
    const newsList = await News.find().populate("author", "username email").sort({ createdAt: -1 });
    res.json(newsList);
  } catch (error) {
    console.error("❌ Fetch News Error:", error);
    res.status(500).json({ message: "Error fetching news" });
  }
};

/* 🔍 Get Single News */
export const getNewsById = async (req, res) => {
  try {
    const news = await News.findById(req.params.id).populate("author", "username email");
    if (!news) return res.status(404).json({ message: "News not found" });
    res.json(news);
  } catch (error) {
    console.error("❌ Fetch Single News Error:", error);
    res.status(500).json({ message: "Error fetching news" });
  }
};
