class Game {
  constructor() {
    if (!localStorage.getItem("termoon-game")) {
      localStorage.setItem("termoon-game", {})
    }
  }

  setWords(array) {
    this.words = array
  }

  setWordDay() {

    this.getIdxFromDate(this.words.length)
    this.wordDay = this.words[idx];
  }

  getIdxFromDate(arrayLength, date = (new Date())) {
    function hash(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash; // 32-bit
      }
      return Math.abs(hash);
    }

    const now = (date.toISOString().slice(0, 10).replace(/-/g, ''))
    const idx = (hash(now) % arrayLength);

    return now
  }
}