# apigrate-slack
A simple utility to post messages to Slack using inbound webhooks.

## Usage

Instantiating...
```
var webhook = 'https://hooks.slack.com/services/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';

var SLOGGER = new SlackLogger(webhook,
  "localhost",
  "SlackLogger Test"
);
```
In the above example, the app name  for each slack entry will be 'localhost' and the username will be "SlackLogger Test".  

Each log message must have the following parameters:

1. true/false indicating success or failure
1. the name of the primary entity involved in the transaction
1. the id of the primary entity involved in the transaction
1. the log message
1. a more detailed message (optional). This could be log details, stack trace or other detailed information for the message (typically more useful to provide troubleshooting info on errors).

### Examples
Here's how to post a "success" message.
```
//parms: success, entity name, entity id, message, detailed message
SLOGGER.log(
  true,
  'Account',
  4,
  'Success! Everything is OK.',
  null
);
```

Here's how to post an error message with some detailed logging information.
```
SLOGGER.log(
  false,
  'Account',
  4,
  'Error processing Account.',
  'Unable to connect to the database. There may be a network problem. Please contact your network administrator.'
);

```
...Note that the the logging details will be formatted in a markdown "code block" automatically for readability. You do not need to add these backticks yourself.
