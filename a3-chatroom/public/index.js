// should be const but following tutorial
var express = require("express");
var app = express();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
var path = require("path");
var cookieParser = require("cookie-parser");

var users = [];
let storedMsgs = [];
let currTime;
let ischatFull = false;
let listColors = ["green", "blue", "red", "purple", "pink", "orange", "black"];

// serve everything in /css folder
app.use("/css", express.static("css"));
app.use(cookieParser());

// serve main file to server
app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", function(socket) {
  // On connection, check if new data needs to be generated for user
  socket.emit("checkUser");

  // Check if user wants to change nickname or color, otherwise create message details
  socket.on("chat message", function(msg) {
    currTime = new Date();
    
    // Put 0 in front if less than 10 minutes
    let min = (currTime.getMinutes() < 10 ? "0" : "") + currTime.getMinutes();
    let hour = currTime.getHours();
    timeDisplay = hour + ":" + min;

    if (msg.startsWith("/nick ")) {
      let oldName = socket.clientName;
      let taken = false;
      socket.clientName = msg.slice(6);

      // Iterate and check if a userName has been taken already
      for (let i = 0; i < users.length; i++) {
        if (users[i].clientName === socket.clientName) {
          taken = true;
        }
      }
      if (taken) {
        // If name taken, tell client and reinsert old username
        socket.emit("nameTaken", socket.clientName);
        socket.clientName = oldName;
      } else {
        // Search for old clientName in users and replace with new one
        for (let i = 0; i < users.length; i++) {
          if (users[i].clientName === oldName) {
            users[i].clientName = socket.clientName;
          }
        }

        // Tell everyone including user than name changed worked
        socket.broadcast.emit("nameChangeAlert", oldName, socket.clientName);
        socket.emit("nameChangeAlert", oldName, socket.clientName);

        // Update information on client from namechange
        socket.emit("updateCookieName", socket.clientName);
        socket.emit("updateOnlineUser", socket.clientName);
        updateUsernames();
      }
    } else if (msg.startsWith("/nickcolor ")) {
      socket.color = msg.slice(11);
      // Search for user in users and change users color
      for (let i = 0; i < users.length; i++) {
        if (users[i].clientName === socket.clientName) {
          users[i].color = socket.color;
        }
      }
      // Inform and update informatin on client side
      updateUsernames();
      socket.emit("nameChangeColorAlert", socket.clientName, socket.color);
      socket.broadcast.emit(
        "nameChangeColorAlert",
        socket.clientName,
        socket.color
      );
    } else {
      // If stored messages at capacity, delete first item in array
      if (storedMsgs.length === 200) {
        storedMsgs.shift();
        ischatFull = true;
      }

      storedMsgs.push({
        clientName: socket.clientName,
        color: socket.color,
        msg: msg,
        timeDisplay: timeDisplay
      });

      // Send message to other users
      socket.broadcast.emit(
        "chatMessage",
        timeDisplay,
        socket.color,
        socket.clientName,
        msg,
        ischatFull
      );
      // Bold sent messages by user
      socket.emit(
        "boldChatMessage",
        timeDisplay,
        socket.color,
        socket.clientName,
        msg,
        ischatFull
      );
    }
  });
  // Create new username if first time connection
  socket.on("newCookieUser", function() {
    let userId = "User_" + genUsername();
    socket.color = genUsercolor();
    socket.emit("initUserCookie", userId);
    socket.emit("loadHistory", storedMsgs);
    addUser(userId, socket.color);
  });

  // Load userName from cookies if user previously connected to chat
  socket.on("addCookieUser", function(cookieName) {
    socket.color = genUsercolor();
    socket.emit("loadHistory", storedMsgs);
    addUser(cookieName, socket.color);
  });

  // Remove user from Online Users on page close or reload
  socket.on("disconnect", function() {
    if (!socket.clientName) return;

    // Remove user from list of objects: fixed issue with map function
    users.splice(
      users
        .map(function(e) {
          return e.clientName;
        })
        .indexOf(socket.clientName),
      1
    );
    updateUsernames();
    // Tell other online users current user is leaving chat
    socket.broadcast.emit("leftChat", socket.clientName);
  });

  // On connection to server, add users to list
  function addUser(usr, color) {
    socket.clientName = usr;
    users.push({ clientName: usr, color: color });

    // Tell clients a new user has entered chat
    socket.broadcast.emit("enterChat", usr);
    updateUsernames();
  }
});

function updateUsernames() {
  io.emit("displayUsers", users);
}

// Tell server connection worked
http.listen(3000, function() {
  console.log("listening on *:3000");
});

function genUsername() {
  return (
    "_" +
    Math.random()
      .toString(36)
      .substr(2, 9)
  );
}

// Random select color from array
function genUsercolor() {
  return listColors[Math.floor(Math.random() * Math.floor(listColors.length))];
}
