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
    const awardCollection = db.collection("awards");

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

    app.post("/awards", async (req, res) => {
      try {
        const award = req.body;
        award.createdAt = new Date();

        const result = await awardCollection.insertOne(award);
        res.status(201).send({
          success: true,
          message: "Award added successfully",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to add award",
          error: error.message,
        });
      }
    });

    // 2. READ ALL AWARDS (সব আওয়ার্ড দেখা)
    app.get("/awards", async (req, res) => {
      try {
        const result = await awardCollection
          .find()
          .sort({ createdAt: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to fetch awards",
          error: error.message,
        });
      }
    });

    // 3. READ SINGLE AWARD BY ID (নির্দিষ্ট একটি আওয়ার্ড দেখা)
    app.get("/awards/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const award = await awardCollection.findOne(query);

        if (!award) {
          return res.status(404).send({ success: false, message: "Award not found" });
        }

        res.send(award);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Invalid Award ID or Server Error",
          error: error.message,
        });
      }
    });

    // 4. UPDATE AWARD (আওয়ার্ড তথ্য আপডেট করা)
    app.patch("/awards/:id", async (req, res) => {
      try {
        const filter = { _id: new ObjectId(req.params.id) };
        const updateData = { ...req.body };
        delete updateData._id; 

        const updateDoc = {
          $set: {
            ...updateData,
            updatedAt: new Date(),
          },
        };

        const result = await awardCollection.updateOne(filter, updateDoc);

        if (result.matchedCount === 0) {
          return res.status(404).send({ success: false, message: "Award not found" });
        }

        res.send({
          success: true,
          message: "Award updated successfully",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to update award",
          error: error.message,
        });
      }
    });

    // 5. DELETE AWARD (আওয়ার্ড ডিলেট করা)
    app.delete("/awards/:id", async (req, res) => {
      try {
        const result = await awardCollection.deleteOne({
          _id: new ObjectId(req.params.id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).send({ success: false, message: "Award not found" });
        }

        res.send({
          success: true,
          message: "Award deleted successfully",
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