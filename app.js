const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const jwt = require("jsonwebtoken");
const path = require("path");
const bcrypt = require("bcrypt");

const dbpath = path.join(__dirname, "userData.db");

let db = null;
const initialiseDBandDatabase = async () => {
  try {
    db = await open({ filename: dbpath, driver: sqlite3.Database });

    app.listen(process.env.PORT || 5000, () => {
      console.log("server is started at http://localhost:5000");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
initialiseDBandDatabase();

//API-1 registration
app.get("/", (req, res) => {
  res.json({ message: "hai" });
});
app.post("/register/", async (request, response) => {
  const userData = request.body;
  const { username, name, password, gender, location } = userData;
  const passwordLength = password.length;
  if (passwordLength < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);
    const checkUserInDB = `select * from user where username='${username}';`;
    const dbresponseUser = await db.get(checkUserInDB);
    if (dbresponseUser === undefined) {
      const registerQuery = `INSERT INTO
        user (username,name,password,gender,location)
      VALUES
          (
          '${username}',
          '${name}',
          '${hashedPassword}',
          '${gender}',
          '${location}'
        );`;
      const registerResponse = await db.run(registerQuery);
      response.status(200);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("User already exists");
    }
  }
});

//API-2 Login

app.post("/login", async (request, response) => {
  const loginDetails = request.body;
  const { username, password } = loginDetails;
  const checkLoginUserInDB = `select * from user where username='${username}';`;
  const dbLoginresponse = await db.get(checkLoginUserInDB);
  if (dbLoginresponse !== undefined) {
    const hashedPassword = dbLoginresponse.password;
    const comparePassword = await bcrypt.compare(password, hashedPassword);
    if (comparePassword === true) {
      const payload = {
        username: dbLoginresponse.username,
      };
      const jwtToken = jwt.sign(payload, "qwertyuio");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

//API-3 Change-password

app.put("/change-password/", async (request, response) => {
  const userData = request.body;
  const { username, oldPassword, newPassword } = userData;
  const passwordLen = newPassword.length;
  if (passwordLen < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const getUserDetails = `select * from user where username='${username}';`;
    const dbuserDetails = await db.get(getUserDetails);
    const passwordVerify = await bcrypt.compare(
      oldPassword,
      dbuserDetails.password
    );
    if (passwordVerify === true) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatePasswordQuery = `UPDATE user
SET password='${hashedPassword}' where username='${username}';`;
      const updateResponse = await db.run(updatePasswordQuery);
      response.send("Password updated");
      response.status(200);
    } else {
      response.status(400);
      response.send("Invalid old password");
    }
  }
});

module.exports = app;
