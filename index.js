require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.td56s.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("ramen_kumar_das_db");
    const userCollection = db.collection("users");

    // CREATE USER
    app.post("/users", async (req, res) => {
      try {
        const user = req.body;

        const userExists = await userCollection.findOne({ email: user.email });
        if (userExists) {
          return res
            .status(409)
            .send({ success: false, message: "User already exists" });
        }

        user.role = user.role || "user";
        user.createdAt = new Date();

        const result = await userCollection.insertOne(user);
        res.status(201).send(result);
      } catch (error) {
        res
          .status(500)
          .send({ success: false, message: "Failed to create user", error: error.message });
      }
    });

    // READ ALL USERS
    app.get("/users", async (req, res) => {
      try {
        const result = await userCollection
          .find()
          .sort({ createdAt: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ success: false, message: "Failed to fetch users", error: error.message });
      }
    });

    // DELETE USER
    app.delete("/users/:id", async (req, res) => {
      try {
        const result = await userCollection.deleteOne({
          _id: new ObjectId(req.params.id),
        });

        if (result.deletedCount === 0) {
          return res
            .status(404)
            .send({ success: false, message: "User not found" });
        }

        res.send({
          success: true,
          message: "User deleted successfully",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Invalid ID or Server Error",
          error: error.message,
        });
      }
    });

    // UPDATE USER / ROLE
    app.patch("/users/:id/role", async (req, res) => {
      try {
        const filter = { _id: new ObjectId(req.params.id) };
        const updatedUserData = { ...req.body };
        delete updatedUserData._id;

        const existingUser = await userCollection.findOne(filter);
        if (!existingUser) {
          return res
            .status(404)
            .send({ success: false, message: "User not found" });
        }

        const updateDoc = {
          $set: { ...updatedUserData, updatedAt: new Date() },
        };
        const result = await userCollection.updateOne(filter, updateDoc);

        res.send({
          success: true,
          message: "User role updated successfully",
          result,
        });
      } catch (error) {
        console.error("PATCH Role Error:", error.message);
        res.status(500).send({
          success: false,
          message: "Server Error",
          error: error.message,
        });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error("Database connection error:", error);
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Ramen Kumar Das Server Running");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});