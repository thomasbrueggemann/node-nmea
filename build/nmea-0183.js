(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = window.nmea = require('./lib/NMEA.js');


},{"./lib/NMEA.js":3}],2:[function(require,module,exports){
var m_hex = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];

exports.toHexString = function(v) {
    var lsn;
    var msn;

    msn = (v >> 4) & 0x0f;
    lsn = (v >> 0) & 0x0f;
    return m_hex[msn] + m_hex[lsn];
};

exports.padLeft = function(s, len, ch) {
    while(s.length < len) {
        s = ch + s;
    }
    return s;
};

// verify the checksum
exports.verifyChecksum = function(sentence, checksum) {
    var q;
    var c1;
    var c2;
    var i;

    // skip the $
    i = 1;

    // init to first character
    c1 = sentence.charCodeAt(i);

    // process rest of characters, zero delimited
    for( i = 2; i < sentence.length; ++i) {
        c1 = c1 ^ sentence.charCodeAt(i);
    }

    // checksum is a 2 digit hex value
    c2 = parseInt(checksum, 16);

    // should be equal
    return ((c1 & 0xff) === c2);
};

// generate a checksum for  a sentence (no trailing *xx)
exports.computeChecksum = function(sentence) {
    var c1;
    var i;

    // skip the $
    i = 1;

    // init to first character    var count;

    c1 = sentence.charCodeAt(i);

    // process rest of characters, zero delimited
    for( i = 2; i < sentence.length; ++i) {
        c1 = c1 ^ sentence.charCodeAt(i);
    }

    return '*' + exports.toHexString(c1);
};

// =========================================
// field encoders
// =========================================

// encode latitude
// input: latitude in decimal degrees
// output: latitude in nmea format
// ddmm.mmm
exports.encodeLatitude = function(lat) {
    var d;
    var m;
    var f;
    var h;
    var s;
    var t;
    if(lat === undefined) {
        return '';
    }

    if(lat < 0) {
        h = 'S';
        lat = -lat;
    } else {
        h = 'N';
    }
    // get integer degrees
    d = Math.floor(lat);
    // degrees are always 2 digits
    s = d.toString();
    if(s.length < 2) {
        s = '0' + s;
    }
    // get fractional degrees
    f = lat - d;
    // convert to fractional minutes
    m = (f * 60.0);
    // format the fixed point fractional minutes
    t = m.toFixed(3);
    if(m < 10) {
        // add leading 0
        t = '0' + t;
    }

    s = s + t + ',' + h;
    return s;
};

// encode longitude
// input: longitude in decimal degrees
// output: longitude in nmea format
// dddmm.mmm
exports.encodeLongitude = function(lon) {
    var d;
    var m;
    var f;
    var h;
    var s;
    var t;

    if(lon === undefined) {
        return '';
    }

    if(lon < 0) {
        h = 'W';
        lon = -lon;
    } else {
        h = 'E';
    }

    // get integer degrees
    d = Math.floor(lon);
    // degrees are always 3 digits
    s = d.toString();
    while(s.length < 3) {
        s = '0' + s;
    }

    // get fractional degrees
    f = lon - d;
    // convert to fractional minutes and round up to the specified precision
    m = (f * 60.0);
    // minutes are always 6 characters = mm.mmm
    t = m.toFixed(3);
    if(m < 10) {
        // add leading 0
        t = '0' + t;
    }
    s = s + t + ',' + h;
    return s;
};

// 1 decimal, always meters
exports.encodeAltitude = function(alt) {
    if(alt === undefined) {
        return ',';
    }
    return alt.toFixed(1) + ',M';
};

// magnetic variation
exports.encodeMagVar = function(v) {
    var a;
    var s;
    if(v === undefined) {
        return ',';
    }
    a = Math.abs(v);
    s = (v < 0) ? (a.toFixed(1) + ',E') : (a.toFixed(1) + ',W');
    return exports.padLeft(s, 7, '0');
};

// degrees
exports.encodeDegrees = function(d) {
    if(d === undefined) {
        return '';
    }
    return exports.padLeft(d.toFixed(1), 5, '0');
};

exports.encodeDate = function(d) {
    var yr;
    var mn;
    var dy;

    if(d === undefined) {
        return '';
    }
    yr = d.getUTCFullYear();
    mn = d.getUTCMonth() + 1;
    dy = d.getUTCDate();
    return exports.padLeft(dy.toString(), 2, '0') + exports.padLeft(mn.toString(), 2, '0') + yr.toString().substr(2);
};

exports.encodeTime = function(d) {
    var h;
    var m;
    var s;

    if(d === undefined) {
        return '';
    }
    h = d.getUTCHours();
    m = d.getUTCMinutes();
    s = d.getUTCSeconds();
    return exports.padLeft(h.toString(), 2, '0') + exports.padLeft(m.toString(), 2, '0') + exports.padLeft(s.toString(), 2, '0');
};

exports.encodeKnots = function(k) {
    if(k === undefined) {
        return '';
    }
    return exports.padLeft(k.toFixed(1), 5, '0');
};

exports.encodeValue = function(v) {
    if(v === undefined) {
        return '';
    }
    return v.toString();
};

exports.encodeFixed = function(v, f) {
    if(v === undefined) {
        return '';
    }
    return v.toFixed(f);
};

// =========================================
// field parsers
// =========================================

// separate number and units
exports.parseAltitude = function(alt, units) {
    var scale = 1.0;
    if(units === 'F') {
        scale = 0.3048;
    }
    return parseFloat(alt) * scale;
};

// separate degrees value and quadrant (E/W)
exports.parseDegrees = function(deg, quadrant) {
    var q = (quadrant === 'E') ? -1.0 : 1.0;

    return parseFloat(deg) * q;
};

// fields can be empty so have to wrap the global parseFloat
exports.parseFloatX = function(f) {
    if(f === '') {
        return 0.0;
    }
    return parseFloat(f);
};

// decode latitude
// input : latitude in nmea format
//      first two digits are degress
//      rest of digits are decimal minutes
// output : latitude in decimal degrees
exports.parseLatitude = function(lat, hemi) {
    var h = (hemi === 'N') ? 1.0 : -1.0;
    var a;
    var dg;
    var mn;
    var l;
    a = lat.split('.');
    if(a[0].length === 4) {
        // two digits of degrees
        dg = lat.substring(0, 2);
        mn = lat.substring(2);
    } else if(a[0].length === 3) {
        // 1 digit of degrees (in case no leading zero)
        dg = lat.substring(0, 1);
        mn = lat.substring(1);
    } else {
        // no degrees, just minutes (nonstandard but a buggy unit might do this)
        dg = '0';
        mn = lat;
    }
    // latitude is usually precise to 5-8 digits
    return ((parseFloat(dg) + (parseFloat(mn) / 60.0)) * h).toFixed(8);
};

// decode longitude
// first three digits are degress
// rest of digits are decimal minutes
exports.parseLongitude = function(lon, hemi) {
    var h;
    var a;
    var dg;
    var mn;
    h = (hemi === 'E') ? 1.0 : -1.0;
    a = lon.split('.');
    if(a[0].length === 5) {
        // three digits of degrees
        dg = lon.substring(0, 3);
        mn = lon.substring(3);
    } else if(a[0].length === 4) {
        // 2 digits of degrees (in case no leading zero)
        dg = lon.substring(0, 2);
        mn = lon.substring(2);
    } else if(a[0].length === 3) {
        // 1 digit of degrees (in case no leading zero)
        dg = lon.substring(0, 1);
        mn = lon.substring(1);
    } else {
        // no degrees, just minutes (nonstandard but a buggy unit might do this)
        dg = '0';
        mn = lon;
    }
    // longitude is usually precise to 5-8 digits
    return ((parseFloat(dg) + (parseFloat(mn) / 60.0)) * h).toFixed(8);
};

// fields can be empty so have to wrap the global parseInt
exports.parseIntX = function(i) {
    if(i === '') {
        return 0;
    }
    return parseInt(i, 10);
};

exports.parseDateTime = function(date, time) {
    var h = parseInt(time.slice(0, 2), 10);
    var m = parseInt(time.slice(2, 4), 10);
    var s = parseInt(time.slice(4, 6), 10);
    var D = parseInt(date.slice(0, 2), 10);
    var M = parseInt(date.slice(2, 4), 10);
    var Y = parseInt(date.slice(4, 6), 10);
    // hack : GPRMC date doesn't specify century. GPS came out in 1973
    // so if year is less than 73 its 2000, otherwise 1900
    if (Y < 73) {
        Y = Y + 2000;
    }
    else {
        Y = Y + 1900;
    }

    return new Date(Date.UTC(Y, M, D, h, m, s));
};
},{}],3:[function(require,module,exports){
/** NMEA-0183 Parser-Encoder */

var RMC = require("./codes/RMC.js");
var GLL = require("./codes/GLL.js");
var GGA = require("./codes/GGA.js");
var GSV = require("./codes/GSV.js");
var GSA = require("./codes/GSA.js");
var VTG = require("./codes/VTG.js");
var MWV = require("./codes/MWV.js");
var DBT = require("./codes/DBT.js");
var HDG = require("./codes/HDG.js");
var VHW = require("./codes/VHW.js");
var Helper = require("./Helper.js");

/** NMEA module */
var NMEA = ( function() {

    "use strict";

    /** NMEA public API */
    var nmea = {
    };

    /** private module variables */
    var m_parserList = [];
    var m_encoderList = [];
    var m_errorHandler = null;

    // =============================================
    // public API functions
    // =============================================

    // function to add parsers
    nmea.addParser = function(sentenceParser) {
        if(sentenceParser === null) {
            this.error('invalid sentence parser : null');
            return;
        }
        m_parserList.push(sentenceParser);
    };

    /** function to add encoders */
    nmea.addEncoder = function(sentenceEncoder) {
        if(sentenceEncoder === null) {
            this.error('invalid  sentence encoder : null');
            return;
        }
        m_encoderList.push(sentenceEncoder);
    };

    /** master parser function
     * handle string tokenizing, find the associated parser and call it if there is one
     */
    nmea.parse = function(sentence) {
        var i;
        var tokens;
        var id;
        var result;
        var checksum;
        var status;
        if(( typeof sentence) !== 'string') {
            this.error('sentence is not a string');
            return null;
        }

        // find the checksum and remove it prior to tokenizing
        checksum = sentence.split('*');
        if(checksum.length === 2) {
            // there is a checksum
            sentence = checksum[0];
            checksum = checksum[1];
        } else {
            checksum = null;
        }

        tokens = sentence.split(',');
        if(tokens.length < 1) {
            this.error('must at least have a header');
            return null;
        }

        // design decision: the 5 character header field determines the sentence type
        // this field could be handled in two different ways
        // 1. split it into the 2 character 'talker id' + 3 character 'sentence id' e.g. $GPGGA : talker=GP id=GGA
        //    this would leave more room for customization of proprietary talkers that give standard sentences,
        //    but it would be more complex to deal with
        // 2. handle it as a single 5 character id string
        //    much simpler.  for a proprietary talker + standard string, just instantiate the parser twice
        // This version implements approach #2
        id = tokens[0].substring(1);
        if(id.length !== 5) {
            this.error('i must be exactly 5 characters');
            return null;
        }

        // checksum format = *HH where HH are hex digits that convert to a 1 byte value
        if(checksum !== null) {
            // there is a checksum, replace the last token and verify the checksum
            status = Helper.verifyChecksum(sentence, checksum);
            if(status === false) {
                this.error('checksum mismatch');
                return null;
            }
        }

        // try all id's until one matches
        result = null;
        for( i = 0; i < m_parserList.length; ++i) {
            if(id === m_parserList[i].id) {
                try {
                    result = m_parserList[i].parse(tokens);
                } catch(err) {
                    nmea.error(err.message);
                }
                break;
            }
        }
        if(result === null) {
            this.error('sentence id not found');
        }
        return result;
    };

    /** master encoder
     * find the specified id encoder and give it the data to encode. return the result;
     */
    nmea.encode = function(id, data) {
        var i;
        var result;
        var cks;
        result = null;
        for( i = 0; i < m_encoderList.length; ++i) {
            if(id === m_encoderList[i].id) {
                try {
                    result = m_encoderList[i].encode(id, data);
                } catch(err) {
                    nmea.error(err.message);
                }
            }
        }
        if(result === null) {
            this.error('sentence id not found');
            return null;
        }

        // add the checksum
        cks = Helper.computeChecksum(result);
        result = result + cks;

        return result;
    };

    /** public function to print/handle errors */
    nmea.error = function(msg) {
        if(m_errorHandler !== null) {
            // call the existing handler
            m_errorHandler(msg);
        }
    };

    /** public function to  set error handler */
    nmea.setErrorHandler = function(e) {
        m_errorHandler = e;
    };

    // =======================================================
    // initialize the handlers
    // =======================================================

    // add the standard error handler
    nmea.setErrorHandler(function(e) {
        throw new Error('ERROR:' + e);
    });

    // add the standard decoders
    nmea.addParser(new GGA.Decoder("GPGGA"));
    nmea.addParser(new RMC.Decoder("GPRMC"));
    nmea.addParser(new GSV.Decoder("GPGSV"));
    nmea.addParser(new GSA.Decoder("GPGSA"));
    nmea.addParser(new VTG.Decoder("GPVTG"));
    nmea.addParser(new MWV.Decoder("IIMWV"));
    nmea.addParser(new MWV.Decoder("WIMWV"));
    nmea.addParser(new DBT.Decoder("IIDBT"));
    nmea.addParser(new DBT.Decoder("SDDBT"));
    nmea.addParser(new GLL.Decoder("GPGLL"));
    nmea.addParser(new HDG.Decoder("HCHDG"));
    nmea.addParser(new VHW.Decoder("VWVHW"));
    // add the standard encoders
    nmea.addEncoder(new GGA.Encoder("GPGGA"));
    nmea.addEncoder(new RMC.Encoder("GPRMC"));

    // return the module object
    return nmea;
}());

module.exports = NMEA;

},{"./Helper.js":2,"./codes/DBT.js":4,"./codes/GGA.js":5,"./codes/GLL.js":6,"./codes/GSA.js":7,"./codes/GSV.js":8,"./codes/HDG.js":9,"./codes/MWV.js":10,"./codes/RMC.js":11,"./codes/VHW.js":12,"./codes/VTG.js":13}],4:[function(require,module,exports){
var Helper = require("../Helper.js");

/*
 === DBT - Depth below transducer ===

 ------------------------------------------------------------------------------
 *******1   2 3   4 5   6 7
 *******|   | |   | |   | |
 $--DBT,x.x,f,x.x,M,x.x,F*hh<CR><LF>
 ------------------------------------------------------------------------------

 Field Number:

 1. Depth, feet
 2. f = feet
 3. Depth, meters
 4. M = meters
 5. Depth, Fathoms
 6. F = Fathoms
 7. Checksum
 */

exports.Decoder = function (id) {
    this.id = id;
    this.talker_type_id = "DBT";
    this.talker_type_desc = "Depth Below Transducer";
    this._format = function(char){
          switch(char){
            case "F" : return "fathoms"
            case "M" : return "meters"
            case "f" : return "feet"
        }
    };

    this.parse = function (tokens) {
        if (tokens.length < 6) {
            throw new Error('DBT : not enough tokens');
        }

        var model = {
            id: tokens[0].substr(1),
            talker_type_id: this.talker_type_id,
            talker_type_desc: this.talker_type_desc,
        };

        model[this._format(tokens[2])] = Helper.parseFloatX(tokens[1]);
        model[this._format(tokens[4])] = Helper.parseFloatX(tokens[3]);
        model[this._format(tokens[6])] = Helper.parseFloatX(tokens[5]);

        return model;
    };
};
},{"../Helper.js":2}],5:[function(require,module,exports){
var Helper = require("../Helper.js");

/** nmea encoder object
 * $--GGA,hhmmss,llll.ll,a,yyyyy.yy,a,x,xx,x.x,x.x,M,x.x,M,x.x,xxxx*hh

 GGA  = Global Positioning System Fix Data

 1    = UTC of Position
 2    = Latitude
 3    = N or S
 4    = Longitude
 5    = E or W
 6    = GPS quality indicator (0=invalid; 1=GPS fix; 2=Diff. GPS fix)
 7    = Number of satellites in use [not those in view]
 8    = Horizontal dilution of position
 9    = Antenna altitude above/below mean sea level (geoid)
 10   = Meters  (Antenna height unit)
 11   = Geoidal separation (Diff. between WGS-84 earth ellipsoid and
 mean sea level.  -=geoid is below WGS-84 ellipsoid)
 12   = Meters  (Units of geoidal separation)
 13   = Age in seconds since last update from diff. reference station
 14   = Diff. reference station ID#
 15   = Checksum

 * input data:
 * {
     date         : DateTime object, UTC (year,month,day ignored)
     latitude     : decimal degrees (north is +)
     longitude    : decimal degreees (east is +)
     fix          : integer 0,1,2
     satellites   : integer 0..32
     hdop         : float
     altitude     : decimal altitude in meters
     aboveGeoid   : decimal altitude in meters
     dgpsUpdate   : time in seconds since last dgps update
     dgpsReference: differential reference station id
     * }
 * any undefined values will be left blank ',,' which is allowed in the nmea specification
 */
exports.Encoder = function(id) {
    this.id = id;
    this.encode = function(id, data) {
        var a = [];
        var gga;

        a.push('$' + id);
        a.push(Helper.encodeTime(data.date));
        a.push(Helper.encodeLatitude(data.lat, 3));
        a.push(Helper.encodeLongitude(data.lon, 3));
        a.push(Helper.encodeValue(data.fix));
        a.push(Helper.encodeValue(Helper.padLeft(data.satellites.toString(), 2, '0')));
        a.push(Helper.encodeFixed(data.hdop, 1));
        a.push(Helper.encodeAltitude(data.altitude));
        a.push(Helper.encodeAltitude(data.aboveGeoid));
        a.push(Helper.encodeFixed(data.dgpsUpdate, 0));
        a.push(Helper.encodeValue(data.dgpsReference));

        gga = a.join();

        return gga;
    };
};
//TODO: format codes 
exports.Decoder = function(id) {
    this.id = id;
    this.talker_type_id = "GGA";
    this.talker_type_desc = "Global Positioning System Fix Data"; 
    this.parse = function(tokens) {
        var i;
        var gga;
        if(tokens.length < 14) {
            throw new Error('GGA - not enough tokens (13): '+tokens.length+', tokens: '+tokens);
        }

        // trim whitespace
        // some parsers may not want the tokens trimmed so the individual parser has to do it if applicable
        for( i = 0; i < tokens.length; ++i) {
            tokens[i] = tokens[i].trim();
        }

        return {
            id : tokens[0].substr(1),
            talker_type_id: this.talker_type_id,
            talker_type_desc: this.talker_type_desc,
            time : tokens[1],
            latitude : Helper.parseLatitude(tokens[2], tokens[3]),
            longitude : Helper.parseLongitude(tokens[4], tokens[5]),
            fix : Helper.parseIntX(tokens[6], 10),
            satellites : Helper.parseIntX(tokens[7], 10),
            hdop : Helper.parseFloatX(tokens[8]),
            altitude : Helper.parseAltitude(tokens[9], tokens[10]),
            aboveGeoid : Helper.parseAltitude(tokens[11], tokens[12]),
            dgpsUpdate : tokens[13],
            dgpsReference : tokens[14]
        };
    };
};
},{"../Helper.js":2}],6:[function(require,module,exports){
var Helper = require("../Helper.js");

/** 

 === GLL - Geographic Position: Latitude, Longitude and time. ===

  ------------------------------------------------------------------------------
 *******1   2 3   4 5 6 7
 *******|   | |   | | | |
 $--GLL,x.x,N,x.x,W,A,A*hh<CR><LF>
 ------------------------------------------------------------------------------

 Field Number:

 1    = Latitude of fix
 2    = N or S
 3    = Longitude of fix
 4    = E or W
 5    = Status (A=data valid or V=data not valid)
 6    = Mode (A=Autonomous, D=DGPS, E=DR, Only present in NMEA version 3.00)
 7    = Checksum

 */

exports.Decoder = function(id) {
    this.id = id;
    this.talker_type_id = "GLL";
    this.talker_type_desc = "Geographic Latitude Longitude";

    this._status = function(char){
        switch(char){
            case "A" : return "data valid "
            case "V" : return "data not valid"
        }
    };

    this._mode = function(char){
        switch(char){
            case "A" : return "Autonomous"
            case "D" : return "DGPS"
            case "E" : return "DR";
        }
    };

    this.parse = function(tokens) {
        if(tokens.length < 8) {
            throw new Error('GLL : not enough tokens');
        }
        return {
            id : tokens[0].substr(1),
            talker_type_id: this.talker_type_id,
            talker_type_desc: this.talker_type_desc,
            latitude : Helper.parseLatitude(tokens[1], tokens[2]),
            longitude : Helper.parseLongitude(tokens[3], tokens[4]),
            utc_time : tokens[5],
            status : this._status(tokens[6]),
            mode : this._mode(tokens[7])
        };
    };
};
},{"../Helper.js":2}],7:[function(require,module,exports){
var Helper = require("../Helper.js");
//TODO: add docbloc
exports.Decoder = function(id) {
    this.id = id;
    this.talker_type_id = "GSA";
    this.talker_type_desc = "Global Navigation Satellite Systems, Dilution of Precision, and Active Satellites";

    this.parse = function(tokens) {
        var gsa;
        var i;
        if(tokens.length < 17) {
            throw new Error('GSA : not enough tokens');
        }

        // trim whitespace
        // some parsers may not want the tokens trimmed so the individual parser has to do it if applicable
        for(i=0;i<tokens.length;++i) {
            tokens[i] = tokens[i].trim();
        }


        gsa = {
            id : tokens[0].substr(1),
            talker_type_id: this.talker_type_id,
            talker_type_desc: this.talker_type_desc,
            mode: tokens[1],
            fix: tokens[2],
            sat :[],
            pdop: Helper.parseFloatX(tokens[15]),
            hdop: Helper.parseFloatX(tokens[16]),
            vdop: Helper.parseFloatX(tokens[17])
        };

       // extract up to 4 sets of sat data
        for(i=3;i<15;i+= 1) {
            if(tokens[i] !== '') {
                gsa.sat.push(tokens[i]);
            }
        }
        return gsa;
    };
};
},{"../Helper.js":2}],8:[function(require,module,exports){
var Helper = require("../Helper.js");
//TODO: docbloc
exports.Decoder = function(id) {
    this.id = id;
    this.talker_type_id = "GSV";
    this.talker_type_desc = "Global Satellites in View";
    this.parse = function(tokens) {
        var gsv;
        var i;
        var sat;
        if(tokens.length < 13) {
            throw new Error('GSV - not enough tokens (13): '+tokens.length+', tokens: '+tokens);
        }

        // trim whitespace
        // some parsers may not want the tokens trimmed so the individual parser has to do it if applicable
        for(i=0;i<tokens.length;++i) {
            tokens[i] = tokens[i].trim();
        }

        gsv = {
            id : tokens[0].substr(1),
            talker_type_id: this.talker_type_id,
            talker_type_desc: this.talker_type_desc,
            msgs: Helper.parseIntX(tokens[1],10),
            mnum: Helper.parseIntX(tokens[2],10),
            count: Helper.parseIntX(tokens[3],10),
            sat:[]
        };

        // extract up to 4 sets of sat data
        for(i=4;i<tokens.length;i+= 4) {
            sat = {
                prn: Helper.parseIntX(tokens[i+0],10),
                el:Helper.parseIntX(tokens[i+1],10),
                az:Helper.parseIntX(tokens[i+2],10),
                ss:Helper.parseIntX(tokens[i+3],10)
            };

            gsv.sat.push(sat);
        }
        return gsv;
    };
};
},{"../Helper.js":2}],9:[function(require,module,exports){
var Helper = require("../Helper.js");

/*
 === HDG - Heading, Deviation and Variation ===

 ------------------------------------------------------------------------------
 ******* 1   2  3 4   5  6  
 ******* |   |  | |   |  |  
 $--HDG,x.x,x.x,x,x*hh<CR><LF>
 ------------------------------------------------------------------------------

 Field Number:

1. Magnetic sensor heading, degrees, to the nearest 0.1 degree.
2. Magnetic deviation, degrees east or west, to the nearest 0.1 degree.
3. E if field 2 is degrees East W if field 2 is degrees West
4. Magnetic variation, degrees east or west, to the nearest 0.1 degree.
5. E if field 4 is degrees East W if field 4 is degrees West
6. Checksum

*/

exports.Decoder = function (id) {
    this.id = id;
    this.talker_type_id = "HDG";
    this.talker_type_desc = "Heading, Deviation and Variation";

    this.parse = function (tokens) {
        if (tokens.length < 6) {
            throw new Error('DBT : not enough tokens');
        }
        return {
            id: tokens[0].substr(1),
            talker_type_id: this.talker_type_id,
            talker_type_desc: this.talker_type_desc,
            heading: Helper.parseFloatX(tokens[1]),
            deviation: Helper.parseFloatX(tokens[2]),
            deviation_direction: tokens[3],
            variation: Helper.parseFloatX(tokens[4]),
            variation_direction: tokens[5]
        }
    };
};
},{"../Helper.js":2}],10:[function(require,module,exports){
var Helper = require("../Helper.js");

/*
 ------------------------------------------------------------------------------
 *******1   2 3   4 5
 *******|   | |   | |
 $--MWV,x.x,a,x.x,a,a*hh<CR><LF>
 ------------------------------------------------------------------------------

 Field Number:

 1. Wind Angle, 0 to 360 degrees
 2. Reference, R = Relative, T = True
 3. Wind Speed
 4. Wind Speed Units, K/M/N
 5. Status, A = Data Valid
 6. Checksum
 */

exports.Decoder = function (id) {
    this.id = id;
    this.talker_type_id = "MWV";
    this.talker_type_desc = "Wind Speed and Angle";
    this._unit = function(char){
          switch(char){
            case "N" : return "knots"
            case "M" : return "meters per second"
            case "K" : return "kilometers per hour"
        }
    };
    this._reference = function(char){
        switch(char){
            case "T" : return "true"
            case "R" : return "relative"
        }  
    };
    this._status = function(char){
        switch(char){
            case "A" : return "data valid"
            case "V" : return "data not valid"
        }
    };

    this.parse = function (tokens) {
        var i;
        if (tokens.length < 5) {
            throw new Error('MWV : not enough tokens');
        }

        // trim whitespace
        // some parsers may not want the tokens trimmed so the individual parser has to do it if applicable
        for (i = 0; i < tokens.length; ++i) {
            tokens[i] = tokens[i].trim();
        }

        return {
            id: tokens[0].substr(1),
            talker_type_id: this.talker_type_id,
            talker_type_desc: this.talker_type_desc,
            apparent_wind_angle: Helper.parseFloatX(tokens[1]),
            reference: this._reference(tokens[2]),
            apparent_wind_speed: Helper.parseFloatX(tokens[3]),
            units: this._unit(tokens[4]),
            status: this._status(tokens[5])
        }
    };
};

},{"../Helper.js":2}],11:[function(require,module,exports){
var Helper = require("../Helper.js");

/** RMC encoder object
 * $GPRMC,hhmmss.ss,A,llll.ll,a,yyyyy.yy,a,x.x,x.x,ddmmyy,x.x,a*hh

 RMC  = Recommended Minimum Specific GPS/TRANSIT Data 

 1    = UTC of position fix
 2    = Data status (V=navigation receiver warning)
 3    = Latitude of fix
 4    = N or S
 5    = Longitude of fix
 6    = E or W
 7    = Speed over ground in knots
 8    = Track made good in degrees True
 9    = UT date
 10   = Magnetic variation degrees (Easterly var. subtracts from true course)
 11   = E or W
 12   = Checksum

 input: {
     date:Date UTC
     status:String (single character)
     latitude:decimal degrees (N is +)
     longitude:decimal degrees (E is +)
     speed:decimal knots
     course:decimal degrees
     variation:decimal magnetic variation (E is -)
     }
 */
exports.Encoder = function(id) {
    this.id = id;
    this.encode = function(id, data) {
        var a = [];
        var rmc;
        // $GPRMC,hhmmss.ss,A,llll.ll,a,yyyyy.yy,a,x.x,x.x,ddmmyy,x.x,a*hh

        a.push('$' + id);
        a.push(Helper.encodeTime(data.date));
        a.push(Helper.encodeValue(data.status));
        a.push(Helper.encodeLatitude(data.lat, 3));
        a.push(Helper.encodeLongitude(data.lon, 3));
        a.push(Helper.encodeKnots(data.speed));
        a.push(Helper.encodeDegrees(data.course));
        a.push(Helper.encodeDate(data.date));
        a.push(Helper.encodeMagVar(data.variation));

        rmc = a.join();

//        rmc += data.mode

        return rmc;
    };
};

/** GPRMC parser object */
exports.Decoder = function(id) {
    this.id = id;
    this.talker_type_id = "RMC";
    this.talker_type_desc = "Recommended Minimum Navigation Information";
    this.parse = function(tokens) {
        if(tokens.length < 12) {
            throw new Error('RMC : not enough tokens');
        }
        return {
            id : tokens[0].substr(1),
            talker_type_id: this.talker_type_id,
            talker_type_desc: this.talker_type_desc,
            time : tokens[1],
            valid : tokens[2],
            latitude : Helper.parseLatitude(tokens[3], tokens[4]),
            longitude : Helper.parseLongitude(tokens[5], tokens[6]),
            sog : Helper.parseFloatX(tokens[7]),
            course : Helper.parseFloatX(tokens[8]),
            date : tokens[9],
            mode: tokens[11].substr(0,1),
            variation : Helper.parseDegrees(tokens[10], tokens[11])
        };
    };
};
},{"../Helper.js":2}],12:[function(require,module,exports){

var Helper = require("../Helper.js");

/*
 === VHW – Water Speed and Heading ===
The compass heading to which the vessel is currently pointing, and the speed of the vessel through the water.
 ------------------------------------------------------------------------------
 *******1   2   3 4 5   6   7
 *******|   |   | | |   |   |
 $--VHW,x.x,M,x.x,T,x.x,x.x*hh<CR><LF>
 ------------------------------------------------------------------------------

 Field Number:

 1. Heading degrees true
 2. M = magnetic, T = true
 3. Heading degrees magnetic 
 4. M = magnetic, T = true
 5. Speed, Knots
 6. Speed KMH
 7. checksum
 */

exports.Decoder = function (id) {
    this.id = id;
    this.talker_type_id = "VHW";
    this.talker_type_desc = "Water, Speed and Heading";
    this._reference = function(char){
        switch(char){
            case "T" : return "true"
            case "M" : return "magnetic"
        }  
    };

    this.parse = function (tokens) {
        if (tokens.length < 7) {
            throw new Error('VHW : not enough tokens');
        }

        return {
            id: tokens[0].substr(1),
            talker_type_id: this.talker_type_id,
            talker_type_desc: this.talker_type_desc,
            heading1: Helper.parseFloatX(tokens[1]),
            reference1:this._reference(tokens[2]),
            heading2: Helper.parseFloatX(tokens[3]),
            reference2:this._reference(tokens[4]),
            sow_knots: Helper.parseFloatX(tokens[5]),
            sow_kph: Helper.parseFloatX(tokens[6])
        }
    };
};

},{"../Helper.js":2}],13:[function(require,module,exports){
var Helper = require("../Helper.js");

exports.Decoder = function(id) {
    this.id = id;
    this.talker_type_id = "VTG";
    this.talker_type_desc = "Velocity Track Made Good";  
    this.parse = function(tokens) {


        var vtg;
        var i;
        if(tokens.length < 9) {
            throw new Error('VTG : not enough tokens');
        }

        // trim whitespace
        // some parsers may not want the tokens trimmed so the individual parser has to do it if applicable
        for(i=0;i<tokens.length;++i) {
            tokens[i] = tokens[i].trim();
        }

        return  {
            id : tokens[0].substr(1),
            talker_type_id: this.talker_type_id,
            talker_type_desc: this.talker_type_desc,
            course: Helper.parseFloatX(tokens[1]),
            knots: Helper.parseFloatX(tokens[5]),
            kph: Helper.parseFloatX(tokens[7]),
            mode: tokens[9]
        };
    };
};
},{"../Helper.js":2}]},{},[1]);
