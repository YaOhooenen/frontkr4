const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.json({ message: `Response from server ${PORT}` });
});

app.listen(PORT, () => console.log(`✅ Backend running on ${PORT}`));