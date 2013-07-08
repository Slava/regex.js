// Simple regular expressions matcher written in javascript.
// Slava Kim
// just for fun.

// boring imports:
var _ = require('underscore');

var allAcceptableSymbols = "abcdefghijklmnopqrstuvwxyz" + 
                           "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
                           "0123456789";

// Operators prioritized from weakest to strongest:
//  alteration: | - binary operator
//  concatenation: no special character, concat - binary operator
//  repetition: *, ?, + - unary operators
var operatorPriorities = {
  "|": 0,
  "concat": 1,
  "*": 2,
  "?": 2,
  "+": 2,
  "(": -1   // special case
};

// Convert individual character to an automata fragment.
// char - String
var charToFragment = function (char) {
  var fragment = new Fragment(new State, new State);
  fragment.inState.addTransitions(char === "." ? allAcceptableSymbols : char, 
                                  fragment.outState);
  return fragment;
};

// regexString - String
// example: ((a|bc)+.*xy(zz+|b?))+
var regexToNFA = function (regexString) {
  // We will convert `regexString` to postfix notation and convert it to NFA
  // fragments on the fly.

  // We keep to stacks: for ready fragments and for operations.
  // The key is to make sure operations in operations stack are ordered from
  // strongest to weakest if we move from top of the stack. There are few
  // exceptions such as parentheses.
  // Whenever we want to push weaker than the top operator to stack, we pop
  // operators and perform them on fragments until we can push new operator.
  // Obviously, we want to pop all operations by the end of transformation,
  // leaving fragments stack with single fragment - whole NFA.
  
  var operationsStack = [];
  var fragmentsStack = [];

  var performOperatorOnTop = function () {
    if (!operationsStack.length)
      throw new Error("The operations stack is empty! Nothing to perform!");

    var operator = operationsStack.pop();
    
    var fragmentA, fragmentB, newFragment;
    switch (operator) {
      case "|":
        fragmentB = fragmentsStack.pop();
        fragmentA = fragmentsStack.pop();

        // To alternate two fragments, wrap them into bigger fragment, whose
        // entrance state has epsilon moves to entrance states of two fragments
        // and exit state is epsilon reachable from their exit states.

        newFragment = new Fragment(new State, new State);

        newFragment.inState.addTransitions("", [fragmentA.inState, fragmentB.inState]);

        fragmentA.outState.addTransitions("", newFragment.outState);
        fragmentB.outState.addTransitions("", newFragment.outState);

        fragmentsStack.push(newFragment);
        break;

      case "concat":
        fragmentB = fragmentsStack.pop();
        fragmentA = fragmentsStack.pop();

        // To concatenate two fragments just connect exit state of the first
        // fragment with entrance state of the second one.
        fragmentA.outState.addTransitions("", fragmentB.inState);
        fragmentA.outState = fragmentB.outState;

        fragmentsStack.push(fragmentA);
        break;

      case "*":
        newFragment = fragmentsStack.pop();

        // To simulate optional repetitions we put entrance and exit states of
        // fragment into one closure.
        newFragment.inState.addTransitions("", newFragment.outState);
        newFragment.outState.addTransitions("", newFragment.inState);

        fragmentsStack.push(newFragment);
        break;

      case "+":
        newFragment = fragmentsStack.pop();

        // We allow repetitions of this fragment. Which effectively means the
        // entrance state is reachable from exit state by epsilon transitions.
        newFragment.outState.addTransitions("", newFragment.inState);

        fragmentsStack.push(newFragment);
        break;

      case "?":
        newFragment = fragmentsStack.pop();

        // We allow skipping of this fragment.
        newFragment.inState.addTransitions("", newFragment.outState);

        fragmentsStack.push(newFragment);
        break;
    }
  };

  var performAllStrongerOperations = function (newOperator) {
    var comparablePriority = newOperator ? operatorPriorities[newOperator] : -1;
    while (operationsStack.length > 0 && 
           operatorPriorities[_.last(operationsStack)] > comparablePriority)
      performOperatorOnTop();
  };

  // If previous symbol was non-operator, it means 'concatenation' operator is
  // used. Keep track of it in this variable.
  var isConcatinating = false;

  _.each(regexString, function (char) {
    var fragment = null;
    var operator = null;

    // If char is not an operator, convert it to fragment.
    if (_.contains(allAcceptableSymbols, char)) {
      fragment = charToFragment(char);
      // If we are concatenating now, resolve all stronger operators on the top
      // of the operators stack and push concatenation operator and fragment to
      // operators and fragments stack correspondingly.
      if (isConcatinating)
        operator = "concat";

      // If next character will be non-operator, it would be concatenation.
      isConcatinating = true;
    } else if (_.contains("|*?+()", char)) {
      operator = char;

      // Next operator won't be concatenation in any case.
      isConcatinating = false;
    } else {
      throw new Error("Unexpected symbol '" + char + "'");
    }

    if (operator && operator !== ")") {
      performAllStrongerOperations(operator);
      operationsStack.push(operator);
    }

    // A special case for closing parenthesis, perform everything in its block
    if (operator && operator === ")") {
      while (_.last(operationsStack) !== "(")
        performOperatorOnTop();
      operationsStack.pop();
    }

    if (fragment)
      fragmentsStack.push(fragment);
  });

  // In the end perform all operations
  performAllStrongerOperations();

  if (operationsStack.length !== 0 || fragmentsStack.length !== 1)
    throw new Error("By the end of convertion to NFA something went wrong.");

  fragmentsStack[0].outState.isFinal = true;
  return fragmentsStack[0].inState;
};

