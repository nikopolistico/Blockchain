const express = require("express");
const cors = require("cors");
const { Gateway, Wallets } = require("fabric-network");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto"); // Import crypto for hashing
const bcrypt = require("bcrypt");
const multer = require("multer");
const upload = multer(); // no disk storage, just memory

const app = express();
app.use(cors());
app.use(express.json());

require("dotenv").config(); // this can stay, even if unused on Render

const { createClient } = require("@supabase/supabase-js"); // ✅ This is required
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
const PORT = process.env.PORT || 3000;

// ✅ Add Content Security Policy for fonts & styles
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; font-src 'self' https://fonts.gstatic.com; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; script-src 'self';"
  );
  next();
});

// ✅ Serve frontend from 'crime-system' folder
app.use(express.static(path.join(__dirname, "UI", "dist")));

// ✅ Paths to connection profile and wallet
const ccpPath = path.resolve(
  __dirname,
  "..",
  "blockchain",
  "fabric-samples",
  "test-network",
  "organizations",
  "peerOrganizations",
  "org1.example.com",
  "connection-org1.json"
);

const walletPath = path.resolve(
  __dirname,
  "..",
  "blockchain",
  "fabric-samples",
  "asset-transfer-basic",
  "application-gateway-javascript",
  "wallet"
);

// ✅ Utility function to connect to Fabric Gateway
async function connectToFabric() {
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  const gateway = new Gateway();

  try {
    await gateway.connect(JSON.parse(fs.readFileSync(ccpPath, "utf8")), {
      wallet,
      identity: "appUser", // Ensure 'appUser' exists in the wallet
      discovery: { enabled: true, asLocalhost: true },
    });
    console.log("✅ Connected to Fabric Gateway");
    return gateway;
  } catch (error) {
    console.error("❌ Failed to connect to Fabric:", error.message);
    throw new Error("Failed to connect to Fabric Network");
  }
}

// ✅ Function to generate the hash of the crime report data
function generateHash(crimeId, description, date, status) {
  const dataString = `${crimeId}${description}${date}${status}`;
  return crypto.createHash("sha256").update(dataString).digest("hex");
}

// ✅ Function to get the original hash from Hyperledger Fabric (Blockchain)
async function getBlockchainHash(crimeId) {
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  const gateway = new Gateway();

  try {
    await gateway.connect(JSON.parse(fs.readFileSync(ccpPath, "utf8")), {
      wallet,
      identity: "appUser", // Ensure 'appUser' exists in the wallet
      discovery: { enabled: true, asLocalhost: true },
    });

    const network = await gateway.getNetwork("mychannel");
    const contract = network.getContract("app");

    // Query blockchain for the crime report hash
    const result = await contract.evaluateTransaction("readCrime", crimeId);
    return result.toString(); // The original hash from the blockchain
  } catch (error) {
    console.error(`❌ Error retrieving hash from blockchain: ${error.message}`);
    return null;
  } finally {
    await gateway.disconnect();
  }
}

