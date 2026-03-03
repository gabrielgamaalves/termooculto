/**
 * @typedef {Object} StorageMeta
 * @property {number} saveAt - Timestamp when data was saved
 */

/**
 * @template T
 * @typedef {Object.<string, T>} StorageObject
 */

/**
 * @typedef {Object.<string, any>} StorageData
 */

/**
 * SimpleStorage class that extends Map to provide localStorage persistence
 * @extends {Map<string, any>}
 */
class SimpleStorage extends Map {
  /**
   * Load data from localStorage
   * @static
   * @param {string} name - Storage key name
   * @returns {StorageData} Parsed storage data or empty object
   */
  static loadFromStorage(name) {
    try {
      const datastr = localStorage.getItem(name)
      /** @type {StorageData} */
      const data = (datastr) ? JSON.parse(datastr) : {}
      return data
    }
    catch (err) {
      console.error(`Error loading ${name}:`, err)
      return {}
    }
  }

  /**
   * Check if storage key exists in localStorage
   * @static
   * @param {string} name - Storage key name
   * @returns {boolean} True if key exists
   */
  static has(name) {
    return !!(localStorage.getItem(name))
  }

  /**
   * Create a new SimpleStorage instance
   * @param {string} storageKey - Key used for localStorage
   */
  constructor(storageKey) {
    /** @type {StorageData} */
    const dataEntrites = Object.entries(SimpleStorage.loadFromStorage(storageKey))
    super(dataEntrites)

    /** @type {string} */
    this.storageKey = storageKey
    if (dataEntrites.length === 0) this.save() // create localStorage
  }

  /**
   * Read data from localStorage and update the map
   * @returns {StorageData} The loaded data
   */
  read() {
    this.clear()

    /** @type {StorageData} */
    const data = SimpleStorage.loadFromStorage(this.storageKey)
    Object.entries(data).forEach(([key, value]) => {
      this.set(key, value)
    })
    return data
  }

  /**
   * Save current map data to localStorage
   * @returns {boolean} True if save was successful
   */
  save() {
    try {
      /** @type {StorageMeta} */
      const meta = { saveAt: Date.now() }
      this.set("__meta__", meta)

      /** @type {StorageData} */
      const dataObject = Object.fromEntries(this.entries())
      const datastr = JSON.stringify(dataObject)

      localStorage.setItem(this.storageKey, datastr)
      return true
    }
    catch (err) {
      console.error(err)
      return false
    }
  }

  /**
   * Set a value and immediately save to localStorage
   * @param {string} key - The key to set
   * @param {any} value - The value to store
   * @returns {boolean} True if save was successful
   */
  setAndSave(key, value) {
    this.set(key, value)
    return this.save()
  }

  /**
   * Delete a key and immediately save to localStorage
   * @param {string} key - The key to delete
   * @returns {boolean} True if save was successful
   */
  deleteAndSave(key) {
    this.delete(key)
    return this.save()
  }

  /**
   * Clear all data and immediately save to localStorage
   * @returns {boolean} True if save was successful
   */
  clearAndSave() {
    this.clear()
    return this.save()
  }
}

/**
 * GameSetup class for managing word-of-the-day game configuration
 */
class GameWord {
  constructor() {
    /** @type {SimpleStorage} */
    this.gamedata = new SimpleStorage("termooculto")

    /** @type {string[]} */
    this.words = []

    /** @type {string} */
    this.wordDay = ""
  }

  /**
   * Set the words array
   * @param {string[]} array - Array of words to use
   * @returns {void}
   */
  setWords(array) {
    this.words = array
  }

  /**
   * Set or retrieve the word of the day based on expiration
   * @returns {string} The current word of the day
   */
  setWordDay() {
    /** @type {number} */
    const at = Number(this.gamedata.get("validAt") || -1)

    if (at < Date.now()) {
      /** @type {number} */
      const idx = this.getIndexFromDay(this.words.length)
      this.wordDay = this.words[idx];

      /**
       * Calculate the expiration timestamp for the current day
       * @returns {number} Expiration timestamp
       */
      function validAt() {
        const now = Date.now();
        const finalDay = new Date(now);
        finalDay.setHours(23, 59, 59, 999); // 23:59:59.999

        return now + (finalDay - now)
      }

      this.gamedata.set("validAt", validAt())
      this.gamedata.set("word", this.wordDay)
      this.gamedata.save()
    }
    else {
      /** @type {string} */
      this.wordDay = this.gamedata.get("word")
    }

    return this.wordDay
  }

  /**
   * Get a deterministic position in the array based on date
   * @param {number} arrayLength - Length of the words array
   * @param {Date} [date=new Date()] - Date to calculate position from
   * @returns {number} Index position in the array
   */
  getIndexFromDay(arrayLength, date = (new Date())) {
    /**
     * Generate a hash from a string
     * @param {string} str - Input string to hash
     * @returns {number} Hash value
     */
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
    return idx
  }

  normalize(word) {
    const wordNormalize = word
      .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();

    return wordNormalize
  }

  find(string) {
    return this.words.find(word => this.normalize(word) === this.normalize(string))
  }

  includes(string) {
    return !!this.find(string)
  }
}

class GameUI {
  constructor(gameTargets) {
    this.targets = gameTargets
  }

  availableLetters(word, wordDay) {
    const
      /** @type {Array} */
      wordArray = word.split(""),
      /** @type {Array} */
      wordDayArray = wordDay.split("")

    const
      /** @type {Array} */
      availableLetters = [...wordDayArray],
      letters = wordArray.map(function (letter, i) {
        if (wordDayArray[i] === letter) {
          availableLetters[i] = null;
          return [letter, i];
        }

        const availableIndex = availableLetters.findIndex(l => l === letter);
        if (availableIndex !== -1) {
          availableLetters[availableIndex] = null;
          return [letter, availableIndex];
        }

        return [letter, -1];
      })

    for (const [index, [letter, indexFromWordDay]] of letters.entries()) {
      switch (indexFromWordDay) {
        case index:
          this.letterUI(index).right()
          break;
        case -1:
          this.letterUI(index).wrong()
          break;
        default:
          this.letterUI(index).place()
          break;
      }
    }
  }