// Returns all epsilon-reachable states from starting set of states.
// Result includes passed states as well.
// startingSet - Array
var epsilonReachableStates = function (startingSet) {
  var reachableStates = [];

  // Internal implementation is just a dfs
  var visited = {};
  var dfs = function (state) {
    if (visited[state.id])
      return;
    visited[state.id] = true;
    reachableStates.push(state);
    _.each(state.getTransitions(""), dfs);
  };

  _.each(startingSet, dfs);
  return reachableStates;
};

// Determines whether given NFA accepts given string
var isNFAMatchingString = function (NFA, input) {
  // Since NFA is a state reference, it will be initial state
  var currentStatesSet = [ NFA ];
  // Keep the rule: on every iteration `currentStatesSet` contains all states
  // reachable with epsilon moves.
  currentStatesSet = epsilonReachableStates(currentStatesSet);

  _.each(input, function (char) {
    var newStatesSet = [];
    var newStatesIds = {};

    var addToNewStates = function (state) {
      if (!newStatesIds[state.id]) {
        newStatesIds[state.id] = true;
        newStatesSet.push(state);
      }
    };

    _.each(currentStatesSet, function (state) {
      _.each(state.getTransitions(char), addToNewStates);
    });

    currentStatesSet = epsilonReachableStates(newStatesSet);
  });

  return _.any(currentStatesSet, function (state) { return state.isFinal; });
};


// Exports //
// Make this module act like a class
module.exports = function (regexString) {
  this.NFA = regexToNFA(regexString);
};

_.extend(module.exports.prototype, {
  match: function (input) {
    return isNFAMatchingString(this.NFA, input);
  }
});

// Data model  //
// Helper function
// Generates 8 groups of 4 lower case letters separated with dashes
function _random_id () {
  var id = "";
  for (var i = 0; i < 8; i++) {
    if (i) id += "-";
    for (var j = 0; j < 4; j++)
      id += String.fromCharCode(97 + Math.random() * 26); // lower case letter
  }

  return id;
}

// Represents a single state. Each acceptable character maps to an array of
// corresponding states. They are stored in `transitions` object. `isFinal` is a
// boolean mark indicating whereas state is an accepting state.
// Empty string stands for epsilon transitions.
function State (isFinal) {
  this.transitions = {};
  this.isFinal = !!isFinal; // default: false
  this.id = _random_id();   // just to make it easier to track different states
}

_.extend(State.prototype, {
  // Don't expect it to be fully writable.
  getTransitions: function (char) {
    return this.transitions[char] || [];
  },

  addTransitions: function (char, transitions) {
    this.transitions[char] = this.getTransitions(char).concat(transitions);
  }
});

// Represents a fragment of NFA with two states available for bounding with
// other fragments constructing bigger fragment.
function Fragment (inState, outState) {
  this.inState = inState;
  this.outState = outState;
}


