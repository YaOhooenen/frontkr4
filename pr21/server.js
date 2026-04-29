const express = require("express");
const redis = require("redis");

const app = express();
app.use(express.json());

const redisClient = redis.createClient({ url: "redis://localhost:6379" });
redisClient.connect().then(() => console.log("✅ Redis connected"));

// ----- Данные в памяти (без БД) -----
let users = [
    { id: "1", name: "Анна", email: "anna@example.com" },
    { id: "2", name: "Иван", email: "ivan@example.com" }
];

// ----- Утилита кэша -----
async function getOrSetCache(key, ttl, fetchFn) {
    const cached = await redisClient.get(key);
    if (cached) {
        console.log(`📦 Cache HIT: ${key}`);
        return { source: "cache", data: JSON.parse(cached) };
    }
    console.log(`❌ Cache MISS: ${key}`);
    const data = await fetchFn();
    await redisClient.setEx(key, ttl, JSON.stringify(data));
    return { source: "server", data };
}

// ----- Маршруты с кэшем -----
app.get("/api/users", async (req, res) => {
    const result = await getOrSetCache("users:all", 60, async () =>
        users.map(u => ({ id: u.id, name: u.name, email: u.email }))
    );
    res.json(result);
});

app.get("/api/users/:id", async (req, res) => {
    const result = await getOrSetCache(`users:${req.params.id}`, 60, async () => {
        const user = users.find(u => u.id === req.params.id);
        if (!user) throw new Error("User not found");
        return { id: user.id, name: user.name, email: user.email };
    });
    res.json(result);
});

// ----- Очистка кэша при изменении данных -----
app.post("/api/users", async (req, res) => {
    const newUser = { id: String(users.length + 1), ...req.body };
    users.push(newUser);
    await redisClient.del("users:all");
    res.json({ message: "User added, cache cleared", user: newUser });
});

const PORT = 3002;
app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));