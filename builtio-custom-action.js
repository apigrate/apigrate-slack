//Version 2.0.1
const moment = require('moment');
const request = require('request');

module.exports = function() {

  this.id = "apigrate-slack-logger";

  this.label = "Log to Slack";

  this.help = "Posts a log message to a Slack channel. Please note that you must configure an inbound-webhook prior to using this action.";

  this.input = {
    "title": "Parameters",
    "type": "object",
    "properties": {
      "inbound_webhook": {
        "title": "Slack Inbound Webhook",
        "type": "string",
        "description": "The slack inbound webhook to use.",
        "minLength": 1
      },
      "solution": {
        "title": "Flow",
        "type": "string",
        "description": "The name of the flow triggering the log message.",
        "minLength": 1
      },
      "solution_url": {
        "title": "Flow URL",
        "type": "string",
        "description": "(optional) The URL to the flow in Built.io (not the webhook url)."
      },
      "success": {
        "title": "Success", // displayed as field label
        "type": "boolean",
        "description": "Indicates whether the log will register success or not. Either true or false.", // description of field
        "minLength": 1 // define as required
      },
      "entity": {
        "title": "Entity",
        "type": "string",
        "description": "The type of entity related to this log message.",
        "minLength": 1
      },
      "entity_id": {
        "title": "Entity ID",
        "type": "string",
        "description": "The identifier for the entity related to this log message.",
        "minLength": 1
      },
      "summary": {
        "title": "Summary",
        "type": "string",
        "description": "A short summary of the log message.",
        "minLength": 1
      },
      "details": {
        "title": "Details",
        "type": "string",
        "description": "(optional) The detailed contents of the log message, if any."
      }
    }
  };

  this.output = {
    "title": "output",
    "type": "object",
    "properties": {
        "success": {
            "title": "success",
            "type": "boolean",
            "description": "Whether the log was written. Note that this action will attempt to handle all errors; in other words, if logging fails for some reason, it should not cause the flow to fail."
        },
        "error": {
            "title": "error",
            "type": "string",
            "description": "An error message returned, if any."
        }
    }
  };

  this.execute = function(input, output) {
    var color = "good";
    var emoji = ":white_check_mark:";
    if(input.success){
        color = "good";
        emoji = ":white_check_mark:";
    } else {
        color = "danger";
        emoji = ":x:";
    }

    var title = emoji + ' ' + input.summary;

    var text = "";
    if(input.details){
        if(input.details.length > 7500){
            text = input.details.substr(0,7500) + "...";
        } else {
            text = input.details;
        }
    }

    if(text && text.trim().length>0){
        text = "```"+text+"```";
    }

    var slack_message = {
        "username": "Built.io",
        "attachments": [
            {
                "color": color,
                "author_name": input.solution || "",
                "author_link": input.solution_url || "",
                "title": title,
                "text": text,
                "ts": moment().unix(),
                "mrkdwn_in": ["text"],
                "fields": [
                    {
                        "title": "solution",
                        "value": input.solution,
                        "short": true
                    },
                    {
                        "title": "success",
                        "value": input.success ? "true" : "false",
                        "short": true
                    },
                    {
                        "title": "entity",
                        "value": input.entity,
                        "short": true
                    },
                    {
                        "title": "entity id",
                        "value": input.entity_id,
                        "short": true
                    }

                ]
            }
        ]
    };

    return request({
        method: "POST",
        url: input.inbound_webhook,
        json: true,
        body: slack_message
    },
    function(err, resp, body){
        if(err){
             return output(null, {success: false, error: "Unhandled error: " + JSON.stringify(err)});
        } else {
            if(body == 'ok'){
                return output(null, {success: true});
            } else {
                return output(null, {success: false, error: "Slack responded with: " + body});
            }
        }

    });
  };

};
