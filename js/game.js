class SimpleStorage extends Map {
  static loadFromStorage(name) {
    try {
      const datastr = localStorage.getItem(name)
      const data = (datastr) ? JSON.parse(datastr) : {}
      return data
    }
    catch (err) {
      console.error(`Error loading ${name}:`, err)
      return {}
    }
  }

  static has(name) {
    return !!(localStorage.getItem(name))
  }

  constructor(storageKey) {
    const dataEntrites = Object.entries(SimpleStorage.loadFromStorage(storageKey))
    super(dataEntrites)

    this.storageKey = storageKey
    if (dataEntrites.length === 0) this.save() // create localStorage
  }

  read() {
    this.clear()

    const data = SimpleStorage.loadFromStorage(this.storageKey)
    Object.entries(data).forEach(([key, value]) => {
      this.set(key, value)
    })
    return data
  }

  save() {
    try {
      this.set("__meta__", { saveAt: Date.now() })

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

  setAndSave(key, value) {
    this.set(key, value)
    return this.save()
  }

  deleteAndSave(key) {
    this.delete(key)
    return this.save()
  }

  clearAndSave() {
    this.clear()
    return this.save()
  }
}

class GameSetup {
  constructor() {
    this.gamedata = new SimpleStorage("termooculto")
  }

  setWords(array) {
    this.words = array
  }

  setWordDay() {
    const at = Number(this.gamedata.get("validAt") || -1)
    if (at < Date.now()) {
      const idx = this.getPositionFromDate(this.words.length)
      this.wordDay = this.words[idx];

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
      this.wordDay = this.gamedata.get("word")
      return this.wordDay
    }
  }

  getPositionFromDate(arrayLength, date = (new Date())) {
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
}