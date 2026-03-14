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