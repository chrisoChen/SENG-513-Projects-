var express = require("express");
var app = express();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
var path = require("path");

let roomcount = 0;

//  @gamerooms: hold room objects: 
//  room = { @id: unique room id used to joinRooms,
//           @name: name of room, add 1 to each new room made
//           @sockets[]: the connected sockets to that room }
let gamerooms = [];
let nameChoice1 = [
  "Lady",
  "Sir",
  "Daddy",
  "Women",
  "Dude",
  "Brother",
  "Sister",
  "Director",
  "RamRanch",
];
let nameChoice2 = [
  "Red",
  "Apple",
  "Cold",
  "Hot",
  "Nude",
  "Candy",
  "Black",
  "Raptor",
  "Ranch",
];
let nameChoice3 = [
  "Bear",
  "WaterDoggo",
  "LandDoggo",
  "AirDoggo",
  "Birb",
  "Cherry",
  "Fruity",
  "Clown",
  "SeaMeat",
];
let playerColors = ["black", "white"];

// @joinRoom: Players joinRoom when entering first time or when entering room code
//            If 2 players are in a room, init game
const joinRoom = function (socket, room) {
  room.sockets.push(socket); // store connected user to room object
  socket.join(room.id, function () {
    // store room id in server
    socket.roomID = room.id;
    console.log(socket.id, "joined room", room.id);

    if (room.sockets.length == 2) {
      let index = 0;
      for (const client of room.sockets) {
        client.emit(
          "initGame",
          client.userId,
          socket.roomID,
          playerColors[index],
          playerColors
        );
        index = index + 1;
      }
    }
  });
};

const leaveRooms = function (socket) {
  const delRooms = [];
  for (id in gamerooms) {
    const room = gamerooms[id];

    // See if the leaving socket is in current room
    if (room.sockets.includes(socket)) {
      console.log("Room Matches! Leaving room...");
      socket.leave(id);

      // Take out sockets from the room object
      room.sockets = room.sockets.filter((item) => item !== socket);
    }
    if (room.sockets.length == 0) {
      delRooms.push(room);
    }
  }
  for (const room of delRooms) {
    console.log("Deleting room!");
    delete gamerooms[room.id];
  }
};

function addUser(userId, socket) {
  socket.userId = userId;
}

// serve static files in public folder
app.use(express.static(path.join(__dirname, "public")));

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/public/index.html");
});

// Connection to default namespace
io.on("connection", function (socket) {
  socket.emit("checkUser");

  socket.on("addCookieUser", function (cookieData) {
    addUser(cookieData.userId, socket);
  });

  socket.on("addUpdatedUser", function (newName) {
    addUser(newName, socket);
  });

  socket.on("newCookieUser", function () {
    let userId =
      genUsername(nameChoice1) +
      genUsername(nameChoice2) +
      genUsername(nameChoice3);

    // Create new cookie to store current user's id
    socket.emit("initUserCookie", userId);
    addUser(userId, socket);
    socket.emit("displayNewUser", socket.userId);
  });

  socket.on("disconnect", function () {
    if (!socket.userId) return;
    leaveRooms(socket);
  });

  socket.on("makeRoom", function () {
    const room = {
      id: genRoomID(),
      name: roomcount,
      sockets: [], 
    };
    roomcount = (roomcount) => {
      return roomcount + 1;
    };
    gamerooms.push(room);
   
    // On first connection, user joins the room they just made
    joinRoom(socket, room);
    socket.emit("returnConnRoom", room.id);
  });

  socket.on("joinRoom", function (roomId) {
    let roomResult = gamerooms
      .map((e) => {
        return e.id;
      })
      .indexOf(roomId);
    if (roomResult != -1) {
      const room = gamerooms[roomResult];
      joinRoom(socket, room);
      console.log("You just joined room at ", roomId);
    }
  });

  socket.on("randomJoin", function () {
    // Get array of current gamerooms
    let roomList = gamerooms
      .map((e) => {
        return e.id;
      })
      .filter(roomComparator);

    // Join first room found in stored list
    console.log(roomList);

    if (roomList) {
      let choice = roomList.pop();
      let roomIndex = gamerooms
        .map((e) => {
          return e.id;
        })
        .indexOf(choice);
      console.log(roomIndex);
      if (roomIndex !== -1) joinRoom(socket, gamerooms[roomIndex]);
      else {
        alert("Error: try refreshing page and try again. ");
      }
    } else {
      alert("Error: try refreshing page and try again. ");
    }
  });

  // @roomComparator: used in filter for @randomJoin
  function roomComparator(storedRoom) {
    return storedRoom !== socket.roomID;
  }

  socket.on("playMove", function (gameData) {
    socket.broadcast.to(gameData.room).emit("movePlayed", {
      tile: gameData.tile,
      room: gameData.room,
      color: gameData.color,
    });
  });

  socket.on("endGame", function (winner, room) {
    // Swap board with and tell players who won the game
    socket.broadcast.to(room).emit("informEndGame", winner);
  });

  socket.on("gameDraw", function (room, drawDetails) {
    socket.broadcast.to(room).emit("informDraw", drawDetails);
  });
});

// genUsername(): randombly pick index of random names
function genUsername(nameChoice) {
  return nameChoice[Math.floor(Math.random() * Math.floor(nameChoice.length))];
}

function genRoomID() {
  return Math.random().toString(36).substr(2, 9);
}

http.listen(3000, function () {
  console.log("listening on *:3000");
});
