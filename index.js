const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");

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

async function run() {
  try {
    await client.connect();

    const medicareHub = client.db("medicare");
    const usersCollection = medicareHub.collection("users");

    app.post("/register", (req, res) => {
      const user = req.body;
      console.log(user);
      user.status = "active"; // Default status for all new users
      const result = usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/", (req, res) => {
      res.send("Hello from Medicare Hub Server");
    });

    app.listen(port, () => {
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
