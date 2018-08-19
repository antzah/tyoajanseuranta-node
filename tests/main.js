/**
 * This is the main test runner file that combines all of our tests.
 */

const createTestCafe = require('testcafe')
let testcafe = null

createTestCafe('localhost', 1337, 1338)
  .then(tc => {
    testcafe = tc
    const runner = testcafe.createRunner()

    return runner
      .src([
        'tests/registration.js',
        'tests/paint-04-to-20-and-check-reports.js'
      ])
      .browsers(['firefox:headless'])
      .run()
  })
  .then(failedCount => {
    console.log('Tests failed: ' + failedCount)
    testcafe.close()
  })