// ✅ POST /report → submit a new crime
app.post("/report", upload.none(), async (req, res) => {
  const { description, anonyname } = req.body;
  const status = req.body.status || "unread";
  const date = new Date().toISOString().slice(0, 19).replace("T", " ");

  if (!description || !date || !status || !anonyname) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const dataHash = generateHash(description, date, status);

    // Insert into Supabase
    const { data: insertData, error: insertError } = await supabase
      .from("crime_reports")
      .insert([
        {
          description,
          date,
          status,
          data_hash: dataHash,
          anonyname,
        },
      ])
      .select();

    if (insertError) {
      console.error("❌ Supabase insert error:", insertError.message);
      return res.status(500).json({ error: "Failed to insert into Supabase" });
    }

    const record = insertData[0];

    try {
      const gateway = await connectToFabric();
      const network = await gateway.getNetwork("mychannel");
      const contract = network.getContract("app");

      await contract.submitTransaction(
        "reportCrime",
        record.crime_id.toString(),
        record.description,
        record.date,
        record.status,
        record.data_hash,
        record.anonyname
      );

      console.log("📨 Full report submitted to Fabric:", record);
      res.json({ message: "✅ Crime reported successfully" });
      await gateway.disconnect();
    } catch (fabricError) {
      console.error("❌ Fabric submit error:", fabricError.message);
      res.status(500).json({ error: "Failed to submit to Fabric" });
    }
  } catch (error) {
    console.error("❌ Outer error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Test Supabase connection and query
app.get("/test-supabase", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("crime_reports")
      .select("crime_id")
      .limit(1);

    if (error) {
      console.error("❌ Supabase test failed:", error.message);
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      message: "✅ Supabase connected and query succeeded.",
      sample: data,
    });
  } catch (err) {
    console.error("❌ Unexpected error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/reports", async (req, res) => {
  console.log("🔍 /reports endpoint hit");

  const { data, error } = await supabase
    .from("crime_reports")
    .select("anonyname, description, status")
    .order("crime_id", { ascending: false });

  if (error) {
    console.error("❌ Supabase fetch error:", error.message);
    return res.status(500).json({ error: "Database error" });
  }

  const reports = data.map((r) => ({
    name: r.anonyname,
    description: r.description,
    status: r.status,
    type: "text",
  }));

  res.json(reports);
});

app.get("/crime/:id", async (req, res) => {
  const crimeId = req.params.id;
  console.log(`Fetching crime report for ID: ${crimeId}`); // Log the ID being queried

  try {
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const gateway = new Gateway();
    await gateway.connect(JSON.parse(fs.readFileSync(ccpPath, "utf8")), {
      wallet,
      identity: "appUser",
      discovery: { enabled: true, asLocalhost: true },
    });

    const network = await gateway.getNetwork("mychannel");
    const contract = network.getContract("app");

    const result = await contract.evaluateTransaction("readCrime", crimeId);

    if (result) {
      console.log(`Crime data found: ${result.toString()}`); // Log the result for debugging
      res.json({
        crimeId,
        data: result.toString(),
        message:
          "This data is retrieved from the blockchain and must be verified against the source system for accuracy and consistency.",
      });
    } else {
      console.error(`No data found for Crime ID: ${crimeId}`); // Log if no result is found
      res
        .status(404)
        .json({ error: `Crime report not found for ID: ${crimeId}` });
    }

    gateway.disconnect();
  } catch (error) {
    console.error(`Error fetching crime record: ${error.message}`);
    res.status(500).json({
      error:
        "An error occurred while fetching the crime record: " + error.message,
    });
  }
});

// ✅ Serve index.html at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "UI", "dist", "index.html"));
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`🚀 API server running at http://localhost:${PORT}`);
});

// ✅ Barangay

// ✅ Tanod Login/Register API
// Register endpoint
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.json({ error: "Username and password required" });
  }

  // Check if username exists
  const checkQuery = "SELECT * FROM tanod_users WHERE username = ?";
  mysqlConnection.query(checkQuery, [username], (err, results) => {
    if (err) return res.json({ error: "Database error" });
    if (results.length > 0) {
      return res.json({ error: "Username already taken" });
    }

    // Hash password
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return res.json({ error: "Hashing error" });

      // Insert user
      const insertQuery =
        "INSERT INTO tanod_users (username, password) VALUES (?, ?)";
      mysqlConnection.query(insertQuery, [username, hash], (err) => {
        if (err) return res.json({ error: "Database error" });
        res.json({ message: "User registered successfully" });
      });
    });
  });
});

// Login endpoint
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.json({ error: "Username and password required" });
  }

  const findUserQuery = "SELECT * FROM tanod_users WHERE username = ?";
  mysqlConnection.query(findUserQuery, [username], (err, results) => {
    if (err) return res.json({ error: "Database error" });
    if (results.length === 0) {
      return res.json({ error: "User not found" });
    }

    const user = results[0];
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) return res.json({ error: "Error during authentication" });
      if (result) {
        res.json({ message: "Login successful" });
      } else {
        res.json({ error: "Invalid password" });
      }
    });
  });
});

// Get all registered tanods
app.get("/tanods", (req, res) => {
  const query = "SELECT id, username FROM tanod_users"; // Adjust columns as needed
  mysqlConnection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching tanods:", err.message);
      return res.status(500).json({ error: "Failed to fetch tanods" });
    }
    res.json(results);
  });
});
