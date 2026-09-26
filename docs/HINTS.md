# THE CASCADE: hints

Stuck? Every step has three hints, each stronger than the last. Read one, go back to the temple, and only read the
next if you need it. The same hints live in the temple itself: type `cascade.hint()` in the browser's developer
console (F12), or open the altar (the round button in the bottom-right corner) and choose *ask for a hint*.

The hints never say a Word; you still find each one yourself.

*This file is written from `public/js/lib/hints.js` by `node tools/build-hints.mjs`. Edit the source, not this file.*

## The Ascent

Five Words lead to a door at the top of the Ladder. Solving it writes your name in the Book of the Ascended. With these hints it takes about half an hour to an hour, in one sitting.

### The first Word

<details>
<summary>A nudge</summary>

Most visitors only look at the page. The first Word is for those who read what the page is made of.

</details>

<details>
<summary>A clue</summary>

View the page source (Ctrl+U, or Cmd+Option+U). The comment at the very top says which stylesheet holds the Canon.

</details>

<details>
<summary>Nearly the answer</summary>

Open /css/canon.css. Chapter 0 has seven verses: read the first letter of each, in order. You can say the Word to the Oracle in the developer console (F12): cascade.speak('…').

</details>

### The second Word

<details>
<summary>A nudge</summary>

The second Word is written on the Ladder. The Ladder is on every face, but the eye was never meant to see it.

</details>

<details>
<summary>A clue</summary>

Open the developer tools and find the element #ladder inside the temple (search the Elements panel). It has five rungs; look at each rung's z-index in the Computed tab.

</details>

<details>
<summary>Nearly the answer</summary>

The five z-index values are small numbers. Count them as children count letters: 1 is A, 2 is B, 3 is C.

</details>

### The third Word

<details>
<summary>A nudge</summary>

Every face carries the same line of glyphs, the Inscription. The third Word is described in it.

</details>

<details>
<summary>A clue</summary>

Each face teaches a few letters of the glyph script, and one chapter of the Infinite Scripture teaches all of them: /verse/of/the/alphabet.

</details>

<details>
<summary>Nearly the answer</summary>

Decode the Inscription letter by letter. It names the Word by a riddle about the Five Sheaths, which are the five parts of the CSS box model. Which one is drawn but takes up no space?

</details>

### The fourth Word

<details>
<summary>A nudge</summary>

The fourth Word is not written anywhere. It is heard, though it is not meant for your ears.

</details>

<details>
<summary>A clue</summary>

Wake the sound on any face (a bell, a bowl, a hymn button), then ask the Mothership to transmit: type cascade.listen() in the console, or wait a minute on the Mothership's face.

</details>

<details>
<summary>Nearly the answer</summary>

Type ajna anywhere on the page (not in a text field) to open the Third Eye, a live picture of the sound. Watch it while the Transmission plays: its high notes draw block letters.

</details>

### The door

<details>
<summary>A nudge</summary>

There is a door. The robots were told not to go there.

</details>

<details>
<summary>A clue</summary>

Read /robots.txt. The door is at the top of the Ladder, and it is always open. Bring the four Words and a fifth.

</details>

<details>
<summary>Nearly the answer</summary>

The fifth Word is the planet that rules the current hour; the door's keystone shows its sign (♄ ♃ ♂ ☉ ♀ ☿ ☽). Type the planet's name. Knock at the thirty-third minute of the hour and your name is written in gold.

</details>

### After the Book

<details>
<summary>A nudge</summary>

Your name is in the Book. The temple keeps small secrets on its surface too: try selecting everything on a page, printing it, holding perfectly still, or typing !important.

</details>

<details>
<summary>A clue</summary>

In the console, cascade.inspect() counts the small secrets you have not found yet, and cascade.sky() reads the omens of the hour.

</details>

<details>
<summary>Nearly the answer</summary>

Every face hides a few secrets of its own. Ask the altar for another face and look again.

</details>
