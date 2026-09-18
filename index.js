require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const app = express();
const port = process.env.PORT || 3000;

// Vercel: Wait until MongoDB and routes are ready
let serverReadyResolve;
let serverReadyReject;

const serverReady = new Promise((resolve, reject) => {
  serverReadyResolve = resolve;
  serverReadyReject = reject;
});

// Firebase Admin Setup
if (process.env.FB_SERVICE_KEY) {
  const decoded = Buffer.from(process.env.FB_SERVICE_KEY, "base64").toString(
    "utf8",
  );
  const serviceAccount = JSON.parse(decoded);

  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  }
}

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Custom Auth Middleware
const verifyFBToken = async (req, res, next) => {
  const authHeader = req.headers?.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }

  try {
    const idToken = authHeader.split(" ")[1];
    const decodedToken = await getAuth().verifyIdToken(idToken);

    req.decoded_email = decodedToken.email;
    next();
  } catch (err) {
    console.error("Token Verification Error:", err.message);
    return res
      .status(403)
      .send({ message: "Forbidden Access", error: err.message });
  }
};

// MongoDB Setup
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.td56s.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/favicon.ico", (req, res) => res.status(204).end());

// Root API
app.get("/", (req, res) => {
  res.send("Ramen Kumar Das Running............");
});

