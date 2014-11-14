var fetch = require('./fetch');
var data_handler = require('barchart');
var dom = require('dom')
function handler(val){
    fetch({'detector':val}
         ,function(doc){
              data_handler(doc)
          })
}
exports.formFetch = function(formid, inputid, chart_class){
    data_handler.chart_class(chart_class)
    data_handler.click_handler(function(d){
        dom(inputid).value(d.id)
        return handler(d.id)
    })
    var formelem = dom(formid)
    formelem.on('submit',function( event ){
        event.preventDefault();
        var detector_id = dom( inputid ).val();
        handler(detector_id)
        return null;
    })
    formelem.find('button.details').on('click',function( event ){
        event.preventDefault();
        var detector_id = dom( inputid ).val();
        handler(detector_id)
        var detector_window = window.open('http://lysithia.its.uci.edu/tracker/'+detector_id, 'detectorDetail')


        return null;
    })
    return null
}

exports.clickFetch = function(chart_class){
    data_handler.chart_class(chart_class)
    return handler
}
