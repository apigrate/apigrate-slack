var _ = require('lodash');
var moment = require('moment');
var request = require('request-promise-native');

/**
  A logging tool for working with Slack Inbound webhooks. It is intended for logging
  application automation transactions in Slack, providing transparency about how
  automation solutions are performing.

    By convention, these colors are used for attachment content on error, warn, ok and
    question messages respectively.
    success=false: danger,
    success=true: good

    By convention, these emojis are used for consistency
    question messages respectively.
    success=false: 	:x:
    success=true: :white_check_mark:

  @param {string} inbound_webhook the inbound webhook to use.
  @param {string} username where the author is hosted. If on a middleware platform, the name of that platform. If on an app server, the symbolic name of the
  server for ease of identification.
  @param {string} author name of the author (identifiable app name producing this log, required for reporting purposes.
  @param {object} there are two supported options:
  1. "author_url" This is an optional string representing the author URL link. Could be README documentation, for example for an app.
  2. "fields" a hash of properties that will be added as short fields on every slack entry produced by this logger.
  @example
  {
    author_url: "https://www.example.com/myapp/readme",
    fields: {
      "account": "abc123",
      "apigrate_account": 107
    }
  }

  @version 3.0.0

*/
class SlackLogger{
  constructor(inbound_webhook, username, author, options){
    if( _.isNil(inbound_webhook) || _.isNil(username) || _.isNil(author) ){
      throw new Error("Misconfigured Slack Logger. The inbound_webhook, username, and author parameters are all required.");
    }
    this.inbound_webhook = inbound_webhook;
    this.username = username;
    this.author = author;
    this.options = options;
    if (!options) {
      this.options = {};
    }
  }

  /**
    Log a slack logging message.

    @param {boolean} success required true/false
    @param {string} summary required a short summary message (i.e. "synced ok", "error processing account", etc.)
    @param {string} details optional details to be displayed in fixed-width block under the message. Use this to output transcript info.
    Up to 7500 characters will be written, after which the data will be truncated.
    @param {object} an noptional hash of properties that will be added as short fields on this particular slack entry.
  */
  log(success, summary, details, fields) {
    var self = this;

    if( _.isNil(success) || _.isNil(summary) ){
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
      "username": self.username,
      "attachments": [
        {
          "color": color,
          "author_name": self.author || "",
          "author_link": self.options.author_url || "",
          "title": title,
          "text": text,
          "ts": moment().unix(),
          "mrkdwn_in": ["pretext","text"],
          "fields": [
            {
              "title": "author",
              "value": self.author,
              "short": true
            }, {
              "title": "success",
              "value": success
                ? "true"
                : "false",
              "short": true
            }

          ]
        }
      ]
    };

    //global fields
    if(self.options && self.options.fields){
      _.each(self.options.fields, function(val, name){
        slack_message.attachments[0].fields.push({
          title: name,
          value: val,
          short: true
        });
      })
    }

    //specific fields
    if(fields){
      _.each(fields, function(val, name){
        slack_message.attachments[0].fields.push({
          title: name,
          value: val,
          short: true
        });
      })
    }

    if(self.options.customer_id){
      var custField = {
        "title": "customer id",
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
    })
    .then(function(result){
      return Promise.resolve( {success: true} );
    })
    .catch(function(err){
    	return Promise.reject( new Error(`Error. Slack responded with:\n${body}`) );
    });
  }
}

module.exports=SlackLogger;
