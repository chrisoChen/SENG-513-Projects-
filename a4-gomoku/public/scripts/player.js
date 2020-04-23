class Player {
  constructor(userId, color, currentTurn) {
    this.userId = userId;
    this.color = color;
    this.currentTurn = currentTurn;
  }

  getUserId() {
    return this.userId;
  }

  getUserColor() {
    return this.color;
  }

  getCurrentTurn() {
    return this.currentTurn;
  }

  setCurrentTurn(theTurn) {
    this.currentTurn = theTurn;
    this.informTurn(theTurn);
  }

  // Tell user if it's their turn or not
  informTurn(theTurn) {
    let turnMessage = theTurn
      ? `${this.userId}, it is now your turn. Place a Piece!`
      : "Waiting for your Opponent to place a piece.";

    if (JSON.parse(document.cookie).theme == "dark")
      turnMessage = '<p style="color: white">' + turnMessage + "</p>";
    else turnMessage = "<p>" + turnMessage + "</p>";
    $(".currentTurn").html(turnMessage);
  }
}
