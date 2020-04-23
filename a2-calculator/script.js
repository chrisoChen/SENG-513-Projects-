let numStorage = [];

let lastCalc;
var hasCalculated = false;

$(document).ready(function() {
  $('[data-toggle="tooltip"]').tooltip();
});

// Take potential characters to compute into a array: pressing operators will calculate results 
function append(x) {
  console.log(hasCalculated);
  if (hasCalculated === true) {
    numStorage = [];
    display();
    hasCalculated = false;
  }
  console.log(numStorage);
  // overide err, 0, -, and Infinity when inserting numbers
  if (
    numStorage[0] === "err" ||
    (numStorage[0] === "0" &&
      (!isNaN(parseInt(x)) || x === "-" || x === undefined) &&
      x !== "0") ||
    numStorage[0] === Number.POSITIVE_INFINITY
  ) {
    numStorage = [];
  }
  // console.log(hasCalculated);

  numStorage = [...numStorage, x];
  display();
}

function display() {
  let result = "<h1>";
  for (let i = 0; i < numStorage.length; i++) {
    result += numStorage[i];
    +"</hr>";
  }
  document.getElementById("display").innerHTML = result;
  // console.log(hasCalculated);
}

// main use is eval, needs to error check still
function calculate() {
  let results;
  try {
    results = eval(numStorage.reduce(combine));
  } catch (err) {
    numStorage = [];
    append("err");
    return;
  }
  numStorage = [];
  if (isNaN(results) || typeof results === "undefined") {
    append("err");
  } else {
    append(results);
    hasCalculated = true;
    lastCalc = results;
    document.getElementById("ans-display").innerHTML = `🕗: ${results}`;
    // console.log(lastCalc);
  }
}

function reset() {
  numStorage = [];
  // displaying 0 to ensure proper formatting of real calculator
  append("0"); 
}

// Used with calculate(), didn't just + because wanted to use ... operator earlier
function combine(total, num) {
  return total + num;
}

function backspace() {
  numStorage.pop();
  if (numStorage === undefined || numStorage.length == 0) append("0");
  else display();
}
