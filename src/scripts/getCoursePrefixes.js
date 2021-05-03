// This is used to get all possible prefixes for all the courses available at McMaster.
// In the case a new course prefix is added or removed, use this to update the parser regex.
// To use this script, visit https://academiccalendars.romcmaster.ca/content.php?catoid=41&navoid=8647.
// Copy and paste this file into the console.
// Copy the last line.
const prefixes = Array.from(document.getElementById("courseprefix").querySelectorAll("option")).map((option) => option.text);
prefixes.shift();
const text = prefixes.join("|");
console.log(text);
