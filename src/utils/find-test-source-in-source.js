const assert = require('assert')

const isAt = (haystack, needle, index) => {
  for (l of needle) {
    if (haystack[index++] !== l) return false
  }
  return true
}

const trimLine = l => l.trim().replace(/;$/, '')

/**
 * Find the given test source snippet in the complete source file
 * and return the line number
 *
 * @param {*} completeSource
 * @param {*} testSource
 */
module.exports = (completeSource, testSource) => {
  assert(completeSource, 'The complete test file source code is required')
  assert(testSource, 'The test source code is required')

  const completeSourceLinesTrimmed =
    completeSource
      .split('\n')
      .map(trimLine)

  const testSourceLinesTrimmed = testSource.split('\n').map(trimLine)

  for (let i = 0; i < (completeSourceLinesTrimmed.length - testSourceLinesTrimmed.length) + 1; i++) {
    if (isAt(completeSourceLinesTrimmed, testSourceLinesTrimmed, i)) {
      return i + 1 // want to return the line number
    }
  }
  return -1
}
