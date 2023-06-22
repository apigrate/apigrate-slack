/*
  MIT License

  Copyright (c) 2018-2023 Apigrate LLC

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
*/
const fetch = require('node-fetch');

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

  @param {string} inbound_webhook the inbound webhook to use (you must configure this in Slack)
  @param {string} username the displayed username in the channel. Because the username groups together like messages on the channel, 
  a good convention is to set the username to:
  - the of the environment ("AWS test environment", "production environment")
  - or the symbolic name of the server
  @param {string} author name of the author. A good convention is to use the name of your app as the author.
  @param {object} options there are two supported options:
  1. "author_url" This is an optional string representing the author URL link. For example, a link to an app's README documentation.
  2. "fields" a hash of properties that will be added as short fields on every slack entry produced by this logger. Message-specific fields can be added 
  as part of the `.log()` method.
  @example
  {
    author_url: "https://www.example.com/myapp/readme",
    fields: {
      "account": "abc123",
      "apigrate_account": 107
    }
  }

  @version 4.0.1
*/
class SlackLogger{
  constructor(inbound_webhook, username, author, options){
    if( !inbound_webhook || !username || !author ){
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
    An async method to log a message to Slack.

    @param {boolean} success (required) whether the transaction succeeded or failed.
    @param {string} summary (required) a short summary message (i.e. "synced ok", "error processing account", etc.)
    @param {string} details (optional) details to be displayed in a fixed-width font block under the message. Use this to output transcript info.
    Up to 7500 characters will be written, after which the data will be truncated.
    @param {object} fields (optional) hash of properties that will be added as short fields on this particular slack entry. 
    These provided in addition to any existing global fields.
    @returns {boolean} indicating success or failure. Note Slack message failures (e.g. due to throttling) are handled and output to 
    console.error. They are **not** thrown as errors.
  */
  async log(success, summary, details, fields) {
    if( success === null || !summary ){
      console.error("Invalid SlackLogger log() invocation. The success and summary parameters are required.");
      return false;
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
      "username": this.username,
      "attachments": [
        {
          "color": color,
          "author_name": this.author || "",
          "author_link": this.options.author_url || "",
          "title": title,
          "text": text,
          "ts": new Date().getTime() / 1000,
          "mrkdwn_in": ["pretext","text"],
          "fields": [
            {
              "title": "author",
              "value": this.author,
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
    if(this.options && this.options.fields){
      for(let name in this.options.fields){
        let val = this.options.fields[name];
        slack_message.attachments[0].fields.push({
          title: name,
          value: val,
          short: true
        });
      }
    }

    //specific fields
    if(fields){
      for(let name in fields){
        let val = fields[name];
        slack_message.attachments[0].fields.push({
          title: name,
          value: val,
          short: true
        });
      }
    }

    if(this.options.customer_id){
      var custField = {
        "title": "customer id",
        "value": this.options.customer_id,
        "short": true
      };
      slack_message.attachments[0].fields.push(custField);
    }

    try{
      let response = await fetch(this.inbound_webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(slack_message)
      });
  
      if(response.ok){
        return true;
      } else {
        let result = await response.text();
        console.error(`Slack returned an error (HTTP-${response.status}): ${result}`);
        return false;
      }
    }catch(ex){
      console.error(`SlackLogger exception.`);
      console.error(ex);
      return false;
    }

  }
}

module.exports=SlackLogger;
