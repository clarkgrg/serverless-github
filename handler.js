'use strict';
let github = require('octonode');
const config = require('./config');

// Is this a Pull Request?
function isAPullRequest(body) {
  return body && ('pull_request' in body);
}

// Does PR title refer to a github issue?
function hasAReference(body) {
  return body.pull_request.title.toLowerCase().startsWith('github issue');
}

// Return name of repository
function getRepoName(body) {
  if (body && body.repository && body.repository.full_name) {
    return body.repository.full_name;
  } else {
    return null;
  }
}

// Get SHA
function getSHA(body) {
  if (body && body.pull_request && body.pull_request.head && body.pull_request.head.sha) {
    return body.pull_request.head.sha;
  } else {
    return null;
  }
}

// Success return message
function success(message) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: message,
    }),    
  };
}

// Fail return message
function fail(message) {
  return {
    statusCode: 500,
    body: JSON.stringify({
      message: message,
    }),    
  };
}

module.exports.checker = async (event, context) => {
  let githubClient = github.client(config.github_token);

  const body = JSON.parse(event.body);

  // Lets display whats in the github event
  console.log(body);
  let status = {};

  // Is this event a pull request?
  if (isAPullRequest(body)) {
    const repoName = getRepoName(body);
    const sha = getSHA(body);
    const postURL = `/repos/${repoName}/statuses/${sha}`;

    // Does PR title have the right format?
    if (hasAReference(body)) {
      status = {
        state: 'success',
        description: 'PR Title includes issue',
        content: 'serverless-github/pr-title'        
      };
    } else {
      status = {
        state: 'failure',
        description: 'PR Title needs to reference issue',
        content: 'serverless-github/pr-title'        
      };
    }
    try {
      // Post our check status to github
      await githubClient.postAsync(postURL, status);
      return success(status.description);
    } catch (err) {
      console.log(err);
      return fail(err);
    }
  } else {
    return fail('Not a pull request');
  }
};
