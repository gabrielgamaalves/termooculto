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
class GameSetup {
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
      const idx = this.getPositionFromDate(this.words.length)
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

      return this.wordDay
    }
    else {
      /** @type {string} */
      this.wordDay = this.gamedata.get("word")
      return this.wordDay
    }
  }

  /**
   * Get a deterministic position in the array based on date
   * @param {number} arrayLength - Length of the words array
   * @param {Date} [date=new Date()] - Date to calculate position from
   * @returns {number} Index position in the array
   */
  getPositionFromDate(arrayLength, date = (new Date())) {
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

    /** @type {string} */
    const now = (date.toISOString().slice(0, 10).replace(/-/g, ''))

    /** @type {number} */
    const idx = (hash(now) % arrayLength);
    return idx
  }
}


class Game {
  constructor() {
    this.gameSetup = new GameSetup()
    this.targets = {
      row: undefined,
      inputs: undefined,
    }
  }
}
function nextInput(event) {
  const target = event.target
  const nextElementSibling = target?.nextElementSibling
  if (nextElementSibling) return nextElementSibling.focus()
}

function backInput(event, BACKSPACE) {
  const target = event.target

  if (BACKSPACE) target.value = ""
  
  const previousElementSibling = target.previousElementSibling
  if (previousElementSibling) return previousElementSibling.focus()
}

function keyUpInput(event) {
  event.preventDefault()

  const eventKey = (event.key === " ") ? "SPACE" : event.key.toUpperCase()
  const eventTarget = event.target
  
  console.log(eventKey)

  const acceptedKeys = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), "BACKSPACE", "ENTER", "TAB", "SPACE", "ARROWRIGHT", "ARROWLEFT"]
  if (!(!!acceptedKeys.find(a => a === eventKey))) return false

  switch (eventKey) {
    case "ENTER":
      console.log("ENTER")
      break;

    case "BACKSPACE":
      backInput(event, true)
      break;

    case "ARROWLEFT":
      backInput(event, false)
      break;
    
    case "ARROWRIGHT":
    case "TAB":
    case "SPACE":
      nextInput(event)
      break;

    default:
      eventTarget.value = eventKey
      nextInput(event)
      break;
  }
  // if (eventKey === "BACKSPACE") return retornInput(event)

  // const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
  // if (!(!!letters.find(l => l === eventKey))) {
  //   if (eventTarget.value)
  //   return eventTarget.value = "";
  //   if ()
  // }

  // return nextInput(event.target)
  // // console.log(event)
};

[...document.querySelectorAll(".row-selected fieldset > input")].forEach(function (inpt) {
  inpt.addEventListener("keyup", keyUpInput)
})

// const cs = new GameSetup()
// cs.