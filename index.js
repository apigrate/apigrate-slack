//v1.0.1
var _ = _rqr('lodash');
var moment = _rqr('moment');
var request = _rqr('request');
// -----------------------------------------------------------------------------
/* for nodejs + builtio */
function _rqr(lib){ return typeof $require != 'undefined' ? $require(lib) : require(lib); }
function _exp(constr){ if(typeof $export != 'undefined'){ $export(null, constr); } else { module.exports=constr; } }
// -----------------------------------------------------------------------------

/**
  A Convenience class for working with Slack Inbound webhooks. It is primarily intended for
  logging use. You can provide attachments on the methods or not. If you do, the timestamp
  will be generated automatically for you. You can also provide defaults for the attachments
  as options in the constructor. These defaults will only be used when others have not been provided.

  @param {string} endpoint the inbound webhook to use.
  @param {object} options other options that are defaults to be used on attachments
  @example showing the defaults
  {
    author_name: 'string',// The author name or source of the log, typically an app or a flow name
    author_link: 'string', // The author_name URL link. You might make this a flow URL for example
    author_icon: 'string', // URL to a icon for the author_name
    title: 'string',// The title
    title_link: 'string', // The url for the title
    fields: [], //Fields to add to each attachment
    measureTiming: false, // Log request timing to console?
    markdownAttachments: true //Whether to enable markdown in attachment text and pretext fields
  }

  By convention, these colors are used for attachment content on error, warn, ok and
  question messages respectively.
  error: danger,
  warn: warning,
  ok: good,
  question: (none)

  By convention, these emojis are used for consistency on error, warn, ok and
  question messages respectively.
  Error: 	:skull_and_crossbones:
  Warn: :warning:
  OK: :white_check_mark:
  Question: :question:
*/
function SlackPoster(endpoint, options){
  this.options = options;
  if(!options){
    this.options = {};
  }
  this.baseRequest = request.defaults({
    baseUrl: endpoint,
    headers:{
      'Accept': 'application/json'
    },
    time: this.options.measureTiming || false
  });
  if(!options.markdownAttachments){
    options.markdownAttachments=true;
  }
}

SlackPoster.prototype.error = function(message, attachment){
  var self = this;
  message = ':skull_and_crossbones:' + message;
  _setAttachment(attachment, 'color', 'danger');
  return self.post(message, attachment);
}
SlackPoster.prototype.warn = function(message, attachment){
  var self = this;
  message = ':warning:' + message;
  _setAttachment(attachment, 'color', 'warning');
  return self.post(message, attachment);
}
SlackPoster.prototype.ok = function(message, attachment){
  var self = this;
  message = ':white_check_mark:' + message;
  _setAttachment(attachment, 'color', 'good');
  return self.post(message, attachment);
}
SlackPoster.prototype.question = function(message, attachment){
  var self = this;
  message = ':question:' + message;
  return self.post(message, attachment);
}
SlackPoster.prototype._setDefaults = function(attachment){
  var self = this;
  if(!_.isNil(attachment)){


    if(!_.isNil(self.options.author_name)){
      _setAttachment(attachment, 'author_name', self.options.author_name);
    }
    if(!_.isNil(self.options.author_link)){
      _setAttachment(attachment, 'author_link', self.options.author_link);
    }
    if(!_.isNil(self.options.author_icon)){
      _setAttachment(attachment, 'author_icon', self.options.author_icon);
    }
    if(!_.isNil(self.options.title)){
      _setAttachment(attachment, 'title', self.options.title);
    }
    if(!_.isNil(self.options.title_link)){
      _setAttachment(attachment, 'title_link', self.options.title_link);
    }

    if(_.isArray(attachment)){
      if(!_.isNil(self.options.fields)){
        _.each(attachment, function(a){
          a.fields = _.concat(a.fields, self.options.fields);
          if(self.options.markdownAttachments){
            a.mrkdwn_in=["text","pretext"];
          }
        });
      }
    } else {
      if(!_.isNil(self.options.fields)){
        attachment.fields = _.concat(attachment.fields, self.options.fields);
      }
      if(self.options.markdownAttachments){
        attachment.mrkdwn_in=["text","pretext"];
      }
    }

  }
}
function _setAttachment(attachment, attribute, value){
  if(!_.isNil(attachment)){
    if(_.isArray(attachment)){
      _.each(attachment, function(a){
        var existing = a[attribute];
        if(_.isNil(existing)||existing===''){
          a[attribute] = value;
        }
      });
    } else {
      var existing = attachment[attribute];
      if(_.isNil(existing)||existing===''){
        attachment[attribute] = value;
      }
    }
  }

}

/**
  @param {string} message the main message
  @param {object|array} attachment a single attachment object (see Slack documentation)
  or an array of attachments.
*/
SlackPoster.prototype.post = function(message, attachment){
  var self = this;
  var payload = {
    "text": message
  }
  if(!_.isNil(attachment)){
    self._setDefaults(attachment);
    //attach timestamp
    var timestamp = moment().format('X');
    _setAttachment(attachment, 'ts', timestamp);
    if(_.isArray(attachment)){
      payload.attachments = attachment;
    } else {
      payload.attachments = [ attachment ];
    }
  }


  self.baseRequest.post({uri:'', body: payload, json: true}, function(err, resp, body){

    if(self.options.measureTiming){
      if(resp.timingPhases){
        resp.timingPhases.timingStart = resp.timingStart;
        console.log( " TIMING "+ resp.timingStart +" (GET "+objectName+" BY ID): " + JSON.stringify(resp.timingPhases) );
      } else if (resp.elapsedTime) {
        console.log( " TIMING (GET "+objectName+" BY ID): " + resp.elapsedTime + ' elapsed.');
      }
    }

    if(err){
      console.error(err.message);
    }

    console.log(body);

  });


}


_exp(SlackPoster);
