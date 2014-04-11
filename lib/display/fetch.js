/*global require module */

var superagent = require('superagent')


module.exports = detector_fetch


function detector_fetch(options,callback){
    if(options.detector === undefined){
        console.log('need to set options properly'+JSON.stringify(options))
        return callback('need options')
    }
    var doc = options.detector + '.json'


    superagent.get('/detector/'+doc)
    .end(function(r){
        return callback(JSON.parse(r.text))
    })
    return null
}
