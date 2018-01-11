var _ = require('lodash');
var moment = require('moment');
var request = require('request');

/**
  An Apigrate-specific logging tool for working with Slack Inbound webhooks. It is intended for
  standardizing success/failure reporting on app solutions.


    By convention, these colors are used for attachment content on error, warn, ok and
    question messages respectively.
    success=false: danger,
    success=true: good

    By convention, these emojis are used for consistency
    question messages respectively.
    success=false: 	:x:
    success=true: :white_check_mark:

  @param {string} inbound_webhook the inbound webhook to use.
  @param {string} hostname where the solution is hosted. If on a middleware platform, the name of that platform. If on an app server, the symbolic name of the
  server for ease of identification.
  @param {string} solution the solution (identifiable app name producing this log, required for reporting purposes.
  @param {object} options other options
  @example
  {
    solution_url: "https://www.example.com/myapp/readme",
    customer_id: 'abc12345', // The optional customer id. Generates an additional field for storing a customer identifier in cases where an app is used across multiple Apigrate customers/subscribers.
  }

  For the options parameter, there are two supported options:
  1. "solution_url" This is an optional string representing the solution URL link. Could be README documentation, for example for an app.
  2. "customer_id" This is optional customer id. It results in  an additional attachment field for storing a customer identifier in cases where an app (i.e. the solution)
  is used across multiple Apigrate customers/subscribers.

  @version 2.0.1

*/
function SlackLogger(inbound_webhook, hostname, solution, options) {
  if( _.isNil(inbound_webhook) || _.isNil(hostname) || _.isNil(solution) ){
    throw new Error("Misconfigured SlackLogger. The inbound_webhook, hostname, and solution parameters are all required.");
  }
  this.inbound_webhook = inbound_webhook;
  this.hostname = hostname;
  this.solution = solution;
  if (!options) {
    this.options = {};
  }
}

/**
  Log a summary message.

  @param {boolean} success required true/false
  @param {string} entity required type of the primary entity for the solution ("what kind of thing is being worked on")
  @param {string} entity_id required identifier for the primary entity.
  @param {string} summary required a short summary message (i.e. "synced ok", "error processing account", etc.)
  @param {string} details optional details to be displayed in fixed-width block under the message. Use this to output transcript info.
  Up to 7500 characters will be written, after which the data will be truncated.
*/
SlackLogger.prototype.log = function(success, entity, entity_id, summary, details) {
  var self = this;

  if( _.isNil(success) || _.isNil(entity) || _.isNil(entity_id) || _.isNil(summary) ){
    throw new Error("Invalid log invocation. The success, entity, entity_id, and summary parameters are all required.");
  }

  var color = "good";
  var emoji = ":white_check_mark:";
  if (success) {
    color = "good";
    emoji = ":white_check_mark:";
  } else {
    color = "danger";
    emoji = ":x:";
  }

  var title = emoji + ' ' + summary;

  var text = "";
  if (details) {
    if (details.length > 7500) {
      text = details.substr(0, 7500) + "...";
    } else {
      text = details;
    }
  }

  if (text && text.trim().length > 0) {
    text = "```" + text + "```";
  }

  var slack_message = {
    "username": self.hostname,
    "attachments": [
      {
        "color": color,
        "author_name": self.solution || "",
        "author_link": self.options.solution_url || "",
        "title": title,
        "text": text,
        "ts": moment().unix(),
        "mrkdwn_in": ["text"],
        "fields": [
          {
            "title": "solution",
            "value": self.solution,
            "short": true
          }, {
            "title": "success",
            "value": success
              ? "true"
              : "false",
            "short": true
          }, {
            "title": "entity",
            "value": entity,
            "short": true
          }, {
            "title": "entity id",
            "value": entity_id,
            "short": true
          }

        ]
      }
    ]
  };

  if(self.options.customer_id){
    var custField = {
      "title": "customer_id",
      "value": self.options.customer_id,
      "short": true
    };
    slack_message.attachments[0].fields.push(custField);
  }

  return request({
    method: "POST",
    url: self.inbound_webhook,
    json: true,
    body: slack_message
  }, function(err, resp, body) {
    if (err) {
      throw err;
    } else {
      if (body == 'ok') {
        return {success: true};
      } else {
        throw new Error("Error. Slack responded with: " + body);
      }
    }

  });
};

module.exports=SlackLogger;
