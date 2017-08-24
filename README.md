# apigrate-slack
A simple utility to post messages to Slack using inbound webhooks.

## Usage

Instantiating...
```
var slackutil = require('@apigrate/slack');

var webhook = 'https://hooks.slack.com/services/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'; //#slack-testing

/*
  Instantiate the Poster utility. Typically used for logging.
  You can specify defaults that are to be used for all attachments.
*/
var SLOGGER = new slackutil.Poster(webhook, {
  author_name: 'Built.io Flow: Proving Ground',
  author_link: 'https://flow.built.io/#/flows/fl319d688b7c0151730a4e8d/edit',
  fields:[
    {title:'Environment', value:'Built.io', short:true},
    {title:'Language', value:'NodeJS', short:true}
  ]
});
```

Post a message with multiple attachments.
```
SLOGGER.post('This is ok', [{
  color: "#30c030",
  text:'Some embedded inline code: `One line.` Nice.'
},{
  color: "#3030c0",
  text:'Here\'s yet *another* message in an attachment.'
}]);
```

Post an error message with a single attachment. Note you can use an object instead of a an array.
```
SLOGGER.post('Something bad happened.', {
  text:'Some embedded inline code: `One line.` Nice.'
});
```

### Formatting Conventions
By convention, these Stripe color codes are used for attachment content on error, warn, ok and question messages respectively. Providing your own color code overrides these defaults.
- error(): ```danger```,
- warn(): ```warning```,
- ok(): ```good```,
- question() and post(): (none)

By convention, these emojis are prepended to the main message used for consistency on error, warn, ok and question messages respectively.
- Error: 	☠️
- Warn: :warning:
- OK: :white_check_mark:
- Question: :question:
