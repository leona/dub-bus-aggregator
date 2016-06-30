var request = require('request')

var App = function(callback) {
    this.endpoint = 'https://data.dublinked.ie/cgi-bin/rtpi/';
    this.stops = [];

    this.buildIndex(function(data) {
        this.stops = data;
        
        callback(data);
    }.bind(this));

    return this;
}

App.prototype = {
    buildIndex(callback) {
        this.getRoutes(function(data) {
            this.getRoutesStops(data, (_data) => {
                callback(_data);
            });
        }.bind(this));
    },
    getRoutes(callback) {
        this.request('routelistinformation', (data) => {
            console.log('Fetched all routes');
            
            callback(data.results);
        })
    },
    getRoutesStops(data, callback) {
        var next = (function(_data) {
            if (typeof this.iter == 'undefined') {
                this.iter = 0;
                this.stops = [];
            }

            this.iter++;
            
            console.log(`Iteration: ${this.iter}/${data.length}`);
            
            if (_data.length > 0)
                Array.prototype.push.apply(this.stops, _data);

            console.log(`Found: ${this.stops.length} stops`);
            
            if (this.iter == data.length) {
                console.log('Fetched all stops');
                
                callback(this.stops.filter((thing, index, self) => self.findIndex((t) => {return t.stopid === thing.stopid }) === index));
            }
        })
        
        syncForEach(data, function(item, forward) {
            if (item.route.indexOf('|') > -1) {
                var split = item.route.split('|');
                
                if (split[0] !== 'bac') {
                    next([]);
                    return forward();
                }
                
                item.route = split[1];
            }
            if (item.operator !== 'bac') {
                next([]);
                return forward();
            }
            //console.log(`Fetching route: ${item.route} from: ${item.operator}`);
            
            this.request(`routeinformation?format=json&routeid=${item.route}&operator=${item.operator}`, (data) => {
                if (typeof data.results == 'undefined' || typeof data.results[0] == 'undefined') {
                    console.log(`Error fetching route: ${item.route} from ${item.operator}`);
                    
                    next([]);
                    forward();
                    
                    return;
                }
                next(data.results[0].stops);
                forward();
            })
        }.bind(this));
    },
    getStopTimes(stop_id, callback) {
        this.request(`realtimebusinformation?stopid=${stop_id}&format=json`, (data) => {
            callback(data);
        });
    },
    getNearestStops(coords, callback) {

    },
    request(req, callback) {
        var append = 'format=json'

        if (req.match(/^[a-z0-9]+$/i)) {
            append = '?' + append;
        } else {
            append = '&' + append
        }

        request(this.endpoint + req + append, (err, res, body) => {
            if (!err && res.statusCode == 200) {
                try {
                    body = JSON.parse(body);
                }
                catch (e) {
                    body = null
                    console.log(err);
                }

                return callback(body)
            }

            throw err
        })
    }
}

function syncForEach(arr, callback) {
    var iter = 0;

    callback(arr[iter], next);
    
    function next() {
        iter++;

        if (typeof arr[iter] !== 'undefined')
            callback(arr[iter], next);
    }
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    //source http://stackoverflow.com/questions/18883601/function-to-calculate-distance-between-two-coordinates-shows-wrong
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1); // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

module.exports = App;