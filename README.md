regex.js
========

tl;dr
-----

Extremely simple Regular Expressions matcher. Written for learning purposes
only. Don't rely on this implementations in any context.

What actually happened
----------------------

I watched the introduction to Automaton theory course on Coursera and got
curious.  After reading [this article](http://swtch.com/~rsc/regexp/) I decided
to implement a regex matcher on my own. Because it is fun to implement such
things, don't you think so?

I took a slightly different approach of converting regex to NFA compared to the
one in the article. Hoped I would finish it in one sit but stopped in the middle
as usually.

Scope
-----

This matcher should support basic operators:

- "|" - pipe, alternation
- "." - matches any character
- "*" - zero or more repetitions
- "+" - one or more repetitions
- "?" - zero or one occurrence
- "(", ")" - set priorities of operators

Testing
-------

There is a script that runs moca tests. After simple tests pass one should add
a giant test suite from the Internets.

