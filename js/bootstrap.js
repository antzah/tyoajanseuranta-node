try {
  require('bootstrap')
} catch (e) {
  console.log(e)
}

window.axios = require('axios')
window.FileSaver = require('file-saver')

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'
