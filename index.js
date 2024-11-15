/**
 * @param {string} word
 * @return {string}
 */
var compressedString = function (word) {
  let comp = "";

  for (let i = 0; i < word.length; i++) {
    let count = 0;
    let curStr = word[i];
    let j = i;

    while (word[j] == curStr && count < 9) {
      count++;
      j++;
    }
    i = j - 1;
    comp += count + curStr;
  }

  return comp;
};

compressedString("abcde")
