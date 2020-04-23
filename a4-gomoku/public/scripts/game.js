class Game {
  constructor(roomId) {
    this.roomId = roomId;
    this.board = [];

    this.normalData = {
      backgroundColor: "white",
      tileColor: "burlywood",
    };

    this.darkData = {
      backgroundColor: "#333333",
      tileColor: "#30475e",
    };

    this.patrickData = {
      backgroundColor: "#ffccd5",
      tileColor: "#d9ffb3",
    };
  }

  swaptoBoard(currUser) {
    let newHTML = $("#gomoku-template").html();
    $("#main").html(newHTML);
  }

  // Tell each client they are playing Gomoku now and their color
  informGameplay(currUser) {
    $(".gameTitle").append(
      "<p><b>" + currUser + ",</b> you are playing Gomoku." + "<p>"
    );
  }

  informUserColor(color) {
    $(".myColor").append(
      "<p> You are now using the <b>" + color + "</b> pieces" + "<p>"
    );
  }

  makeTiles(clickHandler) {
    let i,
      j,
      gameSquares = "";

    // Make a 12x12 board
    for (i = 0; i < 12; i++) {
      for (j = 0; j < 12; j++) {
        gameSquares += '<div class="square" id="sq_' + i + "_" + j + '"></div>';
      }
    }
    $(".board").append(gameSquares);

    // Add click event handler to each tiles
    for (let r = 0; r < 12; r++) {
      this.board.push([]);
      for (let col = 0; col < 12; col++) {
        this.board[r].push("");
        $(`#sq_${r}_${col}`).on("click", clickHandler);
      }
    }

    let parsedInfo = "";
    if (document.cookie) {
      // Grab data from cookie to set color theme
      parsedInfo = JSON.parse(document.cookie);
    } else parsedInfo = game.normalData;
    this.setColorTheme(parsedInfo);
  }

  handleClickTile() {
    let row = game.getRowFromTile(event.target.id);
    let col = game.getColFromTile(event.target.id);

    // Stop player from placing a piece if it is not their turn
    if (!player.getCurrentTurn() || !game) {
      alert(
        "Alert: It's not your turn. Wait for your opponent to finish their turn!"
      );
      return;
    }

    // Prevent player from placing piece on non-empty tile
    if (game.board[row][col] !== "") {
      alert(
        "Alert: a piece has already been placed here. Pick another spot to put a piece!"
      );
      return;
    }

    // Show current placed piece on opponents board and place the piece for current player
    game.playMove(event.target.id, player.getUserColor());
    game.updateTile(player.getUserColor(), row, col, event.target.id);

    // Store placed pieces and switch turn to false
    game.board[row][col] = myColor;
    game.checkWinner(myColor);
    player.setCurrentTurn(false);
  }
  //}

  // When players init game, make a new board and attach click handler
  makeBoard() {
    this.makeTiles(this.handleClickTile);

    // Make buttons to change color themes
    let normalButton =
      '<button id="normalButton" style="margin: 2px" type="button" class="btn btn-light">Normal</button>';
    let darkButton =
      '<button id="darkButton" style="margin: 2px" type="button" class="btn btn-dark">Dark</button>';
    let patrickButton =
      '<button id="patrickButton" style="margin: 2px" type="button" class="btn btn-info">Patrick</button>';
    let allButtons = normalButton + darkButton + patrickButton;
    $("#buttonThemes").html(allButtons);

    // Assign click handler to each button
    $("#normalButton").on("click", function () {
      let oldData = JSON.parse(document.cookie);
      let newData = JSON.stringify({ userId: oldData.userId, theme: "normal" });
      document.cookie = newData;

      // Update color of page and tiles
      game.setColorTheme(JSON.parse(newData));
    });

    $("#darkButton").on("click", function () {
      let oldData = JSON.parse(document.cookie);
      let newData = JSON.stringify({ userId: oldData.userId, theme: "dark" });
      document.cookie = newData;

      // Update color of page and tiles
      game.setColorTheme(JSON.parse(newData));
    });

    $("#patrickButton").on("click", function () {
      let oldData = JSON.parse(document.cookie);
      let newData = JSON.stringify({
        userId: oldData.userId,
        theme: "patrick",
      });
      document.cookie = newData;

      // Update color of page and tiles
      game.setColorTheme(JSON.parse(newData));
    });
  }

  setColorTheme(colorData) {
    let currentTheme = "";

    if (colorData.theme === "normal") currentTheme = game.normalData;
    else if (colorData.theme === "dark") currentTheme = game.darkData;
    else if (colorData.theme === "patrick") currentTheme = game.patrickData;
    else {
      console.log("Error: no theme was inserted from data. Exiting...");
      return;
    }

    if (colorData.theme === "dark") {
      $("p").attr("style", "color: white");
    } else {
      $("p").attr("style", "color: black");
    }

    // Change background color from desired theme
    $("body").attr("style", "background-color:" + currentTheme.backgroundColor);

    // Iterate and change each tile's color
    for (let i = 0; i < 12; i++) {
      for (let j = 0; j < 12; j++) {
        $(`#sq_${i}_${j}`).attr(
          "style",
          "background-color:" + currentTheme.tileColor
        );
      }
    }
  }

  get getRoomId() {
    return this.roomId;
  }

  getRowFromTile(id) {
    let row;
    if (id.split("_")[1] != undefined) {
      row = id.split("_")[1];
    }
    return row;
  }

  getColFromTile(id) {
    let col;
    if (id.split("_")[2] != undefined) {
      col = id.split("_")[2];
    }
    return col;
  }

  // When tile has been clicked, tell other player where opponent placed piece
  playMove(tile, plColor) {
    let clickedTile = tile;

    socket.emit("playMove", {
      tile: clickedTile,
      room: this.getRoomId(),
      color: plColor,
    });
  }

  // Place current user's piece onto board
  updateTile(color, row, col, tile) {
    let newPiece =
      '<div class="piece" style="background:' +
      color +
      '", border-color:"' +
      color +
      '"></div>';
    $(`#${tile}`).append(newPiece);
  }

  getRoomId() {
    return this.roomId;
  }

  checkWinner(placedColor) {
    this.checkVer(placedColor);
    this.checkHor(placedColor);
    this.checkDiag1(placedColor);
    this.checkDiag2(placedColor);

    // If board is full, declare game as a draw
    const drawMessage =
      "<p><b> DRAW: All board pieces have been filled. Game ended with draw! </b></p>";
    if (this.checkDraw()) {
      socket.emit("gameDraw", this.getRoomId(), drawMessage);
    }
  }

  checkDraw() {
    for (let r = 0; r < 12; r++) {
      for (let col = 0; col < 12; col++) {
        if (game.board[r][col] === "") {
          // If "" found, board not full and game can continue
          return false;
        }
      }
    }
    // Otherwise all board tiles have been filled, return true
    return true;
  }

  // If 5 are found vertically, end game
  checkVer(placedColor) {
    let counter = 0;

    for (let column = 0; column < 12; column++) {
      for (let row = 0; row < 12; row++) {
        if (game.board[row][column] === placedColor) {
          counter++;
        } else {
          counter = 0;
        }

        if (counter == 5) {
          socket.emit("endGame", player.getUserId(), this.getRoomId());
          return;
        }
      }
    }
  }

  // If 5 are found horizontally, end game
  checkHor(placedColor) {
    let counter = 0;

    for (let row = 0; row < 12; row++) {
      for (let column = 0; column < 12; column++) {
        if (game.board[row][column] === placedColor) {
          counter++;
        } else {
          counter = 0;
        }

        // If 5 are found horizontally, end game
        if (counter == 5) {
          socket.emit("endGame", player.getUserId(), this.getRoomId());
          return;
        }
      }
    }
  }

  // Used the following for reference: https://stackoverflow.com/questions/32770321/connect-4-check-for-a-win-algorithm
  // If 5 are found top left to bottom right in a diagonal, end game
  checkDiag1(myColor) {
    for (let column = 0; column < 7; column++) {
      for (let row = 0; row < 7; row++) {
        let theMatch = true;
        for (let i = 0; i < 5; i++) {
          if (myColor != game.board[row + i][column + i]) {
            theMatch = false;
          }
        }
        if (theMatch) {
          socket.emit("endGame", player.getUserId(), this.getRoomId());
          return;
        }
      }
    }
  }

  // If 5 are found top right to bottom left in a diagonal, end game
  checkDiag2(myColor) {
    for (let column = 0; column < 12; column++) {
      if (column > 4) {
        for (let row = 0; row < 7; row++) {
          let theMatch = true;
          for (let i = 0; i < 5; i++) {
            if (myColor != game.board[row + i][column - i]) {
              theMatch = false;
            }
          }

          if (theMatch) {
            socket.emit("endGame", player.getUserId(), this.getRoomId());
            return;
          }
        }
      }
    }
  }
}