async function run() {
  try {
    await client.connect();

    const db = client.db("ramen_kumar_das_db");
    const userCollection = db.collection("users");
    const awardCollection = db.collection("awards");
    const experienceCollection = db.collection("experiences");
    const toolCollection = db.collection("tools");
    const researchCollection = db.collection("researches");
    const courseCollection = db.collection("courses");
    const academicCollection = db.collection("academics");
    const galleryCollection = db.collection("gallery");
    const refereeCollection = db.collection("referees");
    const projectSupervisionCollection = db.collection("project-supervisions");
    const workshopCollection = db.collection("workshops");
    const membershipCollection = db.collection("memberships");

    // Admin Middleware
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded_email;
      const query = { email };
      const user = await userCollection.findOne(query);

      if (!user || user.role !== "admin") {
        return res.status(403).send({ message: "forbidden access" });
      }

      next();
    };

    // USERS ROUTES
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
        res.status(500).send({
          success: false,
          message: "Failed to create user",
          error: error.message,
        });
      }
    });

    app.get("/users", async (req, res) => {
      try {
        const result = await userCollection
          .find()
          .sort({ createdAt: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to fetch users",
          error: error.message,
        });
      }
    });

    app.get("/users/role/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email });

      if (user) {
        res.send({ role: user.role });
      } else {
        res.status(404).send({ role: "user" });
      }
    });

    app.patch(
      "/users/:id/role",
      verifyFBToken,
      verifyAdmin,
      async (req, res) => {
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
          res.status(500).send({
            success: false,
            message: "Server Error",
            error: error.message,
          });
        }
      },
    );

    app.delete("/users/:id", verifyFBToken, verifyAdmin, async (req, res) => {
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

    // AWARDS ROUTES
    app.post("/awards", verifyFBToken, verifyAdmin, async (req, res) => {
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

    app.get("/awards/:id", async (req, res) => {
      try {
        const query = { _id: new ObjectId(req.params.id) };
        const award = await awardCollection.findOne(query);

        if (!award) {
          return res
            .status(404)
            .send({ success: false, message: "Award not found" });
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

    app.patch("/awards/:id", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const filter = { _id: new ObjectId(req.params.id) };
        const updateData = { ...req.body };
        delete updateData._id;

        const updateDoc = {
          $set: { ...updateData, updatedAt: new Date() },
        };

        const result = await awardCollection.updateOne(filter, updateDoc);

        if (result.matchedCount === 0) {
          return res
            .status(404)
            .send({ success: false, message: "Award not found" });
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

    app.delete("/awards/:id", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const result = await awardCollection.deleteOne({
          _id: new ObjectId(req.params.id),
        });

        if (result.deletedCount === 0) {
          return res
            .status(404)
            .send({ success: false, message: "Award not found" });
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

    // EXPERIENCES ROUTES
    app.post("/experiences", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const experience = req.body;
        experience.createdAt = new Date();

        const result = await experienceCollection.insertOne(experience);
        res.status(201).send({
          success: true,
          message: "Experience added successfully",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to add experience",
          error: error.message,
        });
      }
    });

    app.get("/experiences", async (req, res) => {
      try {
        const result = await experienceCollection
          .find()
          .sort({ createdAt: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to fetch experiences",
          error: error.message,
        });
      }
    });

    app.get("/experiences/:id", async (req, res) => {
      try {
        const query = { _id: new ObjectId(req.params.id) };
        const experience = await experienceCollection.findOne(query);

        if (!experience) {
          return res
            .status(404)
            .send({ success: false, message: "Experience not found" });
        }

        res.send(experience);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Invalid Experience ID or Server Error",
          error: error.message,
        });
      }
    });

    app.patch(
      "/experiences/:id",
      verifyFBToken,
      verifyAdmin,
      async (req, res) => {
        try {
          const filter = { _id: new ObjectId(req.params.id) };
          const updateData = { ...req.body };
          delete updateData._id;

          const updateDoc = {
            $set: { ...updateData, updatedAt: new Date() },
          };

          const result = await experienceCollection.updateOne(
            filter,
            updateDoc,
          );

          if (result.matchedCount === 0) {
            return res
              .status(404)
              .send({ success: false, message: "Experience not found" });
          }

          res.send({
            success: true,
            message: "Experience updated successfully",
            result,
          });
        } catch (error) {
          res.status(500).send({
            success: false,
            message: "Failed to update experience",
            error: error.message,
          });
        }
      },
    );

    app.delete(
      "/experiences/:id",
      verifyFBToken,
      verifyAdmin,
      async (req, res) => {
        try {
          const result = await experienceCollection.deleteOne({
            _id: new ObjectId(req.params.id),
          });

          if (result.deletedCount === 0) {
            return res
              .status(404)
              .send({ success: false, message: "Experience not found" });
          }

          res.send({
            success: true,
            message: "Experience deleted successfully",
            result,
          });
        } catch (error) {
          res.status(500).send({
            success: false,
            message: "Invalid ID or Server Error",
            error: error.message,
          });
        }
      },
    );

    // TOOLS ROUTES
    app.post("/tools", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const tool = req.body;
        tool.createdAt = new Date();

        const result = await toolCollection.insertOne(tool);
        res.status(201).send({
          success: true,
          message: "Tool added successfully",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to add tool",
          error: error.message,
        });
      }
    });

    app.get("/tools", async (req, res) => {
      try {
        const result = await toolCollection
          .find()
          .sort({ createdAt: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to fetch tools",
          error: error.message,
        });
      }
    });

    app.get("/tools/:id", async (req, res) => {
      try {
        const query = { _id: new ObjectId(req.params.id) };
        const tool = await toolCollection.findOne(query);

        if (!tool) {
          return res
            .status(404)
            .send({ success: false, message: "Tool not found" });
        }

        res.send(tool);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Invalid Tool ID or Server Error",
          error: error.message,
        });
      }
    });

    app.patch("/tools/:id", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const filter = { _id: new ObjectId(req.params.id) };
        const updateData = { ...req.body };
        delete updateData._id;

        const updateDoc = {
          $set: { ...updateData, updatedAt: new Date() },
        };

        const result = await toolCollection.updateOne(filter, updateDoc);

        if (result.matchedCount === 0) {
          return res
            .status(404)
            .send({ success: false, message: "Tool not found" });
        }

        res.send({
          success: true,
          message: "Tool updated successfully",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to update tool",
          error: error.message,
        });
      }
    });

    app.delete("/tools/:id", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const result = await toolCollection.deleteOne({
          _id: new ObjectId(req.params.id),
        });

        if (result.deletedCount === 0) {
          return res
            .status(404)
            .send({ success: false, message: "Tool not found" });
        }

        res.send({
          success: true,
          message: "Tool deleted successfully",
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

    // RESEARCHES ROUTES
    app.post("/researches", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const research = req.body;
        research.createdAt = new Date();

        const result = await researchCollection.insertOne(research);
        res.status(201).send({
          success: true,
          message: "Research paper/project added successfully",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to add research",
          error: error.message,
        });
      }
    });

    app.get("/researches", async (req, res) => {
      try {
        const result = await researchCollection
          .find()
          .sort({ createdAt: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to fetch researches",
          error: error.message,
        });
      }
    });

    app.get("/researches/:id", async (req, res) => {
      try {
        const query = { _id: new ObjectId(req.params.id) };
        const research = await researchCollection.findOne(query);

        if (!research) {
          return res
            .status(404)
            .send({ success: false, message: "Research not found" });
        }

        res.send(research);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Invalid Research ID or Server Error",
          error: error.message,
        });
      }
    });

    app.patch(
      "/researches/:id",
      verifyFBToken,
      verifyAdmin,
      async (req, res) => {
        try {
          const filter = { _id: new ObjectId(req.params.id) };
          const updateData = { ...req.body };
          delete updateData._id;

          const updateDoc = {
            $set: { ...updateData, updatedAt: new Date() },
          };

          const result = await researchCollection.updateOne(filter, updateDoc);

          if (result.matchedCount === 0) {
            return res
              .status(404)
              .send({ success: false, message: "Research not found" });
          }

          res.send({
            success: true,
            message: "Research updated successfully",
            result,
          });
        } catch (error) {
          res.status(500).send({
            success: false,
            message: "Failed to update research",
            error: error.message,
          });
        }
      },
    );

    app.delete(
      "/researches/:id",
      verifyFBToken,
      verifyAdmin,
      async (req, res) => {
        try {
          const result = await researchCollection.deleteOne({
            _id: new ObjectId(req.params.id),
          });

          if (result.deletedCount === 0) {
            return res
              .status(404)
              .send({ success: false, message: "Research not found" });
          }

          res.send({
            success: true,
            message: "Research deleted successfully",
            result,
          });
        } catch (error) {
          res.status(500).send({
            success: false,
            message: "Invalid ID or Server Error",
            error: error.message,
          });
        }
      },
    );

    // COURSES ROUTES
    app.post("/courses", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const course = req.body;
        course.createdAt = new Date();

        const result = await courseCollection.insertOne(course);
        res.status(201).send({
          success: true,
          message: "Course added successfully",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to add course",
          error: error.message,
        });
      }
    });

    app.get("/courses", async (req, res) => {
      try {
        const result = await courseCollection
          .find()
          .sort({ createdAt: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to fetch courses",
          error: error.message,
        });
      }
    });

    app.get("/courses/:id", async (req, res) => {
      try {
        const query = { _id: new ObjectId(req.params.id) };
        const course = await courseCollection.findOne(query);

        if (!course) {
          return res
            .status(404)
            .send({ success: false, message: "Course not found" });
        }

        res.send(course);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Invalid Course ID or Server Error",
          error: error.message,
        });
      }
    });

    app.patch("/courses/:id", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const filter = { _id: new ObjectId(req.params.id) };
        const updateData = { ...req.body };
        delete updateData._id;

        const updateDoc = {
          $set: { ...updateData, updatedAt: new Date() },
        };

        const result = await courseCollection.updateOne(filter, updateDoc);

        if (result.matchedCount === 0) {
          return res
            .status(404)
            .send({ success: false, message: "Course not found" });
        }

        res.send({
          success: true,
          message: "Course updated successfully",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to update course",
          error: error.message,
        });
      }
    });

    app.delete("/courses/:id", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const result = await courseCollection.deleteOne({
          _id: new ObjectId(req.params.id),
        });

        if (result.deletedCount === 0) {
          return res
            .status(404)
            .send({ success: false, message: "Course not found" });
        }

        res.send({
          success: true,
          message: "Course deleted successfully",
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

    // ACADEMICS ROUTES
    app.post("/academics", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const academic = req.body;
        academic.createdAt = new Date();

        const result = await academicCollection.insertOne(academic);
        res.status(201).send({
          success: true,
          message: "Academic record added successfully",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to add academic record",
          error: error.message,
        });
      }
    });

    app.get("/academics", async (req, res) => {
      try {
        const result = await academicCollection
          .find()
          .sort({ createdAt: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to fetch academic records",
          error: error.message,
        });
      }
    });

    app.get("/academics/:id", async (req, res) => {
      try {
        const query = { _id: new ObjectId(req.params.id) };
        const academic = await academicCollection.findOne(query);

        if (!academic) {
          return res
            .status(404)
            .send({ success: false, message: "Academic record not found" });
        }

        res.send(academic);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Invalid Academic ID or Server Error",
          error: error.message,
        });
      }
    });

    app.patch(
      "/academics/:id",
      verifyFBToken,
      verifyAdmin,
      async (req, res) => {
        try {
          const filter = { _id: new ObjectId(req.params.id) };
          const updateData = { ...req.body };
          delete updateData._id;

          const updateDoc = {
            $set: { ...updateData, updatedAt: new Date() },
          };

          const result = await academicCollection.updateOne(filter, updateDoc);

          if (result.matchedCount === 0) {
            return res
              .status(404)
              .send({ success: false, message: "Academic record not found" });
          }

          res.send({
            success: true,
            message: "Academic record updated successfully",
            result,
          });
        } catch (error) {
          res.status(500).send({
            success: false,
            message: "Failed to update academic record",
            error: error.message,
          });
        }
      },
    );

    app.delete(
      "/academics/:id",
      verifyFBToken,
      verifyAdmin,
      async (req, res) => {
        try {
          const result = await academicCollection.deleteOne({
            _id: new ObjectId(req.params.id),
          });

          if (result.deletedCount === 0) {
            return res
              .status(404)
              .send({ success: false, message: "Academic record not found" });
          }

          res.send({
            success: true,
            message: "Academic record deleted successfully",
            result,
          });
        } catch (error) {
          res.status(500).send({
            success: false,
            message: "Invalid ID or Server Error",
            error: error.message,
          });
        }
      },
    );

    // GALLERY ROUTES
    app.post("/gallery", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const item = req.body;
        item.createdAt = new Date();

        const result = await galleryCollection.insertOne(item);
        res.status(201).send({
          success: true,
          message: "Gallery item added successfully",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to add gallery item",
          error: error.message,
        });
      }
    });

    app.get("/gallery", async (req, res) => {
      try {
        const result = await galleryCollection
          .find()
          .sort({ createdAt: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to fetch gallery items",
          error: error.message,
        });
      }
    });

    app.get("/gallery/:id", async (req, res) => {
      try {
        const query = { _id: new ObjectId(req.params.id) };
        const item = await galleryCollection.findOne(query);

        if (!item) {
          return res
            .status(404)
            .send({ success: false, message: "Gallery item not found" });
        }

        res.send(item);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Invalid Gallery ID or Server Error",
          error: error.message,
        });
      }
    });

    app.patch("/gallery/:id", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const filter = { _id: new ObjectId(req.params.id) };
        const updateData = { ...req.body };
        delete updateData._id;

        const updateDoc = {
          $set: { ...updateData, updatedAt: new Date() },
        };

        const result = await galleryCollection.updateOne(filter, updateDoc);

        if (result.matchedCount === 0) {
          return res
            .status(404)
            .send({ success: false, message: "Gallery item not found" });
        }

        res.send({
          success: true,
          message: "Gallery item updated successfully",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to update gallery item",
          error: error.message,
        });
      }
    });

    app.delete("/gallery/:id", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const result = await galleryCollection.deleteOne({
          _id: new ObjectId(req.params.id),
        });

        if (result.deletedCount === 0) {
          return res
            .status(404)
            .send({ success: false, message: "Gallery item not found" });
        }

        res.send({
          success: true,
          message: "Gallery item deleted successfully",
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

    // REFEREES ROUTES
    app.post("/referees", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const referee = req.body;
        referee.createdAt = new Date();

        const result = await refereeCollection.insertOne(referee);
        res.status(201).send({
          success: true,
          message: "Referee added successfully",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to add referee",
          error: error.message,
        });
      }
    });

    app.get("/referees", async (req, res) => {
      try {
        const result = await refereeCollection
          .find()
          .sort({ createdAt: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to fetch referees",
          error: error.message,
        });
      }
    });

    app.get("/referees/:id", async (req, res) => {
      try {
        const query = { _id: new ObjectId(req.params.id) };
        const referee = await refereeCollection.findOne(query);

        if (!referee) {
          return res
            .status(404)
            .send({ success: false, message: "Referee not found" });
        }

        res.send(referee);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Invalid Referee ID or Server Error",
          error: error.message,
        });
      }
    });

    app.patch("/referees/:id", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const filter = { _id: new ObjectId(req.params.id) };
        const updateData = { ...req.body };
        delete updateData._id;

        const updateDoc = {
          $set: { ...updateData, updatedAt: new Date() },
        };

        const result = await refereeCollection.updateOne(filter, updateDoc);

        if (result.matchedCount === 0) {
          return res
            .status(404)
            .send({ success: false, message: "Referee not found" });
        }

        res.send({
          success: true,
          message: "Referee updated successfully",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to update referee",
          error: error.message,
        });
      }
    });

    app.delete(
      "/referees/:id",
      verifyFBToken,
      verifyAdmin,
      async (req, res) => {
        try {
          const result = await refereeCollection.deleteOne({
            _id: new ObjectId(req.params.id),
          });

          if (result.deletedCount === 0) {
            return res
              .status(404)
              .send({ success: false, message: "Referee not found" });
          }

          res.send({
            success: true,
            message: "Referee deleted successfully",
            result,
          });
        } catch (error) {
          res.status(500).send({
            success: false,
            message: "Invalid ID or Server Error",
            error: error.message,
          });
        }
      },
    );

    // PROJECT SUPERVISION ROUTES
    app.post(
      "/project-supervision",
      verifyFBToken,
      verifyAdmin,
      async (req, res) => {
        try {
          const supervision = req.body;
          supervision.createdAt = new Date();

          const result =
            await projectSupervisionCollection.insertOne(supervision);
          res.status(201).send({
            success: true,
            message: "Project supervision record added successfully",
            result,
          });
        } catch (error) {
          res.status(500).send({
            success: false,
            message: "Failed to add project supervision record",
            error: error.message,
          });
        }
      },
    );

    app.get("/project-supervision", async (req, res) => {
      try {
        const result = await projectSupervisionCollection
          .find()
          .sort({ createdAt: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to fetch project supervision records",
          error: error.message,
        });
      }
    });

    app.get("/project-supervision/:id", async (req, res) => {
      try {
        const query = { _id: new ObjectId(req.params.id) };
        const supervision = await projectSupervisionCollection.findOne(query);

        if (!supervision) {
          return res.status(404).send({
            success: false,
            message: "Project supervision record not found",
          });
        }

        res.send(supervision);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Invalid Project Supervision ID or Server Error",
          error: error.message,
        });
      }
    });

    app.patch(
      "/project-supervision/:id",
      verifyFBToken,
      verifyAdmin,
      async (req, res) => {
        try {
          const filter = { _id: new ObjectId(req.params.id) };
          const updateData = { ...req.body };
          delete updateData._id;

          const updateDoc = {
            $set: { ...updateData, updatedAt: new Date() },
          };

          const result = await projectSupervisionCollection.updateOne(
            filter,
            updateDoc,
          );

          if (result.matchedCount === 0) {
            return res.status(404).send({
              success: false,
              message: "Project supervision record not found",
            });
          }

          res.send({
            success: true,
            message: "Project supervision record updated successfully",
            result,
          });
        } catch (error) {
          res.status(500).send({
            success: false,
            message: "Failed to update project supervision record",
            error: error.message,
          });
        }
      },
    );

    app.delete(
      "/project-supervision/:id",
      verifyFBToken,
      verifyAdmin,
      async (req, res) => {
        try {
          const result = await projectSupervisionCollection.deleteOne({
            _id: new ObjectId(req.params.id),
          });

          if (result.deletedCount === 0) {
            return res.status(404).send({
              success: false,
              message: "Project supervision record not found",
            });
          }

          res.send({
            success: true,
            message: "Project supervision record deleted successfully",
            result,
          });
        } catch (error) {
          res.status(500).send({
            success: false,
            message: "Invalid ID or Server Error",
            error: error.message,
          });
        }
      },
    );

    // WORKSHOPS ROUTES
    app.post("/workshops", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const workshop = req.body;
        workshop.createdAt = new Date();

        const result = await workshopCollection.insertOne(workshop);
        res.status(201).send({
          success: true,
          message: "Workshop added successfully",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to add workshop",
          error: error.message,
        });
      }
    });

    app.get("/workshops", async (req, res) => {
      try {
        const result = await workshopCollection
          .find()
          .sort({ createdAt: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to fetch workshops",
          error: error.message,
        });
      }
    });

    app.get("/workshops/:id", async (req, res) => {
      try {
        const query = { _id: new ObjectId(req.params.id) };
        const workshop = await workshopCollection.findOne(query);

        if (!workshop) {
          return res
            .status(404)
            .send({ success: false, message: "Workshop not found" });
        }

        res.send(workshop);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Invalid Workshop ID or Server Error",
          error: error.message,
        });
      }
    });

    app.patch(
      "/workshops/:id",
      verifyFBToken,
      verifyAdmin,
      async (req, res) => {
        try {
          const filter = { _id: new ObjectId(req.params.id) };
          const updateData = { ...req.body };
          delete updateData._id;

          const updateDoc = {
            $set: { ...updateData, updatedAt: new Date() },
          };

          const result = await workshopCollection.updateOne(filter, updateDoc);

          if (result.matchedCount === 0) {
            return res
              .status(404)
              .send({ success: false, message: "Workshop not found" });
          }

          res.send({
            success: true,
            message: "Workshop updated successfully",
            result,
          });
        } catch (error) {
          res.status(500).send({
            success: false,
            message: "Failed to update workshop",
            error: error.message,
          });
        }
      },
    );

    app.delete(
      "/workshops/:id",
      verifyFBToken,
      verifyAdmin,
      async (req, res) => {
        try {
          const result = await workshopCollection.deleteOne({
            _id: new ObjectId(req.params.id),
          });

          if (result.deletedCount === 0) {
            return res
              .status(404)
              .send({ success: false, message: "Workshop not found" });
          }

          res.send({
            success: true,
            message: "Workshop deleted successfully",
            result,
          });
        } catch (error) {
          res.status(500).send({
            success: false,
            message: "Invalid ID or Server Error",
            error: error.message,
          });
        }
      },
    );

    
    app.post("/memberships", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const membership = req.body;
        membership.createdAt = new Date();

        const result = await membershipCollection.insertOne(membership);
        res.status(201).send({
          success: true,
          message: "Membership plan created successfully",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to create membership plan",
          error: error.message,
        });
      }
    });

    // 2. READ ALL: সব মেম্বারশিপ প্ল্যান দেখা (Public Route)
    app.get("/memberships", async (req, res) => {
      try {
        const result = await membershipCollection
          .find()
          .sort({ createdAt: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to fetch membership plans",
          error: error.message,
        });
      }
    });

    // 3. READ ONE: নির্দিষ্ট কোনো মেম্বারশিপ প্ল্যান দেখা (Public Route)
    app.get("/memberships/:id", async (req, res) => {
      try {
        const query = { _id: new ObjectId(req.params.id) };
        const membership = await membershipCollection.findOne(query);

        if (!membership) {
          return res.status(404).send({
            success: false,
            message: "Membership plan not found",
          });
        }

        res.send(membership);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Invalid Membership ID or Server Error",
          error: error.message,
        });
      }
    });

    // 4. UPDATE: মেম্বারশিপ প্ল্যান আপডেট করা (Admin Only)
    app.patch("/memberships/:id", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const filter = { _id: new ObjectId(req.params.id) };
        const updateData = { ...req.body };
        delete updateData._id;

        const updateDoc = {
          $set: { ...updateData, updatedAt: new Date() },
        };

        const result = await membershipCollection.updateOne(filter, updateDoc);

        if (result.matchedCount === 0) {
          return res.status(404).send({
            success: false,
            message: "Membership plan not found",
          });
        }

        res.send({
          success: true,
          message: "Membership plan updated successfully",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to update membership plan",
          error: error.message,
        });
      }
    });

    // 5. DELETE: মেম্বারশিপ প্ল্যান মুছে ফেলা (Admin Only)
    app.delete("/memberships/:id", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const result = await membershipCollection.deleteOne({
          _id: new ObjectId(req.params.id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).send({
            success: false,
            message: "Membership plan not found",
          });
        }

        res.send({
          success: true,
          message: "Membership plan deleted successfully",
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
    serverReadyResolve();
  } catch (error) {
    console.error("Database connection error:", error);
    serverReadyReject(error);
  }

  
}

// Vercel: Wait for MongoDB connection and route registration
app.use(async (req, res, next) => {
  try {
    await serverReady;
    next();
  } catch (error) {
    console.error("Server initialization failed:", error.message);

    res.status(500).send({
      success: false,
      message: "Server initialization failed",
    });
  }
});

// Function-টি কল দেওয়া হলো
run().catch((error) => {
  console.error("Run Error:", error);
});

if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app;
