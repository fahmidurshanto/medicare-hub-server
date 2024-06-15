const express = require("express");
const jwt = require("jsonwebtoken");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@clustercrud.ctitxen.mongodb.net/?retryWrites=true&w=majority&appName=clusterCrud`;

// mongodb client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.use(cors());
app.use(express.json());
// Error handling middleware
app.use((err, req, res, next) => {
  res
    .status(err.status || 500)
    .send({ message: err.message || "Error processing request" });
});
const verifyToken = (req, res, next) => {
  console.log(req.headers.authorization);
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    await client.connect();

    const medicareHub = client.db("medicare");
    const usersCollection = medicareHub.collection("users");
    const districtsCollection = medicareHub.collection("districts");
    const upazilasCollection = medicareHub.collection("upazilas");

    // jwt
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // admin
    app.get("/user/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "unauthorized access" });
      }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });

    // register route
    app.post("/users", (req, res) => {
      const user = req.body;
      user.status = "active"; // Default status for all new users
      const result = usersCollection.insertOne(user);
      res.send(result);
    });

    // all users get route
    app.get("/users", async (req, res) => {
      console.log(req.headers);
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.patch("/users/admin/:id", async (req, res, next) => {
      try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
          const error = new Error("Invalid user ID");
          error.status = 400;
          return next(error);
        }

        const query = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            role: "admin",
          },
        };
        const result = await usersCollection.updateOne(query, updatedDoc);

        if (result.modifiedCount === 0) {
          const error = new Error("User not found or already an admin");
          error.status = 404;
          return next(error);
        }

        res.status(200).send({
          message: "User made admin successfully",
          modifiedCount: result.modifiedCount,
        });
      } catch (error) {
        next(error);
      }
    });

    // single user details get route
    app.get("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    // user status update api route
    app.patch("/users/:id", (req, res) => {
      const userId = req.params.id;
      const query = { _id: new ObjectId(userId) };
      const updatedUser = req.body;
      const result = usersCollection.updateOne(query, { $set: updatedUser });
      res.send(result);
    });

    // districts get route
    app.get("/districts", async (req, res) => {
      const cursor = districtsCollection.find();
      const districts = await cursor.toArray();
      res.send(districts);
    });

    // upazila's get route
    app.get("/upazilas", async (req, res) => {
      const cursor = upazilasCollection.find();
      const upazilas = await cursor.toArray();
      res.send(upazilas);
    });

    // api home route
    app.get("/", (req, res) => {
      res.send("Hello from Medicare Hub Server");
    });

    app.listen(port, (req, res) => {
      console.log(`Server is running on port ${port}`);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);