  missingLetters() {
    const row = this.targets.row
    this.shakeAnime(row)
  }

  noExistsWord() {
    const row = this.targets.row
    this.shakeAnime(row)
  }

  letterUI(indexInput) {
    const inputTarget = this.targets.inputs[indexInput]
    return {
      right: () => inputTarget.classList.add("letter-right"),
      place: () => inputTarget.classList.add("letter-place"),
      wrong: () => inputTarget.classList.add("letter-wrong")
    }
  }

  shakeAnime(target, delay_ms = 0) {
    const DELAY_REMOVE_ANIME = 
      (elapsedTime, delay_ms = 0) => (Number(elapsedTime.toFixed(3)) * 1000) + delay_ms

    target.classList.add("anime-shake")
    target.addEventListener('animationend', (anime) => {
      setTimeout(() => {
        target.classList.remove("anime-shake")
      }, DELAY_REMOVE_ANIME(anime.elapsedTime, delay_ms))
    });
  }
}

class Game {
  COMPLETE_GAME = false
  INDEX_ROW = 1 // default

  MAX_ROWS = 6
  MAX_INPUTS = 4

  constructor(words) {
    this.word = new GameWord()
    this.word.setWords(words)
    this.word.setWordDay()

    this.COMPLETE_GAME = false
    this.INDEX_ROW = 1
    this.MAX_ROWS = 6
    this.INPUTS_LENGTH = 4

    this.targets = {
      row: undefined,
      inputs: undefined
    }

    this.setRow(this.INDEX_ROW) /* Auto Set Row */
    console.log(this.word.wordDay) // DEV

    this.ui = new GameUI(this.targets)
  }

  setRow(offset) {
    if (offset > this.MAX_ROWS) {
      return this.COMPLETE_GAME = true
    }

    if (!!this.targets.row) {
      this.targets.row.querySelector("fieldset").disabled = true
      this.targets.row.classList.remove("row-selected")
    }

    this.INDEX_ROW = offset

    this.targets.row = document.getElementById(`row-${offset}`)
    this.targets.row.classList.add("row-selected")
    this.targets.row.querySelector("fieldset").disabled = false

    this.targets.inputs = [...this.targets.row.querySelectorAll("fieldset > input")]
    this.targets.inputs[0].focus()
    this.targets.inputs.forEach(input => {
      new InputController(input, {
        onEnter: () => this.availableWord()
      })
    })
  }

  availableWord() {
    const
      /** @type {String} */
      word = this.word.normalize(this.targets.inputs.map(input => input.value.trim()).join("")),
      /** @type {String} */
      wordDayNormalize = this.word.normalize(this.word.wordDay)

    if (word.length < 4)
      return this.ui.missingLetters()

    if(!this.word.includes(word))
      return this.ui.noExistsWord()

    this.ui.availableLetters(word, wordDayNormalize)

    if (wordDayNormalize === word)
      return this.victory()
    else if (this.INDEX_ROW <= 6)
      return this.setRow(this.INDEX_ROW + 1)
    else
      return this.gameover()
  }

  victory() {
    setTimeout(() => { alert("VITÓRIA!") })
  }

  gameover() {
    setTimeout(() => { alert("VOCÊ PERDEU!") })
  }
}

class InputController {
  constructor(target, callbacks) {
    this.target = target
    this.callbacks = callbacks

    target.addEventListener("keyup", (event) => this.handleKeyUp(event, this))
  }

  focusNextInput() {
    const nextElementSibling = this.target?.nextElementSibling
    if (nextElementSibling) return nextElementSibling.focus()
  }

  focusPreviousInput(BACKSPACE) {
    if (BACKSPACE) this.target.value = ""

    const previousElementSibling = this.target?.previousElementSibling
    if (previousElementSibling) return previousElementSibling.focus()
  }

  enter() {
    this.callbacks.onEnter()
  }

  handleKeyUp(event, self) {
    event.preventDefault()

    const eventKey = (event.key === " ") ? "SPACE" : event.key.toUpperCase()
    const eventTarget = event.target

    const IGNORE_CONTROL_KEYS = ["SHIFT", "ARROWUP", "ARROWDOWN"]
    if (IGNORE_CONTROL_KEYS.includes(eventKey)) return

    const LETTERS = /^[A-Z]$/
    const CONTROL_KEYS = ["BACKSPACE", "ENTER", "TAB", "SPACE", "ARROWRIGHT", "ARROWLEFT"]
    if (
      !LETTERS.test(eventKey) &&
      !CONTROL_KEYS.includes(eventKey)
    ) {
      eventTarget.value = ""
      eventTarget.classList.add("error-no-accept-key")

      setTimeout(() => {
        eventTarget.classList.remove("error-no-accept-key")
      }, 500)
      return
    }

    switch (eventKey) {
      case "ENTER":
        self.enter()
        break;
      case "BACKSPACE":
        self.focusPreviousInput(true)
        break;
      case "ARROWLEFT":
        self.focusPreviousInput(false)
        break;
      case "ARROWRIGHT":
      case "TAB":
      case "SPACE":
        self.focusNextInput()
        break;
      default:
        eventTarget.value = eventKey
        self.focusNextInput()
        break;
    }

    return
  }

  delete() {
    this.target.removeEventListener("keyup")
    return true
  }
}

// new Game(["opera", "mamae"])