var Helper = require("../Helper.js");

/*
 -----------------------------------------------------------------------------
        1 2 3   4   5 6
        | | |   |   | |
 $--RPM,a,x,x.x,x.x,A*hh<CR><LF>
 -----------------------------------------------------------------------------

 Field Number:

 1. Sourse, S = Shaft, E = Engine
 2. Engine or shaft number
 3. Speed, Revolutions per minute
 4. Propeller pitch, % of maximum, "-" means astern
 5. Status, A means data is valid
 6. Checksum
*/

exports.Decoder = function (id) {
    this.id = id;
    this.talker_type_id = "RPM";
    this.talker_type_desc = "Revolutions per minute";
    this._source = function(char){
          switch(char){
            case "S" : return "shaft"
            case "E" : return "engine"
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
            throw new Error('RPM : not enough tokens');
        }

        // trim whitespace
        // some parsers may not want the tokens trimmed so the individual parser has to do it if applicable
        for (i = 0; i < tokens.length; ++i) {
            tokens[i] = tokens[i].trim();
        }

        console.log(tokens);

        return {
            id: tokens[0].substr(1),
            talker_type_id: this.talker_type_id,
            talker_type_desc: this.talker_type_desc,
            source: this._source(tokens[1]),
            source_number: Helper.parseIntX(tokens[2]),
            revolutions: Helper.parseFloatX(tokens[3]),
            propeller_pitch: (tokens[4] != "-") ? Helper.parseFloatX(tokens[4]) : null,
            status: this._status(tokens[5])
        }
    };
};