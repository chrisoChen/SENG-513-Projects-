var socket = io();
var game, player;

// Default Color
let myColor = "Black";
let oppColor = "White";
let playerColors = "";

// Short-hand for $(document).ready(function()){});
$(function () {
  var socket = io();

  // Handle name change from user
  $("#nameFormId").submit(function (e) {
    e.preventDefault();
    let newName = $("#nameFormInput").val();

    let oldCookies = JSON.parse(document.cookie);
    let newCookies = JSON.stringify({
      userId: newName,
      theme: oldCookies.theme,
    });
    document.cookie = newCookies;
    socket.emit("addUpdatedUser", newName);

    outputName($("#nameFormInput").val());
    $("#nameFormInput").val("");
    return false;
  });

  function outputName(userName) {
    $("#theName").html(
      "<p> Welcome Back </p>" + '<div class="card3"> <p>' + userName + "</p>"
    );
  }

  socket.on("checkUser", function () {
    if (document.cookie) {
      let cookieData = JSON.parse(document.cookie);
      socket.emit("addCookieUser", cookieData);

      outputName(cookieData.userId);
    } else {
      socket.emit("newCookieUser");
    }
    // User creates a gameroom even if they don't play in it
    socket.emit("makeRoom");
  });

  // Create new cookie for user for first time connection
  socket.on("initUserCookie", function (userId) {
    let cookieData = { userId: userId, theme: "normal" };
    document.cookie = JSON.stringify(cookieData);
  });

  // For new users, tell user that server made userName for them
  socket.on("displayNewUser", function (userName) {
    let parsedData = JSON.parse(document.cookie);

    $("#theName").html(
      "<p> We created a name for you: </p>" +
        '<div class="card3"> <p>' +
        parsedData.userId +
        "</p>"
    );
  });

  // Print special code needed to join user's gameroom
  socket.on("returnConnRoom", function (currentRoom) {
    $(".gameInfo").append("<p><b>" + currentRoom + "</b></p>");
  });

  // Join room with a code provided to user
  $("#joinFriendForm").submit(function (e) {
    e.preventDefault();
    socket.emit("joinRoom", $("#joinFriend").val());
  });

  // Join a random room 
  $("#randomButton").click(function (e) {
    e.preventDefault();
    socket.emit("randomJoin");
  });

  // Change HTML to gomoku and create tiles
  socket.on("initGame", function (currUser, roomName, pColor, listColors) {
    game = new Game(roomName);
    myColor = pColor;
    playerColors = listColors;
    let myTurn = "";

    // Player who first joined room goes first
    if (playerColors.indexOf(myColor) === 0) {
      myTurn = true;
    } else myTurn = false;
    player = new Player(currUser, pColor, myTurn);

    // playerColors array will always have length 2
    if (myColor === playerColors[0]) {
      oppColor = playerColors[1];
    } else oppColor = playerColors[0];

    // Change HTML to board and assign tiles with click handler
    game.swaptoBoard(currUser);
    game.makeBoard();

    // Send game details to player
    game.informGameplay(currUser);
    game.informUserColor(myColor);

    // Tell each player if it is their turn or not
    player.informTurn(myTurn);

    // Change text to white for dark theme
    if (JSON.parse(document.cookie).theme === "dark") {
      $("p").attr("style", "color: white");
    }
  });

  // Listen from playTurnUpdate board and switch turn to other player
  socket.on("movePlayed", function (gameData) {
    let row = game.getRowFromTile(gameData.tile);
    let col = game.getColFromTile(gameData.tile);

    // broadcasted.emit not working as intended: prevent placement of piece for user who placed piece
    if (gameData.color !== myColor) {
      game.updateTile(gameData.color, row, col, gameData.tile);
      game.board[row][col] = gameData.color;

      player.setCurrentTurn(true);
    }
  });

  // Send game end message to each player
  socket.on("informEndGame", function (winner) {
    let winnerHTML =
      "<p> CHICKEN DINNER!<b> " +
      winner +
      " </b> has won the game! </p>" +
      "<p> To <b> start a new game, refresh page </b> and enter room code or join a random game. </p>";
    $(".board").html(winnerHTML);

    // Swap text to white if using dark theme
    if (JSON.parse(document.cookie).theme === "dark") {
      $("p").attr("style", "color: white; text-align: center");
    } else {
      $("p").attr("style", "color: black; text-align: center");
    }
  });

  socket.on("informDraw", function (drawDetails) {
    $(".currentTurn").html(drawDetails);
  });
});
